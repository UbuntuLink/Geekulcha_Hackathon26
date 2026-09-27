package com.geekkulcha.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A user's in-app balance. Customers top it up and pay completed jobs from it; providers are paid
 * into it and withdraw from it. No real money: it's numbers in our database.
 *
 * The balance is the sum of the wallet's {@link WalletEntry} rows, cached here and only ever
 * changed in the same transaction that writes an entry (see WalletService). Amounts are in cents.
 */
@Entity
@Table(name = "wallet")
@Getter
@Setter
@NoArgsConstructor
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @OneToOne(optional = false)
    @JoinColumn(unique = true)
    private User user;

    @Column(nullable = false)
    private long balanceCents;

    /** Pay jobs automatically when the provider marks them done, if the balance covers it. */
    @Column(nullable = false)
    private boolean autoPay;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
