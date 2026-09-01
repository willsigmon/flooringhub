'use strict';

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');

process.env.JOBBER_STATE_SECRET = 'leftover-test-secret-16';

const { createState, verifyState, timingSafeStringEqual } = require('../lib/jobber-state');

describe('jobber-state', () => {
  before(() => {
    process.env.JOBBER_STATE_SECRET = 'leftover-test-secret-16';
  });

  it('creates a state token that verifies while fresh', () => {
    const state = createState();
    const result = verifyState(state);
    assert.equal(result.valid, true);
    assert.equal(typeof result.issuedAt, 'number');
  });

  it('returns a reason instead of throwing on malformed or wrong-length signatures', () => {
    assert.deepEqual(verifyState('not-a-state'), { valid: false, reason: 'malformed' });
    assert.deepEqual(verifyState('abc.xx'), { valid: false, reason: 'bad_signature' });
    assert.equal(timingSafeStringEqual('short', 'much-longer-signature'), false);
  });

  it('rejects expired state without inventing a new handshake', () => {
    const realNow = Date.now;
    const past = realNow() - (11 * 60 * 1000);
    Date.now = () => past;
    let state;
    try {
      state = createState();
    } finally {
      Date.now = realNow;
    }

    const result = verifyState(state);
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'expired');
  });

  it('refuses a short or missing state secret', () => {
    const previous = process.env.JOBBER_STATE_SECRET;
    delete process.env.JOBBER_STATE_SECRET;
    assert.throws(() => createState(), /JOBBER_STATE_SECRET/);
    process.env.JOBBER_STATE_SECRET = 'too-short';
    assert.throws(() => createState(), /too short/);
    process.env.JOBBER_STATE_SECRET = previous;
  });
});
