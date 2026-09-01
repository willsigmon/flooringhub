import type { Metadata } from "next";
import "../legal.css";

import LegalNav from "@/components/legal-nav";
import { LegalFooter } from "@/components/site-footer";
import { SITE_CONFIG, SITE_PATHS, SITE_URL, SOCIAL_PREVIEW_IMAGE } from "@/lib/site-config";

const TITLE = "Terms of Service | Flooring Hub";
const DESCRIPTION = "Terms of service for Flooring Hub website and services.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${SITE_PATHS.terms}` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}${SITE_PATHS.terms}`,
    siteName: "Flooring Hub",
    type: "website",
    images: [
      {
        url: SOCIAL_PREVIEW_IMAGE,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Terms of Service | Flooring Hub social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: SOCIAL_PREVIEW_IMAGE, alt: "Terms of Service | Flooring Hub social preview" }],
  },
};

export default function TermsPage() {
  return (
    <>
      <LegalNav />

      <main className="legal-page">
        <div className="container">
          <a href="/" className="legal-back">&larr; Back to Home</a>
          <h1>Terms of Service</h1>
          <p className="legal-date">Last updated: April 13, 2026</p>

          <div className="legal-content">
            <section>
              <h2>Acceptance of Terms</h2>
              <p>By accessing and using the Flooring Hub website (flooringhubnc.com), you agree to be bound by these Terms of Service. If you do not agree, please do not use our website.</p>
            </section>

            <section>
              <h2>Services</h2>
              <p>Flooring Hub provides flooring consultation, material selection guidance, and professional installation services. All estimates are provided free of charge and without obligation. Final project pricing is based on the agreed-upon scope of work.</p>
            </section>

            <section>
              <h2>Estimates &amp; Pricing</h2>
              <p>Estimates provided during consultations are based on the information available at the time of assessment. Final pricing may vary if site conditions differ from the initial evaluation. All pricing changes will be communicated and approved before work proceeds.</p>
            </section>

            <section>
              <h2>Warranties</h2>
              <p>Flooring Hub follows all manufacturer installation guidelines to ensure valid product warranties. Workmanship is guaranteed. Manufacturer warranties are subject to the individual product terms and conditions.</p>
            </section>

            <section>
              <h2>Intellectual Property</h2>
              <p>All content on this website, including text, images, logos, and design elements, is the property of Flooring Hub and protected by applicable intellectual property laws. You may not reproduce, distribute, or use any content without written permission.</p>
            </section>

            <section>
              <h2>Limitation of Liability</h2>
              <p>Flooring Hub is not liable for any indirect, incidental, or consequential damages arising from the use of this website. Project-specific liabilities are governed by individual service agreements.</p>
            </section>

            <section>
              <h2>Changes to Terms</h2>
              <p>We reserve the right to update these terms at any time. Changes will be posted on this page with an updated effective date.</p>
            </section>

            <section>
              <h2>Contact</h2>
              <p>
                For questions about these terms, contact us at:<br />
                <a href={`mailto:${SITE_CONFIG.email}`} data-config-email="text">{SITE_CONFIG.email}</a><br />
                <a href={`tel:${SITE_CONFIG.phone}`} data-config-phone="text">{SITE_CONFIG.phoneDisplay}</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <LegalFooter />
    </>
  );
}
