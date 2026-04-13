const dedupeCache = new Map();
const rateLimitCache = new Map();

const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 4;
const DEDUPE_WINDOW_MS = 10 * 60 * 1000;
const MAX_DETAILS_CHARS = 500;

function jsonResponse(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.end(payload);
}

function getClientIp(req) {
  const forwardHeader = req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
  if (typeof forwardHeader === 'string') {
    return forwardHeader.split(',')[0].trim();
  }
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : 'unknown';
}

function sanitizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeEmail(value) {
  return sanitizeText(value).toLowerCase();
}

function normalizePhone(value) {
  return sanitizeText(value).replace(/\D/g, '');
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
      if (body.length > 256000) {
        reject(new Error('Body too large.'));
      }
    });

    req.on('end', () => {
      resolve(body || '');
    });

    req.on('error', (error) => {
      reject(error);
    });
  });
}

function safeJsonParse(rawBody) {
  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch (_error) {
    return null;
  }
}

function isRateLimited(identifier) {
  const now = Date.now();
  const entry = rateLimitCache.get(identifier) || { start: now, count: 0 };
  const elapsed = now - entry.start;

  if (elapsed > RATE_WINDOW_MS) {
    entry.start = now;
    entry.count = 0;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    rateLimitCache.set(identifier, entry);
    return true;
  }

  entry.count += 1;
  rateLimitCache.set(identifier, entry);
  return false;
}

function isDuplicate(key, payload) {
  const now = Date.now();
  const previous = dedupeCache.get(key);

  if (previous && (now - previous.at) <= DEDUPE_WINDOW_MS) {
    if (
      previous.service === payload.service &&
      previous.firstName === payload.firstName &&
      previous.lastName === payload.lastName &&
      previous.phone === payload.phone
    ) {
      return true;
    }
  }

  dedupeCache.set(key, { ...payload, at: now });
  return false;
}

function cleanupCaches(now = Date.now()) {
  for (const [key, value] of dedupeCache.entries()) {
    if (now - value.at > DEDUPE_WINDOW_MS) {
      dedupeCache.delete(key);
    }
  }

  for (const [key, value] of rateLimitCache.entries()) {
    if (now - value.start > RATE_WINDOW_MS) {
      rateLimitCache.delete(key);
    }
  }
}

function validateLead(payload) {
  const errors = [];
  if (!payload.firstName) errors.push('firstName is required.');
  if (!payload.lastName) errors.push('lastName is required.');
  if (!payload.email) errors.push('email is required.');
  if (!payload.service) errors.push('service is required.');

  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.push('Invalid email.');
  }

  if (payload.phone && payload.phone.length && payload.phone.length < 10) {
    errors.push('phone must be at least 10 digits.');
  }

  if (payload.details && payload.details.length > MAX_DETAILS_CHARS) {
    errors.push(`Project details must be ${MAX_DETAILS_CHARS} characters or fewer.`);
  }

  return errors;
}

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

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: `New Flooring Hub Lead: ${payload.service || 'General Inquiry'}`,
      html: `<p><strong>Name:</strong> ${payload.firstName} ${payload.lastName}</p><p><strong>Email:</strong> ${payload.email}</p><p><strong>Phone:</strong> ${payload.phone || 'N/A'}</p><p><strong>Service:</strong> ${payload.service || 'N/A'}</p><p><strong>Project details:</strong> ${payload.details || 'N/A'}</p><p><strong>UTM:</strong> ${JSON.stringify(payload.utm)}</p>`
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

function createLeadPayload(body, req) {
  const firstName = sanitizeText(body.firstName);
  const lastName = sanitizeText(body.lastName);
  const email = normalizeEmail(body.email);
  const phone = normalizePhone(body.phone);
  const details = sanitizeText(body.details);
  const service = sanitizeText(body.service);
  const utm = {
    source: sanitizeText(body.utm_source),
    medium: sanitizeText(body.utm_medium),
    campaign: sanitizeText(body.utm_campaign),
    content: sanitizeText(body.utm_content),
    term: sanitizeText(body.utm_term),
    page: sanitizeText(body.leadPage),
    button: sanitizeText(body.leadButton)
  };

  return {
    firstName,
    lastName,
    email,
    phone,
    details,
    service,
    utm,
    meta: {
      source: sanitizeText(body.leadSource) || 'website',
      clientIp: getClientIp(req),
      referrer: sanitizeText(req.headers.referer || ''),
      userAgent: sanitizeText(req.headers['user-agent'] || ''),
      submittedAt: new Date().toISOString(),
      page: sanitizeText(req.headers['x-forwarded-host'] || req.headers.host || '')
    }
  };
}

function clearHoneypot(body) {
  return sanitizeText(body.hp || body.leadHoneypot || '') === '';
}

module.exports = async (req, res) => {
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
    const rawBody = await parseJsonBody(req);
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

    const dedupeKey = `${payload.email || 'noemail'}|${payload.phone || 'nophone'}|${clientId}`;
    if (isDuplicate(dedupeKey, payload)) {
      return jsonResponse(res, 200, {
        ok: true,
        duplicate: true,
        message: 'A similar lead was submitted recently. Tom will follow up shortly.'
      });
    }

    const normalizedPayload = {
      ...payload,
      id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    };

    try {
      const integration = await deliverLead(normalizedPayload);

      return jsonResponse(res, 200, {
        ok: true,
        id: normalizedPayload.id,
        duplicate: false,
        message: 'Thanks! Your request was received. Tom will contact you soon.',
        integration
      });
    } catch (integrationError) {
      const isActivationError = integrationError.code === 'FORMSUBMIT_ACTIVATION_REQUIRED';
      const isConfigError = integrationError.message === 'Lead forwarding is not configured.';
      return jsonResponse(res, isActivationError || isConfigError ? 503 : 502, {
        ok: false,
        message: isActivationError
          ? 'Lead email delivery is waiting on a one-time activation email. Please call Tom directly until that is completed.'
          : isConfigError
            ? 'Lead delivery is not configured yet. Please call Tom directly for now.'
            : 'Lead forwarding is currently unavailable. Please call to confirm.',
        leadId: normalizedPayload.id
      });
    }
  } catch (error) {
    return jsonResponse(res, 500, {
      ok: false,
      message: error && error.message ? error.message : 'Server error while handling lead.'
    });
  }
};
