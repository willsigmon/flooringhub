(() => {
  "use strict";

  function applyNavOpen(toggle, links, open) {
    const isOpen = Boolean(open);
    const state = {
      active: isOpen,
      open: isOpen,
      ariaExpanded: isOpen ? "true" : "false"
    };

    if (toggle && toggle.classList && typeof toggle.classList.toggle === "function") {
      toggle.classList.toggle("active", state.active);
    }
    if (toggle && typeof toggle.setAttribute === "function") {
      toggle.setAttribute("aria-expanded", state.ariaExpanded);
    }
    if (links && links.classList && typeof links.classList.toggle === "function") {
      links.classList.toggle("open", state.open);
    }

    return state;
  }

  function shouldCloseNavOnKey(key) {
    return key === "Escape" || key === "Esc";
  }

  const api = { applyNavOpen, shouldCloseNavOnKey };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (typeof window !== "undefined") {
    window.FLOORING_HUB_NAV_A11Y = api;
  }
})();
