/**
 * Jobber connection status.
 *
 * Read-only endpoint used by /admin/jobber.html to render the Connect vs
 * Connected state. Returns only non-sensitive metadata -- never leaks the
 * access or refresh tokens.
 */

const { loadTokens, isConfigured } = require('../lib/jobber-tokens');

function respond(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end(JSON.stringify(body));
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return respond(res, 405, { ok: false, message: 'Method not allowed.' });
  }

  const base = {
    kvConfigured: isConfigured(),
    clientIdConfigured: Boolean(process.env.JOBBER_CLIENT_ID),
    clientSecretConfigured: Boolean(process.env.JOBBER_CLIENT_SECRET),
    stateSecretConfigured: Boolean(
      process.env.JOBBER_STATE_SECRET && process.env.JOBBER_STATE_SECRET.length >= 16
    )
  };

  if (!base.kvConfigured) {
    return respond(res, 200, { ...base, connected: false, reason: 'kv_not_configured' });
  }

  let tokens;
  try {
    tokens = await loadTokens();
  } catch (err) {
    return respond(res, 200, {
      ...base,
      connected: false,
      reason: 'kv_error',
      message: err.message
    });
  }

  if (!tokens) {
    return respond(res, 200, { ...base, connected: false });
  }

  const now = Date.now();
  return respond(res, 200, {
    ...base,
    connected: true,
    connectedAt: tokens.connectedAt || null,
    lastRefreshAt: tokens.lastRefreshAt || null,
    accessTokenExpiresAt: tokens.expiresAt || null,
    accessTokenValid: tokens.expiresAt > now,
    millisUntilExpiry: Math.max(0, tokens.expiresAt - now)
  });
};
