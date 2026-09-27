package com.geekkulcha.backend.repository;

import com.geekkulcha.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    // Review -> Booking -> Quote -> ProviderProfile.id (underscores disambiguate the nested path)
    List<Review> findByBooking_Quote_ProviderProfile_Id(long providerProfileId);

    boolean existsByBooking_Id(long bookingId);

    /**
     * A provider's reviews with everything the profile shows (booking, request, reviewer, service)
     * loaded in the same query. The plain finder above loads each review's booking separately — one
     * extra database round trip per review.
     */
    @Query("select r from Review r join fetch r.booking b join fetch b.quote q join fetch q.serviceRequest sr "
            + "join fetch sr.user left join fetch sr.service where q.providerProfile.id = :providerProfileId")
    List<Review> findWithDetailsByProviderProfileId(@Param("providerProfileId") long providerProfileId);

    /** Ids of every provider that has at least one review, in one query (startup seeding). */
    @Query("select distinct r.booking.quote.providerProfile.id from Review r")
    List<Long> findReviewedProviderProfileIds();
}
