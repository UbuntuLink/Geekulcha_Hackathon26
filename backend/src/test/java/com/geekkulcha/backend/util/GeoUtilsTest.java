package com.geekkulcha.backend.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class GeoUtilsTest {

    // Johannesburg and Pretoria, roughly 50 km apart — a distance anyone in Gauteng can sanity
    // check, which is the point of using real cities rather than made-up coordinates.
    private static final double JHB_LAT = -26.2041;
    private static final double JHB_LNG = 28.0473;
    private static final double PTA_LAT = -25.7479;
    private static final double PTA_LNG = 28.2293;

    @Test
    void measuresAKnownDistance() {
        double km = GeoUtils.distanceKm(JHB_LAT, JHB_LNG, PTA_LAT, PTA_LNG);

        assertTrue(km > 45 && km < 60, "Johannesburg to Pretoria should be ~50 km, got " + km);
    }

    @Test
    void isZeroForTheSamePoint() {
        assertEquals(0.0, GeoUtils.distanceKm(JHB_LAT, JHB_LNG, JHB_LAT, JHB_LNG), 0.0001);
    }

    @Test
    void isSymmetric() {
        assertEquals(
                GeoUtils.distanceKm(JHB_LAT, JHB_LNG, PTA_LAT, PTA_LNG),
                GeoUtils.distanceKm(PTA_LAT, PTA_LNG, JHB_LAT, JHB_LNG),
                0.0001);
    }

    @Test
    void rejectsMissingOrOutOfRangeCoordinates() {
        assertTrue(GeoUtils.isUsable(JHB_LAT, JHB_LNG));

        assertFalse(GeoUtils.isUsable(null, JHB_LNG));
        assertFalse(GeoUtils.isUsable(JHB_LAT, null));
        // 0,0 is a valid point, so "no coordinates" has to be null rather than zero.
        assertTrue(GeoUtils.isUsable(0.0, 0.0));
        assertFalse(GeoUtils.isUsable(91.0, JHB_LNG));
        assertFalse(GeoUtils.isUsable(JHB_LAT, 181.0));
    }
}
