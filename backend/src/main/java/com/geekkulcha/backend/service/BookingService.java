package com.geekkulcha.backend.service;

import com.geekkulcha.backend.dto.response.BookingEventResponse;
import com.geekkulcha.backend.entity.*;
import com.geekkulcha.backend.exception.ForbiddenException;
import com.geekkulcha.backend.exception.ResourceNotFoundException;
import com.geekkulcha.backend.repository.BookingRepository;
import com.geekkulcha.backend.repository.BookingStatusEventRepository;
import com.geekkulcha.backend.repository.QuoteRepository;
import com.geekkulcha.backend.repository.ServiceRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/** Accepting a {@link Quote} creates a {@link Booking}. Figma screens 9-11. */
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final QuoteRepository quoteRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final BookingStatusEventRepository statusEventRepository;

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

        Booking saved = bookingRepository.save(booking);
        recordEvent(saved, BookingStatus.REQUEST_SENT, BookingStatusEvent.Actor.CUSTOMER, null);
        return saved;
    }

    public Booking getById(long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking " + id + " not found"));
    }

    /** A booking, for the customer who made it or the provider doing it — nobody else. */
    public Booking getForParticipant(long id, long currentUserId) {
        Booking booking = getById(id);
        long customerId = booking.getQuote().getServiceRequest().getUser().getId();
        long providerUserId = booking.getQuote().getProviderProfile().getUser().getId();
        if (currentUserId != customerId && currentUserId != providerUserId) {
            throw new ForbiddenException("You don't have access to this booking");
        }
        return booking;
    }

    /** The order work moves through. CANCELLED sits outside it: it can end the job at any point. */
    static final List<BookingStatus> WORK_STEPS = List.of(
            BookingStatus.REQUEST_SENT,
            BookingStatus.ACCEPTED,
            BookingStatus.ON_THE_WAY,
            BookingStatus.IN_PROGRESS,
            BookingStatus.AWAITING_PAYMENT,
            BookingStatus.COMPLETED);

    /**
     * Moves a booking to a new status, if the caller may make that move:
     * <ul>
     *   <li>The provider moves work forward, one step or several (a job next door needs no
     *       "on the way"), never backwards.</li>
     *   <li>Either side can cancel before completion — the customer only until the provider is on
     *       the way, since after that the provider has already committed time to the trip.</li>
     *   <li>Completed and cancelled jobs are final.</li>
     * </ul>
     * The booking row is locked, so two taps (or both sides acting at once) can't interleave.
     * Every change is recorded with who made it and an optional note, for the tracker timeline.
     */
    @Transactional
    public Booking updateStatus(long id, BookingStatus target, String note, long currentUserId) {
        Booking booking = bookingRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking " + id + " not found"));
        boolean isProvider = booking.getQuote().getProviderProfile().getUser().getId() == currentUserId;
        boolean isCustomer = booking.getQuote().getServiceRequest().getUser().getId() == currentUserId;
        if (!isProvider && !isCustomer) {
            throw new ForbiddenException("You don't have access to this booking");
        }

        BookingStatus current = booking.getStatus();
        if (current == BookingStatus.COMPLETED || current == BookingStatus.CANCELLED) {
            throw new IllegalStateException("This job is already " + current.name().toLowerCase() + ".");
        }
        if (target == current) {
            throw new IllegalStateException("The job is already at that step.");
        }

        if (target == BookingStatus.COMPLETED) {
            // Only a payment completes a job (WalletService.pay), so the customer always confirms.
            throw new IllegalStateException("Mark the work as done — the job completes when the customer pays.");
        }

        if (target == BookingStatus.CANCELLED) {
            if (current == BookingStatus.AWAITING_PAYMENT) {
                throw new IllegalStateException(
                        "The work is already done, so the job can't be cancelled. Use Report an issue if something is wrong.");
            }
            if (!isProvider && WORK_STEPS.indexOf(current) >= WORK_STEPS.indexOf(BookingStatus.ON_THE_WAY)) {
                throw new IllegalStateException(
                        "The provider is already on the way, so the job can't be cancelled from here. Contact them directly.");
            }
        } else {
            if (!isProvider) {
                throw new ForbiddenException("Only the provider can update the progress of the work.");
            }
            if (WORK_STEPS.indexOf(target) < WORK_STEPS.indexOf(current)) {
                throw new IllegalStateException("Work can only move forward.");
            }
        }

        booking.setStatus(target);
        Booking saved = bookingRepository.save(booking);

        // Keep the request in step, so "My requests" shows the job as finished or called off.
        ServiceRequest request = booking.getQuote().getServiceRequest();
        if (target == BookingStatus.COMPLETED) {
            request.setStatus(RequestStatus.COMPLETED);
            serviceRequestRepository.save(request);
        } else if (target == BookingStatus.CANCELLED) {
            request.setStatus(RequestStatus.CANCELLED);
            serviceRequestRepository.save(request);
        }

        recordEvent(saved, target,
                isProvider ? BookingStatusEvent.Actor.PROVIDER : BookingStatusEvent.Actor.CUSTOMER, note);
        return saved;
    }

    /**
     * Completes a job that has just been paid (called by WalletService, in its transaction, with the
     * booking already locked). Recorded as the customer's step, since paying is their action.
     */
    public void completeByPayment(Booking booking, String note) {
        booking.setStatus(BookingStatus.COMPLETED);
        bookingRepository.save(booking);
        ServiceRequest request = booking.getQuote().getServiceRequest();
        request.setStatus(RequestStatus.COMPLETED);
        serviceRequestRepository.save(request);
        recordEvent(booking, BookingStatus.COMPLETED, BookingStatusEvent.Actor.CUSTOMER, note);
    }

    /**
     * The booking's history, oldest first. Bookings made before history was recorded have no
     * events, so their creation is filled in as the first step and their current status as the
     * last, which keeps the tracker readable for them too.
     */
    public List<BookingEventResponse> timeline(long id, long currentUserId) {
        Booking booking = getForParticipant(id, currentUserId);
        List<BookingEventResponse> events = new ArrayList<>(statusEventRepository.findByBooking_IdOrderByCreatedAtAsc(id)
                .stream()
                .map(e -> new BookingEventResponse(e.getStatus(), e.getChangedBy(), e.getNote(), e.getCreatedAt()))
                .toList());

        if (events.isEmpty() || events.get(0).status() != BookingStatus.REQUEST_SENT) {
            events.add(0, new BookingEventResponse(BookingStatus.REQUEST_SENT, BookingStatusEvent.Actor.CUSTOMER,
                    null, booking.getCreatedAt()));
        }
        if (events.get(events.size() - 1).status() != booking.getStatus()) {
            events.add(new BookingEventResponse(booking.getStatus(), null, null, null));
        }
        return events;
    }

    private void recordEvent(Booking booking, BookingStatus status, BookingStatusEvent.Actor actor, String note) {
        BookingStatusEvent event = new BookingStatusEvent();
        event.setBooking(booking);
        event.setStatus(status);
        event.setChangedBy(actor);
        String trimmed = note == null ? "" : note.trim();
        event.setNote(trimmed.isEmpty() ? null : trimmed.substring(0, Math.min(trimmed.length(), 280)));
        event.setCreatedAt(Instant.now());
        statusEventRepository.save(event);
    }

    public List<Booking> findByProvider(long userId) {
        return bookingRepository.findByQuote_ProviderProfile_User_Id(userId);
    }

    /** The customer's own bookings, so "My requests" can link each booked job to its tracker. */
    public List<Booking> findByCustomer(long userId) {
        return bookingRepository.findByQuote_ServiceRequest_User_Id(userId);
    }
}
