package com.geekkulcha.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.geekkulcha.backend.dto.request.QuantumOptimisationRequest;
import com.geekkulcha.backend.dto.response.QuantumOptimisationResponse;

@Service
public class QuantumService {

    private final RestClient restClient;

    public QuantumService() {
        this.restClient = RestClient.builder()
                .baseUrl("http://localhost:8000")
                .build();
    }

    public QuantumOptimisationResponse optimise(
            QuantumOptimisationRequest request
    ) {
        return restClient
                .post()
                .uri("/quantum/optimise")
                .body(request)
                .retrieve()
                .body(QuantumOptimisationResponse.class);
    }
}