'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateLeadFields, formatLeadDeliveryError } = require('../lib/lead-form-validate');

describe('lead form client validation', () => {
  it('accepts a complete residential estimate request', () => {
    const result = validateLeadFields({
      firstName: 'Tom',
      lastName: 'Smith',
      email: 'homeowner@example.com',
      phone: '3305730370',
      service: 'hardwood',
      details: 'Kitchen and hall'
    });

    assert.equal(result.ok, true);
    assert.deepEqual(result.errors, {});
  });

  it('flags empty required fields and a short phone without inventing a CRM error', () => {
    const result = validateLeadFields({
      firstName: '  ',
      lastName: '',
      email: 'not-an-email',
      phone: '555',
      service: '',
      details: 'x'.repeat(501)
    });

    assert.equal(result.ok, false);
    assert.equal(result.errors.firstName, 'This field is required.');
    assert.equal(result.errors.lastName, 'This field is required.');
    assert.equal(result.errors.email, 'Please enter a valid email.');
    assert.equal(result.errors.phone, 'Please enter a valid phone number.');
    assert.equal(result.errors.service, 'Please choose a service.');
    assert.equal(result.errors.details, 'Please keep details under 500 characters.');
    assert.doesNotMatch(JSON.stringify(result.errors), /Jobber|CRM|lead inbox/i);
  });

  it('allows an empty optional phone and appends Tom\'s number on delivery errors', () => {
    const result = validateLeadFields({
      firstName: 'Kelly',
      lastName: 'Wade',
      email: 'kelly@example.com',
      phone: '',
      service: 'carpet',
      details: ''
    });

    assert.equal(result.ok, true);
    assert.equal(
      formatLeadDeliveryError('Lead forwarding is currently unavailable.', '(330) 573-0370'),
      'Lead forwarding is currently unavailable. Or call Tom at (330) 573-0370.'
    );
    assert.equal(
      formatLeadDeliveryError('Please call Tom at (330) 573-0370.', '(330) 573-0370'),
      'Please call Tom at (330) 573-0370.'
    );
  });
});
