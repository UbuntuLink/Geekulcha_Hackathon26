/**
 * South African ID number validation, mirroring backend util/SaIdNumber.java.
 *
 * Duplicated deliberately: the backend must not trust the client, and the client should not make
 * someone wait for a round trip to be told they mistyped a digit. Keep the two in step.
 *
 * Layout: YYMMDD SSSS C A Z — the last digit is a Luhn check digit over the other twelve, so a
 * single wrong digit invalidates the number.
 */

/** True when the number is 13 digits with a real date of birth and a correct check digit. */
export function isValidSaId(idNumber) {
  const digits = String(idNumber ?? "").trim();
  if (!/^\d{13}$/.test(digits)) return false;

  return hasRealDateOfBirth(digits) && hasValidCitizenshipDigit(digits) && passesLuhn(digits);
}

/** The encoded date of birth, or null when the first six digits aren't a real date. */
export function saIdDateOfBirth(idNumber) {
  const digits = String(idNumber ?? "").trim();
  if (!/^\d{13}$/.test(digits)) return null;

  const year = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const day = Number(digits.slice(4, 6));

  // Two-digit years are ambiguous forever; anything that would be in the future is last century.
  const currentYear = new Date().getFullYear();
  let fullYear = Math.floor(currentYear / 100) * 100 + year;
  if (fullYear > currentYear) fullYear -= 100;

  const date = new Date(Date.UTC(fullYear, month - 1, day));
  const realDate =
    date.getUTCFullYear() === fullYear &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return realDate ? date : null;
}

function hasRealDateOfBirth(digits) {
  return saIdDateOfBirth(digits) !== null;
}

/** Digit 11 is 0 for a citizen and 1 for a permanent resident; nothing else is issued. */
function hasValidCitizenshipDigit(digits) {
  return digits[10] === "0" || digits[10] === "1";
}

function passesLuhn(digits) {
  let sum = 0;
  let doubling = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (doubling) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubling = !doubling;
  }

  return sum % 10 === 0;
}
