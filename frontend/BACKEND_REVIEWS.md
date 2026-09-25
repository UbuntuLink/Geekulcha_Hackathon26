# Backend requirements: customer reviews after completion

The frontend uses:

- `GET /api/bookings/{bookingId}` to load the booking.
- `POST /api/bookings/{bookingId}/review` to submit `{ "rating": 1..5, "comment": "..." }`.

## Required rules

The backend must reject a review unless:

1. The authenticated user owns the service request attached to the booking.
2. `booking.status == COMPLETED`.
3. That booking does not already have a review.
4. Rating is between 1 and 5.

The database already enforces one review per booking because `review.booking_id` is `UNIQUE`, but the service should validate this first and return a clean `409 Conflict`.

## Booking response

Add a boolean such as `reviewed` to `BookingResponse` and populate it with:

```java
reviewRepository.existsByBookingId(booking.getId())
```

The updated frontend recognizes any of these response shapes: `reviewed`, `hasReview`, `reviewId`, or `review`.

## Review request DTO

```java
@Data
public class CreateReviewRequest {
    @Min(1)
    @Max(5)
    private Integer rating;

    private String comment;
}
```

## Repository

```java
public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByBookingId(Long bookingId);
    List<Review> findByBookingQuoteProviderProfileId(Long providerProfileId);
}
```

## Service flow

```java
@Transactional
public ReviewResponse createReview(Long currentUserId, Long bookingId, CreateReviewRequest request) {
    Booking booking = bookingRepository.findById(bookingId)
        .orElseThrow(() -> new RuntimeException("Booking not found"));

    Long customerId = booking.getQuote().getServiceRequest().getUser().getId();
    if (!customerId.equals(currentUserId)) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot review this booking");
    }

    if (!"COMPLETED".equalsIgnoreCase(booking.getStatus())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Booking must be completed before it can be reviewed");
    }

    if (reviewRepository.existsByBookingId(bookingId)) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "This booking has already been reviewed");
    }

    Review review = new Review();
    review.setBooking(booking);
    review.setRating(request.getRating());
    review.setComment(request.getComment());
    review.setCreatedAt(LocalDateTime.now());
    reviewRepository.save(review);

    ProviderProfile provider = booking.getQuote().getProviderProfile();
    List<Review> reviews = reviewRepository.findByBookingQuoteProviderProfileId(provider.getId());
    double average = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
    provider.setRating(Math.round(average * 10.0) / 10.0);
    provider.setReviewCount(reviews.size());
    providerProfileRepository.save(provider);

    return mapReview(review);
}
```

Use your existing exception classes / mapper naming if they differ.

## Controller

If your booking controller has `@RequestMapping("/api/bookings")`:

```java
@PostMapping("/{bookingId}/review")
public ReviewResponse createReview(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable Long bookingId,
        @Valid @RequestBody CreateReviewRequest request) {
    return bookingService.createReview(
        userService.getCurrentUser(jwt).getId(),
        bookingId,
        request
    );
}
```

## Optional but recommended: make completed bookings easy to reopen

For `GET /api/service-requests/mine`, include `bookingId` when the request has a booking. The updated frontend will automatically route a request with `bookingId` back to `/bookings/{bookingId}`, where the customer can leave a review after completion.
