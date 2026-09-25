package com.geekkulcha.backend.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

/** What the customer submits from the "Describe Your Problem" screen (Figma screen 4). */
public record ServiceRequestCreateRequest(
        @NotBlank String description,
        /** Human-readable label for the job's location, e.g. "Pretoria, Gauteng". */
        String location,
        /** Optional coordinates from the location picker; null when the customer skipped it. */
        @DecimalMin("-90") @DecimalMax("90") Double latitude,
        @DecimalMin("-180") @DecimalMax("180") Double longitude,
        LocalDate preferredDate,
        String aiClassificationRaw,
        Long serviceId,
        String photoDataUrl,
        String photoName
) {
}
