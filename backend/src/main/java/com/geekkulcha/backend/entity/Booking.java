package com.geekkulcha.backend.entity;

import java.time.LocalTime;
import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

@Entity 
public class Booking {
    @Id 
    @GeneratedValue ( strategy=GenerationType.IDENTITY )
    private Long id;

    @JoinColumn ( name="service_request_id" )
    @OneToOne
    private ServiceRequest serviceRequest;

    @JoinColumn ( name="quote_id" )
    @OneToOne 
    private Quote quote;

    private Date scheduledDate;
    
    private LocalTime scheduledTime;

    private String status;

    private Date createdAt;
}
