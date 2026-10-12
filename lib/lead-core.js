'use strict';

const crypto = require('crypto');

const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 4;
const DEDUPE_WINDOW_MS = 10 * 60 * 1000;
const MAX_DETAILS_CHARS = 500;

// In-memory state is only the fallback for local dev, tests, or a KV outage.
// With Upstash/Vercel KV configured, both windows hold across serverless
// instances and cold starts.
const dedupeCache = new Map();
const rateLimitCache = new Map();

const RATE_KEY_PREFIX = 'lead:rate:';
const DEDUPE_KEY_PREFIX = 'lead:dedupe:';

// INCR and set the window's expiry in one atomic step, so a crash between the
// two can never leave a counter that never expires.
const RATE_LIMIT_SCRIPT =
  "local c = redis.call('INCR', KEYS[1]) " +
  "if c == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end " +
  'return c';

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

function kvConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

async function kvCommand(config, command) {
  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.token}`
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) {
    throw new Error(`KV ${response.status}`);
  }

  const data = await response.json();
  if (data && data.error) {
    throw new Error(`KV error: ${data.error}`);
  }
  return data ? data.result : null;
}

// Store hashes, not contact details, so the KV store never holds lead PII.
function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function leadSignature(payload) {
  return sha256([payload.service, payload.firstName, payload.lastName, payload.phone].join('|'));
}

function warnKvFallback(action, error) {
  console.warn(`[lead-core] KV ${action} failed; using in-memory fallback: ${error && error.message}`);
}

function isRateLimitedInMemory(identifier) {
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

async function isRateLimited(identifier) {
  const config = kvConfig();
  if (config) {
    try {
      const count = await kvCommand(config, [
        'EVAL',
        RATE_LIMIT_SCRIPT,
        '1',
        `${RATE_KEY_PREFIX}${sha256(identifier)}`,
        String(RATE_WINDOW_MS)
      ]);
      return Number(count) > RATE_LIMIT_MAX;
    } catch (error) {
      warnKvFallback('rate limit', error);
    }
  }
  return isRateLimitedInMemory(identifier);
}

function sameLeadSignature(left, right) {
  return (
    left.service === right.service &&
    left.firstName === right.firstName &&
    left.lastName === right.lastName &&
    left.phone === right.phone
  );
}

function isDuplicateInMemory(key, payload) {
  const now = Date.now();
  const previous = dedupeCache.get(key);

  if (previous && (now - previous.at) <= DEDUPE_WINDOW_MS) {
    return sameLeadSignature(previous, payload);
  }

  return false;
}

async function isDuplicate(key, payload) {
  const config = kvConfig();
  if (config) {
    try {
      const stored = await kvCommand(config, ['GET', `${DEDUPE_KEY_PREFIX}${sha256(key)}`]);
      return stored === leadSignature(payload);
    } catch (error) {
      warnKvFallback('dedupe lookup', error);
    }
  }
  return isDuplicateInMemory(key, payload);
}

// Called only after delivery succeeds, so a failed send stays retryable.
async function rememberLead(key, payload, at = Date.now()) {
  const config = kvConfig();
  if (config) {
    try {
      await kvCommand(config, [
        'SET',
        `${DEDUPE_KEY_PREFIX}${sha256(key)}`,
        leadSignature(payload),
        'PX',
        String(DEDUPE_WINDOW_MS)
      ]);
      return;
    } catch (error) {
      warnKvFallback('dedupe save', error);
    }
  }
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
