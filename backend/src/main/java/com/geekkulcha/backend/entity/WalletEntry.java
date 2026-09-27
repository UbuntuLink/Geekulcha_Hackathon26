package com.geekkulcha.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * One line in a wallet's history. Entries are only ever added, never changed or deleted, so the
 * history always explains the balance. amountCents is positive for money in, negative for out.
 */
@Entity
@Table(name = "wallet_entry", indexes = @Index(columnList = "wallet_id, created_at"))
@Getter
@Setter
@NoArgsConstructor
public class WalletEntry {

    public enum Type { TOP_UP, JOB_PAYMENT, JOB_EARNING, WITHDRAWAL }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Wallet wallet;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Type type;

    @Column(nullable = false)
    private long amountCents;

    /** The job this entry is for, if any. */
    @ManyToOne(fetch = FetchType.LAZY)
    private Booking booking;

    @Column(nullable = false, length = 32)
    private String reference;

    @Column(nullable = false, length = 200)
    private String description;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
