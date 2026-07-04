# FlooringHub

## Purpose
Marketing and service website for Flooring Hub (Raleigh, NC), delivered as a fully static site with branded assets and static SEO/security metadata.

## Platform & stack
- **Framework:** Next.js (App Router) + React + TypeScript, statically exported (`output: "export"` → plain HTML/CSS/JS in `out/`)
- **Styling:** Tailwind CSS v4 + the original hand-written stylesheet (`app/site.css`); shadcn/ui configured (`components.json`)
- **Hosting target:** Vercel (`vercel.json` present)
- **Lead capture:** root `/api` directory remains plain Vercel serverless functions (Jobber integration), deployed independently of Next

## Structure
- `app/` — routes: `/` (home), `/privacy`, `/terms`, `/thank-you`; global metadata in `app/layout.tsx`
- `components/` — one component per page section, ported 1:1 from the original static HTML
- `lib/site-config.ts` — single source of truth for company contact details
- `public/` — static assets (images, `sitemap.xml`, `robots.txt`, IndexNow key file, `admin/jobber.html`)
- `api/` + `lib/jobber-*.js` — Vercel serverless lead/OAuth endpoints (excluded from the Next build)
- `scripts/submit-indexnow.mjs` — weekly IndexNow submission (`.github/workflows/indexnow.yml`)

## Local workflow
```bash
cd /Volumes/SitHub/clients/flooringhub
npm install
npm run dev     # local dev server
npm run build   # static export into ./out
```

## Deployment contract
- `next build` emits `out/index.html`, `out/privacy.html`, `out/terms.html`, `out/thank-you.html` — the same `.html` URL structure as the original static site, so `sitemap.xml` and the IndexNow script keep working unchanged.
- Deployment is driven by `vercel.json` in this repo.
