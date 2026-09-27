import { useState } from "react";
import { topUpWallet } from "../../api/services.js";
import { cardBrand, cardSummary, digitsOnly, formatCardNumber, formatExpiry, formatRands, validateCard } from "../../lib/card.js";

const PRESETS = [20000, 50000, 100000]; // cents

/**
 * Add funds to the in-app balance with a card. Only the card's brand and last four digits are
 * sent. `minimumCents` (e.g. what's still needed to pay a job) preselects that amount.
 */
export default function AddFundsForm({ minimumCents = 0, onDone, onCancel, submitLabel }) {
  const initial = minimumCents > 0 ? Math.ceil(minimumCents / 100) : 500;
  const [amount, setAmount] = useState(String(initial));
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const amountCents = Math.round(Number(amount) * 100) || 0;
  const brand = cardBrand(number);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (amountCents < 100) return setError("Enter an amount of at least R1.");
    if (minimumCents > 0 && amountCents < minimumCents) return setError(`Add at least ${formatRands(minimumCents)}.`);
    if (!name.trim()) return setError("Enter the name on the card.");
    const cardError = validateCard({ number, expiry, cvc });
    if (cardError) return setError(cardError);

    setBusy(true);
    try {
      const wallet = await topUpWallet(amountCents, cardSummary(number));
      onDone?.(wallet);
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't add funds. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15";

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div>
        <p className="mb-1.5 text-sm font-semibold text-gray-800">Amount</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.filter((preset) => preset >= minimumCents).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(String(preset / 100))}
              className={`min-h-[40px] rounded-xl border px-3 text-sm font-semibold ${
                amountCents === preset ? "border-brand bg-brand text-white" : "border-brand/25 text-brand hover:bg-brand/5"
              }`}
            >
              {formatRands(preset).replace(".00", "")}
            </button>
          ))}
          <label className="flex min-h-[40px] items-center gap-1 rounded-xl border border-gray-200 px-3 text-sm">
            <span className="text-gray-500">R</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              aria-label="Other amount in rand"
              className="w-20 bg-transparent focus:outline-none"
            />
          </label>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-800" htmlFor="card-number">
          Card number <span className="font-normal text-gray-500">{number ? `· ${brand}` : ""}</span>
        </label>
        <input
          id="card-number"
          value={number}
          onChange={(e) => setNumber(formatCardNumber(e.target.value))}
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="4242 4242 4242 4242"
          className={input}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-800" htmlFor="card-expiry">Expiry</label>
          <input
            id="card-expiry"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            className={input}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-gray-800" htmlFor="card-cvc">Security code</label>
          <input
            id="card-cvc"
            value={cvc}
            onChange={(e) => setCvc(digitsOnly(e.target.value).slice(0, 4))}
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            className={input}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-800" htmlFor="card-name">Name on card</label>
        <input id="card-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="cc-name" className={input} />
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="min-h-[44px] flex-1 rounded-xl bg-brand text-sm font-bold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {busy ? "Processing…" : submitLabel || `Add ${formatRands(amountCents)}`}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="min-h-[44px] rounded-xl px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500">🔒 Your card number is never stored.</p>
    </form>
  );
}
