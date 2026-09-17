package com.geekkulcha.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * MVP-only mock payment record — no real processor is integrated.
 * See {@link com.geekkulcha.backend.payment.MockPaymentService} and PROJECT.md §9c / §10.
 */
@Entity
@Table(name = "payment")
@Getter
@Setter
@NoArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @OneToOne(optional = false)
    private Booking booking;

    private double amount;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status = PaymentStatus.MOCK_PENDING;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
