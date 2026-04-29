# FlooringHub

## Purpose
Marketing and service website for Flooring Hub (Raleigh, NC), delivered as a static web presence with branded assets and static SEO/security metadata.

## Platform & stack
- **Platform:** Static Site
- **Runtime model:** static HTML/CSS/JS with prebuilt asset bundles
- **Hosting target:** Vercel (`vercel.json` present)

## What’s included
- Multi-page static site in root + mirrored `site/` folder
- Sitemap + robots metadata
- Static style/theme assets and brand manifest files

## Local workflow
For local verification, serve either root files or `site/` files directly with any static host.

```bash
cd /Volumes/NVME/GitHubMaster/flooringhub
# Open locally with your preferred static server (example):
python -m http.server -d .  # root site
python -m http.server -d site  # /site mirror
```

## Deployment contract
- Recommended deployment is `vercel.json` in this repo.
- Keep the `main.js`, `styles.css`, and image manifest files aligned between root and mirrored copies.

## Notes for orchestration
- Added this README to satisfy portfolio completeness checks and to explicitly document this repo as a brochure/static asset channel.
