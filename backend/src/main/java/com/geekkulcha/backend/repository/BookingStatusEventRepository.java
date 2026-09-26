package com.geekkulcha.backend.repository;

import com.geekkulcha.backend.entity.BookingStatusEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingStatusEventRepository extends JpaRepository<BookingStatusEvent, Long> {
    List<BookingStatusEvent> findByBooking_IdOrderByCreatedAtAsc(long bookingId);
}
