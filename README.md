# Flooring Hub

Marketing and service website for Flooring Hub (Raleigh, NC). Production (`flooringhubnc.com`) is the static HTML on `main`. Do not treat preview or Next.js leftover branches as production.

## Platform & stack

- **Platform:** Static HTML/CSS/JS at the repo root
- **Serverless:** Vercel functions in `api/` for lead intake, Jobber OAuth, and OG images
- **Hosting:** Vercel (`vercel.json`)

## What’s included

- Home, privacy, terms, and thank-you pages
- Shared contact facts in `lib/site-config.js` (`(330) 573-0370`, `tsmith@flooringhubnc.com`)
- Lead delivery to Tom’s verified business email: configured Resend, otherwise FormSubmit
- Jobber OAuth handshake + admin page (tokens only; leads are not auto-created as Jobber Requests)
- Sitemap + robots + IndexNow key file

## Local workflow

```bash
python -m http.server
npm test
```

This checkout has no `site/` directory. Serve the root HTML files directly.

## Lead delivery

`/api/lead` sends valid inquiries only to `tsmith@flooringhubnc.com`, as confirmed by Tom on October 2, 2026. It uses Resend if `RESEND_API_KEY` and `LEAD_FROM_EMAIL` (or `RESEND_FROM_EMAIL`) are configured; otherwise it uses the existing FormSubmit email route for that recipient. A configured Resend failure is reported rather than silently switching providers. Legacy webhook, recipient and FormSubmit endpoint overrides are ignored. Duplicate suppression (10 minutes) and the per-IP rate limit live in Upstash/Vercel KV when it is configured, so they hold across serverless instances; only SHA-256 hashes are stored there, never contact details. Without KV, or if KV is unreachable, they fall back to per-instance memory rather than blocking the lead. A lead is recorded only after delivery succeeds, so a failed send can be retried.

Production delivery/activation must be verified in an approved environment; changing provider setup or credentials is separate work. Local tests mock all provider requests and send no messages. Google analytics/advertising tags are removed; Vercel analytics, Google Fonts and the embedded map remain.

## Jobber

`/admin/jobber.html` starts the OAuth handshake and stores tokens in Upstash/Vercel KV. That is not the same as pushing website leads into Jobber Requests. Website inquiries go to Tom’s email; linking policies in Jobber does not enable a Request integration.

## Deployment contract

- `main` auto-deploys the static site. Keep production on this tree unless Will explicitly flips DNS.
- Keep `main.js`, `styles.css`, and image paths aligned with the HTML that references them.
- Do not invent testimonials, review metrics, or phone numbers.

## Tests

`npm test` runs Node’s built-in test runner over `test/`. No extra test framework and no GitHub Actions CI (CI was removed to avoid cloud billing).
