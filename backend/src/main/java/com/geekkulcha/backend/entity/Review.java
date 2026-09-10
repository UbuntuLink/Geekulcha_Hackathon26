package com.geekkulcha.backend.entity;

import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

@Entity 
public class Review {
    @Id 
    @GeneratedValue ( strategy=GenerationType.IDENTITY )
    private Long id;

    @JoinColumn ( name="booking_id" )
    @OneToOne 
    private Booking booking;

    private Double rating;

    private String comment;

    private Date createdAt;
}
