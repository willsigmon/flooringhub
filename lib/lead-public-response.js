'use strict';

/**
 * Public JSON for /api/lead.
 *
 * Delivery still uses an internal lead id and may receive a webhook body.
 * Those stay server-side. The browser only gets ok/duplicate/message —
 * never a ticket id, Jobber Request, webhook payload, or raw err.message
 * (those can invent a ticket or leak SQL / KV text).
 */

const FORBIDDEN_PUBLIC_KEYS = [
  'id',
  'leadId',
  'integration',
  'response',
  'stack',
  'sql',
  'query',
  'token',
  'accessToken',
  'refreshToken'
];

function hasForbiddenKey(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  return Object.keys(value).some((key) => FORBIDDEN_PUBLIC_KEYS.includes(key));
}

function publicLeadSuccess(kind) {
  switch (kind) {
    case 'ok':
      return {
        ok: true,
        duplicate: false,
        message: 'Thanks! Your request was received. Tom will contact you soon.'
      };
    case 'duplicate':
      return {
        ok: true,
        duplicate: true,
        message: 'A similar lead was submitted recently. Tom will follow up shortly.'
      };
    default:
      throw new Error('Unknown public lead success kind.');
  }
}

function publicLeadFailure(kind) {
  switch (kind) {
    case 'activation':
      return {
        ok: false,
        message: 'Lead email delivery is waiting on a one-time activation email. Please call Tom directly until that is completed.'
      };
    case 'unconfigured':
      return {
        ok: false,
        message: 'Lead delivery is not configured yet. Please call Tom directly for now.'
      };
    case 'unavailable':
      return {
        ok: false,
        message: 'Lead forwarding is currently unavailable. Please call to confirm.'
      };
    case 'server':
      return {
        ok: false,
        message: 'Server error while handling lead.'
      };
    default:
      throw new Error('Unknown public lead failure kind.');
  }
}

function classifyDeliveryError(error) {
  if (error && error.code === 'FORMSUBMIT_ACTIVATION_REQUIRED') {
    return 'activation';
  }
  if (error && error.message === 'Lead forwarding is not configured.') {
    return 'unconfigured';
  }
  return 'unavailable';
}

function deliveryStatusCode(kind) {
  switch (kind) {
    case 'activation':
    case 'unconfigured':
      return 503;
    case 'unavailable':
      return 502;
    default:
      throw new Error('Unknown delivery failure kind.');
  }
}

module.exports = {
  FORBIDDEN_PUBLIC_KEYS,
  hasForbiddenKey,
  publicLeadSuccess,
  publicLeadFailure,
  classifyDeliveryError,
  deliveryStatusCode
};
