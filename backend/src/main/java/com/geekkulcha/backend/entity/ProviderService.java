package com.geekkulcha.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class ProviderService {
    
    @Id 
    @GeneratedValue (strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn (name = "provider_profile_id")
    private ProviderProfile providerProfile;

    @ManyToOne
    @JoinColumn (name = "service_id")
    private Service service;

    private Integer yearsExperience;

    public Integer getYearsExperience() {
        return yearsExperience;
    }

    public ProviderProfile getProviderProfile() {
        return providerProfile;
    }

    public Service getService() {
        return service;
    }

    public void setYearsExperience(Integer yearsExperience) {
        this.yearsExperience = yearsExperience;
    }

}
