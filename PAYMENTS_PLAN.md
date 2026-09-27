# Implementation plan: simulated payments

**Goal:** a complete, realistic payment experience in the app — checkout, secure-until-done, payout to the
provider, refunds, receipts — driven by a **simulated payment gateway** (no real money moves). The gateway sits
behind an interface, so a real provider (PayFast, Yoco, Paystack, Peach) can replace it later without changing
the rest of the app.

**Status:** plan only. Internal document for the team.

---

## 1. Where we are today

| | Today | Problem |
|---|---|---|
| Who pays | Nobody sees a payment step. The **provider's** app records a payment when they mark the job complete. | The customer — the person paying — never confirms anything. |
| Amount | Sent by the browser (`?amount=`). | Anyone can send any amount. |
| Access | `POST /api/bookings/{id}/payment/mock-charge` works for **any logged-in user, on any booking**. | Security hole. |
| States | `MOCK_PENDING`, `MOCK_PAID`, `MOCK_FAILED`. | No hold, release, refund or fee. |
| Receipts, earnings | None. | Nothing to show customers or providers. |

Files: `backend/.../payment/MockPaymentService.java`, `controller/PaymentController.java`,
`entity/Payment.java`, `entity/PaymentStatus.java`; called from `BookingTracking.jsx` and `ProviderBookings.jsx`.

---

## 2. The experience we're building

The standard marketplace model: **the customer pays when booking, we hold the money, and release it to the
provider when the job is done.** It protects both sides and gives us a natural place for the platform fee.

```
Customer accepts a quote
        │
        ▼
  CHECKOUT  ── card / Instant EFT / QR ──►  payment SECURED (held)      ← booking is created only now
        │                                          │
        │                          provider marks job completed
        │                                          ▼
        │                                  RELEASED to provider (minus platform fee)
        │
  job cancelled before the provider sets off ──►  REFUNDED to the customer
```

### Customer
1. **Accept a quote → Checkout screen:** job, provider, amount, fee breakdown, and a choice of **Card**,
   **Instant EFT** or **Scan to pay (QR)**.
2. **Card form:** number, expiry, CVC, name — validated like a real form (card-number check digit, expiry in the
   future, 3–4 digit CVC), card brand detected as you type.
3. **"Pay R650"** → a short processing state → **"Payment secured"** → booking confirmation.
4. **Declined card** → clear message, try again.
5. **Receipt** with a reference number (e.g. `UL-PAY-8F3K2Q`), viewable and printable from the tracker.
6. **Work tracker** shows the payment state: *Secured — released to the provider when the job is done*, then
   *Paid to provider*, or *Refunded*.

### Provider
1. **Bookings** show each job's payment: *Secured*, *Paid out*, or *Refunded*.
2. **Earnings card** on the dashboard: *Pending* (secured, job not done), *Paid out this month*, and the fee
   deducted.
3. Completing a job releases the payment automatically — no separate "charge" step.

### Test cards (shown in a small help link on the checkout)

| Card number | Result |
|---|---|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Declined |
| `4000 0000 0000 9995` | Declined — insufficient funds |
| Any other valid number | Success |

Instant EFT and QR always succeed after a short "Waiting for confirmation…" screen.

---

## 3. Design

### 3.1 Payment states

| State | Meaning |
|---|---|
| `PENDING` | Checkout started, not paid. |
| `SECURED` | Customer paid; money held by the platform. |
| `RELEASED` | Job completed; paid out to the provider, minus the fee. |
| `REFUNDED` | Job cancelled; returned to the customer. |
| `FAILED` | Declined. |

**Migration:** existing `MOCK_PAID` rows become `RELEASED`, `MOCK_PENDING` → `PENDING`, `MOCK_FAILED` →
`FAILED`, via a one-off update on startup. Check first whether the `payment` table has a database constraint on
status values (the `booking` table didn't).

### 3.2 Payment record — new fields

`reference` (unique, e.g. `UL-PAY-8F3K2Q`), `method` (CARD / EFT / QR), `cardBrand` and `cardLast4` (card only),
`platformFee`, `providerPayout`, `securedAt`, `releasedAt`, `refundedAt`, `failureReason`.

**Never stored:** full card number, expiry or CVC.

### 3.3 Gateway interface (the swap point)

```java
public interface PaymentGateway {
    GatewayResult charge(String paymentToken, long amountCents, String reference);
    GatewayResult refund(String gatewayChargeId, long amountCents);
    GatewayResult payout(long providerProfileId, long amountCents, String reference);
}
```

- `SimulatedPaymentGateway` implements it now (test-card rules above, ~1 s delay).
- A real `PayFastGateway` / `YocoGateway` later implements the same interface; chosen by a setting
  (`payments.gateway=simulated|payfast`).

### 3.4 Card details never reach our server

The browser turns the card into a **token** before sending, just as real gateways' card widgets do:
`tok_sim_<brand>_<last4>_<outcome>` (the simulated gateway reads the outcome from the test-card rules). Our API
only ever receives the token, brand and last four digits. This keeps us out of card-security (PCI) scope — the
same design we'd use in production.

### 3.5 Rules enforced on the server

- **Amount always comes from the accepted quote**, never from the browser.
- **Only the booking's customer** can pay; only the system releases or refunds (on status change).
- **One payment per booking** (unique), and an **idempotency key** per checkout so a double tap can't charge twice.
- **Booking is created only after payment is secured** — accept-quote and pay become one step, in one
  transaction with the existing row lock (no double-booking).
- **Release on COMPLETED, refund on CANCELLED** — hooked into `BookingService.updateStatus`, which already
  controls those transitions.
- **Platform fee:** a single setting, e.g. `payments.platform-fee-percent=10`; stored on each payment so later
  changes don't rewrite history.

### 3.6 API

| Method | Path | Who | What |
|---|---|---|---|
| `POST` | `/api/quotes/{id}/checkout` | Customer who owns the request | Body: `{ method, paymentToken, cardBrand, cardLast4, idempotencyKey, scheduledDate?, scheduledTime? }` → charges, and on success creates the booking. Returns booking + payment. |
| `GET` | `/api/bookings/{id}/payment` | Booking's customer or provider | Payment state and receipt details. |
| `GET` | `/api/provider-profiles/me/earnings` | Provider | Pending, paid out (this month / all time), fees. |
| — | `POST /payment/mock-charge` | — | **Removed.** |

The old `POST /api/bookings/accept-quote/{quoteId}` stays working for one release (without payment) and then is
removed.

---

## 4. Work breakdown

### Phase 1 — Backend (about 1 day)

1. `PaymentStatus`: new states + startup migration of old values.
2. `Payment`: new fields; unique `reference`, unique `booking`.
3. `PaymentGateway` interface + `SimulatedPaymentGateway` (test-card rules, token parsing).
4. `PaymentService`: `checkout` (charge → create booking, one transaction), `release`, `refund`, `earnings`.
5. `BookingService.updateStatus`: call `release` on COMPLETED, `refund` on CANCELLED.
6. `PaymentController`: the endpoints in 3.6; delete `mock-charge` and `MockPaymentService`.
7. **Tests:** success, decline, insufficient funds, wrong customer (403), double tap (same idempotency key → one
   charge), amount can't be overridden, release on completion, refund on cancellation, fee maths.

### Phase 2 — Customer screens (about 1 day)

1. `pages/customer/Checkout.jsx` — summary, method tabs, card form with live validation and brand detection,
   processing and result states, test-card help link.
2. `lib/cardTokenizer.js` — check-digit validation, brand detection, token creation; the card number never
   leaves this file.
3. Quotes page "Accept" → goes to Checkout instead of booking directly.
4. `BookingTracking.jsx` — payment status line and a **Receipt** panel (printable).
5. Remove the `mockCharge` calls from `BookingTracking.jsx` and `ProviderBookings.jsx`.

### Phase 3 — Provider screens (half a day)

1. `ProviderBookings.jsx` — payment badge per job (*Secured* / *Paid out* / *Refunded*, with symbols for
   colour-blind users).
2. `ProviderDashboard.jsx` — **Earnings** card.

### Phase 4 — Polish (half a day)

- Translations for all new text (`LanguageContext.jsx`), screen-reader announcements for processing/result,
  large tap targets on the card form.
- Update `FEATURES_AND_SECURITY.md` and the demo script.

**Total: about 3 days** for one developer.

---

## 5. How to test it end to end

1. As the customer, request a job; as the provider, quote R650.
2. Customer: **Accept → Checkout**, pay with `4000 0000 0000 0002` → declined, no booking created.
3. Pay with `4242 4242 4242 4242` → *Payment secured*; booking created; tracker shows *Secured*.
4. Provider dashboard: Earnings shows R650 pending (R585 after a 10% fee).
5. Provider moves the job to **Completed** → payment *Released*; earnings move to *Paid out*; receipt shows the
   breakdown.
6. New booking, customer cancels before the provider sets off → *Refunded*.
7. Double-click **Pay** → only one payment exists.
8. Try paying for someone else's quote → refused.

---

## 6. Going live later

Swap `SimulatedPaymentGateway` for a real one (PayFast, Yoco, Paystack or Peach Payments all serve South
Africa):
- Replace the browser tokenizer with the provider's hosted card fields or checkout page.
- Add the provider's **webhook** endpoint to confirm payments asynchronously.
- Payouts to providers: the gateway's split/marketplace feature, or scheduled EFT payouts; collect providers'
  bank details securely at that point.
- Complete the gateway's merchant onboarding (FICA) and set up refunds and dispute handling.

Nothing else in the app changes: screens, states, rules and tests stay the same.
