package com.geekkulcha.backend.dto.request;

public record QuantumJob (
    Long jobId,
    String category,
    double urgency
) {}
