package com.geekkulcha.backend.dto.response;

import java.time.Instant;

public record ReviewResponse(int rating, String comment, Instant createdAt) {
}
