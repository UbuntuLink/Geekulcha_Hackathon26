# Presenter brief: AI, quantum and how the AI pays for itself

The short version for whoever is on stage. Each section has a **one-liner**, **talking points**, and
**likely questions** with answers. Detail lives in [AI_PRICING_QUANTUM.md](AI_PRICING_QUANTUM.md) and
[ML.md](ML.md).

---

## 1. Our AI in one breath

> **"You describe the problem in your own words — or speak it, or snap a photo — and UbuntuLink works out
> which service you need and finds the right local provider."**

**Talking points**
- Customers don't need to know what a trade is called: "my geyser is leaking" → **Plumbing**.
- Works in **any language** and with **spelling mistakes** — built for how South Africans actually type and talk.
- The AI **suggests; people decide.** It never sets prices, never books anything, never picks who gets paid.
- It only answers with services that **actually exist** on our platform, so it can't send someone down a dead end.
- If the AI is ever down, the app **still works** — search falls back to keyword matching.

**Likely questions**
- *Which AI?* — Google Gemini 2.5 Flash, through our own server. We can switch provider with a setting.
- *Is it consistent?* — Yes: it's set to always give its most likely answer, in a fixed format, limited to our
  catalogue. Same message, same result.
- *Does it see personal data?* — Only what the customer types or uploads to describe the job, and never their
  ID number. (See SECURITY_PRIVACY_PLAN.md.)

---

## 2. Quantum in one breath

> **"When you're shown providers, a quantum optimisation algorithm weighs distance, price and rating together
> and recommends the best balance — marked with ⚛."**

**Talking points**
- Choosing a provider is a **trade-off**: the closest is rarely also the cheapest and the best rated.
- We turn that trade-off into an optimisation problem and solve it with **QAOA**, a quantum algorithm, using
  IBM's **Qiskit**.
- It runs on a **quantum simulator** today and can move to **real IBM quantum hardware** without changing the
  algorithm.
- It's **deterministic** — same providers, same recommendation — and it never slows the page: the list shows
  first, the ⚛ badge arrives a moment later.

**Where it's used:** only on the **Matching providers** page, for the ⚛ recommendation. Nothing else.

**Likely questions**
- *Why quantum? Couldn't you just sort?* — **For one job, yes** — and we say so. The real target is
  **assigning many jobs to many providers at once**, with limits like how many jobs a provider can take per day.
  The number of possible combinations explodes as the platform grows, and that's exactly the kind of problem
  quantum optimisation is built for. Our pipeline already accepts a list of jobs; this is the foundation.
- *Is it real quantum?* — It's a real quantum algorithm running on a simulator, which calculates exactly what
  an ideal quantum computer would. Swapping to hardware is a configuration change.

---

## 3. How the AI generates revenue — Freemium

> **"Typing is free for everyone. Photos and voice are Premium."**

| | **Free** — everyone | **Premium** |
|---|---|---|
| Describe the problem in text, any language | ✓ | ✓ |
| AI identifies the service from text | ✓ | ✓ |
| AI tidies up the job description | ✓ | ✓ |
| Matching, quantum ⚛ recommendation, quotes, booking, tracker, chat, ratings | ✓ | ✓ |
| **Upload a photo** of the problem for AI diagnosis | — | ✓ |
| **Voice input** — speak instead of type | — | ✓ |

### Why this split makes sense — the honest economics

Every AI call has a small cost, based on how much we send the model and how much it writes back.

- **Text is cheap, and often free to us:**
  - A typed message is small, so each text call costs **a fraction of a cent**.
  - Our AI is **deterministic** — the same message always gives the same answer — so **identical messages can be
    answered from a cache** without calling the AI again.
  - Common requests ("plumber", "electrician") are matched by our **keyword matcher, with no AI call at all**.
  - So the text path costs us very little, and gets cheaper the more people use it. We can afford to give it
    away — and it's the path that gets every customer to a provider.
- **Photos and voice cost more:**
  - A photo or a minute of audio is **many times more data** for the model than a sentence.
  - Each one is unique, so it **can't be cached** or answered by the keyword matcher.
  - These are the features whose cost grows with use — so they're the ones worth charging for.

**The pitch:** nobody is locked out of getting help — the full service works on text. Premium is for
**convenience** (speak instead of type) and **better diagnosis** (show the problem), and it pays for the AI that
powers it.

> ⚠️ **Don't say** "text is free because it's deterministic". Deterministic means *consistent*, not *free*.
> Say: **"text is cheap per request, and because it's deterministic we can cache it — so it costs us very
> little."**

### Other revenue this sits alongside (optional to mention)

- A small **booking fee or commission** on completed jobs.
- **Featured placement** or a verified badge for providers.

---

## 4. Accessibility and Premium — how to answer if asked

Voice input also helps people who **can't easily type** (low literacy, visual or motor impairment). Locking it
behind a paywall could look like charging disabled users for access. Recommended answer:

> *"Voice input stays free for anyone who turns on accessibility settings — Premium is about convenience,
> not access."*

(Build note: give voice free when any Display accessibility option is on, or offer free Premium on request.
Confirm this is the policy before presenting it.)

---

## 5. Implementation status (for the team, not the stage)

| | Status |
|---|---|
| Text AI, voice input, photo diagnosis | ✅ Built and working for everyone today |
| Quantum ⚛ recommendation | ✅ Built |
| **Premium tier and feature locking** | ❌ **Not built yet** — no plans, no payments, no "is premium" flag. Needs: a `plan` on the user, a check on the photo and voice endpoints, an "Upgrade" prompt in the app, and real payments (currently mocked). |
| Text caching | ❌ Not built yet — identical messages still call the AI each time. |

**If you present the Freemium model, present it as the business model, not as a live feature** — unless it's
built before the demo.

---

## 6. Thirty-second version

> "UbuntuLink lets anyone describe a problem in their own words — any language, any spelling — and our AI finds
> the right service. A quantum optimisation algorithm then recommends the provider with the best balance of
> distance, price and rating. Text is free for everyone because it costs us almost nothing — it's cheap and
> cacheable. Photo diagnosis and voice input are Premium, because they're the features that cost us more to
> run — so the AI pays for itself."
