# UbuntuLink — Install, Run & Deploy Guide

Everything you need to get UbuntuLink running locally and deployed, including every API key/account you have to go create. Companion to [PROJECT.md](PROJECT.md), which covers *what's built and what's missing* — this doc is just *how to turn the key*.

Auth is currently **disabled** (see PROJECT.md §8) so none of this requires a Google Cloud account yet — that section is included for when you turn it back on.

---

## 0. Accounts & API keys you need

Get these first — everything below assumes you already have them.

| # | What | Where to get it | Used for |
|---|---|---|---|
| 1 | **OpenRouter API key** | https://openrouter.ai → sign up → Keys → Create key | ML service calls to `anthropic/claude-haiku-4.5` (job classification + pricing) |
| 2 | **Supabase project + connection string** | https://supabase.com → New project → Project Settings → Database → Connection string (URI, "Transaction" pooler mode recommended) | The Postgres database the backend writes to |
| 3 | **Render account** | https://render.com → sign up (GitHub login is easiest) | Hosting the backend + ML service |
| 4 | **Vercel account** | https://vercel.com → sign up (GitHub login is easiest) | Hosting the frontend |
| 5 | *(later)* **Google OAuth Client ID/Secret** | https://console.cloud.google.com/apis/credentials | Re-enabling real login — not needed right now, see §5 |

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
```
(Google OAuth vars are commented out in `application.properties` right now — leave them out, see §5.)

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
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Leave blank for now — auth is disabled (§5) |
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

- **No real login.** Every request acts as a fixed demo customer (`UserService.getDemoCustomer()`). See §5 to bring Google auth back.
- **"Send quote request" auto-accepts.** Real UX would have the provider review and respond to a quote request; that provider-side loop isn't built (no Figma for it — see PROJECT.md §9a). For now, submitting a quote request immediately creates the booking too, so the rest of the flow (confirmation → tracking → review) has something real to run against.
- **Payments are mocked.** `POST /api/bookings/{id}/payment/mock-charge` always succeeds — no Stripe/PayFast, see PROJECT.md §9c/§10.
- **No real distance/geolocation.** "Matching Providers" shows everyone who offers the matched service, not who's nearby — see PROJECT.md §9b.
- **Demo data lives in `DevDataSeeder.java`**, not the `01_Database_CSV/` files (those are stale against the current schema — see PROJECT.md §3a).

---

## 5. Re-enabling Google Auth (when you're ready)

1. Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID** → Web application.
   - Authorized redirect URI: `http://localhost:8080/login/oauth2/code/google` (add your Render backend's equivalent URL too once deployed: `https://ubuntulink-backend.onrender.com/login/oauth2/code/google`).
2. Copy the Client ID and Client secret into `backend/.env` (and into Render's env vars):
   ```
   GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxxx
   ```
3. In `backend/src/main/resources/application.properties`, uncomment the three `spring.security.oauth2.client.registration.google.*` lines.
4. In `backend/src/main/java/com/geekkulcha/backend/config/SecurityConfig.java`, add `.oauth2Login(oauth2 -> {})` back into the filter chain, and tighten `.anyRequest().permitAll()` to `.authenticated()` for the routes that should require login.
5. In `frontend/src/routes/AppRoutes.jsx`, re-wrap the customer/provider routes in `<ProtectedRoute>` (still there, just unused).
6. In `frontend/src/context/AuthContext.jsx`, restore the `getCurrentUser()` fetch on mount.
7. Remove `frontend/src/components/dev/DevNav.jsx` and its use in `App.jsx`.
8. Replace the demo-user fallbacks in `ServiceRequestController`/`QuoteController` with the real `@AuthenticationPrincipal OidcUser`.

---

## 6. Troubleshooting

| Symptom | Likely cause |
|---|---|
| Backend won't start: `Could not resolve placeholder 'SUPABASE_DB_URL'` | `backend/.env` missing or not found — must be at `backend/.env`, and you can run Maven from either the repo root or `backend/` (both are checked) |
| Backend won't start: something about `clientId cannot be empty` | You uncommented the Google OAuth properties without setting real `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` — either set them or re-comment those lines |
| Frontend screens load but show "Couldn't reach the ML service or backend" | One of the three `npm run dev` / `uvicorn` / `./mvnw spring-boot:run` processes isn't running, or the `.env`/`.env.local` files have the wrong ports |
| `GET /api/services` returns `[]` | `DevDataSeeder` only seeds when the `service` table is empty — if you manually deleted rows without dropping the whole table, it won't re-seed. Truncate the table or just let `ddl-auto=update` recreate it |
| CORS errors in the browser console | `FRONTEND_URL` env var on the backend/ML service doesn't match the URL you're actually loading the frontend from |
| Render deploy fails on the backend | Check the build logs for the Maven/Docker step — the most common cause is a missing env var referenced by `application.properties` |
