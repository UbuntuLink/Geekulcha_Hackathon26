package com.geekkulcha.backend.payment;

import com.geekkulcha.backend.entity.Booking;
import com.geekkulcha.backend.entity.Payment;
import com.geekkulcha.backend.entity.PaymentStatus;
import com.geekkulcha.backend.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * MVP mock payment — no real processor (no Stripe/PayFast/etc). Always "succeeds" so the
 * booking flow can be demoed end to end. See PROJECT.md §9c / §10 for the real-payment gap.
 */
@Service
@RequiredArgsConstructor
public class MockPaymentService {

    private final PaymentRepository paymentRepository;

    public Payment charge(Booking booking, double amount) {
        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(amount);
        payment.setStatus(PaymentStatus.MOCK_PAID);
        payment.setCreatedAt(Instant.now());
        return paymentRepository.save(payment);
    }
}
