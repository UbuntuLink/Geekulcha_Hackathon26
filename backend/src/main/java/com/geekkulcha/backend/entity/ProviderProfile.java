package com.geekkulcha.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * The provider-facing extension of a {@link User}. Existing = "this user is a provider".
 */
@Entity
@Table(name = "provider_profile")
@Getter
@Setter
@NoArgsConstructor
public class ProviderProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String bio;

    // TODO(9b): plain text for MVP; real "nearby" matching needs lat/long, see PROJECT.md §9b
    private String location;

    private int serviceRadiusKm;

    private double rating;

    // Denormalized MVP stand-ins (avoid a real reviews-join / availability-calendar build, see
    // PROJECT.md §9a/§9e): reviewCount mirrors Review rows for this provider, availableToday is
    // a manually-set flag rather than a real calendar.
    private int reviewCount;

    private boolean availableToday = true;
}
