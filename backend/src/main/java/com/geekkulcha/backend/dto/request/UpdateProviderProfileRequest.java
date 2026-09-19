package com.geekkulcha.backend.dto.request;

/** ProviderProfileEdit.jsx / ProviderOnboarding.jsx. */
public record UpdateProviderProfileRequest(
        String bio,
        String location,
        int serviceRadiusKm,
        boolean availableToday
) {
}
