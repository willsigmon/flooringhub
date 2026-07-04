"use client";

import { useEffect, useState } from "react";
import { SITE_CONFIG } from "@/lib/site-config";
import { MailIcon, PhoneIcon } from "@/components/icons";

/** Mobile sticky CTA — shows after scrolling past 60% of the viewport (as in main.js). */
export default function MobileCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.pageYOffset;
      setVisible(scrollY > window.innerHeight * 0.6);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={"mobile-cta" + (visible ? " visible" : "")} id="mobileCta">
      <a href={`tel:${SITE_CONFIG.phone}`} className="mobile-cta-btn mobile-cta-call" data-cta="mobile-call" data-config-phone="">
        <PhoneIcon />
        Call Now
      </a>
      <a href={`mailto:${SITE_CONFIG.email}`} className="mobile-cta-btn mobile-cta-email" data-cta="mobile-email" data-config-email="">
        <MailIcon />
        Email
      </a>
    </div>
  );
}
