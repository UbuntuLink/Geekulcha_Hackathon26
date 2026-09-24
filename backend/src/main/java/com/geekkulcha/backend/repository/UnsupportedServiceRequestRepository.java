package com.geekkulcha.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.geekkulcha.backend.entity.UnsupportedServiceRequest;

public interface UnsupportedServiceRequestRepository
        extends JpaRepository<UnsupportedServiceRequest, Long> {
}
