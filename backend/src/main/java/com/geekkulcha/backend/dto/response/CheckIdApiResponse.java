package com.geekkulcha.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CheckIdApiResponse(
        String idNumber,

        @JsonProperty("isValid")
        boolean valid,

        String dob,
        Integer age,
        String gender,
        String citizenship
) {
}