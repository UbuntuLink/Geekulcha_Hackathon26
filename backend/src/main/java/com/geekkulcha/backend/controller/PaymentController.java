package com.geekkulcha.backend.controller;

import com.geekkulcha.backend.entity.Payment;
import com.geekkulcha.backend.payment.MockPaymentService;
import com.geekkulcha.backend.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/** MVP mock checkout — see MockPaymentService and PROJECT.md §9c / §10. */
@RestController
@RequestMapping("/api/bookings/{bookingId}/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final MockPaymentService mockPaymentService;
    private final BookingService bookingService;

    @PostMapping("/mock-charge")
    public Payment charge(@PathVariable long bookingId, @RequestParam double amount) {
        var booking = bookingService.getById(bookingId);
        return mockPaymentService.charge(booking, amount);
    }
}
