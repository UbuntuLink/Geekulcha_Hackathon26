package com.geekkulcha.backend.dto.response;

import com.geekkulcha.backend.entity.RequestStatus;

import java.time.Instant;

/**
 * A request a customer sent to one particular provider ("Request quote" on the provider's
 * profile), as shown on that provider's Bookings page. A JPQL projection, so the request's photo
 * isn't loaded. alreadyQuoted is filled in afterwards from the provider's own quotes.
 */
public record QuoteRequestInboxResponse(
        long requestId,
        String description,
        String location,
        String serviceName,
        RequestStatus status,
        Instant createdAt,
        String customerFirstName,
        boolean alreadyQuoted
) {
    /** Constructor the JPQL projection calls; alreadyQuoted is set with {@link #withAlreadyQuoted}. */
    public QuoteRequestInboxResponse(long requestId, String description, String location, String serviceName,
                                     RequestStatus status, Instant createdAt, String customerFirstName) {
        this(requestId, description, location, serviceName, status, createdAt, customerFirstName, false);
    }

    public QuoteRequestInboxResponse withAlreadyQuoted(boolean quoted) {
        return new QuoteRequestInboxResponse(requestId, description, location, serviceName, status, createdAt,
                customerFirstName, quoted);
    }
}
