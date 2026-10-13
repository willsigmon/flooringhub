/**
 * Jobber token persistence via Upstash Redis REST API.
 *
 * The same REST contract is spoken by Vercel KV (which is Upstash under the
 * hood) -- we read either the UPSTASH_* or KV_REST_* env var pair. Keep this
 * file free of the Anthropic / Jobber secrets; only read env vars.
 *
 * Token schema (all string-valued keys in Redis):
 *   jobber:access_token        - bearer token for GraphQL calls
 *   jobber:refresh_token       - single-use refresh token (rotated on use)
 *   jobber:token_expires_at    - ms-epoch when access_token stops working
 *   jobber:connected_at        - ms-epoch of initial OAuth handshake
 *   jobber:last_refresh_at     - ms-epoch of the last refresh_token grant
 *                                (written by saveRefreshedTokens only)
 *   jobber:refresh_lock        - short-lived NX lock so only one function
 *                                instance spends the single-use refresh token
 */

const REFRESH_LOCK_KEY = 'jobber:refresh_lock';

// Read lazily so tests (and a redeploy with new env) see current values.
function kvBase() {
  return process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
}

function kvToken() {
  return process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
}

function isConfigured() {
  return Boolean(kvBase() && kvToken());
}

async function kv(command) {
  if (!isConfigured()) {
    throw new Error(
      'Token store not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel.'
    );
  }

  const response = await fetch(kvBase(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${kvToken()}`
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`KV ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.result;
}

async function saveTokens({ accessToken, refreshToken, expiresAt }) {
  const now = String(Date.now());
  await Promise.all([
    kv(['SET', 'jobber:access_token', accessToken]),
    kv(['SET', 'jobber:refresh_token', refreshToken]),
    kv(['SET', 'jobber:token_expires_at', String(expiresAt)])
  ]);

  const existing = await kv(['GET', 'jobber:connected_at']);
  if (!existing) {
    await kv(['SET', 'jobber:connected_at', now]);
  }
}

async function loadTokens() {
  const [accessToken, refreshToken, expiresAtStr, connectedAtStr, lastRefreshStr] = await Promise.all([
    kv(['GET', 'jobber:access_token']),
    kv(['GET', 'jobber:refresh_token']),
    kv(['GET', 'jobber:token_expires_at']),
    kv(['GET', 'jobber:connected_at']),
    kv(['GET', 'jobber:last_refresh_at'])
  ]);

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    expiresAt: Number(expiresAtStr) || 0,
    connectedAt: Number(connectedAtStr) || 0,
    lastRefreshAt: Number(lastRefreshStr) || 0
  };
}

// Called after a refresh_token grant. Kept separate from saveTokens so the
// initial OAuth handshake never stamps last_refresh_at.
async function saveRefreshedTokens({ accessToken, refreshToken, expiresAt, refreshedAt = Date.now() }) {
  await Promise.all([
    kv(['SET', 'jobber:access_token', accessToken]),
    kv(['SET', 'jobber:refresh_token', refreshToken]),
    kv(['SET', 'jobber:token_expires_at', String(expiresAt)]),
    kv(['SET', 'jobber:last_refresh_at', String(refreshedAt)])
  ]);
}

// SET NX PX: true only for the one caller that wins the lock. The TTL means a
// crashed holder cannot wedge refreshes forever.
async function acquireRefreshLock(ownerId, ttlMs) {
  const result = await kv(['SET', REFRESH_LOCK_KEY, ownerId, 'NX', 'PX', String(ttlMs)]);
  return result === 'OK';
}

// Compare-and-delete in one script so a holder whose lock already expired
// cannot delete the next holder's lock.
async function releaseRefreshLock(ownerId) {
  await kv([
    'EVAL',
    "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end",
    '1',
    REFRESH_LOCK_KEY,
    ownerId
  ]);
}

async function clearTokens() {
  await Promise.all([
    kv(['DEL', 'jobber:access_token']),
    kv(['DEL', 'jobber:refresh_token']),
    kv(['DEL', 'jobber:token_expires_at']),
    kv(['DEL', 'jobber:connected_at']),
    kv(['DEL', 'jobber:last_refresh_at'])
  ]);
}

module.exports = {
  REFRESH_LOCK_KEY,
  isConfigured,
  saveTokens,
  saveRefreshedTokens,
  loadTokens,
  clearTokens,
  acquireRefreshLock,
  releaseRefreshLock
};
