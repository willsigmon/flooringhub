'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { hasForbiddenKey } = require('../lib/lead-public-response');
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

describe('POST /api/lead public leftover', () => {
  const previousFetch = global.fetch;
  const previousWebhook = process.env.LEAD_WEBHOOK_URL;
  const previousFormSubmit = process.env.FORMSUBMIT_ENDPOINT;
  const previousResend = process.env.RESEND_API_KEY;

  beforeEach(() => {
    process.env.LEAD_WEBHOOK_URL = 'https://example.test/lead-webhook';
    process.env.FORMSUBMIT_ENDPOINT = 'https://example.test/formsubmit';
    delete process.env.RESEND_API_KEY;
  });

  afterEach(() => {
    global.fetch = previousFetch;
    if (previousWebhook === undefined) {
      delete process.env.LEAD_WEBHOOK_URL;
    } else {
      process.env.LEAD_WEBHOOK_URL = previousWebhook;
    }
    if (previousFormSubmit === undefined) {
      delete process.env.FORMSUBMIT_ENDPOINT;
    } else {
      process.env.FORMSUBMIT_ENDPOINT = previousFormSubmit;
    }
    if (previousResend === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = previousResend;
    }
  });

  it('does not return a lead_ ticket or webhook SQL on success', async () => {
    global.fetch = async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        requestId: 'JOB-999',
        sql: 'SELECT * FROM jobber_requests'
      })
    });

    const res = mockRes();
    await handler(mockReq(), res);
    const body = parsed(res);

    assert.equal(res.statusCode, 200);
    assert.equal(body.ok, true);
    assert.equal(body.duplicate, false);
    assert.equal(hasForbiddenKey(body), false);
    assert.equal(body.id, undefined);
    assert.equal(body.integration, undefined);
    assert.doesNotMatch(res.body, /lead_/);
    assert.doesNotMatch(res.body, /JOB-999|SELECT |jobber_requests/);
  });

  it('does not echo SQL or a leadId when delivery fails', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ message: 'SELECT * FROM jobber_requests' })
    });

    const res = mockRes();
    await handler(mockReq({ ip: '198.51.100.21' }), res);
    const body = parsed(res);

    assert.equal(res.statusCode, 502);
    assert.equal(body.ok, false);
    assert.equal(hasForbiddenKey(body), false);
    assert.equal(body.leadId, undefined);
    assert.doesNotMatch(res.body, /lead_/);
    assert.doesNotMatch(res.body, /SELECT |jobber_requests/);
    assert.match(body.message, /call to confirm/);
  });
});
