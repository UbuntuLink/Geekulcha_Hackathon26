# UbuntuLink — Install, Run & Deploy Guide

Everything you need to get UbuntuLink running locally and deployed, including every API key/account you have to go create. Companion to [PROJECT.md](PROJECT.md), which covers *what's built and what's missing* — this doc is just *how to turn the key*.

Login/register work (email/password + JWT — see PROJECT.md §8), but the backend doesn't validate that JWT on any business endpoint yet, so everything still runs as a fixed demo user regardless of who's logged in. No third-party auth provider (Google, etc.) is used — see §5 for what's left to actually enforce it.

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

0. (Optional) **Register** → create an account, then **Login** — this works end to end and returns a real JWT, but no screen actually requires being logged in yet (see PROJECT.md §8), so you can skip straight to step 1 too.
1. **Welcome** → Get started
2. **Onboarding** → enter a name + location (e.g. "Pretoria, Gauteng" — matches the seeded providers), pick Price or Ratings, Continue
3. **Home** → "Describe your problem" → type something like *"My kitchen sink is leaking and I need someone to fix it today"* → Find the right service (this really calls the ML service to classify it)
4. **AI Service Identification** → shows the real classification, auto-advances
5. **Matching Providers** → real providers from your Supabase DB (seeded ones, if you used the sample message above it'll match "Plumbing")
6. Tap a provider → **Provider Profile** → Request a quote
7. **Quote Request** → fill in a message → Send quote request (creates a real `Quote` + auto-accepts it into a `Booking` — see the note in §4 below)
8. **Booking Confirmation** → View booking
9. **Booking Tracking** → use the "Simulate" button to step through Accepted → On the way → Completed (marking Completed also fires the mock payment)
10. **Review Provider** → submit a rating — this is a real `Review` row in your database

If a step fails, open the browser console — API errors are logged there, and it's almost always one of the three services not running or a missing env var.

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

- **Login exists but isn't enforced.** Register/Login give you a real JWT, but no backend endpoint checks it — every request still acts as a fixed demo customer (`UserService.getDemoCustomer()`). See §5 for what's left to change that.
- **"Send quote request" auto-accepts.** Real UX would have the provider review and respond to a quote request; that provider-side loop isn't built (no Figma for it — see PROJECT.md §9a). For now, submitting a quote request immediately creates the booking too, so the rest of the flow (confirmation → tracking → review) has something real to run against.
- **Payments are mocked.** `POST /api/bookings/{id}/payment/mock-charge` always succeeds — no Stripe/PayFast, see PROJECT.md §9c/§10.
- **No real distance/geolocation.** "Matching Providers" shows everyone who offers the matched service, not who's nearby — see PROJECT.md §9b.
- **Demo data lives in `DevDataSeeder.java`**, not the `01_Database/` CSVs (those aren't imported by anything — see PROJECT.md §3a).

---

## 5. Actually enforcing the JWT (when you're ready)

Login/register already work and return a real signed JWT (PROJECT.md §8) — this is what's left to make the backend actually check it instead of running everything as a demo user:

1. In `backend/src/main/java/com/geekkulcha/backend/config/SecurityConfig.java`, add a `JwtDecoder` bean (`NimbusJwtDecoder.withSecretKey(...)`, same `JWT_SECRET` you already have) and wire `.oauth2ResourceServer(oauth2 -> oauth2.jwt(...))` into the filter chain (the `spring-boot-starter-oauth2-resource-server` dependency needed for this is already in `pom.xml`).
2. Tighten `.anyRequest().permitAll()` to `.authenticated()` for the routes that should require login (probably everything except `/auth/**`).
3. In each controller currently calling `userService.getDemoCustomer()` (`ServiceRequestController`, `QuoteController`), swap it for reading the user id out of the authenticated JWT's `sub` claim (e.g. `@AuthenticationPrincipal Jwt jwt` → `jwt.getSubject()` → look up the `User` by id) instead.
4. Decide what `/auth/login` should actually return — right now it's a bare JWT string with no user info. Consider returning `{token, userId, firstName, ...}` so the frontend doesn't have to guess.
5. In `frontend/src/routes/AppRoutes.jsx`, re-wrap the customer/provider routes in `<ProtectedRoute>` (still there, just unused).
6. If `POST /auth/register`'s `isProvider: true` should actually create a `ProviderProfile`, add that to `AuthService.register()`.

---

## 6. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Backend won't start: `Could not resolve placeholder 'SUPABASE_DB_URL'` | `backend/.env` missing or not found — must be at `backend/.env`, and you can run Maven from either the repo root or `backend/` (both are checked) |
| Backend won't start: `Could not resolve placeholder 'JWT_SECRET'` | `backend/.env` is missing `JWT_SECRET` — see §2b, any random 32+ character string works locally |
| `POST /auth/login` returns 401 for a user you just registered | Double-check the email/password match exactly — Argon2 hashing is case-sensitive and there's no "forgot password" flow yet |
| Frontend screens load but show "Couldn't reach the ML service or backend" | One of the three `npm run dev` / `uvicorn` / `./mvnw spring-boot:run` processes isn't running, or the `.env`/`.env.local` files have the wrong ports |
| `GET /api/services` returns `[]` | `DevDataSeeder` only seeds when the `service` table is empty — if you manually deleted rows without dropping the whole table, it won't re-seed. Truncate the table or just let `ddl-auto=update` recreate it |
| CORS errors in the browser console | `FRONTEND_URL` env var on the backend/ML service doesn't match the URL you're actually loading the frontend from |
| Render deploy fails on the backend | Check the build logs for the Maven/Docker step — the most common cause is a missing env var referenced by `application.properties` |
