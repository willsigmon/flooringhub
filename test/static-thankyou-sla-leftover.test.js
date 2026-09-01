'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(rel) {
  return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
}

function attr(html, name) {
  const match = html.match(new RegExp(`${name}="([^"]*)"`));
  assert.ok(match, `${name} is present`);
  return match[1];
}

describe('static leftover: invented thank-you callback SLA', () => {
  it('OG, Twitter, and description match the visible “usually” copy', () => {
    const html = read('thank-you.html');
    const og = attr(html, 'property="og:description" content');
    const twitter = attr(html, 'name="twitter:description" content');
    const description = attr(html, 'name="description" content');

    for (const text of [og, twitter, description]) {
      assert.match(text, /usually responds within 24 hours/i);
      assert.doesNotMatch(text, /will reach out within 24 hours/i);
    }
  });

  it('visible thank-you body still says usually, not a hard callback guarantee', () => {
    const html = read('thank-you.html');
    const main = html.match(/<main[\s\S]*?<\/main>/);
    assert.ok(main, 'thank-you main is present');
    assert.match(main[0], /usually responds within 24 hours/i);
    assert.doesNotMatch(main[0], /will reach out within 24 hours/i);
  });

  it('does not invent a replacement same-day or one-hour SLA', () => {
    const html = read('thank-you.html');
    assert.doesNotMatch(html, /same[\s-]day/i);
    assert.doesNotMatch(html, /within an hour/i);
    assert.doesNotMatch(html, /within 1 hour/i);
  });
});
