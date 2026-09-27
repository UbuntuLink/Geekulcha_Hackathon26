# Implementation plan: in-app balances and payment on completion

**Goal:** customers pay **after** the provider says the job is done, from an **in-app balance**. The amount moves
from the customer's balance to the provider's balance, and both can see their balance and history in the app.
It's all numbers in our database — no real money moves — but it behaves like a real wallet.

**Status:** plan only. Internal document for the team.

---

## 1. How it works for people

```
Provider marks the work done ──►  "Waiting for your payment" (customer notified)
                                        │
            ┌───────────────────────────┴────────────────────────────┐
            ▼                                                         ▼
 Customer taps "Confirm and pay R650"                    Auto-pay is on and the balance
 (from their balance)                                    covers it → paid automatically
            │                                                         │
            └──────────────────────────┬──────────────────────────────┘
                                       ▼
          Customer balance − R650   →   Provider balance + R585   (+ R65 platform fee)
                                       │
                        Job COMPLETED · receipt · customer can now rate
```

### Customer
- **Balance** shown on Profile and in the header of the work tracker: e.g. **R1 350.00**.
- **Add funds** — pick R200 / R500 / R1 000 or type an amount, "pay" with a card form → balance goes up
  instantly.
- When a provider marks the work done, the tracker shows **"Confirm and pay R650"**:
  - enough balance → one tap, done;
  - not enough → "You need R150 more" with **Add funds and pay** in one step.
- **Auto-pay** (optional, off by default): *"Pay automatically from my balance when a provider completes a job."*
  If the balance is short, it falls back to asking.
- Not happy with the work? **Report an issue** instead of paying — the job stays open.
- **History**: every top-up and payment, with date, job and reference number.

### Provider
- **Balance** on the dashboard: **Available R4 210.00**, plus *Awaiting payment R650* (jobs marked done, not yet
  paid).
- Each payment appears **as soon as the customer pays** — the dashboard and Bookings update on their own
  (they already refresh every 20 seconds).
- **History**: each earning shows the job, the amount paid, the platform fee and what they received.
- **Withdraw** to a bank account → balance goes down, entry "Withdrawn to bank" appears.

### Both sides see the same payment
The tracker shows the same line to both: *"Paid R650 on 27 Sep, 14:05 · ref UL-PAY-8F3K2Q"*, and the job moves to
**Completed** for both.

---

## 2. Changes to the job steps

A new step between *Work in progress* and *Completed*:

| Step | Who moves it | Now |
|---|---|---|
| Booking requested → Job accepted → On the way → Work in progress | Provider | unchanged |
| **Work done — awaiting payment** (`AWAITING_PAYMENT`) | Provider ("Mark work as done") | **new** |
| Completed | **Only a payment** — the customer paying, or auto-pay | was: provider |

- The provider can no longer mark a job *Completed* directly; they mark it *done*, and payment completes it.
- Cancelling isn't possible once work is marked done (a dispute goes through Report an issue).
- Reviews stay as they are: allowed once the job is *Completed*, i.e. paid.

---

## 3. Design

### 3.1 Balances are built from a ledger

Every change to a balance is a **ledger entry**; a balance is the sum of that user's entries. Nothing is ever
edited or deleted, so the history always explains the balance.

| Entry type | Customer | Provider | Platform |
|---|---|---|---|
| `TOP_UP` | + amount | | |
| `JOB_PAYMENT` | − job amount | | |
| `JOB_EARNING` | | + amount after fee | |
| `PLATFORM_FEE` | | | + fee |
| `WITHDRAWAL` | | − amount | |
| `REFUND` (if a paid job is reversed later) | + amount | − amount | − fee |

Each payment writes its entries **together, in one database transaction**, so money can't appear or vanish —
the customer's debit always equals the provider's earning plus the fee.

**Tables:**
- `wallet` — one per user: `user_id` (unique), `balance` (cached total, updated in the same transaction),
  `auto_pay` (yes/no).
- `wallet_entry` — `wallet_id`, `type`, `amount` (+/−), `booking_id` (if any), `reference`, `created_at`.
- `payment` (existing table, reused) — one per booking: `amount`, `platform_fee`, `provider_amount`,
  `reference`, `paid_at`, `method` (BALANCE / AUTO_PAY).

Amounts are stored in **cents** (whole numbers) to avoid rounding errors.

### 3.2 Rules the server enforces

- **Amount always comes from the accepted quote**, never from the browser.
- **Only the booking's customer** can pay it, and only when it's *awaiting payment*.
- **Balance can't go below zero.** Paying locks both wallets (the same row-locking approach already used for
  bookings and reviews), checks the balance, then writes the entries.
- **Pay once:** a booking has at most one payment; a second attempt (double tap, auto-pay racing a manual
  payment) is refused.
- **Withdrawals** can't exceed the available balance.
- **Top-ups** go through a card form that is turned into a token in the browser (last four digits and brand
  only are sent); test card `4000 0000 0000 0002` is declined, any other valid card number succeeds. Card numbers
  are never stored.
- **Platform fee:** one setting, e.g. 10%; stored on each payment so later changes don't rewrite history.

### 3.3 Auto-pay

When a provider marks work done:
- if the customer has **auto-pay on** and **enough balance** → pay immediately, the customer gets a message
  *"R650 paid to Thabo for your plumbing job"*;
- otherwise → the job waits for the customer, who gets a message *"Thabo marked the job done — confirm and pay
  R650"*.

Messages go through the existing chat system (as rating notices already do), so they show in **Messages** with
an unread badge.

### 3.4 API

| Method | Path | Who | What |
|---|---|---|---|
| `GET` | `/api/wallet` | Signed-in user | Balance, auto-pay setting, awaiting-payment total (providers). |
| `GET` | `/api/wallet/entries` | Signed-in user | History, newest first. |
| `POST` | `/api/wallet/top-up` | Signed-in user | `{ amount, cardToken, cardLast4, cardBrand }` |
| `PATCH` | `/api/wallet/auto-pay` | Customer | `{ enabled }` |
| `POST` | `/api/wallet/withdraw` | Provider | `{ amount }` |
| `POST` | `/api/bookings/{id}/pay` | Booking's customer | Pays from balance; moves the job to *Completed*. |
| `PATCH` | `/api/bookings/{id}/status` | Provider | Now allows `AWAITING_PAYMENT`, no longer `COMPLETED`. |
| — | `POST /payment/mock-charge` | — | **Removed** (today it lets anyone charge any booking any amount). |

### 3.5 Starting balances

- New customers start at **R0** and top up.
- Demo accounts: the data seeder gives `customer@ubuntulink.demo` a **R2 000** starting top-up (a real ledger
  entry), so the flow works immediately in a presentation.

---

## 4. Work breakdown

### Phase 1 — Backend (about 1½ days)

1. `Wallet`, `WalletEntry` entities and repositories; `Payment` gains fee/reference fields.
2. `BookingStatus`: add `AWAITING_PAYMENT`; update `BookingService.updateStatus` rules (provider can reach
   *awaiting payment*, not *completed*; no cancelling after work is done); keep the request status in step.
3. `WalletService`: `topUp`, `pay(booking)` (locks, checks, writes entries, completes the job, notifies),
   `withdraw`, `autoPayIfEnabled(booking)`, `balance`, `history`.
4. `WalletController` + `POST /api/bookings/{id}/pay`; delete `mock-charge` and `MockPaymentService`.
5. Data seeder: R2 000 for the demo customer.
6. **Tests:** pay with enough / too little balance; wrong customer (403); pay twice (refused); provider can't
   mark completed directly; auto-pay on/off/short balance; withdrawal limits; ledger always balances
   (customer debit = provider credit + fee); top-up decline card.

### Phase 2 — Customer screens (about 1 day)

1. **Balance card** on Profile: balance, **Add funds**, auto-pay switch, **History**.
2. **Add funds** screen: amount chips, card form (validation, brand detection, tokenised in the browser),
   success/decline states.
3. **Work tracker**: new step *Work done — awaiting payment*; **Confirm and pay R650** (or *Add funds and pay*
   when short); after paying, the shared *Paid R650 … ref …* line; then **Rate** as today.
4. **My requests**: *Awaiting your payment* status with a symbol.

### Phase 3 — Provider screens (half a day)

1. **Balance card** on the dashboard: available, awaiting payment, **Withdraw**, **History** (each earning with
   amount, fee and net).
2. **Tracker and Bookings**: the provider's final action becomes **Mark work as done**; the job shows
   *Awaiting payment* until the customer pays, then *Paid*.

### Phase 4 — Polish (half a day)

Translations for all new text, screen-reader announcements when a payment arrives or completes, colour-blind
symbols on payment states, and update `FEATURES_AND_SECURITY.md` and the demo script.

**Total: about 3½ days** for one developer.

---

## 5. How to test it end to end (two browsers side by side)

1. **Customer** (`customer@ubuntulink.demo`): Profile shows **R2 000.00**.
2. Request a job; **provider** quotes R650; customer accepts.
3. Provider moves the job through the steps and taps **Mark work as done**.
4. Customer's tracker (within ~15 s) shows **Confirm and pay R650**; a message arrives in **Messages**.
5. Customer pays → customer balance **R1 350.00**; job *Completed*; receipt line with reference.
6. Provider dashboard (within ~20 s) shows **+R585.00** available (R650 − 10% fee) and the earning in History.
7. Provider **Withdraws** R500 → available R85.00 (plus their earlier balance).
8. Turn **auto-pay** on, do another job → payment happens the moment the provider marks it done.
9. Try a job costing more than the balance → *You need R… more* → **Add funds and pay** works in one go.
10. Decline card `4000 0000 0000 0002` on Add funds → balance unchanged.

---

## 6. Later: real money

The screens, steps, ledger and rules stay the same. What changes:
- **Add funds** goes through a licensed payment provider (PayFast, Yoco, Paystack, Peach) — their hosted card
  form and a webhook to confirm the top-up before it's credited.
- **Withdrawals** become real EFT payouts to verified bank accounts (collected securely, with FICA checks).
- Holding customer money in a wallet is regulated — before real money, get advice on whether to use the
  payment provider's own wallet/escrow product instead of holding funds ourselves.
