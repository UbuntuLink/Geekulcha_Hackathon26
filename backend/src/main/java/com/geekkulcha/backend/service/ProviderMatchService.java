package com.geekkulcha.backend.service;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import com.geekkulcha.backend.dto.response.ProviderMatchResponse;
import com.geekkulcha.backend.dto.response.ProviderProfileResponse;
import com.geekkulcha.backend.dto.response.ReviewResponse;
import com.geekkulcha.backend.dto.response.ServicePriceResponse;
import com.geekkulcha.backend.entity.ProviderProfile;
import com.geekkulcha.backend.exception.ResourceNotFoundException;
import com.geekkulcha.backend.repository.ProviderProfileRepository;
import com.geekkulcha.backend.repository.ProviderServiceRepository;
import com.geekkulcha.backend.repository.ReviewRepository;
import com.geekkulcha.backend.util.GeoUtils;

import lombok.RequiredArgsConstructor;

/**
 * Backs Figma screens 6-8 (Matching / Compare / Provider Profile).
 *
 * Results are "who offers this service, nearest first" once the customer's coordinates are
 * known, and fall back to plain "who offers this service" when they are not.
 */
@Service
@RequiredArgsConstructor
public class ProviderMatchService {

    private final ProviderServiceRepository providerServiceRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ReviewRepository reviewRepository;

    /** Every validated provider offering this service, unsorted and unfiltered by distance. */
    public List<ProviderMatchResponse> findProvidersForService(long serviceId) {
        return findProvidersForService(serviceId, null, null);
    }

    /**
     * Providers offering this service, narrowed and ordered by where the customer is.
     *
     * With the customer's coordinates, a provider is dropped when the job falls outside the
     * serviceRadiusKm they set during onboarding — which until now was stored and never read —
     * and the rest come back nearest first.
     *
     * A provider with no coordinates is never dropped. Most rows in the shared database predate
     * the location picker, and silently hiding them would turn a missing column into an empty
     * results screen. They sort after everyone whose distance is known.
     */
    public List<ProviderMatchResponse> findProvidersForService(long serviceId, Double latitude, Double longitude) {
        boolean customerLocated = GeoUtils.isUsable(latitude, longitude);

        return providerServiceRepository.findByServiceId(serviceId).stream()
        .filter(ps -> ps.getProviderProfile().isIdValidated())
        .map(ps -> {
            ProviderProfile p = ps.getProviderProfile();
            Double distanceKm = null;

            if (customerLocated && GeoUtils.isUsable(p.getLatitude(), p.getLongitude())) {
                distanceKm = GeoUtils.distanceKm(latitude, longitude, p.getLatitude(), p.getLongitude());
            }

            return new ProviderMatchResponse(
                    p.getId(),
                    providerName(p),
                    p.getBio(),
                    p.getLocation(),
                    p.getRating(),
                    p.getReviewCount(),
                    p.isAvailableToday(),
                    p.isIdValidated(),
                    ps.getMinPrice(),
                    ps.getMaxPrice(),
                    distanceKm
            );
        })
        .filter(match -> match.distanceKm() == null || match.distanceKm() <= radiusFor(match.providerProfileId()))
        .sorted(Comparator
                .comparing(ProviderMatchResponse::distanceKm, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(Comparator.comparingDouble(ProviderMatchResponse::rating).reversed()))
        .toList();
    }

    /** The provider's own service radius, defaulting generously when they never set one. */
    private int radiusFor(long providerProfileId) {
        return providerProfileRepository.findById(providerProfileId)
                .map(ProviderProfile::getServiceRadiusKm)
                .filter(radius -> radius > 0)
                .orElse(Integer.MAX_VALUE);
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
                p.getRating(), p.getReviewCount(), p.isAvailableToday(), p.isIdValidated(), services, reviews);
    }

    // Business name = first + last name on the underlying User (e.g. "Thabo" + "Plumbing" ->
    // "Thabo Plumbing") — no separate business-name field for MVP.
    private String providerName(ProviderProfile p) {
        return (p.getUser().getFirstName() + " " + p.getUser().getLastName()).trim();
    }
}
