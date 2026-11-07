// Client Care form spam defense (Option A): per-IP rate limit + Cloudflare
// Turnstile server verification (fails closed). Underscore keeps it out of routing.
const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TURNSTILE_ACTION = 'contact';
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
// In-process only: resets on cold start, per instance. Blunts bursts.
const hits = new Map();

function clientIp(req) {
  const h = req.headers || {};
  const fwd = String(h['x-forwarded-for'] || '').split(',')[0].trim();
  return fwd || String(h['x-real-ip'] || '') || 'unknown';
}

function isRateLimited(ip, now = Date.now()) {
  for (const [key, stamps] of hits) {
    if (stamps.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) hits.delete(key);
  }
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

async function verifyTurnstile(secret, token, ip, productionHosts) {
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip !== 'unknown') body.set('remoteip', ip);
  let result;
  try {
    const r = await fetch(SITEVERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return false;
    result = await r.json();
  } catch (err) {
    console.error('[contact] turnstile siteverify failed', err);
    return false;
  }
  if (result.success !== true) return false;
  if (result.action && result.action !== TURNSTILE_ACTION) return false;
  if (process.env.VERCEL_ENV === 'production') {
    const allowed = [...productionHosts, process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL].filter(Boolean);
    return Boolean(result.hostname && allowed.includes(result.hostname));
  }
  return true;
}

/** Returns { status, error } to reject with, or null to proceed. */
async function checkSpam(req, body, productionHosts, opts = {}) {
  const ip = clientIp(req);
  if (opts.rateLimit !== false && isRateLimited(ip)) return { status: 429, error: 'rate_limited' };
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return null; // keys not configured yet: honeypot + rate limit only
  const ok = await verifyTurnstile(secret, String(body['cf-turnstile-response'] || ''), ip, productionHosts);
  return ok ? null : { status: 403, error: 'verification_failed' };
}

function siteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || process.env.TURNSTILE_SITE_KEY || '';
}

module.exports = { checkSpam, siteKey, TURNSTILE_ACTION };
