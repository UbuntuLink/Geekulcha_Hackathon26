package com.geekkulcha.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A message thread between one customer and one provider. There is only ever one per pair, so the
 * same thread carries on from a quote to a booking to a review.
 *
 * Each side's lastReadAt drives its unread count: messages newer than it, from the other side
 * (or from the system), are unread. The last message is copied here so the inbox can list
 * conversations without reading their messages.
 */
@Entity
@Table(name = "conversation",
        uniqueConstraints = @UniqueConstraint(columnNames = {"customer_id", "provider_id"}))
@Getter
@Setter
@NoArgsConstructor
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne(optional = false)
    private User customer;

    @ManyToOne(optional = false)
    private ProviderProfile provider;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant lastMessageAt;

    @Column(length = 140)
    private String lastMessagePreview;

    private Instant customerLastReadAt;

    private Instant providerLastReadAt;
}
