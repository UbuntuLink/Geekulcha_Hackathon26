package com.geekkulcha.backend.dto.response;

import java.time.Instant;
import java.util.List;

/**
 * One review as shown on a provider's public profile. The reviewer appears as first name and last
 * initial ("Thandi M."), enough to show a real person wrote it without publishing their full name.
 * Photos are ids only; each image is fetched from GET /api/review-photos/{id}.
 */
public record ReviewResponse(int rating, String comment, Instant createdAt, String reviewerName, String serviceName,
                             List<Long> photoIds) {
}
