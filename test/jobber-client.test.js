'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const {
  JOBBER_TOKEN_URL,
  JOBBER_GRAPHQL_URL,
  getAccessToken,
  createJobberRequest,
  requestTitleFor,
  clientInputFor
} = require('../lib/jobber-client');

const NOW = 1_800_000_000_000;
const HOUR = 60 * 60 * 1000;

const lead = {
  id: 'lead_1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: '9195550100',
  service: 'hardwood',
  details: 'Kitchen and hallway'
};

// In-memory stand-in for lib/jobber-tokens.js with real NX lock semantics.
function fakeStore(initial) {
  const state = { tokens: initial ? { ...initial } : null, lock: null, saves: [], releases: 0 };
  return {
    state,
    isConfigured: () => true,
    async loadTokens() {
      await Promise.resolve();
      return state.tokens ? { ...state.tokens } : null;
    },
    async saveRefreshedTokens(tokens) {
      await Promise.resolve();
      state.saves.push(tokens);
      state.tokens = { ...state.tokens, ...tokens, lastRefreshAt: tokens.refreshedAt };
    },
    async acquireRefreshLock(owner) {
      await Promise.resolve();
      if (state.lock) return false;
      state.lock = owner;
      return true;
    },
    async releaseRefreshLock(owner) {
      await Promise.resolve();
      state.releases += 1;
      if (state.lock === owner) state.lock = null;
    }
  };
}

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body
  };
}

function fakeJobber({ refreshStatus = 200, graphqlStatuses = [], userErrors = null } = {}) {
  const calls = { refresh: [], graphql: [] };
  let refreshCount = 0;
  const fetchImpl = async (url, init) => {
    if (url === JOBBER_TOKEN_URL) {
      refreshCount += 1;
      calls.refresh.push(new URLSearchParams(init.body));
      // Yield so concurrent callers interleave around the lock.
      await new Promise(resolve => setImmediate(resolve));
      if (refreshStatus !== 200) return jsonResponse(refreshStatus, { error: 'invalid_grant' });
      return jsonResponse(200, {
        access_token: `access-${refreshCount}`,
        refresh_token: `refresh-${refreshCount}`,
        expires_in: 3600
      });
    }
    if (url === JOBBER_GRAPHQL_URL) {
      const body = JSON.parse(init.body);
      calls.graphql.push({ headers: init.headers, body });
      const forced = graphqlStatuses.shift();
      if (forced) return jsonResponse(forced, {});
      if (body.query.includes('clientCreate')) {
        return jsonResponse(200, { data: { clientCreate: { client: { id: 'client-1' }, userErrors: [] } } });
      }
      return jsonResponse(200, {
        data: {
          requestCreate: userErrors
            ? { request: null, userErrors }
            : { request: { id: 'request-1' }, userErrors: [] }
        }
      });
    }
    throw new Error(`unexpected fetch ${url}`);
  };
  return { fetchImpl, calls };
}

const immediate = () => new Promise(resolve => setImmediate(resolve));

describe('Jobber client', () => {
  const envKeys = ['JOBBER_CLIENT_ID', 'JOBBER_CLIENT_SECRET'];
  const previousEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));

  beforeEach(() => {
    process.env.JOBBER_CLIENT_ID = 'client-id';
    process.env.JOBBER_CLIENT_SECRET = 'client-secret';
  });

  afterEach(() => {
    envKeys.forEach(key => {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    });
  });

  it('uses a fresh stored token without refreshing', async () => {
    const store = fakeStore({ accessToken: 'stored', refreshToken: 'r0', expiresAt: NOW + HOUR });
    const { fetchImpl, calls } = fakeJobber();
    const token = await getAccessToken({ store, fetchImpl, now: () => NOW });
    assert.equal(token, 'stored');
    assert.equal(calls.refresh.length, 0);
    assert.equal(store.state.lock, null);
  });

  it('refreshes an expired token under the lock and stores the rotated refresh token', async () => {
    const store = fakeStore({ accessToken: 'old', refreshToken: 'r0', expiresAt: NOW - 1 });
    const { fetchImpl, calls } = fakeJobber();
    const token = await getAccessToken({ store, fetchImpl, now: () => NOW });

    assert.equal(token, 'access-1');
    assert.equal(calls.refresh.length, 1);
    assert.equal(calls.refresh[0].get('grant_type'), 'refresh_token');
    assert.equal(calls.refresh[0].get('refresh_token'), 'r0');
    assert.equal(calls.refresh[0].get('client_secret'), 'client-secret');
    assert.deepEqual(store.state.saves, [
      { accessToken: 'access-1', refreshToken: 'refresh-1', expiresAt: NOW + HOUR, refreshedAt: NOW }
    ]);
    assert.equal(store.state.lock, null);
  });

  it('refreshes a token that expires within the skew window', async () => {
    const store = fakeStore({ accessToken: 'old', refreshToken: 'r0', expiresAt: NOW + 30 * 1000 });
    const { fetchImpl, calls } = fakeJobber();
    assert.equal(await getAccessToken({ store, fetchImpl, now: () => NOW }), 'access-1');
    assert.equal(calls.refresh.length, 1);
  });

  it('spends the refresh token once when several leads arrive together', async () => {
    const store = fakeStore({ accessToken: 'old', refreshToken: 'r0', expiresAt: NOW - 1 });
    const { fetchImpl, calls } = fakeJobber();
    const options = { store, fetchImpl, now: () => NOW, sleep: immediate };

    const tokens = await Promise.all([
      getAccessToken(options),
      getAccessToken(options),
      getAccessToken(options)
    ]);

    assert.equal(calls.refresh.length, 1);
    assert.deepEqual(tokens, ['access-1', 'access-1', 'access-1']);
    assert.equal(store.state.lock, null);
  });

  it('gives up instead of refreshing when another holder never publishes a token', async () => {
    const store = fakeStore({ accessToken: 'old', refreshToken: 'r0', expiresAt: NOW - 1 });
    store.state.lock = 'someone-else';
    const { fetchImpl, calls } = fakeJobber();

    await assert.rejects(
      getAccessToken({ store, fetchImpl, now: () => NOW, sleep: immediate }),
      { code: 'JOBBER_REFRESH_BUSY' }
    );
    assert.equal(calls.refresh.length, 0);
    assert.equal(store.state.lock, 'someone-else');
  });

  it('releases the lock and keeps the old tokens when the refresh is rejected', async () => {
    const store = fakeStore({ accessToken: 'old', refreshToken: 'r0', expiresAt: NOW - 1 });
    const { fetchImpl } = fakeJobber({ refreshStatus: 401 });

    await assert.rejects(getAccessToken({ store, fetchImpl, now: () => NOW }), { code: 'JOBBER_REFRESH_FAILED' });
    assert.equal(store.state.lock, null);
    assert.equal(store.state.saves.length, 0);
    assert.equal(store.state.tokens.refreshToken, 'r0');
  });

  it('reports a missing connection', async () => {
    const { fetchImpl } = fakeJobber();
    await assert.rejects(
      getAccessToken({ store: fakeStore(null), fetchImpl, now: () => NOW }),
      { code: 'JOBBER_NOT_CONNECTED' }
    );
  });

  it('creates a client then a request for the lead', async () => {
    const store = fakeStore({ accessToken: 'stored', refreshToken: 'r0', expiresAt: NOW + HOUR });
    const { fetchImpl, calls } = fakeJobber();
    const result = await createJobberRequest(lead, { store, fetchImpl, now: () => NOW });

    assert.deepEqual(result, { clientId: 'client-1', requestId: 'request-1' });
    assert.equal(calls.graphql.length, 2);
    const [clientCall, requestCall] = calls.graphql;
    assert.equal(clientCall.headers.Authorization, 'Bearer stored');
    assert.match(clientCall.headers['X-JOBBER-GRAPHQL-VERSION'], /^\d{4}-\d{2}-\d{2}$/);
    assert.match(clientCall.body.query, /clientCreate/);
    assert.deepEqual(clientCall.body.variables.input, clientInputFor(lead));
    assert.deepEqual(clientCall.body.variables.input.phones, [
      { description: 'MAIN', primary: true, number: '9195550100' }
    ]);
    assert.match(requestCall.body.query, /requestCreate/);
    assert.deepEqual(requestCall.body.variables.input, {
      clientId: 'client-1',
      title: 'Website lead: hardwood - Kitchen and hallway'
    });
  });

  it('refreshes once and retries when Jobber answers 401', async () => {
    const store = fakeStore({ accessToken: 'revoked', refreshToken: 'r0', expiresAt: NOW + HOUR });
    const { fetchImpl, calls } = fakeJobber({ graphqlStatuses: [401] });
    const result = await createJobberRequest(lead, { store, fetchImpl, now: () => NOW });

    assert.equal(result.requestId, 'request-1');
    assert.equal(calls.refresh.length, 1);
    assert.equal(calls.graphql[0].headers.Authorization, 'Bearer revoked');
    assert.equal(calls.graphql[1].headers.Authorization, 'Bearer access-1');
  });

  it('surfaces Jobber userErrors without echoing customer details', async () => {
    const store = fakeStore({ accessToken: 'stored', refreshToken: 'r0', expiresAt: NOW + HOUR });
    const { fetchImpl } = fakeJobber({ userErrors: [{ message: 'Title is too long', path: ['input', 'title'] }] });

    await assert.rejects(createJobberRequest(lead, { store, fetchImpl, now: () => NOW }), error => {
      assert.equal(error.code, 'JOBBER_USER_ERROR');
      assert.doesNotMatch(error.message, /jane|9195550100/i);
      return true;
    });
  });

  it('omits phones when the lead has none and caps the request title', () => {
    const noPhone = clientInputFor({ ...lead, phone: '' });
    assert.equal('phones' in noPhone, false);
    assert.equal(requestTitleFor({ service: 'tile', details: 'x'.repeat(600) }).length, 255);
    assert.equal(requestTitleFor({ service: '', details: '' }), 'Website lead: General inquiry');
  });
});
