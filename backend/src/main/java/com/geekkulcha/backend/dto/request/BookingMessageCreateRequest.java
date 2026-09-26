package com.geekkulcha.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BookingMessageCreateRequest(
        @NotBlank @Size(max = 2000) String content
) {
}