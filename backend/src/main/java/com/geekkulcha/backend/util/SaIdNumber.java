package com.geekkulcha.backend.util;

import java.time.DateTimeException;
import java.time.LocalDate;

/**
 * Offline validation of a South African ID number.
 *
 * The 13 digits are YYMMDD SSSS C A Z, where the last digit is a Luhn check digit over the other
 * twelve. That makes a typo detectable without asking anyone: the date has to be a real one, the
 * citizenship digit has to be 0 or 1, and the checksum has to agree.
 *
 * This is what CheckIdService falls back to when no CHECKID_API_KEY is configured or the remote
 * service is unreachable — the alternative was rejecting every applicant, which is what happened
 * before, because a blank bearer token makes that call fail every time.
 */
public final class SaIdNumber {

    private SaIdNumber() {
    }

    /** True when the number is 13 digits with a real date of birth and a correct check digit. */
    public static boolean isStructurallyValid(String idNumber) {
        if (idNumber == null) {
            return false;
        }

        String digits = idNumber.trim();
        if (!digits.matches("\\d{13}")) {
            return false;
        }

        return hasRealDateOfBirth(digits) && hasValidCitizenshipDigit(digits) && passesLuhn(digits);
    }

    /** The date of birth encoded in the first six digits, or null when it isn't a real date. */
    public static LocalDate dateOfBirth(String idNumber) {
        if (idNumber == null || !idNumber.trim().matches("\\d{13}")) {
            return null;
        }

        String digits = idNumber.trim();
        int year = Integer.parseInt(digits.substring(0, 2));
        int month = Integer.parseInt(digits.substring(2, 4));
        int day = Integer.parseInt(digits.substring(4, 6));

        // Two-digit years are ambiguous forever. Anything that would land in the future must be
        // last century — a 2050-born applicant cannot be applying today.
        int currentYear = LocalDate.now().getYear();
        int century = currentYear / 100 * 100;
        int fullYear = century + year;
        if (fullYear > currentYear) {
            fullYear -= 100;
        }

        try {
            return LocalDate.of(fullYear, month, day);
        } catch (DateTimeException e) {
            return null;
        }
    }

    private static boolean hasRealDateOfBirth(String digits) {
        return dateOfBirth(digits) != null;
    }

    /** Digit 11 is 0 for a citizen and 1 for a permanent resident; nothing else is issued. */
    private static boolean hasValidCitizenshipDigit(String digits) {
        char citizenship = digits.charAt(10);
        return citizenship == '0' || citizenship == '1';
    }

    private static boolean passesLuhn(String digits) {
        int sum = 0;
        boolean doubling = false;

        // Right to left, doubling every second digit.
        for (int i = digits.length() - 1; i >= 0; i--) {
            int digit = digits.charAt(i) - '0';

            if (doubling) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            doubling = !doubling;
        }

        return sum % 10 == 0;
    }
}
