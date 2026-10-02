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
  const envKeys = ['RESEND_API_KEY', 'LEAD_FROM_EMAIL', 'RESEND_FROM_EMAIL', 'LEAD_WEBHOOK_URL', 'JOBBER_WEBHOOK_URL', 'LEAD_TO_EMAIL', 'ADMIN_EMAIL', 'FORMSUBMIT_ENDPOINT'];
  const previousEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  let fetchCalls;

  beforeEach(() => {
    resetCaches();
    fetchCalls = [];
    envKeys.forEach(key => { delete process.env[key]; });
    // Legacy destinations must not intercept an email inquiry.
    process.env.LEAD_WEBHOOK_URL = 'https://example.test/lead-webhook';
    process.env.JOBBER_WEBHOOK_URL = 'https://example.test/jobber-webhook';
    process.env.LEAD_TO_EMAIL = 'wrong@example.test';
    process.env.ADMIN_EMAIL = 'admin@example.test';
    process.env.FORMSUBMIT_ENDPOINT = 'https://example.test/wrong-endpoint';
    global.fetch = async (url, options) => {
      fetchCalls.push({ url: String(url), options });
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ success: true })
      };
    };
  });

  afterEach(() => {
    global.fetch = previousFetch;
    envKeys.forEach(key => {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    });
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
    assert.equal('integration' in parsed(first), false);
    assert.equal('id' in parsed(first), false);
    assert.equal(fetchCalls.length, 1);
    assert.equal(fetchCalls[0].url, 'https://formsubmit.co/ajax/tsmith%40flooringhubnc.com');
    const emailBody = new URLSearchParams(fetchCalls[0].options.body);
    assert.equal(emailBody.get('_replyto'), validBody.email);
    assert.equal(emailBody.get('details'), validBody.details);

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
        text: async () => JSON.stringify({ success: true })
      };
    };

    const retry = mockRes();
    await handler(mockReq(), retry);
    assert.equal(retry.statusCode, 200);
    assert.equal(parsed(retry).ok, true);
    assert.equal(parsed(retry).duplicate, false);
  });
  it('uses existing Resend configuration but fixes the recipient to Tom', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.LEAD_FROM_EMAIL = 'Flooring Hub <sender@example.test>';
    const res = mockRes();
    await handler(mockReq(), res);
    assert.equal(res.statusCode, 200);
    assert.equal(fetchCalls.length, 1);
    assert.equal(fetchCalls[0].url, 'https://api.resend.com/emails');
    const email = JSON.parse(fetchCalls[0].options.body);
    assert.deepEqual(email.to, ['tsmith@flooringhubnc.com']);
    assert.equal(email.from, process.env.LEAD_FROM_EMAIL);
    assert.match(email.html, /homeowner@example.com/);
  });

  it('reports Resend rejection without silently switching email providers', async () => {
    process.env.RESEND_API_KEY = 'test-key';
    process.env.RESEND_FROM_EMAIL = 'sender@example.test';
    global.fetch = async (url, options) => {
      fetchCalls.push({ url: String(url), options });
      return { ok: false, status: 403, text: async () => 'sender is unverified' };
    };
    const res = mockRes();
    await handler(mockReq(), res);
    assert.equal(res.statusCode, 502);
    assert.equal(parsed(res).ok, false);
    assert.equal(fetchCalls.length, 1);
    assert.equal(fetchCalls[0].url, 'https://api.resend.com/emails');
    assert.doesNotMatch(res.body, /sender is unverified/);
  });

  it('reports FormSubmit activation requirements without acknowledging delivery', async () => {
    global.fetch = async (url, options) => {
      fetchCalls.push({ url: String(url), options });
      return { ok: true, status: 200, text: async () => JSON.stringify({ success: false, message: 'Recipient activation required' }) };
    };
    const first = mockRes();
    await handler(mockReq(), first);
    assert.equal(first.statusCode, 503);
    assert.equal(parsed(first).ok, false);
    assert.match(parsed(first).message, /activation/);
    const retry = mockRes();
    await handler(mockReq(), retry);
    assert.equal(retry.statusCode, 503);
    assert.equal(fetchCalls.length, 2, 'failed delivery must remain retryable');
  });
});
