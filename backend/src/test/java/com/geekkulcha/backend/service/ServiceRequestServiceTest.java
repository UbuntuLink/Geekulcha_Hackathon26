package com.geekkulcha.backend.service;

import com.geekkulcha.backend.dto.request.ServiceRequestCreateRequest;
import com.geekkulcha.backend.entity.ServiceRequest;
import com.geekkulcha.backend.entity.User;
import com.geekkulcha.backend.repository.ProviderProfileRepository;
import com.geekkulcha.backend.repository.ServiceRepository;
import com.geekkulcha.backend.repository.ServiceRequestRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ServiceRequestServiceTest {

    @Test
    void createPersistsPhotoData() {
        ServiceRequestRepository serviceRequestRepository = mock(ServiceRequestRepository.class);
        ServiceRepository serviceRepository = mock(ServiceRepository.class);
        ProviderProfileRepository providerProfileRepository = mock(ProviderProfileRepository.class);
        ServiceRequestService serviceRequestService = new ServiceRequestService(
                serviceRequestRepository,
                serviceRepository,
                providerProfileRepository
        );

        User customer = new User();
        customer.setId(42L);

        when(serviceRequestRepository.save(any(ServiceRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ServiceRequest created = serviceRequestService.create(
                customer,
                new ServiceRequestCreateRequest(
                        "Sink is leaking",
                        "Pretoria",
                        LocalDate.now(),
                        "{\"category\":\"plumbing\"}",
                        null,
                        "data:image/png;base64,abc123",
                        "leak.png"
                )
        );

        assertEquals("data:image/png;base64,abc123", created.getPhotoDataUrl());
        assertEquals("leak.png", created.getPhotoName());
        verify(serviceRequestRepository).save(any(ServiceRequest.class));
    }
}
