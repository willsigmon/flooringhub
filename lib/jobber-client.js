'use strict';

/**
 * Server-side Jobber client: keeps the stored OAuth access token fresh and
 * turns a website lead into a Jobber Client + Request.
 *
 * Token refresh is guarded by a KV lock (lib/jobber-tokens.js). Jobber may
 * rotate refresh tokens, which makes each one single-use: two function
 * instances refreshing at once would have one of them spend a dead token and
 * could disconnect the account. The lock holder refreshes; everyone else waits
 * for the new token to appear in KV.
 *
 * Nothing here talks to the browser. Secrets come only from env vars.
 */

const crypto = require('crypto');
const tokenStore = require('./jobber-tokens');

const JOBBER_TOKEN_URL = 'https://api.getjobber.com/api/oauth/token';
const JOBBER_GRAPHQL_URL = 'https://api.getjobber.com/api/graphql';
const JOBBER_GRAPHQL_VERSION = process.env.JOBBER_GRAPHQL_VERSION || '2025-04-16';

// Refresh a minute early so a token never expires mid-request.
const EXPIRY_SKEW_MS = 60 * 1000;
const REFRESH_LOCK_TTL_MS = 15 * 1000;
const LOCK_WAIT_STEP_MS = 250;
const LOCK_WAIT_STEPS = 12;
const FETCH_TIMEOUT_MS = 4000;
const MAX_TITLE_CHARS = 255;

const CLIENT_CREATE = `mutation WebsiteLeadClient($input: ClientCreateInput!) {
  clientCreate(input: $input) {
    client { id }
    userErrors { message path }
  }
}`;

const REQUEST_CREATE = `mutation WebsiteLeadRequest($input: RequestCreateInput!) {
  requestCreate(input: $input) {
    request { id }
    userErrors { message path }
  }
}`;

function jobberError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function defaultSleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function deps(options = {}) {
  return {
    store: options.store || tokenStore,
    fetchImpl: options.fetchImpl || ((...args) => fetch(...args)),
    now: options.now || Date.now,
    sleep: options.sleep || defaultSleep
  };
}

function isFresh(tokens, now) {
  return Boolean(tokens && tokens.accessToken && tokens.expiresAt - EXPIRY_SKEW_MS > now);
}

function isSyncConfigured(store = tokenStore) {
  return Boolean(
    process.env.JOBBER_CLIENT_ID &&
    process.env.JOBBER_CLIENT_SECRET &&
    store.isConfigured()
  );
}

async function fetchWithTimeout(fetchImpl, url, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function requestRefresh(d, refreshToken) {
  const response = await fetchWithTimeout(d.fetchImpl, JOBBER_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.JOBBER_CLIENT_ID || '',
      client_secret: process.env.JOBBER_CLIENT_SECRET || '',
      refresh_token: refreshToken
    }).toString()
  });

  let data = null;
  try {
    data = JSON.parse(await response.text());
  } catch (_error) {
    data = null;
  }

  if (!response.ok || !data || !data.access_token) {
    throw jobberError('JOBBER_REFRESH_FAILED', `Jobber token refresh failed (${response.status}).`);
  }

  const expiresInSeconds = Number(data.expires_in) || 3600;
  return {
    accessToken: data.access_token,
    // Without rotation Jobber may omit refresh_token; keep the current one.
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: d.now() + expiresInSeconds * 1000
  };
}

// Wait for whoever holds the lock to publish a token newer than `staleToken`.
async function waitForRefreshedToken(d, staleToken) {
  for (let step = 0; step < LOCK_WAIT_STEPS; step += 1) {
    await d.sleep(LOCK_WAIT_STEP_MS);
    const tokens = await d.store.loadTokens();
    if (tokens && tokens.accessToken !== staleToken && isFresh(tokens, d.now())) {
      return tokens.accessToken;
    }
  }
  throw jobberError('JOBBER_REFRESH_BUSY', 'Timed out waiting for another Jobber token refresh.');
}

async function refreshAccessToken(staleToken, options = {}) {
  const d = deps(options);
  const ownerId = crypto.randomUUID();

  if (!(await d.store.acquireRefreshLock(ownerId, REFRESH_LOCK_TTL_MS))) {
    return waitForRefreshedToken(d, staleToken);
  }

  try {
    // Re-read under the lock: another instance may have refreshed between our
    // read and our lock, in which case its refresh token is the only live one.
    const current = await d.store.loadTokens();
    if (!current) {
      throw jobberError('JOBBER_NOT_CONNECTED', 'Jobber is not connected.');
    }
    if (current.accessToken !== staleToken && isFresh(current, d.now())) {
      return current.accessToken;
    }

    const refreshed = await requestRefresh(d, current.refreshToken);
    await d.store.saveRefreshedTokens({ ...refreshed, refreshedAt: d.now() });
    return refreshed.accessToken;
  } finally {
    try {
      await d.store.releaseRefreshLock(ownerId);
    } catch (_error) {
      // The lock TTL clears it; never mask the refresh result.
    }
  }
}

async function getAccessToken(options = {}) {
  const d = deps(options);
  const tokens = await d.store.loadTokens();
  if (!tokens) {
    throw jobberError('JOBBER_NOT_CONNECTED', 'Jobber is not connected.');
  }
  if (isFresh(tokens, d.now())) {
    return tokens.accessToken;
  }
  return refreshAccessToken(tokens.accessToken, options);
}

async function postGraphql(d, accessToken, query, variables) {
  return fetchWithTimeout(d.fetchImpl, JOBBER_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-JOBBER-GRAPHQL-VERSION': JOBBER_GRAPHQL_VERSION
    },
    body: JSON.stringify({ query, variables })
  });
}

async function jobberGraphql(query, variables, options = {}) {
  const d = deps(options);
  let accessToken = await getAccessToken(options);
  let response = await postGraphql(d, accessToken, query, variables);

  // A token can be revoked or expire early; refresh once and retry.
  if (response.status === 401) {
    accessToken = await refreshAccessToken(accessToken, options);
    response = await postGraphql(d, accessToken, query, variables);
  }

  if (!response.ok) {
    throw jobberError('JOBBER_HTTP', `Jobber GraphQL request failed (${response.status}).`);
  }

  const body = await response.json();
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    throw jobberError('JOBBER_GRAPHQL', 'Jobber GraphQL returned top-level errors.');
  }
  return body.data || {};
}

function mutationResult(data, field) {
  const result = data[field];
  if (!result || (Array.isArray(result.userErrors) && result.userErrors.length > 0)) {
    const paths = (result && result.userErrors || []).map(e => (e.path || []).join('.')).join(', ');
    throw jobberError('JOBBER_USER_ERROR', `Jobber ${field} rejected the lead${paths ? ` (${paths})` : ''}.`);
  }
  return result;
}

function clientInputFor(lead) {
  const input = {
    firstName: lead.firstName,
    lastName: lead.lastName,
    emails: [{ description: 'MAIN', primary: true, address: lead.email }]
  };
  if (lead.phone) {
    input.phones = [{ description: 'MAIN', primary: true, number: lead.phone }];
  }
  return input;
}

function requestTitleFor(lead) {
  const service = lead.service || 'General inquiry';
  const title = lead.details ? `Website lead: ${service} - ${lead.details}` : `Website lead: ${service}`;
  return title.slice(0, MAX_TITLE_CHARS);
}

async function createJobberRequest(lead, options = {}) {
  const clientData = await jobberGraphql(CLIENT_CREATE, { input: clientInputFor(lead) }, options);
  const clientId = mutationResult(clientData, 'clientCreate').client.id;

  const requestData = await jobberGraphql(
    REQUEST_CREATE,
    { input: { clientId, title: requestTitleFor(lead) } },
    options
  );
  const requestId = mutationResult(requestData, 'requestCreate').request.id;

  return { clientId, requestId };
}

module.exports = {
  JOBBER_TOKEN_URL,
  JOBBER_GRAPHQL_URL,
  EXPIRY_SKEW_MS,
  REFRESH_LOCK_TTL_MS,
  isSyncConfigured,
  getAccessToken,
  refreshAccessToken,
  jobberGraphql,
  clientInputFor,
  requestTitleFor,
  createJobberRequest
};
