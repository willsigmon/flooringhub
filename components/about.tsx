const BADGES = [
  { src: "/assets/nwfa-badge.png", alt: "NWFA Member", title: "National Wood Flooring Association Member", extraClass: "" },
  { src: "/assets/realwood-badge.png", alt: "Real Wood Real Life", title: "Real Wood Real Life", extraClass: " about-badge-light" },
  { src: "/assets/bbb-badge.png", alt: "BBB Accredited Business", title: "Better Business Bureau Accredited Business", extraClass: "" },
  { src: "/assets/chamber-badge.png", alt: "Member of the Chamber of Commerce", title: "Chamber of Commerce Member", extraClass: "" },
];

export default function About() {
  return (
    <section className="section about" id="about">
      <div className="container">
        <div className="about-layout">
          <div className="about-image fade-up">
            <img src="/assets/tom-headshot-new.jpg" alt="Tom Smith, Owner of Flooring Hub" className="about-photo" loading="lazy" decoding="async" />
          </div>
          <div className="about-text fade-right">
            <h2 className="section-label">About Flooring Hub</h2>
            <p className="section-headline">Meet Tom Smith.</p>
            <p className="about-role">Owner &amp; Master Craftsman</p>
            <p>Tom&apos;s journey started with nothing more than tools in his truck and an obsession with doing the job right. For over 25 years, he has been perfecting the art of flooring -- not just installing hardwoods, laminate, LVP, and carpet, but creating spaces that transform how people feel about their homes.</p>
            <p>This is not a franchise, and it&apos;s not about volume. It&apos;s personal. Every project carries Tom&apos;s personal signature -- because his name, reputation, and pride are on the line. He refuses to cut corners, oversell, or use installation methods that void the manufacturer&apos;s warranty.</p>
            <p>You won&apos;t deal with a rotating crew or a sales rep. You&apos;ll deal directly with Tom -- on-site, accountable, and committed to earning your trust.</p>
            <div className="about-badges">
              {BADGES.map((badge) => (
                <img
                  key={badge.src}
                  src={badge.src}
                  alt={badge.alt}
                  className={"about-badge" + badge.extraClass}
                  title={badge.title}
                  loading="lazy"
                  decoding="async"
                />
              ))}
            </div>
            <div className="about-stats">
              <div className="stat">
                <span className="stat-num">25+</span>
                <span className="stat-label">Years Experience</span>
              </div>
              <div className="stat">
                <span className="stat-num">500+</span>
                <span className="stat-label">Projects Completed</span>
              </div>
              <div className="stat">
                <span className="stat-num">5.0</span>
                <span className="stat-label">Google Rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
