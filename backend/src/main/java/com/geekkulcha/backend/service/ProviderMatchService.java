package com.geekkulcha.backend.service;

import com.geekkulcha.backend.dto.response.ProviderMatchResponse;
import com.geekkulcha.backend.dto.response.ProviderProfileResponse;
import com.geekkulcha.backend.dto.response.ReviewResponse;
import com.geekkulcha.backend.dto.response.ServicePriceResponse;
import com.geekkulcha.backend.entity.ProviderProfile;
import com.geekkulcha.backend.exception.ResourceNotFoundException;
import com.geekkulcha.backend.repository.ProviderProfileRepository;
import com.geekkulcha.backend.repository.ProviderServiceRepository;
import com.geekkulcha.backend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Backs Figma screens 6-8 (Matching / Compare / Provider Profile). No real geo/distance —
 * see PROJECT.md §9b — so results are just "who offers this service", not "who's nearby".
 */
@Service
@RequiredArgsConstructor
public class ProviderMatchService {

    private final ProviderServiceRepository providerServiceRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ReviewRepository reviewRepository;

    public List<ProviderMatchResponse> findProvidersForService(long serviceId) {
        return providerServiceRepository.findByServiceId(serviceId).stream()
                .map(ps -> {
                    ProviderProfile p = ps.getProviderProfile();
                    return new ProviderMatchResponse(
                            p.getId(),
                            providerName(p),
                            p.getBio(),
                            p.getLocation(),
                            p.getRating(),
                            p.getReviewCount(),
                            p.isAvailableToday(),
                            ps.getMinPrice(),
                            ps.getMaxPrice()
                    );
                })
                .toList();
    }

    public ProviderProfileResponse getProfile(long providerProfileId) {
        ProviderProfile p = providerProfileRepository.findById(providerProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider " + providerProfileId + " not found"));

        List<ServicePriceResponse> services = providerServiceRepository.findByProviderProfileId(providerProfileId).stream()
                .map(ps -> new ServicePriceResponse(ps.getService().getId(), ps.getService().getName(), ps.getMinPrice(), ps.getMaxPrice()))
                .toList();

        List<ReviewResponse> reviews = reviewRepository.findByBooking_Quote_ProviderProfile_Id(providerProfileId).stream()
                .map(r -> new ReviewResponse(r.getRating(), r.getComment(), r.getCreatedAt()))
                .toList();

        return new ProviderProfileResponse(p.getId(), providerName(p), p.getBio(), p.getLocation(),
                p.getRating(), p.getReviewCount(), p.isAvailableToday(), services, reviews);
    }

    // Business name = first + last name on the underlying User (e.g. "Thabo" + "Plumbing" ->
    // "Thabo Plumbing") — no separate business-name field for MVP.
    private String providerName(ProviderProfile p) {
        return (p.getUser().getFirstName() + " " + p.getUser().getLastName()).trim();
    }
}
