"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/analytics";
import { SITE_CONFIG } from "@/lib/site-config";
import { PhoneIcon } from "@/components/icons";

const HERO_IMAGES = [
  { base: "stairs-after", alt: "Custom hardwood staircase", eager: true },
  { base: "cary-fireplace", alt: "Cary fireplace hardwood install", eager: false },
  { base: "cary-hallway", alt: "Cary hardwood hallway", eager: false },
  { base: "lvp-raleigh", alt: "Raleigh LVP install", eager: false },
];

export default function Hero() {
  const featureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const cleanups: Array<() => void> = [];

    // ---- Hero feature image crossfade rotator ----
    const heroImages = document.querySelectorAll(".hero-feature-img");
    if (heroImages.length > 1 && !reduced) {
      let heroIdx = 0;
      const interval = setInterval(() => {
        heroImages[heroIdx].classList.remove("is-active");
        heroIdx = (heroIdx + 1) % heroImages.length;
        heroImages[heroIdx].classList.add("is-active");
      }, 5500);
      cleanups.push(() => clearInterval(interval));
    }

    // ---- Hero feature subtle parallax on scroll ----
    const heroFeature = featureRef.current;
    if (heroFeature && !reduced) {
      const onScroll = () => {
        const scrollY = window.pageYOffset;
        if (scrollY < window.innerHeight) {
          heroFeature.style.transform = "translateY(" + scrollY * -0.08 + "px)";
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanups.push(() => window.removeEventListener("scroll", onScroll));
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <section className="hero" id="hero">
      <div className="hero-bg-glow"></div>
      <div className="hero-grid">
        <div className="hero-copy">
          <span className="hero-kicker">
            <span className="hero-kicker-dot"></span>
            Est. 1999 &nbsp;&middot;&nbsp; Raleigh / Durham / Cary
          </span>
          <h1 className="hero-title">
            <span className="reveal-line"><span className="reveal-inner">The foundation of</span></span>
            <span className="reveal-line"><span className="reveal-inner">every <em className="hero-accent">beautiful</em></span></span>
            <span className="reveal-line"><span className="reveal-inner"><em className="hero-accent">home</em> starts here.</span></span>
          </h1>
          <p className="hero-sub">Twenty-five years of hand-selected hardwood, precision installation, and one person accountable start to finish &mdash; Tom Smith, on-site, every project.</p>
          <div className="hero-actions">
            <a href="#quote" className="btn btn-primary" data-cta="hero-primary">Get a Free Estimate</a>
            <a href={`tel:${SITE_CONFIG.phone}`} className="btn btn-ghost" data-cta="hero-phone" data-config-phone="">
              <PhoneIcon width={18} height={18} />
              <span data-config-phone="text">{SITE_CONFIG.phoneDisplay}</span>
            </a>
          </div>
          <div className="hero-trust">
            {/* TODO(tom): replace href with your Google Business Profile review URL (https://g.page/r/YOUR_CID/review) */}
            <a
              className="trust-item trust-item--link"
              href="https://www.google.com/maps/search/?api=1&query=Flooring+Hub+Raleigh+NC"
              target="_blank"
              rel="noopener"
              data-cta="hero-google-reviews"
            >
              <svg className="trust-star-svg" viewBox="0 0 120 20" aria-label="5 out of 5 stars">
                <defs>
                  <polygon id="star5" points="10,1 12.5,7.5 19,8 14,12.5 15.5,19 10,15.5 4.5,19 6,12.5 1,8 7.5,7.5" />
                </defs>
                <use href="#star5" x="0" />
                <use href="#star5" x="25" />
                <use href="#star5" x="50" />
                <use href="#star5" x="75" />
                <use href="#star5" x="100" />
              </svg>
              <span>5.0 on Google</span>
            </a>
            <div className="trust-divider"></div>
            <div className="trust-item"><span>Licensed &amp; Insured</span></div>
            <div className="trust-divider"></div>
            <div className="trust-item"><span>NWFA Member</span></div>
          </div>
        </div>

        <div className="hero-feature" ref={featureRef}>
          <div className="hero-feature-frame">
            <div className="hero-feature-img-wrap">
              {HERO_IMAGES.map((img, i) => (
                <img
                  key={img.base}
                  className={"hero-feature-img" + (i === 0 ? " is-active" : "")}
                  src={`/assets/${img.base}-1024w.webp`}
                  srcSet={`/assets/${img.base}-640w.webp 640w, /assets/${img.base}-1024w.webp 1024w, /assets/${img.base}-1600w.webp 1600w`}
                  sizes="(max-width: 900px) 92vw, 50vw"
                  alt={img.alt}
                  loading={img.eager ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={img.eager ? "high" : undefined}
                />
              ))}
            </div>
            <div className="hero-feature-corner tl"></div>
            <div className="hero-feature-corner tr"></div>
            <div className="hero-feature-corner bl"></div>
            <div className="hero-feature-corner br"></div>
          </div>
          <div className="hero-stat-chip">
            <div className="hero-stat">
              <span className="hero-stat-num" data-count="25">25+</span>
              <span className="hero-stat-label">Years</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-num" data-count="500">500+</span>
              <span className="hero-stat-label">Homes</span>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <span className="hero-stat-num">5.0&#9733;</span>
              <span className="hero-stat-label">Google</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
