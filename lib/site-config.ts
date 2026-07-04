/**
 * Single source of truth for company contact details.
 * (Replaces the runtime DOM-syncing lib/site-config.js from the static site —
 * values are now inlined at build time.)
 */
export const SITE_CONFIG = {
  companyName: "Flooring Hub",
  phone: "+13305730370",
  phoneDisplay: "(330) 573-0370",
  email: "tsmith@flooringhubnc.com",
  hours: "M-F 8am - 6pm",
  social: {
    facebook: "https://www.facebook.com/p/Flooring-Hub-61578767536673/",
    instagram: "https://www.instagram.com/flooringhubnc/",
  },
} as const;

export const SITE_URL = "https://www.flooringhubnc.com";
export const SOCIAL_PREVIEW_IMAGE = `${SITE_URL}/assets/flooringhub-social-preview-20260515.jpg`;
