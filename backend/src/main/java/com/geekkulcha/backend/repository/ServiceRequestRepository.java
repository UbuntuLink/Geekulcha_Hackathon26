package com.geekkulcha.backend.repository;

import com.geekkulcha.backend.entity.RequestStatus;
import com.geekkulcha.backend.entity.ServiceRequest;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.geekkulcha.backend.dto.response.QuoteRequestInboxResponse;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ServiceRequestRepository
        extends JpaRepository<ServiceRequest, Long> {

    List<ServiceRequest> findByUserId(long userId);

    List<ServiceRequest> findByStatus(RequestStatus status);

    List<ServiceRequest> findByStatusIn(Collection<RequestStatus> statuses);

    /** Requests a customer sent to this provider that can still be quoted on, newest first. */
    @Query("select new com.geekkulcha.backend.dto.response.QuoteRequestInboxResponse("
            + "r.id, r.description, r.location, s.name, r.status, r.createdAt, u.firstName) "
            + "from ServiceRequest r left join r.service s join r.user u "
            + "where r.preferredProvider.id = :providerProfileId and r.status in :statuses "
            + "order by r.createdAt desc")
    List<QuoteRequestInboxResponse> findInboxForProvider(@Param("providerProfileId") long providerProfileId,
                                                         @Param("statuses") Collection<RequestStatus> statuses);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from ServiceRequest r where r.id = :id")
    Optional<ServiceRequest> findByIdForUpdate(@Param("id") long id);
}