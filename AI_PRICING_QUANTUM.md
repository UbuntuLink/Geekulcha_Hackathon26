# How UbuntuLink's AI, pricing and quantum optimisation work

A plain explanation of three questions judges and new team members ask:

1. **What AI model do we use, and how predictable is it?**
2. **How are prices worked out — now and long term?**
3. **Why use quantum technology for optimisation, and where exactly is it used?**

For the technical detail of every AI feature (endpoints, prompts, fallbacks) see [ML.md](ML.md).
For a short, presenter-level version — including the Freemium revenue model (text free, photos and voice
Premium) — see [PRESENTER_BRIEF_AI_QUANTUM.md](PRESENTER_BRIEF_AI_QUANTUM.md).

---

## 1. The AI model

### What it is

| | |
|---|---|
| **Model** | Google **Gemini 2.5 Flash** (default) |
| **How we call it** | Through an OpenAI-compatible API, from our own Python service (FastAPI). The app never talks to the model directly, so the API key never reaches a phone or browser. |
| **Swappable** | The provider and model are two settings (`LLM_BASE_URL`, `LLM_MODEL`). Moving to another model (e.g. Claude, GPT, or a self-hosted model) is a configuration change, not a rewrite. |
| **Training** | We don't train or fine-tune a model. We use a general model with **instructions written for this job** (the prompt files in `python/prompts/`) and give it **our live service catalogue** on every call. |

### What it does in the app

| Feature | What the AI does | What it does **not** do |
|---|---|---|
| **Voice input** | Writes down what was said, in the language spoken. | Translate or rewrite. |
| **Job classification** | Reads "my geyser burst" (or a photo) and picks the matching service from **our catalogue**, plus urgency and a clean job description. | Invent services — it may only answer with a name that exists in the database, or "other". |
| **Description refinement** | Folds the customer's extra details into the job description, and flags details that are off-topic. | Change the job itself. |

Everything else — matching, sorting, prices, quotes, bookings, ratings, the quantum recommendation — is
**ordinary, deterministic code**, not AI.

### How deterministic is it?

"Deterministic" means the same input always gives the same output. We push the AI as close to that as a
language model allows, and make every decision that *matters* deterministic:

| Measure | Effect |
|---|---|
| **Temperature 0** on every call | The model always picks its most likely answer instead of sampling, so the same message gives the same classification in practice. |
| **Thinking turned off** (`reasoning_effort: none`) | Shorter, more consistent answers, and no hidden reasoning using up the answer budget. |
| **Fixed output format** (JSON with set fields) and **small output limits** (200–600 tokens) | The answer is always the same shape and gets validated before use. |
| **Constrained to our catalogue** | The model can only name a service that exists, so its answer maps directly to a database row. |
| **Deterministic safety net** (`frontend/src/lib/matching.js`) | Spelling-tolerant keyword matching, no AI. It checks the AI's answer *and* the customer's own words, so a slightly different AI wording still lands on the same service — and search still works if the AI is down. |

**Honest caveat:** no hosted language model guarantees bit-for-bit identical output, even at temperature 0 —
the provider can update the model, and their servers can vary slightly. That's why the AI only ever
*suggests* (a category, a cleaner description, a transcript the customer can edit), and a person or
deterministic code makes every decision that costs money.

### How we prevent hallucination

A "hallucination" is an AI stating something false with confidence. Our design keeps the AI away from
anything where a made-up answer could do harm, and checks everything it produces.

| Safeguard | How it works | Where |
|---|---|---|
| **Closed list of answers** | The live service catalogue is sent with every request, and the AI must answer with one of those exact names or "other". | `python/app/services/classification_service.py` (`_system_prompt`) |
| **Independent, non-AI check** | The keyword matcher maps the AI's answer *and* the customer's own words to a real database row. An answer that matches nothing goes down the "service not supported" path — never a made-up service. | `frontend/src/lib/matching.js` |
| **No AI-generated facts on screen** | Prices, provider names, ratings, distances and availability come only from the database. The AI never sets or displays a price. | whole app |
| **Human in the loop** | The customer reviews the AI's job summary before the request is created, and can add details; voice transcripts land in an editable text box. | `ReviewRequest.jsx`, `DescribeProblem.jsx` |
| **Instructions against inventing** | Prompts say: preserve every detail the customer gave; don't invent information; don't change the meaning; transcribe exactly, don't summarise or answer. | `python/prompts/*.txt` |
| **Admitting uncertainty** | The AI returns a confidence level and, when unsure, a clarifying question instead of a guess. | classification prompt, fields `confidence`, `clarifying_question` |
| **Off-topic detection** | When a customer adds details, the AI flags whether they're relevant; irrelevant additions are rejected rather than blended in. | refine prompt, field `is_relevant` |
| **Prompt-injection resistance** | The prompt tells the model to treat anything in the customer's message — including "ignore your instructions" — as text to classify, not as instructions. | classification prompt |
| **Fixed format, validated** | Answers must be JSON with set fields; anything that doesn't parse is rejected and the customer is asked to try again. | `llm_client.py`, services |
| **Consistency** | Temperature 0 and thinking turned off: the model gives its single most likely answer every time. | `python/app/core/llm_client.py` |

**Residual risk:** the AI can still misread a genuinely unclear message. The worst outcome is a wrong
*suggestion* that the customer can see and correct — never a wrong price, a non-existent provider, or an action
taken on its own.

### What happens if the AI is unavailable

The app keeps working: search falls back to keyword matching, descriptions are kept word for word, voice
input falls back to typing. Nobody is blocked from getting a provider.

---

## 2. Pricing

### How prices work today — no AI involved

| Price the customer sees | Where it comes from | Deterministic? |
|---|---|---|
| **A provider's price range** (e.g. "R425–R3650" on their card and profile) | The provider's **own listed minimum and maximum** for that service, read from the database. | **Yes** — a straight database read. |
| **Expected price** on the quote request screen | The same listed range, for the **service this request is for**. | **Yes.** |
| **The quote** | The amount the provider types when they quote. | **Yes** — it's a number a person entered. |
| **What's charged** | The accepted quote's amount (payment is mocked in this build). | **Yes.** |

The demo providers' prices come from a fixed **price guide per service** (`DevDataSeeder.java`), spread
slightly per provider by a formula based on their id — so two plumbers don't have identical prices, but
each provider's prices are the same on every restart.

There's also an **AI price estimate** endpoint (`POST /price`) which gives a rand range grounded in reference
rates written into its prompt. It isn't shown in the app: showing providers' real prices is more honest than
an AI guess.

### Long term: prices from real completed jobs

The database already has a table for this (`ActualJobPrice`) — it's defined but not yet filled in. The plan:

1. **Record** the final price of every completed booking, with its service, area and date.
2. **Calculate** market rates per service and area from those records with plain statistics — median,
   typical range (25th–75th percentile), number of jobs. Same data in, same numbers out: fully
   deterministic and explainable ("based on 42 plumbing jobs in Pretoria in the last 90 days").
3. **Show** that alongside the provider's own range, so customers can see whether a quote is fair, and new
   providers can price themselves sensibly.
4. **Where there isn't enough data yet** (a new service or area), fall back to the provider's listed range,
   and only then — clearly labelled as a rough estimate — to the AI endpoint.

This makes pricing **more accurate as the platform grows**, **independent of any AI provider**, and **free to
run**: it's a database query, not a model call.

### What the AI costs to run

AI is only called when a customer describes a problem, adds details, or speaks. Roughly, per call
(estimates from our prompt sizes and output limits):

| Call | Sent to the model | Returned (at most) |
|---|---|---|
| Classify a problem | ~1,500–2,000 tokens (instructions + catalogue + message; more with a photo) | 400 tokens |
| Refine a description | ~300 tokens | 200 tokens |
| Transcribe a voice note | the audio (up to 60 s) + ~200 tokens | 600 tokens |

**Monthly cost ≈ (number of calls) × (tokens per call) × (the provider's price per token).** Check
[Google's Gemini pricing page](https://ai.google.dev/gemini-api/docs/pricing) for current rates — Flash models are among the
cheapest available, and the free tier covers a demo. Ways we keep cost down long term:

- **Only customers' actions trigger AI** — browsing, matching, quoting, booking and chat never do.
- **Small, capped answers** (200–600 tokens) and thinking switched off.
- **Swap models by configuration** if a cheaper or local model becomes the better choice.
- **Next steps:** cache classifications of identical messages, and move common, simple cases ("plumber",
  "electrician") to the keyword matcher without calling the AI at all.

---

## 3. Quantum optimisation

### The problem it solves

Choosing the best provider for a job is a **trade-off between things that pull against each other**:

- **Distance** — closer arrives sooner.
- **Price** — cheaper is better for the customer.
- **Rating** — better-reviewed is more likely to do good work.

The nearest provider is rarely also the cheapest and the best rated. That's an **optimisation problem**:
find the choice with the best overall balance.

### Where and when it's used

| | |
|---|---|
| **Where** | The **Matching providers** page, after a customer submits a request. |
| **What the customer sees** | One provider marked **⚛ Quantum recommended**, and a **"Quantum"** sort that puts them first. Every other provider is still listed. |
| **When it runs** | Once, when that page opens, **after** the normal list has already appeared — it never slows the page down. |
| **Where it runs** | The Python ML service, using IBM's **Qiskit** on a **quantum simulator** (a normal computer calculating exactly what an ideal quantum computer would do). No quantum hardware or account is needed. |
| **Not used for** | Home-page search, prices, quotes, bookings or ratings. |
| **If it fails** | The page says the recommendation is unavailable; everything else works. |

### How it works, briefly

1. **Score** each available provider: distance, price and rating are each scaled from 0 (best) to 1 (worst)
   and combined. The weights shift with urgency: an urgent job cares more about distance.
2. **Turn it into a quantum problem:** one qubit per provider ("1" = choose them), with the rule
   "choose exactly one".
3. **Run QAOA** (Quantum Approximate Optimization Algorithm): a quantum circuit and a classical optimiser
   take turns — the circuit measures how good the current answer is, the optimiser adjusts it — until it
   settles on the lowest-cost choice.
4. **Measure 2,048 times** and take the valid answer seen most often.

A full walkthrough with a worked example is in [ML.md §5](ML.md).

### Is it deterministic?

**Yes.** The starting point of the optimisation and the measurement sampler both use a **fixed seed (42)**, the
classical optimiser (COBYLA) is deterministic, and the simulator is exact. **The same providers and the same
job always give the same recommendation.** Ties are broken by the lower score, so there's no randomness left.

### Why quantum? (the honest answer)

**For one job, you don't need a quantum computer.** Picking the best of a list is a simple sort, and QAOA
arrives at the same answer. We use it here because:

1. **It's the right shape for where the platform is going.** The real optimisation problem is **assigning
   many jobs to many providers at once**, with limits: each provider can only take so many jobs a day, jobs
   have time windows, travel between jobs matters. That's a *combinatorial* problem — the number of
   possible assignments grows explosively with every job and provider added — and it's exactly the kind of
   problem (a QUBO) that quantum optimisation is designed for.
2. **The pipeline is already built for it.** The request format already accepts a **list of jobs**; the
   scoring, the QUBO conversion and the QAOA solver work the same way at larger sizes. Scaling up means
   adding the capacity rules and more qubits — not redesigning.
3. **It moves to real hardware without changing the algorithm.** Swapping the simulator for IBM Quantum
   hardware through Qiskit Runtime is a configuration change.
4. **It's safe to have in production today:** deterministic, isolated in its own service, off the critical
   path, and with a fallback.

### Current limits

| Limit | Detail |
|---|---|
| One job at a time | Batch assignment is the next step (above). |
| Simulator | Fast for a normal match list; simulation slows down past ~20 providers because each extra qubit doubles the work. Pre-filtering to the top ~10 candidates, or real hardware, removes that limit. |
| Urgency is fixed at the default (0.5) | The weighting supports urgency, but the matching page doesn't pass the urgency the AI already detects yet — a small change. |

---

## Summary

| Question | Short answer |
|---|---|
| Which AI? | Gemini 2.5 Flash via our own service; swappable by configuration. |
| What does AI decide? | Nothing that costs money. It suggests a service category, a clean description and transcripts; people and deterministic code decide. |
| Is it deterministic? | As close as a hosted model allows (temperature 0, fixed format, catalogue-constrained), with a deterministic keyword matcher as the safety net. |
| How are prices set? | Providers' own listed ranges and their quotes — database values, fully deterministic, no AI. |
| Long-term pricing? | Market rates calculated from real completed jobs (`ActualJobPrice`), with plain statistics — deterministic, explainable, free to run. |
| What does AI cost? | Only customer actions trigger it; small capped calls on a low-cost model; cost = calls × tokens × provider price. |
| Why quantum? | Picking one provider is a demonstration; the real target is assigning many jobs to many providers with limits, a combinatorial problem quantum optimisation is built for. |
| Where is quantum used? | Only the Matching providers page, for the ⚛ recommendation. Deterministic (fixed seed), off the critical path, with a fallback. |
