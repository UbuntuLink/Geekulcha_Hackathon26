package com.geekkulcha.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.geekkulcha.backend.entity.ProviderProfile;

public interface ProviderProfileRepository extends JpaRepository<ProviderProfile, Long> {
    Optional<ProviderProfile> findByUserId(long userId);
    boolean existsByUserId(long userId);
}
