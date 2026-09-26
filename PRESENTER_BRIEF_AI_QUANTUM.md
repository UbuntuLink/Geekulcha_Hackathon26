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

#### "How do you stop the AI making things up (hallucinating)?"

**Short answer to say:**
> "We don't let the AI make anything up that matters. It can only pick from services that really exist on our
> platform, it never sets a price or books anything, and the customer checks its work before anything is sent."

**If they want more — five layers:**

1. **It can only choose from a fixed list.** The AI is given our live list of services and must answer with
   one of those exact names, or "other". It can't invent a service like "Geyser Wizard". Even if it did,
   our own (non-AI) matching step would find no such service and treat it as "not supported" — never a dead
   end.
2. **It never produces facts we show as true.** Prices, provider names, ratings, distances and availability
   all come from our database, not the AI. The AI only suggests a category and tidies up the customer's own
   words.
3. **The customer checks its work.** Before a request is sent, the customer sees the AI's summary and can
   add or change details. Voice transcripts appear in the text box, where they can be corrected.
4. **Strict instructions and a fixed answer format.** The AI is told not to invent details, not to change the
   meaning, and to keep every specific detail the customer gave. It must reply in a fixed format, which we
   check before using. When it's unsure, it says so ("low confidence") and suggests a question instead of
   guessing. It's also told to ignore instructions hidden in a customer's message.
5. **Consistency settings.** It's set to always give its single most likely answer (temperature 0), so it
   doesn't "get creative", and the same message gets the same result every time.

**If they push** ("So it can never be wrong?"):
> "It can still misread an unclear message — any AI can. But the worst case is a suggestion the customer can
> see and correct, never a wrong price, a fake provider or a booking made on its own."


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
#### "Why quantum? Couldn't you just sort the list?"

**Short answer to say:**
> "For one job, yes — a normal sort would find the same provider, and we're upfront about that. Quantum is
> for where we're going: matching *many* jobs to *many* providers at the same time."

**If they want more — explain it like this:**

- **One job is easy.** Picking the best provider for one customer is like choosing the best-value item on a
  menu: look at each option once, pick the best. Any computer does that instantly.
- **Many jobs at once is hard.** Now imagine planning a whole morning for a city: 10 customers need help and
  there are 10 providers. Each provider can only do so many jobs, some jobs are urgent, and nobody should be
  sent across town when someone closer is free. You can't just give everyone their personal best — two
  customers might want the same plumber.
- **The number of options explodes.** With 10 jobs and 10 providers there are about **3.6 million** ways to
  pair them up. With 20 and 20, it's about **2.4 billion billion**. Every job you add multiplies the options.
  This kind of puzzle is called a **combinatorial optimisation** problem — delivery routes, flight crews and
  school timetables are the same type.
- **That's what quantum optimisation is designed for.** Quantum algorithms like the one we use (QAOA) tackle
  these puzzles in a fundamentally different way from checking options one by one, and this is one of the
  most promising early real-world uses of quantum computers.
- **We've built the foundation.** Today it recommends one provider for one job. The system already accepts a
  *list* of jobs, and the same steps (score the options, turn them into a quantum problem, solve) carry
  over. Scaling up means adding the rules — provider capacity, time windows — not starting again.

**If they push harder** ("Is quantum actually faster for this today?"):
> "Not yet — today's quantum computers are still small, and for problems this size classical methods are
> fine. We're building on the approach so the platform is ready as the hardware matures, and because the
> scheduling problem at city scale is exactly where quantum is expected to help."

#### "Is it real quantum?"

**Short answer to say:**
> "It's a real quantum algorithm, running on a quantum simulator. Moving it to a real IBM quantum computer is
> a settings change, not a rewrite."

**If they want more:**

- **The algorithm is genuinely quantum.** It's QAOA, built with IBM's Qiskit — the same tools researchers
  use on IBM's quantum computers.
- **A simulator is a normal computer imitating a perfect quantum computer.** It calculates exactly what an
  ideal quantum computer would do. That's standard practice for building and testing quantum software.
- **Why a simulator for now?** It's free, instant, gives the same answer every time, and needs no special
  account — ideal for fast, consistent results. It works well for the size of problem we solve today (up to roughly 20
  providers at once).
- **Why real hardware later?** Simulating a quantum computer gets much harder with every extra qubit (each
  one doubles the work), so large city-wide scheduling would need real quantum hardware. Because we use
  Qiskit, we can send the same algorithm to IBM Quantum's cloud machines by changing configuration.

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

Voice input is included free whenever a user turns on any accessibility setting.

---

## 5. Thirty-second version

> "UbuntuLink lets anyone describe a problem in their own words — any language, any spelling — and our AI finds
> the right service. A quantum optimisation algorithm then recommends the provider with the best balance of
> distance, price and rating. Text is free for everyone because it costs us almost nothing — it's cheap and
> cacheable. Photo diagnosis and voice input are Premium, because they're the features that cost us more to
> run — so the AI pays for itself."
