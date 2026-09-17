package com.geekkulcha.backend.dto.response;

public record ServicePriceResponse(long serviceId, String serviceName, double minPrice, double maxPrice) {
}
