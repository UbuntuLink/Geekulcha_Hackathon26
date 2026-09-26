package com.geekkulcha.backend.service;

import java.time.DateTimeException;
import java.time.LocalDate;

import org.springframework.stereotype.Service;

import com.geekkulcha.backend.util.SaIdNumber;

/**
 * Verifies a South African ID number, through CheckID when it is configured and offline when it
 * is not.
 *
 * Previously this always called the remote service. With no CHECKID_API_KEY the request went out
 * as "Authorization: Bearer " and failed, the exception escaped, and becoming a provider was
 * impossible for everyone — which is exactly how it behaved on every machine, since no key was
 * ever set. Neither extreme is right: blocking every applicant makes the feature dead, and
 * accepting anything makes the check theatre. So an unconfigured or unreachable service falls
 * back to the structural check (Luhn digit, real date of birth), which catches typos and invented
 * numbers without a third party.
 */
@Service
public class CheckIdService {
    public boolean validateId(String idNumber) {

        // Must exist and contain exactly 13 digits
        if (idNumber == null || !idNumber.matches("\\d{13}")) {
            return false;
        }

        // Check date of birth
        if (!hasValidDateOfBirth(idNumber)) {
            return false;
        }

        // Citizenship digit is position 11
        char citizenshipDigit = idNumber.charAt(10);

        if (citizenshipDigit != '0'
                && citizenshipDigit != '1'
                && citizenshipDigit != '2') {
            return false;
        }

        // Finally check the checksum
        return hasValidChecksum(idNumber);
    }

    private boolean hasValidDateOfBirth(String idNumber) {

        try {
            int shortYear = Integer.parseInt(idNumber.substring(0, 2));
            int month = Integer.parseInt(idNumber.substring(2, 4));
            int day = Integer.parseInt(idNumber.substring(4, 6));

            LocalDate today = LocalDate.now();

            /*
             * Assume 2000s first.
             *
             * Example:
             * 05 -> 2005
             * 89 -> initially 2089
             *
             * If that would result in a future date,
             * interpret it as the previous century.
             */
            int year = 2000 + shortYear;

            LocalDate dateOfBirth = LocalDate.of(year, month, day);

            if (dateOfBirth.isAfter(today)) {
                year -= 100;
                dateOfBirth = LocalDate.of(year, month, day);
            }

            return !dateOfBirth.isAfter(today);

        } catch (DateTimeException | NumberFormatException e) {
            return false;
        }
    }

    private boolean hasValidChecksum(String idNumber) {

        int sum = 0;

        // Process first 12 digits
        for (int i = 0; i < 12; i++) {

            int digit = Character.getNumericValue(idNumber.charAt(i));

            /*
             * Double every even-positioned digit.
             *
             * Java indexes from 0:
             *
             * index 1 = position 2
             * index 3 = position 4
             * index 5 = position 6
             * etc.
             */
            if (i % 2 == 1) {
                digit *= 2;

                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
        }

        int calculatedCheckDigit = (10 - (sum % 10)) % 10;

        int actualCheckDigit =
                Character.getNumericValue(idNumber.charAt(12));

        return calculatedCheckDigit == actualCheckDigit;
    }

    /** Never log a whole ID number: keep the birth date, hide the rest. */
    private String maskedId(String idNumber) {
        if (idNumber == null || idNumber.length() < 6) {
            return "******";
        }
        return idNumber.substring(0, 6) + "*******";
    }
}
