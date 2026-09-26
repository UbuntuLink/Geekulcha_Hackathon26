package com.geekkulcha.backend.dto.request;

public record QuantumProvider (
    Long providerId,
    double rating,
    double distanceKm, 
    double estimatedPrice,
    boolean available
) {}
