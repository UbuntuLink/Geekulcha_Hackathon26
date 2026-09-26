package com.geekkulcha.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

/** A confirmed job, created once a {@link Quote} is accepted. Figma screens 10-11. */
@Entity
@Table(name = "booking")
@Getter
@Setter
@NoArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @OneToOne(optional = false)
    private Quote quote;

    private LocalDate scheduledDate;

    private LocalTime scheduledTime;

    @Enumerated(EnumType.STRING)
    private BookingStatus status = BookingStatus.REQUEST_SENT;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    // Read-only view of the review left on this booking, if any, so the booking screens can show
    // it and ReviewProvider.jsx can tell the booking has already been reviewed.
    @OneToOne(mappedBy = "booking")
    @JsonIgnoreProperties("booking")
    private Review review;
}
