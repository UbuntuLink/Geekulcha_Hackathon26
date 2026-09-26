package com.geekkulcha.backend.service;

import com.geekkulcha.backend.dto.request.ReviewCreateRequest;
import com.geekkulcha.backend.entity.Booking;
import com.geekkulcha.backend.entity.BookingStatus;
import com.geekkulcha.backend.entity.ProviderProfile;
import com.geekkulcha.backend.entity.Review;
import com.geekkulcha.backend.exception.ForbiddenException;
import com.geekkulcha.backend.exception.ResourceNotFoundException;
import com.geekkulcha.backend.repository.BookingRepository;
import com.geekkulcha.backend.repository.ProviderProfileRepository;
import com.geekkulcha.backend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/** TODO (§9e): one-directional only — no provider -> customer review path yet. */
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final ProviderProfileRepository providerProfileRepository;

    /**
     * Records a customer's review of a completed booking and updates the provider's rating.
     *
     * Only the customer who made the booking can review it, only once it is COMPLETED, and only
     * once. The booking row is locked for the check-then-insert, and the provider row for the
     * rating recompute, so concurrent submissions can neither double-review a booking nor lose an
     * update to the provider's average.
     */
    @Transactional
    public Review create(long bookingId, ReviewCreateRequest request, long currentUserId) {
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking " + bookingId + " not found"));

        if (booking.getQuote().getServiceRequest().getUser().getId() != currentUserId) {
            throw new ForbiddenException("Only the customer who made this booking can review it.");
        }
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new IllegalArgumentException(
                    "You can review this booking once the provider has marked it as completed.");
        }
        // IllegalStateException maps to 409, which ReviewProvider.jsx reads as "already reviewed".
        if (reviewRepository.existsByBooking_Id(bookingId)) {
            throw new IllegalStateException("A review has already been submitted for this booking.");
        }

        Review review = new Review();
        review.setBooking(booking);
        review.setRating(request.rating());
        String comment = request.comment() == null ? "" : request.comment().trim();
        review.setComment(comment.isEmpty() ? null : comment);
        review.setCreatedAt(Instant.now());
        Review saved = reviewRepository.save(review);

        recalculateRating(booking.getQuote().getProviderProfile().getId());
        return saved;
    }

    /**
     * Sets the provider's rating and review count from their actual Review rows. Recomputing
     * from the rows, rather than nudging a running average, means the stored figure can't drift
     * from the reviews shown on the provider's profile.
     */
    private void recalculateRating(long providerProfileId) {
        ProviderProfile profile = providerProfileRepository.findByIdForUpdate(providerProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider " + providerProfileId + " not found"));

        List<Review> reviews = reviewRepository.findByBooking_Quote_ProviderProfile_Id(providerProfileId);
        double average = reviews.stream().mapToInt(Review::getRating).average().orElse(0);

        profile.setRating(Math.round(average * 10) / 10.0);
        profile.setReviewCount(reviews.size());
        providerProfileRepository.save(profile);
    }
}
