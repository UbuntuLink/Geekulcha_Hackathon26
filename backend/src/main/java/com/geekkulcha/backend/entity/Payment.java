package com.geekkulcha.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * MVP-only mock payment record — no real processor is integrated.
 * Written by WalletService when a customer pays for a completed job from their balance.
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

    // Wallet payments (see WalletService). Nullable: older rows predate them. Amounts in cents.
    @Column(length = 32, unique = true)
    private String reference;

    private Long platformFeeCents;

    private Long providerAmountCents;

    /** BALANCE (customer confirmed) or AUTO_PAY. */
    @Column(length = 12)
    private String method;

    private Instant paidAt;
}
