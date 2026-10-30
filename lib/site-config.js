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

  // Track only fixed event names and page regions, never link values or form data.
  document.addEventListener('click', (event) => {
    const link = event.target.closest && event.target.closest('a[href], [data-cta]');
    if (!link) return;
    const href = link.getAttribute('href');
    let name;
    if (/^tel:/i.test(href)) name = 'Call Tap';
    else if (/^sms:/i.test(href)) name = 'Text Tap';
    else if (/^mailto:/i.test(href)) name = 'Email Tap';
    else if (href) {
      const target = new URL(href, window.location.href);
      if (target.origin === window.location.origin && target.hash === '#quote') {
        name = 'Estimate Tap';
      }
    }
    // Canonical tap events take precedence over the generic CTA event.
    if (!name && link.hasAttribute('data-cta')) name = 'cta_click';
    if (!name) return;
    const location = link.closest('header, nav') ? 'header'
      : link.closest('footer') ? 'footer'
      : link.closest('#hero') ? 'hero'
      : link.closest('#quote') ? 'quote'
      : link.closest('#mobileCta') ? 'mobile'
      : 'content';
    if (typeof window.va === 'function') {
      window.va('event', { name, data: { location } });
    }
  }, true);

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
