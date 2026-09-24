package com.geekkulcha.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

/** What the customer submits from the "Describe Your Problem" screen (Figma screen 4). */
public record ServiceRequestCreateRequest(
        @NotBlank String description,
        String location,
        LocalDate preferredDate,
        String aiClassificationRaw,
        Long serviceId,
        String photoDataUrl,
        String photoName
) {
}
