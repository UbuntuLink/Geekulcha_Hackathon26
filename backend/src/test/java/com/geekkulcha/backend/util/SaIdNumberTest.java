package com.geekkulcha.backend.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;

class SaIdNumberTest {

    // Check digits computed against the algorithm rather than invented, so these really do pass.
    private static final String VALID = "9202204720083";     // born 1992-02-20
    private static final String VALID_TOO = "8001015009087"; // born 1980-01-01
    private static final String VALID_2000S = "0112251234087"; // born 2001-12-25

    @Test
    void acceptsAStructurallyValidNumber() {
        assertTrue(SaIdNumber.isStructurallyValid(VALID));
        assertTrue(SaIdNumber.isStructurallyValid(VALID_TOO));
        assertTrue(SaIdNumber.isStructurallyValid(VALID_2000S));
    }

    @Test
    void rejectsABrokenCheckDigit() {
        // Last digit bumped by one — the kind of slip a typo makes, which is the whole point.
        String tampered = VALID.substring(0, 12) + ((VALID.charAt(12) - '0' + 1) % 10);

        assertFalse(SaIdNumber.isStructurallyValid(tampered));
    }

    @Test
    void rejectsAnImpossibleDate() {
        assertFalse(SaIdNumber.isStructurallyValid("9202304720082")); // month 23
        assertFalse(SaIdNumber.isStructurallyValid("9202324720082")); // 32nd day
    }

    @Test
    void rejectsWrongLengthAndNonDigits() {
        assertFalse(SaIdNumber.isStructurallyValid(null));
        assertFalse(SaIdNumber.isStructurallyValid(""));
        assertFalse(SaIdNumber.isStructurallyValid("920220472008"));      // 12 digits
        assertFalse(SaIdNumber.isStructurallyValid("92022047200821"));    // 14 digits
        assertFalse(SaIdNumber.isStructurallyValid("92022047200A2"));
    }

    @Test
    void readsTheDateOfBirth() {
        assertEquals(LocalDate.of(1992, 2, 20), SaIdNumber.dateOfBirth(VALID));
        assertEquals(LocalDate.of(1980, 1, 1), SaIdNumber.dateOfBirth(VALID_TOO));
        // A "01" year has to resolve to 2001, not 1901 — the two-digit year is ambiguous and
        // only "not in the future" disambiguates it.
        assertEquals(LocalDate.of(2001, 12, 25), SaIdNumber.dateOfBirth(VALID_2000S));
    }

    @Test
    void refusesToReadADateFromRubbish() {
        assertNull(SaIdNumber.dateOfBirth("nope"));
        assertNull(SaIdNumber.dateOfBirth("9202304720082")); // month 23
    }
}
