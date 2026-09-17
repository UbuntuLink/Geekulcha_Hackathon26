package com.geekkulcha.backend.controller;

import com.geekkulcha.backend.dto.response.ServiceResponse;
import com.geekkulcha.backend.service.ServiceCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceController {

    private final ServiceCatalogService serviceCatalogService;

    @GetMapping
    public List<ServiceResponse> listServices() {
        return serviceCatalogService.listAll();
    }
}
