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

  // Haptics on all buttons, CTAs, and interactive elements
  document.querySelectorAll('.btn, .btn-primary, .btn-ghost, .btn-outline, .nav-cta, .mobile-cta-btn, .form-submit, .faq-question, .nav-toggle').forEach(function (el) {
    el.addEventListener('touchstart', function () { haptic('light'); }, { passive: true });
  });

  // Medium haptic on form submit
  var leadForm = document.getElementById('leadForm');
  if (leadForm) {
    leadForm.addEventListener('submit', function () { haptic('medium'); });
  }

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
