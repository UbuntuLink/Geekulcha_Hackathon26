package com.geekkulcha.backend.controller;

import com.geekkulcha.backend.dto.request.AddProviderServiceRequest;
import com.geekkulcha.backend.dto.request.UpdateProviderProfileRequest;
import com.geekkulcha.backend.dto.response.ProviderProfileResponse;
import com.geekkulcha.backend.service.ProviderProfileService;
import com.geekkulcha.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

/**
 * Self-service provider profile management (distinct from the public read-only
 * ProviderMatchController) — backs ProviderOnboarding.jsx / ProviderProfileEdit.jsx.
 */
@RestController
@RequestMapping("/api/provider-profiles/me")
@RequiredArgsConstructor
public class ProviderProfileController {

    private final ProviderProfileService providerProfileService;
    private final UserService userService;

    @GetMapping
    public ProviderProfileResponse me(@AuthenticationPrincipal Jwt jwt) {
        return providerProfileService.getOwnProfileResponse(userService.getCurrentUser(jwt).getId());
    }

    @PatchMapping
    public ProviderProfileResponse update(@AuthenticationPrincipal Jwt jwt, @RequestBody UpdateProviderProfileRequest request) {
        return providerProfileService.updateOwnProfile(userService.getCurrentUser(jwt).getId(), request);
    }

    @PutMapping("/services")
    public ProviderProfileResponse addService(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody AddProviderServiceRequest request) {
        return providerProfileService.addOwnService(userService.getCurrentUser(jwt).getId(), request);
    }

    @DeleteMapping("/services/{serviceId}")
    public ProviderProfileResponse removeService(@AuthenticationPrincipal Jwt jwt, @PathVariable long serviceId) {
        return providerProfileService.removeOwnService(userService.getCurrentUser(jwt).getId(), serviceId);
    }
}
