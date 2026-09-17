package com.geekkulcha.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** A provider's response to a {@link ServiceRequest}. Figma screens 8-9. */
@Entity
@Table(name = "quote")
@Getter
@Setter
@NoArgsConstructor
public class Quote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne(optional = false)
    private ServiceRequest serviceRequest;

    @ManyToOne(optional = false)
    private ProviderProfile providerProfile;

    private double amount;

    @Column(length = 1000)
    private String message;

    @Enumerated(EnumType.STRING)
    private QuoteStatus status = QuoteStatus.PENDING;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
