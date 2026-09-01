# Flooring Hub

Marketing and service website for Flooring Hub (Raleigh, NC). Production (`flooringhubnc.com`) is the static HTML on `main`. Do not treat preview or Next.js leftover branches as production.

## Platform & stack

- **Platform:** Static HTML/CSS/JS at the repo root
- **Serverless:** Vercel functions in `api/` for lead intake, Jobber OAuth, and OG images
- **Hosting:** Vercel (`vercel.json`)

## What’s included

- Home, privacy, terms, and thank-you pages
- Shared contact facts in `lib/site-config.js` (`(330) 573-0370`, `tsmith@flooringhubnc.com`)
- Lead pipeline: webhook, then Resend, then FormSubmit
- Jobber OAuth handshake + admin page (tokens only; leads are not auto-created as Jobber Requests)
- Sitemap + robots + IndexNow key file

## Local workflow

```bash
python -m http.server
npm test
```

This checkout has no `site/` directory. Serve the root HTML files directly.

## Lead delivery

`/api/lead` forwards a valid submission to `LEAD_WEBHOOK_URL` / `JOBBER_WEBHOOK_URL` when set. If that is missing or fails, it tries Resend, then FormSubmit. Duplicate suppression only records a lead after delivery succeeds, so a failed send can be retried.

## Jobber

`/admin/jobber.html` starts the OAuth handshake and stores tokens in Upstash/Vercel KV. That is not the same as pushing website leads into Jobber Requests. Wire a webhook or finish the Request integration before claiming that path.

## Deployment contract

- `main` auto-deploys the static site. Keep production on this tree unless Will explicitly flips DNS.
- Keep `main.js`, `styles.css`, and image paths aligned with the HTML that references them.
- Do not invent testimonials, review metrics, or phone numbers.

## Tests

`npm test` runs Node’s built-in test runner over `test/`. No extra test framework and no GitHub Actions CI (CI was removed to avoid cloud billing).
