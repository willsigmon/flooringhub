"use client";

import { useEffect } from "react";

/**
 * GA4 bootstrap from <meta name="ga-measurement-id"> — ported from the inline
 * initGa4() script on the legal and thank-you pages. No-op while the meta
 * content is empty (as on the static site).
 */
export default function GaBootstrap() {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="ga-measurement-id"]');
    const measurementId = meta && meta.content ? meta.content.trim() : "";

    if (!measurementId || typeof window.gtag === "function") {
      return;
    }

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
  }, []);

  return null;
}
