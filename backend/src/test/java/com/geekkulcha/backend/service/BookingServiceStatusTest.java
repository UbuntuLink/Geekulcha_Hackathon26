package com.geekkulcha.backend.service;

import com.geekkulcha.backend.entity.*;
import com.geekkulcha.backend.exception.ForbiddenException;
import com.geekkulcha.backend.repository.BookingRepository;
import com.geekkulcha.backend.repository.BookingStatusEventRepository;
import com.geekkulcha.backend.repository.QuoteRepository;
import com.geekkulcha.backend.repository.ServiceRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BookingServiceStatusTest {

    private static final long CUSTOMER_ID = 1L;
    private static final long PROVIDER_USER_ID = 2L;
    private static final long BOOKING_ID = 10L;

    private BookingRepository bookingRepository;
    private ServiceRequestRepository serviceRequestRepository;
    private BookingStatusEventRepository eventRepository;
    private BookingService service;
    private Booking booking;
    private ServiceRequest request;

    @BeforeEach
    void setUp() {
        bookingRepository = mock(BookingRepository.class);
        serviceRequestRepository = mock(ServiceRequestRepository.class);
        eventRepository = mock(BookingStatusEventRepository.class);
        service = new BookingService(bookingRepository, mock(QuoteRepository.class), serviceRequestRepository, eventRepository);

        User customer = new User();
        customer.setId(CUSTOMER_ID);
        User providerUser = new User();
        providerUser.setId(PROVIDER_USER_ID);
        ProviderProfile provider = new ProviderProfile();
        provider.setUser(providerUser);

        request = new ServiceRequest();
        request.setUser(customer);
        request.setStatus(RequestStatus.BOOKED);
        Quote quote = new Quote();
        quote.setServiceRequest(request);
        quote.setProviderProfile(provider);

        booking = new Booking();
        booking.setId(BOOKING_ID);
        booking.setQuote(quote);
        booking.setStatus(BookingStatus.ACCEPTED);

        when(bookingRepository.findByIdForUpdate(BOOKING_ID)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void providerMovesWorkForwardAndItIsRecordedWithTheNote() {
        service.updateStatus(BOOKING_ID, BookingStatus.IN_PROGRESS, "  Started on the geyser  ", PROVIDER_USER_ID);

        assertEquals(BookingStatus.IN_PROGRESS, booking.getStatus());
        ArgumentCaptor<BookingStatusEvent> event = ArgumentCaptor.forClass(BookingStatusEvent.class);
        verify(eventRepository).save(event.capture());
        assertEquals(BookingStatus.IN_PROGRESS, event.getValue().getStatus());
        assertEquals(BookingStatusEvent.Actor.PROVIDER, event.getValue().getChangedBy());
        assertEquals("Started on the geyser", event.getValue().getNote());
    }

    @Test
    void providerMarksWorkDoneButOnlyPaymentCompletesTheJob() {
        service.updateStatus(BOOKING_ID, BookingStatus.AWAITING_PAYMENT, null, PROVIDER_USER_ID);
        assertEquals(BookingStatus.AWAITING_PAYMENT, booking.getStatus());

        assertThrows(IllegalStateException.class,
                () -> service.updateStatus(BOOKING_ID, BookingStatus.COMPLETED, null, PROVIDER_USER_ID));

        service.completeByPayment(booking, "Paid R650.00");
        assertEquals(BookingStatus.COMPLETED, booking.getStatus());
        assertEquals(RequestStatus.COMPLETED, request.getStatus());
    }

    @Test
    void finishedWorkCanNoLongerBeCancelled() {
        booking.setStatus(BookingStatus.AWAITING_PAYMENT);
        assertThrows(IllegalStateException.class,
                () -> service.updateStatus(BOOKING_ID, BookingStatus.CANCELLED, null, PROVIDER_USER_ID));
        assertThrows(IllegalStateException.class,
                () -> service.updateStatus(BOOKING_ID, BookingStatus.CANCELLED, null, CUSTOMER_ID));
    }

    @Test
    void workCannotMoveBackwards() {
        booking.setStatus(BookingStatus.IN_PROGRESS);
        assertThrows(IllegalStateException.class,
                () -> service.updateStatus(BOOKING_ID, BookingStatus.ON_THE_WAY, null, PROVIDER_USER_ID));
    }

    @Test
    void customerCannotUpdateProgress() {
        assertThrows(ForbiddenException.class,
                () -> service.updateStatus(BOOKING_ID, BookingStatus.AWAITING_PAYMENT, null, CUSTOMER_ID));
    }

    @Test
    void customerCanCancelBeforeTheProviderLeavesButNotAfter() {
        service.updateStatus(BOOKING_ID, BookingStatus.CANCELLED, "Fixed it myself", CUSTOMER_ID);
        assertEquals(BookingStatus.CANCELLED, booking.getStatus());
        assertEquals(RequestStatus.CANCELLED, request.getStatus());

        booking.setStatus(BookingStatus.ON_THE_WAY);
        assertThrows(IllegalStateException.class,
                () -> service.updateStatus(BOOKING_ID, BookingStatus.CANCELLED, null, CUSTOMER_ID));
    }

    @Test
    void finishedJobsAreFinalAndStrangersAreRefused() {
        booking.setStatus(BookingStatus.COMPLETED);
        assertThrows(IllegalStateException.class,
                () -> service.updateStatus(BOOKING_ID, BookingStatus.CANCELLED, null, PROVIDER_USER_ID));
        assertThrows(ForbiddenException.class,
                () -> service.updateStatus(BOOKING_ID, BookingStatus.CANCELLED, null, 999L));
        verify(eventRepository, never()).save(any());
    }
}
