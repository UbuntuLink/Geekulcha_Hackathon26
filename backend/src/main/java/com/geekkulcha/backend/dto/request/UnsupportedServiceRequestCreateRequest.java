package com.geekkulcha.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UnsupportedServiceRequestCreateRequest(
        @NotBlank String description,
        String advice
) {
}
