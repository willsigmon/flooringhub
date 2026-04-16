/**
 * Jobber OAuth callback.
 *
 * Jobber redirects here with ?code=...&state=... after Tom approves the
 * consent screen. We verify the state (CSRF), exchange the code for an
 * access_token + refresh_token at Jobber's token endpoint, and persist both
 * to our KV store for api/lead.js to use when pushing leads as Requests.
 */

const { verifyState } = require('../../../lib/jobber-state');
const { saveTokens, isConfigured } = require('../../../lib/jobber-tokens');

const JOBBER_TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';

function page(title, heading, body, accentColor = '#1C1C1E') {
  return [
    '<!doctype html><html lang="en"><head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="robots" content="noindex, nofollow">',
    `<title>${title}</title>`,
    '<style>',
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;',
    'max-width:640px;margin:64px auto;padding:24px;line-height:1.6;color:#1C1C1E;',
    'background:#F7F4EC}',
    `h1{color:${accentColor};margin:0 0 16px;font-weight:600}`,
    'a{color:#A89060}',
    'code{background:rgba(0,0,0,0.06);padding:2px 8px;border-radius:4px;font-size:0.92em}',
    '.card{background:#fff;border-radius:12px;padding:28px 32px;',
    'box-shadow:0 12px 40px -20px rgba(0,0,0,0.2)}',
    'ul{padding-left:20px}',
    '</style>',
    '</head><body><div class="card">',
    `<h1>${heading}</h1>`,
    body,
    '</div></body></html>'
  ].join('');
}

function respondHtml(res, status, html) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end(html);
}

function errorPage(res, status, detail) {
  const body =
    `<p>${detail}</p>` +
    '<p><a href="/admin/jobber.html">&larr; Back to the Connect Jobber page</a></p>';
  return respondHtml(res, status, page('Jobber connection failed', 'Jobber connection failed', body, '#8A3A2A'));
}

function successPage(res, expiresInSeconds) {
  const body = [
    '<p>Flooring Hub is now connected to your Jobber account.</p>',
    '<p>Lead form submissions at <code>flooringhubnc.com</code> will create Jobber Requests automatically.</p>',
    '<ul>',
    `<li>Access token valid for roughly ${Math.round(expiresInSeconds / 60)} minutes &mdash; refreshed automatically as needed.</li>`,
    '<li>Tokens are stored in the Vercel-side KV, not the browser.</li>',
    '</ul>',
    '<p><a href="/admin/jobber.html?connected=1">View connection status &rarr;</a></p>'
  ].join('');
  return respondHtml(res, 200, page('Jobber connected', '\u2713 Jobber connected', body, '#2E5C3A'));
}

module.exports = async (req, res) => {
  const host = req.headers.host || 'flooringhubnc.com';
  const url = new URL(req.url, `https://${host}`);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const jobberError = url.searchParams.get('error');
  const jobberErrorDesc = url.searchParams.get('error_description');

  if (jobberError) {
    return errorPage(
      res,
      400,
      `Jobber returned <code>${escapeHtml(jobberError)}</code>${
        jobberErrorDesc ? `: ${escapeHtml(jobberErrorDesc)}` : '.'
      }`
    );
  }

  if (!code) {
    return errorPage(res, 400, 'Missing <code>code</code> query param. Start the flow from <a href="/admin/jobber.html">the Connect page</a>.');
  }

  if (!state) {
    return errorPage(res, 400, 'Missing <code>state</code> query param. Potential CSRF attempt or direct link &mdash; start again from <a href="/admin/jobber.html">the Connect page</a>.');
  }

  try {
    const stateCheck = verifyState(state);
    if (!stateCheck.valid) {
      return errorPage(res, 400, `State verification failed (${escapeHtml(stateCheck.reason)}). Start again from <a href="/admin/jobber.html">the Connect page</a>.`);
    }
  } catch (err) {
    return errorPage(res, 500, `State verification error: ${escapeHtml(err.message)}`);
  }

  const clientId = process.env.JOBBER_CLIENT_ID;
  const clientSecret = process.env.JOBBER_CLIENT_SECRET;
  const redirectUri =
    process.env.JOBBER_REDIRECT_URI || `https://${host}/api/oauth/jobber/callback`;

  if (!clientId || !clientSecret) {
    return errorPage(res, 500, 'Server is missing <code>JOBBER_CLIENT_ID</code> or <code>JOBBER_CLIENT_SECRET</code>. Set them in Vercel env vars.');
  }

  if (!isConfigured()) {
    return errorPage(res, 500, 'KV token store is not configured. Set <code>UPSTASH_REDIS_REST_URL</code> + <code>UPSTASH_REDIS_REST_TOKEN</code> (or the <code>KV_*</code> equivalents) in Vercel env vars.');
  }

  let tokenResponse;
  let tokenRawText;
  try {
    tokenResponse = await fetch(JOBBER_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri
      }).toString()
    });
    tokenRawText = await tokenResponse.text();
  } catch (err) {
    return errorPage(res, 502, `Network error reaching Jobber token endpoint: ${escapeHtml(err.message)}`);
  }

  let tokenData;
  try {
    tokenData = tokenRawText ? JSON.parse(tokenRawText) : null;
  } catch (_err) {
    tokenData = null;
  }

  if (!tokenResponse.ok || !tokenData) {
    const detail = tokenData && tokenData.error_description
      ? tokenData.error_description
      : tokenRawText || `Status ${tokenResponse.status}`;
    return errorPage(res, 502, `Jobber token exchange failed: ${escapeHtml(detail)}`);
  }

  const { access_token, refresh_token, expires_in } = tokenData;
  if (!access_token || !refresh_token) {
    return errorPage(res, 502, 'Jobber returned no tokens in the response body.');
  }

  const expiresInSeconds = Number(expires_in) || 3600;
  const expiresAt = Date.now() + expiresInSeconds * 1000;

  try {
    await saveTokens({
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt
    });
  } catch (err) {
    return errorPage(res, 500, `Token persistence failed: ${escapeHtml(err.message)}`);
  }

  return successPage(res, expiresInSeconds);
};

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
