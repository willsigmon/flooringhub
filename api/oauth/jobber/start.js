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

function errorPage(res, status, message) {
  const html = [
    '<!doctype html><html lang="en"><head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="robots" content="noindex, nofollow">',
    '<title>Jobber connect is not configured</title>',
    '</head><body>',
    '<h1>Jobber connect is not configured</h1>',
    `<p>${message}</p>`,
    '<p>This page only starts an OAuth handshake. It does not create Jobber Requests or change how website leads are delivered.</p>',
    '<p><a href="/admin/jobber.html">&larr; Back to the Connect Jobber page</a></p>',
    '</body></html>'
  ].join('');

  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end(html);
}

module.exports = async (req, res) => {
  const clientId = process.env.JOBBER_CLIENT_ID;
  const redirectUri =
    process.env.JOBBER_REDIRECT_URI ||
    `https://${req.headers.host}/api/oauth/jobber/callback`;

  if (!clientId) {
    return errorPage(
      res,
      500,
      'JOBBER_CLIENT_ID is not set on this server. Connecting Jobber from the admin page will not work until that env var exists.'
    );
  }

  let state;
  try {
    state = createState();
  } catch (err) {
    return errorPage(
      res,
      500,
      'The OAuth state secret is missing or invalid. The handshake did not start. Website leads are unchanged.'
    );
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
