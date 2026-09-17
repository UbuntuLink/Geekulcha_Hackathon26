package com.geekkulcha.backend.repository;

import com.geekkulcha.backend.entity.RequestStatus;
import com.geekkulcha.backend.entity.ServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {
    List<ServiceRequest> findByUserId(long userId);
    List<ServiceRequest> findByStatus(RequestStatus status);
}
