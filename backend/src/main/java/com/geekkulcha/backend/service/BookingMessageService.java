package com.geekkulcha.backend.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.geekkulcha.backend.entity.Booking;
import com.geekkulcha.backend.entity.BookingMessage;
import com.geekkulcha.backend.entity.User;
import com.geekkulcha.backend.exception.ForbiddenException;
import com.geekkulcha.backend.exception.ResourceNotFoundException;
import com.geekkulcha.backend.repository.BookingMessageRepository;
import com.geekkulcha.backend.repository.BookingRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingMessageService {

    private final BookingRepository bookingRepository;
    private final BookingMessageRepository messageRepository;

    public record MessageResponse(long id, long senderId, String senderName, String content, Instant createdAt) {
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> findForBooking(long bookingId, User currentUser) {
        requireParticipant(bookingId, currentUser.getId());
        return messageRepository.findByBookingIdOrderByCreatedAtAscIdAsc(bookingId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MessageResponse send(long bookingId, String content, User sender) {
        Booking booking = requireParticipant(bookingId, sender.getId());
        BookingMessage message = new BookingMessage();
        message.setBooking(booking);
        message.setSender(sender);
        message.setContent(content.trim());
        message.setCreatedAt(Instant.now());
        return toResponse(messageRepository.save(message));
    }

    @Transactional(readOnly = true)
    public Booking getBookingForParticipant(long bookingId, long userId) {
        return requireParticipant(bookingId, userId);
    }

    private Booking requireParticipant(long bookingId, long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking " + bookingId + " not found"));
        long customerId = booking.getQuote().getServiceRequest().getUser().getId();
        long providerId = booking.getQuote().getProviderProfile().getUser().getId();
        if (userId != customerId && userId != providerId) {
            throw new ForbiddenException("You don't have access to this booking conversation");
        }
        return booking;
    }

    private MessageResponse toResponse(BookingMessage message) {
        User sender = message.getSender();
        String senderName = String.join(" ",
                sender.getFirstName() == null ? "" : sender.getFirstName(),
                sender.getLastName() == null ? "" : sender.getLastName()).trim();
        return new MessageResponse(message.getId(), sender.getId(), senderName,
                message.getContent(), message.getCreatedAt());
    }
}