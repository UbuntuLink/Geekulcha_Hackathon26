package com.geekkulcha.backend.entity;

import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;

@Entity 
public class ActualJobPrice {
    @Id 
    @GeneratedValue ( strategy=GenerationType.IDENTITY )
    private Long id;

    @JoinColumn ( name="booking_id" )
    @OneToOne
    private Booking booking;

    @JoinColumn ( name="task_size_id" )
    @ManyToOne
    private ServiceTaskSize serviceTaskSize;

    private Double actualPrice;

    private Date complatedAt;

}
