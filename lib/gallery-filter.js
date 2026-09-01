/**
 * Gallery filter + empty-state helpers.
 * Shared by the homepage script and Node tests. No invented categories.
 */
'use strict';

function tileMatchesFilter(cat, filter) {
  if (!filter || filter === 'all') {
    return true;
  }
  return cat === filter;
}

function readFilterValue(node) {
  if (!node) {
    return '';
  }
  if (typeof node.getAttribute === 'function') {
    return node.getAttribute('data-filter') || '';
  }
  return node.filter || '';
}

function readTileCategory(tile) {
  if (!tile) {
    return '';
  }
  if (typeof tile.getAttribute === 'function') {
    return tile.getAttribute('data-cat') || '';
  }
  return tile.cat || '';
}

function applyGalleryFilter(tiles, filter) {
  var visibleCount = 0;
  var list = Array.prototype.slice.call(tiles || []);

  list.forEach(function (tile) {
    var match = tileMatchesFilter(readTileCategory(tile), filter);
    if (match) {
      visibleCount += 1;
    }

    if (tile && tile.classList) {
      tile.classList.toggle('is-hidden', !match);
      tile.classList.remove('is-dim');
    }

    if (tile && 'hidden' in tile) {
      tile.hidden = !match;
    }
  });

  return {
    filter: filter || 'all',
    visibleCount: visibleCount,
    empty: visibleCount === 0
  };
}

function syncGalleryEmptyState(emptyEl, result) {
  if (!emptyEl) {
    return result;
  }

  emptyEl.hidden = !result.empty;
  if (emptyEl.classList) {
    emptyEl.classList.toggle('is-visible', result.empty);
  }

  return result;
}

function setActiveFilterControl(controls, filter) {
  var list = Array.prototype.slice.call(controls || []);

  list.forEach(function (control) {
    var active = readFilterValue(control) === filter;
    if (control && control.classList) {
      control.classList.toggle('is-active', active);
    }
    if (control && typeof control.setAttribute === 'function') {
      control.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
  });
}

var api = {
  tileMatchesFilter: tileMatchesFilter,
  applyGalleryFilter: applyGalleryFilter,
  syncGalleryEmptyState: syncGalleryEmptyState,
  setActiveFilterControl: setActiveFilterControl
};

if (typeof module === 'object' && module.exports) {
  module.exports = api;
}

if (typeof globalThis !== 'undefined') {
  globalThis.FlooringHubGalleryFilter = api;
}
