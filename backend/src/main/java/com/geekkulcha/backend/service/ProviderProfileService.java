package com.geekkulcha.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.geekkulcha.backend.dto.request.AddProviderServiceRequest;
import com.geekkulcha.backend.dto.request.CreateProviderProfileDto;
import com.geekkulcha.backend.dto.request.UpdateProviderProfileRequest;
import com.geekkulcha.backend.dto.response.ProviderProfileResponse;
import com.geekkulcha.backend.entity.ProviderProfile;
import com.geekkulcha.backend.entity.ProviderService;
import com.geekkulcha.backend.entity.User;
import com.geekkulcha.backend.exception.ResourceNotFoundException;
import com.geekkulcha.backend.repository.ProviderProfileRepository;
import com.geekkulcha.backend.repository.ProviderServiceRepository;
import com.geekkulcha.backend.repository.ServiceRepository;
import com.geekkulcha.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/** Self-service provider profile management — ProviderOnboarding.jsx / ProviderProfileEdit.jsx. */
@Service
@RequiredArgsConstructor
public class ProviderProfileService {

    private final ProviderProfileRepository providerProfileRepository;
    private final ProviderServiceRepository providerServiceRepository;
    private final ServiceRepository serviceRepository;
    private final ProviderMatchService providerMatchService;
    private final UserRepository userRepository;
    private final CheckIdService checkIdService;

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

    @Transactional
    public ProviderProfileResponse createForCurrentUser(
                Long userId,
                CreateProviderProfileDto dto
    ) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        if (providerProfileRepository.existsByUserId(userId)) {
                throw new RuntimeException("User is already a provider");
        }

        boolean valid = checkIdService.validateId(dto.getIdNumber());

        if (!valid) {
        throw new IllegalArgumentException("Invalid South African ID number");
        }
        
        // 3. Only create provider AFTER successful validation
        ProviderProfile profile = new ProviderProfile();

        profile.setUser(user);
        profile.setBio(dto.getBio());
        profile.setLocation(dto.getLocation());

        profile.setServiceRadiusKm(
                dto.getServiceRadiusKm() == null
                        ? 0
                        : dto.getServiceRadiusKm()
        );

        profile.setAvailableToday(dto.isAvailableToday());

        // CheckID passed
        profile.setIdValidated(true);

        providerProfileRepository.save(profile);

        return getOwnProfileResponse(userId);
    }
}
