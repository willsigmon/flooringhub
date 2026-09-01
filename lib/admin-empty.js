(() => {
  "use strict";

  const COPY = {
    noscript:
      "This page needs JavaScript to read Jobber connection status. It does not show live Jobber jobs or requests. Call Tom at (330) 573-0370 if you need help connecting.",
    unreachable:
      "Could not reach Jobber status. No tokens or live Jobber jobs are shown here.",
    checksEmpty: "Server checks did not load. No Jobber live data is shown here."
  };

  const api = { COPY };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (typeof window !== "undefined") {
    window.FLOORING_HUB_ADMIN_EMPTY = api;
  }
})();
