/* ============================================
   FLOORING HUB - Main JavaScript
   Premium animations, parallax, counters
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

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

  // ---- Hero parallax on slideshow ----
  var heroSlides = document.querySelector('.hero-slideshow');
  if (heroSlides) {
    window.addEventListener('scroll', function () {
      var scrollY = window.pageYOffset;
      if (scrollY < window.innerHeight * 1.5) {
        heroSlides.style.transform = 'translateY(' + (scrollY * 0.2) + 'px)';
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

    if (email && email.value && !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email.value)) {
      setFieldError(email, true, 'Please enter a valid email.');
      hasError = true;
    }

    if (service && service.value.length === 0) {
      setFieldError(service, true, 'Please choose a service.');
      hasError = true;
    }

    if (phone && phone.value && phone.value.replace(/\\D/g, '').length < 10) {
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

    var hp = form.querySelector('#leadHoneypot').value;
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

        trackEvent('lead_submit', {
          campaign: form.querySelector('#utm_campaign').value || 'n/a',
          service: payload.service || 'unknown',
          medium: form.querySelector('#utm_medium').value || 'direct',
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
