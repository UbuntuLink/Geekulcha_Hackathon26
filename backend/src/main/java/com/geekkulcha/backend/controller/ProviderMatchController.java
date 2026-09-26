package com.geekkulcha.backend.controller;

import com.geekkulcha.backend.dto.response.ProviderMatchResponse;
import com.geekkulcha.backend.dto.response.ProviderProfileResponse;
import com.geekkulcha.backend.service.ProviderMatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<List<ProviderMatchResponse>> providersForService(
            @PathVariable long serviceId,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            // "nearby" (default): providers whose radius reaches the customer. "further": only the
            // ones beyond it, loaded when the customer asks to see more.
            @RequestParam(defaultValue = "nearby") String scope) {
        ProviderMatchService.ProviderMatches matches =
                providerMatchService.matchProviders(serviceId, latitude, longitude);

        if ("further".equalsIgnoreCase(scope)) {
            return ResponseEntity.ok(matches.further());
        }
        // The count lets the page offer "View N more providers further away" without fetching them.
        return ResponseEntity.ok()
                .header(FURTHER_AWAY_COUNT, String.valueOf(matches.further().size()))
                .body(matches.nearby());
    }

    public static final String FURTHER_AWAY_COUNT = "X-Further-Away-Count";

    @GetMapping("/api/provider-profiles/{id}")
    public ProviderProfileResponse profile(@PathVariable long id) {
        return providerMatchService.getProfile(id);
    }
}
