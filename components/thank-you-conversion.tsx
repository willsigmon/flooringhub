"use client";

import { useEffect } from "react";

/** Fires the lead conversion event on the thank-you page (ported from thank-you.html). */
export default function ThankYouConversion() {
  useEffect(() => {
    if (typeof window.va === "function") {
      window.va("event", "lead_thank_you_view", { page: "/thank-you.html" });
    }
    if (typeof window.gtag === "function") {
      window.gtag("event", "lead_thank_you_view", { page_title: "Thank You" });
    }
  }, []);

  return null;
}
