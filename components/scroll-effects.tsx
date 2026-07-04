"use client";

import { useEffect } from "react";
import { haptic, trackCtaEvent } from "@/lib/analytics";

/**
 * Page-wide behaviors ported 1:1 from the static site's main.js:
 * scroll-reveal animations, stagger, stat counters, haptics, CTA tracking,
 * optional GA bootstrap, smooth anchor scrolling, and active-nav highlighting.
 */
export default function ScrollEffects() {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    // ---- Scroll Animations (IntersectionObserver) ----
    function applyStagger(container: Element) {
      const children = container.querySelectorAll<HTMLElement>(".fade-up, .fade-right, .scale-in");
      children.forEach((child, i) => {
        const delay = Math.min(i, 8) * 0.08;
        child.style.transitionDelay = delay + "s";
      });
    }

    document
      .querySelectorAll(".features-grid, .services-grid, .testimonial-grid, .exclusives-grid")
      .forEach((grid) => {
        applyStagger(grid);
      });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );

    document.querySelectorAll(".fade-up, .fade-right, .scale-in, .section-label").forEach((el) => {
      observer.observe(el);
    });
    cleanups.push(() => observer.disconnect());

    // ---- Stat counter animation ----
    function animateCounter(el: HTMLElement) {
      const text = (el.textContent || "").trim();
      let suffix = "";
      let target = 0;

      // Parse "25+", "500+", "5.0"
      if (text.indexOf("+") !== -1) {
        suffix = "+";
        target = parseInt(text.replace("+", ""), 10);
      } else if (text.indexOf(".") !== -1) {
        target = parseFloat(text);
        suffix = "";
      } else {
        target = parseInt(text, 10);
      }

      const isFloat = text.indexOf(".") !== -1;
      const duration = 1200;
      const start = performance.now();

      el.classList.add("counting");

      function step(now: number) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = ease * target;

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

    const statNums = document.querySelectorAll<HTMLElement>(".stat-num");
    if (statNums.length > 0) {
      const statsObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCounter(entry.target as HTMLElement);
              statsObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      statNums.forEach((el) => statsObserver.observe(el));
      cleanups.push(() => statsObserver.disconnect());
    }

    // ---- GA bootstrap from <meta name="ga-measurement-id"> ----
    function initGaMeasurementId() {
      const meta = document.querySelector<HTMLMetaElement>('meta[name="ga-measurement-id"]');
      if (!meta || !meta.content) return;

      const measurementId = meta.content.trim();
      if (!measurementId || typeof window.gtag === "function") return;

      window.dataLayer = window.dataLayer || [];
      window.gtag = function (...args: unknown[]) {
        window.dataLayer!.push(args);
      };

      window.gtag("js", new Date());
      window.gtag("config", measurementId, {
        anonymize_ip: true,
        cookie_flags: "SameSite=None;Secure",
      });

      const script = document.createElement("script");
      script.async = true;
      script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
      document.head.appendChild(script);
    }
    initGaMeasurementId();

    // ---- CTA click tracking ----
    document.querySelectorAll("[data-cta]").forEach((el) => {
      const onClick = () => trackCtaEvent(el, "cta_click");
      el.addEventListener("click", onClick);
      cleanups.push(() => el.removeEventListener("click", onClick));

      if (el.tagName === "A" && el.getAttribute("href") === "#") {
        const preventDefault = (event: Event) => event.preventDefault();
        el.addEventListener("click", preventDefault);
        cleanups.push(() => el.removeEventListener("click", preventDefault));
      }
    });

    // ---- Haptics on buttons, CTAs, and interactive elements ----
    document
      .querySelectorAll(
        ".btn, .btn-primary, .btn-ghost, .btn-outline, .nav-cta, .mobile-cta-btn, .form-submit, .faq-question, .nav-toggle"
      )
      .forEach((el) => {
        const onTouch = () => haptic("light");
        el.addEventListener("touchstart", onTouch, { passive: true });
        cleanups.push(() => el.removeEventListener("touchstart", onTouch));
      });

    // ---- Smooth scroll for anchor links ----
    const nav = document.getElementById("nav");
    document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
      const onClick = (e: Event) => {
        const targetId = anchor.getAttribute("href");
        if (!targetId || targetId === "#") return;
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          const offset = (nav ? nav.offsetHeight : 0) + 20;
          const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top, behavior: "smooth" });
        }
      };
      anchor.addEventListener("click", onClick);
      cleanups.push(() => anchor.removeEventListener("click", onClick));
    });

    // ---- Active nav link highlighting ----
    const sections = document.querySelectorAll<HTMLElement>("section[id]");
    const onScroll = () => {
      const scrollY = window.pageYOffset + 120;
      sections.forEach((section) => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute("id");
        const link = document.querySelector<HTMLElement>('.nav-links a[href="#' + id + '"]');
        if (link) {
          if (scrollY >= top && scrollY < top + height) {
            link.style.color = "rgba(255,255,255,1)";
          } else {
            link.style.color = "";
          }
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    cleanups.push(() => window.removeEventListener("scroll", onScroll));

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return null;
}
