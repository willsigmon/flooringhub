'use strict';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_DETAILS_CHARS = 500;

function validateLeadFields(values) {
  const input = values && typeof values === 'object' ? values : {};
  const firstName = String(input.firstName || '').trim();
  const lastName = String(input.lastName || '').trim();
  const email = String(input.email || '').trim();
  const phone = String(input.phone || '').trim();
  const service = String(input.service || '').trim();
  const details = String(input.details || '').trim();
  const errors = {};

  if (!firstName) errors.firstName = 'This field is required.';
  if (!lastName) errors.lastName = 'This field is required.';

  if (!email) {
    errors.email = 'This field is required.';
  } else if (!EMAIL_RE.test(email)) {
    errors.email = 'Please enter a valid email.';
  }

  if (!service) errors.service = 'Please choose a service.';

  if (phone && phone.replace(/\D/g, '').length < 10) {
    errors.phone = 'Please enter a valid phone number.';
  }

  if (details.length > MAX_DETAILS_CHARS) {
    errors.details = 'Please keep details under 500 characters.';
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors
  };
}

function formatLeadDeliveryError(message, phoneDisplay) {
  const base = String(message || 'Network issue. Please try again in a moment.').trim();
  const phone = String(phoneDisplay || '').trim();
  if (!phone) return base;
  if (base.indexOf(phone) !== -1) return base;
  return base.replace(/[.]+$/, '') + '. Or call Tom at ' + phone + '.';
}

const api = { validateLeadFields, formatLeadDeliveryError, MAX_DETAILS_CHARS };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}

if (typeof window !== 'undefined') {
  window.LeadFormValidate = api;
}
