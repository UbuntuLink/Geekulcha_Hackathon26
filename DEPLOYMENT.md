# UbuntuLink — Deployment Guide

How to deploy all three services from scratch, creating each one manually so every setting is
visible. Connecting Render and Vercel requires installing their GitHub Apps, so you need **admin
on the repo** to follow this.

| Service | Platform | Type | Source folder |
|---|---|---|---|
| Backend (Java / Spring Boot) | Render | Web Service (Docker) | `backend/` |
| ML service (Python / FastAPI) | Render | Web Service (Python 3) | `python/` |
| Frontend (React / Vite) | Vercel | Project | `frontend/` |

> There is a `render.yaml` in the repo that can create both Render services automatically via
> **New → Blueprint**. This guide deliberately ignores it and creates each service by hand, so
> nothing is hidden. Use one approach or the other, not both.

---

## Before you start

Accounts on **Render** and **Vercel** (free tiers are fine; signing in with GitHub is easiest),
plus these three values — **none of them are in this repo**:

| Value | Where it comes from |
|---|---|
| `SUPABASE_DB_URL` | The Postgres connection string in **JDBC** form: `jdbc:postgresql://…` |
| `OPEN_ROUTER_API_KEY` | OpenRouter key (`sk-or-v1-…`), powers the AI classification and pricing |
| `JWT_SECRET` | **Generate a fresh one for production** — any random 32+ character string. Don't reuse a dev value. |

Generate a production JWT secret with:

```bash
openssl rand -base64 48
```

Never commit these. They are typed straight into the Render and Vercel dashboards.

**Order matters.** The backend needs the frontend's URL (for CORS) and the frontend needs the
backend's URL (baked in at build time). Neither exists yet, so the sequence is: Render first →
Vercel second → return to Render and fill in the frontend URL. Don't skip ahead.

---

## Step 1A — Backend web service (Render)

Render → **New → Web Service** → connect the GitHub repo. If it isn't listed, install the Render
GitHub App on it — that's the part needing admin.

| Field | Value |
|---|---|
| **Name** | `ubuntulink-backend` |
| **Branch** | `master` |
| **Region** | **Frankfurt (EU Central)** |
| **Root Directory** | `backend` |
| **Language** / Runtime | **Docker** |
| **Dockerfile Path** | `./Dockerfile` |
| **Build Command** | *leave empty* — the Dockerfile does the build |
| **Start Command** | *leave empty* — the image's `ENTRYPOINT` runs `java -jar app.jar` |
| **Health Check Path** | *leave empty* — every route needs a JWT, so a health check would read as failing |
| **Instance Type** | **Free** |

**Why no build or start command:** this is a Docker service. `backend/Dockerfile` is a multi-stage
build that runs Maven inside the image and ends in an `ENTRYPOINT`, so Render only builds the
image and runs it. Typing commands into those fields would override the image and break it.

Environment variables (**Advanced → Add Environment Variable**):

| Key | Value |
|---|---|
| `SUPABASE_DB_URL` | your JDBC connection string |
| `JWT_SECRET` | the production secret you generated |
| `FRONTEND_URL` | **don't add this key yet** — add it in Step 3, once the Vercel URL exists |

> **Do not create `FRONTEND_URL` with an empty value.** `SecurityConfig` reads it with
> `System.getenv().getOrDefault(...)`, which only falls back to its default when the key is
> *absent*. An empty value is still a value, so the allowed-origins list becomes `["", …]` and
> every browser request is rejected at CORS preflight with a 403 — registration and login fail
> silently, with nothing in the backend logs, because the request never reaches Spring. Leave the
> key out entirely until Step 3.

Don't set `PORT`. Render injects it, and `application.properties` already reads it
(`server.port=${PORT:8080}`), falling back to 8080 locally.

**Create Web Service.** First build takes 5–10 minutes — it compiles the whole app with Maven
inside the Docker image.

## Step 1B — ML web service (Render)

Render → **New → Web Service** → same repo.

| Field | Value |
|---|---|
| **Name** | `ubuntulink-ml-service` |
| **Branch** | `master` |
| **Region** | **Frankfurt (EU Central)** — same as the backend |
| **Root Directory** | `python` |
| **Language** | **Python 3** |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Health Check Path** | `/health` |
| **Instance Type** | **Free** |

The start command matters in three places: `--host 0.0.0.0` (not `127.0.0.1`, or Render can't
reach it), `--port $PORT` literally with the dollar sign so Render substitutes its own port, and
`app.main:app` meaning the `app` object in `python/app/main.py`.

Environment variables:

| Key | Value |
|---|---|
| `OPEN_ROUTER_API_KEY` | your OpenRouter key |
| `FRONTEND_URL` | **don't add this key yet** — add it in Step 3, same reason as above |

**Create Web Service.** This one builds in about two minutes.

## Step 1C — Check both came up

```bash
curl https://ubuntulink-ml-service.onrender.com/health
# expect: {"status":"ok"}

curl -i https://ubuntulink-backend.onrender.com/api/services
# expect: HTTP/1.1 401
```

That **401 means success, not failure.** Every route except `/auth/**` requires a JWT, so a 401
proves the app booted and security is active. A 502 or 503 is the real failure — check the logs.

Copy both service URLs; you need them next.

## Step 2 — Frontend project (Vercel)

Vercel → **Add New → Project** → import the same repo.

| Field | Value |
|---|---|
| **Framework Preset** | **Vite** (auto-detected) |
| **Root Directory** | `frontend` ← easy to miss, and it fails confusingly if left at the repo root |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |
| **Production Branch** | `master` |

Build/output/install are already declared in `frontend/vercel.json`, so the defaults should
populate correctly — the table is there to check them against.

Environment variables (**Environment Variables**, before the first deploy):

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | your Render **backend** URL from Step 1A |
| `VITE_ML_API_BASE_URL` | your Render **ML service** URL from Step 1B |

> **These must be set in Vercel specifically.** Vite inlines `VITE_*` variables into the
> JavaScript bundle at build time, and Vercel is what runs that build. Set them anywhere else —
> GitHub secrets included — and the deployed site silently falls back to `http://localhost:8080`,
> failing for every real user with nothing useful in the UI to explain why.

**Deploy**, then copy the Vercel URL.

## Step 3 — Close the loop (CORS)

Back in Render, on **both** services: **Environment** → add `FRONTEND_URL` set to the Vercel URL
from Step 2 → **Save Changes**. Each service redeploys automatically.

Use the short **production alias** (`https://your-project.vercel.app`), not the per-deploy URL
with a random hash in it — that one changes on every deploy. Include `https://` and **no trailing
slash**: the match is an exact string comparison, so a stray `/` silently fails.

Skip this and the site loads fine while every API call is blocked by the browser with a CORS
error — the backend's `SecurityConfig` and the ML service's CORS middleware both read
`FRONTEND_URL` to decide which origin to allow.

Verify it took effect before testing in a browser — the backend takes ~3 minutes to redeploy, and
a stale process looks identical to a bad value:

```bash
curl -o /dev/null -w "%{http_code}\n" -X OPTIONS \
  https://<your-backend>.onrender.com/auth/login \
  -H "Origin: https://<your-project>.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

`200` means CORS is open. `403` means it isn't — wait for the deploy to finish, then re-check the
value.

Note that Render appends a random suffix to service hostnames (e.g.
`ubuntulink-backend-yhhu.onrender.com`). Always copy the real URL from the dashboard rather than
assuming the clean name.

## Step 4 — Verify end to end

Open the Vercel URL and:

1. **Register** an account → **Log in**
2. Complete onboarding → land on the dashboard
3. **Describe your problem** → e.g. *"my kitchen sink is leaking"* → a category coming back proves
   the ML service, the OpenRouter key and CORS are all working
4. Continue to **Matching Providers** → real providers appearing proves the backend and the
   database connection are working

All four passing means the deployment is good.

Two accounts are seeded on the backend's first boot if you'd rather not register:
`customer@ubuntulink.demo` and `provider@ubuntulink.demo`, both password `Demo1234!`. Use two
browser sessions (one normal, one incognito) to exercise the full customer/provider quote flow —
INSTRUCTIONS.md §2d walks through it.

## Step 5 — Optional: automatic redeploys

`.github/workflows/cd.yml` builds all three services on every push to `master`, then triggers the
deploys. Until its secrets exist the deploy steps skip with a warning, so it's harmless to leave
alone.

To enable it, add these under repo **Settings → Secrets and variables → Actions**:

| Secret | Where to get it |
|---|---|
| `RENDER_BACKEND_DEPLOY_HOOK` | Render → `ubuntulink-backend` → Settings → **Deploy Hook** |
| `RENDER_ML_DEPLOY_HOOK` | Render → `ubuntulink-ml-service` → Settings → **Deploy Hook** |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | run `vercel link` in `frontend/`, read `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | same file |

Deploy hook URLs are credentials in themselves — anyone holding one can trigger a deploy, so keep
them out of issues and chat. Full detail in [CD_PIPELINE.md](CD_PIPELINE.md).

Simpler alternative: skip Actions entirely. Render and Vercel can each watch `master` and redeploy
on push with no secrets at all — you lose the pre-deploy build gate. Don't enable both, or every
push deploys twice.

---

## Things to expect

**Cold starts.** On Render's free tier both services sleep after inactivity, so the first request
after a quiet spell takes 30–60 seconds. Not a bug, but it makes the first load after idle feel
broken.

**512MB is tight for Spring Boot.** The free instance is small for Java + Hibernate. If the
backend dies during startup with no stack trace, suspect memory before config.

**The backend seeds data on first boot.** `DevDataSeeder` runs against the real Supabase database.
The service catalog already has rows so that part no-ops; it creates the two `@ubuntulink.demo`
accounts if they're missing.

**Deploy is not the same as finished.** Render returns as soon as a deploy is triggered while the
build runs on for minutes. Watch the service's **Logs** tab for the real outcome.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Repo not listed in Render/Vercel | The GitHub App isn't installed on it — needs repo admin. |
| Backend: "Dockerfile not found" | Root Directory must be `backend` and Dockerfile Path `./Dockerfile`. If it still fails, clear Root Directory and set the path to `backend/Dockerfile`. |
| Backend build fails during Maven | A genuine compile error — it shows in the Docker build log. |
| Backend deploys but won't start (502/503) | Missing env var. Logs show `Could not resolve placeholder 'SUPABASE_DB_URL'` or `'JWT_SECRET'`. |
| `/api/services` returns 401 | **Correct.** Auth is enforced on everything except `/auth/**`. |
| ML service: `ModuleNotFoundError: app` | Root Directory isn't `python`. The start command is relative to it. |
| ML service starts then Render marks it unhealthy | Start command must use `--host 0.0.0.0` and `--port $PORT`, not a hardcoded port. |
| Site loads, every API call fails | Either `FRONTEND_URL` on Render doesn't match the Vercel URL (Step 3), or `VITE_*` wasn't set in Vercel (Step 2). The browser console says which. |
| Register/login do nothing, and the backend logs show no queries at all | CORS preflight is being rejected, so the request never reaches Spring. Usually `FRONTEND_URL` is set to an empty value, has a trailing slash, or names the per-deploy URL instead of the production alias. Probe it with the `curl -X OPTIONS` in Step 3. |
| Preflight still 403 after fixing `FRONTEND_URL` | The old process is still serving. A redeploy takes ~3 minutes; until it finishes, the probe returns the *old* behaviour. Confirm a new deploy is running under the service's **Events** tab. |
| Frontend calls `localhost:8080` in production | `VITE_API_BASE_URL` wasn't set **in Vercel** before the build. Set it and redeploy — the value is baked into the bundle, so a rebuild is required. |
| AI classification fails, everything else works | `OPEN_ROUTER_API_KEY` missing or invalid on the ML service, or it's cold-starting — retry after a minute. |
| Vercel build fails | Confirm **Root Directory** is `frontend`. |
| Everything slow | Region mismatch — services in Oregon talking to a Frankfurt database. Both Render services should be Frankfurt. |
