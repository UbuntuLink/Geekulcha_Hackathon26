package com.geekkulcha.backend.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.geekkulcha.backend.dto.request.UnsupportedServiceRequestCreateRequest;
import com.geekkulcha.backend.entity.UnsupportedServiceRequest;
import com.geekkulcha.backend.service.UnsupportedServiceRequestService;
import com.geekkulcha.backend.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/unsupported-service-requests")
public class UnsupportedServiceRequestController {

    private final UnsupportedServiceRequestService service;
    private final UserService userService;

    public UnsupportedServiceRequestController(
            UnsupportedServiceRequestService service,
            UserService userService
    ) {
        this.service = service;
        this.userService = userService;
    }

    @PostMapping
    public UnsupportedServiceRequest create(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UnsupportedServiceRequestCreateRequest request
    ) {
        var customer = userService.getCurrentUser(jwt);

        return service.create(customer, request);
    }
}
