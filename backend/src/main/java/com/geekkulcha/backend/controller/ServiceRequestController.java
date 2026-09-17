package com.geekkulcha.backend.controller;

import com.geekkulcha.backend.dto.request.ServiceRequestCreateRequest;
import com.geekkulcha.backend.entity.ServiceRequest;
import com.geekkulcha.backend.service.ServiceRequestService;
import com.geekkulcha.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Figma screen 4: "Describe Your Problem". */
@RestController
@RequestMapping("/api/service-requests")
@RequiredArgsConstructor
public class ServiceRequestController {

    private final ServiceRequestService serviceRequestService;
    private final UserService userService;

    @PostMapping
    public ServiceRequest create(@Valid @RequestBody ServiceRequestCreateRequest request) {
        // Auth is disabled for now (PROJECT.md §8) — attribute every request to a fixed demo
        // customer. Swap for the real @AuthenticationPrincipal OidcUser once Google login is back.
        var customer = userService.getDemoCustomer();
        return serviceRequestService.create(customer, request);
    }

    @GetMapping("/{id}")
    public ServiceRequest getById(@PathVariable long id) {
        return serviceRequestService.getById(id);
    }

    @GetMapping("/mine")
    public List<ServiceRequest> mine() {
        return serviceRequestService.findByUser(userService.getDemoCustomer().getId());
    }
}
