/** Slim always-scrolled nav used by the legal pages (privacy / terms). */
export default function LegalNav() {
  return (
    <nav className="nav scrolled" id="nav">
      <div className="nav-inner">
        <a href="/" className="nav-logo">
          <img src="/assets/logo-horizontal.webp" alt="Flooring Hub" className="logo-img" loading="eager" decoding="async" width={232} height={77} />
        </a>
        <ul className="nav-links">
          <li><a href="/#services">Services</a></li>
          <li><a href="/#about">About</a></li>
          <li><a href="/#quote" className="nav-cta">Free Estimate</a></li>
        </ul>
      </div>
    </nav>
  );
}
