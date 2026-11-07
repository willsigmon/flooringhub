/* Client Care: invisible Cloudflare Turnstile for static forms. Asks the
   same-origin endpoint for the public site key; no-op when none is set. The
   widget injects a hidden cf-turnstile-response input into the form. */
(function () {
  var forms = document.querySelectorAll('form[data-turnstile-form]');
  if (!forms.length) return;
  var endpoint = forms[0].getAttribute('action') || '/api/contact';
  fetch(endpoint, { headers: { Accept: 'application/json' } })
    .then(function (r) { return r.ok ? r.json() : {}; })
    .then(function (cfg) {
      if (!cfg || !cfg.turnstileSiteKey) return;
      window.__cfTurnstileReady = function () {
        forms.forEach(function (form) {
          var slot = document.createElement('div');
          slot.className = 'turnstile-slot';
          var btn = form.querySelector('[type="submit"]');
          form.insertBefore(slot, btn ? btn.closest('form > *') || btn : null);
          var id = window.turnstile.render(slot, { sitekey: cfg.turnstileSiteKey, action: 'contact', appearance: 'interaction-only' });
          form.addEventListener('turnstile:reset', function () { window.turnstile.reset(id); });
          // Tokens are single-use: after the submit handler has read it, fetch a fresh one.
          form.addEventListener('submit', function () { window.setTimeout(function () { window.turnstile.reset(id); }, 0); });
        });
      };
      var s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__cfTurnstileReady';
      s.async = true; s.defer = true;
      document.head.appendChild(s);
    })
    .catch(function () {});
})();
