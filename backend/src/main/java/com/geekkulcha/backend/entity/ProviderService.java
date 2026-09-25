package com.geekkulcha.backend.entity;

import org.hibernate.annotations.ColumnDefault;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A service a given provider offers, and what they charge for it.
 *
 * NOTE: this table already has real rows in the shared Supabase DB predating minPrice/maxPrice
 * — @ColumnDefault lets `ddl-auto=update` add them as NOT NULL anyway (see ProviderProfile).
 */
@Entity
@Table(name = "provider_service")
@Getter
@Setter
@NoArgsConstructor
public class ProviderService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne(optional = false)
    private ProviderProfile providerProfile;

    @ManyToOne(optional = false)
    private Service service;


    // A flat range rather than the DrawSQL design's separate task-size-keyed price table
    // (provider_service_price / service_task_size, see PROJECT.md §3b) — good enough to match
    // the Figma price-range display without building task sizing for the MVP.
    @ColumnDefault("0")
    private double minPrice;

    @ColumnDefault("0")
    private double maxPrice;
}
