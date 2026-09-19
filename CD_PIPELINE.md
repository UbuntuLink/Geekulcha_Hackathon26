# UbuntuLink — CD Pipeline

Continuous deployment for all three services, triggered by pushes to `master`/`main`.
Companion to [INSTRUCTIONS.md](INSTRUCTIONS.md) (local setup) and [PROJECT.md](PROJECT.md) (status/gaps).

The pipeline lives in [`.github/workflows/cd.yml`](.github/workflows/cd.yml).

---

## What it does

| Job | Runs | What happens |
|---|---|---|
| **build** | Every push to `master`/`main`, and manual runs | Builds all three services — backend (`mvnw package`), frontend (`npm ci && npm run build`), ML service (`pip install` + byte-compile). Fails the run if any of them break. |
| **deploy** | Only if **build** passed | Pings Render's deploy hooks for the backend and ML service, and pushes the frontend to Vercel via the Vercel CLI. |

**Before you've done the setup below, the deploy steps skip themselves with a warning instead of failing.** That's deliberate — you can merge this workflow now, wire up the platforms later, and adopt it one service at a time.

---

## ⚠️ Read this first

**Nothing has ever actually been deployed** (see PROJECT.md §7). `render.yaml` and `vercel.json` exist but have never run against real Render/Vercel infrastructure. So the first deploy is a manual setup job — the pipeline automates every deploy *after* that, not the initial provisioning.

There's also a **chicken-and-egg problem with URLs**: the backend needs to know the frontend's URL (for CORS) and the frontend needs to know the backend's URL (baked in at build time). Neither exists until you've deployed once. §3 below handles this.

---

## 1. Create the Render services

Render → **New → Blueprint** → connect `leshenn/Geekulcha_Hackathon26` → it reads `render.yaml` and proposes two services:

- `ubuntulink-backend` (Docker, builds from `backend/Dockerfile`)
- `ubuntulink-ml-service` (Python, runs `uvicorn app.main:app`)

Fill in the env vars it prompts for (these are marked `sync: false` in the blueprint, so they're never committed):

| Service | Variable | Value |
|---|---|---|
| backend | `SUPABASE_DB_URL` | Same JDBC string as your local `backend/.env` |
| backend | `JWT_SECRET` | **Generate a new one** — don't reuse your local dev secret |
| backend | `FRONTEND_URL` | Leave blank for now, filled in at §3 |
| ml-service | `OPEN_ROUTER_API_KEY` | Same key as your local `python/.env` |
| ml-service | `FRONTEND_URL` | Leave blank for now, filled in at §3 |

Let both deploy once, then note their URLs (something like `https://ubuntulink-backend.onrender.com`).

## 2. Create the Vercel project

Vercel → **Add New → Project** → import the same repo → set:

- **Root directory:** `frontend`
- Framework preset: Vite (should auto-detect from `vercel.json`)

Then add these **in Vercel's project settings**, not as GitHub secrets:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | Your Render **backend** URL from §1 |
| `VITE_ML_API_BASE_URL` | Your Render **ML service** URL from §1 |

> **Why this trips people up:** Vite inlines `VITE_*` variables into the JavaScript bundle *at build time*, and Vercel is what runs that build. Putting these in GitHub secrets does nothing — the deployed app would silently fall back to `http://localhost:8080` and fail for every real user with no obvious error.

Deploy once, then note the Vercel URL.

## 3. Close the URL loop

Now that both sides exist, go back to **Render** and set `FRONTEND_URL` on *both* services to your Vercel URL, then redeploy them. Without this, the browser blocks every API call with a CORS error (`SecurityConfig` and the ML service's CORS middleware both read `FRONTEND_URL`).

## 4. Add the GitHub secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Where to get it |
|---|---|
| `RENDER_BACKEND_DEPLOY_HOOK` | Render → `ubuntulink-backend` → Settings → **Deploy Hook** → copy URL |
| `RENDER_ML_DEPLOY_HOOK` | Render → `ubuntulink-ml-service` → Settings → **Deploy Hook** → copy URL |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Run `vercel link` in `frontend/`, then read `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | Same file → `projectId` |

Deploy hook URLs are themselves secrets — anyone with the URL can trigger a deploy. Don't paste them into the repo, issues, or chat.

Once all five are set, the next push to `master` deploys everything automatically.

---

## Things worth knowing

**Tests are skipped on purpose.** The backend builds with `-DskipTests`. The only test in the repo is `BackendApplicationTests.contextLoads()`, a `@SpringBootTest` that boots the entire application — which needs a reachable Supabase database *and* `JWT_SECRET`, neither of which exist on a CI runner. Running it would fail every build. There is no real test coverage anywhere in this project yet (PROJECT.md §9h); if that changes, drop `-DskipTests` and give the runner the env vars it needs.

**The frontend is built twice.** Once in the `build` job (to catch breakage before deploying anything) and again by Vercel during `vercel build`. That's intentional — the first build is the gate, the second is the artifact Vercel actually serves.

**Render's free tier spins down.** The first request after idle takes 30-60s to wake. A deploy also takes a few minutes; the pipeline triggers it and returns immediately rather than waiting, so a green GitHub check means "deploy started", not "deploy finished". Watch Render's dashboard for the actual result.

**Manual runs deploy whatever branch you dispatch from.** `workflow_dispatch` is enabled for re-running a deploy without a new commit — but it deploys the ref you select, so be deliberate if you dispatch from a feature branch.

---

## Simpler alternative: skip Actions entirely

Render and Vercel can both watch the repo themselves — connect the repo in each dashboard, set the production branch to `master`, and they'll deploy on every push with no workflow file and no secrets at all.

That's genuinely less machinery, and worth considering if this pipeline feels like overkill. What you give up: the build gate (native auto-deploy pushes straight to production even if the frontend build is broken — you'd find out from the platform's build log rather than from a failed check on the PR), a single place to see all three deploys, and the ability to add steps later. Use whichever fits; they're mutually exclusive in practice (running both means every push deploys twice).

---

## Rolling back

- **Render:** service → **Events** tab → find the last good deploy → **Rollback**.
- **Vercel:** project → **Deployments** → find the last good one → **⋯ → Promote to Production**.
- **Or by commit:** `git revert <bad-commit>` and push to `master` — the pipeline redeploys the reverted state.

Rolling back code does **not** roll back the database. `ddl-auto=update` only ever adds columns, so a revert leaves any new columns in place (harmless), but any data written by the bad version stays written.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| `./mvnw: Permission denied` | `backend/mvnw` lost its executable bit. The workflow runs `chmod +x ./mvnw` first, so this only appears if that line was removed. |
| Build fails on `npm ci` | `frontend/package-lock.json` is out of sync with `package.json`. Run `npm install` locally and commit the updated lockfile. |
| Deploy steps say "skipping" | The corresponding secret isn't set — see §4. Expected before setup is done. |
| Deployed frontend calls `localhost:8080` | `VITE_API_BASE_URL` wasn't set **in Vercel** (§2). Setting it as a GitHub secret has no effect. |
| CORS errors in production | `FRONTEND_URL` on the Render services doesn't match the real Vercel URL (§3). |
| Backend deploy succeeds but the service won't start | Missing env var on Render — check the service's logs for `Could not resolve placeholder 'SUPABASE_DB_URL'` or `'JWT_SECRET'`. |
| Vercel step fails with "project not found" | `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` don't match the token's account. Re-run `vercel link` and recopy both. |
