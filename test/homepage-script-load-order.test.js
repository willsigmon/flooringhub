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

describe('homepage classic-script load order', () => {
  it('loads lead-form-validate, nav-a11y, and gallery-filter in the same global scope without redeclaring `api`', () => {
    // index.html loads these as classic (non-module) <script src> tags in this
    // order, so -- like a browser -- they all share one top-level lexical
    // scope. Both lead-form-validate.js and gallery-filter.js used to declare
    // an unwrapped top-level `api`, which threw `SyntaxError: Identifier 'api'
    // has already been declared` the instant the second one parsed, so
    // gallery-filter.js never ran and the gallery filter pills silently did
    // nothing. Regression test for that collision.
    const sandbox = vm.createContext({ window: {}, module: undefined });
    assert.doesNotThrow(() => {
      vm.runInContext(read('lib/lead-form-validate.js'), sandbox, { filename: 'lead-form-validate.js' });
      vm.runInContext(read('lib/nav-a11y.js'), sandbox, { filename: 'nav-a11y.js' });
      vm.runInContext(read('lib/gallery-filter.js'), sandbox, { filename: 'gallery-filter.js' });
    });

    assert.equal(typeof sandbox.window.LeadFormValidate, 'object');
    assert.equal(typeof sandbox.window.FLOORING_HUB_NAV_A11Y, 'object');
    assert.equal(typeof sandbox.FlooringHubGalleryFilter, 'object');
    assert.equal(typeof sandbox.FlooringHubGalleryFilter.applyGalleryFilter, 'function');
  });

  it('index.html still loads the three libs before main.js in this order', () => {
    const html = read('index.html');
    const order = ['lib/lead-form-validate.js', 'lib/nav-a11y.js', 'lib/gallery-filter.js', 'main.js'];
    let cursor = -1;
    for (const src of order) {
      const idx = html.indexOf(`src="${src}"`);
      assert.ok(idx > cursor, `${src} should appear after the previous script`);
      cursor = idx;
    }
  });
});
