package com.geekkulcha.backend.entity;

public enum BookingStatus {
    REQUEST_SENT,
    ACCEPTED,
    ON_THE_WAY,
    IN_PROGRESS,
    /** Provider marked the work done; completes when the customer pays. */
    AWAITING_PAYMENT,
    COMPLETED,
    CANCELLED
}
