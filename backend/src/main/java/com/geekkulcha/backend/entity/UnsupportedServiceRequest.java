package com.geekkulcha.backend.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;

@Entity 
public class UnsupportedServiceRequest {
    @Id 
    @GeneratedValue (strategy=GenerationType.IDENTITY)
    private Long id;

    @ManyToOne 
    private User user;


    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String advice;

    private Instant createdAt;

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getDescription() {
        return description;
    }

    public String getAdvice() {
        return advice;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setAdvice(String advice) {
        this.advice = advice;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
