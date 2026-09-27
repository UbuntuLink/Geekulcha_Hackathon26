package com.geekkulcha.backend.controller;

import com.geekkulcha.backend.dto.response.BookingEventResponse;
import com.geekkulcha.backend.entity.Booking;
import com.geekkulcha.backend.entity.BookingStatus;
import com.geekkulcha.backend.service.BookingService;
import com.geekkulcha.backend.service.UserService;
import com.geekkulcha.backend.service.WalletService;
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
    private final WalletService walletService;

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
        return bookingService.getForParticipant(id, userService.getCurrentUser(jwt).getId());
    }

    /** Work tracker: the provider moves the job forward; either side can cancel (see BookingService). */
    @PatchMapping("/{id}/status")
    public Booking updateStatus(@AuthenticationPrincipal Jwt jwt, @PathVariable long id,
                                 @RequestParam BookingStatus status,
                                 @RequestParam(required = false) String note) {
        long userId = userService.getCurrentUser(jwt).getId();
        Booking updated = bookingService.updateStatus(id, status, note, userId);
        if (updated.getStatus() == BookingStatus.AWAITING_PAYMENT) {
            // Pays straight away if the customer has auto-pay on and enough balance; otherwise tells them.
            walletService.afterWorkDone(id);
            return bookingService.getById(id);
        }
        return updated;
    }

    /** Every status change on the booking, oldest first, for the tracker timeline. */
    @GetMapping("/{id}/timeline")
    public List<BookingEventResponse> timeline(@AuthenticationPrincipal Jwt jwt, @PathVariable long id) {
        return bookingService.timeline(id, userService.getCurrentUser(jwt).getId());
    }

    /** The signed-in customer's bookings — lets "My requests" open each booked job's tracker. */
    @GetMapping("/as-customer")
    public List<Booking> asCustomer(@AuthenticationPrincipal Jwt jwt) {
        return bookingService.findByCustomer(userService.getCurrentUser(jwt).getId());
    }

    /** Provider's own bookings — backs ProviderBookings.jsx. */
    @GetMapping("/mine")
    public List<Booking> mine(@AuthenticationPrincipal Jwt jwt) {
        return bookingService.findByProvider(userService.getCurrentUser(jwt).getId());
    }
}
