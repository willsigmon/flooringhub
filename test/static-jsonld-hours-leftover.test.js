'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(rel) {
  return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
}

function homepageJsonLd() {
  const html = read('index.html');
  const match = html.match(
    /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/
  );
  assert.ok(match, 'homepage JSON-LD script is present');
  return JSON.parse(match[1]);
}

describe('static leftover: invented store hours', () => {
  it('JSON-LD does not publish a storefront schedule the homepage never shows', () => {
    const data = homepageJsonLd();
    assert.equal(data['@type'], 'HomeAndConstructionBusiness');
    assert.equal(data.openingHoursSpecification, undefined);
    assert.equal(data.openingHours, undefined);
  });

  it('homepage markup does not invent Mon–Fri 08:00–18:00 hours', () => {
    const html = read('index.html');
    assert.doesNotMatch(html, /openingHoursSpecification/);
    assert.doesNotMatch(html, /"opens": "08:00"/);
    assert.doesNotMatch(html, /"closes": "18:00"/);
  });

  it('site-config does not keep an unused hours string', () => {
    const src = read('lib/site-config.js');
    assert.doesNotMatch(src, /\bhours\b/);
    assert.doesNotMatch(src, /8am\s*-\s*6pm/i);
    assert.doesNotMatch(src, /M-F/);
  });
});
