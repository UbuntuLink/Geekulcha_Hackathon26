package com.geekkulcha.backend.repository;

import com.geekkulcha.backend.entity.ProviderService;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProviderServiceRepository extends JpaRepository<ProviderService, Long> {
    List<ProviderService> findByServiceId(long serviceId);
    List<ProviderService> findByProviderProfileId(long providerProfileId);
    Optional<ProviderService> findByProviderProfileIdAndServiceId(long providerProfileId, long serviceId);
    void deleteByProviderProfileIdAndServiceId(long providerProfileId, long serviceId);
}
