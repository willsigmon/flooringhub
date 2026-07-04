const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
    ),
    title: "25+ Years Expertise",
    body: "Decades of hands-on experience with hardwood, laminate, tile, carpet, and more.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
    ),
    title: "Precise Installation",
    body: "Meticulous attention to detail ensures perfect fits and finishes every time.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
    ),
    title: "Licensed & Insured",
    body: "Full peace of mind that your home or business is protected throughout the project.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
    ),
    title: "One Point of Contact",
    body: "Work directly with Tom. No rotating crews. No pushy salespeople. Just honest craftsmanship.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
    ),
    title: "Transparent Pricing",
    body: "No hidden fees or surprises. Get a clear, fair quote upfront before any work begins.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
    ),
    title: "Local & Reliable",
    body: "Proudly serving Raleigh, Durham, Chapel Hill, Cary, Apex, and the greater Triangle.",
  },
];

export default function WhyChoose() {
  return (
    <section className="section why-choose" id="why">
      <div className="container">
        <h2 className="section-label fade-up">Why Flooring Hub</h2>
        <p className="section-headline fade-up">The difference is in the details.</p>
        <div className="features-grid">
          {FEATURES.map((feature) => (
            <div className="feature-card fade-up" key={feature.title}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
