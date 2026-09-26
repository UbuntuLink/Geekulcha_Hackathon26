package com.geekkulcha.backend.repository;

import com.geekkulcha.backend.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByQuoteId(long quoteId);

    // Booking -> Quote -> ProviderProfile -> User.id — the provider's own bookings
    List<Booking> findByQuote_ProviderProfile_User_Id(long userId);

    // Booking -> Quote -> ServiceRequest -> User.id — the customer's own bookings
    List<Booking> findByQuote_ServiceRequest_User_Id(long userId);

    boolean existsByQuote_ServiceRequest_Id(long serviceRequestId);

    // Locks the booking while it is reviewed, so two submissions for the same booking can't both
    // pass the "already reviewed?" check.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Booking b where b.id = :id")
    Optional<Booking> findByIdForUpdate(@Param("id") long id);
}
