/**
 * HMAC-signed state tokens for the Jobber OAuth flow.
 *
 * The state param prevents CSRF: we sign a timestamp, Jobber echoes it back
 * via the callback, and we verify the signature + freshness before trusting
 * the authorization code. 10-minute expiry is plenty for a manual click flow.
 */

const crypto = require('crypto');

const STATE_TTL_MS = 10 * 60 * 1000;

function getSecret() {
  const secret = process.env.JOBBER_STATE_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JOBBER_STATE_SECRET env var is missing or too short (min 16 chars).');
  }
  return secret;
}

function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64url(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function createState() {
  const payload = base64url(JSON.stringify({ t: Date.now() }));
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest();
  return `${payload}.${base64url(sig)}`;
}

function verifyState(stateParam) {
  if (typeof stateParam !== 'string' || !stateParam.includes('.')) {
    return { valid: false, reason: 'malformed' };
  }

  const [payload, signature] = stateParam.split('.', 2);
  const expectedSig = base64url(
    crypto.createHmac('sha256', getSecret()).update(payload).digest()
  );

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return { valid: false, reason: 'bad_signature' };
  }

  let decoded;
  try {
    decoded = JSON.parse(fromBase64url(payload).toString('utf8'));
  } catch (_err) {
    return { valid: false, reason: 'bad_payload' };
  }

  if (!decoded.t || typeof decoded.t !== 'number') {
    return { valid: false, reason: 'no_timestamp' };
  }

  if (Date.now() - decoded.t > STATE_TTL_MS) {
    return { valid: false, reason: 'expired' };
  }

  return { valid: true, issuedAt: decoded.t };
}

module.exports = { createState, verifyState };
