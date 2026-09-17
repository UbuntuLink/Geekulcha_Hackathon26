package com.geekkulcha.backend.service;

import com.geekkulcha.backend.dto.response.ServiceResponse;
import com.geekkulcha.backend.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceCatalogService {

    private final ServiceRepository serviceRepository;

    public List<ServiceResponse> listAll() {
        return serviceRepository.findAll().stream()
                .map(s -> new ServiceResponse(s.getId(), s.getName(), s.getDescription()))
                .toList();
    }
}
