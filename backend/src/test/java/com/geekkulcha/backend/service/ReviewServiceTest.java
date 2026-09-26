package com.geekkulcha.backend.service;

import com.geekkulcha.backend.dto.request.ReviewCreateRequest;
import com.geekkulcha.backend.entity.Booking;
import com.geekkulcha.backend.entity.BookingStatus;
import com.geekkulcha.backend.entity.ProviderProfile;
import com.geekkulcha.backend.entity.Quote;
import com.geekkulcha.backend.entity.Review;
import com.geekkulcha.backend.entity.ReviewPhoto;
import com.geekkulcha.backend.entity.ServiceRequest;
import com.geekkulcha.backend.entity.User;
import com.geekkulcha.backend.exception.ForbiddenException;
import com.geekkulcha.backend.repository.BookingRepository;
import com.geekkulcha.backend.repository.ProviderProfileRepository;
import com.geekkulcha.backend.repository.ReviewPhotoRepository;
import com.geekkulcha.backend.repository.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Base64;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReviewServiceTest {

    private static final long CUSTOMER_ID = 7L;
    private static final long BOOKING_ID = 100L;
    private static final long PROVIDER_PROFILE_ID = 3L;

    private ReviewRepository reviewRepository;
    private ProviderProfileRepository providerProfileRepository;
    private ReviewPhotoRepository reviewPhotoRepository;
    private ReviewService reviewService;
    private Booking booking;
    private ProviderProfile provider;

    @BeforeEach
    void setUp() {
        reviewRepository = mock(ReviewRepository.class);
        BookingRepository bookingRepository = mock(BookingRepository.class);
        providerProfileRepository = mock(ProviderProfileRepository.class);
        reviewPhotoRepository = mock(ReviewPhotoRepository.class);
        reviewService = new ReviewService(reviewRepository, bookingRepository, providerProfileRepository,
                reviewPhotoRepository);

        User customer = new User();
        customer.setId(CUSTOMER_ID);
        ServiceRequest request = new ServiceRequest();
        request.setUser(customer);

        provider = new ProviderProfile();
        provider.setId(PROVIDER_PROFILE_ID);
        provider.setRating(4.5);
        provider.setReviewCount(2);

        Quote quote = new Quote();
        quote.setServiceRequest(request);
        quote.setProviderProfile(provider);

        booking = new Booking();
        booking.setId(BOOKING_ID);
        booking.setQuote(quote);
        booking.setStatus(BookingStatus.COMPLETED);

        when(bookingRepository.findByIdForUpdate(BOOKING_ID)).thenReturn(Optional.of(booking));
        when(providerProfileRepository.findByIdForUpdate(PROVIDER_PROFILE_ID)).thenReturn(Optional.of(provider));
        when(reviewRepository.save(any(Review.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void reviewUpdatesProviderRatingFromAllTheirReviews() {
        // Two earlier reviews (5 and 4) plus the new 2-star one: (5 + 4 + 2) / 3 = 3.67 -> 3.7
        when(reviewRepository.findByBooking_Quote_ProviderProfile_Id(PROVIDER_PROFILE_ID))
                .thenReturn(List.of(review(5), review(4), review(2)));

        Review saved = reviewService.create(BOOKING_ID, new ReviewCreateRequest(2, "  Arrived late.  ", null), CUSTOMER_ID);

        assertEquals(2, saved.getRating());
        assertEquals("Arrived late.", saved.getComment());
        assertEquals(3.7, provider.getRating());
        assertEquals(3, provider.getReviewCount());
        verify(providerProfileRepository).save(provider);
    }

    @Test
    void blankCommentIsStoredAsNoComment() {
        when(reviewRepository.findByBooking_Quote_ProviderProfile_Id(PROVIDER_PROFILE_ID))
                .thenReturn(List.of(review(5)));

        Review saved = reviewService.create(BOOKING_ID, new ReviewCreateRequest(5, "   ", null), CUSTOMER_ID);

        assertNull(saved.getComment());
    }

    @Test
    void onlyTheBookingsCustomerCanReview() {
        assertThrows(ForbiddenException.class,
                () -> reviewService.create(BOOKING_ID, new ReviewCreateRequest(1, "fake", null), 999L));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void unfinishedBookingCannotBeReviewed() {
        booking.setStatus(BookingStatus.ON_THE_WAY);

        assertThrows(IllegalArgumentException.class,
                () -> reviewService.create(BOOKING_ID, new ReviewCreateRequest(5, null, null), CUSTOMER_ID));
        verify(reviewRepository, never()).save(any());
    }

    @Test
    void bookingCanOnlyBeReviewedOnce() {
        when(reviewRepository.existsByBooking_Id(BOOKING_ID)).thenReturn(true);

        assertThrows(IllegalStateException.class,
                () -> reviewService.create(BOOKING_ID, new ReviewCreateRequest(5, null, null), CUSTOMER_ID));
        verify(reviewRepository, never()).save(any());
        verify(providerProfileRepository, never()).save(any());
    }

    @Test
    void photosAreStoredInOrderWithTheirRealType() {
        when(reviewRepository.findByBooking_Quote_ProviderProfile_Id(PROVIDER_PROFILE_ID))
                .thenReturn(List.of(review(5)));

        reviewService.create(BOOKING_ID,
                new ReviewCreateRequest(5, "Neat job", List.of(dataUrl("image/jpeg", JPEG), dataUrl("image/png", PNG))),
                CUSTOMER_ID);

        ArgumentCaptor<ReviewPhoto> saved = ArgumentCaptor.forClass(ReviewPhoto.class);
        verify(reviewPhotoRepository, times(2)).save(saved.capture());
        assertEquals("image/jpeg", saved.getAllValues().get(0).getContentType());
        assertEquals(0, saved.getAllValues().get(0).getPosition());
        assertEquals("image/png", saved.getAllValues().get(1).getContentType());
        assertEquals(1, saved.getAllValues().get(1).getPosition());
    }

    @Test
    void disguisedOrBrokenPhotosRejectTheWholeReview() {
        // SVG (can carry script) labelled as a JPEG, a JPEG claiming to be PNG, and junk base64.
        for (String bad : List.of(
                dataUrl("image/jpeg", "<svg onload=alert(1)>".getBytes()),
                dataUrl("image/png", JPEG),
                "data:image/jpeg;base64,!!!not-base64!!!")) {
            assertThrows(IllegalArgumentException.class, () -> reviewService.create(BOOKING_ID,
                    new ReviewCreateRequest(5, null, List.of(bad)), CUSTOMER_ID));
        }
        verify(reviewRepository, never()).save(any());
        verify(reviewPhotoRepository, never()).save(any());
    }

    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0x10};
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0};

    private static String dataUrl(String type, byte[] bytes) {
        return "data:" + type + ";base64," + Base64.getEncoder().encodeToString(bytes);
    }

    private static Review review(int stars) {
        Review review = new Review();
        review.setRating(stars);
        return review;
    }
}
