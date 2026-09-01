const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  tileMatchesFilter,
  applyGalleryFilter,
  syncGalleryEmptyState,
  setActiveFilterControl
} = require('../lib/gallery-filter');

function fakeTile(cat) {
  const classes = new Set();
  return {
    cat,
    hidden: false,
    classList: {
      toggle(name, force) {
        if (force) {
          classes.add(name);
        } else {
          classes.delete(name);
        }
      },
      remove(name) {
        classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      }
    },
    getAttribute(name) {
      return name === 'data-cat' ? cat : null;
    }
  };
}

function fakeControl(filter) {
  const classes = new Set();
  const attrs = { 'data-filter': filter };
  return {
    filter,
    classList: {
      toggle(name, force) {
        if (force) {
          classes.add(name);
        } else {
          classes.delete(name);
        }
      },
      contains(name) {
        return classes.has(name);
      }
    },
    getAttribute(name) {
      return attrs[name] || null;
    },
    setAttribute(name, value) {
      attrs[name] = value;
    }
  };
}

describe('gallery filter', () => {
  it('treats all as a match for every category', () => {
    assert.equal(tileMatchesFilter('hardwood', 'all'), true);
    assert.equal(tileMatchesFilter('refinish', 'refinish'), true);
    assert.equal(tileMatchesFilter('hardwood', 'refinish'), false);
  });

  it('hides non-matching tiles and reports an empty filter', () => {
    const tiles = [fakeTile('hardwood'), fakeTile('lvp'), fakeTile('refinish')];
    tiles[0].classList.toggle('is-dim', true);

    const empty = applyGalleryFilter(tiles, 'carpet');
    assert.equal(empty.visibleCount, 0);
    assert.equal(empty.empty, true);
    assert.equal(tiles[0].hidden, true);
    assert.equal(tiles[0].classList.contains('is-hidden'), true);
    assert.equal(tiles[0].classList.contains('is-dim'), false);

    const refinish = applyGalleryFilter(tiles, 'refinish');
    assert.equal(refinish.visibleCount, 1);
    assert.equal(refinish.empty, false);
    assert.equal(tiles[2].hidden, false);
    assert.equal(tiles[0].hidden, true);
  });

  it('toggles the empty-state node without inventing photos', () => {
    const emptyEl = { hidden: true, classList: new Set() };
    emptyEl.classList = {
      store: new Set(),
      toggle(name, force) {
        if (force) {
          this.store.add(name);
        } else {
          this.store.delete(name);
        }
      }
    };

    syncGalleryEmptyState(emptyEl, { empty: true, visibleCount: 0, filter: 'carpet' });
    assert.equal(emptyEl.hidden, false);

    syncGalleryEmptyState(emptyEl, { empty: false, visibleCount: 2, filter: 'refinish' });
    assert.equal(emptyEl.hidden, true);
  });

  it('marks the active filter control with aria-pressed', () => {
    const controls = [fakeControl('all'), fakeControl('hardwood')];
    setActiveFilterControl(controls, 'hardwood');
    assert.equal(controls[0].getAttribute('aria-pressed'), 'false');
    assert.equal(controls[1].getAttribute('aria-pressed'), 'true');
    assert.equal(controls[1].classList.contains('is-active'), true);
  });
});
