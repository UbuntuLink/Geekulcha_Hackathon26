package com.geekkulcha.backend.util;

/**
 * Distance between two points on the globe.
 *
 * Plain Java rather than PostGIS on purpose: at this project's scale — a few dozen providers per
 * category — the haversine over a category's rows is instant, and it keeps the shared Supabase
 * database free of an extension the rest of the app would not use.
 */
public final class GeoUtils {

    private static final double EARTH_RADIUS_KM = 6371.0;

    private GeoUtils() {
    }

    /** Great-circle distance in kilometres. */
    public static double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);

        return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /** True when both coordinates are present and inside the valid range. */
    public static boolean isUsable(Double latitude, Double longitude) {
        return latitude != null && longitude != null
                && latitude >= -90 && latitude <= 90
                && longitude >= -180 && longitude <= 180;
    }
}
