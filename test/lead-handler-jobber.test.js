'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { resetCaches } = require('../lib/lead-core');
const { JOBBER_TOKEN_URL, JOBBER_GRAPHQL_URL } = require('../lib/jobber-client');
const handler = require('../api/lead');

const KV_URL = 'https://kv.example.test';
const FORMSUBMIT_URL = 'https://formsubmit.co/ajax/tsmith%40flooringhubnc.com';

const validBody = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: '9195550100',
  service: 'tile',
  details: 'Primary bath'
};

function mockRes() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(key, value) { this.headers[key] = value; },
    end(payload) { this.body = payload; }
  };
}

function mockReq(body = validBody) {
  const raw = JSON.stringify(body);
  return {
    method: 'POST',
    headers: { 'x-forwarded-for': '198.51.100.30', host: 'www.flooringhubnc.com' },
    socket: { remoteAddress: '198.51.100.30' },
    on(event, cb) {
      if (event === 'data') cb(raw);
      if (event === 'end') cb();
    }
  };
}

function reply(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body
  };
}

// Routes every outbound call: a tiny Redis for the token store, FormSubmit
// for email, and Jobber's token + GraphQL endpoints.
function fakeNetwork({ emailOk = true, jobber = 'ok', expiresAt = Date.now() + 60 * 60 * 1000 } = {}) {
  const redis = new Map([
    ['jobber:access_token', 'stored-access'],
    ['jobber:refresh_token', 'stored-refresh'],
    ['jobber:token_expires_at', String(expiresAt)]
  ]);
  const order = [];

  const fetchImpl = async (url, init = {}) => {
    url = String(url);
    if (url === KV_URL) {
      const [cmd, key, value, ...rest] = JSON.parse(init.body);
      if (cmd === 'GET') return reply(200, { result: redis.get(key) ?? null });
      if (cmd === 'SET') {
        if (rest.includes('NX') && redis.has(key)) return reply(200, { result: null });
        redis.set(key, value);
        return reply(200, { result: 'OK' });
      }
      if (cmd === 'DEL') { redis.delete(key); return reply(200, { result: 1 }); }
      if (cmd === 'EVAL') {
        const [, , , lockKey, owner] = JSON.parse(init.body);
        if (redis.get(lockKey) === owner) redis.delete(lockKey);
        return reply(200, { result: 1 });
      }
      throw new Error(`unexpected KV command ${cmd}`);
    }
    if (url === FORMSUBMIT_URL) {
      order.push('email');
      return emailOk ? reply(200, { success: 'true' }) : reply(503, { message: 'down' });
    }
    if (url === JOBBER_TOKEN_URL) {
      order.push('refresh');
      return reply(200, { access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 3600 });
    }
    if (url === JOBBER_GRAPHQL_URL) {
      const { query } = JSON.parse(init.body);
      const op = query.includes('clientCreate') ? 'clientCreate' : 'requestCreate';
      order.push(op);
      if (jobber === 'down') return reply(500, {});
      if (op === 'clientCreate') return reply(200, { data: { clientCreate: { client: { id: 'c1' }, userErrors: [] } } });
      return reply(200, { data: { requestCreate: { request: { id: 'r1' }, userErrors: [] } } });
    }
    throw new Error(`unexpected fetch ${url}`);
  };

  return { fetchImpl, order, redis };
}

describe('POST /api/lead with Jobber connected', () => {
  const envKeys = [
    'RESEND_API_KEY', 'LEAD_FROM_EMAIL', 'RESEND_FROM_EMAIL',
    'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN',
    'JOBBER_CLIENT_ID', 'JOBBER_CLIENT_SECRET'
  ];
  const previousEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  const previousFetch = global.fetch;
  const previousError = console.error;
  let logged;

  beforeEach(() => {
    resetCaches();
    envKeys.forEach(key => { delete process.env[key]; });
    process.env.UPSTASH_REDIS_REST_URL = KV_URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = 'kv-token';
    process.env.JOBBER_CLIENT_ID = 'client-id';
    process.env.JOBBER_CLIENT_SECRET = 'client-secret';
    logged = [];
    console.error = (...args) => { logged.push(args); };
  });

  afterEach(() => {
    global.fetch = previousFetch;
    console.error = previousError;
    envKeys.forEach(key => {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    });
    resetCaches();
  });

  it('emails Tom first, then creates the Jobber client and request', async () => {
    const net = fakeNetwork();
    global.fetch = net.fetchImpl;
    const res = mockRes();
    await handler(mockReq(), res);

    assert.equal(res.statusCode, 200);
    assert.equal(JSON.parse(res.body).ok, true);
    assert.deepEqual(net.order, ['email', 'clientCreate', 'requestCreate']);
    assert.equal(logged.length, 0);
  });

  it('still succeeds, and logs no contact details, when Jobber is down', async () => {
    const net = fakeNetwork({ jobber: 'down' });
    global.fetch = net.fetchImpl;
    const res = mockRes();
    await handler(mockReq(), res);

    assert.equal(res.statusCode, 200);
    assert.equal(JSON.parse(res.body).ok, true);
    assert.deepEqual(net.order, ['email', 'clientCreate']);
    assert.equal(logged.length, 1);
    const line = JSON.stringify(logged[0]);
    assert.match(line, /JOBBER_HTTP/);
    assert.doesNotMatch(line, /jane|9195550100|Primary bath/i);

    // The lead is remembered, so a resubmit does not email Tom twice.
    const again = mockRes();
    await handler(mockReq(), again);
    assert.equal(JSON.parse(again.body).duplicate, true);
    assert.equal(net.order.filter(step => step === 'email').length, 1);
  });

  it('does not touch Jobber when the email fails, so the visitor can retry', async () => {
    const net = fakeNetwork({ emailOk: false });
    global.fetch = net.fetchImpl;
    const res = mockRes();
    await handler(mockReq(), res);

    assert.equal(res.statusCode, 502);
    assert.deepEqual(net.order, ['email']);
  });

  it('refreshes an expired token before creating the request', async () => {
    const net = fakeNetwork({ expiresAt: Date.now() - 1000 });
    global.fetch = net.fetchImpl;
    const res = mockRes();
    await handler(mockReq(), res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(net.order, ['email', 'refresh', 'clientCreate', 'requestCreate']);
    assert.equal(net.redis.get('jobber:refresh_token'), 'new-refresh');
    assert.ok(Number(net.redis.get('jobber:last_refresh_at')) > 0);
    assert.equal(net.redis.has('jobber:refresh_lock'), false);
  });

  it('skips Jobber entirely when it is not configured', async () => {
    delete process.env.JOBBER_CLIENT_SECRET;
    const net = fakeNetwork();
    global.fetch = net.fetchImpl;
    const res = mockRes();
    await handler(mockReq(), res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(net.order, ['email']);
  });

  it('returns success when Jobber outlasts its time budget', async () => {
    global.fetch = fakeNetwork().fetchImpl;
    const slow = { createJobberRequest: () => new Promise(() => {}) };
    const result = await handler.syncLeadToJobber(
      { id: 'lead_x' },
      { budgetMs: 10, ...slow }
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, 'JOBBER_TIMEOUT');
  });
});
