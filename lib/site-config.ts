/**
 * Single source of truth for company contact details.
 * (Replaces the runtime DOM-syncing lib/site-config.js from the static site —
 * values are now inlined at build time.)
 *
 * Only public facts already used on flooringhubnc.com. Do not invent
 * testimonials, metrics, phone numbers, or estimate prices here.
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

/** Existing GTM container already on production. */
export const GTM_ID = "GT-NM2HNMF7";

/**
 * Static export emits extension URLs (`privacy.html`) to match the live
 * flooringhubnc.com sitemap / IndexNow contract.
 */
export const SITE_PATHS = {
  home: "/",
  privacy: "/privacy.html",
  terms: "/terms.html",
  thankYou: "/thank-you.html",
  quote: "/#quote",
  mcp: "/.well-known/mcp.json",
  llms: "/llms.txt",
  llmsFull: "/llms-full.txt",
} as const;

export const SITE_FACTS = {
  established: 1999,
  years: "25+",
  homes: "500+",
  googleRating: "5.0",
  reviewCount: 9,
  owner: "Tom Smith",
  locality: "Raleigh, North Carolina",
  region: "Raleigh / Durham / Cary and the greater Triangle",
  services: [
    "Hardwood flooring installation",
    "Luxury vinyl plank (LVP) installation",
    "Laminate flooring installation",
    "Carpet installation",
  ] as const,
  cities: [
    "Raleigh",
    "Durham",
    "Chapel Hill",
    "Cary",
    "Apex",
    "Garner",
    "Clayton",
    "Fuquay-Varina",
    "Wake Forest",
    "Holly Springs",
    "Pittsboro",
    "Hillsborough",
    "Zebulon",
  ] as const,
} as const;
