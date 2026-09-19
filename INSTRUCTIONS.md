# UbuntuLink — Install, Run & Deploy Guide

Everything you need to get UbuntuLink running locally and deployed, including every API key/account you have to go create. Companion to [PROJECT.md](PROJECT.md), which covers *what's built and what's missing* — this doc is just *how to turn the key*.

Login/register work end to end (email/password + JWT — see PROJECT.md §8) and the backend fully enforces it — every route needs a valid token except `/auth/**`. No third-party auth provider (Google, etc.) is used.

---

## 0. Accounts & API keys you need

Get these first — everything below assumes you already have them.

| # | What | Where to get it | Used for |
|---|---|---|---|
| 1 | **OpenRouter API key** | https://openrouter.ai → sign up → Keys → Create key | ML service calls to `anthropic/claude-haiku-4.5` (job classification + pricing) |
| 2 | **Supabase project + connection string** | https://supabase.com → New project → Project Settings → Database → Connection string (URI, "Transaction" pooler mode recommended) | The Postgres database the backend writes to |
| 3 | **Render account** | https://render.com → sign up (GitHub login is easiest) | Hosting the backend + ML service |
| 4 | **Vercel account** | https://vercel.com → sign up (GitHub login is easiest) | Hosting the frontend |
| 5 | **A JWT secret you generate yourself** | Not a signup — just a random string, 32+ characters (e.g. `openssl rand -base64 48`, or any password generator) | Signing login JWTs (`JWT_SECRET` env var) |

For #2, the connection string Supabase gives you looks like:
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-xxxxx.pooler.supabase.com:6543/postgres
```
Spring Boot needs it in **JDBC** form — just add `jdbc:` to the front:
```
jdbc:postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-xxxxx.pooler.supabase.com:6543/postgres
```

---

## 1. Install prerequisites

| Tool | Version | Check with |
|---|---|---|
| JDK | **17 or newer** (project targets 23) | `java -version` |
| Node.js | 18+ | `node -v` |
| Python | 3.10+ | `python --version` |

If `java -version` shows anything older than 17 (or isn't found), install one first — e.g. [Eclipse Temurin](https://adoptium.net). The backend will not start on Java 8/11.

---

## 2. Run it locally

Three services, three terminals. Start them in this order.

### 2a. ML service (Python/FastAPI)

```bash
cd python
python -m venv .venv && source .venv/Scripts/activate   # Windows Git Bash; use .venv/bin/activate on Mac/Linux
pip install -r requirements.txt
```

Create `python/.env`:
```
OPEN_ROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxx
```

Run:
```bash
uvicorn app.main:app --reload --port 8000
```
Check: `curl http://localhost:8000/health` → `{"status":"ok"}`

### 2b. Backend (Spring Boot)

Create `backend/.env`:
```
SUPABASE_DB_URL=jdbc:postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-xxxxx.pooler.supabase.com:6543/postgres
JWT_SECRET=<a random 32+ character string — see §0>
```
`JWT_SECRET` is required — the backend won't start without it (`SecurityConfig` reads it via `@Value("${JWT_SECRET}")` with no default).

Run (from the `backend/` folder):
```bash
cd backend
./mvnw spring-boot:run
```

On first run, `DevDataSeeder` automatically inserts demo data into your Supabase database — 10 service categories and 3 plumbing providers (Thabo Plumbing, Mpho Home Services, FixRight Plumbing) matching the Figma designs, so the app is actually clickable with real data instead of empty screens. It only seeds once (skips if `service` already has rows).

Check: `curl http://localhost:8080/api/services` → a JSON array of 10 services.

### 2c. Frontend (React/Vite)

Create `frontend/.env.local`:
```
VITE_API_BASE_URL=http://localhost:8080
VITE_ML_API_BASE_URL=http://localhost:8000
```

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

### 2d. Try the real flow end to end

Auth is fully enforced now (PROJECT.md §8), and the provider-responds-to-a-quote flow is real — so testing the whole loop needs **two accounts in two browser sessions** (e.g. one normal window + one incognito/private window, so both stay logged in at once).

**Session A — register a provider:**
1. **Register** → check "I'm a service provider" → this also creates a `ProviderProfile` for them
2. **Login** → lands on `/provider/dashboard`, which redirects to **Provider Onboarding** since the profile's still empty
3. Fill in bio + location, pick a service (e.g. Plumbing) with a price range → Finish setup
4. You're on the **Provider Dashboard** — leave this session logged in

**Session B — register a customer, run the real flow:**
1. **Register** (leave "I'm a service provider" unchecked) → **Login** → lands on `/home`
2. **Onboarding** → name + location (match Session A's provider's location/service area loosely), pick Price or Ratings, Continue
3. **Home** → "Describe your problem" → type something like *"My kitchen sink is leaking and I need someone to fix it today"* → Find the right service (really calls the ML service)
4. **AI Service Identification** → shows the real classification, auto-advances
5. **Matching Providers** → should include Session A's provider if the category/service matches
6. Tap that provider → **Provider Profile** → Request a quote → **Quote Request** → Send quote request → lands on **Quotes Received** (empty for now — nothing's been submitted yet)

**Back to Session A:**
7. **Requests Feed** → the request from Session B should appear (with an "Asked for you" badge) → tap it → **Request Detail** → enter an amount + message → Send quote

**Back to Session B:**
8. Refresh **Quotes Received** → the quote appears → **Accept** → **Booking Confirmation** → View booking → **Booking Tracking** (read-only — refresh to see status changes)

**Back to Session A:**
9. **Provider Bookings** → the booking appears → tap "Mark Accepted", then "On the way", then "Completed" (this also fires the mock payment)

**Back to Session B:**
10. **Booking Tracking** → Refresh status → should now show Completed → **Leave a review** → submit a rating — a real `Review` row

If a step fails, open the browser console — API errors are logged there, and it's almost always one of the three services not running, a missing env var, or being logged into the wrong session.

---

## 3. Deploying

### 3a. Backend + ML service → Render

The root [render.yaml](render.yaml) defines both services as a Render "Blueprint". In the Render dashboard: **New → Blueprint**, connect this repo, and Render will find `render.yaml` and propose both services.

For each, Render will ask you to fill in the env vars marked `sync: false` in the blueprint:

**`ubuntulink-backend`**
| Env var | Value |
|---|---|
| `SUPABASE_DB_URL` | Same JDBC string as your local `backend/.env` |
| `JWT_SECRET` | Generate a **different** random 32+ character string for prod — don't reuse your local one |
| `FRONTEND_URL` | Your Vercel URL once you have it (e.g. `https://ubuntulink.vercel.app`) — can add after first deploy |

**`ubuntulink-ml-service`**
| Env var | Value |
|---|---|
| `OPEN_ROUTER_API_KEY` | Same key as your local `python/.env` |
| `FRONTEND_URL` | Same Vercel URL |

Render builds the backend from `backend/Dockerfile` (Maven → JRE image) and the ML service via `pip install -r requirements.txt` + `uvicorn`. First deploy of the backend will also run `DevDataSeeder` against whatever `SUPABASE_DB_URL` you gave it — if that's the same Supabase project you used locally, it's a no-op (already seeded); if it's a fresh one, you get the same demo data there too.

Note both service URLs Render gives you (`https://ubuntulink-backend.onrender.com`, `https://ubuntulink-ml-service.onrender.com`) — you need them for the frontend next.

### 3b. Frontend → Vercel

**New Project → Import this repo**. Vercel should auto-detect Vite from `frontend/vercel.json`; if it asks, set:
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

Add these env vars in Vercel's project settings:
| Env var | Value |
|---|---|
| `VITE_API_BASE_URL` | Your Render backend URL from 3a |
| `VITE_ML_API_BASE_URL` | Your Render ML service URL from 3a |

Deploy. Then go back to Render and set both services' `FRONTEND_URL` to your new Vercel URL (needed for CORS), and redeploy them.

### 3c. Free-tier note

Render's free web services spin down after inactivity and take ~30-60s to wake on the next request — the first click after idle time will feel slow. Not a bug.

---

## 4. What's simplified for this pass (read before demoing)

- **Payments are mocked.** `POST /api/bookings/{id}/payment/mock-charge` always succeeds — no Stripe/PayFast, see PROJECT.md §9c/§10.
- **No real distance/geolocation.** "Matching Providers" shows everyone who offers the matched service, not who's nearby — see PROJECT.md §9b.
- **No provider verification, no scheduling calendar, no messaging** — see PROJECT.md §9a for what's still open on the provider side beyond the 6 screens that are built.
- **`/auth/login` returns a bare JWT**, not a JSON object — the frontend always makes a follow-up `GET /api/users/me` call to get the user's name/id/role. Works fine, just an extra round trip (PROJECT.md §8).
- **Demo data lives in `DevDataSeeder.java`**, not the `01_Database/` CSVs (those aren't imported by anything — see PROJECT.md §3a). In practice the shared Supabase DB already had its own real provider data before this ever ran, so the seeder has mostly been a no-op there.

---

## 5. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Backend won't start: `Could not resolve placeholder 'SUPABASE_DB_URL'` | `backend/.env` missing or not found — must be at `backend/.env`, and you can run Maven from either the repo root or `backend/` (both are checked) |
| Backend won't start: `Could not resolve placeholder 'JWT_SECRET'` | `backend/.env` is missing `JWT_SECRET` — see §2b, any random 32+ character string works locally |
| `POST /auth/login` returns 401 for a user you just registered | Double-check the email/password match exactly — Argon2 hashing is case-sensitive and there's no "forgot password" flow yet |
| Any other endpoint returns 401 | Expected if you're testing with `curl`/Postman directly — every route needs `Authorization: Bearer <token>` from `/auth/login` except `/auth/**` itself (PROJECT.md §8). The frontend handles this automatically once you're logged in. |
| A request you created isn't showing up in another provider's Requests Feed | The feed only shows `OPEN` requests — once any provider submits a quote it flips to `QUOTED` and disappears from the feed until that quote is accepted or rejected (rejecting reopens it) |
| Frontend screens load but show "Couldn't reach the ML service or backend" | One of the three `npm run dev` / `uvicorn` / `./mvnw spring-boot:run` processes isn't running, or the `.env`/`.env.local` files have the wrong ports |
| `GET /api/services` returns `[]` | `DevDataSeeder` only seeds when the `service` table is empty — if you manually deleted rows without dropping the whole table, it won't re-seed. Truncate the table or just let `ddl-auto=update` recreate it |
| CORS errors in the browser console | `FRONTEND_URL` env var on the backend/ML service doesn't match the URL you're actually loading the frontend from |
| Render deploy fails on the backend | Check the build logs for the Maven/Docker step — the most common cause is a missing env var referenced by `application.properties` |
