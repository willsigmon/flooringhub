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
 *   jobber:last_refresh_at     - ms-epoch of most recent successful refresh
 */

const BASE = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

function isConfigured() {
  return Boolean(BASE && TOKEN);
}

async function kv(command) {
  if (!isConfigured()) {
    throw new Error(
      'Token store not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel.'
    );
  }

  const response = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`
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
    kv(['SET', 'jobber:token_expires_at', String(expiresAt)]),
    kv(['SET', 'jobber:last_refresh_at', now])
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

async function clearTokens() {
  await Promise.all([
    kv(['DEL', 'jobber:access_token']),
    kv(['DEL', 'jobber:refresh_token']),
    kv(['DEL', 'jobber:token_expires_at']),
    kv(['DEL', 'jobber:connected_at']),
    kv(['DEL', 'jobber:last_refresh_at'])
  ]);
}

module.exports = { isConfigured, saveTokens, loadTokens, clearTokens };
