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

function tapHarness() {
  const events = [];
  const listeners = {};
  const window = {
    location: { href: 'https://example.com/private-path', origin: 'https://example.com' },
    va: (...args) => events.push(JSON.parse(JSON.stringify(args)))
  };
  const document = { readyState: 'loading', addEventListener: (name, fn, capture) => { listeners[name] = { fn, capture }; } };
  vm.runInNewContext(read('lib/site-config.js'), { window, document, URL });
  function click(href, region, cta = true) {
    const link = {
      getAttribute: () => href,
      hasAttribute: () => cta,
      closest: selector => selector === region ? {} : null
    };
    listeners.click.fn({ target: { closest: () => link } });
  }
  return { events, listeners, window, click };
}

test('one capture listener prioritizes canonical taps over generic CTA clicks', () => {
  const { events, listeners, click } = tapHarness();
  assert.equal(listeners.click.capture, true);
  for (const [href, name] of [['tel:private', 'Call Tap'], ['sms:private', 'Text Tap'], ['mailto:private', 'Email Tap'], ['#quote', 'Estimate Tap'], ['index.html#quote', 'Estimate Tap'], ['#gallery', 'cta_click'], [null, 'cta_click']]) {
    click(href, '#hero');
    assert.deepEqual(events.splice(0), [['event', { name, data: { location: 'hero' } }]]);
  }
  for (const href of ['#gallery', 'https://external.example/#quote']) click(href, null, false);
  assert.equal(events.length, 0);
});

test('tap placements are fixed labels, never paths or arbitrary element IDs', () => {
  const { events, window, click } = tapHarness();
  for (const [region, location] of [['header, nav', 'header'], ['footer', 'footer'], ['#hero', 'hero'], ['#quote', 'quote'], ['#mobileCta', 'mobile'], ['#private-id', 'content'], [null, 'content']]) {
    click('tel:private', region);
    assert.deepEqual(events.pop(), ['event', { name: 'Call Tap', data: { location } }]);
  }
  delete window.va;
  assert.doesNotThrow(() => click('tel:private', null));
});

async function submitEvents({ validation = false, honeypot = '', response = { ok: true }, rejected = false, noAnalytics = false } = {}) {
  const events = [];
  const listeners = {};
  const fields = {
    '#leadHoneypot': { value: honeypot },
    'button[data-cta]': { getAttribute: () => 'private-cta' }
  };
  const form = { querySelector: selector => fields[selector] || null, addEventListener: (name, fn) => { (listeners[name] ||= []).push(fn); }, reset() {} };
  const document = {
    addEventListener: (name, fn) => { if (name === 'DOMContentLoaded') fn(); },
    querySelectorAll: () => [], querySelector: () => null,
    getElementById: id => id === 'leadForm' ? form : null
  };
  const window = {
    location: { search: '?utm_campaign=private-campaign', pathname: '/private-path', assign() {} },
    addEventListener() {},
    LeadFormValidate: { validateLeadFields: () => ({ ok: !validation, errors: {} }) }
  };
  if (!noAnalytics) window.va = (...args) => events.push(JSON.parse(JSON.stringify(args)));
  vm.runInNewContext(read('main.js'), {
    window, document, navigator: {}, URLSearchParams,
    IntersectionObserver: function () {},
    FormData: class { forEach(fn) { fn('private-service', 'service'); fn('private-email', 'email'); } },
    fetch: () => rejected ? Promise.reject(new Error('private-server-error')) : Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify(response)) }),
    setTimeout() {}
  });
  for (const listener of listeners.submit) listener({ preventDefault() {}, target: form });
  await new Promise(resolve => setImmediate(resolve));
  return events;
}

test('form outcomes use the Vercel contract and fixed placements without form or error values', async () => {
  for (const [options, outcome] of [
    [{}, 'Estimate Submit'],
    [{ validation: true }, 'lead_validation_error'],
    [{ honeypot: 'private-bot' }, 'lead_bot_blocked'],
    [{ response: { duplicate: true } }, 'lead_duplicate'],
    [{ response: { ok: false, message: 'private-server-error' } }, 'lead_submit_error'],
    [{ rejected: true }, 'lead_submit_error']
  ]) {
    assert.deepEqual(await submitEvents(options), [
      ['event', { name: 'lead_submit_attempt', data: { location: 'quote' } }],
      ['event', { name: outcome, data: { location: 'quote' } }]
    ]);
  }
  assert.deepEqual(await submitEvents({ noAnalytics: true }), []);
});
