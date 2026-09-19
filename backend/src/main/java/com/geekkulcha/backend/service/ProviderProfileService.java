package com.geekkulcha.backend.service;

import com.geekkulcha.backend.dto.request.AddProviderServiceRequest;
import com.geekkulcha.backend.dto.request.UpdateProviderProfileRequest;
import com.geekkulcha.backend.dto.response.ProviderProfileResponse;
import com.geekkulcha.backend.entity.ProviderProfile;
import com.geekkulcha.backend.entity.ProviderService;
import com.geekkulcha.backend.exception.ResourceNotFoundException;
import com.geekkulcha.backend.repository.ProviderProfileRepository;
import com.geekkulcha.backend.repository.ProviderServiceRepository;
import com.geekkulcha.backend.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Self-service provider profile management — ProviderOnboarding.jsx / ProviderProfileEdit.jsx. */
@Service
@RequiredArgsConstructor
public class ProviderProfileService {

    private final ProviderProfileRepository providerProfileRepository;
    private final ProviderServiceRepository providerServiceRepository;
    private final ServiceRepository serviceRepository;
    private final ProviderMatchService providerMatchService;

    public ProviderProfile getOwnProfile(long userId) {
        return providerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Signed-in user has no provider profile"));
    }

    public ProviderProfileResponse getOwnProfileResponse(long userId) {
        return providerMatchService.getProfile(getOwnProfile(userId).getId());
    }

    public ProviderProfileResponse updateOwnProfile(long userId, UpdateProviderProfileRequest request) {
        ProviderProfile profile = getOwnProfile(userId);
        profile.setBio(request.bio());
        profile.setLocation(request.location());
        profile.setServiceRadiusKm(request.serviceRadiusKm());
        profile.setAvailableToday(request.availableToday());
        providerProfileRepository.save(profile);
        return providerMatchService.getProfile(profile.getId());
    }

    /** Upserts by serviceId — a provider offers a given service at most once. */
    public ProviderProfileResponse addOwnService(long userId, AddProviderServiceRequest request) {
        ProviderProfile profile = getOwnProfile(userId);
        var service = serviceRepository.findById(request.serviceId())
                .orElseThrow(() -> new ResourceNotFoundException("Service " + request.serviceId() + " not found"));

        ProviderService offering = providerServiceRepository
                .findByProviderProfileIdAndServiceId(profile.getId(), request.serviceId())
                .orElseGet(ProviderService::new);
        offering.setProviderProfile(profile);
        offering.setService(service);
        offering.setMinPrice(request.minPrice());
        offering.setMaxPrice(request.maxPrice());
        providerServiceRepository.save(offering);

        return providerMatchService.getProfile(profile.getId());
    }

    // Spring Data's derived delete methods call EntityManager.remove() directly, which needs an
    // active transaction — unlike save()/findById(), it's not covered by SimpleJpaRepository's
    // own per-method @Transactional, so the caller (here) has to provide one.
    @Transactional
    public ProviderProfileResponse removeOwnService(long userId, long serviceId) {
        ProviderProfile profile = getOwnProfile(userId);
        providerServiceRepository.deleteByProviderProfileIdAndServiceId(profile.getId(), serviceId);
        return providerMatchService.getProfile(profile.getId());
    }
}
