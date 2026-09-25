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
                        -25.7479,
                        28.2293,
                        LocalDate.now(),
                        "{\"category\":\"plumbing\"}",
                        null,
                        "data:image/png;base64,abc123",
                        "leak.png"
                )
        );

        assertEquals("data:image/png;base64,abc123", created.getPhotoDataUrl());
        assertEquals("leak.png", created.getPhotoName());
        // Coordinates from the location picker have to reach the row, or matching has nothing
        // to measure distance against.
        assertEquals(-25.7479, created.getLatitude());
        assertEquals(28.2293, created.getLongitude());
        verify(serviceRequestRepository).save(any(ServiceRequest.class));
    }
}
