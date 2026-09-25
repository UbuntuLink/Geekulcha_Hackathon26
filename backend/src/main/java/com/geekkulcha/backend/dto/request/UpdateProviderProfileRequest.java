package com.geekkulcha.backend.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

/** ProviderProfileEdit.jsx / ProviderOnboarding.jsx. */
public record UpdateProviderProfileRequest(
        String bio,
        String location,
        /** Optional coordinates from the location picker; null leaves the stored pair untouched. */
        @DecimalMin("-90") @DecimalMax("90") Double latitude,
        @DecimalMin("-180") @DecimalMax("180") Double longitude,
        int serviceRadiusKm,
        boolean availableToday
) {
}
