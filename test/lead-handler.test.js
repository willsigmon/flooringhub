'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { resetCaches } = require('../lib/lead-core');
const handler = require('../api/lead');

const validBody = {
  firstName: 'Tom',
  lastName: 'Smith',
  email: 'homeowner@example.com',
  phone: '3305730370',
  service: 'hardwood',
  details: 'Kitchen'
};

function mockRes() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(key, value) {
      this.headers[key] = value;
    },
    end(payload) {
      this.body = payload;
    }
  };
}

function mockReq({ method = 'POST', body = validBody, headers = {}, ip = '198.51.100.20' } = {}) {
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    method,
    headers: { 'x-forwarded-for': ip, host: 'www.flooringhubnc.com', ...headers },
    socket: { remoteAddress: ip },
    on(event, cb) {
      if (event === 'data') cb(raw);
      if (event === 'end') cb();
    }
  };
}

function parsed(res) {
  return JSON.parse(res.body);
}

describe('POST /api/lead', () => {
  const previousFetch = global.fetch;
  const previousWebhook = process.env.LEAD_WEBHOOK_URL;
  let fetchCalls;

  beforeEach(() => {
    resetCaches();
    fetchCalls = [];
    process.env.LEAD_WEBHOOK_URL = 'https://example.test/lead-webhook';
    global.fetch = async (url, options) => {
      fetchCalls.push({ url: String(url), options });
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true })
      };
    };
  });

  afterEach(() => {
    global.fetch = previousFetch;
    if (previousWebhook === undefined) {
      delete process.env.LEAD_WEBHOOK_URL;
    } else {
      process.env.LEAD_WEBHOOK_URL = previousWebhook;
    }
    resetCaches();
  });

  it('rejects non-POST methods and invalid JSON', async () => {
    const getRes = mockRes();
    await handler(mockReq({ method: 'GET' }), getRes);
    assert.equal(getRes.statusCode, 405);

    const badRes = mockRes();
    await handler(mockReq({ body: '{' }), badRes);
    assert.equal(badRes.statusCode, 400);
    assert.equal(parsed(badRes).message, 'Invalid JSON body.');
  });

  it('blocks honeypot and missing fields before delivery', async () => {
    const hpRes = mockRes();
    await handler(mockReq({ body: { ...validBody, hp: 'bot' } }), hpRes);
    assert.equal(hpRes.statusCode, 400);
    assert.equal(parsed(hpRes).message, 'Submission blocked.');

    const missingRes = mockRes();
    await handler(mockReq({ body: { firstName: 'Tom' } }), missingRes);
    assert.equal(missingRes.statusCode, 400);
    assert.ok(parsed(missingRes).errors.includes('email is required.'));
    assert.equal(fetchCalls.length, 0);
  });

  it('delivers a valid lead once and remembers it only after success', async () => {
    const first = mockRes();
    await handler(mockReq(), first);
    assert.equal(first.statusCode, 200);
    assert.equal(parsed(first).ok, true);
    assert.equal(parsed(first).duplicate, false);
    assert.equal(parsed(first).integration.name, 'webhook');
    assert.equal(fetchCalls.length, 1);

    const second = mockRes();
    await handler(mockReq(), second);
    assert.equal(second.statusCode, 200);
    assert.equal(parsed(second).duplicate, true);
    assert.equal(fetchCalls.length, 1);
  });

  it('allows a retry when the first delivery fails', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 503,
      text: async () => JSON.stringify({ message: 'downstream down' })
    });

    const failed = mockRes();
    await handler(mockReq(), failed);
    assert.equal(failed.statusCode, 502);
    assert.equal(parsed(failed).ok, false);

    global.fetch = async (url, options) => {
      fetchCalls.push({ url: String(url), options });
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true })
      };
    };

    const retry = mockRes();
    await handler(mockReq(), retry);
    assert.equal(retry.statusCode, 200);
    assert.equal(parsed(retry).ok, true);
    assert.equal(parsed(retry).duplicate, false);
  });
});
