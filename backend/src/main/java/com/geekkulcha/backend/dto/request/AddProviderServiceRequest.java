package com.geekkulcha.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/** "Add a service you offer" on ProviderProfileEdit.jsx — upserts by serviceId. */
public record AddProviderServiceRequest(
        @NotNull Long serviceId,
        @PositiveOrZero double minPrice,
        @PositiveOrZero double maxPrice
) {
}
