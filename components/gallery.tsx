"use client";

import { useState } from "react";

type Tile = {
  cat: "hardwood" | "lvp" | "laminate" | "carpet" | "refinish";
  tileClass?: string;
  img: React.ReactNode;
  gCat: React.ReactNode;
  title: React.ReactNode;
  meta: React.ReactNode;
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "hardwood", label: "Hardwood" },
  { key: "lvp", label: "LVP" },
  { key: "laminate", label: "Laminate" },
  { key: "carpet", label: "Carpet" },
  { key: "refinish", label: "Refinish" },
];

const TILES: Tile[] = [
  {
    cat: "hardwood",
    tileClass: "g-tile--hero",
    img: <img src="/assets/stairs-after.jpg" alt="Custom hardwood staircase with precision trim work" />,
    gCat: <>Hardwood &middot; Signature</>,
    title: <>Custom staircase &amp; treads</>,
    meta: <>Raleigh &middot; Oak, hand-finished</>,
  },
  {
    cat: "hardwood",
    img: <img src="/assets/cary-fireplace.jpg" alt="Hardwood floor around a fireplace" />,
    gCat: "Hardwood",
    title: <>Living room &amp; hearth</>,
    meta: "Cary",
  },
  {
    cat: "hardwood",
    img: <img src="/assets/cary-hallway.jpg" alt="Hardwood hallway installation" />,
    gCat: "Hardwood",
    title: "Long hallway run",
    meta: "Cary",
  },
  {
    cat: "laminate",
    img: (
      <img
        src="/assets/laminate-after-1024w.webp"
        srcSet="/assets/laminate-after-640w.webp 640w, /assets/laminate-after-1024w.webp 1024w, /assets/laminate-after-1600w.webp 1600w"
        sizes="(max-width: 900px) 92vw, 33vw"
        alt="White laminate tile install in a bright room"
        loading="lazy"
        decoding="async"
      />
    ),
    gCat: "Laminate",
    title: "White tile laminate",
    meta: "Raleigh",
  },
  {
    cat: "hardwood",
    img: (
      <img
        src="/assets/hardwood-curved-1024w.webp"
        srcSet="/assets/hardwood-curved-640w.webp 640w, /assets/hardwood-curved-1024w.webp 1024w, /assets/hardwood-curved-1600w.webp 1600w"
        sizes="(max-width: 900px) 92vw, 33vw"
        alt="Medium-brown hardwood floor in a room with a curved architectural nook"
        loading="lazy"
        decoding="async"
      />
    ),
    gCat: "Hardwood",
    title: "Curved nook feature",
    meta: "Raleigh",
  },
  {
    cat: "lvp",
    tileClass: "g-tile--wide",
    img: (
      <img
        src="/assets/lvp-warm-1024w.webp"
        srcSet="/assets/lvp-warm-640w.webp 640w, /assets/lvp-warm-1024w.webp 1024w, /assets/lvp-warm-1600w.webp 1600w"
        sizes="(max-width: 900px) 92vw, 66vw"
        alt="Warm-brown luxury vinyl plank installation"
        loading="lazy"
        decoding="async"
      />
    ),
    gCat: "LVP",
    title: "Warm-grain LVP install",
    meta: "Raleigh",
  },
  {
    cat: "hardwood",
    img: <img src="/assets/cary-kitchen.jpg" alt="Hardwood kitchen floor" loading="lazy" decoding="async" />,
    gCat: "Hardwood",
    title: "Kitchen transition",
    meta: "Cary",
  },
  {
    cat: "hardwood",
    img: (
      <img
        src="/assets/refinish-cary-1024w.webp"
        srcSet="/assets/refinish-cary-640w.webp 640w, /assets/refinish-cary-1024w.webp 1024w, /assets/refinish-cary-1600w.webp 1600w"
        sizes="(max-width: 900px) 92vw, 33vw"
        alt="Red-brown sand-and-refinish project in Cary"
        loading="lazy"
        decoding="async"
      />
    ),
    gCat: "Refinish",
    title: <>Sand &amp; refinish</>,
    meta: "Cary",
  },
  {
    cat: "hardwood",
    img: (
      <img
        src="/assets/carlisle-kitchen-1024w.webp"
        srcSet="/assets/carlisle-kitchen-640w.webp 640w, /assets/carlisle-kitchen-1024w.webp 1024w, /assets/carlisle-kitchen-1600w.webp 1600w"
        sizes="(max-width: 900px) 92vw, 33vw"
        alt="Carlisle wide-plank hardwood in a kitchen with wicker barstools"
        loading="lazy"
        decoding="async"
      />
    ),
    gCat: "Hardwood",
    title: "Carlisle wide plank",
    meta: "Kitchen",
  },
  {
    cat: "hardwood",
    img: (
      <img
        src="/assets/hardwood-entry-1024w.webp"
        srcSet="/assets/hardwood-entry-640w.webp 640w, /assets/hardwood-entry-1024w.webp 1024w, /assets/hardwood-entry-1600w.webp 1600w"
        sizes="(max-width: 900px) 92vw, 33vw"
        alt="Dark-brown hardwood at a front entry"
        loading="lazy"
        decoding="async"
      />
    ),
    gCat: "Hardwood",
    title: <>Entry &amp; main hall</>,
    meta: "Raleigh",
  },
  {
    cat: "carpet",
    img: <img src="/assets/carpet-bedroom.jpg" alt="Bedroom carpet install" loading="lazy" decoding="async" />,
    gCat: "Carpet",
    title: "Plush bedroom",
    meta: "Raleigh",
  },
  {
    cat: "carpet",
    img: (
      <img
        src="/assets/carpet-spindles-1024w.webp"
        srcSet="/assets/carpet-spindles-640w.webp 640w, /assets/carpet-spindles-1024w.webp 1024w"
        sizes="(max-width: 900px) 92vw, 33vw"
        alt="Carpeted staircase with black metal spindles and surrounding hardwood"
        loading="lazy"
        decoding="async"
      />
    ),
    gCat: "Carpet",
    title: "Staircase with black spindles",
    meta: "Raleigh",
  },
  {
    cat: "carpet",
    img: <img src="/assets/carpet-stairs.jpg" alt="Carpeted staircase" loading="lazy" decoding="async" />,
    gCat: "Carpet",
    title: "Full staircase runner",
    meta: "Durham",
  },
  {
    cat: "refinish",
    img: <img src="/assets/refinish-during.jpg" alt="Floor refinishing in progress" loading="lazy" decoding="async" />,
    gCat: "Refinish",
    title: <>Full sand &amp; refinish</>,
    meta: "In progress",
  },
];

export default function Gallery() {
  const [filter, setFilter] = useState("all");

  return (
    <section className="section gallery" id="gallery">
      <div className="container">
        <h2 className="section-label fade-up">Selected work</h2>
        <p className="section-headline fade-up">Twenty-five years, one floor at a time.</p>

        <div className="gallery-filter fade-up" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={"g-pill" + (filter === f.key ? " is-active" : "")}
              type="button"
              data-filter={f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="gallery-grid fade-up">
          {TILES.map((tile, i) => (
            <figure
              key={i}
              className={
                "g-tile" +
                (tile.tileClass ? ` ${tile.tileClass}` : "") +
                (filter === "all" || filter === tile.cat ? "" : " is-dim")
              }
              data-cat={tile.cat}
            >
              {tile.img}
              <figcaption className="g-caption">
                <span className="g-cat">{tile.gCat}</span>
                <span className="g-title">{tile.title}</span>
                <span className="g-meta">{tile.meta}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
