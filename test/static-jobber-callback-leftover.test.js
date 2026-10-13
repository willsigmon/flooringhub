'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(rel) {
  return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
}

describe('static leftover: invented Jobber auto-refresh + callback leaks', () => {
  it('callback uses the public helper and does not interpolate raw backend text', () => {
    const src = read('api/oauth/jobber/callback.js');
    assert.match(src, /publicCallbackError/);
    assert.match(src, /publicCallbackTokenBullet/);
    assert.doesNotMatch(src, /refreshed automatically as needed/);
    assert.doesNotMatch(src, /error_description/);
    assert.doesNotMatch(src, /err\.message/);
    assert.doesNotMatch(src, /escapeHtml\(detail\)/);
  });

  it('admin expired copy describes the real on-demand refresh path', () => {
    const admin = read('admin/jobber.html');
    assert.doesNotMatch(admin, /next request will auto-refresh/);
    assert.doesNotMatch(admin, /Tokens are not auto-refreshed/);
    assert.match(admin, /refreshes on the next website lead/);
    assert.match(read('lib/jobber-client.js'), /acquireRefreshLock/);
  });

  it('initial token save does not stamp last_refresh_at', () => {
    const src = read('lib/jobber-tokens.js');
    const saveFn = src.slice(
      src.indexOf('async function saveTokens'),
      src.indexOf('async function loadTokens')
    );
    assert.doesNotMatch(saveFn, /last_refresh_at/);
  });
});
