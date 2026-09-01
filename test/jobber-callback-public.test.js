'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  CALLBACK_ERROR_KINDS,
  publicCallbackError,
  publicCallbackTokenBullet,
  containsForbiddenCallbackText
} = require('../lib/jobber-callback-public');

describe('publicCallbackError', () => {
  it('returns a fixed message for every known kind', () => {
    for (const kind of CALLBACK_ERROR_KINDS) {
      const message = publicCallbackError(kind);
      assert.equal(typeof message, 'string');
      assert.ok(message.length > 20);
      assert.equal(containsForbiddenCallbackText(message), false);
    }
  });

  it('throws on an unknown kind so new variants fail closed', () => {
    assert.throws(() => publicCallbackError('not_a_kind'), /Unknown Jobber callback error kind/);
  });

  it('does not echo a leaky Jobber or KV sample when classifying denial', () => {
    const leak = 'SELECT * FROM jobber_tokens access_token=JOB-999 error_description=secret';
    const message = publicCallbackError('jobber_denied');
    assert.equal(message.includes(leak), false);
    assert.match(message, /did not complete the handshake/);
  });
});

describe('publicCallbackTokenBullet', () => {
  it('states tokens were stored and are not auto-refreshed', () => {
    const bullet = publicCallbackTokenBullet(3600);
    assert.match(bullet, /60 minutes/);
    assert.match(bullet, /does not refresh them automatically/);
    assert.doesNotMatch(bullet, /refreshed automatically as needed/i);
    assert.doesNotMatch(bullet, /auto-refresh/i);
    assert.doesNotMatch(bullet, /Jobber Requests/i);
  });

  it('falls back to 60 minutes when expiry is not a number', () => {
    assert.match(publicCallbackTokenBullet('nope'), /60 minutes/);
  });
});
