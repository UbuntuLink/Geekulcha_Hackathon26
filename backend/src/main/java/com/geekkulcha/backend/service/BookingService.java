package com.geekkulcha.backend.service;

import com.geekkulcha.backend.entity.*;
import com.geekkulcha.backend.exception.ForbiddenException;
import com.geekkulcha.backend.exception.ResourceNotFoundException;
import com.geekkulcha.backend.repository.BookingRepository;
import com.geekkulcha.backend.repository.QuoteRepository;
import com.geekkulcha.backend.repository.ServiceRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/** Accepting a {@link Quote} creates a {@link Booking}. Figma screens 9-11. */
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final QuoteRepository quoteRepository;
    private final ServiceRequestRepository serviceRequestRepository;

    @Transactional
    public Booking acceptQuote(
            long quoteId,
            LocalDate scheduledDate,
            LocalTime scheduledTime,
            long currentUserId
    ) {
        Quote quote = quoteRepository.findById(quoteId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Quote " + quoteId + " not found"
                ));

        ServiceRequest serviceRequest = serviceRequestRepository
                .findByIdForUpdate(quote.getServiceRequest().getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Service request not found"
                ));

        if (serviceRequest.getUser().getId() != currentUserId) {
            throw new ForbiddenException(
                    "You don't own this service request"
            );
        }

        if ((serviceRequest.getStatus() != RequestStatus.OPEN
                && serviceRequest.getStatus() != RequestStatus.QUOTED)
                || bookingRepository.existsByQuote_ServiceRequest_Id(
                        serviceRequest.getId()
                )) {
            throw new IllegalStateException(
                    "This request is no longer available for booking."
            );
        }

        quote.setStatus(QuoteStatus.ACCEPTED);
        quoteRepository.save(quote);

        serviceRequest.setStatus(RequestStatus.BOOKED);
        serviceRequestRepository.save(serviceRequest);

        Booking booking = new Booking();
        booking.setQuote(quote);
        booking.setScheduledDate(scheduledDate);
        booking.setScheduledTime(scheduledTime);
        booking.setStatus(BookingStatus.REQUEST_SENT);
        booking.setCreatedAt(Instant.now());

        return bookingRepository.save(booking);
    }

    public Booking getById(long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking " + id + " not found"));
    }

    /** Advancing a booking's status is the provider's action — see ProviderBookings.jsx. */
    public Booking updateStatus(long id, BookingStatus status, long currentUserId) {
        Booking booking = getById(id);
        if (booking.getQuote().getProviderProfile().getUser().getId() != currentUserId) {
            throw new ForbiddenException("You don't own this booking");
        }
        booking.setStatus(status);
        return bookingRepository.save(booking);
    }

    public List<Booking> findByProvider(long userId) {
        return bookingRepository.findByQuote_ProviderProfile_User_Id(userId);
    }
}
