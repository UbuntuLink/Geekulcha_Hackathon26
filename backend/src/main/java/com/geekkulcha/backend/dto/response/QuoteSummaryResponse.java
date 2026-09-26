package com.geekkulcha.backend.dto.response;

import com.geekkulcha.backend.entity.QuoteStatus;
import com.geekkulcha.backend.entity.RequestStatus;

import java.time.Instant;

/**
 * One quote on the customer's Quotes page: the offer, who made it, and which request it's for.
 * Built straight from a JPQL projection (QuoteRepository#findSummariesForCustomer), so listing
 * quotes never loads the request's photo or the provider's account details.
 */
public record QuoteSummaryResponse(
        long id,
        double amount,
        String message,
        QuoteStatus status,
        Instant createdAt,
        long providerProfileId,
        String providerName,
        double providerRating,
        int providerReviewCount,
        long requestId,
        String requestDescription,
        RequestStatus requestStatus,
        String serviceName
) {
}
