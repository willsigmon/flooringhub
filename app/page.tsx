import type { Metadata } from "next";
import Script from "next/script";

import SiteNav from "@/components/site-nav";
import Hero from "@/components/hero";
import Testimonials from "@/components/testimonials";
import TrustBar from "@/components/trust-bar";
import WhyChoose from "@/components/why-choose";
import HowItWorks from "@/components/how-it-works";
import Services from "@/components/services";
import BeforeAfter from "@/components/before-after";
import Gallery from "@/components/gallery";
import About from "@/components/about";
import CtaBanner from "@/components/cta-banner";
import LeadFormSection from "@/components/lead-form-section";
import ServiceArea from "@/components/service-area";
import Faq from "@/components/faq";
import SiteFooter from "@/components/site-footer";
import MobileCta from "@/components/mobile-cta";
import ScrollEffects from "@/components/scroll-effects";
import { SITE_URL, SOCIAL_PREVIEW_IMAGE } from "@/lib/site-config";

const TITLE = "Flooring Hub | The Flooring Experts - Raleigh, NC";
const DESCRIPTION =
  "Flooring Hub is Raleigh's trusted flooring specialist. Over 25 years of expert hardwood, LVP, laminate, carpet installation. Free in-home estimates.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/`,
    siteName: "Flooring Hub",
    type: "website",
    images: [
      {
        url: SOCIAL_PREVIEW_IMAGE,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Flooring Hub hardwood staircase social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      { url: SOCIAL_PREVIEW_IMAGE, alt: "Flooring Hub hardwood staircase social preview" },
    ],
  },
};

/** Prevent Vercel preview domains from being indexed as the canonical site. */
const PREVIEW_NOINDEX_SCRIPT = `
    (function () {
      var h = window.location.hostname;
      if (h && h.indexOf('flooringhubnc.com') === -1 && (h.indexOf('.vercel.app') !== -1 || h === 'localhost')) {
        var m = document.createElement('meta');
        m.name = 'robots';
        m.content = 'noindex, nofollow';
        document.head.appendChild(m);
      }
    })();
`;

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: "Flooring Hub",
  alternateName: "Flooring Hub NC",
  description:
    "North Carolina's trusted flooring specialist. Over 25 years of expert hardwood, LVP, laminate, and carpet installation. Free in-home estimates.",
  url: "https://www.flooringhubnc.com",
  telephone: "+13305730370",
  email: "tsmith@flooringhubnc.com",
  founder: {
    "@type": "Person",
    name: "Tom Smith",
    jobTitle: "Owner & Master Craftsman",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Raleigh",
    addressRegion: "NC",
    addressCountry: "US",
  },
  areaServed: [
    { "@type": "City", name: "Raleigh" },
    { "@type": "City", name: "Durham" },
    { "@type": "City", name: "Chapel Hill" },
    { "@type": "City", name: "Cary" },
    { "@type": "City", name: "Apex" },
    { "@type": "City", name: "Garner" },
    { "@type": "City", name: "Clayton" },
    { "@type": "City", name: "Fuquay-Varina" },
    { "@type": "City", name: "Wake Forest" },
    { "@type": "City", name: "Holly Springs" },
    { "@type": "City", name: "Pittsboro" },
    { "@type": "City", name: "Hillsborough" },
    { "@type": "City", name: "Zebulon" },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Flooring Services",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Hardwood Flooring Installation" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Luxury Vinyl Plank (LVP) Installation" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Laminate Flooring Installation" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Carpet Installation" } },
    ],
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5.0",
    reviewCount: "9",
    bestRating: "5",
  },
  priceRange: "$$",
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "08:00",
    closes: "18:00",
  },
  sameAs: [
    "https://www.facebook.com/p/Flooring-Hub-61578767536673/",
    "https://www.instagram.com/flooringhubnc/",
  ],
};

export default function HomePage() {
  return (
    <>
      {/* Preload hero assets (hoisted to <head> by React) */}
      <link rel="preload" as="image" href="/assets/icon.png" fetchPriority="high" />
      <link
        rel="preload"
        as="image"
        href="/assets/stairs-after-1024w.webp"
        imageSrcSet="/assets/stairs-after-640w.webp 640w, /assets/stairs-after-1024w.webp 1024w, /assets/stairs-after-1600w.webp 1600w"
        imageSizes="(max-width: 900px) 92vw, 50vw"
        fetchPriority="high"
      />

      {/* Vercel-preview noindex guard */}
      <script dangerouslySetInnerHTML={{ __html: PREVIEW_NOINDEX_SCRIPT }} />

      {/* Google Tag Manager */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=GT-NM2HNMF7"
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GT-NM2HNMF7');
        `}
      </Script>

      {/* Structured Data for AI/Search Discovery */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />

      <SiteNav />
      <Hero />
      <Testimonials />
      <TrustBar />
      <WhyChoose />
      <HowItWorks />
      <Services />
      <BeforeAfter />
      <Gallery />
      <About />
      <CtaBanner />
      <LeadFormSection />
      <ServiceArea />
      <Faq />
      <SiteFooter />
      <MobileCta />
      <ScrollEffects />
    </>
  );
}
