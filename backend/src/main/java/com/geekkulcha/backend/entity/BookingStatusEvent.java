package com.geekkulcha.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * One step in a booking's work history: what it moved to, who moved it, when, and an optional
 * note ("Running 15 minutes late", "Needed a replacement part"). The work tracker is built from
 * these, so both sides see the same timeline.
 */
@Entity
@Table(name = "booking_status_event", indexes = @Index(columnList = "booking_id"))
@Getter
@Setter
@NoArgsConstructor
public class BookingStatusEvent {

    public enum Actor { CUSTOMER, PROVIDER }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Booking booking;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BookingStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Actor changedBy;

    @Column(length = 280)
    private String note;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
