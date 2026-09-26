package com.geekkulcha.backend.repository;

import com.geekkulcha.backend.entity.RequestStatus;
import com.geekkulcha.backend.entity.ServiceRequest;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ServiceRequestRepository
        extends JpaRepository<ServiceRequest, Long> {

    List<ServiceRequest> findByUserId(long userId);

    List<ServiceRequest> findByStatus(RequestStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from ServiceRequest r where r.id = :id")
    Optional<ServiceRequest> findByIdForUpdate(@Param("id") long id);
}