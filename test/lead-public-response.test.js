'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  hasForbiddenKey,
  publicLeadSuccess,
  publicLeadFailure,
  classifyDeliveryError,
  deliveryStatusCode
} = require('../lib/lead-public-response');

function assertNoTicketOrLeak(body) {
  assert.equal(hasForbiddenKey(body), false);
  const serialized = JSON.stringify(body);
  assert.doesNotMatch(serialized, /lead_/);
  assert.doesNotMatch(serialized, /Jobber Request/i);
  assert.doesNotMatch(serialized, /SELECT |INSERT |UPDATE |DELETE /i);
  assert.doesNotMatch(serialized, /err\.message/);
}

describe('public lead JSON leftover', () => {
  it('success and duplicate replies have no ticket id or webhook body', () => {
    const ok = publicLeadSuccess('ok');
    const duplicate = publicLeadSuccess('duplicate');
    assert.equal(ok.ok, true);
    assert.equal(ok.duplicate, false);
    assert.equal(duplicate.duplicate, true);
    assertNoTicketOrLeak(ok);
    assertNoTicketOrLeak(duplicate);
  });

  it('delivery failures stay generic and never echo SQL or a leadId', () => {
    const sqlError = new Error('KV 500: SELECT * FROM jobber_requests');
    sqlError.code = 'FORMSUBMIT_ACTIVATION_REQUIRED';
    assert.equal(classifyDeliveryError(sqlError), 'activation');
    assert.equal(
      classifyDeliveryError(new Error('Lead forwarding is not configured.')),
      'unconfigured'
    );
    assert.equal(classifyDeliveryError(sqlError && new Error(sqlError.message)), 'unavailable');
    assert.equal(deliveryStatusCode('activation'), 503);
    assert.equal(deliveryStatusCode('unconfigured'), 503);
    assert.equal(deliveryStatusCode('unavailable'), 502);

    for (const kind of ['activation', 'unconfigured', 'unavailable', 'server']) {
      const body = publicLeadFailure(kind);
      assert.equal(body.ok, false);
      assertNoTicketOrLeak(body);
      assert.doesNotMatch(body.message, /SELECT |jobber_requests|lead_/i);
    }
  });

  it('unknown kinds throw instead of inventing a ticket payload', () => {
    assert.throws(() => publicLeadSuccess('ticket'));
    assert.throws(() => publicLeadFailure('ticket'));
    assert.throws(() => deliveryStatusCode('server'));
  });
});
