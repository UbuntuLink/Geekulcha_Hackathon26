package com.geekkulcha.backend.dto.response;

public record IdentityValidationResult(
        boolean valid,
        String idNumber,
        String dateOfBirth,
        Integer age,
        String gender,
        String citizenship
) {
}