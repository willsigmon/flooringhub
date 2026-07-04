import { SITE_CONFIG } from "@/lib/site-config";
import { FacebookIcon, InstagramIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/icons";

export function FooterSocial() {
  return (
    <div className="footer-social">
      <a href={SITE_CONFIG.social.facebook} target="_blank" rel="noopener" aria-label="Facebook">
        <FacebookIcon />
      </a>
      <a href={SITE_CONFIG.social.instagram} target="_blank" rel="noopener" aria-label="Instagram">
        <InstagramIcon />
      </a>
    </div>
  );
}

/** Slim footer used by the legal pages (privacy / terms). */
export function LegalFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-bottom">
          <p>&copy; 2026 Flooring Hub. All Rights Reserved.</p>
          <FooterSocial />
        </div>
      </div>
    </footer>
  );
}

/** Full contact footer used on the homepage. */
export default function SiteFooter() {
  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand fade-up">
            <img src="/assets/logo.webp" alt="Flooring Hub" className="footer-logo-img" loading="lazy" decoding="async" width={84} height={56} />
            <h2 className="footer-logo">Flooring Hub</h2>
            <p>North Carolina&apos;s trusted flooring specialist. Done once. Done right. Done with care.</p>
          </div>
          <div className="footer-contact fade-up">
            <h3>Get in Touch</h3>
            <div className="contact-item">
              <MailIcon strokeWidth={1.5} />
              <a href={`mailto:${SITE_CONFIG.email}`} data-config-email="text">{SITE_CONFIG.email}</a>
            </div>
            <div className="contact-item">
              <PhoneIcon strokeWidth={1.5} />
              <a href={`tel:${SITE_CONFIG.phone}`} data-config-phone="text">{SITE_CONFIG.phoneDisplay}</a>
            </div>
            <div className="contact-item">
              <PinIcon />
              <span>Raleigh, North Carolina</span>
            </div>
          </div>
          <div className="footer-cta fade-up">
            <h3>Ready to Start?</h3>
            <p>Schedule your free in-home consultation today.</p>
            <a href={`tel:${SITE_CONFIG.phone}`} className="btn btn-primary" data-cta="footer-call" data-config-phone="">Call Now</a>
            <a href={`mailto:${SITE_CONFIG.email}`} className="btn btn-outline" data-config-email="">Email Us</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Flooring Hub. All Rights Reserved.</p>
          <div className="footer-legal">
            <a href="/privacy.html">Privacy Policy</a>
            <a href="/terms.html">Terms of Service</a>
          </div>
          <FooterSocial />
        </div>
      </div>
    </footer>
  );
}
