package com.geekkulcha.backend.controller;

import com.geekkulcha.backend.dto.request.QuoteCreateRequest;
import com.geekkulcha.backend.entity.Quote;
import com.geekkulcha.backend.exception.ResourceNotFoundException;
import com.geekkulcha.backend.repository.ProviderProfileRepository;
import com.geekkulcha.backend.service.QuoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * Figma screen 9: customer requests a quote from a specific provider. In the full design a
 * provider would review and respond (see RequestsFeed/RequestDetail stubs, no Figma yet — §9a);
 * for this MVP pass, "Send quote request" creates the Quote immediately using providerProfileId
 * from the request body (auth is disabled, so there's no signed-in provider to derive it from —
 * see PROJECT.md §8).
 */
@RestController
@RequestMapping("/api/quotes")
@RequiredArgsConstructor
public class QuoteController {

    private final QuoteService quoteService;
    private final ProviderProfileRepository providerProfileRepository;

    @PostMapping
    public Quote create(@Valid @RequestBody QuoteCreateRequest request) {
        var providerProfile = providerProfileRepository.findById(request.providerProfileId())
                .orElseThrow(() -> new ResourceNotFoundException("Provider " + request.providerProfileId() + " not found"));
        return quoteService.create(providerProfile, request);
    }

    @GetMapping("/{id}")
    public Quote getById(@PathVariable long id) {
        return quoteService.getById(id);
    }
}
