# FlooringHub

## Purpose
Marketing site for Flooring Hub (Raleigh, NC) — Tom Smith's local flooring contractor. Next.js statically exports to the same `.html` URL contract as production (`flooringhubnc.com`).

## Platform & stack
- **Framework:** Next.js (App Router) + React + TypeScript, statically exported (`output: "export"` → plain HTML/CSS/JS in `out/`)
- **Styling:** Tailwind CSS v4 (utilities only, no preflight) + the hand-written stylesheet (`app/site.css`)
- **Hosting target:** Vercel (`vercel.json` present). Production auto-deploys from `main` (current live site is still the May 2026 static HTML).
- **Lead capture:** root `/api` directory remains plain Vercel serverless functions (Jobber integration), deployed independently of Next

## Structure
- `app/` — routes: `/`, `/privacy`, `/terms`, `/thank-you`; global metadata, fonts, and GTM in `app/layout.tsx`
- `components/` — one component per page section
- `lib/site-config.ts` — single source of truth for public contact details and paths
- `lib/webmcp.ts` — honest WebMCP tools (service info + how to request an estimate; no prices)
- `public/` — static assets, `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt`, `.well-known/mcp.json`, IndexNow key file, `admin/jobber.html`
- `api/` + `lib/jobber-*.js` — Vercel serverless lead/OAuth endpoints (excluded from the Next build)
- `scripts/submit-indexnow.mjs` — weekly IndexNow submission (`.github/workflows/indexnow.yml`)
- `.github/workflows/ci.yml` — typecheck + static export on PRs

## Local workflow
```bash
npm install
npm run dev         # local dev server
npm run typecheck
npm run build       # static export into ./out
```

## Deployment contract
- `next build` emits `out/index.html`, `out/privacy.html`, `out/terms.html`, `out/thank-you.html` — the same `.html` URL structure as the live static site.
- `vercel.json` redirects `/privacy`, `/terms`, and `/thank-you` to the `.html` URLs.
- Do not invent testimonials, metrics, phone numbers, or estimate prices. Public facts live in `lib/site-config.ts`.
