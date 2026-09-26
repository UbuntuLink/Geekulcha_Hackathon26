# UbuntuLink — AI, ML and Quantum

UbuntuLink uses AI at every step where a customer would otherwise have to know the right words,
the right trade or the right price. This document explains each feature, how they fit together,
and what happens when one of them is unavailable.

| Feature | What it does for the customer | Endpoint |
|---|---|---|
| [1. Voice input](#1-voice-input--speech-to-text) | Speak the problem in any South African language instead of typing | `POST /transcribe` |
| [2. Job classification](#2-job-classification) | Plain words, or a photo, become the right service category | `POST /classify` |
| [3. Description refinement](#3-description-refinement) | Extra details are merged into one clear job description | `POST /classify/refine-description` |
| [4. Price estimation](#4-price-estimation) | A fair rand price range for a job (endpoint available; not currently shown in the app) | `POST /price` |
| [5. Quantum provider matching](#5-quantum-provider-matching) | One recommended provider, balancing distance, price and rating | `POST /quantum/optimise` |

---

## Architecture

```
                         ┌──────────────────────────────────────────────┐
  React frontend ───────►│  ML service  (Python · FastAPI · port 8000)  │
  (voice, classify,      │                                              │
   refine, price)        │   /transcribe  /classify  /price             │──► Gemini 2.5 Flash
                         │        │           │         │               │    (any OpenAI-compatible
                         │        └───── llm_client.py ─┘               │     model provider)
                         │                                              │
  Spring Boot backend ──►│   /quantum/optimise ── Qiskit QAOA simulator │   (runs locally,
  (quantum match)        │                                              │    no external call)
                         └──────────────────────────────────────────────┘
```

**Design principles:**

- **The ML service is stateless.** It never writes to the database: data goes in, an answer comes
  out. The Spring backend and PostgreSQL remain the only source of truth.
- **One model client, any provider.** Every model call goes through `app/core/llm_client.py`, which
  speaks the OpenAI chat-completions protocol. The default is Google's **Gemini 2.5 Flash**, and
  switching to OpenRouter, Groq or another provider is a `.env` change, not a code change.
- **Prompts are files, not code.** Each feature's instructions live in `python/prompts/`, so they
  can be tuned without touching Python.
- **AI is never a single point of failure.** Every feature has a fallback, so the app still works
  when the model is down or out of quota (see [Resilience](#resilience-when-ai-is-unavailable)).

---

## The customer journey

```
 🎤 Speak or ⌨ type the problem  (+ optional 📷 photo)
        │  1. Voice input — transcribed in the language spoken
        ▼
 2. Classification — category, urgency, advice, cleaned-up job description
        │  + fuzzy catalog matching, so the category lands on a real service
        ▼
 Review screen — customer adds details
        │  3. Refinement — details merged into the description (or rejected if unrelated)
        ▼
 Matching providers
        │  5. Quantum match — "⚛ Quantum recommended" provider
        ▼
 Request a quote
        │  provider's listed price range shown (read from the database)
        ▼
 Booking
```

---

## 1. Voice input — speech-to-text

**Where:** the microphone button on "Describe your problem".

**How it works:**

1. The browser records the customer (up to 60 seconds) and encodes it as **16 kHz mono WAV**
   (`frontend/src/lib/wavRecorder.js`). WAV, because the model's audio input only accepts WAV or
   MP3, and browsers record neither natively. It works in every modern browser, phones included.
2. The recording is sent to `POST /transcribe`, and Gemini transcribes it.
3. The transcript is added to the description box, **in the language spoken**: English, isiZulu,
   isiXhosa, Sesotho, Setswana, Sepedi, Afrikaans, or a mix in one sentence. It isn't translated,
   because the classifier understands all of them.

**Safeguards:** recordings over 4 MB or with invalid audio are rejected before any model call.
Blocked microphones, missing microphones and silence each get a clear message.

---

## 2. Job classification

**Where:** "Describe your problem", and the AI search box on the home page.

**Input:** the customer's text, an optional photo, and the **live service catalog** from the
database.

**Output:**

| Field | Example |
|---|---|
| `category` | `Plumbing` |
| `confidence` | `high` |
| `urgency` | `high` |
| `job_description` | "Repair a leaking pipe under the kitchen sink." |
| `advice` | "Turn off the water at the mains until the plumber arrives." |
| `clarifying_question` | Asked when the message is too vague to classify |
| `sort_preference` | `cheapest` / `best_rated` / `soonest` — from searches like "cheap plumber near me" |

**What makes it robust:**

- **Handles real-world writing.** Misspellings ("plumer", "electrishan"), SMS shorthand ("pls snd
  sum1 2 fix my geyser"), all caps and mixed languages are all read correctly.
- **Sees photos.** A picture of a leak or a burnt socket is analysed together with the text, or on
  its own.
- **Answers in the database's own words.** The live catalog is sent with every request, so the
  model can only answer with categories that exist as rows. It can't invent "mechanic" when the
  catalog says "Automotive Repair".
- **A second, non-AI safety net.** `frontend/src/lib/matching.js` matches the AI's answer *and*
  the customer's raw words to the catalog using normalisation, synonyms and edit distance
  (Levenshtein). A small wording mismatch never leaves a customer with no providers.
- **Unsupported jobs aren't lost.** If nothing matches, the request is saved as an unsupported
  service request with the AI's advice, so demand for new categories can be measured.

---

## 3. Description refinement

**Where:** the review screen, after the customer adds extra details.

The model merges the original AI description and the new details into one clear job description.
It also checks that the details are **relevant**: "the leak is under the sink, near the geyser" is
merged, while "what's the weather tomorrow?" is rejected with a request to add details about the
problem.

---

## 4. Price estimation

**Where:** the `POST /price` endpoint of the ML service. It is not currently shown in the app: the
quote request screen shows the provider's own listed price for the service instead, which is a
plain read from the database, not an AI estimate.

Returns a **price range in rand**, never a single number, because it's an estimate, not a quote:

```json
{
  "category": "plumbing",
  "estimated_min_zar": 650,
  "estimated_max_zar": 1400,
  "based_on": "verified reference rate",
  "reasoning": "Urgent leak repair, so the upper end of the hourly rate plus call-out fee.",
  "price_time": "2026"
}
```

**Grounded, not guessed.** The prompt carries 2026 South African reference rates (for example
plumbing R450–900/hour plus a R450–950 call-out fee), and the model must use them rather than
general knowledge. Urgency words ("asap", "emergency") push the estimate up, and minor jobs sit
lower. `based_on` says honestly whether a verified rate or a rougher general estimate was used.

---

## 5. Quantum provider matching

**Where:** the matching providers page, as the **⚛ Quantum recommended** badge and the "Quantum"
sort option.

Choosing the best provider is a trade-off between three things that pull against each other:
**distance** (arrives sooner), **price** (cheaper for the customer) and **rating** (better work).
The closest provider is rarely also the cheapest and the best rated. UbuntuLink solves this with
**QAOA** (Quantum Approximate Optimization Algorithm), a hybrid quantum–classical algorithm, built
with IBM's **Qiskit**.

### Flow

```
Frontend ── GET /api/quantum-match ──► Spring Boot backend
                                        │ 1. builds the normal match list
                                        │ 2. fills in missing distance and price data
                                        ▼
                 POST /quantum/optimise ──► ML service: scores providers, runs QAOA
                                        ▼
Frontend ◄── the chosen provider ────── backend
```

When filling gaps, a missing distance counts as 10 km further than the furthest known provider
and a missing price counts as the highest known price. Incomplete profiles never get an unfair
advantage.

### The algorithm

**Step 1 — Score every provider (lower is better).** Unavailable providers are removed. Distance
and price are scaled so the best is 0 and the worst is 1, and rating is reversed so the highest
rating is 0. The three are weighted by the job's urgency:

| Urgency | Distance | Price | Rating |
|---|---|---|---|
| Not urgent (0) | 35% | 35% | 30% |
| Default (0.5) | 45% | 27.5% | 27.5% |
| Very urgent (1) | 55% | 20% | 25% |

**Step 2 — Encode it as a quantum problem.**

- **One qubit per provider.** A qubit measuring 1 means "choose this provider".
- **Objective and constraint:** minimise total cost, with exactly one provider chosen.
- **QUBO:** the constraint becomes a penalty term (strength 5), giving a Quadratic Unconstrained
  Binary Optimisation problem.
- **Ising Hamiltonian:** the QUBO is converted into an Ising Hamiltonian, whose lowest-energy
  state is the best provider.

**Step 3 — Run QAOA.**

- A one-layer QAOA circuit is evaluated on Qiskit's statevector simulator (the quantum step).
- The **COBYLA** optimiser tunes the circuit's angles to lower the energy, for up to 100
  iterations (the classical step).
- The optimised circuit is then sampled **2,048 times**.

**Step 4 — Read the answer.** Only bitstrings that choose exactly one provider are valid. The
valid bitstring measured most often wins; ties go to the lower-cost provider. With only one
available provider there's nothing to optimise, and it is returned as `"algorithm": "DIRECT"`.

### Worked example

Default urgency (0.5), three available providers:

| Provider | Rating | Distance | Price | Combined cost |
|---|---|---|---|---|
| **11** | 4.9 | 2 km | R300 | **0.00** |
| 22 | 3.0 | 15 km | R450 | 0.62 |
| 44 | 3.5 | 30 km | R600 | 0.93 |

```json
POST /quantum/optimise
{
  "jobs": [{ "jobId": 1, "category": "plumbing", "urgency": 0.5 }],
  "providers": [
    { "providerId": 11, "rating": 4.9, "distanceKm": 2,  "estimatedPrice": 300, "available": true },
    { "providerId": 22, "rating": 3.0, "distanceKm": 15, "estimatedPrice": 450, "available": true },
    { "providerId": 44, "rating": 3.5, "distanceKm": 30, "estimatedPrice": 600, "available": true }
  ]
}
```

```json
{ "assignments": [{ "jobId": 1, "providerId": 11 }], "algorithm": "QAOA" }
```

For a live demo, the ML service's terminal prints every step: provider costs, the QUBO, the
Hamiltonian, the optimised angles, the measurement counts and the chosen provider.

---

## Resilience: when AI is unavailable

| If this is down… | …the app does this instead |
|---|---|
| Voice input | The customer types; the error message says so. |
| Classification (AI search) | Local fuzzy matching (`matching.js`) still finds the service from the customer's own words. |
| Classification (describe problem) | A clear "try again" message; nothing the customer typed is lost. |
| Refinement | The customer's extra details are kept word for word and appended to the description. |
| Quantum matching | Every provider is still listed; the page says the recommendation is unavailable. |

Model errors are translated into one readable message ("rate limit reached", "API key rejected",
"no model called …") and returned as **503**, so a temporary outage is never confused with a bug.

---

## Security and cost controls

- **Keys stay on the server.** The model API key lives only in the ML service's environment,
  never in the frontend or the repo.
- **Bounded requests.** Audio is capped at 4 MB, recordings at 60 seconds, and every call has a
  fixed token budget, so no single request can run up a large bill.
- **Structured outputs.** Classification, refinement and pricing must answer in strict JSON, which
  is validated before use.
- **Tests never spend quota.** Every model call in `python/tests/` is mocked, and `check_llm.py`
  only makes a real call when asked (`--call`).

---

## Running it

```powershell
cd python
py -3.13 -m pip install -r requirements.txt
py -3.13 -m uvicorn app.main:app --reload --port 8000
```

- **Model key:** put `LLM_API_KEY=<Gemini key>` in `python/.env`. A free key is available at
  https://aistudio.google.com/apikey. Run `py -3.13 check_llm.py` to confirm the key and model.
- **Try any endpoint:** open http://localhost:8000/docs.
- **Quantum:** needs no key or IBM account, since it runs on a local simulator. It does need a
  64-bit Python, because Qiskit has no 32-bit Windows build.
- **Deployed:** the ML service runs on Render; the backend reaches it through `ML_SERVICE_URL`.

---

## Limitations and next steps

| Area | Today | Next step |
|---|---|---|
| **Pricing data** | Verified reference rates for plumbing and electrical only; other categories get a wider, clearly labelled estimate. | Reference rates for every category, then learn from completed jobs' actual prices (the `ActualJobPrice` table already exists). |
| **Quantum hardware** | Runs on a statevector simulator: exactly what an ideal quantum computer would compute. | Run on IBM Quantum hardware through Qiskit Runtime; the algorithm doesn't change. |
| **Quantum scale** | One job at a time, which is simple classically too; QAOA here demonstrates the approach. Simulation memory doubles with each provider, so it slows past ~20. | **Batch assignment:** many jobs to many providers at once, with daily capacity limits. That's where quantum optimisation pays off, and the request format already accepts a list of `jobs`. |
| **Urgency in quantum matching** | Fixed at the default 0.5; the page doesn't send it yet. | Pass through the urgency the classifier already returns. |
| **ML service access** | The endpoints need no authentication, so anyone could call them directly. | A shared secret between backend and ML service, plus rate limiting. |
| **Personalisation** | The same answer for everyone. | Learn from each customer's past bookings and reviews. |
