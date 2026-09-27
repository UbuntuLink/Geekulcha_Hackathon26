import { useCallback, useEffect, useState } from "react";
import Card from "./Card.jsx";
import AddFundsForm from "./AddFundsForm.jsx";
import { getWallet, getWalletEntries, setAutoPay, withdrawFromWallet } from "../../api/services.js";
import { formatRands } from "../../lib/card.js";

const ENTRY_ICONS = { TOP_UP: "＋", JOB_PAYMENT: "↗", JOB_EARNING: "↙", WITHDRAWAL: "🏦" };

/**
 * The in-app balance: amount, what's waiting, add funds (customers), withdraw (providers),
 * auto-pay, and the history. Refreshes itself so a payment from the other side shows up.
 */
export default function WalletCard({ role = "customer", className = "" }) {
  const provider = role === "provider";
  const [wallet, setWallet] = useState(null);
  const [entries, setEntries] = useState(null);
  const [panel, setPanel] = useState(null); // null | "add" | "withdraw" | "history"
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    getWallet().then(setWallet).catch(() => {});
    getWalletEntries().then(setEntries).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => document.visibilityState === "visible" && load(), 20000);
    return () => clearInterval(timer);
  }, [load]);

  const done = (updated, text) => {
    setWallet(updated);
    setPanel(null);
    setMessage(text);
    setError("");
    getWalletEntries().then(setEntries).catch(() => {});
  };

  const toggleAutoPay = async () => {
    try {
      done(await setAutoPay(!wallet.autoPay), !wallet.autoPay ? "Auto-pay is on." : "Auto-pay is off.");
    } catch {
      setError("Couldn't change auto-pay. Please try again.");
    }
  };

  const withdraw = async (event) => {
    event.preventDefault();
    const cents = Math.round(Number(withdrawAmount) * 100) || 0;
    try {
      done(await withdrawFromWallet(cents), `${formatRands(cents)} is on its way to your bank account.`);
      setWithdrawAmount("");
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't withdraw. Please try again.");
    }
  };

  if (!wallet) {
    return (
      <Card className={className}>
        <p className="text-sm text-gray-500">Loading balance…</p>
      </Card>
    );
  }

  return (
    <Card className={`lg:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand/70">{provider ? "Earnings balance" : "Balance"}</p>
          <p className="mt-1 text-3xl font-extrabold text-ink" aria-live="polite">{formatRands(wallet.balanceCents)}</p>
          {provider && wallet.awaitingPaymentToYouCents > 0 && (
            <p className="mt-1 text-sm text-amber-700">
              <span aria-hidden="true">💳 </span>
              {formatRands(wallet.awaitingPaymentToYouCents)} awaiting customer payment
            </p>
          )}
          {!provider && wallet.awaitingYourPaymentCents > 0 && (
            <p className="mt-1 text-sm text-amber-700">
              <span aria-hidden="true">💳 </span>
              {formatRands(wallet.awaitingYourPaymentCents)} to pay for completed work
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!provider && (
          <button type="button" onClick={() => setPanel(panel === "add" ? null : "add")} className="min-h-[40px] rounded-xl bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark">
            Add funds
          </button>
        )}
        {provider && (
          <button type="button" onClick={() => setPanel(panel === "withdraw" ? null : "withdraw")} className="min-h-[40px] rounded-xl bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark">
            Withdraw
          </button>
        )}
        <button type="button" onClick={() => setPanel(panel === "history" ? null : "history")} className="min-h-[40px] rounded-xl border border-brand/25 px-4 text-sm font-semibold text-brand hover:bg-brand/5">
          {panel === "history" ? "Hide history" : "History"}
        </button>
      </div>

      {!provider && (
        <label className="mt-3 flex min-h-[40px] cursor-pointer items-center gap-2.5 text-sm text-gray-800">
          <input type="checkbox" checked={wallet.autoPay} onChange={toggleAutoPay} className="h-4 w-4 accent-brand" />
          <span>
            Auto-pay
            <span className="block text-xs text-gray-500">Pay automatically from my balance when a provider marks a job done.</span>
          </span>
        </label>
      )}

      {message && <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">✓ {message}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}

      {panel === "add" && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <AddFundsForm onDone={(updated) => done(updated, "Funds added.")} onCancel={() => setPanel(null)} />
        </div>
      )}

      {panel === "withdraw" && (
        <form onSubmit={withdraw} className="mt-4 flex flex-wrap items-end gap-2 border-t border-gray-100 pt-4">
          <label className="text-sm font-semibold text-gray-800">
            Amount to withdraw
            <span className="mt-1 flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2">
              <span className="text-gray-500">R</span>
              <input
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^\d.]/g, ""))}
                inputMode="decimal"
                className="w-28 bg-transparent font-normal focus:outline-none"
              />
            </span>
          </label>
          <button type="button" onClick={() => setWithdrawAmount(String(wallet.balanceCents / 100))} className="min-h-[40px] rounded-xl px-3 text-sm font-semibold text-brand hover:bg-brand/5">
            All
          </button>
          <button type="submit" className="min-h-[40px] rounded-xl bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark">
            Withdraw to bank
          </button>
        </form>
      )}

      {panel === "history" && (
        <ul className="mt-4 divide-y divide-gray-100 border-t border-gray-100">
          {entries?.length === 0 && <li className="py-3 text-sm text-gray-500">No transactions yet.</li>}
          {entries?.map((entry) => (
            <li key={entry.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0">
                <span className="text-gray-800"><span aria-hidden="true">{ENTRY_ICONS[entry.type]} </span>{entry.description}</span>
                <span className="block text-xs text-gray-500">
                  {new Date(entry.createdAt).toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {entry.reference}
                </span>
              </span>
              <span className={`shrink-0 font-bold ${entry.amountCents >= 0 ? "text-emerald-700" : "text-gray-800"}`}>
                {entry.amountCents >= 0 ? "+" : ""}{formatRands(entry.amountCents)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
