'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const {
  RATE_LIMIT_MAX,
  RATE_WINDOW_MS,
  DEDUPE_WINDOW_MS,
  resetCaches,
  isRateLimited,
  isDuplicate,
  rememberLead,
  dedupeKeyFor
} = require('../lib/lead-core');
const handler = require('../api/lead');

const KV_URL = 'https://kv.example.test';
const envKeys = [
  'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN',
  'RESEND_API_KEY', 'LEAD_FROM_EMAIL', 'RESEND_FROM_EMAIL'
];

const validLead = {
  firstName: 'Tom',
  lastName: 'Smith',
  email: 'homeowner@example.com',
  phone: '3305730370',
  service: 'hardwood',
  details: 'Kitchen'
};

// Minimal stand-in for the Upstash REST API: one shared store with expiry,
// supporting just the commands lead-core sends.
function createFakeKv() {
  const store = new Map();
  let now = 1_000_000;
  const commands = [];

  function live(key) {
    const entry = store.get(key);
    if (entry && entry.expiresAt !== null && entry.expiresAt <= now) {
      store.delete(key);
      return undefined;
    }
    return entry;
  }

  function run(command) {
    const [name, ...args] = command;
    switch (name) {
      case 'GET': {
        const entry = live(args[0]);
        return entry ? entry.value : null;
      }
      case 'SET': {
        const [key, value, flag, ms] = args;
        store.set(key, { value, expiresAt: flag === 'PX' ? now + Number(ms) : null });
        return 'OK';
      }
      case 'EVAL': {
        const [, , key, windowMs] = args;
        const entry = live(key);
        const count = (entry ? Number(entry.value) : 0) + 1;
        store.set(key, { value: String(count), expiresAt: entry ? entry.expiresAt : now + Number(windowMs) });
        return count;
      }
      default:
        throw new Error(`unsupported ${name}`);
    }
  }

  return {
    store,
    commands,
    advance(ms) { now += ms; },
    async fetch(url, options) {
      const command = JSON.parse(options.body);
      commands.push(command);
      return { ok: true, status: 200, json: async () => ({ result: run(command) }) };
    }
  };
}

function mockRes() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(key, value) { this.headers[key] = value; },
    end(payload) { this.body = payload; }
  };
}

function mockReq(body = validLead, ip = '198.51.100.20') {
  const raw = JSON.stringify(body);
  return {
    method: 'POST',
    headers: { 'x-forwarded-for': ip, host: 'www.flooringhubnc.com' },
    socket: { remoteAddress: ip },
    on(event, cb) {
      if (event === 'data') cb(raw);
      if (event === 'end') cb();
    }
  };
}

describe('lead dedupe and rate limit backed by Upstash/KV', () => {
  const previousFetch = global.fetch;
  const previousWarn = console.warn;
  const previousEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  let kv;
  let deliveries;
  let deliveryOk;

  beforeEach(() => {
    resetCaches();
    envKeys.forEach(key => { delete process.env[key]; });
    process.env.UPSTASH_REDIS_REST_URL = KV_URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    kv = createFakeKv();
    deliveries = 0;
    deliveryOk = true;
    console.warn = () => {};
    global.fetch = async (url, options) => {
      if (String(url) === KV_URL) return kv.fetch(url, options);
      deliveries += 1;
      return deliveryOk
        ? { ok: true, status: 200, text: async () => JSON.stringify({ success: true }) }
        : { ok: false, status: 503, text: async () => JSON.stringify({ message: 'down' }) };
    };
  });

  afterEach(() => {
    global.fetch = previousFetch;
    console.warn = previousWarn;
    envKeys.forEach(key => {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    });
    resetCaches();
  });

  it('keeps the rate limit across instances and resets after the window', async () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i += 1) {
      resetCaches(); // a fresh serverless instance each time
      assert.equal(await isRateLimited('203.0.113.10'), false);
    }
    resetCaches();
    assert.equal(await isRateLimited('203.0.113.10'), true);
    assert.equal(await isRateLimited('203.0.113.11'), false);

    kv.advance(RATE_WINDOW_MS + 1);
    assert.equal(await isRateLimited('203.0.113.10'), false);
  });

  it('remembers a lead across instances for exactly the 10-minute window', async () => {
    const key = dedupeKeyFor(validLead, '203.0.113.10');
    assert.equal(await isDuplicate(key, validLead), false);
    await rememberLead(key, validLead);

    resetCaches();
    assert.equal(await isDuplicate(key, validLead), true);
    assert.equal(await isDuplicate(key, { ...validLead, service: 'carpet' }), false);

    kv.advance(DEDUPE_WINDOW_MS - 1);
    assert.equal(await isDuplicate(key, validLead), true);
    kv.advance(2);
    assert.equal(await isDuplicate(key, validLead), false);
  });

  it('stores only hashes in KV, never contact details', async () => {
    await isRateLimited('203.0.113.10');
    await rememberLead(dedupeKeyFor(validLead, '203.0.113.10'), validLead);
    const dump = JSON.stringify([...kv.store.entries()]);
    for (const secret of [validLead.email, validLead.phone, validLead.firstName, '203.0.113.10']) {
      assert.equal(dump.includes(secret), false, `KV must not contain ${secret}`);
    }
    assert.ok([...kv.store.keys()].every(key => /^lead:(rate|dedupe):[0-9a-f]{64}$/.test(key)));
  });

  it('suppresses a resubmission handled by a different instance', async () => {
    const first = mockRes();
    await handler(mockReq(), first);
    assert.equal(first.statusCode, 200);
    assert.equal(JSON.parse(first.body).duplicate, false);

    resetCaches();
    const second = mockRes();
    await handler(mockReq(), second);
    assert.equal(second.statusCode, 200);
    assert.equal(JSON.parse(second.body).duplicate, true);
    assert.equal(deliveries, 1);
  });

  it('does not record a failed delivery, so the retry goes through', async () => {
    deliveryOk = false;
    const failed = mockRes();
    await handler(mockReq(), failed);
    assert.equal(failed.statusCode, 502);
    assert.equal(kv.commands.some(command => command[0] === 'SET'), false);

    deliveryOk = true;
    resetCaches();
    const retry = mockRes();
    await handler(mockReq(), retry);
    assert.equal(retry.statusCode, 200);
    assert.equal(JSON.parse(retry.body).duplicate, false);
    assert.equal(deliveries, 2);
  });

  it('falls back to in-memory state when KV is unreachable instead of dropping the lead', async () => {
    kv.fetch = async () => ({ ok: false, status: 500, json: async () => ({}) });

    const first = mockRes();
    await handler(mockReq(), first);
    assert.equal(first.statusCode, 200);
    assert.equal(JSON.parse(first.body).duplicate, false);

    const second = mockRes();
    await handler(mockReq(), second);
    assert.equal(JSON.parse(second.body).duplicate, true);
    assert.equal(deliveries, 1);
  });

  it('accepts Vercel KV variable names too', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.KV_REST_API_URL = KV_URL;
    process.env.KV_REST_API_TOKEN = 'test-token';
    await isRateLimited('203.0.113.10');
    assert.equal(kv.commands.length, 1);
    assert.equal(kv.commands[0][0], 'EVAL');
  });
});
