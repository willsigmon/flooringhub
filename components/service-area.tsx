import { SITE_CONFIG } from "@/lib/site-config";

const CITIES = [
  "Raleigh",
  "Durham",
  "Chapel Hill",
  "Cary",
  "Apex",
  "Garner",
  "Clayton",
  "Fuquay-Varina",
  "Wake Forest",
  "Holly Springs",
  "Pittsboro",
  "Hillsborough",
  "Zebulon",
];

export default function ServiceArea() {
  return (
    <section className="section service-area" id="service-area">
      <div className="container">
        <div className="area-layout">
          <div className="area-text fade-up">
            <h2 className="section-label">Service Area</h2>
            <p className="section-headline">A triangle across the Triangle.</p>
            <p>Flooring Hub covers a wide swath of central North Carolina &mdash; from Hillsborough in the northwest, out to Zebulon in the east, and south to Pittsboro. If your home sits inside the three points below, we come to you.</p>
            <div className="area-triangle-key">
              <span className="area-key-item"><span className="area-key-dot area-key-dot--nw"></span> Hillsborough &middot; NW corner</span>
              <span className="area-key-item"><span className="area-key-dot area-key-dot--e"></span> Zebulon &middot; E corner</span>
              <span className="area-key-item"><span className="area-key-dot area-key-dot--sw"></span> Pittsboro &middot; SW corner</span>
            </div>
            <ul className="area-list">
              {CITIES.map((city) => (
                <li key={city}>{city}</li>
              ))}
            </ul>
            <p className="area-note">Don&apos;t see your city? <a href={`tel:${SITE_CONFIG.phone}`} data-config-phone="">Give us a call</a> -- we likely service your area too.</p>
          </div>
          <div className="area-map fade-up">
            <div className="map-embed">
              <iframe
                title="Flooring Hub service area map — Raleigh / Durham / Chapel Hill / Cary area"
                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d415000.0!2d-78.85!3d35.85!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1713299200000"
                width="100%"
                height={460}
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
