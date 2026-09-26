package com.geekkulcha.backend.service;

import com.geekkulcha.backend.dto.request.QuoteCreateRequest;
import com.geekkulcha.backend.entity.ProviderProfile;
import com.geekkulcha.backend.entity.Quote;
import com.geekkulcha.backend.entity.QuoteStatus;
import com.geekkulcha.backend.entity.RequestStatus;
import com.geekkulcha.backend.exception.ForbiddenException;
import com.geekkulcha.backend.exception.ResourceNotFoundException;
import com.geekkulcha.backend.repository.QuoteRepository;
import com.geekkulcha.backend.repository.ServiceRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QuoteService {

    private final QuoteRepository quoteRepository;
    private final ServiceRequestRepository serviceRequestRepository;

    @Transactional
    public Quote create(ProviderProfile provider, QuoteCreateRequest request) {
        var serviceRequest = serviceRequestRepository
            .findByIdForUpdate(request.serviceRequestId())
            .orElseThrow(() -> new ResourceNotFoundException(
                    "Service request " + request.serviceRequestId() + " not found"
            ));

        if (serviceRequest.getStatus() != RequestStatus.OPEN
                && serviceRequest.getStatus() != RequestStatus.QUOTED) {
            throw new IllegalStateException(
                    "This request is no longer accepting quotes."
            );
        }

        Quote quote = new Quote();
        quote.setServiceRequest(serviceRequest);
        quote.setProviderProfile(provider);
        quote.setAmount(request.amount());
        quote.setMessage(request.message());
        quote.setStatus(QuoteStatus.PENDING);
        quote.setCreatedAt(Instant.now());

        serviceRequest.setStatus(RequestStatus.QUOTED);
        serviceRequestRepository.save(serviceRequest);

        return quoteRepository.save(quote);
    }

    public Quote getById(long id) {
        return quoteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quote " + id + " not found"));
    }

    /** Quotes a customer has received on one of their requests. */
    public List<Quote> findForServiceRequest(long serviceRequestId, long currentUserId) {
        var serviceRequest = serviceRequestRepository.findById(serviceRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("Service request " + serviceRequestId + " not found"));
        if (serviceRequest.getUser().getId() != currentUserId) {
            throw new ForbiddenException("You don't own this service request");
        }
        return quoteRepository.findByServiceRequestId(serviceRequestId);
    }

    @Transactional
    public Quote reject(long quoteId, long currentUserId) {
        Quote quote = getById(quoteId);
        var serviceRequest = quote.getServiceRequest();
        if (serviceRequest.getUser().getId() != currentUserId) {
            throw new ForbiddenException("You don't own this service request");
        }
        quote.setStatus(QuoteStatus.REJECTED);
        quoteRepository.save(quote);

        // Reopen the request if that was its last pending quote — otherwise it's stuck at
        // QUOTED forever with nothing pending, and invisible in the provider feed (§open only
        // shows OPEN), so no one else could ever quote on it again.
        boolean stillHasPending = quoteRepository.findByServiceRequestId(serviceRequest.getId()).stream()
                .anyMatch(q -> q.getStatus() == QuoteStatus.PENDING);
        if (!stillHasPending && serviceRequest.getStatus() == RequestStatus.QUOTED) {
            serviceRequest.setStatus(RequestStatus.OPEN);
            serviceRequestRepository.save(serviceRequest);
        }

        return quote;
    }
}
