package com.geekkulcha.backend.service;

import java.time.Instant;

import org.springframework.stereotype.Service;

import com.geekkulcha.backend.dto.request.UnsupportedServiceRequestCreateRequest;
import com.geekkulcha.backend.entity.UnsupportedServiceRequest;
import com.geekkulcha.backend.entity.User;
import com.geekkulcha.backend.repository.UnsupportedServiceRequestRepository;

@Service
public class UnsupportedServiceRequestService {

    private final UnsupportedServiceRequestRepository repository;

    public UnsupportedServiceRequestService(
            UnsupportedServiceRequestRepository repository
    ) {
        this.repository = repository;
    }

    public UnsupportedServiceRequest create(
            User customer,
            UnsupportedServiceRequestCreateRequest request
    ) {
        UnsupportedServiceRequest unsupported =
                new UnsupportedServiceRequest();

        unsupported.setUser(customer);
        unsupported.setDescription(request.description());
        unsupported.setAdvice(request.advice());
        unsupported.setCreatedAt(Instant.now());

        return repository.save(unsupported);
    }
}
