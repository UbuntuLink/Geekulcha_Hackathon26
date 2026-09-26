package com.geekkulcha.backend.service;

import com.geekkulcha.backend.dto.request.ServiceRequestCreateRequest;
import com.geekkulcha.backend.entity.RequestStatus;
import com.geekkulcha.backend.entity.ServiceRequest;
import com.geekkulcha.backend.entity.User;
import com.geekkulcha.backend.exception.ForbiddenException;
import com.geekkulcha.backend.exception.ResourceNotFoundException;
import com.geekkulcha.backend.repository.ProviderProfileRepository;
import com.geekkulcha.backend.repository.ServiceRepository;
import com.geekkulcha.backend.repository.ServiceRequestRepository;
import com.geekkulcha.backend.repository.QuoteRepository;
import com.geekkulcha.backend.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * The AI classification call (python/app/routers/classification.py) happens on the frontend
 * before this is hit — see api/services.js classifyMessage(). This just persists the result.
 */
@Service
@RequiredArgsConstructor
public class ServiceRequestService {

    private final ServiceRequestRepository serviceRequestRepository;
    private final ServiceRepository serviceRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final QuoteRepository quoteRepository;
    private final BookingRepository bookingRepository;

    public ServiceRequest create(User customer, ServiceRequestCreateRequest request) {
        ServiceRequest serviceRequest = new ServiceRequest();
        serviceRequest.setUser(customer);
        serviceRequest.setDescription(request.description());
        serviceRequest.setLocation(request.location());
        serviceRequest.setLatitude(request.latitude());
        serviceRequest.setLongitude(request.longitude());
        serviceRequest.setPreferredDate(request.preferredDate());
        serviceRequest.setAiClassificationRaw(request.aiClassificationRaw());
        serviceRequest.setPhotoDataUrl(request.photoDataUrl());
        serviceRequest.setPhotoName(request.photoName());
        serviceRequest.setStatus(RequestStatus.OPEN);
        serviceRequest.setCreatedAt(Instant.now());

        if (request.serviceId() != null) {
            serviceRepository.findById(request.serviceId()).ifPresent(serviceRequest::setService);
        }

        return serviceRequestRepository.save(serviceRequest);
    }

    public ServiceRequest getById(long id) {
        return serviceRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service request " + id + " not found"));
    }

    public List<ServiceRequest> findByUser(long userId) {
        return serviceRequestRepository.findByUserId(userId);
    }

    /** Provider's Requests Feed — every open request, not scoped to any one provider. */
    public List<ServiceRequest> findOpen() {
        return serviceRequestRepository.findByStatus(RequestStatus.OPEN);
    }

    public ServiceRequest setPreferredProvider(long id, long providerProfileId, long currentUserId) {
        ServiceRequest serviceRequest = getById(id);
        requireOwner(serviceRequest, currentUserId);

        var provider = providerProfileRepository.findById(providerProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider " + providerProfileId + " not found"));
        serviceRequest.setPreferredProvider(provider);
        return serviceRequestRepository.save(serviceRequest);
    }

    public void requireOwner(ServiceRequest serviceRequest, long currentUserId) {
        if (serviceRequest.getUser().getId() != currentUserId) {
            throw new ForbiddenException("You don't own this service request");
        }
    }

    @Transactional
    public void delete(long id, long currentUserId) {
        ServiceRequest request = serviceRequestRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Service request " + id + " not found"
                ));

        requireOwner(request, currentUserId);

        if ((request.getStatus() != RequestStatus.OPEN
                && request.getStatus() != RequestStatus.QUOTED)
                || bookingRepository.existsByQuote_ServiceRequest_Id(id)) {
            throw new IllegalStateException(
                    "Requests with bookings or closed requests cannot be deleted."
            );
        }

        // Remove dependent quotes before removing the request.
        quoteRepository.deleteAll(
                quoteRepository.findByServiceRequestId(id)
        );
        quoteRepository.flush();

        serviceRequestRepository.delete(request);
        serviceRequestRepository.flush();
    }
}
