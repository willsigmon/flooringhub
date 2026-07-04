"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/analytics";

/** Before/After comparison slider — behavior ported 1:1 from main.js. */
export default function BeforeAfter() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const baSlider = sliderRef.current;
    const baHandle = handleRef.current;
    if (!baSlider) return;

    let baDragging = false;

    function setBaPos(pct: number) {
      pct = Math.max(0, Math.min(100, pct));
      baSlider!.style.setProperty("--ba-pos", pct + "%");
      if (baHandle) baHandle.setAttribute("aria-valuenow", String(Math.round(pct)));
    }

    function pointFromEvent(e: PointerEvent | TouchEvent): number {
      const rect = baSlider!.getBoundingClientRect();
      const clientX =
        "touches" in e && e.touches ? e.touches[0].clientX : (e as PointerEvent).clientX;
      return ((clientX - rect.left) / rect.width) * 100;
    }

    function onMove(e: PointerEvent) {
      if (!baDragging) return;
      e.preventDefault();
      setBaPos(pointFromEvent(e));
    }

    function onDown(e: PointerEvent) {
      baDragging = true;
      setBaPos(pointFromEvent(e));
      document.body.style.cursor = "ew-resize";
    }

    function onUp() {
      baDragging = false;
      document.body.style.cursor = "";
    }

    baSlider.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    // Keyboard support on the handle
    function onKeyDown(e: KeyboardEvent) {
      const current = parseFloat(getComputedStyle(baSlider!).getPropertyValue("--ba-pos")) || 50;
      if (e.key === "ArrowLeft") { setBaPos(current - 4); e.preventDefault(); }
      if (e.key === "ArrowRight") { setBaPos(current + 4); e.preventDefault(); }
      if (e.key === "Home") { setBaPos(0); e.preventDefault(); }
      if (e.key === "End") { setBaPos(100); e.preventDefault(); }
    }
    if (baHandle) baHandle.addEventListener("keydown", onKeyDown);

    // Initial nudge hint on first viewport entry
    let baObserver: IntersectionObserver | undefined;
    if (!prefersReducedMotion()) {
      baObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setBaPos(60);
              setTimeout(() => setBaPos(40), 550);
              setTimeout(() => setBaPos(50), 1100);
              baObserver!.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      baObserver.observe(baSlider);
    }

    return () => {
      baSlider.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (baHandle) baHandle.removeEventListener("keydown", onKeyDown);
      if (baObserver) baObserver.disconnect();
    };
  }, []);

  return (
    <section className="section proof" id="proof">
      <div className="container">
        <h2 className="section-label fade-up reveal-words">Proof, not promises</h2>
        <p className="section-headline fade-up reveal-words">Drag to see the difference.</p>

        <div className="ba-stage fade-up">
          <div
            className="ba-slider"
            data-ba=""
            ref={sliderRef}
            style={{ "--ba-pos": "50%" } as React.CSSProperties}
          >
            <img
              className="ba-img ba-after"
              src="/assets/laminate-after-1024w.webp"
              srcSet="/assets/laminate-after-640w.webp 640w, /assets/laminate-after-1024w.webp 1024w, /assets/laminate-after-1600w.webp 1600w"
              sizes="(max-width: 1200px) 100vw, 1200px"
              alt="After: installed laminate flooring"
              loading="lazy"
              decoding="async"
            />
            <div className="ba-before-wrap">
              <img
                className="ba-img ba-before"
                src="/assets/laminate-before-1024w.webp"
                srcSet="/assets/laminate-before-640w.webp 640w, /assets/laminate-before-1024w.webp 1024w, /assets/laminate-before-1600w.webp 1600w"
                sizes="(max-width: 1200px) 100vw, 1200px"
                alt="Before: old floor"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div
              className="ba-handle"
              role="slider"
              tabIndex={0}
              aria-label="Drag to reveal before and after"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={50}
              ref={handleRef}
            >
              <div className="ba-handle-line"></div>
              <div className="ba-handle-knob">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polyline points="15 18 9 12 15 6" />
                  <polyline points="9 18 15 12 9 6" transform="translate(6 0)" />
                </svg>
              </div>
            </div>
            <span className="ba-label ba-label-before">Before</span>
            <span className="ba-label ba-label-after">After</span>
          </div>
          <p className="ba-caption" data-ba-caption="">Laminate tile install &middot; Raleigh</p>
        </div>
      </div>
    </section>
  );
}
