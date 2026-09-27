# UbuntuLink — Technical Q&A

Answers to the technical questions judges and reviewers ask, grouped by topic. Each answer starts with the
short version to say out loud; detail follows for follow-up questions. Deeper references:
[AI_PRICING_QUANTUM.md](AI_PRICING_QUANTUM.md) · [SECURITY_PRIVACY_PLAN.md](SECURITY_PRIVACY_PLAN.md) ·
[ACCESSIBILITY.md](ACCESSIBILITY.md) · [PAYMENTS_PLAN.md](PAYMENTS_PLAN.md) · [ML.md](ML.md)

**Contents:** [1. Architecture](#1-architecture) · [2. Security](#2-security) ·
[3. Safety and trust](#3-safety-and-trust) · [4. Privacy and POPIA](#4-privacy-and-popia) ·
[5. Payments](#5-payments) · [6. AI](#6-ai) · [7. Quantum](#7-quantum) ·
[8. Reliability and scale](#8-reliability-and-scale) · [9. Accessibility](#9-accessibility) ·
[10. Hard questions](#10-hard-questions)

---

## 1. Architecture

**Q: What's the stack?**
Three services and a database:

| Part | Technology | Hosted on |
|---|---|---|
| Web app | React 18 + Vite + Tailwind | Vercel |
| Main API | Java 23, Spring Boot 4 (Spring Security, JPA/Hibernate) | Render |
| AI and optimisation service | Python, FastAPI | Render |
| Database | PostgreSQL | Supabase (Frankfurt, EU) |
| AI model | Google Gemini 2.5 Flash (OpenAI-compatible API) | Google |
| Quantum | IBM Qiskit, QAOA on a statevector simulator | inside the Python service |

**Q: Why separate the AI into its own service?**
Isolation. The AI and quantum code have different dependencies (Python, Qiskit), different failure modes and
different costs. If that service is slow or down, the core app — accounts, requests, quotes, bookings,
payments, chat — keeps working.

**Q: Who talks to whom?**
The browser talks to the Java API for everything that touches data, and to the Python service for AI
(classification, transcription). The Java API calls the Python service for the quantum recommendation. Only
the Java API writes to the database. The AI key lives only on the server.

**Q: How is it deployed?**
Push to `master` → GitHub Actions builds all three services (Java package, frontend build, Python compile) →
Render deploys the API and AI service; Vercel deploys the web app. Configuration and secrets are environment
variables on each platform.

---

## 2. Security

**Q: How are passwords stored?**
Hashed with **Argon2** (Spring Security's recommended settings) — a slow, memory-hard algorithm designed to
resist brute force. Plain-text passwords are never stored or logged.

**Q: How does login work?**
Email and password → the server issues a **signed JWT** (HS256, 32+ character secret) that **expires after one
hour**. Every API request carries it; the server checks the signature and expiry on each call. The API is
stateless — no server sessions.

**Q: Which routes are public?**
Only sign-in/registration, API documentation and image files that are shown in `<img>` tags (review photos).
Everything else requires a valid token.

**Q: Can one user see or change another user's data?**
No. Every request, quote, booking, work-tracker update, review, chat and payment checks **who you are and your
role in that record** on the server, and returns **403 Forbidden** otherwise. Examples: only the booking's
customer can pay or review it; only the provider can move the work forward; only the two people in a
conversation can read it; a provider can't message a customer they have no job with.

**Q: What about SQL injection?**
All database access goes through JPA/Hibernate with **bound parameters** — user input is never concatenated
into SQL.

**Q: Cross-site scripting (XSS)?**
React escapes all rendered text by default; we never inject raw HTML from users. Uploaded images are checked by
their **actual bytes** (only JPEG, PNG, WebP; max 2 MB) — an SVG or HTML file renamed to `.jpg` is rejected —
and served with `X-Content-Type-Options: nosniff`.

**Q: CORS?**
The API and AI service only accept browser calls from our own web app's origins (configured list plus our
Vercel domains).

**Q: How do you handle input validation?**
Request bodies are validated on the server (Bean Validation: lengths, ranges, required fields). Errors return a
clear 400 message via a global handler — never a stack trace.

**Q: Race conditions — two people acting at the same time?**
Critical actions **lock the database row** first: accepting a quote (no double-booking), submitting a review
(no duplicate), changing a job's status, and every wallet payment (both wallets locked in a fixed order, so no
deadlocks and no double-spend).

**Q: Where are secrets kept?**
In environment variables on Render, Vercel and GitHub — never in the code. The git history has been scanned for
leaked keys.

**Q: What would you strengthen before a public launch?**
Emailed one-time password-reset links (today reset uses email + phone number), a shared secret between the API
and AI service, rate limiting on login/AI/messages, moving the login token from browser storage to an
`HttpOnly` cookie, and security headers (CSP, HSTS). All are in [SECURITY_PRIVACY_PLAN.md](SECURITY_PRIVACY_PLAN.md).

---

## 3. Safety and trust

**Q: How do you know a provider is who they say they are?**
Becoming a provider requires a **South African ID number**, a **photo of the ID document** and a **selfie**. The
ID number is validated — 13 digits, a real date of birth, a valid citizenship digit and the **Luhn check digit**
— and verified providers carry a ✓ badge. We keep only the result ("verified"), not the ID number, ID photo or
selfie. The next step is checking against Home Affairs through an accredited verification partner.

**Q: Can ratings be faked?**
Only the customer who booked a job can review it, only after it's **completed and paid**, and only **once**. The
rating shown is recalculated from the actual reviews. Reviewers appear as first name and last initial.

**Q: What happens during a job?**
A shared **work tracker**: booking requested → accepted → on the way → work in progress → work done → completed.
Both sides see each step with a timestamp and optional notes. Only the provider moves the work forward, never
backwards. Either side can cancel early; the customer can't cancel once the provider is on the way, and nobody
can cancel once the work is done.

**Q: How do customers and providers communicate safely?**
**In-app chat**, so phone numbers and emails don't need to be shared. Only the two people in a conversation can
read it.

**Q: What if something goes wrong?**
**Report an issue** is on every quote, booking and provider profile and returns a reference number. The customer
doesn't have to pay for work they're unhappy with — they report instead.

**Q: Do photos leak where people live?**
No. Phone photos contain hidden GPS data; the app **removes it** in the browser before uploading, and resizes
the image.

**Q: What's the platform's responsibility?**
Users accept a disclaimer that UbuntuLink connects them with independent providers and doesn't perform the work.
We back that with the safeguards above: verification, genuine ratings, the tracker, chat and issue reporting.

---

## 4. Privacy and POPIA

**Q: What personal information do you store?**
Name, email, phone, password hash, job locations, request descriptions and photos, reviews, chat messages,
bookings and wallet history. **Not stored:** ID numbers, ID photos, selfies, voice recordings, card numbers.

**Q: Does data leave South Africa?**
Yes — the database is in the EU (Frankfurt) and AI requests go to Google. POPIA section 72 allows transfers to
places with comparable protection (the EU's GDPR) or with consent/agreement; we disclose both in the privacy
notice and use suppliers' data-processing terms.

**Q: How do you comply with POPIA?**
We map to its eight conditions: minimal data (no ID numbers or biometrics kept), security safeguards (above),
purpose limitation (data only used to deliver the service), and a plan for the rest — privacy notice and
consent at sign-up, retention schedule, download/delete-my-data, breach notification, and a registered
Information Officer. See [SECURITY_PRIVACY_PLAN.md](SECURITY_PRIVACY_PLAN.md).

**Q: How long do you keep data?**
Planned schedule: unused requests and chats 12 months; booking records 5 years (financial records), then
anonymised; precise locations rounded after 90 days; logs 30 days. Voice notes are never stored.

---

## 5. Payments

**Q: How does payment work?**
Customers pay **after** the provider marks the work done. They tap **Confirm and pay**: the amount comes from their
**in-app balance**, and anything the balance doesn't cover is charged to their card. The provider's balance goes
up at the same moment, minus a 10% platform fee. **Auto-pay** can pay automatically when work is marked done.

**Q: How do you make sure money can't appear, disappear or be spent twice?**
Every balance change is a permanent **ledger entry**; balances are the sum of entries. A payment writes the
customer's debit and the provider's credit **in one transaction** with both wallets locked, so the customer's
debit always equals the provider's credit plus the fee, balances can't go negative, and a job can't be paid
twice. The amount always comes from the accepted quote — never from the browser.

**Q: Do you store card details?**
No. The browser sends only the card brand and last four digits; the number, expiry and CVC never reach our
server. The payment flow is built behind a gateway interface so a licensed South African gateway (PayFast, Yoco,
Paystack or Peach) handles the card itself, including card security (PCI DSS).

**Q: How do providers get paid?**
Earnings land in their balance immediately; they withdraw to their bank account from the dashboard.

---

## 6. AI

**Q: What does the AI do?**
Three things: **identifies the service** from a customer's own words or photo ("my geyser burst" → Plumbing),
**transcribes voice** in any language (isiZulu, Sesotho, Afrikaans, mixed), and **tidies the job description**
with extra details the customer adds.

**Q: Which model, and why?**
Google **Gemini 2.5 Flash** — fast, low-cost, multilingual and multimodal (text, image, audio). We call it
through an OpenAI-compatible API, so switching provider or model is a configuration change.

**Q: Did you train your own model?**
No. We use a general model with task-specific instructions and our **live service catalogue** on every call.
No fine-tuning, and customer data isn't used for training.

**Q: How do you stop hallucination?**
Five layers: (1) the model may only answer with a service that **exists in our catalogue** (or "other"), and a
separate **non-AI matcher** confirms it maps to a real database row; (2) the AI never produces facts shown as
true — prices, providers, ratings and distances come from the database; (3) the **customer reviews** the AI's
summary and can edit voice transcripts; (4) instructions forbid inventing details, it returns a **confidence
level** and asks a clarifying question when unsure, and it ignores instructions hidden in a user's message;
(5) **temperature 0** so it always gives its single most likely answer.

**Q: Is it deterministic?**
As close as a hosted model allows: temperature 0, thinking turned off, a fixed JSON format that's validated,
capped output length. Same message, same result in practice. Everything that costs money — prices, bookings,
payments — is ordinary deterministic code, not AI.

**Q: What about prompt injection ("ignore your instructions and…")?**
The prompt treats everything the customer writes as text to classify, never as instructions. Even a
successful injection can only change a *suggested category*, which must still match our catalogue and is
confirmed by the customer.

**Q: What if the AI is down or wrong?**
Search falls back to a spelling-tolerant **keyword matcher** (no AI); descriptions are kept word for word;
voice falls back to typing. A wrong suggestion is visible and correctable — never a wrong charge or booking.

**Q: What does the AI cost?**
Only customer actions call it — browsing, matching, quoting, booking and chat never do. Calls are small and
capped (200–600 output tokens). **Cost = calls × tokens × price per token**; Flash is among the cheapest models.
Identical text requests can be cached because outputs are deterministic, and common requests ("plumber") skip
the AI entirely.

**Q: How does the AI make money?**
Freemium: **text is free for everyone** (cheap per request and cacheable); **photo diagnosis and voice input are
Premium** (more data per request, can't be cached). Voice stays free for users with accessibility settings on.

**Q: What customer data goes to the AI provider?**
Only what the customer provides to describe the job — text, and the photo or voice note if they use them.
Never their ID number or account details. Voice audio isn't stored by us.

---

## 7. Quantum

**Q: Where do you use quantum technology?**
On the **Matching providers** page: one provider is marked **⚛ Quantum recommended** — the best balance of
distance, price and rating. Nothing else uses it.

**Q: What algorithm?**
**QAOA** (Quantum Approximate Optimization Algorithm) built with IBM's **Qiskit**:
1. Each provider gets a cost from distance, price and rating (each scaled 0–1). Weights shift with urgency:
   an urgent job weighs distance more (35%→55%).
2. One **qubit per provider**; the rule "choose exactly one" becomes a penalty (strength 5), giving a **QUBO**,
   converted to an **Ising Hamiltonian**.
3. A QAOA circuit and a classical optimiser (**COBYLA**, up to 100 iterations) take turns lowering the energy.
4. The final circuit is measured **2,048 times**; the most frequent valid answer wins.

**Q: Is it real quantum?**
It's a real quantum algorithm running on a **quantum simulator** — a normal computer calculating exactly what an
ideal quantum computer would. That's standard for developing quantum software. Moving to IBM's quantum hardware
is a configuration change in Qiskit.

**Q: Why quantum? Couldn't you just sort?**
For one job, yes — a sort gives the same answer, and we say so. The real target is **assigning many jobs to many
providers at once** with limits (capacity per day, time windows, travel between jobs). The number of possible
assignments explodes — about 3.6 million for 10 jobs and 10 providers, 2.4 billion billion for 20 — which is the
kind of combinatorial problem quantum optimisation is designed for. Our pipeline already accepts a list of jobs.

**Q: Is quantum faster today?**
Not yet — today's quantum computers are small, and at this size classical methods are fine. We're building on the
approach so the platform is ready as hardware matures.

**Q: Is the recommendation consistent?**
Yes. Fixed seeds (42) for the optimiser's starting point and the sampler, a deterministic optimiser and an exact
simulator: **same providers and job → same recommendation**. Ties go to the lower cost.

**Q: What are the limits?**
Simulation cost doubles with each qubit, so it's practical up to about **20 providers** at once; beyond that we'd
pre-filter to the top ~10 or use hardware. It runs **after** the provider list has loaded, so it never slows the
page, and if it fails the page simply shows no badge.

---

## 8. Reliability and scale

**Q: What happens when a service fails?**
Each dependency degrades gracefully: AI down → keyword search; quantum down → no badge; the core app is
independent of both. The AI client retries transient errors (3 retries with back-off).

**Q: How fast is it?**
Provider matching returns in about 0.4 s (one database query instead of per-provider lookups). Startup does no
unnecessary database work.

**Q: How does it scale?**
The API is stateless (JWT), so it scales horizontally behind a load balancer. The database uses Supabase's
transaction pooler. Next steps at scale: caching the service catalogue, a job queue for AI calls, and
real-time updates via WebSockets instead of polling.

**Q: Is it real-time?**
Near real-time: the tracker refreshes every 15 s, chat every 4 s, balances and quotes every 15–20 s, only while
the page is visible. WebSockets are the next step.

**Q: How is it tested?**
Unit tests for the core rules (bookings, reviews, payments/ledger, ID validation, geo-distance), AI tests with
the model mocked, CI builds all three services on every push, and end-to-end runs of full flows against the real
database.

---

## 9. Accessibility

**Q: What have you done for users with disabilities?**
Five languages; **voice input** on the main text fields (describe a problem, quotes, tracker notes, bios, chat); **read aloud**; **Display settings** — colour modes for
**red-blind, green-blind and blue–yellow blind** users plus high contrast, larger text and reduced motion;
status symbols as well as colours; screen-reader announcements for new messages and tracker updates; larger
tap targets. Available to customers and providers, including before sign-in. See [ACCESSIBILITY.md](ACCESSIBILITY.md).

---

## 10. Hard questions

**Q: What's your biggest technical risk?**
Dependence on third parties — the AI provider and hosting. Mitigated by design: the AI is optional to the core
flow, the model is swappable by configuration, and every AI and quantum feature has a non-AI fallback.

**Q: What would break first under heavy load?**
AI calls (cost and rate limits) and polling traffic. Answers: caching and the keyword fast-path for AI; rate
limits; WebSockets instead of polling.

**Q: What's not production-grade yet?**
Password reset by email link, rate limiting, service-to-service authentication, cookie-based sessions, security
headers, the privacy notice and consent records, and Home Affairs ID verification. All are planned with owners
and order in [SECURITY_PRIVACY_PLAN.md](SECURITY_PRIVACY_PLAN.md).

**Q: If you had one more week?**
Batch quantum assignment across many jobs; the POPIA items above; WebSocket updates; pass the AI-detected
urgency into the quantum weighting.
