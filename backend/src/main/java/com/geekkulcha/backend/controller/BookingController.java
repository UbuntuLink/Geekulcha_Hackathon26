package com.geekkulcha.backend.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.geekkulcha.backend.entity.Booking;
import com.geekkulcha.backend.entity.BookingStatus;
import com.geekkulcha.backend.service.BookingService;
import com.geekkulcha.backend.service.UserService;

import lombok.RequiredArgsConstructor;

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
    public Booking getById(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        long userId = userService.getCurrentUser(jwt).getId();
        return bookingService.getByIdForParticipant(id, userId);
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
