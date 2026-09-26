package com.geekkulcha.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.geekkulcha.backend.dto.request.QuantumOptimisationRequest;
import com.geekkulcha.backend.dto.response.QuantumOptimisationResponse;

@Service
public class QuantumService {

    private final RestClient restClient;

    public QuantumService(@Value("${ml.base-url}") String mlBaseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(mlBaseUrl)
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