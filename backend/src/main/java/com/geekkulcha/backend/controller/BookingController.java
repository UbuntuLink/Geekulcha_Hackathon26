package com.geekkulcha.backend.controller;

import com.geekkulcha.backend.entity.Booking;
import com.geekkulcha.backend.entity.BookingStatus;
import com.geekkulcha.backend.service.BookingService;
import com.geekkulcha.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/** Figma screens 10-11: Booking Confirmation + Booking Tracking. */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final UserService userService;

    public record AcceptQuoteRequest(LocalDate scheduledDate, LocalTime scheduledTime) {
    }

    @PostMapping("/accept-quote/{quoteId}")
    public Booking acceptQuote(@AuthenticationPrincipal Jwt jwt, @PathVariable long quoteId,
                                @RequestBody AcceptQuoteRequest request) {
        long userId = userService.getCurrentUser(jwt).getId();
        return bookingService.acceptQuote(quoteId, request.scheduledDate(), request.scheduledTime(), userId);
    }

    @GetMapping("/{id}")
    public Booking getById(@PathVariable long id) {
        return bookingService.getById(id);
    }

    @PatchMapping("/{id}/status")
    public Booking updateStatus(@AuthenticationPrincipal Jwt jwt, @PathVariable long id,
                                 @RequestParam BookingStatus status) {
        long userId = userService.getCurrentUser(jwt).getId();
        return bookingService.updateStatus(id, status, userId);
    }

    /** Provider's own bookings — backs ProviderBookings.jsx. */
    @GetMapping("/mine")
    public List<Booking> mine(@AuthenticationPrincipal Jwt jwt) {
        return bookingService.findByProvider(userService.getCurrentUser(jwt).getId());
    }
}
