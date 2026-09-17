package com.geekkulcha.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity 
public class ProviderServicePrice {
    @Id 
    @GeneratedValue ( strategy=GenerationType.IDENTITY )
    private Long id;

    @ManyToOne 
    @JoinColumn (name = "provider_service_id")
    private ProviderService providerService;

    @ManyToOne 
    @JoinColumn (name = "task_size_id")
    private ServiceTaskSize serviceTaskSize;

    private Double minimumPrice;

    private Double maximumPrice;
}
