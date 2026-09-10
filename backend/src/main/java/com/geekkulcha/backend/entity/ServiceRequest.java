package com.geekkulcha.backend.entity;

import java.util.Date;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity 
public class ServiceRequest {
    @Id 
    @GeneratedValue ( strategy=GenerationType.IDENTITY )
    private Long id;

    @JoinColumn ( name="user_id" )
    @ManyToOne
    private User user;

    @JoinColumn ( name="service_id" )
    @ManyToOne
    private Service service;

    @JoinColumn ( name="task_size_id" )
    @ManyToOne
    private ServiceTaskSize serviceTaskSize;

    private String description;

    private String location;

    private Date preferredDate;

    private String status;

    private Date createdAt;

}
