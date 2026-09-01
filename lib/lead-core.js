'use strict';

const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 4;
const DEDUPE_WINDOW_MS = 10 * 60 * 1000;
const MAX_DETAILS_CHARS = 500;

const dedupeCache = new Map();
const rateLimitCache = new Map();

function resetCaches() {
  dedupeCache.clear();
  rateLimitCache.clear();
}

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

function readRequestBody(req) {
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

function sameLeadSignature(left, right) {
  return (
    left.service === right.service &&
    left.firstName === right.firstName &&
    left.lastName === right.lastName &&
    left.phone === right.phone
  );
}

function isDuplicate(key, payload) {
  const now = Date.now();
  const previous = dedupeCache.get(key);

  if (previous && (now - previous.at) <= DEDUPE_WINDOW_MS) {
    return sameLeadSignature(previous, payload);
  }

  return false;
}

function rememberLead(key, payload, at = Date.now()) {
  dedupeCache.set(key, { ...payload, at });
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

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

function dedupeKeyFor(payload, clientId) {
  return `${payload.email || 'noemail'}|${payload.phone || 'nophone'}|${clientId}`;
}

module.exports = {
  RATE_WINDOW_MS,
  RATE_LIMIT_MAX,
  DEDUPE_WINDOW_MS,
  MAX_DETAILS_CHARS,
  resetCaches,
  jsonResponse,
  getClientIp,
  sanitizeText,
  normalizeEmail,
  normalizePhone,
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
};
