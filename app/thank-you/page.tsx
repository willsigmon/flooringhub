import type { Metadata } from "next";

import ThankYouConversion from "@/components/thank-you-conversion";
import { SITE_CONFIG, SITE_PATHS, SITE_URL, SOCIAL_PREVIEW_IMAGE } from "@/lib/site-config";

const TITLE = "Thank You | Flooring Hub";
const DESCRIPTION = "Thank you for your Flooring Hub request. Tom will reach out within 24 hours.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  alternates: { canonical: `${SITE_URL}${SITE_PATHS.thankYou}` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}${SITE_PATHS.thankYou}`,
    siteName: "Flooring Hub",
    type: "website",
    images: [
      {
        url: SOCIAL_PREVIEW_IMAGE,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Thank You | Flooring Hub social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: SOCIAL_PREVIEW_IMAGE, alt: "Thank You | Flooring Hub social preview" }],
  },
};

export default function ThankYouPage() {
  return (
    <>
      <ThankYouConversion />

      <nav className="nav" id="nav">
        <div className="nav-inner">
          <a href="/" className="nav-logo">
            <img src="/assets/logo-horizontal.webp" alt="Flooring Hub" className="logo-img" loading="eager" decoding="async" width={232} height={77} />
          </a>
        </div>
      </nav>

      <main className="section lead-capture">
        <div className="container">
          <div className="thank-you-wrap" role="status" aria-live="polite">
            <h1>Thanks for reaching out.</h1>
            <p>Your Flooring Hub request was submitted successfully. Tom usually responds within 24 hours to confirm your free consultation and next steps.</p>
            <div className="thank-you-actions">
              <a href="/" className="btn btn-primary" data-cta="thank-you-home">Return to Home</a>
              <a href={`tel:${SITE_CONFIG.phone}`} className="btn btn-outline" data-cta="thank-you-call" data-config-phone="">
                Call <span data-config-phone="text">{SITE_CONFIG.phoneDisplay}</span>
              </a>
            </div>
            <div className="thank-you-note">
              <p>
                If you don&apos;t hear back soon, call{" "}
                <a href={`tel:${SITE_CONFIG.phone}`}>{SITE_CONFIG.phoneDisplay}</a>
                {" "}or email{" "}
                <a href={`mailto:${SITE_CONFIG.email}`}>{SITE_CONFIG.email}</a>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
