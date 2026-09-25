# UbuntuLink — Deployment Guide

How to deploy all three services from scratch. Written for whoever owns the GitHub repo, since
connecting Render and Vercel requires installing GitHub Apps — which only the repo owner (or an
org admin) can do.

| Service | Platform | Source |
|---|---|---|
| Backend (Java / Spring Boot) | Render — Docker | `backend/` |
| ML service (Python / FastAPI) | Render — Python | `python/` |
| Frontend (React / Vite) | Vercel | `frontend/` |

**Nothing has been deployed before**, so this is a first-time setup, not a redeploy.

---

## Before you start

You'll need accounts on **Render** and **Vercel** (both free tiers are fine — GitHub login is easiest), and these three secret values, which are **not in this repo** — get them from the team:

| Value | What it is |
|---|---|
| `SUPABASE_DB_URL` | Postgres connection string, in **JDBC** form: `jdbc:postgresql://…` |
| `ANTHROPIC_API_KEY` | Anthropic key (`sk-ant-…`) for the AI classification/pricing calls |
| `JWT_SECRET` | **Generate a new one for production** — any random 32+ character string. Don't reuse the local dev value. |

> Never commit these. They go straight into the Render/Vercel dashboards.

**Order matters.** The backend needs the frontend's URL (for CORS), and the frontend needs the
backend's URL (baked in at build time). Neither exists yet, so: deploy Render first → deploy
Vercel with the Render URLs → come back and fill in the frontend URL on Render. Steps 1–4 below
do exactly that; don't skip ahead.

---

## Step 1 — Deploy the backend + ML service (Render)

Both are defined in [`render.yaml`](render.yaml) at the repo root, so Render creates them together.

1. Render dashboard → **New → Blueprint**
2. Connect the GitHub repo. If it's not listed, install the Render GitHub App on it — this is the
   step that requires repo-owner access.
3. Branch: **`master`**
4. Render reads `render.yaml` and proposes two services: `ubuntulink-backend` and
   `ubuntulink-ml-service`
5. **Set the region to Frankfurt (EU Central)** for both. The Supabase database is in
   `eu-central-1` — the default Oregon region puts a transatlantic round trip on every single
   database query.
6. Pick the **Free** plan for both unless you want them always-on.
7. Fill in the environment variables it prompts for (these are marked `sync: false` in the
   blueprint, which is why they're not committed):

   **`ubuntulink-backend`**
   | Variable | Value |
   |---|---|
   | `SUPABASE_DB_URL` | the JDBC connection string |
   | `JWT_SECRET` | your newly generated production secret |
   | `FRONTEND_URL` | **leave blank** — filled in at Step 3 |

   **`ubuntulink-ml-service`**
   | Variable | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | the Anthropic key |
   | `FRONTEND_URL` | **leave blank** — filled in at Step 3 |

8. **Apply.**

The ML service builds in a couple of minutes. The backend takes longer — it's a multi-stage Docker
build that runs a full Maven build inside the image, so give it 5–10 minutes on the first run.

**Check it worked** (replace with your real URLs):

```bash
curl https://ubuntulink-ml-service.onrender.com/health
# expect: {"status":"ok"}

curl -i https://ubuntulink-backend.onrender.com/api/services
# expect: HTTP 401
```

That **401 is correct, not a failure** — every route except `/auth/**` requires a JWT. It proves
the app booted and security is active. A 502/503 means it didn't start; see Troubleshooting.

Now copy both service URLs — you need them next.

## Step 2 — Deploy the frontend (Vercel)

1. Vercel → **Add New → Project** → import the same repo
2. **Root Directory: `frontend`** ← easy to miss, and it fails confusingly if you leave it at the repo root
3. Framework preset should auto-detect **Vite** (from `frontend/vercel.json`)
4. Add these environment variables **in Vercel**:

   | Variable | Value |
   |---|---|
   | `VITE_API_BASE_URL` | your Render **backend** URL from Step 1 |
   | `VITE_ML_API_BASE_URL` | your Render **ML service** URL from Step 1 |

   > These must be set here, in Vercel — **not** as GitHub secrets. Vite inlines `VITE_*`
   > variables into the JavaScript bundle at build time, and Vercel is what runs that build. Set
   > them anywhere else and the deployed site silently falls back to `http://localhost:8080`,
   > which fails for every real user with no obvious error message.

5. **Deploy**, then copy the resulting Vercel URL.

## Step 3 — Close the loop (CORS)

Back in Render, on **both** services: **Environment** → set `FRONTEND_URL` to the Vercel URL from
Step 2 → save (each service redeploys automatically).

Skip this and the site loads fine but every API call is blocked by the browser with a CORS error —
both the backend's `SecurityConfig` and the ML service's CORS middleware read `FRONTEND_URL` to
decide which origin to allow.

## Step 4 — Verify end to end

Open the Vercel URL and:

1. **Register** an account → **Log in**
2. Complete onboarding → land on the dashboard
3. **Describe your problem** → type something like *"my kitchen sink is leaking"* → the AI
   classification should come back with a category (this proves the ML service, the Anthropic
   key, and CORS are all working)
4. Continue to **Matching Providers** → real providers should appear (proves the backend and the
   database connection are working)

If all four work, the deployment is good.

Two demo accounts are seeded automatically on the backend's first boot, if you'd rather not
register — `customer@ubuntulink.demo` and `provider@ubuntulink.demo`, both with password
`Demo1234!`. Use two browser sessions (one normal, one incognito) to test the full
customer↔provider quote flow; see INSTRUCTIONS.md §2d for that walkthrough.

## Step 5 — Optional: automatic redeploys

There's a GitHub Actions pipeline at `.github/workflows/cd.yml` that builds all three services on
every push to `master` and then triggers the deploys. Until its secrets exist, its deploy steps
just skip with a warning, so it's harmless to ignore.

To switch it on, add these under repo **Settings → Secrets and variables → Actions**:

| Secret | Where to get it |
|---|---|
| `RENDER_BACKEND_DEPLOY_HOOK` | Render → `ubuntulink-backend` → Settings → **Deploy Hook** |
| `RENDER_ML_DEPLOY_HOOK` | Render → `ubuntulink-ml-service` → Settings → **Deploy Hook** |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | run `vercel link` in `frontend/`, read `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | same file |

Deploy hook URLs are themselves credentials — anyone holding one can trigger a deploy, so don't
paste them into issues or chat. Full detail in [CD_PIPELINE.md](CD_PIPELINE.md).

Alternatively, skip Actions entirely: Render and Vercel can both watch `master` themselves and
redeploy on push, with no secrets at all. You lose the pre-deploy build check, but it's less
machinery. Don't enable both — every push would deploy twice.

---

## Things to expect

**Cold starts.** On Render's free tier both services sleep after inactivity, so the first request
after a quiet spell takes 30–60 seconds. Not a bug. It makes the first page load after idle feel
broken when it isn't.

**The backend seeds data on first boot.** `DevDataSeeder` runs against the real Supabase database.
The service catalog already has data, so that part no-ops; it will create the two
`@ubuntulink.demo` login accounts if they're missing.

**Deploy ≠ finished.** Triggering a Render deploy returns immediately; the build runs for minutes
afterward. Watch the service's **Logs** tab for the real outcome.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Repo not listed in Render/Vercel | The GitHub App isn't installed on it. Needs the repo owner — collaborators on a personal repo can't reach Settings. |
| Backend build fails in Docker | Check the build log. The image runs a full Maven build; a genuine compile error shows up here. |
| Backend deploys but won't start (502/503) | Missing env var. The logs will show `Could not resolve placeholder 'SUPABASE_DB_URL'` or `'JWT_SECRET'`. |
| `/api/services` returns 401 | **Correct.** Auth is enforced on everything except `/auth/**`. |
| Site loads, but every API call fails | Either `FRONTEND_URL` on Render doesn't match the Vercel URL (CORS — Step 3), or `VITE_*` wasn't set in Vercel (Step 2). Browser console will say which. |
| Frontend calls `localhost:8080` in production | `VITE_API_BASE_URL` wasn't set **in Vercel** before the build. Set it and redeploy — a rebuild is required, since the value is baked into the bundle. |
| AI classification fails, rest works | `ANTHROPIC_API_KEY` missing/invalid on the ML service, or the ML service is cold-starting — retry after a minute. |
| Vercel build fails | Confirm **Root Directory** is `frontend`. |
| Everything slow | Region mismatch — services in Oregon talking to a Frankfurt database. Recreate in Frankfurt (Step 1.5). |
