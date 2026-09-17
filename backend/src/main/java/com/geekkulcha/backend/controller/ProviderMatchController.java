package com.geekkulcha.backend.controller;

import com.geekkulcha.backend.dto.response.ProviderMatchResponse;
import com.geekkulcha.backend.dto.response.ProviderProfileResponse;
import com.geekkulcha.backend.service.ProviderMatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Figma screens 6-8: Matching Providers, Compare Providers, Provider Profile. */
@RestController
@RequiredArgsConstructor
public class ProviderMatchController {

    private final ProviderMatchService providerMatchService;

    @GetMapping("/api/services/{serviceId}/providers")
    public List<ProviderMatchResponse> providersForService(@PathVariable long serviceId) {
        return providerMatchService.findProvidersForService(serviceId);
    }

    @GetMapping("/api/provider-profiles/{id}")
    public ProviderProfileResponse profile(@PathVariable long id) {
        return providerMatchService.getProfile(id);
    }
}
