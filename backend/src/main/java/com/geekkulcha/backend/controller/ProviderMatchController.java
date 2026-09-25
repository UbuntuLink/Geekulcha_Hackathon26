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

    /**
     * Coordinates are optional query params, so every existing caller keeps working unchanged:
     * without them the response is exactly what it was before geolocation.
     */
    @GetMapping("/api/services/{serviceId}/providers")
    public List<ProviderMatchResponse> providersForService(
            @PathVariable long serviceId,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude) {
        return providerMatchService.findProvidersForService(serviceId, latitude, longitude);
    }

    @GetMapping("/api/provider-profiles/{id}")
    public ProviderProfileResponse profile(@PathVariable long id) {
        return providerMatchService.getProfile(id);
    }
}
