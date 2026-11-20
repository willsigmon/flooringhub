const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Writable } = require('node:stream');
const { finished } = require('node:stream/promises');
const { pathToFileURL } = require('node:url');

async function render(handler, url) {
  const chunks = [];
  const response = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    }
  });
  response.statusCode = 0;
  response.headers = new Map();
  response.setHeader = function (name, value) {
    this.headers.set(name.toLowerCase(), String(value));
  };

  const completion = finished(response);
  await handler({ url }, response);
  await completion;

  const body = Buffer.concat(chunks);
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.equal(
    response.headers.get('cache-control'),
    'public, immutable, no-transform, max-age=31536000'
  );
  assert.deepEqual(body.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal(body.readUInt32BE(16), 1200);
  assert.equal(body.readUInt32BE(20), 630);
  return { response, body };
}

async function main() {
  assert.equal(typeof globalThis.require, 'undefined');
  assert.equal(typeof globalThis.__dirname, 'undefined');

  const entry = path.resolve(process.env.VERCEL_OG_ARTIFACT_ENTRY);
  const artifactRoot = path.dirname(path.dirname(entry));
  assert.ok(fs.existsSync(path.join(artifactRoot, 'node_modules/harfbuzzjs/hb.wasm')));
  assert.ok(fs.existsSync(path.join(artifactRoot, 'node_modules/@vercel/og/dist/resvg.wasm')));
  const esmEntry = path.join(artifactRoot, 'node_modules/@vercel/og/dist/index.node.js');
  const requireControl = spawnSync(
    process.execPath,
    ['--no-experimental-require-module', '-e', 'require(process.argv[1])', esmEntry],
    { cwd: os.tmpdir(), encoding: 'utf8', env: { ...process.env, NODE_PATH: '' } }
  );
  assert.notEqual(requireControl.status, 0);
  assert.match(requireControl.stderr, /ERR_REQUIRE_ESM/);

  const imported = await import(pathToFileURL(entry).href);
  const handler = imported.default?.default ?? imported.default;
  assert.equal(typeof handler, 'function');

  const defaultResult = await render(handler, '/api/og');
  const query = new URLSearchParams({
    title: 'Hardwood Flooring in Raleigh',
    subtitle: 'Installation and refinishing across the Triangle',
    eyebrow: 'Flooring Hub | Raleigh'
  });
  const customResult = await render(handler, `/api/og?${query}`);
  assert.notDeepEqual(customResult.body, defaultResult.body);
  const referencePaths = [process.env.OG_DEFAULT_REFERENCE, process.env.OG_CUSTOM_REFERENCE];
  const compareReferences = referencePaths.every(Boolean);
  const outputs = [
    { name: 'default', result: defaultResult, reference: referencePaths[0] },
    { name: 'custom', result: customResult, reference: referencePaths[1] }
  ].map(({ name, result, reference }) => {
    const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
    const output = {
      name,
      status: result.response.statusCode,
      contentType: result.response.headers.get('content-type'),
      width: result.body.readUInt32BE(16),
      height: result.body.readUInt32BE(20),
      sha256: hash(result.body)
    };

    if (compareReferences) {
      const expected = fs.readFileSync(reference);
      assert.deepEqual(result.body, expected);
      output.referenceSha256 = hash(expected);
      output.byteIdentical = result.body.equals(expected);
    }

    return output;
  });

  console.log(JSON.stringify({
    node: process.version,
    flag: '--no-experimental-require-module',
    globalRequire: typeof globalThis.require,
    globalDirname: typeof globalThis.__dirname,
    cwd: process.cwd(),
    requireEsmNegativeControl: 'ERR_REQUIRE_ESM',
    referenceComparison: compareReferences,
    outputs
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
