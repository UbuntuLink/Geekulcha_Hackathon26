# UbuntuLink — Project Overview

**UbuntuLink** is a local services marketplace for South Africa. A customer describes a problem in their own words ("my kitchen sink is leaking"), an AI layer classifies the job and estimates a fair price, and the platform matches them with nearby, rated local service providers (plumbers, electricians, cleaners, etc.) to request quotes and book work.

This document describes the state of the project as of **2026-09-16**, based on the repo contents, the DB design (DrawSQL), the use case diagram, and the Figma UI flow. It exists so anyone (human or AI) picking up the repo can get oriented without re-deriving context.

**MVP scope note:** this build targets a hackathon-scoped MVP, not the full production vision. Real payments, geolocation, provider vetting, disputes, and messaging are explicitly out of scope for now — see §9 for the full gap list and §10 for what's been decided about the MVP cut.

**Want to run this?** See [INSTRUCTIONS.md](INSTRUCTIONS.md) — install steps, every API key/account you need, and the Render/Vercel deploy walkthrough. This file (PROJECT.md) is the *status/gap* reference; INSTRUCTIONS.md is the *how to turn the key* reference.

---

## 1. Tech Stack

| Layer | Technology | Deploys to |
|---|---|---|
| Backend API | Java 23, Spring Boot 4.1.1 (`web`, `data-jpa`, `validation`, `security`, `oauth2-client`) | Render (Docker) |
| Database | PostgreSQL (hosted on Supabase) | Supabase |
| ML / AI service | Python, FastAPI + Uvicorn, calling LLMs via OpenRouter (`anthropic/claude-haiku-4.5`) | Render |
| Frontend | React 18 + Vite + Tailwind + React Router | Vercel |
| Auth | Google OAuth2 (Sign in with Google) — see §8 | — |
| Payments | Mock only for MVP — see §10 | — |
| API docs | springdoc-openapi (Swagger UI) | — |
| Build | Maven (`mvnw`) / npm / pip | — |

Repo root: `Geekulcha_Hackathon26/` (GitHub: `leshenn/Geekulcha_Hackathon26`)

```
Geekulcha_Hackathon26/
├── PROJECT.md
├── render.yaml               # Render blueprint: backend + ml-service, see §10
├── 01_Database_CSV/          # seed data — STALE, written for the old 3-table schema, see §3a
├── backend/                  # Spring Boot API → Render (Dockerfile included)
│   └── src/main/java/com/geekkulcha/backend/
│       ├── BackendApplication.java
│       ├── config/           # SecurityConfig (Google OAuth2 + CORS)
│       ├── controller/       # REST endpoints (thin, delegate to service/)
│       ├── service/          # business logic
│       ├── repository/       # Spring Data JPA repositories, one per entity
│       ├── dto/
│       │   ├── request/      # inbound request bodies
│       │   └── response/     # outbound response shapes
│       ├── entity/           # JPA entities — full MVP schema, see §2/§3
│       ├── payment/          # MockPaymentService — see §10
│       └── exception/        # GlobalExceptionHandler
├── python/                   # ML service → Render
│   ├── app/
│   │   ├── main.py           # FastAPI app (POST /classify, POST /price, GET /health)
│   │   ├── core/              # llm_client.py (OpenRouter client), config.py
│   │   ├── routers/           # classification.py, pricing.py
│   │   ├── schemas/           # pydantic request/response models
│   │   └── services/          # classify_request(), estimate_price() — actual logic
│   ├── customer_message.py   # thin CLI wrapper around app/services, for local testing
│   ├── pricing.py            # thin CLI wrapper around app/services, for local testing
│   ├── prompts/               # system prompts used by the classifier/pricer
│   └── test_messages/         # sample customer messages for local testing
└── frontend/                  # React (Vite) → Vercel
    ├── src/
    │   ├── pages/
    │   │   ├── customer/       # the 12-screen Figma flow, see §5
    │   │   ├── provider/       # provider-side screens — NOT in Figma yet, see §9a
    │   │   └── auth/           # Login (Google button), AuthCallback
    │   ├── components/{common,layout}/
    │   ├── routes/             # AppRoutes.jsx, ProtectedRoute.jsx
    │   ├── api/                # client.js (backend), mlClient.js (ML service), per-domain calls
    │   ├── context/            # AuthContext.jsx
    │   └── styles/
    ├── vercel.json
    └── .env.example
```

---

## 2. Backend (Spring Boot)

- Entry point: `BackendApplication.java` — standard `@SpringBootApplication`.
- Config: `application.properties` loads `SUPABASE_DB_URL`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, `FRONTEND_URL`, and `PORT` (Render injects this) from env vars, with an optional local `.env` fallback. `ddl-auto=update` (Hibernate manages schema) and `show-sql=true`.
- **JPA entities now cover the full target schema** (§3), replacing the old simplified `Provider`/`Service`/`ProviderService` trio: `User`, `ProviderProfile`, `Service`, `ProviderService`, `ServiceRequest`, `Quote`, `Booking`, `Review`, `Payment` (mock), plus `RequestStatus`/`QuoteStatus`/`BookingStatus`/`PaymentStatus` enums.
- Layered structure now exists: `controller/` → `service/` → `repository/`, with `dto/request` + `dto/response` for the core flow (services list, service request, quote, booking, review). Not every entity has a controller yet — build the rest following the existing pattern as you need them.
- `GlobalExceptionHandler` (`exception/`) maps `ResourceNotFoundException` → 404 and validation failures → 400.
- `SecurityConfig` (`config/`) wires Google OAuth2 login (`spring-boot-starter-oauth2-client`) and CORS for the frontend origin. **All routes are currently `permitAll()`** — see the TODO in that file — tighten this once the frontend is actually consuming the session.
- Mock payment: `payment/MockPaymentService.java` + `Payment` entity — always succeeds, no real processor. See §10.
- **Auth is temporarily disabled** (§8) — `ServiceRequestController`/`QuoteController` no longer use `@AuthenticationPrincipal`; they attribute requests to a fixed demo customer via `UserService.getDemoCustomer()`, and `QuoteController` takes `providerProfileId` directly in the request body instead of deriving a provider from the (currently nonexistent) signed-in session.
- **`DevDataSeeder`** (`config/`) — a `CommandLineRunner` that seeds the 10 service categories + 3 demo plumbing providers (Thabo Plumbing, Mpho Home Services, FixRight Plumbing — matching the Figma names/prices exactly) plus one sample review, on first run only (skips if `service` already has rows). This is what makes the app clickable with real data locally — see INSTRUCTIONS.md §2b.
- **Endpoints now implemented** (all live, not just scaffolded):
  - `GET /api/services` — catalog
  - `POST /api/service-requests`, `GET /api/service-requests/{id}`, `GET /api/service-requests/mine`
  - `GET /api/services/{serviceId}/providers` — matching providers for a service (`ProviderMatchController`/`ProviderMatchService`), backs Figma screens 6-7
  - `GET /api/provider-profiles/{id}` — profile + services + real reviews (via a derived query `Review -> Booking -> Quote -> ProviderProfile`), backs Figma screen 8
  - `POST /api/quotes`, `GET /api/quotes/{id}`
  - `POST /api/bookings/accept-quote/{quoteId}`, `GET /api/bookings/{id}`, `PATCH /api/bookings/{id}/status`
  - `POST /api/bookings/{id}/review`
  - `POST /api/bookings/{id}/payment/mock-charge`
- **The frontend calls the ML service directly** (not backend → ML service-to-service) — see §6. `ServiceRequestService.create()` just persists whatever classification JSON the frontend already ran and passes in via `aiClassificationRaw`.
- **Not done yet:** matching/search logic beyond "who offers this service" (no geo, see §9b); DTOs for entities beyond the core flow (some controllers still return JPA entities directly, see §9g).

## 3. Database Design

### 3a. Old vs. new schema — seed CSVs are now stale
The CSVs in `01_Database_CSV/` (`ubuntulink_providers.csv`, `ubuntulink_services.csv`, `ubuntulink_provider_services.csv`) were written for the old 3-table schema (`Provider` with identity fields baked in). That entity no longer exists — it's been split into `User` + `ProviderProfile` (§3b) so a person can be both a customer and a provider, as the use-case diagram requires. **The CSVs need re-shaping before they'll seed the new schema** (`providers.csv` → split into a `users` seed + a `provider_profile` seed referencing it). Not yet done.

### 3b. Current schema (implemented in `entity/`)
- **User** — id, googleSub, email, firstName, lastName, createdAt (no password — see §8). Provider "business name" is just `firstName + lastName` (e.g. `firstName="Thabo"`, `lastName="Plumbing"` → "Thabo Plumbing") — no separate business-name field.
- **ProviderProfile** — id, user (1:1), bio, location, serviceRadiusKm, rating, **reviewCount** (denormalized — manually set, not derived from actual `Review` rows), **availableToday** (boolean flag, not a real calendar — both added to match the Figma cards without building §9a/§9e properly, see those sections)
- **Service** — id, name, description
- **ProviderService** — id, providerProfile, service, **minPrice, maxPrice** (a flat range, not the DrawSQL design's separate task-size-keyed price table — good enough to match the Figma price-range display)
- **ServiceRequest** — id, user, service, description, aiClassificationRaw, location, preferredDate, status, createdAt
- **Quote** — id, serviceRequest, providerProfile, amount, message, status, createdAt
- **Booking** — id, quote (1:1), scheduledDate, scheduledTime, status, createdAt
- **Review** — id, booking (1:1), rating, comment, createdAt
- **Payment** — id, booking (1:1), amount, status (`MOCK_*`), createdAt — mock only, see §10

Key relationships: a `User` can be both a customer (creates `ServiceRequest`s) and, via `ProviderProfile`, a provider. Providers quote on requests (`Quote`), quotes become `Booking`s, bookings get a mock `Payment` and a `Review`.

**Still missing from the original DrawSQL target** (dropped or deferred for MVP scope, see §9): `service_task_size` / task-size-based pricing tiers, `provider_service_price` min/max ranges, `actual_job_price` (a real recorded price separate from the quote amount — currently the quote amount doubles as the job price). Add these back if the MVP demo needs them.

## 4. Use Cases (from the use case diagram)

Two actors: **User** (customer) and **Provider**.

**User** can: Create Account, Log in, Manage Profile, Create Service Request, Accept/Reject Quote, Browse Providers, Mark Job Complete, Leave Review, View Quotes, View Bookings.

**Provider** can: Browse Service Requests, Submit Quote (Provider also inherits the User actor's use cases in the diagram, i.e. a provider account is also a user account — consistent with the `User` → `ProviderProfile` relationship in §3b).

## 5. Figma UI Flow (Customer Journey)

Figma file: `UbuntuLink: MVP UI`. Screens 1-9 were shared as actual screenshots (2026-09-16) and built to match pixel-for-pixel (emerald green `#1F5C45` hero/CTA, cream `#F5F1E4` background, white rounded cards, amber star ratings). Screens 10-12 weren't screenshotted — they're built consistent with that same design system rather than from a real mockup. All 12 are **fully built and wired to the real backend**, not stubs:

1. **Welcome** (`Welcome.jsx`) — "UbuntuLink — Local help. Right when you need it." / Get started
2. **Customer Onboarding** (`CustomerOnboarding.jsx`) — name, location, "What matters most?" (Price / Ratings). Saved to `localStorage` only (`lib/preferences.js`) — no profile-update endpoint exists, so this doesn't reach the backend. The priority choice does something real client-side: it sorts the Matching Providers list.
3. **Customer Home** (`CustomerHome.jsx`) — greeting, "Describe your problem" CTA, **real** "Recent requests" (`GET /api/service-requests/mine`) and a services-catalog-backed "Recommended" card; bottom nav (Home / Requests / Profile)
4. **Describe Your Problem** (`DescribeProblem.jsx`) — free-text box, calls `POST /classify` (ML service) then `POST /api/service-requests` (backend) on submit. "Add a photo" is a disabled placeholder (no upload backend, §9f).
5. **AI Service Identification** (`AIServiceIdentification.jsx`) — shows the real classification result, animated progress bar, auto-advances (with a manual "Skip" too)
6. **Matching Providers** (`MatchingProviders.jsx`) — real providers from `GET /api/services/{id}/providers`, client-sorted by the onboarding price/ratings preference
7. **Compare Providers** (`CompareProviders.jsx`) — comparison table for the top 3 from screen 6 (passed via router state, falls back to refetching)
8. **Provider Profile** (`ProviderProfileView.jsx`) — real bio/rating/reviews from `GET /api/provider-profiles/{id}` (reviews come from an actual `Review` join, not the denormalized count)
9. **Quote Request** (`QuoteRequest.jsx`) — calls `POST /price` (ML service) for the "expected range" hint, then `POST /api/quotes` **and immediately** `POST /api/bookings/accept-quote/{id}` — see the auto-accept shortcut note below
10. **Booking Confirmation** (`BookingConfirmation.jsx`) — real booking summary from `GET /api/bookings/{id}`
11. **Booking Tracking** (`BookingTracking.jsx`) — status stepper driven by `booking.status`; a "Simulate" button steps it through `PATCH /api/bookings/{id}/status` (standing in for a provider actually updating it — no provider-side app exists yet, §9a); reaching `COMPLETED` also fires the mock payment. "Message provider"/"Report an issue" are inert placeholders (§9d).
12. **Review Provider** (`ReviewProvider.jsx`) — star picker + comment → `POST /api/bookings/{id}/review`, a real `Review` row

Two more screens exist for bottom-nav completeness with **no Figma design** (kept intentionally simple): `MyRequests.jsx` (`/requests/mine`) and `Profile.jsx` (`/profile`, reads the onboarding localStorage data).

**Known MVP shortcut — read before demoing:** screen 9's "Send quote request" doesn't just request a quote, it also auto-accepts it into a real `Booking` in the same click. The proper flow (provider reviews the request and responds — `RequestsFeed`/`RequestDetail` stubs below) isn't built because there's no Figma for the provider side. This keeps screens 10-12 backed by real data without a second "logged in as provider" session. See INSTRUCTIONS.md §4.

**Provider-side screens have no Figma design** — `frontend/src/pages/provider/` has 6 stub pages (Onboarding, Dashboard, RequestsFeed, RequestDetail, Bookings, ProfileEdit) scaffolded from the use-case diagram alone, not from any mockup, and still just headings/TODOs. Design these before building them out. See §9a.

## 6. Python / AI Layer

Now a real FastAPI service (`python/app/`), not just CLI scripts:

- **`POST /classify`** (`app/routers/classification.py`) — wraps `classify_request()` (`app/services/classification_service.py`). Sends the raw customer message to `anthropic/claude-haiku-4.5` via OpenRouter using `prompts/job_classification_prompt.txt`. Returns `category` (plumbing, electrical, cleaning, gardening, mechanic, tutoring, beauty, painting, handyman, other), `confidence`, `reasoning`, `clarifying_question`, `advice`, `urgency`, `job_description`. Backs Figma screen 5.
- **`POST /price`** (`app/routers/pricing.py`) — wraps `estimate_price()` (`app/services/pricing_service.py`). Grounded in hardcoded SA market reference rates for plumbing/electrical only; other categories get a wide, explicitly-labeled unverified estimate. Backs the price hint on Figma screen 9.
- **`GET /health`** — for Render's health check.
- `customer_message.py` / `pricing.py` at the package root are now thin CLI wrappers around the same `app/services` code (no logic duplication) — still useful for local testing against `test_messages/test_messages.txt`.
- Needs `OPEN_ROUTER_API_KEY` (local: `.env` via `python-dotenv`; Render: set directly in the service's env vars).

**Bugs found and fixed while scaffolding:**
- ~~Both prompt templates were missing a comma before the last JSON field in their example response format~~ — fixed in `job_classification_prompt.txt` and `pricing_system_prompt.txt`.
- ~~`pricing.py` hardcoded the wrong/stale model id instead of reusing the shared `MODEL` constant~~ — fixed; both routers now go through the single `MODEL` constant in `app/core/llm_client.py`.

**Now wired in:** the frontend calls `/classify` and `/price` directly (`DescribeProblem.jsx`, `QuoteRequest.jsx`) — the backend never calls the ML service itself, it just stores whatever classification JSON the frontend already has (`ServiceRequest.aiClassificationRaw`).

**Still not done:** no retry/timeout/circuit-breaker around OpenRouter calls; low-confidence classifications and `clarifying_question` aren't surfaced anywhere in the UI; `aiClassificationRaw` is stored as an unstructured JSON string, not parsed into real columns. See §9f.

## 7. What's Not Built Yet (gap summary)

The 12 customer screens + core backend flow are now real and wired end to end (§5). What's left:

- **Frontend**: the 12 customer screens are built; the 6 provider-side pages (§9a) are still empty stubs — no Figma for them.
- **Backend**: no matching/search beyond "who offers this service" (blocked on §9b — no geodata); no real provider-responds-to-quote flow (the MVP shortcut auto-accepts, §5); authz is wide open (`permitAll()` everywhere — auth is off, see §8).
- **Google OAuth2**: fully wired but disabled (§8) — needs real `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` and the config changes listed in §8/INSTRUCTIONS.md §5 to turn back on.
- **Seed data**: `01_Database_CSV/` still doesn't match the schema (§3a) — no longer matters much locally since `DevDataSeeder` (§2) now seeds usable demo data directly through JPA on first run, but the CSVs themselves are still stale/unused.
- **Deploy**: `render.yaml` + `vercel.json` exist and are documented (INSTRUCTIONS.md §3) but haven't actually been deployed yet — this is untested against real Render/Vercel infrastructure.

## 8. Auth Decision

**Status: temporarily disabled (2026-09-16)** so the app is runnable/clickable without Google credentials while other parts get built. To re-enable:
- Backend: uncomment the `spring.security.oauth2.client.registration.google.*` lines in `application.properties`, restore `.oauth2Login(...)` in `SecurityConfig.java`, and set real `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` in `backend/.env`. (Note: even a *blank* client-id crashes Spring Security's OAuth2 autoconfig at startup — the properties have to be fully absent, not just empty, which is why they're commented out rather than defaulted.)
- Frontend: re-wrap the customer/provider routes in `frontend/src/routes/AppRoutes.jsx` with `<ProtectedRoute>` (component still exists at `routes/ProtectedRoute.jsx`, just unused right now), and restore the `getCurrentUser()` fetch in `AuthContext.jsx`.
- Remove `frontend/src/components/dev/DevNav.jsx` and its use in `App.jsx` once real in-app navigation (buttons/links inside each screen) replaces it — it's a temporary click-through menu.

**Auth is planned to be Google OAuth (Sign in with Google), not username/password**, once re-enabled. Already scaffolded:

- `User` entity has no `password_hash` — just `googleSub` (Google's stable subject id, unique) + `email`/`firstName`/`lastName` sourced from the Google profile on first login (`UserService.findOrCreate`).
- `pom.xml` has `spring-boot-starter-oauth2-client`; `application.properties` reads `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (get these from https://console.cloud.google.com/apis/credentials — not yet obtained).
- `config/SecurityConfig.java` wires `.oauth2Login()` + CORS for the frontend origin. Login entrypoint: `GET /oauth2/authorization/google` (frontend's `Login.jsx` links here).
- `/api/auth/me` (`AuthController`) returns the current user + whether they're a provider (`ProviderProfile` existence, not a role flag — matches the use-case diagram's "provider is also a user").
- Frontend: `AuthContext.jsx` calls `/api/auth/me` on load; `AuthCallback.jsx` is where Spring Security should redirect after a successful Google login — **that redirect target still needs to be configured** to point at the deployed frontend once it has a URL.
- **Still undecided:** session-cookie (current default — `withCredentials: true` is already set on the frontend's axios client) vs JWT. Session cookies are simpler for a hackathon and is what's wired up now; revisit only if cross-domain cookie issues show up between the Vercel and Render domains.

## 9. Loophole / Gap Analysis (customer side, provider side, AI, infra)

Full-app pass to find what's missing beyond "endpoints don't exist yet" — i.e. things that would break the product even after the obvious CRUD is built. Status updated after the §10 scaffolding pass.

### 9a. Provider side — the bigger gap
The Figma file (§5) only covers the **customer** journey, which is now fully built. Provider-side pages remain empty stubs (`frontend/src/pages/provider/`) with **no design and no real content**:
- **No provider onboarding/verification flow** — `ProviderOnboarding.jsx` is a stub; still no ID/licensing/background-check step anywhere in the schema or use cases. Out of scope for MVP, but a real launch would need it.
- **No real "provider reviews and responds to a quote request" flow** — the customer-side "Send quote request" (screen 9) auto-creates and auto-accepts the quote as an MVP shortcut instead (see §5). `RequestsFeed.jsx`/`RequestDetail.jsx` are where a real version of this belongs — still stubs.
- **`availableToday` is a manually-set flag, not a real calendar** (added to `ProviderProfile` to match the Figma "Available today" tag — §3b). No availability/scheduling system behind it.
- **No provider notification path** — still undesigned when a customer sends a quote request or books.

### 9b. Geolocation — matching can't actually work yet — still open
`ProviderProfile.location` is still a plain string. No lat/long column, no PostGIS, no "nearby" query. **Out of MVP scope** (see §10) — the MVP will fake/skip real distance sorting rather than block on this.

### 9c. Payments — MVP decision made, see §10
~~Entirely absent~~ — resolved for MVP: mock payment only (`payment/MockPaymentService.java`), no real processor. Real payments (escrow, commission, PayFast/Stripe integration) remain a post-MVP gap.

### 9d. Disputes, cancellations, messaging — still open
- Figma screen 11's "Report an issue" and "Message provider" buttons still have nothing behind them — no dispute entity, no chat/messaging table.
- Status fields are now real enums (`RequestStatus`, `QuoteStatus`, `BookingStatus`, `PaymentStatus` in `entity/`) instead of untyped strings, but there's still no enforced state-machine (e.g. nothing stops an illegal transition like `CANCELLED` → `COMPLETED`).

### 9e. Trust & safety — one-directional reviews only — still open
`Review` only lets a customer review a provider after a `Booking`. No provider → customer review path.

### 9f. AI layer loopholes — partially addressed
- ~~Two prompt JSON bugs, wrong hardcoded model id~~ — fixed, see §6.
- ~~Not called from anywhere~~ — now called directly from the frontend (`DescribeProblem.jsx`, `QuoteRequest.jsx`), see §5/§6.
- **Still open:** low-confidence classification and `clarifying_question` still have nowhere to go in the UI. AI output is persisted (`ServiceRequest.aiClassificationRaw`) but only as a raw string blob, not structured. Photo upload (Figma screen 4) still has no backend (no storage, no upload endpoint — the button is an inert placeholder). No retry/timeout/circuit-breaker around OpenRouter calls. Pricing still only grounded for 2 of 9 categories.

### 9g. Data-modeling gaps — mostly addressed
- ~~`Provider` entity conflated identity + profile~~ — fixed: split into `User` + `ProviderProfile` (§3b). **Seed CSVs still don't match** (§3a) — no longer blocking though, since `DevDataSeeder` seeds through JPA directly.
- ~~No DTOs~~ — request/response DTOs now exist for the core flow (`dto/request`, `dto/response`) plus the new matching/profile DTOs (§2); entities are still returned directly from some controllers (e.g. `ServiceRequestController`, `BookingController`) rather than mapped to DTOs — works fine in practice since all the relevant `@ManyToOne`/`@OneToOne` associations default to EAGER fetch, but is still a shortcut worth cleaning up post-MVP.
- **Still open:** no Bean Validation annotations on entities (only on the new request DTOs); no unique constraints beyond `User.googleSub`/`email` and `Service.name`.

### 9h. Infra / process — partially addressed
- ~~No Docker~~ — `backend/Dockerfile` now exists (multi-stage Maven build → JRE runtime) for Render deployment.
- **Still open:** no CI, only the default generated `BackendApplicationTests` smoke test — no real test coverage anywhere.
- `.env` files remain correctly gitignored in both `backend/` and `python/`; `frontend/.gitignore` now also excludes `.env`/`.env.local` — confirmed clean.

## 10. Deployment & MVP-Scope Decisions (2026-09-16)

Decisions made to keep this shippable as a hackathon MVP:

- **Frontend → Vercel.** `frontend/vercel.json` sets the build command (`npm run build`), output dir (`dist`), and a SPA rewrite so React Router's client-side routes don't 404 on refresh. Needs `VITE_API_BASE_URL` (backend Render URL) and `VITE_ML_API_BASE_URL` (ML service Render URL) set as Vercel env vars — see `frontend/.env.example`.
- **Backend + ML service → Render**, both defined in the root `render.yaml` blueprint:
  - `ubuntulink-backend` — Docker runtime, builds from `backend/Dockerfile`. Needs `SUPABASE_DB_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL` set in Render's dashboard (marked `sync: false` in the blueprint — secrets aren't committed).
  - `ubuntulink-ml-service` — Python runtime, `uvicorn app.main:app`. Needs `OPEN_ROUTER_API_KEY`, `FRONTEND_URL`.
  - Fixed a real deploy blocker while wiring this up: `application.properties`'s `spring.config.import` for the local `.env` file wasn't marked `optional:`, which would have crashed backend startup on Render (no `.env` file is deployed there — real config comes from Render's env vars instead).
- **Payments are mocked for the MVP, not real.** `Payment` entity + `MockPaymentService` always returns `MOCK_PAID` — there's no Stripe/PayFast/escrow integration, and none is planned before the hackathon deadline. `POST /api/bookings/{id}/payment/mock-charge` is the only payment endpoint. Real payment integration is a deliberate post-MVP cut (§9c).
- **Also deliberately cut from MVP scope** (don't build these unless asked): real geolocation/distance matching (§9b), provider verification/vetting (§9a), disputes/cancellations/messaging (§9d), provider→customer reviews (§9e), `service_task_size` price tiers.

---
*This file is a living reference — update it as the schema, endpoints, or UI flow evolve.*
