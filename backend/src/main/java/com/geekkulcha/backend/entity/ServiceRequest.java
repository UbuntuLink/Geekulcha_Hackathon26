package com.geekkulcha.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

/** A customer's free-text problem, once classified. Figma screens 4-6. */
@Entity
@Table(name = "service_request")
@Getter
@Setter
@NoArgsConstructor
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne(optional = false)
    private User user;

    @ManyToOne
    private Service service;

    // Set when the customer taps "Request a quote" on a specific provider's profile (Figma
    // screens 8-9) — highlights this request in that provider's feed, but doesn't restrict who
    // else can quote on it. Nullable: a request may have no preferred provider yet.
    @ManyToOne
    private ProviderProfile preferredProvider;

    @Column(length = 2000)
    private String description;

    // Raw AI classifier output, kept for audit / re-use instead of re-calling the model. See PROJECT.md §9f.
    @Column(length = 2000)
    private String aiClassificationRaw;

    @Lob
    @Column(name = "photo_data_url")
    private String photoDataUrl;

    private String photoName;

    private String location;

    private LocalDate preferredDate;

    @Enumerated(EnumType.STRING)
    private RequestStatus status = RequestStatus.OPEN;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
