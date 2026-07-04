const STEPS = [
  {
    number: "01",
    title: "Free Consultation",
    body: "Tom visits your home, assesses the space, discusses your vision, and provides a transparent quote on the spot. No pressure, no obligation.",
  },
  {
    number: "02",
    title: "Material Selection",
    body: "Browse curated samples in your own space. See how light, furniture, and your lifestyle interact with each option before committing.",
  },
  {
    number: "03",
    title: "Expert Installation",
    body: "Precision prep, meticulous installation, and thorough cleanup. Tom oversees every detail personally -- no subcontractors, no shortcuts.",
  },
  {
    number: "04",
    title: "Final Walkthrough",
    body: "A detailed walkthrough together to ensure every edge, transition, and finish meets your expectations. Your satisfaction is guaranteed.",
  },
];

export default function HowItWorks() {
  return (
    <section className="section how-it-works" id="process">
      <div className="container">
        <h2 className="section-label fade-up">How It Works</h2>
        <p className="section-headline fade-up">Four steps to your dream floors.</p>
        <div className="process-timeline">
          {STEPS.map((step) => (
            <div className="process-step fade-up" key={step.number}>
              <div className="step-number">{step.number}</div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
