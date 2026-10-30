'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const config = JSON.parse(read('vercel.json'));
const routes = config.rewrites.filter(route => /^\/services(?:\/|$)/.test(route.source));
const origin = 'https://www.flooringhubnc.com';

test('service routes have unique search metadata, factual schema and discovery links', () => {
  assert.equal(routes.length, 6);
  const titles = new Set();
  const descriptions = new Set();
  const homeSchema = JSON.parse(read('index.html').match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  for (const { source, destination } of routes) {
    const page = read(destination.slice(1));
    const title = page.match(/<title>(.*?)<\/title>/)[1];
    const description = page.match(/<meta name="description" content="([^"]+)"/)[1];
    assert.ok(!titles.has(title), `${source}: unique title`);
    assert.ok(!descriptions.has(description), `${source}: unique description`);
    titles.add(title);
    descriptions.add(description);
    assert.equal((page.match(/<h1\b/g) || []).length, 1);
    assert.ok(page.includes(`<link rel="canonical" href="${origin}${source}">`));
    assert.ok(read('sitemap.xml').includes(`<loc>${origin}${source}</loc>`));
    assert.ok(read('llms.txt').includes(`${origin}${source}`));
    assert.ok(config.redirects.some(r => r.source === destination && r.destination === source && r.permanent));

    const graph = JSON.parse(page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
    const service = graph.find(item => item['@type'] === 'Service');
    assert.equal(service.url, origin + source);
    assert.equal(service.provider.telephone, homeSchema.telephone);
    assert.deepEqual(service.areaServed, homeSchema.areaServed);
    if (source !== '/services') {
      const offered = homeSchema.hasOfferCatalog.itemListElement.map(offer => offer.itemOffered.name);
      assert.ok(offered.some(name => name.replace(' (LVP)', '') === service.name));
    }
    const crumbs = graph.find(item => item['@type'] === 'BreadcrumbList').itemListElement;
    assert.equal(crumbs.at(-1).item, origin + source);
    assert.deepEqual(crumbs.map(item => item.position), crumbs.map((_, i) => i + 1));
    assert.ok(!/aggregateRating|reviewCount|priceRange|license|guarantee/i.test(JSON.stringify(graph)));
    for (const script of ['/lib/site-config.js', '/_vercel/insights/script.js', '/main.js']) {
      assert.equal(page.split(`src="${script}"`).length - 1, 1);
    }
    assert.match(page, /href="\/#quote"[^>]+data-cta="hero-primary"/);
    assert.match(page, /href="tel:\+13305730370"[^>]+data-cta="hero-phone"/);
  }
});

test('service pages and homepage link to real files, routes and fragment targets', () => {
  for (const file of ['index.html', ...routes.map(route => route.destination.slice(1))]) {
    const page = read(file);
    for (const match of page.matchAll(/(?:href|src)="([^"<>]+)"/g)) {
      const url = new URL(match[1], origin + '/' + file);
      if (url.origin !== origin || url.pathname.startsWith('/_vercel/')) continue;
      const route = routes.find(route => route.source === url.pathname);
      const target = (route ? route.destination : url.pathname === '/' ? '/index.html' : url.pathname).slice(1);
      assert.ok(fs.existsSync(path.join(root, target)), `${file}: ${match[1]}`);
      if (url.hash && target.endsWith('.html')) {
        assert.ok(read(target).includes(`id="${url.hash.slice(1)}"`), `${file}: ${match[1]} fragment`);
      }
    }
  }
  for (const route of routes) {
    assert.ok(read('index.html').includes(`href="${route.source}"`), `home links to ${route.source}`);
  }
});
