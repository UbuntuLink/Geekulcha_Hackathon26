package com.geekkulcha.backend.repository;

import com.geekkulcha.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    // Review -> Booking -> Quote -> ProviderProfile.id (underscores disambiguate the nested path)
    List<Review> findByBooking_Quote_ProviderProfile_Id(long providerProfileId);
}
