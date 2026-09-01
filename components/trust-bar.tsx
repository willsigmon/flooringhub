const TRUST_LOGOS = [
  { brand: "NWFA", sub: "Member" },
  { brand: "Carlisle", sub: "Wide Plank" },
  { brand: "Sheoga", sub: "Hardwood" },
  { brand: "UZIN", sub: "Leveling" },
  { brand: "DuraSeal", sub: "Stains & Finishes" },
  { brand: "Bona", sub: "Floor Care" },
  { brand: "Real Wood", sub: "Real Life" },
];

function LogoItems() {
  return (
    <>
      {TRUST_LOGOS.map((logo) => (
        <div className="trust-logo-item" key={logo.brand}>
          <span className="tl-brand">{logo.brand}</span>
          <span className="tl-sub">{logo.sub}</span>
        </div>
      ))}
    </>
  );
}

/**
 * Four sibling .trust-set rows so the -25% marquee loop is seamless.
 * The live static HTML left those sets unclosed (nested by the parser);
 * this port closes them as intended instead of reproducing that bug.
 */
export default function TrustBar() {
  return (
    <section className="trust-bar">
      <div className="trust-bar-label">Trusted by homeowners. Backed by the best brands in flooring.</div>
      <div className="trust-marquee">
        <div className="trust-track">
          <div className="trust-set">
            <LogoItems />
          </div>
          <div className="trust-set" aria-hidden="true">
            <LogoItems />
          </div>
          <div className="trust-set" aria-hidden="true">
            <LogoItems />
          </div>
          <div className="trust-set" aria-hidden="true">
            <LogoItems />
          </div>
        </div>
      </div>
    </section>
  );
}
