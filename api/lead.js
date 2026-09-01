const {
  jsonResponse,
  getClientIp,
  readRequestBody,
  safeJsonParse,
  isRateLimited,
  isDuplicate,
  rememberLead,
  cleanupCaches,
  validateLead,
  escapeHtml,
  createLeadPayload,
  clearHoneypot,
  dedupeKeyFor
} = require('../lib/lead-core');
const {
  publicLeadSuccess,
  publicLeadFailure,
  classifyDeliveryError,
  deliveryStatusCode
} = require('../lib/lead-public-response');

async function postToWebhook(payload) {
  const webhookUrl = process.env.LEAD_WEBHOOK_URL || process.env.JOBBER_WEBHOOK_URL;
  if (!webhookUrl) return { skipped: true };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  const responseBody = responseText ? (() => {
    try {
      return JSON.parse(responseText);
    } catch (_err) {
      return { message: responseText };
    }
  })() : {};

  if (!response.ok) {
    throw new Error(responseBody.message || `Webhook request failed: ${response.status}`);
  }

  return { ok: true, response: responseBody };
}

async function sendFallbackEmail(payload) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.LEAD_FROM_EMAIL || process.env.RESEND_FROM_EMAIL;
  const toEmail = process.env.LEAD_TO_EMAIL || process.env.ADMIN_EMAIL;

  if (!apiKey || !fromEmail || !toEmail) {
    return { skipped: true };
  }

  const safeFirstName = escapeHtml(payload.firstName);
  const safeLastName = escapeHtml(payload.lastName);
  const safeEmail = escapeHtml(payload.email);
  const safePhone = escapeHtml(payload.phone || 'N/A');
  const safeService = escapeHtml(payload.service || 'N/A');
  const safeDetails = escapeHtml(payload.details || 'N/A');
  const safeUtm = escapeHtml(JSON.stringify(payload.utm || {}));
  const subjectService = payload.service ? String(payload.service).replace(/[\r\n]+/g, ' ').slice(0, 120) : 'General Inquiry';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: `New Flooring Hub Lead: ${subjectService}`,
      html: `<p><strong>Name:</strong> ${safeFirstName} ${safeLastName}</p><p><strong>Email:</strong> ${safeEmail}</p><p><strong>Phone:</strong> ${safePhone}</p><p><strong>Service:</strong> ${safeService}</p><p><strong>Project details:</strong> ${safeDetails}</p><p><strong>UTM:</strong> ${safeUtm}</p>`
    })
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(responseText || 'Resend request failed.');
  }

  return { ok: true };
}

async function postToFormSubmit(payload) {
  const toEmail = process.env.LEAD_TO_EMAIL || process.env.ADMIN_EMAIL || 'tsmith@flooringhubnc.com';
  const endpoint = process.env.FORMSUBMIT_ENDPOINT || `https://formsubmit.co/ajax/${encodeURIComponent(toEmail)}`;
  const formBody = new URLSearchParams({
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    phone: payload.phone || '',
    service: payload.service || '',
    details: payload.details || '',
    leadId: payload.id || '',
    utm_source: payload.utm?.source || '',
    utm_medium: payload.utm?.medium || '',
    utm_campaign: payload.utm?.campaign || '',
    utm_content: payload.utm?.content || '',
    utm_term: payload.utm?.term || '',
    lead_page: payload.utm?.page || '',
    lead_button: payload.utm?.button || '',
    source: payload.meta?.source || 'website',
    submittedAt: payload.meta?.submittedAt || '',
    _subject: `New Flooring Hub Lead: ${payload.service || 'General Inquiry'}`,
    _template: 'table',
    _captcha: 'false',
    _replyto: payload.email
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://www.flooringhubnc.com',
      Referer: 'https://www.flooringhubnc.com/',
      'User-Agent': 'Mozilla/5.0 (compatible; FlooringHubLeadBot/1.0; +https://www.flooringhubnc.com)'
    },
    body: formBody.toString()
  });

  const responseText = await response.text();
  let responseBody = {};

  if (responseText) {
    try {
      responseBody = JSON.parse(responseText);
    } catch (_error) {
      responseBody = { message: responseText };
    }
  }

  if (!response.ok) {
    throw new Error(responseBody.message || `FormSubmit request failed: ${response.status}`);
  }

  if (String(responseBody.success).toLowerCase() !== 'true') {
    const message = responseBody.message || 'FormSubmit rejected the lead.';
    if (/activation/i.test(message)) {
      const activationError = new Error('Lead email delivery needs one-time activation.');
      activationError.code = 'FORMSUBMIT_ACTIVATION_REQUIRED';
      throw activationError;
    }

    throw new Error(message);
  }

  return { ok: true, response: responseBody };
}

async function deliverLead(payload) {
  let webhookError = null;

  try {
    const webhookResult = await postToWebhook(payload);
    if (!webhookResult.skipped) {
      return {
        ok: true,
        name: 'webhook',
        response: webhookResult.response || null
      };
    }
  } catch (error) {
    webhookError = error;
  }

  const emailResult = await sendFallbackEmail(payload);
  if (!emailResult.skipped) {
    return {
      ok: true,
      name: 'resend',
      fallback: webhookError ? 'webhook_failed' : 'webhook_unconfigured'
    };
  }

  const formSubmitResult = await postToFormSubmit(payload);
  if (!formSubmitResult.skipped) {
    return {
      ok: true,
      name: 'formsubmit',
      fallback: webhookError ? 'webhook_failed' : 'webhook_unconfigured',
      response: formSubmitResult.response || null
    };
  }

  if (webhookError) {
    throw webhookError;
  }

  throw new Error('Lead forwarding is not configured.');
}

async function handler(req, res) {
  cleanupCaches();

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return jsonResponse(res, 200, { ok: true });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return jsonResponse(res, 405, { ok: false, message: 'Method not allowed.' });
  }

  try {
    const rawBody = await readRequestBody(req);
    const body = safeJsonParse(rawBody);
    if (body === null) {
      return jsonResponse(res, 400, { ok: false, message: 'Invalid JSON body.' });
    }

    const payload = createLeadPayload(body, req);
    const clientId = getClientIp(req);

    if (!clearHoneypot(body)) {
      return jsonResponse(res, 400, { ok: false, message: 'Submission blocked.' });
    }

    const errors = validateLead(payload);
    if (errors.length > 0) {
      return jsonResponse(res, 400, { ok: false, errors, message: 'Please fix the highlighted fields and try again.' });
    }

    if (isRateLimited(clientId)) {
      return jsonResponse(res, 429, { ok: false, message: 'Too many submissions. Please wait a minute before trying again.' });
    }

    const dedupeKey = dedupeKeyFor(payload, clientId);
    if (isDuplicate(dedupeKey, payload)) {
      return jsonResponse(res, 200, publicLeadSuccess('duplicate'));
    }

    const normalizedPayload = {
      ...payload,
      id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    };

    try {
      await deliverLead(normalizedPayload);
      rememberLead(dedupeKey, payload);
      return jsonResponse(res, 200, publicLeadSuccess('ok'));
    } catch (integrationError) {
      const kind = classifyDeliveryError(integrationError);
      return jsonResponse(res, deliveryStatusCode(kind), publicLeadFailure(kind));
    }
  } catch (_error) {
    return jsonResponse(res, 500, publicLeadFailure('server'));
  }
}

module.exports = handler;
module.exports.deliverLead = deliverLead;
