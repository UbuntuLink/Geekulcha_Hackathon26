package com.geekkulcha.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.geekkulcha.backend.entity.BookingMessage;

public interface BookingMessageRepository extends JpaRepository<BookingMessage, Long> {
    List<BookingMessage> findByBookingIdOrderByCreatedAtAscIdAsc(long bookingId);
}