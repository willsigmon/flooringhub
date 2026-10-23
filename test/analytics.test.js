'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('every served HTML page includes both queues, scripts, and the shared listener once', () => {
  for (const file of ['index.html', '404.html', 'privacy.html', 'terms.html', 'thank-you.html', 'admin/jobber.html']) {
    const head = read(file).split('</head>')[0];
    for (const value of ['window.va=', 'window.si=', '/_vercel/insights/script.js', '/_vercel/speed-insights/script.js', 'lib/site-config.js']) {
      assert.equal(head.split(value).length - 1, 1, `${file}: ${value}`);
    }
  }
});

test('delegated taps use the event payload contract without collecting link values', () => {
  const events = [];
  const listeners = {};
  const window = {
    location: { href: 'https://example.com/', origin: 'https://example.com', pathname: '/' },
    va: (...args) => events.push(args)
  };
  const document = { readyState: 'loading', addEventListener: (name, fn) => { listeners[name] = fn; } };
  vm.runInNewContext(read('lib/site-config.js'), { window, document, URL });
  for (const [href, name] of [['tel:private', 'Call Tap'], ['sms:private', 'Text Tap'], ['#quote', 'Estimate Tap'], ['index.html#quote', 'Estimate Tap']]) {
    const link = { getAttribute: () => href, closest: () => ({ id: 'hero' }) };
    listeners.click({ target: { closest: () => link } });
    assert.deepEqual(JSON.parse(JSON.stringify(events.pop())), ['event', { name, data: { location: 'hero' } }]);
  }
  for (const href of ['#gallery', 'https://external.example/#quote']) {
    listeners.click({ target: { closest: () => ({ getAttribute: () => href, closest: () => null }) } });
  }
  assert.equal(events.length, 0);
  delete window.va;
  assert.doesNotThrow(() => listeners.click({ target: { closest: () => ({ getAttribute: () => 'tel:private', closest: () => null }) } }));
});

test('estimate submission event follows rejection and duplicate handling, before redirect', () => {
  const source = read('main.js');
  const event = source.indexOf("name: 'Estimate Submit'");
  assert.ok(event > source.indexOf('if (result.data && result.data.duplicate)'));
  assert.ok(event > source.indexOf('if (!result.ok || !result.data || result.data.ok !== true)'));
  assert.ok(event < source.indexOf("window.location.assign('thank-you.html')"));
  assert.equal(source.split("name: 'Estimate Submit'").length - 1, 1);
});
