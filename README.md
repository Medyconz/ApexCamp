# Apex Camp Worker Website

Apex Camp website and admin backend for Cloudflare Workers.

This repo is designed so Cloudflare can deploy the site directly from GitHub. The Worker serves the public camp website, saves registrations/applications/contact messages, and provides an admin dashboard for viewing records and editing camp dates, registration pricing, payment instructions, and merch products.

## Required Cloudflare setup

1. Create a Cloudflare Worker connected to this GitHub repo.
2. Add an Assets binding named `ASSETS` for the repo files.
3. Create a Workers KV namespace for Apex Camp submissions.
4. Add a KV binding named `DB` pointing to that namespace.
5. Add a Worker secret named `ADMIN_TOKEN` with a private password/token you choose.
6. Deploy the Worker.
7. Open `/admin.html` and enter the same `ADMIN_TOKEN`.

## Optional setup

- Email notifications: add secrets `RESEND_API_KEY` and `NOTIFY_EMAIL`. Optionally add `FROM_EMAIL`. When set, the Worker sends an email after new registrations, applications, or contact messages.
- Direct media uploads: create an R2 bucket and bind it to the Worker as `MEDIA`. Admin merch image uploads will use R2 when this binding exists. Without R2, image uploads fall back to compressed embedded images for small catalogs.

## Public routes

- `/` homepage
- `/activities.html`
- `/register.html`
- `/merch.html`
- `/apply-counsellor.html`
- `/apply-instructor.html`
- `/about.html`
- `/contact.html`
- `/faq.html`
- `/thanks.html`

## Admin routes

- `/admin.html`
- `GET /api/admin/summary`
- `GET /api/admin/submissions?type=registrations`
- `PATCH /api/admin/submissions`
- `GET /api/admin/export?type=registrations`
- `GET /api/admin/site-config`
- `PUT /api/admin/site-config`
- `POST /api/admin/media`

Admin API requests require:

```http
Authorization: Bearer <ADMIN_TOKEN>
```

## Notes

The live admin database uses Workers KV under the key prefix `apexcampwebsite:`. Keep your `ADMIN_TOKEN` and email API secrets private and do not commit them to GitHub.
