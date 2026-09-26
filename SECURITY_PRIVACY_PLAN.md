# Security and privacy plan — POPIA and related South African law

**Status:** plan only. Nothing here is implemented yet unless marked ✅.
**Not legal advice.** This maps the law to our system so the team knows what to build; before a real launch,
have the privacy notice, terms and disclaimer reviewed by someone qualified in South African law.

---

## 1. The laws that apply

| Law | Why it applies to UbuntuLink |
|---|---|
| **POPIA** — Protection of Personal Information Act 4 of 2013 | We collect and store personal information of South Africans: names, contact details, locations, photos, messages. This is the main one. |
| **CPA** — Consumer Protection Act 68 of 2008 | Customers are consumers. Limits what a disclaimer can exclude; terms must be in plain language. |
| **ECTA** — Electronic Communications and Transactions Act 25 of 2002 | Online agreements (terms accepted by ticking a box), and information a website selling services must display. |
| **PAIA** — Promotion of Access to Information Act 2 of 2000 | Private bodies must publish a PAIA manual explaining how people can request their records. |
| **Cybercrimes Act 19 of 2020** | Security incidents may have reporting duties. |

---

## 2. What personal information we hold today

| Data | Where | Sensitivity | Notes |
|---|---|---|---|
| Name, email, phone number | `users` table | Personal | Phone number is also used (weakly) for password reset. |
| Password | `users.password_hash` | Secret | ✅ Hashed with Argon2, never stored in plain text. |
| **SA ID number** | **Not stored** | Special-risk identifier | ✅ Only checked and discarded; the profile stores just `idValidated` (true/false). Logs show a masked version. Good data minimisation — keep it this way. |
| ID photo and selfie | **Not stored** | Would be **special personal information** (biometric) if kept | ✅ Browser previews only, never uploaded. A real face-match must follow §4.4. |
| Home / job location (coordinates) | `service_request`, `provider_profile` | Personal, reveals where people live | Precise to a few metres. |
| Problem descriptions, AI classification | `service_request` | Personal (can describe a home, health, security) | |
| Problem photos | `service_request.photo_data_url` | Personal (inside people's homes) | Stored in the database. |
| Review comments and photos | `review`, `review_photo` | Personal; **public** on profiles | Reviewer shown as first name + last initial. ✅ Photo EXIF/GPS stripped in the browser before upload. |
| Chat messages | `conversation`, `message` | Personal, private | |
| Booking history and tracker notes | `booking`, `booking_status_event` | Personal | |
| Voice notes | **Not stored** | Personal (voice) | Sent to the AI for transcription, text returned, audio discarded. |

### Where it goes

| Destination | What | Location | POPIA issue |
|---|---|---|---|
| **Supabase** (database) | Everything above | **Frankfurt, Germany** (`aws-0-eu-central-1`) | Cross-border transfer (s72). |
| **Render** (backend, ML service) | Passes through, in logs | Render's region (check dashboard) | Cross-border; logs may contain personal data. |
| **Vercel** (website) | No stored personal data | Global CDN | Low. |
| **Google Gemini** (AI) | Problem descriptions, photos, voice audio | Google (outside SA) | Cross-border; third-party processing; must check Google's data-use terms for the API tier we use. |

---

## 3. Gaps against POPIA's eight conditions

| POPIA condition | Where we stand | Gap |
|---|---|---|
| **1. Accountability** (s8) | No named owner. | Appoint and register an **Information Officer** with the Information Regulator. |
| **2. Processing limitation** — lawful basis, minimality, consent (s9–12) | Minimal ID handling ✅. No record of consent. | Record consent and the version of terms accepted; justify each field. |
| **3. Purpose specification** — collect for a defined purpose, keep only as long as needed (s13–14) | No retention rules; data kept forever. | Retention schedule (§4.5). |
| **4. Further processing limitation** (s15) | Data only used for the service ✅. | Don't reuse for marketing or AI training without consent. |
| **5. Information quality** (s16) | Users can edit their profile. | Let users correct all their data. |
| **6. Openness** — tell people what you collect and why (s17–18) | Sign-in disclaimer only. **No privacy notice.** | Privacy notice + PAIA manual (§4.1). |
| **7. Security safeguards** (s19–22) | Good basics (§5 ✅). Several gaps (§5). | Close gaps; breach procedure (§4.7). |
| **8. Data subject participation** — access, correction, deletion (s23–25) | None. | Download my data, delete my account (§4.6). |
| **Special personal information** (s26–33) | Not processed ✅ (no biometrics stored, no ID number stored). | Keep it that way unless §4.4 is done. |
| **Children** (s34–35) | No age check for customers. | Require 18+ at registration. |
| **Direct marketing** (s69) | None sent ✅. | Opt-in only, if ever added. |
| **Cross-border transfer** (s72) | Frankfurt DB, Google AI — not disclosed. | Disclose + legal basis (§4.3). |

---

## 4. The plan

### 4.1 Openness: privacy notice, terms, PAIA manual

- **Privacy notice page** (`/privacy`, linked from sign-in, register and the footer), in plain language, in all
  five app languages: what we collect (§2), why, legal basis, who we share it with (Supabase, Render, Vercel,
  Google — and **the other party in a job**), that data leaves South Africa and why that's allowed, how long we
  keep it, users' rights, how to complain to the **Information Regulator**, and the Information Officer's
  contact details.
- **Terms of use page** (`/terms`) — the full version of the sign-in disclaimer.
- **PAIA manual** published on the site.
- **Files:** new `frontend/src/pages/legal/Privacy.jsx`, `Terms.jsx`; routes in `AppRoutes.jsx`; links in
  `Welcome.jsx` footer and `AuthShell.jsx`.

### 4.2 Consent, recorded — and fixing the disclaimer

Today the disclaimer is a checkbox on **every sign-in**, and nothing is recorded.

- **Move it to registration**, together with the privacy notice: *"I agree to the Terms and have read the
  Privacy Notice"* — required, with links. Record it: new columns on `users`:
  `terms_version`, `terms_accepted_at`, `privacy_version`, `privacy_accepted_at`.
- **Sign-in**: no checkbox. Instead, if the terms version has changed since the user last accepted, show the
  new terms once and record acceptance.
- **Separate, optional consents** (never pre-ticked, never required to use the app), each recorded with a
  timestamp: AI processing of photos and voice (§4.3); marketing (only if ever added).
- **Age:** "I am 18 or older" at registration.
- **Disclaimer wording** (have a lawyer confirm): keep *"UbuntuLink connects customers and providers and does
  not perform the work"*. But under the CPA a platform **cannot** exclude liability for its own gross
  negligence, and unfair or hidden exclusions are void — so limit it to what we don't control (the provider's
  workmanship and conduct), keep it in plain language, and state what we **do** do: verify ID numbers, show
  ratings, keep messages, and offer "Report an issue".
- **Files:** `backend/.../entity/User.java`, `dto/RegisterRequest.java`, `service/AuthService.java`;
  `frontend/src/pages/auth/Register.jsx`, `Login.jsx`.

### 4.3 Cross-border transfers and the AI provider

- **Database:** move to a Supabase project in a region we choose deliberately. Keeping Frankfurt is lawful
  under POPIA s72 because the EU (GDPR) gives comparable protection — but it must be **disclosed** in the
  privacy notice. If a South African region becomes available on our hosting, prefer it.
- **Google Gemini:** personal information leaves SA and reaches a third party.
  - Use an API tier whose terms say **inputs are not used for training** and are not retained beyond
    processing; record that in the privacy notice. Sign Google's data processing terms.
  - **Minimise what's sent**: strip names, phone numbers and emails from descriptions before the AI call
    (simple pattern redaction in `python/app/services/classification_service.py`).
  - **Opt-in for photos and voice**: the text description works without AI photos or voice, so ask first
    ("Let AI read your photo/voice to identify the job?").
  - Or: keep the AI provider swappable (it is — `LLM_BASE_URL`) and move to one hosted in SA/EU with a
    data-processing agreement.
- **Operator agreements (s20–21)**: written agreements with every operator (Supabase, Render, Vercel,
  Google) requiring them to keep the data secure — usually their standard DPA; download and file them.

### 4.4 ID verification and biometrics (if made real)

The current ID photo and selfie are a demo mock and store nothing — that's the safest position. If real
verification is added:

- A selfie used for **face matching is biometric = special personal information** (s26). It needs **explicit
  consent** and should not be kept after the check.
- Use an **accredited identity-verification provider** (e.g. one that checks against Home Affairs) as an
  operator; send them the images, store only the **result** (verified yes/no, date, provider reference) —
  never the ID number or the images.
- Keep the profile photo (if any) separate from the verification selfie, and let the provider choose it.

### 4.5 Retention and deletion schedule

| Data | Keep for | Then |
|---|---|---|
| Account data | While the account is active | Delete on account deletion (§4.6) |
| Service requests that never became bookings | 12 months | Delete, including photos |
| Bookings, quotes, amounts | 5 years (tax/accounting — confirm with an accountant) | Anonymise (remove names, descriptions, photos; keep amount, service, month) |
| Chat messages | 12 months after the job's last activity | Delete |
| Tracker notes | With the booking | Anonymise with the booking |
| Reviews and review photos | While the provider's profile exists; reviewer can delete theirs | Reviewer shown as "Former customer" after account deletion |
| Precise coordinates on requests | 90 days after the job | Round to ~1 km (suburb level) |
| Server logs | 30 days | Delete |
| Voice audio | Never stored ✅ | — |

**Build:** a nightly job (Spring `@Scheduled`) in a new `service/RetentionService.java` that applies this
table, with a test per rule.

### 4.6 Users' rights: see, correct, download, delete

- **Profile → "Your data"** section:
  - **Download my data** — `GET /api/users/me/export`: a JSON file of everything we hold about them.
  - **Correct** — every field editable (profile, requests while open).
  - **Delete my account** — `DELETE /api/users/me`, with confirmation: deletes the user, their messages and
    open requests; anonymises bookings and reviews per §4.5; signs them out.
- **Written requests** (email to the Information Officer) answered within a reasonable time — log each one.
- **Files:** new `controller/PrivacyController.java`, `service/PrivacyService.java`;
  `frontend/src/pages/customer/Profile.jsx`, `pages/provider/ProviderProfileEdit.jsx`.

### 4.7 Security incidents (s22)

- **Breach procedure** (`SECURITY_INCIDENT.md`): who decides, how to contain (rotate DB password, JWT secret,
  API keys), and **notify the Information Regulator and affected users as soon as reasonably possible**, with
  what happened, what data, and what they should do.
- **Detect:** alert on repeated failed logins and on unusual data exports.
- **Rehearse once** before launch.

---

## 5. Technical security — current state and fixes

### ✅ Already in place

- Passwords hashed with **Argon2**; login tokens (JWT) signed, expire after 1 hour.
- Every API route requires login except sign-in/register and public images.
- **Ownership checks**: requests, quotes, bookings, tracker, reviews and chats are only readable/changeable by
  the people involved (403 otherwise).
- Row locking for booking, reviewing and status changes (no double-booking or lost updates).
- Uploaded images checked by their actual bytes (JPEG/PNG/WebP only, 2 MB), served with `nosniff`; EXIF/GPS
  stripped client-side.
- Secrets in environment variables; git history scanned clean.
- SA ID number never stored; masked in logs.
- CORS limited to our own site's origins.

### To fix, in priority order

| # | Issue | Risk | Fix | Where |
|---|---|---|---|---|
| 1 | **Database password was exposed** in a committed log on a teammate's branch | Full data access | **Rotate the Supabase password now**; update Render and `.env` files; delete that branch | Supabase, Render |
| 2 | **Password reset needs only email + phone number** | Account takeover | Emailed, single-use, 15-minute reset link | `AuthService.resetPassword` |
| 3 | **ML service has no authentication** | Anyone can call the AI with our key (cost) and send it data | Shared secret header between backend and ML service; frontend calls go via the backend | `python/app/main.py`, `SecurityConfig` |
| 4 | **No rate limiting** on login, register, AI and messages | Password guessing, spam, AI cost | Per-IP and per-user limits (e.g. Bucket4j) | Backend filter |
| 5 | **Token kept in `localStorage`** | Stolen by any cross-site scripting bug | `HttpOnly`, `Secure`, `SameSite` cookie + refresh token | `api/auth.js`, `AuthController` |
| 6 | **Security headers** only Spring defaults | Clickjacking, script injection | Content-Security-Policy, HSTS, Referrer-Policy, Permissions-Policy (camera/microphone only where used) | `SecurityConfig`, `frontend/vercel.json` |
| 7 | **Photos stored in the database**, base64 | Large backups containing personal photos | Private object storage (Supabase Storage) with short-lived signed URLs | `ServiceRequest`, `ReviewPhoto` |
| 8 | **Debug endpoint** `/api/debug/validate-id` still deployed | Minor information leak | Remove | `IdDebugController.java` |
| 9 | **Encryption at rest** relies on the host only | Exposure through backups | Confirm Supabase disk encryption; encrypt phone numbers and chat bodies at field level | Entities |
| 10 | **Logs** may include request bodies and emails | Personal data in logs | Log IDs, not content; 30-day log retention | Backend/ML logging config |
| 11 | **Public profile/review photo URLs** guessable by number | Enumeration of reviews' photos | Random (UUID) photo IDs | `ReviewPhoto`, controllers |
| 12 | **Dependency and code scanning** | Known vulnerabilities | GitHub Dependabot + CodeQL in CI | `.github/workflows` |

---

## 6. Order of work

| When | Items |
|---|---|
| **Now (before any real users)** | §5 #1 rotate DB password · #8 remove debug endpoint · §4.1 privacy notice + terms pages · §4.2 consent at registration (move disclaimer, record version, 18+) · disclose cross-border transfers |
| **Before public launch** | §5 #2 password reset · #3 ML auth · #4 rate limits · #6 headers · §4.3 AI minimisation and opt-in, operator DPAs · §4.6 download/delete my data · §4.7 breach procedure · register Information Officer · PAIA manual · lawyer review of terms and disclaimer |
| **Within 3 months of launch** | §5 #5 cookie auth · #7 object storage · #9 field encryption · #10 log hygiene · #11 random IDs · #12 scanning · §4.5 retention job |
| **Ongoing** | Review this plan when adding any new data type (especially real ID verification — §4.4); annual review of the privacy notice; rehearse the breach procedure yearly |

---

## 7. What to say if asked today

- *"We don't store ID numbers or ID photos — only whether the ID passed validation."*
- *"Passwords are hashed with Argon2; every record is only visible to the people involved in that job."*
- *"Customers' AI inputs go to Google for processing, and our database is in the EU; for launch we'll disclose
  that in a POPIA privacy notice and record consent at registration."*
- *"We have a written plan to meet POPIA's eight conditions — retention, access and deletion, breach
  notification and an Information Officer."*
