package com.geekkulcha.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** One message in a {@link Conversation}. SYSTEM messages (e.g. "rated you 5★") have no sender. */
@Entity
@Table(name = "message", indexes = @Index(columnList = "conversation_id, id"))
@Getter
@Setter
@NoArgsConstructor
public class Message {

    public enum Kind { TEXT, SYSTEM }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    private User sender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Kind kind = Kind.TEXT;

    @Column(nullable = false, length = 2000)
    private String body;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
