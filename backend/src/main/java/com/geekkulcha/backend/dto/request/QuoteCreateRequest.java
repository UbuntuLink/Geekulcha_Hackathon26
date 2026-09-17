package com.geekkulcha.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record QuoteCreateRequest(
        @NotNull Long serviceRequestId,
        @NotNull Long providerProfileId,
        @Positive double amount,
        String message
) {
}
