import { FiveStarsSvg } from "@/components/icons";

type Testimonial = {
  color: string;
  quote: React.ReactNode;
  name: string;
  detail?: React.ReactNode;
};

const TESTIMONIALS: Testimonial[] = [
  {
    color: "mahogany",
    quote: <>&quot;My experience with Flooring Hub was Exceptionally Amazing from beginning to end. Great professional, expert, efficient service every step of the way &mdash; they far surpassed and exceeded my expectations.&quot;</>,
    name: "Mary Brown",
    detail: <>US Navy, Retired &middot; N. Raleigh, NC</>,
  },
  {
    color: "teal",
    quote: <>&quot;As a Realtor, we often have quick turn-around times even when we try to plan well in advance. Tom made sure a high-profile listing had carpet replaced at a reasonable cost and with impeccable quality. I highly recommend Flooring Hub.&quot;</>,
    name: "Shelley Welch",
    detail: <>Realtor</>,
  },
  {
    color: "amber",
    quote: <>&quot;What a fantastic company! Tom, the owner, knows his stuff on flooring and works hard to provide the greatest options and project goals. Highly recommend!&quot;</>,
    name: "Krystal Greenhaw",
  },
  {
    color: "forest",
    quote: <>&quot;Great experience! Tom was friendly, replied to my question quickly, came and gave a first-hand estimate, and fixed my issue perfectly. I highly recommend this company &mdash; they are fantastic.&quot;</>,
    name: "Kelly Wade",
  },
  {
    color: "sienna",
    quote: <>&quot;Tom is stellar &mdash; they got our old carpets completely replaced and the installation was without a doubt the easiest experience I&apos;ve had with a contractor. 30+ years of experience and it shows.&quot;</>,
    name: "Brent A.",
  },
  {
    color: "slate",
    quote: <>&quot;Versatile, knowledgeable, thorough, and fair priced. Tommy brings an uplifting and personable demeanor that will brighten your day. Highly recommended.&quot;</>,
    name: "Ben Madugu",
  },
  {
    color: "walnut",
    quote: <>&quot;Flooring Hub installed some carpets in my house. The work was high quality and I was impressed with the company&apos;s professionalism.&quot;</>,
    name: "Alex French",
  },
  {
    color: "oxblood",
    quote: <>&quot;Great customer service. Very professional and prompt. The tech was extremely knowledgeable about the repair and a great communicator. I highly recommend.&quot;</>,
    name: "Ariel Davis",
  },
  {
    color: "bronze",
    quote: <>&quot;The Flooring Hub team is incredible to work with. They are very knowledgeable and got the job done right!&quot;</>,
    name: "Cassidy C. Smith",
  },
];

function TestimonialSet({ hidden }: { hidden?: boolean }) {
  return (
    <div className="t-set" aria-hidden={hidden ? "true" : undefined}>
      {TESTIMONIALS.map((t) => (
        <article key={t.name} className={`t-card t-card--${t.color}`} data-t-card="">
          <div className="t-stars" aria-label="5 out of 5 stars">
            <FiveStarsSvg />
          </div>
          <p className="t-quote">{t.quote}</p>
          <div className="t-author">
            <span className="t-author-name">{t.name}</span>
            {t.detail ? <span className="t-author-detail">{t.detail}</span> : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="section testimonials" id="testimonials">
      <div className="container testimonials-intro">
        <h2 className="section-label fade-up">Testimonials</h2>
        <p className="section-headline fade-up">What our customers say.</p>
      </div>
      <svg className="t-stars-defs" aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <polygon id="cstar5" points="10,1 12.5,7.5 19,8 14,12.5 15.5,19 10,15.5 4.5,19 6,12.5 1,8 7.5,7.5" />
        </defs>
      </svg>
      <div className="t-carousel fade-up" data-t-carousel="">
        <div className="t-track" data-t-track="" aria-live="off">
          <TestimonialSet />
          <TestimonialSet hidden />
          <TestimonialSet hidden />
          <TestimonialSet hidden />
        </div>
      </div>
    </section>
  );
}
