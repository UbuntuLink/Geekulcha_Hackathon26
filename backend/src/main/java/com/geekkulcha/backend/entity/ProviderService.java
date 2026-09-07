package com.geekkulcha.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;

@Entity 
public class ProviderService {
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private long id;

    private double price;

    @ManyToOne
    private Provider provider;

    @ManyToOne
    private Service service;
}
