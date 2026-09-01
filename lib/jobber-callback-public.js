'use strict';

/**
 * Public HTML copy for /api/oauth/jobber/callback.
 *
 * The handshake stores tokens in KV. There is no refresh path and no Jobber
 * Request creation on this page. Error text is a fixed kind — never
 * err.message, Jobber error_description, or a token/KV body (those can leak
 * SQL or secrets).
 */

const CALLBACK_ERROR_KINDS = [
  'jobber_denied',
  'missing_code',
  'missing_state',
  'state_invalid',
  'missing_config',
  'kv_unconfigured',
  'network',
  'token_exchange',
  'persist',
  'server'
];

function publicCallbackError(kind) {
  switch (kind) {
    case 'jobber_denied':
      return 'Jobber did not complete the handshake. Tokens were not stored. Start again from the Connect page.';
    case 'missing_code':
      return 'This callback is missing the authorization code. Start again from the Connect page.';
    case 'missing_state':
      return 'This callback is missing the state check. Start again from the Connect page.';
    case 'state_invalid':
      return 'The handshake state check failed. Start again from the Connect page.';
    case 'missing_config':
      return 'Jobber OAuth is not fully configured on this server. Tokens were not stored.';
    case 'kv_unconfigured':
      return 'The token store is not configured. Tokens were not stored.';
    case 'network':
      return 'Could not reach Jobber to finish the handshake. Tokens were not stored.';
    case 'token_exchange':
      return 'Jobber did not return usable tokens. Nothing was stored.';
    case 'persist':
      return 'Tokens could not be saved. Jobber is not connected.';
    case 'server':
      return 'The handshake failed on the server. Tokens were not stored.';
    default: {
      const _exhaustive = kind;
      void _exhaustive;
      throw new Error('Unknown Jobber callback error kind.');
    }
  }
}

function publicCallbackTokenBullet(expiresInSeconds) {
  const minutes = Math.max(1, Math.round(Number(expiresInSeconds) / 60) || 60);
  return `Access token valid for roughly ${minutes} minutes. This handshake stored the tokens; the site does not refresh them automatically.`;
}

function containsForbiddenCallbackText(text) {
  if (typeof text !== 'string' || !text) {
    return false;
  }
  return /err\.message|error_description|tokenRawText|access_token|refresh_token|SELECT\s+\*|auto-refresh|refreshed automatically as needed/i.test(
    text
  );
}

module.exports = {
  CALLBACK_ERROR_KINDS,
  publicCallbackError,
  publicCallbackTokenBullet,
  containsForbiddenCallbackText
};
