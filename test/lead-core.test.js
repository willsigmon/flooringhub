'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const {
  MAX_DETAILS_CHARS,
  RATE_LIMIT_MAX,
  resetCaches,
  sanitizeText,
  normalizeEmail,
  normalizePhone,
  safeJsonParse,
  validateLead,
  isRateLimited,
  isDuplicate,
  rememberLead,
  clearHoneypot,
  createLeadPayload,
  escapeHtml,
  dedupeKeyFor,
  getClientIp
} = require('../lib/lead-core');

const validLead = {
  firstName: 'Tom',
  lastName: 'Smith',
  email: 'homeowner@example.com',
  phone: '3305730370',
  service: 'hardwood',
  details: 'Kitchen and hallway'
};

function mockReq(headers = {}, ip = '203.0.113.10') {
  return {
    headers,
    socket: { remoteAddress: ip }
  };
}

describe('lead-core', () => {
  beforeEach(() => {
    resetCaches();
  });

  it('normalizes contact fields without inventing values', () => {
    assert.equal(sanitizeText('  Tom   Smith  '), 'Tom Smith');
    assert.equal(normalizeEmail('  HomeOwner@Example.COM '), 'homeowner@example.com');
    assert.equal(normalizePhone('(330) 573-0370'), '3305730370');
    assert.equal(sanitizeText(null), '');
  });

  it('rejects incomplete or invented-looking lead payloads', () => {
    assert.deepEqual(validateLead({}), [
      'firstName is required.',
      'lastName is required.',
      'email is required.',
      'service is required.'
    ]);
    assert.ok(validateLead({ ...validLead, email: 'not-an-email' }).includes('Invalid email.'));
    assert.ok(validateLead({ ...validLead, phone: '5551234' }).includes('phone must be at least 10 digits.'));
    assert.ok(
      validateLead({ ...validLead, details: 'x'.repeat(MAX_DETAILS_CHARS + 1) }).some((error) =>
        error.includes('500 characters')
      )
    );
    assert.deepEqual(validateLead(validLead), []);
  });

  it('parses JSON bodies and treats invalid JSON as null', () => {
    assert.deepEqual(safeJsonParse(''), {});
    assert.deepEqual(safeJsonParse('{"service":"lvp"}'), { service: 'lvp' });
    assert.equal(safeJsonParse('{'), null);
  });

  it('rate-limits the fifth request in a window', () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i += 1) {
      assert.equal(isRateLimited('203.0.113.10'), false);
    }
    assert.equal(isRateLimited('203.0.113.10'), true);
    assert.equal(isRateLimited('203.0.113.11'), false);
  });

  it('does not treat a lead as duplicate until it is remembered', () => {
    const key = dedupeKeyFor(validLead, '203.0.113.10');
    assert.equal(isDuplicate(key, validLead), false);
    rememberLead(key, validLead);
    assert.equal(isDuplicate(key, validLead), true);
    assert.equal(isDuplicate(key, { ...validLead, service: 'carpet' }), false);
  });

  it('blocks honeypot submissions and accepts empty ones', () => {
    assert.equal(clearHoneypot({ hp: '' }), true);
    assert.equal(clearHoneypot({ leadHoneypot: '   ' }), true);
    assert.equal(clearHoneypot({ hp: 'http://spam.example' }), false);
  });

  it('builds a sanitized payload from the request', () => {
    const payload = createLeadPayload(
      {
        firstName: '  Tom ',
        lastName: ' Smith',
        email: 'Tom@FlooringHubNC.com',
        phone: '(330) 573-0370',
        service: ' hardwood ',
        details: '  Stair runner  ',
        utm_source: 'google',
        leadPage: '/index.html',
        leadButton: 'lead-submit',
        leadSource: 'homepage_quote_form'
      },
      mockReq({
        referer: 'https://www.flooringhubnc.com/',
        'user-agent': 'leftover-test',
        host: 'www.flooringhubnc.com'
      })
    );

    assert.equal(payload.firstName, 'Tom');
    assert.equal(payload.email, 'tom@flooringhubnc.com');
    assert.equal(payload.phone, '3305730370');
    assert.equal(payload.service, 'hardwood');
    assert.equal(payload.utm.source, 'google');
    assert.equal(payload.meta.source, 'homepage_quote_form');
    assert.equal(payload.meta.clientIp, '203.0.113.10');
  });

  it('reads the first forwarded IP and escapes HTML for email fallback', () => {
    assert.equal(
      getClientIp(mockReq({ 'x-forwarded-for': '198.51.100.2, 203.0.113.10' })),
      '198.51.100.2'
    );
    assert.equal(escapeHtml(`<img src="x" onerror="alert('x')">`), '&lt;img src=&quot;x&quot; onerror=&quot;alert(&#39;x&#39;)&quot;&gt;');
  });
});
