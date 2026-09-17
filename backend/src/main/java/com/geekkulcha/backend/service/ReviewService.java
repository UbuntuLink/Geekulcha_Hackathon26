package com.geekkulcha.backend.service;

import com.geekkulcha.backend.dto.request.ReviewCreateRequest;
import com.geekkulcha.backend.entity.Booking;
import com.geekkulcha.backend.entity.Review;
import com.geekkulcha.backend.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

/** TODO (§9e): one-directional only — no provider -> customer review path yet. */
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;

    public Review create(Booking booking, ReviewCreateRequest request) {
        Review review = new Review();
        review.setBooking(booking);
        review.setRating(request.rating());
        review.setComment(request.comment());
        review.setCreatedAt(Instant.now());
        return reviewRepository.save(review);
    }
}
