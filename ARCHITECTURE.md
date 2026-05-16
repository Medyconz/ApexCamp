# Apex Camp Website Architecture

Last updated: 2026-05-17

## Project Summary

Apex Camp is a static HTML/CSS/JavaScript website with a lightweight Cloudflare Worker backend. The public site markets the camp, shows activities and merch, accepts registrations/applications/contact messages, and includes an admin dashboard for viewing submissions and editing public settings.

Primary GitHub repository:

- `Medyconz/ApexCamp`

Local workspace used by Codex:

- `C:\Users\Asus\Documents\New project`

## Runtime And Hosting

The site is designed to run as a Cloudflare Worker with static assets.

Cloudflare Worker:

- Worker name: `apexcamp`
- Main entry: `worker.js`
- Static assets binding: `ASSETS`
- KV database binding: `DB`
- Required secret: `ADMIN_TOKEN`
- Optional secrets for email: `RESEND_API_KEY`, `NOTIFY_EMAIL`, `FROM_EMAIL`
- Optional media binding: R2 bucket named `MEDIA`

Relevant Cloudflare config is in `wrangler.toml`:

```toml
name = "apexcamp"
main = "worker.js"
compatibility_date = "2026-05-14"

assets = { directory = ".", binding = "ASSETS" }

[[kv_namespaces]]
binding = "DB"
id = "a94018bdcb7143caaf496f6fd0e2cebe"
```

Do not commit real secrets. `ADMIN_TOKEN` must be set as a Worker secret in Cloudflare, and the admin login page expects the user to type the same value.

## File Map

Public pages:

- `index.html`: homepage, logo, trust content, activity highlights, and hero video.
- `activities.html`: activity overview.
- `register.html`: camp registration form with dynamic week choices, child count, student details, price estimate, payment instructions, and confirmation summary.
- `merch.html`: public merch page populated from editable site config.
- `apply-counsellor.html`: counsellor application form.
- `apply-instructor.html`: instructor application form.
- `about.html`: camp story and values.
- `contact.html`: contact form.
- `faq.html`: FAQ page.
- `thanks.html`: fallback thank-you page for non-JS submissions.
- `admin.html`: admin dashboard.

Shared assets and styling:

- `styles.css`: main site styling.
- `cms.css`: registration dates, merch, pricing, admin content controls, and payment styles.
- `enhancements.css`: responsive mobile menu, trust band, confirmation strip, filters, and media upload polish.
- `script.js`: public client behavior, dynamic site config, mobile nav, registration pricing, payment info, merch rendering, form submission, and confirmation summary.
- `admin.js`: admin login, records table, filters, filtered CSV export, date editor, pricing/payment editor, merch editor, and media upload handling.
- `Profile Picture 1.jpg.jpeg`: Apex logo used throughout the site.
- `assets/WhatsApp Video 2026-05-15 at 13.15.58.mp4`: uploaded homepage hero video path.
- `assets/apex-camp-home.mp4`: cleaner homepage video fallback path.

Backend:

- `worker.js`: Cloudflare Worker API, validation, pricing, KV persistence, optional email notifications, optional R2 media uploads.
- `schema.sql`: older schema/reference file. The current deployed backend uses Workers KV, not D1 SQL.
- `ADMIN_SETUP.md`: setup notes for admin/backend.
- `README.md`: deployment and binding notes.
- `robots.txt` and `sitemap.xml`: search engine guidance.

## Homepage Video

The homepage video currently tries these MP4 sources in order:

```html
assets/WhatsApp%20Video%202026-05-15%20at%2013.15.58.mp4
WhatsApp%20Video%202026-05-15%20at%2013.15.58.mp4
assets/apex-camp-home.mp4
```

If the live video does not play, confirm the MP4 exists in GitHub in either `assets/` or the repo root, then wait for Cloudflare to redeploy and hard refresh. The poster image is the logo, so seeing only the logo usually means the MP4 URL is missing, not served yet, or blocked by the deployed asset list.

## Public API Routes

All API routes live in `worker.js`.

Public routes:

- `GET /api/site-config`: returns editable site config, including camp weeks, pricing, payment settings, and merch products.
- `POST /api/register`: validates and saves a camp registration.
- `POST /api/apply-counsellor`: saves a counsellor application.
- `POST /api/apply-instructor`: saves an instructor application.
- `POST /api/contact`: saves a contact message.
- `GET /media/<key>`: serves R2 media when the `MEDIA` binding exists.

Admin routes, protected by `ADMIN_TOKEN`:

- `GET /api/admin/summary`: counts records by type.
- `GET /api/admin/submissions?type=registrations`: returns records for the selected type.
- `PATCH /api/admin/submissions`: updates a record status.
- `GET /api/admin/export?type=registrations`: exports all records of a type from the backend.
- `GET /api/admin/site-config`: returns editable site config.
- `PUT /api/admin/site-config`: saves editable camp weeks, pricing, payment settings, and merch products.
- `POST /api/admin/media`: uploads images/videos to R2 when `MEDIA` is configured.

Admin authentication is simple bearer-token auth:

```http
Authorization: Bearer <ADMIN_TOKEN>
```

The browser stores the token in `localStorage` under:

```text
apexAdminToken
```

## KV Data Model

All data is stored in Workers KV using the prefix:

```text
apexcampwebsite:
```

Key patterns:

- `apexcampwebsite:site-config`
- `apexcampwebsite:registrations:<id>`
- `apexcampwebsite:counsellors:<id>`
- `apexcampwebsite:instructors:<id>`
- `apexcampwebsite:contacts:<id>`

Registration records include selected camp weeks, child count, total week count, server-calculated estimated total, parent/guardian details, emergency contact details, student medical details, and a workflow `status`.

## Registration Pricing

Pricing was taken from the user-provided camp pricing image and is now editable in the admin dashboard.

Default pricing matrix:

| Children | 1 Week | 2 Weeks | 3 Weeks | 4 Weeks |
| --- | ---: | ---: | ---: | ---: |
| 1 Child | 185 KD | 333 KD | 471 KD | 592 KD |
| 2 Children | 333 KD | 599 KD | 849 KD | 1065 KD |
| 3 Children | 471 KD | 849 KD | 1202 KD | 1509 KD |

The public form estimates prices for 1 to 4 selected weeks. For 5 or more selected weeks, it tells parents the Apex Camp team will confirm pricing.

## Camp Weeks

Default registration weeks are in `worker.js` under `DEFAULT_SITE_CONFIG.camp_weeks`.

Current default weeks:

- Week 1: June 14-18, 2026
- Week 2: June 21-25, 2026
- Week 3: June 28-July 2, 2026
- Week 4: July 5-9, 2026
- Week 5: July 12-16, 2026
- Week 6: July 19-23, 2026
- Week 7: July 26-30, 2026
- Week 8: August 2-6, 2026
- Week 9: August 9-13, 2026

Admins can edit active week labels from `admin.html` in the Registration Dates tab. The public registration form fetches active weeks through `/api/site-config`.

## Admin Features

Current admin dashboard capabilities:

- View registrations, counsellor applications, instructor applications, and contact messages.
- Search records.
- Filter registrations by status, selected week, number of children, and minimum estimated total.
- Update record status.
- Export the currently visible filtered rows as CSV from the browser.
- Edit registration dates.
- Edit registration pricing and parent-facing payment instructions.
- Edit merch products, prices, descriptions, buy links, active state, and images.

## Merch And Media

Merch products are part of `site-config`.

Fields:

- `id`
- `name`
- `price`
- `image_url`
- `description`
- `buy_url`
- `active`

Image behavior:

- If the Worker has an R2 binding named `MEDIA`, admin uploads go to `/api/admin/media` and are served from `/media/...`.
- If R2 is not configured and the file is an image, `admin.js` falls back to a compressed JPEG data URL stored in KV.
- Video upload needs R2. Data URL fallback is intentionally image-only.

## Email Notifications

`worker.js` can send optional email notifications using a Resend-compatible API call.

Required secrets to enable it:

- `RESEND_API_KEY`
- `NOTIFY_EMAIL`

Optional:

- `FROM_EMAIL`

If these secrets are missing, submissions still save normally and email notification is skipped.

## Design Notes

The site is bright and camp-friendly, based on the logo colors: blue, lime, and red. CSS uses OKLCH values and readable type. Admin screens stay practical and scan-friendly; public pages use more energetic brand moments.

For future visual work, follow the `impeccable` guidance in `AGENTS.md`. This repo currently does not have `PRODUCT.md` or `DESIGN.md`, so adding those would make future design passes more consistent.

## Admin Token Troubleshooting

If the admin token does not work:

1. Confirm the Worker has a secret named exactly `ADMIN_TOKEN`.
2. Confirm the token typed into `/admin.html` matches the secret exactly.
3. Confirm the Worker has a KV binding named exactly `DB`.
4. Confirm static assets binding is named exactly `ASSETS`.
5. Hard refresh the browser or clear `localStorage` key `apexAdminToken`.
6. Open browser dev tools and check the response from `/api/admin/summary`.

Common backend errors:

- `ADMIN_TOKEN is not configured.` means the secret is missing.
- `Invalid admin token.` means the typed token does not match the Worker secret.
- `Workers KV binding DB is not configured.` means the `DB` binding is missing or not deployed.
- `R2 binding MEDIA is not configured.` means direct media uploads need an R2 bucket binding named `MEDIA`.

## Deployment Workflow

The intended workflow:

1. Edit files in GitHub repo `Medyconz/ApexCamp`.
2. Cloudflare Worker connected to GitHub redeploys automatically.
3. Hard refresh browser with `Ctrl + F5`.
4. Test public pages and admin dashboard.

## Known Limitations

- No real payment checkout yet, only payment instructions/link after registration.
- Admin auth is a single shared token, not per-user accounts.
- KV is simple and easy but not relational. For heavier reporting or complex queries, consider D1.
- Homepage video filename contains spaces. For long-term cleanliness, rename it to `assets/apex-camp-home.mp4` when convenient.
- Instructor document uploads are present in the form UI, but the backend does not yet store those files.

## Good Next Improvements

- Add per-admin users instead of one shared `ADMIN_TOKEN`.
- Add a real payment provider checkout flow.
- Add D1 if reporting needs become more complex.
- Add browser QA screenshots for mobile and desktop after major UI changes.
