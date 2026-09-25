package com.geekkulcha.backend.entity;

import org.hibernate.annotations.ColumnDefault;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * The provider-facing extension of a {@link User}. Existing = "this user is a provider".
 *
 * NOTE: this table already has real rows in the shared Supabase DB predating some of these
 * columns — every NOT NULL primitive here needs @ColumnDefault so `ddl-auto=update` can add it
 * (Postgres refuses to add a NOT NULL column with no default to a table that already has rows).
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

    @ColumnDefault("false")
    private boolean idValidated = false;

    private String bio;

    // TODO(9b): plain text for MVP; real "nearby" matching needs lat/long, see PROJECT.md §9b
    private String location;

    // Nullable wrappers, not primitives: null means "this row predates the location picker", and
    // every distance calculation falls back to today's behaviour rather than pretending the
    // provider sits at 0,0 off the coast of Africa. ddl-auto=update adds the columns on boot.
    private Double latitude;

    private Double longitude;

    @ColumnDefault("0")
    private int serviceRadiusKm;

    @ColumnDefault("0")
    private double rating;

    // Denormalized MVP stand-ins (avoid a real reviews-join / availability-calendar build, see
    // PROJECT.md §9a/§9e): reviewCount mirrors Review rows for this provider, availableToday is
    // a manually-set flag rather than a real calendar.
    @ColumnDefault("0")
    private int reviewCount;

    @ColumnDefault("true")
    private boolean availableToday = true;
}
