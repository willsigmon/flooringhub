/**
 * Initiates the Jobber OAuth flow.
 *
 * The admin page hits GET /api/oauth/jobber/start. We build the Jobber
 * authorize URL with a signed `state` param and redirect the browser there.
 * Jobber presents the consent screen, and on approval redirects back to
 * /api/oauth/jobber/callback with ?code=... and the same state.
 */

const { createState } = require('../../../lib/jobber-state');

const JOBBER_AUTHORIZE_URL = 'https://api.getjobber.com/api/oauth/authorize';

function redirectHtml(url) {
  const safe = url.replace(/"/g, '&quot;');
  return [
    '<!doctype html><html><head>',
    '<meta charset="utf-8">',
    `<meta http-equiv="refresh" content="0;url=${safe}">`,
    '<title>Redirecting to Jobber&hellip;</title>',
    '</head><body>',
    `<p>Redirecting to Jobber. If nothing happens, <a href="${safe}">click here</a>.</p>`,
    '</body></html>'
  ].join('');
}

function errorJson(res, status, message) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok: false, message }));
}

module.exports = async (req, res) => {
  const clientId = process.env.JOBBER_CLIENT_ID;
  const redirectUri =
    process.env.JOBBER_REDIRECT_URI ||
    `https://${req.headers.host}/api/oauth/jobber/callback`;

  if (!clientId) {
    return errorJson(res, 500, 'JOBBER_CLIENT_ID env var not set.');
  }

  let state;
  try {
    state = createState();
  } catch (err) {
    return errorJson(res, 500, err.message);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state
  });

  const authorizeUrl = `${JOBBER_AUTHORIZE_URL}?${params.toString()}`;

  // Prefer a 302 so curl + browsers both do the right thing.
  res.statusCode = 302;
  res.setHeader('Location', authorizeUrl);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(redirectHtml(authorizeUrl));
};
