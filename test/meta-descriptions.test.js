'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('description attributes have matching quotes and complete, consistent copy on every page', () => {
  for (const file of ['index.html', 'privacy.html', 'terms.html', 'thank-you.html', '404.html', 'admin/jobber.html']) {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const tags = (html.match(/<meta\b[^>]*>/g) || []).filter(tag => /(?:name|property)=["'](?:description|og:description|twitter:description)["']/.test(tag));
    assert.equal(tags.length, file === 'admin/jobber.html' ? 0 : file === '404.html' ? 1 : 3, file);
    const descriptions = tags.map(tag => {
      const match = tag.match(/content=(["'])(.*?)\1\s*\/?\s*>$/);
      assert.ok(match, `${file}: correctly closed content attribute`);
      assert.ok(match[2].endsWith('.'), `${file}: complete description`);
      return match[2];
    });
    assert.ok(descriptions.every(value => value === descriptions[0]), `${file}: social descriptions match`);
    if (file === 'index.html') {
      assert.equal(descriptions[0], 'Flooring Hub is Raleigh&#x27;s trusted flooring specialist. Over 25 years of expert hardwood, LVP, laminate, carpet installation. Free in-home estimates.');
    }
  }
});
