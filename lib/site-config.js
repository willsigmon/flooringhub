(() => {
  "use strict";

  const CONFIG = {
    companyName: 'Flooring Hub',
    phone: '+13305730370',
    phoneDisplay: '(330) 573-0370',
    email: 'tsmith@flooringhubnc.com',
    social: {
      facebook: 'https://www.facebook.com/p/Flooring-Hub-61578767536673/',
      instagram: 'https://www.instagram.com/flooringhubnc/'
    }
  };

  window.FLOORING_HUB_CONFIG = Object.freeze(CONFIG);

  // Progressive enhancement configuration mapper
  const syncConfig = () => {
    // Sync phone attributes (links + texts)
    document.querySelectorAll('[data-config-phone]').forEach(el => {
      const mode = el.getAttribute('data-config-phone');
      if (el.tagName === 'A') {
        el.href = 'tel:' + CONFIG.phone;
        if (mode === 'text') el.textContent = CONFIG.phoneDisplay;
      } else {
        el.textContent = CONFIG.phoneDisplay;
      }
    });

    // Sync email attributes (links + texts)
    document.querySelectorAll('[data-config-email]').forEach(el => {
      const mode = el.getAttribute('data-config-email');
      if (el.tagName === 'A') {
        el.href = 'mailto:' + CONFIG.email;
        if (mode === 'text') el.textContent = CONFIG.email;
      } else {
        el.textContent = CONFIG.email;
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncConfig);
  } else {
    syncConfig();
  }
})();
