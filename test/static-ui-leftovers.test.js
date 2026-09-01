const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
}

describe('static leftover honesty', () => {
  it('closes four sibling trust-sets so the -25% marquee can loop', () => {
    const html = read('index.html');
    const closed = html.match(/<div class="trust-set"[\s\S]*?<!-- \/trust-set -->/g) || [];
    assert.equal(closed.length, 4, 'expected four closed trust-set rows');
    closed.forEach((chunk) => {
      assert.equal(
        (chunk.match(/<div class="trust-set"/g) || []).length,
        1,
        'trust-sets must be siblings, not nested'
      );
    });
  });

  it('tags the Cary sand-and-refinish photo as refinish, not hardwood', () => {
    const html = read('index.html');
    assert.match(
      html,
      /<figure class="g-tile" data-cat="refinish">\s*<img[^>]+src="assets\/refinish-cary-1024w\.webp"/
    );
    assert.doesNotMatch(
      html,
      /<figure class="g-tile" data-cat="hardwood">\s*<img[^>]+src="assets\/refinish-cary-1024w\.webp"/
    );
  });

  it('exposes a gallery empty state instead of dimming leftover holes', () => {
    const html = read('index.html');
    assert.match(html, /id="galleryEmpty"/);
    assert.match(html, /No photos in this category are on the site yet/);
    assert.match(html, /class="gallery-empty-reset"[^>]*data-filter="all"/);
    assert.match(read('styles.css'), /\.g-tile\.is-hidden/);
    assert.match(read('main.js'), /FlooringHubGalleryFilter/);
  });

  it('does not invent homepage CRM, Jobber, or commercial-flooring claims', () => {
    const html = read('index.html');
    assert.doesNotMatch(html, /jobber-badge|lead inbox or CRM|source tracking built in/i);
    assert.doesNotMatch(html, /commercial flooring|custom inlays/i);
    assert.match(html, /class="lead-badge"/);
    assert.match(html, /Tom reads every request/);
    assert.match(html, /Residential homes in the Triangle/);
  });

  it('does not claim tile as a service line in Why Flooring Hub', () => {
    const html = read('index.html');
    const why = html.slice(html.indexOf('id="why"'), html.indexOf('id="process"'));
    assert.match(why, /hardwood, LVP, laminate, and carpet/);
    assert.doesNotMatch(why, /hardwood, laminate, tile, carpet/);
  });
});
