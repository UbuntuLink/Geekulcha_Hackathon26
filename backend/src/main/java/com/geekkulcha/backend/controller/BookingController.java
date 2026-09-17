package com.geekkulcha.backend.controller;

import com.geekkulcha.backend.entity.Booking;
import com.geekkulcha.backend.entity.BookingStatus;
import com.geekkulcha.backend.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;

/** Figma screens 10-11: Booking Confirmation + Booking Tracking. */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    public record AcceptQuoteRequest(LocalDate scheduledDate, LocalTime scheduledTime) {
    }

    @PostMapping("/accept-quote/{quoteId}")
    public Booking acceptQuote(@PathVariable long quoteId, @RequestBody AcceptQuoteRequest request) {
        return bookingService.acceptQuote(quoteId, request.scheduledDate(), request.scheduledTime());
    }

    @GetMapping("/{id}")
    public Booking getById(@PathVariable long id) {
        return bookingService.getById(id);
    }

    @PatchMapping("/{id}/status")
    public Booking updateStatus(@PathVariable long id, @RequestParam BookingStatus status) {
        return bookingService.updateStatus(id, status);
    }
}
