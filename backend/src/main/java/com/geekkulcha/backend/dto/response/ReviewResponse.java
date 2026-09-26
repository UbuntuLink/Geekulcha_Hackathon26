package com.geekkulcha.backend.dto.response;

import java.time.Instant;

/**
 * One review as shown on a provider's public profile. The reviewer appears as first name and last
 * initial ("Thandi M."), enough to show a real person wrote it without publishing their full name.
 */
public record ReviewResponse(int rating, String comment, Instant createdAt, String reviewerName, String serviceName) {
}
