# Apex Camp Worker Website

Apex Camp website and admin backend for Cloudflare Workers.

This repo is designed so you can create a new Cloudflare Worker from GitHub. The Worker serves the public camp website, saves registrations/applications/contact messages, and provides an admin dashboard.

## Required Cloudflare setup

1. Create a new Cloudflare Worker connected to this GitHub repo.
2. Create a Workers KV namespace for Apex Camp submissions.
3. Add a binding named `DB` pointing to that KV namespace.
4. Add a Worker secret named `ADMIN_TOKEN` with a private password/token you choose.
5. Deploy.
6. Open `/admin.html` and enter the same `ADMIN_TOKEN`.

## Routes

- `/` homepage
- `/activities.html`
- `/register.html`
- `/apply-counsellor.html`
- `/apply-instructor.html`
- `/about.html`
- `/contact.html`
- `/faq.html`
- `/admin.html`

## Notes

The live admin database uses Workers KV under the key prefix `apexcampwebsite:`. Keep your `ADMIN_TOKEN` private and do not commit it to GitHub.
