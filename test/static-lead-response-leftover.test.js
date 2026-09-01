'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

describe('leftover lead API public response', () => {
  it('sends only the sanitizer payload to the browser after delivery', () => {
    const lead = read('api/lead.js');
    assert.match(lead, /require\('\.\.\/lib\/lead-public-response'\)/);
    assert.match(lead, /publicLeadSuccess\('ok'\)/);
    assert.match(lead, /publicLeadSuccess\('duplicate'\)/);
    assert.match(lead, /publicLeadFailure\(kind\)/);
    assert.match(lead, /publicLeadFailure\('server'\)/);
    assert.doesNotMatch(lead, /leadId:\s*normalizedPayload\.id/);
    assert.doesNotMatch(lead, /jsonResponse\(res, 200, \{\s*ok: true,[\s\S]{0,180}?integration/);
    assert.doesNotMatch(lead, /message:\s*error && error\.message/);
    assert.doesNotMatch(lead, /will create Jobber Requests/);
  });

  it('does not invent a Jobber ticket or 24\/7 desk in the public helper', () => {
    const helper = read('lib/lead-public-response.js');
    assert.match(helper, /never a ticket id/);
    assert.doesNotMatch(helper, /Jobber Requests automatically/);
    assert.doesNotMatch(helper, /24\/7/);
    assert.doesNotMatch(helper, /555/);
  });
});
