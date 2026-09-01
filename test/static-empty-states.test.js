'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function uniqueTestimonialNames(html) {
  const firstSet = html.split('<!-- /.t-set -->')[0];
  const names = [...firstSet.matchAll(/<span class="t-author-name">([^<]+)<\/span>/g)].map((m) => m[1]);
  return [...new Set(names)];
}

describe('leftover empty states and honest copy', () => {
  it('ships a 404 empty state that sends people to Tom, not a marketplace', () => {
    const page = read('404.html');
    assert.match(page, /noindex/);
    assert.match(page, /This page is not on the site/);
    assert.match(page, /tel:\+13305730370/);
    assert.match(page, /\(330\) 573-0370/);
    assert.match(page, /mailto:tsmith@flooringhubnc.com/);
    assert.match(page, /href="\/"/);
    assert.doesNotMatch(page, /Jobber|CRM|marketplace|555|App Store|lead inbox/i);
    assert.doesNotMatch(page, /reviewCount|500\+|Secure lead intake/);
    assert.doesNotMatch(read('sitemap.xml'), /404\.html/);
    assert.match(page, /href="\/styles\.css"/);
    assert.match(read('styles.css'), /\.miss-page \.btn-outline \{[\s\S]*color: var\(--charcoal\)/);
  });

  it('gives the quote form and map an empty path when JS or the embed fails', () => {
    const home = read('index.html');
    assert.match(home, /<noscript[\s\S]*Call Tom[\s\S]*<\/noscript>/);
    assert.match(home, /class="map-fallback"/);
    assert.match(home, /Open the Triangle on Google Maps/);
    assert.doesNotMatch(home, /we likely service your area too/);
    assert.match(home, /If you are close but not listed[\s\S]*call Tom/);
    assert.match(read('main.js'), /aria-describedby/);
    assert.match(read('index.html'), /lead-form-validate\.js/);
  });

  it('keeps JSON-LD review count aligned with the unique testimonials on the page', () => {
    const home = read('index.html');
    const names = uniqueTestimonialNames(home);
    assert.equal(names.length, 9);
    assert.match(home, /"reviewCount": "9"/);
    for (const name of names) {
      assert.match(home, new RegExp(`"name": "${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    }
    assert.doesNotMatch(home, /"reviewCount": "1[0-9]"/);
  });

  it('stops the privacy page from inventing subcontractors or a budget field', () => {
    const privacy = read('privacy.html');
    assert.doesNotMatch(privacy, /subcontractors/i);
    assert.doesNotMatch(privacy, /budget information/i);
    assert.match(privacy, /material suppliers/);
    assert.match(privacy, /Tom installs/);
  });

  it('does not leak KV errors from Jobber status and shows an HTML empty state on OAuth start misconfig', () => {
    assert.doesNotMatch(read('api/jobber-status.js'), /message:\s*err\.message/);
    const start = read('api/oauth/jobber/start.js');
    assert.match(start, /Jobber connect is not configured/);
    assert.match(start, /text\/html/);
    assert.doesNotMatch(start, /will create Jobber Requests/);
  });
});
