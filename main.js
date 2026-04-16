/* ============================================
   FLOORING HUB - Main JavaScript
   Premium animations, parallax, counters
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Scroll Animations (IntersectionObserver) ----
  // Stagger children in grids automatically
  function applyStagger(container) {
    var children = container.querySelectorAll('.fade-up, .fade-right, .scale-in');
    children.forEach(function (child, i) {
      var delay = Math.min(i, 8) * 0.08;
      child.style.transitionDelay = delay + 's';
    });
  }

  // Observe grids for staggering
  document.querySelectorAll('.features-grid, .services-grid, .testimonial-grid, .exclusives-grid').forEach(function (grid) {
    applyStagger(grid);
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -30px 0px'
  });

  document.querySelectorAll('.fade-up, .fade-right, .scale-in, .section-label').forEach(function (el) {
    observer.observe(el);
  });

  // ---- Nav scroll state ----
  var nav = document.getElementById('nav');

  window.addEventListener('scroll', function () {
    var scrollY = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollY > 80) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });

  // ---- Hero feature image crossfade rotator ----
  var heroImages = document.querySelectorAll('.hero-feature-img');
  if (heroImages.length > 1 && !prefersReducedMotion) {
    var heroIdx = 0;
    setInterval(function () {
      heroImages[heroIdx].classList.remove('is-active');
      heroIdx = (heroIdx + 1) % heroImages.length;
      heroImages[heroIdx].classList.add('is-active');
    }, 5500);
  }

  // ---- Hero feature subtle parallax on scroll ----
  var heroFeature = document.querySelector('.hero-feature');
  if (heroFeature && !prefersReducedMotion) {
    window.addEventListener('scroll', function () {
      var scrollY = window.pageYOffset;
      if (scrollY < window.innerHeight) {
        heroFeature.style.transform = 'translateY(' + (scrollY * -0.08) + 'px)';
      }
    }, { passive: true });
  }

  // ---- Stat counter animation ----
  var statNums = document.querySelectorAll('.stat-num');
  if (statNums.length > 0) {
    var statsObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statNums.forEach(function (el) {
      statsObserver.observe(el);
    });
  }

  function animateCounter(el) {
    var text = el.textContent.trim();
    var suffix = '';
    var target = 0;

    // Parse "25+", "500+", "5.0"
    if (text.indexOf('+') !== -1) {
      suffix = '+';
      target = parseInt(text.replace('+', ''), 10);
    } else if (text.indexOf('.') !== -1) {
      target = parseFloat(text);
      suffix = '';
    } else {
      target = parseInt(text, 10);
    }

    var isFloat = text.indexOf('.') !== -1;
    var duration = 1200;
    var start = performance.now();

    el.classList.add('counting');

    function step(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      var ease = 1 - Math.pow(1 - progress, 3);
      var current = ease * target;

      if (isFloat) {
        el.textContent = current.toFixed(1) + suffix;
      } else {
        el.textContent = Math.floor(current) + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = text;
      }
    }

    requestAnimationFrame(step);
  }

  // ---- Haptic feedback (mobile vibration) ----
  function haptic(style) {
    if (!navigator.vibrate) return;
    switch (style) {
      case 'light': navigator.vibrate(10); break;
      case 'medium': navigator.vibrate(20); break;
      case 'heavy': navigator.vibrate([15, 30, 15]); break;
      default: navigator.vibrate(10);
    }
  }

  function trackEvent(name, data) {
    if (typeof window.va === 'function') {
      window.va('event', name, data || {});
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, data || {});
    }
  }

  function trackCtaEvent(el, action) {
    if (!el || !el.getAttribute) return;
    var cta = el.getAttribute('data-cta');
    if (!cta) return;
    trackEvent(action || 'cta_click', {
      cta: cta,
      label: cta,
      section: (el.closest('section') && el.closest('section').getAttribute('id')) || 'unknown'
    });
  }

  function setButtonState(button, enabled, label) {
    if (!button) return;
    button.disabled = !enabled;
    if (typeof label === 'string') {
      button.textContent = label;
    }
  }

  function populateUtmFields() {
    var params = new URLSearchParams(window.location.search);
    var utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    utmFields.forEach(function (key) {
      var field = document.getElementById(key);
      var val = params.get(key);
      if (field && val) {
        field.value = val;
      }
    });
    var pageField = document.getElementById('leadPage');
    if (pageField) {
      pageField.value = window.location.pathname;
    }
  }

  function showFormState(formStatus, message, isError) {
    if (!formStatus) return;
    formStatus.textContent = message || '';
    formStatus.classList.toggle('is-error', isError === true);
    formStatus.classList.toggle('is-success', isError === false);
    if (message === '') {
      formStatus.classList.remove('is-error', 'is-success');
    }
  }

  function setFieldError(field, isError, message) {
    var key = field.getAttribute('id');
    if (!key) return;
    var group = field.closest('.form-group');
    if (!group) return;

    var errorEl = group.querySelector('.field-error');
    if (!errorEl && isError) {
      errorEl = document.createElement('span');
      errorEl.className = 'field-error';
      group.appendChild(errorEl);
    }

    if (errorEl) {
      if (isError) {
        errorEl.textContent = message;
      } else {
        errorEl.textContent = '';
      }
    }

    field.classList.toggle('is-invalid', Boolean(isError));
    field.setAttribute('aria-invalid', isError ? 'true' : 'false');
  }

  function validateLeadForm(form) {
    var requiredFields = form.querySelectorAll('[required]');
    var hasError = false;
    var email = form.querySelector('#email');
    var phone = form.querySelector('#phone');
    var firstName = form.querySelector('#firstName');
    var lastName = form.querySelector('#lastName');
    var service = form.querySelector('#service');
    var details = form.querySelector('#details');

    requiredFields.forEach(function (field) {
      setFieldError(field, false);
    });

    [firstName, lastName, email].forEach(function (field) {
      if (!field.value.trim()) {
        setFieldError(field, true, 'This field is required.');
        hasError = true;
      }
    });

    if (email && email.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
      setFieldError(email, true, 'Please enter a valid email.');
      hasError = true;
    }

    if (service && service.value.length === 0) {
      setFieldError(service, true, 'Please choose a service.');
      hasError = true;
    }

    if (phone && phone.value && phone.value.replace(/\D/g, '').length < 10) {
      setFieldError(phone, true, 'Please enter a valid phone number.');
      hasError = true;
    }

    if (details && details.value.trim().length > 500) {
      setFieldError(details, true, 'Please keep details under 500 characters.');
      hasError = true;
    }

    return hasError;
  }

  function initGaMeasurementId() {
    var meta = document.querySelector('meta[name="ga-measurement-id"]');
    if (!meta || !meta.content) {
      return;
    }

    var measurementId = meta.content.trim();
    if (!measurementId || typeof window.gtag === 'function') {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure'
    });

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    document.head.appendChild(script);
  }

  function submitLeadForm(event) {
    event.preventDefault();
    var form = event.target;
    var formStatus = document.getElementById('leadFormStatus');
    var submitBtn = form.querySelector('.form-submit');
    var buttonId = form.querySelector('button[data-cta]') ? form.querySelector('button[data-cta]').getAttribute('data-cta') : 'lead-submit';

    if (submitBtn) {
      trackCtaEvent(submitBtn, 'lead_submit_attempt');
    }

    if (validateLeadForm(form)) {
      showFormState(formStatus, 'Please fix the highlighted fields and try again.', true);
      trackEvent('lead_validation_error', {
        cta: buttonId,
        section: 'lead_form'
      });
      return;
    }

    var honeypotField = form.querySelector('#leadHoneypot');
    var hp = honeypotField ? honeypotField.value : '';
    if (hp) {
      showFormState(formStatus, 'Submission blocked.', true);
      trackEvent('lead_bot_blocked', {
        cta: buttonId,
        section: 'lead_form'
      });
      return;
    }

    var originalBtnLabel = submitBtn ? submitBtn.textContent : '';
    setButtonState(submitBtn, false, 'Submitting...');

    showFormState(formStatus, 'Submitting your request...');
    var buttonField = document.getElementById('leadButton');
    if (buttonField) {
      buttonField.value = buttonId;
    }

    var formData = new FormData(form);
    var payload = {};
    formData.forEach(function (value, key) {
      payload[key] = (value || '').toString().trim();
    });

    fetch('/api/lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        return response.text().then(function (rawText) {
          var parsed;
          try {
            parsed = rawText ? JSON.parse(rawText) : {};
          } catch (error) {
            parsed = { message: rawText || 'Invalid server response.' };
          }
          return { ok: response.ok, status: response.status, data: parsed };
        });
      })
      .then(function (result) {
        if (result.data && result.data.duplicate) {
          showFormState(formStatus, 'You already submitted this request recently. Tom will reach out shortly.', false);
          trackEvent('lead_duplicate', {
            cta: buttonId,
            section: 'lead_form'
          });
          return;
        }

        if (!result.ok || !result.data || result.data.ok !== true) {
          throw new Error((result.data && result.data.message) || ('Unable to submit your request. Please try again. (' + result.status + ')'));
        }

        var utmCampaignField = form.querySelector('#utm_campaign');
        var utmMediumField = form.querySelector('#utm_medium');
        trackEvent('lead_submit', {
          campaign: (utmCampaignField && utmCampaignField.value) || 'n/a',
          service: payload.service || 'unknown',
          medium: (utmMediumField && utmMediumField.value) || 'direct',
          button: buttonId
        });
        showFormState(formStatus, 'Thanks! Your request was sent successfully.', false);
        form.reset();
        populateUtmFields();
        setTimeout(function () {
          window.location.assign('thank-you.html');
        }, 900);
      })
      .catch(function (error) {
        showFormState(formStatus, error.message || 'Network issue. Please try again in a moment.', true);
        trackEvent('lead_submit_error', {
          cta: buttonId,
          section: 'lead_form',
          error: String(error && error.message || 'unknown')
        });
      })
      .finally(function () {
        setButtonState(submitBtn, true, originalBtnLabel || 'Request Free Estimate');
      });
  }

  function initCtaTracking() {
    document.querySelectorAll('[data-cta]').forEach(function (el) {
      el.addEventListener('click', function () {
        trackCtaEvent(el, 'cta_click');
      });

      if (el.tagName === 'A' && el.getAttribute('href') === '#') {
        el.addEventListener('click', function (event) {
          event.preventDefault();
        });
      }
    });
  }

  // Haptics on all buttons, CTAs, and interactive elements
  document.querySelectorAll('.btn, .btn-primary, .btn-ghost, .btn-outline, .nav-cta, .mobile-cta-btn, .form-submit, .faq-question, .nav-toggle').forEach(function (el) {
    el.addEventListener('touchstart', function () { haptic('light'); }, { passive: true });
  });

  var leadForm = document.getElementById('leadForm');
  if (leadForm) {
    populateUtmFields();
    leadForm.addEventListener('submit', submitLeadForm);
    leadForm.addEventListener('submit', function () { haptic('medium'); });
  }

  initGaMeasurementId();
  initCtaTracking();

  // ---- Mobile nav toggle ----
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      toggle.classList.toggle('active');
      links.classList.toggle('open');
    });

    links.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        toggle.classList.remove('active');
        links.classList.remove('open');
      });
    });
  }

  // ---- FAQ Accordion ----
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.parentElement;
      var isOpen = item.classList.contains('open');

      document.querySelectorAll('.faq-item').forEach(function (faq) {
        faq.classList.remove('open');
        faq.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ---- Smooth scroll for anchor links ----
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        var offset = nav.offsetHeight + 20;
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  // ---- Mobile sticky CTA (show after hero) ----
  var mobileCta = document.getElementById('mobileCta');
  if (mobileCta) {
    window.addEventListener('scroll', function () {
      var scrollY = window.pageYOffset;
      if (scrollY > window.innerHeight * 0.6) {
        mobileCta.classList.add('visible');
      } else {
        mobileCta.classList.remove('visible');
      }
    }, { passive: true });
  }

  // ---- Before / After comparison slider ----
  var baSlider = document.querySelector('[data-ba]');
  if (baSlider) {
    var baHandle = baSlider.querySelector('.ba-handle');
    var baBefore = baSlider.querySelector('.ba-before img, .ba-before');
    var baBeforeImg = baSlider.querySelector('.ba-before');
    var baAfterImg = baSlider.querySelector('.ba-after');
    var baCaption = document.querySelector('[data-ba-caption]');
    var baTabs = document.querySelectorAll('[data-ba-tab]');
    var baDragging = false;

    function setBaPos(pct) {
      pct = Math.max(0, Math.min(100, pct));
      baSlider.style.setProperty('--ba-pos', pct + '%');
      if (baHandle) baHandle.setAttribute('aria-valuenow', Math.round(pct));
    }

    function pointFromEvent(e) {
      var rect = baSlider.getBoundingClientRect();
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      return ((clientX - rect.left) / rect.width) * 100;
    }

    function onMove(e) {
      if (!baDragging) return;
      e.preventDefault();
      setBaPos(pointFromEvent(e));
    }

    function onDown(e) {
      baDragging = true;
      setBaPos(pointFromEvent(e));
      document.body.style.cursor = 'ew-resize';
    }

    function onUp() {
      baDragging = false;
      document.body.style.cursor = '';
    }

    baSlider.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    // Keyboard support on the handle
    if (baHandle) {
      baHandle.addEventListener('keydown', function (e) {
        var current = parseFloat(getComputedStyle(baSlider).getPropertyValue('--ba-pos')) || 50;
        if (e.key === 'ArrowLeft') { setBaPos(current - 4); e.preventDefault(); }
        if (e.key === 'ArrowRight') { setBaPos(current + 4); e.preventDefault(); }
        if (e.key === 'Home') { setBaPos(0); e.preventDefault(); }
        if (e.key === 'End') { setBaPos(100); e.preventDefault(); }
      });
    }

    // Tab switching
    baTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        baTabs.forEach(function (t) { t.classList.remove('is-active'); });
        tab.classList.add('is-active');
        var before = tab.getAttribute('data-before');
        var after = tab.getAttribute('data-after');
        var caption = tab.getAttribute('data-caption');
        if (baBeforeImg) baBeforeImg.src = before;
        if (baAfterImg) baAfterImg.src = after;
        if (baCaption) baCaption.textContent = caption;
        setBaPos(50);
      });
    });

    // Initial nudge hint on first viewport entry
    if (!prefersReducedMotion) {
      var baObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setBaPos(60);
            setTimeout(function () { setBaPos(40); }, 550);
            setTimeout(function () { setBaPos(50); }, 1100);
            baObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      baObserver.observe(baSlider);
    }
  }

  // ---- Gallery filter pills ----
  var galleryPills = document.querySelectorAll('.g-pill');
  var galleryTiles = document.querySelectorAll('.g-tile');
  if (galleryPills.length && galleryTiles.length) {
    galleryPills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        galleryPills.forEach(function (p) { p.classList.remove('is-active'); });
        pill.classList.add('is-active');
        var filter = pill.getAttribute('data-filter');
        galleryTiles.forEach(function (tile) {
          var cat = tile.getAttribute('data-cat');
          if (filter === 'all' || cat === filter) {
            tile.classList.remove('is-dim');
          } else {
            tile.classList.add('is-dim');
          }
        });
      });
    });
  }

  // ---- Active nav link highlighting ----
  var sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', function () {
    var scrollY = window.pageYOffset + 120;
    sections.forEach(function (section) {
      var top = section.offsetTop;
      var height = section.offsetHeight;
      var id = section.getAttribute('id');
      var link = document.querySelector('.nav-links a[href="#' + id + '"]');
      if (link) {
        if (scrollY >= top && scrollY < top + height) {
          link.style.color = 'rgba(255,255,255,1)';
        } else {
          link.style.color = '';
        }
      }
    });
  }, { passive: true });

});
