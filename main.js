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
