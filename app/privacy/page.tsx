import type { Metadata } from "next";
import "../legal.css";

import LegalNav from "@/components/legal-nav";
import { LegalFooter } from "@/components/site-footer";
import { SITE_CONFIG, SITE_PATHS, SITE_URL, SOCIAL_PREVIEW_IMAGE } from "@/lib/site-config";

const TITLE = "Privacy Policy | Flooring Hub";
const DESCRIPTION = "How Flooring Hub handles your personal information.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${SITE_PATHS.privacy}` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}${SITE_PATHS.privacy}`,
    siteName: "Flooring Hub",
    type: "website",
    images: [
      {
        url: SOCIAL_PREVIEW_IMAGE,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "Privacy Policy | Flooring Hub social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: SOCIAL_PREVIEW_IMAGE, alt: "Privacy Policy | Flooring Hub social preview" }],
  },
};

export default function PrivacyPage() {
  return (
    <>
      <LegalNav />

      <main className="legal-page">
        <div className="container">
          <a href="/" className="legal-back">&larr; Back to Home</a>
          <h1>Privacy Policy</h1>
          <p className="legal-date">Last updated: April 13, 2026</p>

          <div className="legal-content">
            <section>
              <h2>Information We Collect</h2>
              <p>When you request an estimate, contact us, or use our website, we may collect:</p>
              <ul>
                <li>Name, email address, and phone number</li>
                <li>Property address and project details</li>
                <li>Flooring preferences and budget information</li>
                <li>Website usage data (pages visited, time on site)</li>
              </ul>
            </section>

            <section>
              <h2>How We Use Your Information</h2>
              <ul>
                <li>Provide flooring estimates and consultations</li>
                <li>Schedule and coordinate installation projects</li>
                <li>Follow up on project satisfaction</li>
                <li>Send project updates and maintenance recommendations</li>
                <li>Improve our website and services</li>
              </ul>
            </section>

            <section>
              <h2>Data Sharing</h2>
              <p>We share information with material suppliers and subcontractors solely to fulfill your flooring project. We do not sell, rent, or trade your personal information to third parties for marketing purposes.</p>
            </section>

            <section>
              <h2>Data Security</h2>
              <p>We use reasonable measures to protect your personal information from unauthorized access, use, or disclosure. However, no method of transmission over the internet is completely secure.</p>
            </section>

            <section>
              <h2>Cookies</h2>
              <p>Our website may use cookies and similar technologies to enhance your browsing experience and analyze site traffic. You can manage cookie preferences through your browser settings.</p>
            </section>

            <section>
              <h2>Your Rights</h2>
              <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us.</p>
            </section>

            <section>
              <h2>Contact</h2>
              <p>
                Flooring Hub<br />
                Tom Smith, Owner<br />
                Raleigh, North Carolina<br />
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
