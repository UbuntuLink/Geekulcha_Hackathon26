package com.geekkulcha.backend.controller;

import com.geekkulcha.backend.dto.request.QuoteCreateRequest;
import com.geekkulcha.backend.dto.response.QuoteSummaryResponse;
import com.geekkulcha.backend.entity.Quote;
import com.geekkulcha.backend.exception.ResourceNotFoundException;
import com.geekkulcha.backend.repository.ProviderProfileRepository;
import com.geekkulcha.backend.repository.QuoteRepository;

import com.geekkulcha.backend.service.QuoteService;
import com.geekkulcha.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Figma screen 9 territory, now for real: a signed-in provider reviews a request (via
 * RequestsFeed/RequestDetail) and submits a Quote as themselves. No providerProfileId is ever
 * trusted from the client — it's always the caller's own ProviderProfile.
 */
@RestController
@RequestMapping("/api/quotes")
@RequiredArgsConstructor
public class QuoteController {

    private final QuoteService quoteService;
    private final UserService userService;
    private final ProviderProfileRepository providerProfileRepository;
    private final QuoteRepository quoteRepository;

    @PostMapping
    public Quote create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody QuoteCreateRequest request) {
        long userId = userService.getCurrentUser(jwt).getId();
        var providerProfile = providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Signed-in user has no provider profile"));
        return quoteService.create(providerProfile, request);
    }

    /**
     * All quotes on the signed-in customer's requests — backs the Quotes page, which polls this,
     * so a quote a provider sends shows up without the customer reloading.
     */
    @GetMapping("/mine")
    public List<QuoteSummaryResponse> mine(@AuthenticationPrincipal Jwt jwt) {
        return quoteRepository.findSummariesForCustomer(userService.getCurrentUser(jwt).getId());
    }

    @GetMapping("/{id}")
    public Quote getById(@PathVariable long id) {
        return quoteService.getById(id);
    }

    /** Customer declines a quote on one of their requests. */
    @PatchMapping("/{id}/reject")
    public Quote reject(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        long userId = userService.getCurrentUser(jwt).getId();
        return quoteService.reject(id, userId);
    }
}
