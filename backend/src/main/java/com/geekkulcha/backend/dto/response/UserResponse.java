package com.geekkulcha.backend.dto.response;

public record UserResponse(long id, String email, String firstName, String lastName, boolean isProvider) {
}
