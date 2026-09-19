# UbuntuLink — Project Overview

**UbuntuLink** is a local services marketplace for South Africa. A customer describes a problem in their own words ("my kitchen sink is leaking"), an AI layer classifies the job and estimates a fair price, and the platform matches them with nearby, rated local service providers (plumbers, electricians, cleaners, etc.) to request quotes and book work.

This document describes the state of the project as of **2026-09-19**, based on the repo contents, the DB design (DrawSQL), the use case diagram, and the Figma UI flow. It exists so anyone (human or AI) picking up the repo can get oriented without re-deriving context.

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
| Auth | Email/password + JWT (Argon2 hashing) — see §8 | — |
| Payments | Mock only for MVP — see §10 | — |
| API docs | springdoc-openapi (Swagger UI) | — |
| Build | Maven (`mvnw`) / npm / pip | — |

Repo root: `Geekulcha_Hackathon26/` (GitHub: `leshenn/Geekulcha_Hackathon26`)

```
Geekulcha_Hackathon26/
├── PROJECT.md
├── render.yaml               # Render blueprint: backend + ml-service, see §10
├── 01_Database/               # seed CSVs matching the DrawSQL schema (unused by any code, see §3a) + ERD png
├── 02_Diagrams/               # CreatingAccount.drawio, UserCaseDiagram.drawio
├── backend/                  # Spring Boot API → Render (Dockerfile included)
│   └── src/main/java/com/geekkulcha/backend/
│       ├── BackendApplication.java
│       ├── config/           # SecurityConfig (JWT auth + CORS), DevDataSeeder
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
    │   │   └── auth/           # Login, Register (email/password, see §8)
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
- Config: `application.properties` loads `SUPABASE_DB_URL`, `JWT_SECRET`, `FRONTEND_URL`, and `PORT` (Render injects this) from env vars, with an optional local `.env` fallback. `ddl-auto=update` (Hibernate manages schema) and `show-sql=true`.
- **JPA entities now cover the full target schema** (§3), replacing the old simplified `Provider`/`Service`/`ProviderService` trio: `User`, `ProviderProfile`, `Service`, `ProviderService`, `ServiceRequest`, `Quote`, `Booking`, `Review`, `Payment` (mock), plus `RequestStatus`/`QuoteStatus`/`BookingStatus`/`PaymentStatus` enums.
- Layered structure now exists: `controller/` → `service/` → `repository/`, with `dto/request` + `dto/response` for the core flow (services list, service request, quote, booking, review). Not every entity has a controller yet — build the rest following the existing pattern as you need them.
- `GlobalExceptionHandler` (`exception/`) maps `ResourceNotFoundException` → 404, `ForbiddenException` → 403 (ownership checks — see below), validation failures → 400.
- `SecurityConfig` (`config/`) wires the Argon2 `PasswordEncoder`, the JWT-issuing `JwtEncoder`, a matching `JwtDecoder`, and CORS. **Auth is enforced for real now** (§8) — every route requires a valid `Authorization: Bearer <jwt>` except `/auth/**`.
- Mock payment: `payment/MockPaymentService.java` + `Payment` entity — always succeeds, no real processor. See §10.
- **`UserService.getCurrentUser(Jwt jwt)`** reads the `sub` claim (a user id) and loads the real `User` — this is what every controller uses now instead of a fixed demo user. `GET /api/users/me` exposes it to the frontend.
- **Ownership checks, not just authentication:** accepting a quote, advancing a booking's status, rejecting a quote, and setting a request's preferred provider all verify the caller actually owns the resource (403 otherwise) — see `BookingService`/`QuoteService`/`ServiceRequestService`.
- **`DevDataSeeder`** (`config/`) — a `CommandLineRunner` that seeds the 10 service categories + 3 demo plumbing providers (Thabo Plumbing, Mpho Home Services, FixRight Plumbing — matching the Figma names/prices exactly) plus one sample review, on first run only (skips if `service` already has rows). Note: the shared Supabase DB already had its own real provider data before this ever ran, so in practice `DevDataSeeder` has been a no-op there — see INSTRUCTIONS.md §2b.
- **Endpoints now implemented** (all live, all auth-enforced except `/auth/**`):
  - `GET /api/services` — catalog
  - `POST /api/service-requests`, `GET /api/service-requests/{id}`, `GET /api/service-requests/mine`, `GET /api/service-requests/open` (provider feed), `GET /api/service-requests/{id}/quotes`, `PATCH /api/service-requests/{id}/preferred-provider`
  - `GET /api/services/{serviceId}/providers` — matching providers for a service (`ProviderMatchController`/`ProviderMatchService`, public browsing), backs Figma screens 6-7
  - `GET /api/provider-profiles/{id}` — public profile + services + real reviews (via a derived query `Review -> Booking -> Quote -> ProviderProfile`), backs Figma screen 8
  - `GET/PATCH /api/provider-profiles/me`, `PUT/DELETE /api/provider-profiles/me/services/{id}` — self-service provider profile + a real list of service offerings (`ProviderProfileController`)
  - `POST /api/quotes` (provider derived from the JWT, not the request body), `GET /api/quotes/{id}`, `PATCH /api/quotes/{id}/reject`
  - `POST /api/bookings/accept-quote/{quoteId}`, `GET /api/bookings/{id}`, `GET /api/bookings/mine` (provider's own), `PATCH /api/bookings/{id}/status` (provider-only)
  - `POST /api/bookings/{id}/review`
  - `POST /api/bookings/{id}/payment/mock-charge`
  - `GET /api/users/me`
- **The frontend calls the ML service directly** (not backend → ML service-to-service) — see §6. `ServiceRequestService.create()` just persists whatever classification JSON the frontend already ran and passes in via `aiClassificationRaw`.
- **Not done yet:** matching/search logic beyond "who offers this service" (no geo, see §9b); DTOs for entities beyond the core flow (some controllers still return JPA entities directly, see §9g — `User.passwordHash` is `@JsonIgnore`'d so this is no longer a security issue, just a style one).

## 3. Database Design

### 3a. Seed CSVs — present, but not wired to anything
`01_Database/` (renamed from `01_Database_CSV/`, merged in from `Leshen-Login`) has CSVs matching the DrawSQL schema (`ubuntulink_users.csv`, `ubuntulink_provider_profiles.csv`, `ubuntulink_provider_services.csv`, `ubuntulink_services.csv`) plus an ERD image. No code imports these anywhere — local demo data instead comes from `DevDataSeeder` (§2), which seeds directly through JPA on backend startup. Worth reconciling eventually (either wire a CSV import, or drop these in favor of the seeder being the one source of truth).

### 3b. Current schema (implemented in `entity/`)
- **User** — id, email, passwordHash, firstName, lastName, phoneNumber, createdAt (see §8). Provider "business name" is just `firstName + lastName` (e.g. `firstName="Thabo"`, `lastName="Plumbing"` → "Thabo Plumbing") — no separate business-name field.
- **ProviderProfile** — id, user (1:1), bio, location, serviceRadiusKm, rating, **reviewCount** (denormalized — manually set, not derived from actual `Review` rows), **availableToday** (boolean flag, not a real calendar — both added to match the Figma cards without building §9a/§9e properly, see those sections)
- **Service** — id, name, description
- **ProviderService** — id, providerProfile, service, **minPrice, maxPrice** (a flat range, not the DrawSQL design's separate task-size-keyed price table — good enough to match the Figma price-range display)
- **ServiceRequest** — id, user, service, description, aiClassificationRaw, location, preferredDate, status, createdAt
- **Quote** — id, serviceRequest, providerProfile, amount, message, status, createdAt
- **Booking** — id, quote (1:1), scheduledDate, scheduledTime, status, createdAt
- **Review** — id, booking (1:1), rating, comment, createdAt
- **Payment** — id, booking (1:1), amount, status (`MOCK_*`), createdAt — mock only, see §10

Key relationships: a `User` can be both a customer (creates `ServiceRequest`s) and, via `ProviderProfile`, a provider. Providers quote on requests (`Quote`), quotes become `Booking`s, bookings get a mock `Payment` and a `Review`.

**Present but unused** (merged in from `Leshen-Login`): `ServiceTaskSize`, `ProviderServicePrice`, `ActualJobPrice` entities exist in `entity/` matching the original DrawSQL design (task-size-keyed pricing tiers, a job price recorded separately from the quote amount) — but nothing creates, queries, or seeds them. `ProviderService.minPrice/maxPrice` is what actually backs the flat price-range shown in the app today (§5); these three are available if the team decides to build real task-size-based pricing later.

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
9. **Quote Request** (`QuoteRequest.jsx`) — calls `POST /price` (ML service) for the "expected range" hint, then `PATCH /api/service-requests/{id}/preferred-provider` (flags this provider as preferred, does **not** create a Quote itself anymore — see below) and sends the customer to a new screen
   - **Quotes Received** (`RequestQuotes.jsx`, `/requests/:id/quotes` — not a numbered Figma screen, but this is where the flow actually goes now) — lists real quotes as providers submit them, with **Accept** (creates the `Booking` for real via `POST /api/bookings/accept-quote/{id}`) and **Decline** (`PATCH /api/quotes/{id}/reject` — reopens the request if it was the last pending quote, so other providers can pick it up)
10. **Booking Confirmation** (`BookingConfirmation.jsx`) — real booking summary from `GET /api/bookings/{id}`
11. **Booking Tracking** (`BookingTracking.jsx`) — status stepper driven by `booking.status`, **read-only for the customer** — advancing it is the provider's action now, from `ProviderBookings.jsx` (§9a). A "Refresh status" button re-fetches. "Message provider"/"Report an issue" are still inert placeholders (§9d).
12. **Review Provider** (`ReviewProvider.jsx`) — star picker + comment → `POST /api/bookings/{id}/review`, a real `Review` row

Two more screens exist for bottom-nav completeness with **no Figma design** (kept intentionally simple): `MyRequests.jsx` (`/requests/mine`) and `Profile.jsx` (`/profile`, reads the onboarding localStorage data, plus real login state and a sign-out button).

**The auto-accept shortcut is gone.** Screen 9 used to create a `Quote` and immediately accept it into a `Booking` in one click, with no real provider involved. It now does what the use-case diagram (§4) actually describes: the customer's click just flags interest in one provider, any provider can submit a real `Quote` from their own Requests Feed (§9a), and the customer explicitly accepts or declines it on the new Quotes Received screen. Testing this end to end needs two accounts — see INSTRUCTIONS.md §2d.

**Provider-side screens are now real** — see §9a for what's built (6 screens, freely designed to match the customer style since no Figma exists for this side).

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

The 12 customer screens, the 6 provider screens, real auth enforcement, and the real provider-quote workflow are all built and verified working end to end (§5, §8, §9a). What's left:

- **Frontend**: all 18 screens are built. Nothing is a placeholder anymore.
- **Backend**: no matching/search beyond "who offers this service" (blocked on §9b — no geodata). Auth is enforced and ownership-checked on the endpoints that need it (§8).
- **Seed data**: `01_Database/` (renamed from the stale `01_Database_CSV/`, merged in from `Leshen-Login`) matches the DrawSQL schema but nothing imports these CSVs anywhere — `DevDataSeeder` (§2) seeds its own demo data directly through JPA instead, independent of these files.
- **Deploy**: `render.yaml` + `vercel.json` exist and are documented (INSTRUCTIONS.md §3) but haven't actually been deployed yet — this is untested against real Render/Vercel infrastructure.
- **Register's response is minimal** (`"Registered Successfully"`, a plain string) and login returns a bare JWT with no user info — the frontend always makes a follow-up `GET /api/users/me` call, which works but is an extra round trip that a combined response could avoid.
- No password reset, no email verification — not asked for, not built.

## 8. Auth Decision

**Status (2026-09-19): email/password + JWT, fully enforced.** Merged in from the `Leshen-Login` branch (replacing an earlier Google OAuth2 scaffold — the team decided against Google auth), then wired up to actually gate the app rather than just issue tokens nobody checks.

- `User` entity: `email` (unique), `passwordHash` (Argon2, via `PasswordEncoder`, `@JsonIgnore`'d so it never serializes into an API response), `firstName`, `lastName`, `phoneNumber`, `createdAt`.
- **`POST /auth/register`** (`AuthController` → `AuthService.register`) — takes `email`/`firstName`/`lastName`/`password`/`phoneNumber`/`isProvider`, rejects if the email or phone number is already taken, hashes the password with Argon2, saves the user. If `isProvider` is true, also creates a minimal `ProviderProfile` for them (empty bio/location) — that's what `ProviderOnboarding.jsx` fills in on first login.
- **`POST /auth/login`** (`AuthService.login`) — verifies the password, returns a raw JWT string (not JSON) signed with HMAC-SHA256 via `JwtService`/`NimbusJwtEncoder`. The JWT only carries a `sub` claim (the user's id).
- Needs a `JWT_SECRET` env var (32+ characters) — see INSTRUCTIONS.md.
- **The JWT is validated on every request now.** `SecurityConfig` has a `JwtDecoder` bean (same secret, `NimbusJwtDecoder`) wired into `.oauth2ResourceServer(oauth2 -> oauth2.jwt(...))`, and the filter chain is `.requestMatchers("/auth/**").permitAll().anyRequest().authenticated()`. A request with no token, or an invalid one, gets a 401 before it reaches any controller.
- **Controllers use the real signed-in user**, not a demo stand-in: `UserService.getCurrentUser(Jwt jwt)` reads `jwt.getSubject()` and loads the `User`. `GET /api/users/me` exposes `{id, email, firstName, lastName, isProvider}` — this is what the frontend calls right after login to know who's signed in and which app (customer/provider) to route them into.
- **Ownership is checked, not just identity.** Accepting/rejecting a quote, advancing a booking's status, and setting a preferred provider all verify the caller actually owns that resource (403 via a new `ForbiddenException` otherwise) — see `BookingService.acceptQuote`/`updateStatus`, `QuoteService.reject`.
- Frontend: `AuthContext.jsx` calls `GET /api/users/me` on mount whenever a token exists, populating the real user (not a cached guess) and clearing the session on a 401. `ProtectedRoute` takes a `role` ("customer"/"provider") and every route in `AppRoutes.jsx` is gated — logged-out visits redirect to `/login`, wrong-role visits redirect to that role's own home.
- **Known rough edge:** `/auth/login`'s response is still a bare JWT with no user info, so the frontend always makes a second round trip to `/api/users/me` right after. Fine functionally, just an extra request — worth folding into one response later if it matters.
- **`POST /auth/reset-password` ("forgot password") is a demo-only mechanism, not real security.** There's no email/SMS infrastructure to send an actual reset code or link, so `AuthService.resetPassword()` just checks the caller supplied the account's correct email *and* phone number, then lets them set a new password directly — no proof the caller is actually the account owner beyond knowing two fields that were entered at registration. `ResetPasswordRequest`'s javadoc and `ForgotPassword.jsx`'s file comment both flag this explicitly. If this ever needs to be real, it needs an emailed/texted one-time token with an expiry, not this.
- **Welcome → Login/Register was actually broken until this pass** — `Welcome.jsx`'s "Get started" went straight to `CustomerOnboarding` (client-side-only prefs) with no link to `/login` anywhere, so once auth started being enforced (this section, above) a returning user had no way back in from the landing screen. Fixed: "Get started" → `/register`, plus a "Log in" link. `CustomerHome.jsx` now redirects to `/onboarding` on a first visit (no saved prefs) rather than that being the only entry point — mirrors `ProviderDashboard`'s existing "redirect to onboarding if profile incomplete" pattern.
- **`DevDataSeeder` now also seeds two real login-capable accounts** every startup (independent of the catalog-seeding guard, which no-ops on the already-populated shared Supabase DB): `customer@ubuntulink.demo` and `provider@ubuntulink.demo`, both `Demo1234!` — see INSTRUCTIONS.md §2b/§2d. The provider one has a filled-in profile and a Plumbing offering already attached, so the two-account test flow in INSTRUCTIONS.md no longer requires registering anything by hand.

## 9. Loophole / Gap Analysis (customer side, provider side, AI, infra)

Full-app pass to find what's missing beyond "endpoints don't exist yet" — i.e. things that would break the product even after the obvious CRUD is built. Status updated after the §10 scaffolding pass.

### 9a. Provider side — now built (was the bigger gap)
The Figma file (§5) only ever covered the **customer** journey — there's still no design for the provider side, so these 6 screens (`frontend/src/pages/provider/`) were designed freely, matching the customer screens' style (`bg-brand`/`bg-cream`, `Card`/`Button`/`Screen`). All are real and wired to real endpoints (§2):
- **`ProviderDashboard.jsx`** — open-request and active-booking counts, links into the rest. Redirects to Onboarding on first login if the profile's still empty.
- **`RequestsFeed.jsx`** — every open request (`GET /api/service-requests/open`), with an "Asked for you" badge when the customer set this provider as preferred.
- **`RequestDetail.jsx`** — submits a real `Quote` (`POST /api/quotes`).
- **`ProviderBookings.jsx`** — this is where a booking's status actually advances now (moved off the customer's read-only `BookingTracking.jsx`), and reaching `COMPLETED` fires the mock payment.
- **`ProviderProfileEdit.jsx`** — bio/location/service radius/availability, plus a real add/remove list of service offerings (not just one hardcoded row).
- **`ProviderOnboarding.jsx`** — same fields as ProviderProfileEdit, shown once as a first-time setup step.

What's still genuinely missing (not addressed by this pass, unchanged from before):
- **No provider verification** — no ID/licensing/background-check step anywhere. Out of scope for MVP, but a real launch would need it.
- **`availableToday` is still a manually-set flag, not a real calendar** — no scheduling system behind it.
- **No provider notification path** — still undesigned when a customer sends a quote request or a provider gets booked.

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
- ~~No DTOs~~ — request/response DTOs now exist for the core flow (`dto/request`, `dto/response`) plus the new matching/profile DTOs (§2); entities are still returned directly from some controllers (e.g. `ServiceRequestController`, `BookingController`) rather than mapped to DTOs — works fine in practice since all the relevant `@ManyToOne`/`@OneToOne` associations default to EAGER fetch, but is still a shortcut worth cleaning up post-MVP. **This bit us once already**: returning `User` directly meant `passwordHash` was serializing into every response that nested a customer or provider — found while testing real accounts, fixed with `@JsonIgnore` (§8). Worth double-checking for other sensitive fields if more entities get added to the direct-return list.
- **Still open:** no Bean Validation annotations on entities (only on the new request DTOs); no unique constraints beyond `User.email` and `Service.name`.

### 9h. Infra / process — partially addressed
- ~~No Docker~~ — `backend/Dockerfile` now exists (multi-stage Maven build → JRE runtime) for Render deployment.
- **Still open:** no CI, only the default generated `BackendApplicationTests` smoke test — no real test coverage anywhere.
- `.env` files remain correctly gitignored in both `backend/` and `python/`; `frontend/.gitignore` now also excludes `.env`/`.env.local` — confirmed clean.

## 10. Deployment & MVP-Scope Decisions (2026-09-16)

Decisions made to keep this shippable as a hackathon MVP:

- **Frontend → Vercel.** `frontend/vercel.json` sets the build command (`npm run build`), output dir (`dist`), and a SPA rewrite so React Router's client-side routes don't 404 on refresh. Needs `VITE_API_BASE_URL` (backend Render URL) and `VITE_ML_API_BASE_URL` (ML service Render URL) set as Vercel env vars — see `frontend/.env.example`.
- **Backend + ML service → Render**, both defined in the root `render.yaml` blueprint:
  - `ubuntulink-backend` — Docker runtime, builds from `backend/Dockerfile`. Needs `SUPABASE_DB_URL`, `JWT_SECRET`, `FRONTEND_URL` set in Render's dashboard (marked `sync: false` in the blueprint — secrets aren't committed).
  - `ubuntulink-ml-service` — Python runtime, `uvicorn app.main:app`. Needs `OPEN_ROUTER_API_KEY`, `FRONTEND_URL`.
  - Fixed a real deploy blocker while wiring this up: `application.properties`'s `spring.config.import` for the local `.env` file wasn't marked `optional:`, which would have crashed backend startup on Render (no `.env` file is deployed there — real config comes from Render's env vars instead).
- **Payments are mocked for the MVP, not real.** `Payment` entity + `MockPaymentService` always returns `MOCK_PAID` — there's no Stripe/PayFast/escrow integration, and none is planned before the hackathon deadline. `POST /api/bookings/{id}/payment/mock-charge` is the only payment endpoint. Real payment integration is a deliberate post-MVP cut (§9c).
- **Also deliberately cut from MVP scope** (don't build these unless asked): real geolocation/distance matching (§9b), provider verification/vetting (§9a), disputes/cancellations/messaging (§9d), provider→customer reviews (§9e), `service_task_size` price tiers.

---
*This file is a living reference — update it as the schema, endpoints, or UI flow evolve.*
