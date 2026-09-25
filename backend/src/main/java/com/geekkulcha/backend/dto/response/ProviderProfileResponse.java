package com.geekkulcha.backend.dto.response;

import java.util.List;

/** Figma screen 8: Provider Profile. */
public record ProviderProfileResponse(
        long providerProfileId,
        String providerName,
        String bio,
        String location,
        double rating,
        int reviewCount,
        boolean availableToday,
        boolean isValidated,
        List<ServicePriceResponse> services,
        List<ReviewResponse> reviews
) {
}
