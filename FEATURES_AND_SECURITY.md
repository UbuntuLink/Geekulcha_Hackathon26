# UbuntuLink — Core Features and Security

UbuntuLink is a local services marketplace for South Africa. A customer describes a problem in
their own words, AI works out what kind of job it is and what it should cost, and the platform
matches them with nearby, rated providers to get quotes and book the work.

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind (Vercel) |
| Backend API | Java 23, Spring Boot 4.1 (Render, Docker) |
| AI / ML service | Python, FastAPI; Gemini via an OpenAI-compatible client (Render) |
| Quantum matching | Qiskit QAOA on a local simulator, inside the ML service |
| Database | PostgreSQL on Supabase |

---

## Core features

### For customers

- **Describe the problem in plain language.** "My kitchen sink is leaking" is enough. The AI
  classifies it into a service category and gives a fair price estimate.
- **Or say it out loud.** Tap the microphone, speak for up to a minute in any South African
  language, and the voice note is transcribed into the description box in the language spoken.
  It works in every modern browser.
- **Service not supported yet?** The request is recorded rather than lost, so demand for new
  categories can be measured.
- **Provider matching.** Validated providers offering the service, with distance from the
  customer's location, rating, price range and whether they're available today. Sort by
  recommended, lowest price, top rated or available today.
- **Quantum recommendation.** A QAOA optimiser weighs distance, price and rating (distance counts
  for more on urgent jobs) and picks one provider, marked **⚛ Quantum recommended**. If the
  optimiser is unavailable, the page falls back to the normal list without it.
- **Compare, quote and book.** Compare providers, request quotes, accept one with a date and time
  to create a booking, and follow the booking's status.
- **Pay and review.** Mock checkout (no real money in this build), then rate and review the
  provider.
- **Onboarding preferences.** Location and whether price or rating matters more shape the default
  sort.
- **Multilingual.** The landing page is available in English, isiZulu, Sesotho, Setswana and
  Afrikaans, and the app screens are translated too.

### For providers

- **Become a provider** from a customer account, with **South African ID validation**: 13 digits,
  a real date of birth, a valid citizenship digit and the Luhn check digit.
- **Provider profile.** Services offered, prices per service, and location.
- **Requests feed.** Open requests in the provider's categories, with the option to quote.
- **Bookings dashboard.** Accepted jobs, advanced through their statuses as the work happens.

---

## Security

### What's in place

| Area | How it's handled |
|---|---|
| **Passwords** | Hashed with **Argon2** (Spring Security's recommended settings). Plain-text passwords are never stored. |
| **Authentication** | Stateless **JWT** (HS256), signed with a server-side secret of 32+ characters and valid for **1 hour**. |
| **Every API route is protected** | Everything except `/auth/**` and the API docs requires a valid token. The signature and expiry are checked on every request. |
| **Ownership checks** | Customers can only act on their own service requests, quotes and bookings, and providers can only update their own bookings. Anything else gets **403 Forbidden**. |
| **Input validation** | Request bodies are validated with Bean Validation (`@Valid`) and rejected with a clear 400. |
| **Consistent errors** | A global exception handler maps errors to proper status codes (400/403/404/409) without leaking stack traces. |
| **CORS** | The backend and ML service only accept browser calls from the app's own frontend origins. |
| **Secrets** | Database URL, JWT secret and AI keys come from environment variables and are never committed. A full scan of every commit on every branch found no leaked credentials. |
| **ID numbers are not logged in full** | Only the birth-date part of a South African ID number is logged; the rest is masked. |
| **Database access** | All queries go through JPA/Hibernate with bound parameters, which blocks SQL injection. |
| **Payments** | No card data is collected: checkout is a mock, so there is no payment data to protect or leak. |

### Known gaps (hackathon scope)

These are deliberate MVP shortcuts or items found in review. None is exploitable without an
account, but they would need fixing before real users arrive.

| Gap | Risk | Fix |
|---|---|---|
| **Password reset needs only email + phone number** | Anyone who knows both can take over the account. | Emailed, single-use, expiring reset link. |
| **Any logged-in user can review any booking** | Fake or duplicate reviews. | Only the booking's customer, only once, only after the job is complete. |
| **Any logged-in user can read any booking by ID** (`GET /api/bookings/{id}`) | Exposes other people's booking details. | Same ownership check the other booking routes already use. |
| **The ML service has no authentication** | Anyone can call it directly and use up the AI quota. | Shared secret between backend and ML service, plus rate limiting. |
| **The JWT is kept in `localStorage`** | A cross-site scripting bug could steal it. | `HttpOnly` cookie. |
| **No login rate limiting** | Password guessing isn't slowed down. | Throttle or lock out after repeated failures. |
| **No refresh tokens** | Users are logged out after an hour. | Refresh-token flow. |
| **A debug endpoint (`/api/debug/validate-id`) is still deployed** | Low: it needs a login and only returns true/false. | Remove it before release. |
| **ID checks are offline only** | A number can pass the check without belonging to the person. | Verify against a real identity service (e.g. Home Affairs via an approved provider). |
| **Payments are mocked** | — | A PCI-compliant provider (e.g. PayFast, Yoco) before real money flows. |
