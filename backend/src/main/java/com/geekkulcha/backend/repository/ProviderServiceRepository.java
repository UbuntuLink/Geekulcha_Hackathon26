package com.geekkulcha.backend.repository;

import com.geekkulcha.backend.entity.ProviderService;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProviderServiceRepository extends JpaRepository<ProviderService, Long> {
    List<ProviderService> findByServiceId(long serviceId);
    List<ProviderService> findByProviderProfileId(long providerProfileId);
}
