"use client";

/** Analytics + haptics helpers ported 1:1 from the static site's main.js. */

declare global {
  interface Window {
    va?: (event: string, name: string, data?: Record<string, unknown>) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function trackEvent(name: string, data?: Record<string, unknown>) {
  if (typeof window.va === "function") {
    window.va("event", name, data || {});
  }
  if (typeof window.gtag === "function") {
    window.gtag("event", name, data || {});
  }
}

export function trackCtaEvent(el: Element | null, action?: string) {
  if (!el || !el.getAttribute) return;
  const cta = el.getAttribute("data-cta");
  if (!cta) return;
  trackEvent(action || "cta_click", {
    cta,
    label: cta,
    section: (el.closest("section") && el.closest("section")!.getAttribute("id")) || "unknown",
  });
}

export function haptic(style?: "light" | "medium" | "heavy") {
  if (!navigator.vibrate) return;
  switch (style) {
    case "light":
      navigator.vibrate(10);
      break;
    case "medium":
      navigator.vibrate(20);
      break;
    case "heavy":
      navigator.vibrate([15, 30, 15]);
      break;
    default:
      navigator.vibrate(10);
  }
}

export function prefersReducedMotion(): boolean {
  return Boolean(
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
