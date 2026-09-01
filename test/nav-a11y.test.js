const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { applyNavOpen, shouldCloseNavOnKey } = require("../lib/nav-a11y");

function fakeEl() {
  const classes = new Set();
  const attrs = {};
  return {
    classList: {
      toggle(name, force) {
        if (force) classes.add(name);
        else classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      }
    },
    setAttribute(name, value) {
      attrs[name] = value;
    },
    getAttribute(name) {
      return attrs[name];
    }
  };
}

describe("nav a11y leftover", () => {
  it("sets aria-expanded and open classes together", () => {
    const toggle = fakeEl();
    const links = fakeEl();
    const state = applyNavOpen(toggle, links, true);
    assert.equal(state.ariaExpanded, "true");
    assert.equal(toggle.getAttribute("aria-expanded"), "true");
    assert.equal(toggle.classList.contains("active"), true);
    assert.equal(links.classList.contains("open"), true);
  });

  it("closes without inventing a default-open menu", () => {
    const toggle = fakeEl();
    const links = fakeEl();
    applyNavOpen(toggle, links, true);
    const closed = applyNavOpen(toggle, links, false);
    assert.equal(closed.ariaExpanded, "false");
    assert.equal(toggle.classList.contains("active"), false);
    assert.equal(links.classList.contains("open"), false);
  });

  it("treats Escape as the close key", () => {
    assert.equal(shouldCloseNavOnKey("Escape"), true);
    assert.equal(shouldCloseNavOnKey("Esc"), true);
    assert.equal(shouldCloseNavOnKey("Enter"), false);
  });
});
