# UbuntuLink — CD Pipeline

Continuous deployment for all three services, triggered by pushes to `master`/`main`.
Companion to [INSTRUCTIONS.md](INSTRUCTIONS.md) (local setup) and [PROJECT.md](PROJECT.md) (status/gaps).

The pipeline lives in [`.github/workflows/cd.yml`](.github/workflows/cd.yml).

---

## What it does

| Job | Runs | What happens |
|---|---|---|
| **build** | Every push to `master`/`main`, and manual runs | Builds all three services — backend (`mvnw package`), frontend (`npm ci && npm run build`), ML service (`pip install` + byte-compile). Fails the run if any of them break. |
| **deploy-render** | Only if **build** passed | Triggers a Render deploy for the backend and the ML service (in parallel), pinned to the commit this run built, then waits for it to report `live` and smoke-checks the running service. |
| **deploy-vercel** | **Disabled by default** — only when the repo variable `DEPLOY_FRONTEND` is `true` | Builds and promotes the frontend via the Vercel CLI. Off because Vercel's GitHub integration already deploys `frontend/` on every push; running both would deploy each commit twice and race for the production alias. |

**The deploy jobs fail when their secrets are missing.** They used to skip themselves with a warning, which produced a green check on every push while nothing was ever deployed — the backend ran a stale image for days and the only symptom was CORS errors in the browser. A deploy that didn't happen is a failure, so the run goes red and tells you which secret is missing.

Two other things the pipeline now guards against:

- **Deploys are pinned to a commit.** The deploy hook is called with `?ref=<sha>`, so Render builds the commit this run built rather than whatever it considers the branch tip.
- **A green check means the new code is answering requests**, not just that a deploy was requested — as long as you've set the optional `RENDER_API_KEY` secret and the two URL variables in §4.

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

> [KEYS.md](KEYS.md) is the full reference for every key in the project — where each one comes
> from, which of the four places it belongs in, and how to verify it took effect. This section is
> the short version for the pipeline's own secrets.

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Where to get it |
|---|---|
| `RENDER_BACKEND_DEPLOY_HOOK` | Render → `ubuntulink-backend` → Settings → **Deploy Hook** → copy URL |
| `RENDER_ML_DEPLOY_HOOK` | Render → `ubuntulink-ml-service` → Settings → **Deploy Hook** → copy URL |
| ~~`VERCEL_TOKEN`~~ | Not needed — Vercel deploys the frontend itself from GitHub, so `deploy-vercel` is off unless you set `DEPLOY_FRONTEND=true`. See KEYS.md §3.3. |
| ~~`VERCEL_ORG_ID`~~ | Same — only if you take the frontend deploy away from Vercel's Git integration. |
| ~~`VERCEL_PROJECT_ID`~~ | Same. |

Deploy hook URLs are themselves secrets — anyone with the URL can trigger a deploy. Don't paste them into the repo, issues, or chat.

Once the two deploy hooks are set, the next push to `master` redeploys both Render services
automatically. The frontend needs nothing here — Vercel is already watching `master` itself.

### Optional, but this is what makes a green check mean something

| Secret | Where to get it | What it buys you |
|---|---|---|
| `RENDER_API_KEY` | Render → Account Settings → **API Keys** → Create | The workflow polls the deploy it just triggered and fails the run on `build_failed` / `update_failed`, instead of assuming a triggered deploy succeeded. The service ID is read out of the deploy hook URL, so this is the only extra secret needed. |

And under **Settings → Secrets and variables → Actions → Variables** (these are URLs, not secrets, so they go in the Variables tab):

| Variable | Value | What it buys you |
|---|---|---|
| `BACKEND_URL` | `https://ubuntulink-backend-….onrender.com` | After the deploy, CI sends a CORS preflight from a `https://*.vercel.app` origin and fails if it isn't `200`. That single request catches both the stale-image case and a blank `FRONTEND_URL`. |
| `ML_SERVICE_URL` | `https://ubuntulink-ml-service-….onrender.com` | Same idea, against `GET /health`. |

Without these three the pipeline still deploys — it just warns that it couldn't confirm anything, which is the situation that let a broken deploy sit unnoticed in the first place.

---

## Things worth knowing

**Tests are skipped on purpose.** The backend builds with `-DskipTests`. The only test in the repo is `BackendApplicationTests.contextLoads()`, a `@SpringBootTest` that boots the entire application — which needs a reachable Supabase database *and* `JWT_SECRET`, neither of which exist on a CI runner. Running it would fail every build. There is no real test coverage anywhere in this project yet (PROJECT.md §9h); if that changes, drop `-DskipTests` and give the runner the env vars it needs.

**The frontend is built twice, and the CI build is not a gate for it.** The `build` job compiles `frontend/` to catch breakage, but Vercel builds and ships its own copy straight from the push — it doesn't wait for GitHub Actions and doesn't care whether the run went red. So a broken frontend reaches production regardless; the CI build only tells you sooner. If you want a real gate, either set an *Ignored Build Step* in Vercel or move the deploy into this pipeline (`DEPLOY_FRONTEND=true`, KEYS.md §3.3).

**Render's free tier spins down.** The first request after idle takes 30-60s to wake, which is why the smoke check retries for up to 10 minutes before giving up rather than failing on the first timeout.

**The deploy jobs are slow on purpose.** With `RENDER_API_KEY` set, `deploy-render` waits up to 20 minutes for Render to finish building and report `live`, then waits again for the service to answer a real request. A run that takes 15 minutes but tells you the truth beats a 40-second run that tells you nothing.

**A cold-start log looks exactly like a fresh deploy.** Render prints the full Spring Boot banner and `Started BackendApplication` every time a spun-down free-tier service wakes up. That log is not evidence that your latest commit is running — check the service's **Events** tab for the deployed commit SHA, or just read the smoke-check step in CI.

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
| Deploy job fails with `… is not set, so <service> was NOT deployed` | The corresponding secret is missing — see §4. Nothing was deployed; this is the workflow refusing to be green about it. |
| Smoke check fails with `rejected a https://*.vercel.app origin at preflight` | The running image predates the origin-pattern CORS config in `SecurityConfig.java`, or `FRONTEND_URL` exists on Render with an empty value (an empty string is an allowed origin that matches nothing). Delete the variable or set it to a real URL, then redeploy. |
| `Render reports commit X live, but this run built Y` | The service is connected to a different branch, or a concurrent deploy won. Check the service's **Events** tab. |
| Deploy hook returns HTTP 400 | Usually the `?ref=<sha>` pin: the Render service isn't connected to this repo, or can't see that commit. |
| Deployed frontend calls `localhost:8080` | `VITE_API_BASE_URL` wasn't set **in Vercel** (§2). Setting it as a GitHub secret has no effect. |
| CORS errors in production | `FRONTEND_URL` on the Render services doesn't match the real Vercel URL (§3). |
| Backend deploy succeeds but the service won't start | Missing env var on Render — check the service's logs for `Could not resolve placeholder 'SUPABASE_DB_URL'` or `'JWT_SECRET'`. |
| Vercel step fails with "project not found" | `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` don't match the token's account. Re-run `vercel link` and recopy both. |
