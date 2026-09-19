package com.geekkulcha.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A person with an account. Identity is email/password (Argon2-hashed) + JWT — see
 * AuthController/AuthService/JwtService and PROJECT.md §8.
 * A user is a "provider" iff a {@link ProviderProfile} row exists for them.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false, unique = true)
    private String email;

    // Never serialize this — entities are returned directly from several controllers (see
    // PROJECT.md §9g), and the hash has no business being in any API response.
    @JsonIgnore
    private String passwordHash;

    private String firstName;

    private String lastName;

    private String phoneNumber;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
