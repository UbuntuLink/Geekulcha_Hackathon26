package com.geekkulcha.backend.repository;

import com.geekkulcha.backend.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByQuoteId(long quoteId);
}
