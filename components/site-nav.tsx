"use client";

import { useEffect, useRef, useState } from "react";

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      setScrolled(scrollY > 80);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setOpen(false);

  return (
    <nav className={"nav" + (scrolled ? " scrolled" : "")} id="nav" ref={navRef}>
      <div className="nav-inner">
        <a href="#hero" className="nav-logo" aria-label="Flooring Hub — home" onClick={closeMenu}>
          <img src="/assets/icon.png" alt="" className="logo-mark" loading="eager" decoding="async" width={446} height={446} />
          <span className="logo-wordmark">
            <span className="logo-wordmark-primary">Flooring Hub</span>
            <span className="logo-wordmark-sub">The Flooring Guru</span>
          </span>
        </a>
        <button
          className={"nav-toggle" + (open ? " active" : "")}
          id="navToggle"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <ul className={"nav-links" + (open ? " open" : "")} id="navLinks">
          <li><a href="#process" onClick={closeMenu}>Process</a></li>
          <li><a href="#services" onClick={closeMenu}>Services</a></li>
          <li><a href="#gallery" onClick={closeMenu}>Work</a></li>
          <li><a href="#about" onClick={closeMenu}>About</a></li>
          <li><a href="#testimonials" onClick={closeMenu}>Reviews</a></li>
          <li><a href="#faq" onClick={closeMenu}>FAQ</a></li>
          <li><a href="#quote" className="nav-cta" data-cta="nav-free-estimate" onClick={closeMenu}>Free Estimate</a></li>
        </ul>
      </div>
    </nav>
  );
}
