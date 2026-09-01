'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/oauth/jobber/callback');
const { containsForbiddenCallbackText } = require('../lib/jobber-callback-public');

const LEAK = 'SELECT * FROM jobber_tokens access_token=JOB-999 error_description=secret';

function mockRes() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(key, value) {
      this.headers[key] = value;
    },
    end(payload) {
      this.body = String(payload || '');
    }
  };
}

function mockReq(search) {
  return {
    url: `/api/oauth/jobber/callback${search}`,
    headers: { host: 'flooringhubnc.com' }
  };
}

describe('Jobber callback handler leftover', () => {
  it('does not echo Jobber error_description or SQL on a denied handshake', async () => {
    const res = mockRes();
    await handler(
      mockReq(`?error=access_denied&error_description=${encodeURIComponent(LEAK)}`),
      res
    );

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.includes(LEAK), false);
    assert.equal(containsForbiddenCallbackText(res.body), false);
    assert.match(res.body, /did not complete the handshake/);
  });

  it('does not echo a leaky extra query param on a missing-code miss', async () => {
    const res = mockRes();
    await handler(mockReq(`?debug=${encodeURIComponent(LEAK)}`), res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.includes(LEAK), false);
    assert.equal(containsForbiddenCallbackText(res.body), false);
    assert.match(res.body, /missing the authorization code/);
  });
});
