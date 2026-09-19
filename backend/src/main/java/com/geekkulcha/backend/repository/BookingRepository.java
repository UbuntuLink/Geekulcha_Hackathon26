package com.geekkulcha.backend.repository;

import com.geekkulcha.backend.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByQuoteId(long quoteId);

    // Booking -> Quote -> ProviderProfile -> User.id — the provider's own bookings
    List<Booking> findByQuote_ProviderProfile_User_Id(long userId);
}
