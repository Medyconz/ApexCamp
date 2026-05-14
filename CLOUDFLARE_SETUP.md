# Cloudflare Setup For Apex Camp

## 1. Create a new Worker from GitHub

1. Open Cloudflare Dashboard.
2. Go to Workers & Pages.
3. Create a new Worker or import from GitHub.
4. Select `Medyconz/ApexCamp`.
5. Use `worker.js` as the Worker entrypoint.

## 2. Create the database

This Worker uses Workers KV as the submission database.

1. Go to Workers & Pages.
2. Open KV.
3. Create a namespace named `ApexCampDB`.
4. Copy the namespace ID.

## 3. Add the binding

In the Worker settings, add a KV binding:

- Variable name: `DB`
- KV namespace: `ApexCampDB`

If deploying with Wrangler, replace `REPLACE_WITH_KV_NAMESPACE_ID` in `wrangler.toml` with the namespace ID.

## 4. Add the admin token

In Worker Settings → Variables and Secrets, add a secret:

- Name: `ADMIN_TOKEN`
- Value: any strong private password/token you choose

Keep this token private. You will enter it on `/admin.html`.

## 5. Deploy and test

Open:

- `/register.html` to submit a test registration
- `/admin.html` to view the admin dashboard

The database keys are stored with the prefix `apexcampwebsite:`.
