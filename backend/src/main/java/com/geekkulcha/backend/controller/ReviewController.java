package com.geekkulcha.backend.controller;

import com.geekkulcha.backend.dto.request.ReviewCreateRequest;
import com.geekkulcha.backend.entity.Review;
import com.geekkulcha.backend.service.BookingService;
import com.geekkulcha.backend.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/** Figma screen 12: Review Provider. */
@RestController
@RequestMapping("/api/bookings/{bookingId}/review")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final BookingService bookingService;

    @PostMapping
    public Review create(@PathVariable long bookingId, @Valid @RequestBody ReviewCreateRequest request) {
        var booking = bookingService.getById(bookingId);
        return reviewService.create(booking, request);
    }
}
