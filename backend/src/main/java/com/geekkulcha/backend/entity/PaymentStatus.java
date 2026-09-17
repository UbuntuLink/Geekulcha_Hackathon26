package com.geekkulcha.backend.entity;

/** MVP mock statuses only — see PROJECT.md §9c / §10, no real payment processor is wired up. */
public enum PaymentStatus {
    MOCK_PENDING,
    MOCK_PAID,
    MOCK_FAILED
}
