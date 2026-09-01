const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { COPY } = require("../lib/admin-empty");

const root = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

describe("satellite leftover bugs", () => {
  it("privacy, terms, and thank-you no longer use the squashed horizontal logo", () => {
    for (const file of ["privacy.html", "terms.html", "thank-you.html"]) {
      const html = read(file);
      assert.equal(html.includes("logo-horizontal.webp"), false, file);
      assert.match(html, /assets\/icon\.png/);
      assert.match(html, /logo-wordmark-primary/);
      assert.match(html, /href="#main"/);
      assert.match(html, /id="main"/);
      assert.match(html, /tabindex="-1"/);
    }
  });

  it("legal tel links use the real E.164 number", () => {
    for (const file of ["privacy.html", "terms.html"]) {
      const html = read(file);
      assert.match(html, /tel:\+13305730370/);
      assert.equal(html.includes("tel:3305730370"), false, file);
    }
  });

  it("thank-you loads the same GTM container as the homepage so conversion can fire", () => {
    const home = read("index.html");
    const thanks = read("thank-you.html");
    assert.match(home, /GT-NM2HNMF7/);
    assert.match(thanks, /GT-NM2HNMF7/);
    assert.match(thanks, /If you don't hear back soon, call the office directly or send a follow-up message from the contact section\./);
    assert.match(thanks, /class="nav scrolled"/);
  });
});

describe("homepage leftover a11y + honest copy", () => {
  const html = read("index.html");

  it("exposes a skip link and a main landmark", () => {
    assert.match(html, /class="skip-link"[^>]*href="#main"/);
    assert.match(html, /<main id="main" tabindex="-1">/);
    assert.match(html, /aria-expanded="false"/);
    assert.match(html, /aria-controls="navLinks"/);
    assert.match(read("main.js"), /if \(anchor\.classList\.contains\('skip-link'\)\) return;/);
  });

  it("does not rewrite the FAQ types answer claimed by PR 3", () => {
    assert.match(
      html,
      /We handle the full spectrum of residential and commercial flooring/
    );
  });

  it("treats leveling as prep, not a standalone product", () => {
    assert.match(html, /not a standalone service listed on this site/);
    assert.equal(html.includes("We provide full-pour leveling services"), false);
  });

  it("does not claim a rotating crew in the complex-project FAQ", () => {
    assert.match(html, /not a rotating crew/);
    assert.equal(html.includes("No project is too complex for our team"), false);
  });

  it("drops leftover tile / business claims in Why Flooring Hub", () => {
    assert.match(html, /hardwood, LVP, laminate, and carpet/);
    assert.equal(html.includes("tile, carpet, and more"), false);
    assert.match(html, /your home is protected throughout the project/);
    assert.equal(html.includes("your home or business is protected"), false);
  });

  it("lets people request the refinish work already on the site", () => {
    assert.match(html, /<option value="refinish">Sand &amp; Refinish<\/option>/);
  });

  it("adds the existing social image to JSON-LD and does not invent reviews", () => {
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(match, "JSON-LD script");
    const data = JSON.parse(match[1]);
    assert.equal(
      data.image,
      "https://www.flooringhubnc.com/assets/flooringhub-social-preview-20260515.jpg"
    );
    assert.equal(data.aggregateRating.reviewCount, "9");
    const names = data.hasOfferCatalog.itemListElement.map(
      (item) => item.itemOffered.name
    );
    assert.ok(names.includes("Hardwood Floor Refinishing"));
    assert.match(data.description, /Raleigh's trusted flooring specialist/);
  });

  it("leaves CRM / 555 / likely-service leftovers to the other leftover PRs", () => {
    assert.match(html, /Secure lead intake/);
    assert.match(html, /\(555\) 123-4567/);
    assert.match(html, /we likely service your area too/);
  });
});

describe("robots, OG, IndexNow, admin empty leftovers", () => {
  it("keeps crawlers off admin, API, and the noindex thank-you page", () => {
    const robots = read("robots.txt");
    assert.match(robots, /Disallow: \/admin\//);
    assert.match(robots, /Disallow: \/api\//);
    assert.match(robots, /Disallow: \/thank-you\.html/);
    assert.match(robots, /Sitemap: https:\/\/www\.flooringhubnc\.com\/sitemap\.xml/);
  });

  it("drops leftover SaaS OG footer copy", () => {
    const og = read("api/og.ts");
    assert.match(og, /Free in-home estimates/);
    assert.equal(og.includes("Built for search + sharing"), false);
  });

  it("does not submit the noindex thank-you page to IndexNow", () => {
    const script = read("scripts/submit-indexnow.mjs");
    assert.equal(script.includes("/thank-you.html"), false);
    assert.match(script, /\/privacy\.html/);
  });

  it("admin empty copy does not invent Jobber live data", () => {
    const admin = read("admin/jobber.html");
    assert.match(admin, new RegExp(COPY.noscript.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(admin, /FLOORING_HUB_ADMIN_EMPTY/);
    assert.match(admin, /\[hidden\] \{ display: none !important; \}/);
    assert.match(admin, /every lead submitted at <code>flooringhubnc.com<\/code> becomes a Request/);
    assert.equal(admin.includes("live Jobber jobs"), true);
  });
});
