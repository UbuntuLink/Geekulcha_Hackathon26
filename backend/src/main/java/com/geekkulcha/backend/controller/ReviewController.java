package com.geekkulcha.backend.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.geekkulcha.backend.dto.request.ReviewCreateRequest;
import com.geekkulcha.backend.entity.Review;
import com.geekkulcha.backend.service.ReviewService;
import com.geekkulcha.backend.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Figma screen 12: Review Provider. */
@RestController
@RequestMapping("/api/bookings/{bookingId}/review")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final UserService userService;

    @PostMapping
    public Review create(@AuthenticationPrincipal Jwt jwt, @PathVariable long bookingId,
                         @Valid @RequestBody ReviewCreateRequest request) {
        return reviewService.create(bookingId, request, userService.getCurrentUser(jwt).getId());
    }
}
