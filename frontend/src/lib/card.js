// Card form helpers for adding funds. The full card number, expiry and CVC never leave the
// browser: only the brand and last four digits are sent (see api/services.js topUpWallet).

export const digitsOnly = (value) => String(value ?? "").replace(/\D/g, "");

/** "4242424242424242" -> "4242 4242 4242 4242" (Amex: 4-6-5). */
export function formatCardNumber(value) {
  const digits = digitsOnly(value).slice(0, 19);
  if (cardBrand(digits) === "Amex") {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean).join(" ");
  }
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

export function cardBrand(number) {
  const d = digitsOnly(number);
  if (/^4/.test(d)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  return "Card";
}

/** The standard check-digit test every real card number passes. */
export function passesLuhn(number) {
  const digits = digitsOnly(number);
  if (digits.length < 13) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/** "MM/YY", not in the past. */
export function validExpiry(value) {
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(String(value ?? "").trim());
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  const endOfMonth = new Date(year, month, 1);
  return endOfMonth > new Date();
}

export function formatExpiry(value) {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

/** Validates the whole form; returns an error message, or "" when it's fine. */
export function validateCard({ number, expiry, cvc }) {
  if (!passesLuhn(number)) return "Check the card number.";
  if (!validExpiry(expiry)) return "Check the expiry date (MM/YY).";
  const cvcLength = cardBrand(number) === "Amex" ? 4 : 3;
  if (digitsOnly(cvc).length !== cvcLength) return `Enter the ${cvcLength}-digit security code.`;
  return "";
}

/** What is sent to the server instead of the card itself. */
export const cardSummary = (number) => ({ brand: cardBrand(number), last4: digitsOnly(number).slice(-4) });

/** Cents -> "R1 350.00" */
export function formatRands(cents) {
  const value = (Number(cents) || 0) / 100;
  const sign = value < 0 ? "−" : "";
  return `${sign}R${Math.abs(value).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
