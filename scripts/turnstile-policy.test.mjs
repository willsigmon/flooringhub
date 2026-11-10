// Synthetic policy checks: production fails closed without the secret,
// previews only fail open when explicitly flagged, readiness exposes booleans only.
import assert from 'node:assert/strict';
const m = await import(process.argv[2]);
const mod = m.turnstileUnconfiguredAllowed ? m : m.default;
const { turnstileUnconfiguredAllowed: allowed, turnstileReadiness: ready } = mod;
const quiet = console.error; console.error = () => {};
assert.equal(allowed({ VERCEL_ENV: 'production' }), false, 'prod without secret rejects');
assert.equal(allowed({ VERCEL_ENV: 'production', TURNSTILE_ALLOW_UNCONFIGURED: 'true' }), false, 'prod ignores the flag');
assert.equal(allowed({ VERCEL_ENV: 'preview' }), false, 'preview fails closed by default');
assert.equal(allowed({ VERCEL_ENV: 'preview', TURNSTILE_ALLOW_UNCONFIGURED: 'true' }), true, 'preview fails open only when flagged');
assert.equal(allowed({}), true, 'local dev allowed');
console.error = quiet;
const r = ready({ VERCEL_ENV: 'production', TURNSTILE_SECRET_KEY: 's3cret', NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'k' });
assert.deepEqual(r, { environment: 'production', secretConfigured: true, siteKeyConfigured: true, ready: true, enforcing: true });
assert.ok(!JSON.stringify(r).includes('s3cret'), 'no secret in readiness');
assert.equal(ready({ VERCEL_ENV: 'production' }).enforcing, true);
assert.equal(ready({ VERCEL_ENV: 'production' }).ready, false);
assert.equal(ready({}).enforcing, false);
console.log('turnstile policy: all checks passed');
