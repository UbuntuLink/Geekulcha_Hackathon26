package com.geekkulcha.backend.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.geekkulcha.backend.service.CheckIdService;

@RestController
@RequestMapping("/api/debug")
public class IdDebugController {

    private final CheckIdService checkIdService;

    public IdDebugController(CheckIdService checkIdService) {
        this.checkIdService = checkIdService;
    }

    @PostMapping("/validate-id")
    public boolean validate(@RequestBody IdValidationRequest request) {
        return checkIdService.validateId(request.idNumber());
    }

    public record IdValidationRequest(String idNumber) {}
    }