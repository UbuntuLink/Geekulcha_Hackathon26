package com.geekkulcha.backend.entity;

import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity 
public class Quote {
    @Id 
    @GeneratedValue ( strategy=GenerationType.IDENTITY )
    private Long id;

    @JoinColumn (name="service_request_id")
    @ManyToOne 
    private ServiceRequest serviceRequest;

    @JoinColumn ( name="provide_profile_id" )
    @ManyToOne
    private ProviderProfile providerProfile;

    private Double amount;

    private String message;

    private String status;

    private Date createdAt;
}
