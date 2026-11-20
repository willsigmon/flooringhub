const { before, test } = require('node:test');
const assert = require('node:assert/strict');
const { Writable } = require('node:stream');

let handler;
let defaultResponse;

function createResponse() {
  const chunks = [];
  const response = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    }
  });
  response.statusCode = 0;
  response.statusMessage = '';
  response.headers = new Map();
  response.setHeader = function (name, value) {
    this.headers.set(name.toLowerCase(), String(value));
  };
  response.bodyChunks = chunks;
  return response;
}

async function render(url) {
  const response = createResponse();
  const finished = new Promise((resolve, reject) => {
    response.once('finish', resolve);
    response.once('error', reject);
  });
  await handler({ url }, response);
  await finished;
  response.body = Buffer.concat(response.bodyChunks);
  return response;
}

function assertPng(response) {
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.equal(
    response.headers.get('cache-control'),
    process.env.NODE_ENV === 'development'
      ? 'no-cache, no-store'
      : 'public, immutable, no-transform, max-age=31536000'
  );
  assert.ok(response.body);
  assert.deepEqual(response.body.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal(response.body.readUInt32BE(16), 1200);
  assert.equal(response.body.readUInt32BE(20), 630);
}

before(async () => {
  handler = (await import('../api/og.ts')).default;
  defaultResponse = await render('/api/og');
});

test('Node API handler returns the default 1200x630 PNG', () => {
  assertPng(defaultResponse);
});

test('Node API handler uses defaults for empty query parameters', async () => {
  const emptyResponse = await render('/api/og?title=&subtitle=&eyebrow=');

  assertPng(emptyResponse);
  assert.deepEqual(emptyResponse.body, defaultResponse.body);
});

test('Node API handler rejects malformed request URLs without writing a response', async () => {
  const response = createResponse();

  await assert.rejects(handler({ url: 'http://[' }, response), TypeError);
  assert.equal(response.statusCode, 0);
  assert.equal(response.bodyChunks.length, 0);
});

test('Node API handler returns a distinct PNG for custom query parameters', async () => {
  const query = new URLSearchParams({
    title: 'Hardwood Flooring in Raleigh',
    subtitle: 'Installation and refinishing across the Triangle',
    eyebrow: 'Flooring Hub | Raleigh'
  });
  const customResponse = await render(`/api/og?${query}`);

  assertPng(customResponse);
  assert.notDeepEqual(customResponse.body, defaultResponse.body);
});
