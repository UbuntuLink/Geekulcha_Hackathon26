package com.geekkulcha.backend.controller;

import com.geekkulcha.backend.dto.request.ServiceRequestCreateRequest;
import com.geekkulcha.backend.entity.Quote;
import com.geekkulcha.backend.entity.ServiceRequest;
import com.geekkulcha.backend.service.QuoteService;
import com.geekkulcha.backend.service.ServiceRequestService;
import com.geekkulcha.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Figma screen 4: "Describe Your Problem". */
@RestController
@RequestMapping("/api/service-requests")
@RequiredArgsConstructor
public class ServiceRequestController {

    private final ServiceRequestService serviceRequestService;
    private final QuoteService quoteService;
    private final UserService userService;

    @PostMapping
    public ServiceRequest create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ServiceRequestCreateRequest request) {
        var customer = userService.getCurrentUser(jwt);
        return serviceRequestService.create(customer, request);
    }

    @GetMapping("/{id}")
    public ServiceRequest getById(@PathVariable long id) {
        return serviceRequestService.getById(id);
    }

    @GetMapping("/mine")
    public List<ServiceRequest> mine(@AuthenticationPrincipal Jwt jwt) {
        return serviceRequestService.findByUser(userService.getCurrentUser(jwt).getId());
    }

    /** Provider's Requests Feed — every open request, not scoped to any one provider. */
    @GetMapping("/open")
    public List<ServiceRequest> open() {
        return serviceRequestService.findOpen();
    }

    /** Customer's incoming quotes on one of their requests. Figma screen 9 territory. */
    @GetMapping("/{id}/quotes")
    public List<Quote> quotes(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        return quoteService.findForServiceRequest(id, userService.getCurrentUser(jwt).getId());
    }

    /** "Request a quote" on a specific provider's profile — highlights the request in their feed. */
    @PatchMapping("/{id}/preferred-provider")
    public ServiceRequest setPreferredProvider(@AuthenticationPrincipal Jwt jwt, @PathVariable long id,
                                                @RequestParam long providerProfileId) {
        return serviceRequestService.setPreferredProvider(id, providerProfileId, userService.getCurrentUser(jwt).getId());
    }
}
