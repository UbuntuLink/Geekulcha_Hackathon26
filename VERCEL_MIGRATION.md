# Moving the frontend to a new Vercel project

How to set up a fresh Vercel deployment of the frontend, check it works, and then delete the current one
(`https://geekulcha-hackathon26.vercel.app`). The backend and ML service on Render don't move.

**Time:** about 20 minutes. **Downtime:** none, if you follow the order below: the new site is live and
tested before the old one is removed.

---

## Before you start

- **Who can do it:** connecting a GitHub repo to Vercel installs Vercel's GitHub App on the repo. On
  `leshenn/Geekulcha_Hackathon26` only **the repo owner** (or someone they grant admin) can approve that.
  If the repo doesn't appear in Vercel's import list, that's why — see *Troubleshooting*.
- **You'll need** the two Render URLs:
  - Backend, e.g. `https://ubuntulink-backend-xxxx.onrender.com`
  - ML service, e.g. `https://ubuntulink-ml-service-xxxx.onrender.com`

  Find them in the Render dashboard, or copy them from the **old** Vercel project in step 1.
- **Nothing to change in the code.** The backend and the ML service already accept requests from any
  `https://*.vercel.app` address, so a new Vercel URL works straight away.

---

## Step 1 — Write down the old project's settings

In Vercel, open the **current** project → **Settings**:

1. **Environment Variables** → note the values of `VITE_API_BASE_URL` and `VITE_ML_API_BASE_URL`.
2. **Domains** → note any **custom domain** (anything not ending in `.vercel.app`). If there is one, you'll
   move it in step 5.
3. **General → Root Directory** → should be `frontend`.

---

## Step 2 — Create the new project

1. Vercel → **Add New… → Project** → **Import** the `Geekulcha_Hackathon26` repository.
2. Configure:

   | Setting | Value |
   |---|---|
   | Project name | e.g. `ubuntulink` (this becomes `https://ubuntulink.vercel.app` if the name is free) |
   | Framework preset | **Vite** (should be detected automatically) |
   | **Root Directory** | **`frontend`** ← must be set, or the build fails |
   | Build command / Output directory | leave the defaults — `frontend/vercel.json` sets `npm run build` and `dist` |

3. **Environment Variables** — add both, for **Production** *and* **Preview**:

   | Name | Value |
   |---|---|
   | `VITE_API_BASE_URL` | the Render **backend** URL, no trailing slash |
   | `VITE_ML_API_BASE_URL` | the Render **ML service** URL, no trailing slash |

   > These must be in Vercel, not GitHub secrets. Vite bakes them into the site at build time, so if you add
   > or change them later you must **redeploy** for them to take effect.

4. **Settings → Build and Deployment → Node.js Version:** `20.x` (matches the GitHub CI build).
5. Click **Deploy** and wait for it to finish. Copy the new URL.

> **Want to keep the old URL** (`geekulcha-hackathon26.vercel.app`) instead? A `.vercel.app` name belongs to
> one project at a time, so you'd have to delete the old project first (step 6) and then create the new one
> with the same name — the site is down in between. Only do this if the old URL is printed somewhere
> you can't change (e.g. a submitted form or QR code).

---

## Step 3 — Test the new site

Open the new URL and check:

- [ ] The landing page loads, including the hero video.
- [ ] **Sign in** with `customer@ubuntulink.demo` / `Demo1234!` — tick the disclaimer first.
- [ ] **Refresh on an inner page** (e.g. `/quotes`) — it should reload that page, not show a 404.
- [ ] **Describe a problem** → the AI classifies it (proves the ML URL is right).
- [ ] **Matching providers** load (proves the backend URL is right). The ⚛ quantum badge additionally needs
      `ML_SERVICE_URL` set on the Render backend; if it's missing the page says the recommendation is
      unavailable, which isn't a Vercel problem.
- [ ] **Messages** opens and a message sends.
- [ ] **Aa Display** → switch colour modes.
- [ ] Browser dev tools (F12) → **Console**: no red CORS errors, and no requests going to `localhost`.

If calls go to `localhost:8080`, the environment variables weren't set before the build — set them and
**Redeploy** (Deployments → ⋯ → Redeploy).

---

## Step 4 — Point Render at the new site (recommended)

Not strictly needed for a `.vercel.app` URL (already allowed), but keeps the config honest and is **required
if you use a custom domain**.

In Render, on **both** `ubuntulink-backend` and `ubuntulink-ml-service` → **Environment** →
set `FRONTEND_URL` to the new site's URL (e.g. `https://ubuntulink.vercel.app`, no trailing slash) →
**Save, rebuild, and deploy**. Wait for both to show **Live**, then repeat the sign-in check.

`FRONTEND_URL` can hold several URLs separated by commas, so during the switch you can set
`https://ubuntulink.vercel.app,https://geekulcha-hackathon26.vercel.app` and remove the old one later.

---

## Step 5 — Move the custom domain (only if you have one)

1. **Old** project → Settings → **Domains** → remove the domain.
2. **New** project → Settings → **Domains** → add the same domain. Vercel keeps the DNS records the same when
   both projects are in the same Vercel account; otherwise it shows the records to update at your DNS host.
3. Add the domain to Render's `FRONTEND_URL` (step 4) — custom domains are **not** covered by the
   `*.vercel.app` allowance.

---

## Step 6 — Drop the old project

Only once the new site has passed step 3.

1. **Stop it deploying:** old project → **Settings → Git → Disconnect**. From now on only the new project
   builds on every push to `master`.
2. **Delete it:** old project → **Settings → Advanced** (bottom of General on some accounts) →
   **Delete Project** → type the project name to confirm.

   ⚠️ This is permanent: every old URL (`geekulcha-hackathon26.vercel.app` and all its preview links) stops
   working immediately. Anything that links to the old site — slides, the hackathon submission, a QR code —
   must be updated first.

---

## Step 7 — Tidy up

- [ ] **README.md** line 13: replace `https://geekulcha-hackathon26.vercel.app` with the new URL.
- [ ] **Render `FRONTEND_URL`**: remove the old URL if you added both in step 4.
- [ ] **GitHub → Settings → Secrets and variables → Actions**: if `VERCEL_PROJECT_ID` / `VERCEL_ORG_ID`
      exist, update them to the new project (run `vercel link` in `frontend/` and read
      `.vercel/project.json`). They're only used when the repo variable `DEPLOY_FRONTEND` is `true` —
      normally Vercel deploys by itself and CI doesn't touch it (see `CD_PIPELINE.md`).
- [ ] Tell the team the new URL.

---

## Rolling back

Until step 6, going back is instant: the old project is still live — just keep using its URL (and put its URL
back in Render's `FRONTEND_URL` if you changed it). After deletion there is no undo; you'd repeat step 2.

---

## Troubleshooting

| What you see | Cause and fix |
|---|---|
| Repo not in Vercel's import list | Vercel's GitHub App isn't allowed on the repo. The repo owner (`leshenn`) must approve it: GitHub → Settings → Applications → Vercel → Repository access. |
| Build fails: "Could not find package.json" | **Root Directory** isn't `frontend`. |
| Site loads, but calls go to `localhost` | `VITE_*` variables missing or added after the build → set them and **Redeploy**. |
| Sign-in fails with a CORS error | You're on a custom domain not listed in Render's `FRONTEND_URL` (step 4/5), or Render hasn't finished redeploying. |
| First request takes ~1 minute | Render's free tier sleeps when idle; the first call wakes it. Not a Vercel problem. |
| 404 when refreshing an inner page | `frontend/vercel.json` (which rewrites every path to `index.html`) wasn't picked up — check Root Directory is `frontend`. |
| Two deployments on every push | The old project is still connected to Git — do step 6.1. |
