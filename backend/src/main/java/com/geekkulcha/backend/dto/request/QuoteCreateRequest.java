package com.geekkulcha.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** providerProfileId is NOT here on purpose — the provider is the authenticated caller, see QuoteController. */
public record QuoteCreateRequest(
        @NotNull Long serviceRequestId,
        @Positive double amount,
        String message
) {
}
