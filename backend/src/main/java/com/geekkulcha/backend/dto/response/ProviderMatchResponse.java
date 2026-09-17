package com.geekkulcha.backend.dto.response;

/** One row in the "Matching Providers" / "Compare Providers" screens (Figma 6-7). */
public record ProviderMatchResponse(
        long providerProfileId,
        String providerName,
        String bio,
        String location,
        double rating,
        int reviewCount,
        boolean availableToday,
        double minPrice,
        double maxPrice
) {
}
