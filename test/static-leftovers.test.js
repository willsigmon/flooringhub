'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

describe('static leftovers', () => {
  it('loads the real Flooring Hub contact facts without inventing a number', () => {
    const document = {
      readyState: 'complete',
      querySelectorAll() {
        return [];
      }
    };
    const sandbox = { window: { document }, document };
    vm.runInNewContext(read('lib/site-config.js'), sandbox);

    assert.equal(sandbox.window.FLOORING_HUB_CONFIG.phone, '+13305730370');
    assert.equal(sandbox.window.FLOORING_HUB_CONFIG.phoneDisplay, '(330) 573-0370');
    assert.equal(sandbox.window.FLOORING_HUB_CONFIG.email, 'tsmith@flooringhubnc.com');
  });

  it('keeps legal and thank-you canonicals on the live .html files', () => {
    assert.match(read('privacy.html'), /rel="canonical" href="https:\/\/www\.flooringhubnc\.com\/privacy\.html"/);
    assert.match(read('terms.html'), /rel="canonical" href="https:\/\/www\.flooringhubnc\.com\/terms\.html"/);
    assert.match(read('thank-you.html'), /rel="canonical" href="https:\/\/www\.flooringhubnc\.com\/thank-you\.html"/);
    assert.match(read('sitemap.xml'), /https:\/\/www\.flooringhubnc\.com\/privacy\.html/);
    assert.match(read('sitemap.xml'), /https:\/\/www\.flooringhubnc\.com\/terms\.html/);
  });

  it('does not invent a 555 phone placeholder or a missing contact section', () => {
    assert.doesNotMatch(read('index.html'), /555/);
    assert.match(read('index.html'), /placeholder="Your phone number"/);
    assert.doesNotMatch(read('thank-you.html'), /contact section/);
    assert.match(read('thank-you.html'), /tel:\+13305730370/);
    assert.match(read('thank-you.html'), /mailto:tsmith@flooringhubnc.com/);
  });

  it('drops the empty GA leftover and the phantom site\/ mirror', () => {
    for (const file of ['index.html', 'privacy.html', 'terms.html', 'thank-you.html', 'main.js']) {
      assert.doesNotMatch(read(file), /ga-measurement-id/);
    }
    assert.equal(fs.existsSync(path.join(root, 'site')), false);
    assert.doesNotMatch(read('README.md'), /root \+ mirrored/);
    assert.doesNotMatch(read('.github/workflows/indexnow.yml'), /site\/scripts/);
    assert.doesNotMatch(read('admin/jobber.html'), /becomes a Request/);
  });

  it('keeps the public IndexNow key file aligned with the submit script', () => {
    const key = read('a887cf456f9b40fa967b57da4ff7e71f.txt').trim();
    assert.equal(key, 'a887cf456f9b40fa967b57da4ff7e71f');
    assert.match(read('scripts/submit-indexnow.mjs'), new RegExp(key));
  });
});
