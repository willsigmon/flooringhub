export default function Services() {
  return (
    <section className="section services" id="services">
      <div className="container">
        <h2 className="section-label fade-up">Services</h2>
        <p className="section-headline fade-up">Everything your floors need, under one roof.</p>
      </div>
      {/* Hero service: Hardwood - full width */}
      <div className="service-hero fade-up">
        <div className="service-hero-img service-hero-bg-hardwood"></div>
        <div className="service-hero-overlay"></div>
        <div className="service-hero-content">
          <span className="service-tag">Signature Service</span>
          <h3>Hardwood Flooring</h3>
          <p>Elevate your space with the timeless beauty and warmth of natural hardwood. Available in oak, walnut, maple, hickory, and exotic species -- each plank hand-selected for character and quality.</p>
          <a href="#quote" className="btn btn-outline-light" data-cta="services-hero-quote">Get a Quote</a>
        </div>
      </div>
      <div className="container">
        {/* 3-up panel row: LVP / Laminate / Carpet */}
        <div className="service-trio fade-up">
          <div className="service-card-v2">
            <div className="service-card-img service-feature-bg-lvp"></div>
            <div className="service-card-body">
              <h3>Luxury Vinyl Plank</h3>
              <p>The perfect balance of beauty and resilience. Waterproof, scratch-resistant, and virtually indistinguishable from real hardwood -- at a fraction of the cost.</p>
            </div>
          </div>
          <div className="service-card-v2">
            <div className="service-card-img service-feature-bg-laminate"></div>
            <div className="service-card-body">
              <h3>Laminate Flooring</h3>
              <p>Engineered for beauty and durability. Multi-layer construction resists impact, stains, and fading. Pictured: a recent white laminate tile install.</p>
            </div>
          </div>
          <div className="service-card-v2">
            <div className="service-card-img service-card-bg-carpet"></div>
            <div className="service-card-body">
              <h3>Carpet</h3>
              <p>Plush comfort underfoot. From luxurious deep-pile to durable low-profile, our premium carpets deliver warmth, sound insulation, and style.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
