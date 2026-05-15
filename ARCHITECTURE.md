# Apex Camp Website Architecture

Last updated: 2026-05-15

## Project Summary

Apex Camp is a static HTML/CSS/JavaScript website with a lightweight Cloudflare Worker backend. The public site markets the camp, shows activities, accepts registrations/applications/contact messages, displays merch, and includes an admin dashboard for viewing submissions and editing some public content.

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

Do not commit the actual `ADMIN_TOKEN`. It must be set as a Worker secret in Cloudflare. The admin login page expects the user to type the same token.

## File Map

Public pages:

- `index.html`: homepage and hero. Currently wired to show `assets/apex-camp-home.mp4` as the hero video.
- `activities.html`: overview of 3D printing, aquatics, Karv Ski Block, indoor football, gymnastics, cooking, treasure hunt, music, arts and crafts.
- `register.html`: camp registration form with dynamic camp weeks, child count, student details, and price estimate.
- `merch.html`: public Apex Camp merch page, populated from site config.
- `apply-counsellor.html`: counsellor application form.
- `apply-instructor.html`: instructor application form.
- `about.html`: camp story and values.
- `contact.html`: contact form.
- `faq.html`: FAQ page.
- `thanks.html`: fallback thank-you page for non-JS form submission.
- `admin.html`: admin dashboard.

Shared assets and styling:

- `styles.css`: main site styling, including homepage, forms, admin shell, and hero video styling.
- `cms.css`: extra styles for registration dates, merch editor, pricing table, merch cards, and admin content controls.
- `script.js`: public client-side behavior, dynamic camp weeks, merch rendering, registration price estimate, form submission.
- `admin.js`: admin dashboard behavior, login token storage, records table, status updates, date editor, merch editor, image upload/compression.
- `Profile Picture 1.jpg.jpeg`: Apex logo used throughout the site.
- `assets/apex-camp-home.mp4`: intended homepage hero video path.

Backend:

- `worker.js`: Cloudflare Worker API and KV persistence layer.
- `schema.sql`: older schema/reference file. The current deployed backend uses Workers KV, not D1 SQL.
- `ADMIN_SETUP.md`: setup notes for admin/backend.
- `README.md`: shorter deployment notes.

## Important Current Asset Note

The homepage is already coded to load:

```html
assets/apex-camp-home.mp4
```

The video was copied locally to:

```text
C:\Users\Asus\Documents\New project\assets\apex-camp-home.mp4
```

However, because the GitHub connector cannot reliably upload binary MP4 files, the MP4 may still need to be manually uploaded to GitHub at exactly:

```text
assets/apex-camp-home.mp4
```

If the homepage video does not appear live, check that this file exists in the GitHub repo and Cloudflare has redeployed.

## Public API Routes

All API routes live in `worker.js`.

Public routes:

- `GET /api/site-config`: returns editable site config from KV, including camp weeks and merch products.
- `POST /api/register`: saves a camp registration.
- `POST /api/apply-counsellor`: saves a counsellor application.
- `POST /api/apply-instructor`: saves an instructor application.
- `POST /api/contact`: saves a contact message.

Admin routes, protected by `ADMIN_TOKEN`:

- `GET /api/admin/summary`: counts records by type.
- `GET /api/admin/submissions?type=registrations`: returns records for the selected type.
- `PATCH /api/admin/submissions`: updates a record status.
- `GET /api/admin/export?type=registrations`: exports CSV.
- `GET /api/admin/site-config`: returns editable site config.
- `PUT /api/admin/site-config`: saves editable site config.

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

Records are JSON objects.

Registration records include:

- `camp_weeks`: array of selected week labels.
- `child_count`: number from 1 to 3.
- `total_weeks`: selected week count.
- `estimated_total_kd`: saved price string when price exists.
- Parent/guardian fields.
- Emergency contact fields.
- Student 1 fields.
- Student 2 fields when child count is 2 or 3.
- Student 3 fields when child count is 3.
- `status`: one of `new`, `reviewed`, `contacted`, `accepted`, `archived`.

## Registration Pricing

Pricing was taken from the user-provided camp pricing image.

Current pricing matrix in `script.js` and `worker.js`:

| Children | 1 Week | 2 Weeks | 3 Weeks | 4 Weeks |
| --- | ---: | ---: | ---: | ---: |
| 1 Child | 185 KD | 333 KD | 471 KD | 592 KD |
| 2 Children | 333 KD | 599 KD | 849 KD | 1065 KD |
| 3 Children | 471 KD | 849 KD | 1202 KD | 1509 KD |

The UI estimates prices for 1 to 4 selected weeks. If a family selects 5 or more weeks, the UI tells them the Apex Camp team will confirm pricing because the source image only listed up to 4 weeks.

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

## Merch Admin

Merch products are part of `site-config`.

Fields:

- `id`
- `name`
- `price`
- `image_url`
- `description`
- `buy_url`
- `active`

The admin merch editor no longer requires admins to paste image URLs. It has an image upload control in `admin.js`.

Important implementation detail:

- Uploaded product images are resized/compressed in the browser.
- They are stored as JPEG data URLs in the `image_url` field.
- This avoids requiring R2 or another image hosting service.

This is convenient for a small merch catalog. If the catalog grows or images become large, migrate product images to Cloudflare R2 and store public R2 URLs in `image_url`.

## Design System Notes

The site is intentionally bright and camp-friendly, based on the logo colors:

- Blue
- Lime
- Red

CSS uses OKLCH color values in `styles.css`. Typography uses:

- `Baloo 2` for expressive headings.
- `Atkinson Hyperlegible` for readable body text.

UI rules already followed:

- Cards use small `8px` radius.
- Forms use explicit labels.
- Buttons and focus states are visible.
- Registration pricing and estimates are designed for quick parent scanning.

For future visual work, use the `impeccable` skill/instructions from `AGENTS.md`.

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

## Deployment Workflow

The intended workflow:

1. Edit files in GitHub repo `Medyconz/ApexCamp`.
2. Cloudflare Worker connected to GitHub redeploys automatically.
3. Hard refresh browser with `Ctrl + F5`.
4. Test public pages and admin dashboard.

Because the local machine may not have `git` or `gh` available, prior work was mostly pushed through the GitHub connector rather than local git commands.

## Known Limitations

- No real payment system yet.
- No email notifications yet.
- Admin auth is a single shared token, not per-user accounts.
- KV is simple and easy but not relational. For heavier reporting or complex queries, consider D1.
- Merch image upload stores compressed data URLs in KV. This is easy but not ideal for large image libraries.
- Homepage video file may need manual GitHub upload at `assets/apex-camp-home.mp4`.

## Good Next Improvements

- Add email notification for new registrations.
- Add payment workflow or payment instructions.
- Add downloadable registration summary.
- Add R2-backed media uploads for merch and homepage media.
- Add admin controls for camp pricing instead of hardcoding prices in `script.js` and `worker.js`.
- Add per-admin users instead of one shared `ADMIN_TOKEN`.
- Add browser QA screenshots for mobile and desktop after major UI changes.
