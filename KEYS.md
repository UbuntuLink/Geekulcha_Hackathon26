# UbuntuLink — Keys, Tokens and Where They Go

Every secret and configuration value this project needs: what it is, where you get it, and
exactly which box you paste it into. Nothing here is a value itself — this file is safe to commit.

Companion to [CD_PIPELINE.md](CD_PIPELINE.md) (how the pipeline works), [DEPLOYMENT.md](DEPLOYMENT.md)
(first-time platform setup) and [INSTRUCTIONS.md](INSTRUCTIONS.md) (running it locally).

---

## The one thing to understand first

There are **four separate places** that hold configuration, and they are not interchangeable.
Putting the right value in the wrong place is the single most common way this project breaks,
and it usually fails *silently*:

| Place | Holds | Used by |
|---|---|---|
| **Render** → each service → Environment | Database URL, JWT secret, Anthropic key, frontend URL | The running backend and ML service |
| **Vercel** → project → Settings → Environment Variables | The two `VITE_*` API URLs | The frontend **build** — baked into the JS bundle |
| **GitHub** → Settings → Secrets and variables → Actions | Deploy hooks, API keys, service URLs | The CD workflow, to trigger and verify deploys |
| **Local `.env` files** (never committed) | Your own dev copies | `./mvnw spring-boot:run`, `uvicorn`, `npm run dev` |

> **A GitHub secret is not visible to the running app.** GitHub secrets only exist inside a
> workflow run. If you put `SUPABASE_DB_URL` in GitHub instead of Render, the backend crashes on
> startup. If you put `VITE_API_BASE_URL` in GitHub instead of Vercel, the deployed frontend
> quietly calls `http://localhost:8080` and every request fails in your users' browsers.

---

## Full inventory

| Value | Lives in | Required? | Section |
|---|---|---|---|
| `SUPABASE_DB_URL` | Render → backend | Yes | [1.1](#11-supabase_db_url) |
| `JWT_SECRET` | Render → backend | Yes | [1.2](#12-jwt_secret) |
| `FRONTEND_URL` | Render → backend **and** ML service | Optional | [1.3](#13-frontend_url) |
| `ANTHROPIC_API_KEY` | Render → ML service | Yes | [1.4](#14-anthropic_api_key) |
| `VITE_API_BASE_URL` | Vercel → project | Yes | [2.1](#21-the-two-vite-urls) |
| `VITE_ML_API_BASE_URL` | Vercel → project | Yes | [2.1](#21-the-two-vite-urls) |
| `RENDER_BACKEND_DEPLOY_HOOK` | GitHub → **Secrets** | Yes, for CD | [3.1](#31-render-deploy-hooks) |
| `RENDER_ML_DEPLOY_HOOK` | GitHub → **Secrets** | Yes, for CD | [3.1](#31-render-deploy-hooks) |
| `RENDER_API_KEY` | GitHub → **Secrets** | Recommended | [3.2](#32-render-api-key) |
| `VERCEL_TOKEN` | GitHub → **Secrets** | **No** — not needed | [3.3](#33-vercel-token-and-ids--not-needed-today) |
| `VERCEL_ORG_ID` | GitHub → **Secrets** | **No** — not needed | [3.3](#33-vercel-token-and-ids--not-needed-today) |
| `VERCEL_PROJECT_ID` | GitHub → **Secrets** | **No** — not needed | [3.3](#33-vercel-token-and-ids--not-needed-today) |
| `BACKEND_URL` | GitHub → **Variables** | Recommended | [3.4](#34-the-two-url-variables) |
| `ML_SERVICE_URL` | GitHub → **Variables** | Recommended | [3.4](#34-the-two-url-variables) |

**Access you need before you start:** admin on `github.com/leshenn/Geekulcha_Hackathon26`
(otherwise the Settings → Secrets page doesn't exist for you), plus logins to the Render and
Vercel accounts that own the deployed services. If a teammate created those services, only they
can generate the deploy hooks and API keys — you can't make your own.

---

# Part 1 — Render (the backend and ML service)

Dashboard: <https://dashboard.render.com>

For each value: open the service → **Environment** in the left sidebar → **Add Environment
Variable** (or edit the existing one) → **Save Changes**. Saving restarts the service.

## 1.1 `SUPABASE_DB_URL`

**Service:** `ubuntulink-backend`

Supabase dashboard → your project → **Connect** (top bar) → **Session pooler** → copy the URI.
Then convert it to **JDBC** form, which is what Spring expects — this is the step people miss:

```
Supabase gives you:  postgresql://postgres.abcdef:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
Render needs:        jdbc:postgresql://aws-0-eu-central-1.pooler.supabase.com:5432/postgres?user=postgres.abcdef&password=PASSWORD
```

So: prefix `jdbc:`, and move the credentials out of the `user:pass@host` position into
`?user=…&password=…` query parameters.

If the password contains `@`, `/`, `:`, `?`, `&` or `#`, URL-encode it (`@` → `%40`) or the
driver will read the URL wrong. Reset the password in Supabase → Settings → Database if you
don't have it.

> Used by `spring.datasource.url` in [application.properties](backend/src/main/resources/application.properties).
> A wrong value shows up as `HikariPool-1 - Exception during pool initialization` in the Render logs.

## 1.2 `JWT_SECRET`

**Service:** `ubuntulink-backend`

You generate this one yourself — it isn't issued by anybody. Any random string of **32+
characters** (it's the HMAC-SHA256 signing key):

```bash
openssl rand -base64 48
```

No openssl? `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`.

**Generate a fresh one for production. Do not reuse your local dev value**, and don't paste it
into chat, a ticket, or this repo. Anyone holding it can mint tokens for any user account.

Changing it later is allowed and safe — it just signs every existing login out.

> Read by `@Value("${JWT_SECRET}")` in [SecurityConfig.java](backend/src/main/java/com/geekkulcha/backend/config/SecurityConfig.java).
> If it's missing the app won't start: `Could not resolve placeholder 'JWT_SECRET'`.

## 1.3 `FRONTEND_URL`

**Services:** both `ubuntulink-backend` and `ubuntulink-ml-service`

The public URL of the deployed frontend, e.g. `https://ubuntulink.vercel.app`. Used for CORS.

**This one has a trap.** `https://*.vercel.app` is already allowed in code, so every Vercel
deploy — production, branch and preview URLs — works without this variable at all. It exists
only for a custom domain later.

- Need a custom domain allowed? Set it: `https://ubuntulink.co.za` (comma-separate for several).
- Otherwise **delete the variable entirely.** Do not leave it existing-but-blank.

An empty value used to be worse than an absent one: it put `""` into the allowed-origins list,
matched no origin, and rejected every browser request with `403 Invalid CORS request` at
preflight — invisible in the backend logs, because a rejected preflight never reaches a
controller. The code now filters blanks out, but an empty variable is still a lie about intent.

No scheme-less values (`ubuntulink.vercel.app` ✗), no trailing slash (`https://x.vercel.app/` ✗).
An origin is scheme + host + port, nothing else.

## 1.4 `ANTHROPIC_API_KEY`

**Service:** `ubuntulink-ml-service`

<https://console.anthropic.com> → **Settings → API keys** → **Create Key** → name it
`ubuntulink-prod` → copy. Starts with `sk-ant-`. Shown once.

Set a spend limit on the key while you're there — it's a spend-capable credential, and this is
the only one in the project where a leak costs money directly.

The model is `claude-haiku-4-5` ($1 per million input tokens, $5 per million output). Set
`CLAUDE_MODEL` to `claude-sonnet-5` or `claude-opus-5` to trade cost for capability without a
code change, and `LLM_MAX_TOKENS` to cap output tokens for a whole run.

> This replaced an OpenRouter key. If `OPEN_ROUTER_API_KEY` is still set anywhere it is now
> ignored — delete it so nobody wonders which one is live.

> Read by [python/app/core/config.py](python/app/core/config.py). Without it the AI
> classification and pricing endpoints fail at call time, not at startup.

### What Render does *not* need

`PORT` is injected by Render automatically — don't set it. `application.properties` already
reads `${PORT:8080}`.

---

# Part 2 — Vercel (the frontend)

Dashboard: <https://vercel.com/dashboard>

## 2.1 The two `VITE_*` URLs

Project → **Settings** → **Environment Variables** → add each for **Production** (tick Preview
and Development too if you want previews to work):

| Name | Value |
|---|---|
| `VITE_API_BASE_URL` | Your Render backend URL, e.g. `https://ubuntulink-backend-yhhu.onrender.com` |
| `VITE_ML_API_BASE_URL` | Your Render ML service URL, e.g. `https://ubuntulink-ml-service-xxxx.onrender.com` |

No trailing slash. You get both URLs from the top of each Render service's page.

**Why these can't be GitHub secrets:** Vite inlines `VITE_*` variables into the JavaScript
bundle *at build time*, and Vercel is what runs that build. A GitHub secret is not present in
Vercel's build environment, so the values fall back to `http://localhost:8080` /
`http://localhost:8000` and the deployed site fails for every real user with no server-side
error anywhere.

**Changing these needs a redeploy**, not just a save — the old values are already compiled into
the last bundle.

---

# Part 3 — GitHub Actions (the CD pipeline)

One page holds all of these: **repo → Settings → Secrets and variables → Actions**

<https://github.com/leshenn/Geekulcha_Hackathon26/settings/secrets/actions>

That page has two tabs and **the tab matters**:

- **Secrets** tab → *New repository secret* — for credentials. Write-only; you can overwrite but never read one back.
- **Variables** tab → *New repository variable* — for non-secret values like URLs. Readable, and they show up in logs.

Use **Repository** secrets, not **Environment** secrets: [cd.yml](.github/workflows/cd.yml)
declares no `environment:`, so environment-scoped secrets arrive empty and the job fails saying
the secret isn't set.

## 3.1 Render deploy hooks

**Secrets tab** → `RENDER_BACKEND_DEPLOY_HOOK` and `RENDER_ML_DEPLOY_HOOK`

Render → the service → **Settings** → scroll to **Deploy Hook** → copy the URL:

```
https://api.render.com/deploy/srv-d3xxxxxxxxxxxx?key=AbCdEf123456
```

Paste it **whole and unmodified** — no trailing slash, no added query parameters. The workflow
appends `&ref=<commit sha>` itself to pin the deploy to the commit it just built, and it parses
the `srv-…` service ID out of the URL so the status poll doesn't need a separate secret.

The `key=` portion is the credential: anyone with this URL can trigger a deploy. Treat the whole
string as secret.

## 3.2 Render API key

**Secrets tab** → `RENDER_API_KEY`

Render → avatar (top right) → **Account Settings** → **API Keys** → **Create API Key** → name it
`github-actions` → copy immediately, it's shown once. Starts with `rnd_`.

Account-wide — one key covers both services.

**What it buys you:** without it, CI triggers a deploy and moves on, so a green check means
"deploy requested". With it, the workflow polls the deploy until Render reports `live` and fails
the run on `build_failed` / `update_failed`. This is the difference between a pipeline that tells
you the truth and one that tells you it tried.

## 3.3 Vercel token and IDs — not needed today

**Skip this section.** Vercel deploys the frontend itself, through its GitHub integration, on
every push to `master`. The pipeline's `deploy-vercel` job is therefore switched off: it only
runs when the repo variable `DEPLOY_FRONTEND` is set to `true`, and until then it shows as
*skipped* and needs no secrets at all.

That's deliberate. Running both would deploy the same commit twice and have the two deploys race
for the production alias.

**Only if you later want Actions to own the frontend deploy:** disconnect Vercel's Git
integration first (Vercel → project → Settings → **Git** → Disconnect, or set an *Ignored Build
Step*), then set `DEPLOY_FRONTEND=true` in the **Variables** tab and add all three secrets below.
The job requires all three and fails naming whichever is missing.

**`VERCEL_TOKEN`:** Vercel → avatar → **Account Settings** → **Tokens** → **Create Token**. Scope
it to the team/account that owns the project. Shown once.

**`VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`** identify *which project* to deploy — the token only
proves who you are. Locally the CLI reads them from `frontend/.vercel/project.json`, which is
gitignored and so absent on a CI runner; these two secrets are how you replace that file.

Getting the two IDs — easiest from the repo root:

```bash
cd frontend
npx vercel@latest link      # pick the existing project when prompted
cat .vercel/project.json    # {"orgId":"team_…","projectId":"prj_…"}
```

`orgId` → `VERCEL_ORG_ID`, `projectId` → `VERCEL_PROJECT_ID`. The `.vercel/` folder is gitignored
by the CLI, so nothing leaks into a commit.

Without the CLI: **Project ID** is at project → Settings → General. **Org ID** is your **Team ID**
(Team Settings → General), or your user ID on a personal account.

The IDs aren't really secret, but keep them as secrets anyway — they're only useful alongside the
token, and it keeps all three together.

## 3.4 The two URL variables

**Variables tab** (not Secrets) → `BACKEND_URL` and `ML_SERVICE_URL`

| Name | Value |
|---|---|
| `BACKEND_URL` | `https://ubuntulink-backend-yhhu.onrender.com` |
| `ML_SERVICE_URL` | `https://ubuntulink-ml-service-xxxx.onrender.com` |

Both are on each Render service's page, at the top under the service name. No trailing slash
(the workflow strips one anyway).

**What they buy you:** after each deploy, CI sends a real request to the deployed service and
fails if it doesn't answer correctly. For the backend that request is a CORS preflight from a
`https://*.vercel.app` origin — one call that catches both a stale image and a misconfigured
`FRONTEND_URL`, which is exactly the failure that motivated all of this.

---

# Part 4 — Local development

Three files, none of them committed (each is covered by a `.gitignore` in its own folder —
verified, and no `.env` is tracked in git). Create them by hand:

**`backend/.env`**
```properties
SUPABASE_DB_URL=jdbc:postgresql://aws-0-eu-central-1.pooler.supabase.com:5432/postgres?user=postgres.xxxx&password=xxxx
JWT_SECRET=any-random-32-plus-character-string-for-dev
```

**`python/.env`**
```properties
ANTHROPIC_API_KEY=sk-ant-...
```

**`frontend/.env.local`** (copy [frontend/.env.example](frontend/.env.example))
```properties
VITE_API_BASE_URL=http://localhost:8080
VITE_ML_API_BASE_URL=http://localhost:8000
```

`FRONTEND_URL` is not needed locally — `http://localhost:5173` is allowed in code by default.

Use a **different `JWT_SECRET` from production.** Sharing it means a dev-issued token works
against the live database.

---

# Part 5 — Setup checklist

Do it in this order; each step needs a URL produced by the one before.

- [ ] Render: create both services (blueprint from `render.yaml`, or by hand — see DEPLOYMENT.md)
- [ ] Render backend: set `SUPABASE_DB_URL` (§1.1) and `JWT_SECRET` (§1.2)
- [ ] Render ML: set `ANTHROPIC_API_KEY` (§1.4)
- [ ] Render: **delete** `FRONTEND_URL` on both unless you have a custom domain (§1.3)
- [ ] Note both Render service URLs
- [ ] Vercel: create the project, root directory `frontend`
- [ ] Vercel: set `VITE_API_BASE_URL` and `VITE_ML_API_BASE_URL` to the Render URLs (§2.1), redeploy
- [ ] GitHub **Secrets**: `RENDER_BACKEND_DEPLOY_HOOK`, `RENDER_ML_DEPLOY_HOOK` (§3.1)
- [ ] GitHub **Secrets**: `RENDER_API_KEY` (§3.2)
- [ ] GitHub **Variables**: `BACKEND_URL`, `ML_SERVICE_URL` (§3.4)
- [ ] ~~Vercel secrets~~ — skip, Vercel deploys itself from GitHub (§3.3)
- [ ] Push to `master` (or Actions → CD → **Run workflow**) and watch it go green

---

# Part 6 — Verify it worked

**The backend accepts browser requests** — the check CI runs for you:

```bash
curl -s -o /dev/null -w "%{http_code} %header{access-control-allow-origin}\n" \
  -X OPTIONS https://ubuntulink-backend-yhhu.onrender.com/auth/login \
  -H "Origin: https://anything.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

`200` and the origin echoed back = good. `403` = the running image is stale or `FRONTEND_URL` is
blank. `000`/timeout = free-tier cold start, wait 60s and retry.

**The ML service is up:**

```bash
curl -s https://ubuntulink-ml-service-xxxx.onrender.com/health   # {"status":"ok"}
```

**The frontend got the right API URL:** open the deployed site → DevTools → Network → attempt a
login → the request should go to `…onrender.com`, not `localhost:8080`.

**The right commit is live:** Render → service → **Events** tab → the deployed commit SHA. Do
**not** use the startup log for this — Render prints the full Spring Boot banner and
`Started BackendApplication` every time a spun-down free service wakes up, which looks identical
to a fresh deploy.

---

# Part 7 — Common mistakes

| Symptom | Cause |
|---|---|
| CORS error in the browser, backend logs look perfectly healthy | A rejected preflight never reaches a controller, so it leaves *no* log line. Check `FRONTEND_URL` (§1.3) and whether the deployed commit is current. |
| Deployed site calls `localhost:8080` | `VITE_*` set in GitHub instead of Vercel (§2.1), or set in Vercel but not redeployed since. |
| `Could not resolve placeholder 'JWT_SECRET'` | Missing on Render (§1.2). The app won't start at all. |
| `HikariPool-1 - Exception during pool initialization` | `SUPABASE_DB_URL` is wrong, not in JDBC form, or has an unencoded special character in the password (§1.1). |
| Workflow fails: `… is not set, so backend was NOT deployed` | That secret is missing, or was added as an *Environment* secret instead of a *Repository* one (§3). |
| `deploy-vercel` shows as skipped | Correct and intended — Vercel deploys the frontend itself (§3.3). |
| The frontend deploys twice per push | Both Vercel's Git integration and `DEPLOY_FRONTEND=true` are on. Pick one (§3.3). |
| Everything green, but nothing actually changed in production | You're on the old `cd.yml` that skipped deploys with a warning. Pull `master`. |
| `401` from the backend on every API call | Expected without a token — only `/auth/**` is public. Not a key problem. |

---

# Part 8 — If a key leaks

Rotate first, investigate after. All of these are replaceable in under two minutes:

| Key | How to rotate |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → Settings → API keys → delete → create → update Render. **Do this one first** — it can spend money. |
| `JWT_SECRET` | Generate a new one, update Render. Signs everyone out; nothing else breaks. |
| `SUPABASE_DB_URL` | Supabase → Settings → Database → reset password, rebuild the JDBC URL, update Render. |
| Deploy hooks | Render → service → Settings → Deploy Hook → **Regenerate**, update the GitHub secret. |
| `RENDER_API_KEY` | Render → Account Settings → API Keys → delete → create → update the GitHub secret. |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens → delete → create → update the GitHub secret. |

If a secret ever lands in a commit, rotating it is the *only* fix. Deleting it in a later commit
does nothing — it stays in the git history and in every clone and fork.
