package com.geekkulcha.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.geekkulcha.backend.dto.response.ProviderMatchResponse;
import com.geekkulcha.backend.service.ProviderMatchService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/quantum-match")
@RequiredArgsConstructor
public class QuantumMatchController {

    private final ProviderMatchService providerMatchService;

    @GetMapping
    public ProviderMatchResponse getQuantumMatch(
            @RequestParam long jobId,
            @RequestParam long serviceId,
            @RequestParam(defaultValue = "0.5") double urgency,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude
    ) {
        return providerMatchService.findQuantumRecommendedProvider(
                jobId,
                serviceId,
                urgency,
                latitude,
                longitude
        );
    }
}