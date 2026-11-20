const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

test('Vercel Node artifact loads the ESM renderer without require(esm)', (t) => {
  // Run with VERCEL_OG_ARTIFACT_ENTRY=/path/to/api/og.js npm test; set both OG_*_REFERENCE paths for byte comparison.
  const requiredEnv = ['VERCEL_OG_ARTIFACT_ENTRY'];
  const missing = requiredEnv.filter((name) => !process.env[name]);

  if (missing.length) {
    t.skip(`Set ${missing.join(', ')} to test a built Vercel artifact`);
    return;
  }

  const result = spawnSync(
    process.execPath,
    ['--no-experimental-require-module', path.join(__dirname, 'og-node-artifact-runner.cjs')],
    {
      cwd: os.tmpdir(),
      encoding: 'utf8',
      env: { ...process.env, NODE_PATH: '' }
    }
  );

  assert.ifError(result.error);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  t.diagnostic(result.stdout.trim());
});
