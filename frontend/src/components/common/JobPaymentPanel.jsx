import { useEffect, useState } from "react";
import Card from "./Card.jsx";
import { getBookingPayment, getWallet, payForBooking } from "../../api/services.js";
import { formatRands } from "../../lib/card.js";

/**
 * Payment on the work tracker.
 * - Work done, customer: "Confirm and pay". The balance is used first; anything it doesn't cover
 *   goes on their card — no need to add funds first.
 * - Work done, provider: waiting for the customer, and what they'll receive.
 * - Completed: the same receipt line for both sides.
 */
export default function JobPaymentPanel({ booking, isProvider, onPaid }) {
  const amountCents = Math.round((booking.quote?.amount ?? 0) * 100);
  const [wallet, setWallet] = useState(null);
  const [payment, setPayment] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const awaiting = booking.status === "AWAITING_PAYMENT";
  const completed = booking.status === "COMPLETED";

  useEffect(() => {
    if (awaiting && !isProvider) getWallet().then(setWallet).catch(() => {});
    if (completed) getBookingPayment(booking.id).then(setPayment).catch(() => {});
  }, [booking.id, booking.status, awaiting, completed, isProvider]);

  const pay = async () => {
    setBusy(true);
    setError("");
    try {
      const paid = await payForBooking(booking.id);
      setPayment(paid);
      onPaid?.();
    } catch (err) {
      setError(err?.response?.data?.message || "Payment didn't go through. Please try again.");
      getWallet().then(setWallet).catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  if (completed) {
    if (!payment) return null;
    return (
      <Card className="lg:p-6">
        <p className="font-bold text-emerald-700"><span aria-hidden="true">✓ </span>Paid {formatRands(payment.amountCents)}</p>
        <p className="mt-1 text-sm text-gray-600">
          {new Date(payment.paidAt).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          {{ AUTO_PAY: " · auto-pay", CARD: " · card", SPLIT: " · balance and card" }[payment.method] ?? ""} · ref {payment.reference}
        </p>
        {isProvider && (
          <p className="mt-2 text-sm text-gray-600">
            You received <span className="font-bold text-ink">{formatRands(payment.providerAmountCents)}</span>
            {" "}({formatRands(payment.platformFeeCents)} platform fee).
          </p>
        )}
      </Card>
    );
  }

  if (!awaiting) return null;

  if (isProvider) {
    return (
      <Card className="lg:p-6">
        <p className="font-bold text-ink"><span aria-hidden="true">💳 </span>Waiting for the customer to pay</p>
        <p className="mt-1 text-sm text-gray-600">
          {formatRands(amountCents)} — it's added to your balance as soon as they pay.
        </p>
        <p className="mt-1 text-xs text-gray-500">This page updates automatically.</p>
      </Card>
    );
  }

  const balance = Math.max(0, wallet?.balanceCents ?? 0);
  const fromBalance = Math.min(balance, amountCents);
  const onCard = amountCents - fromBalance;

  return (
    <Card className="border-2 border-brand/30 lg:p-6">
      <h2 className="font-bold text-ink">The work is done — confirm and pay</h2>
      <p className="mt-1 text-sm text-gray-600">
        Happy with the job? Pay {formatRands(amountCents)}. If something's wrong, use Report an issue below instead.
      </p>

      {wallet && (
        <p className="mt-3 text-sm text-gray-700">
          {onCard === 0
            ? <>From your balance ({formatRands(balance - amountCents)} left afterwards).</>
            : fromBalance === 0
              ? <>Charged to your card.</>
              : <>{formatRands(fromBalance)} from your balance, {formatRands(onCard)} charged to your card.</>}
        </p>
      )}

      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={pay}
        disabled={busy || !wallet}
        className="mt-3 min-h-[48px] w-full rounded-xl bg-brand text-base font-bold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {busy ? "Paying…" : `Confirm and pay ${formatRands(amountCents)}`}
      </button>
    </Card>
  );
}
