package com.geekkulcha.backend.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class CheckIdService {

    private final RestClient restClient;
    private final String apiKey;

    public CheckIdService(
            @Value("${checkid.base-url}") String baseUrl,
            @Value("${checkid.api-key}") String apiKey
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
        this.apiKey = apiKey;
    }

    public boolean validateId(String idNumber) {
        Map<?, ?> response = restClient
                .get()
                .uri("/api/v1/validate/{idNumber}", idNumber)
                .header("Authorization", "Bearer " + apiKey)
                .retrieve()
                .body(Map.class);

        if (response == null) {
            throw new RuntimeException("No response received from CheckID");
        }

        return Boolean.TRUE.equals(response.get("isValid"));
    }
}