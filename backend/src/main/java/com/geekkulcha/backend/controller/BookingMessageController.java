package com.geekkulcha.backend.controller;

import com.geekkulcha.backend.dto.request.BookingMessageCreateRequest;
import com.geekkulcha.backend.service.BookingMessageService;
import com.geekkulcha.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings/{bookingId}/messages")
@RequiredArgsConstructor
public class BookingMessageController {

    private final BookingMessageService messageService;
    private final UserService userService;

    @GetMapping
    public List<BookingMessageService.MessageResponse> list(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable long bookingId
    ) {
        return messageService.findForBooking(bookingId, userService.getCurrentUser(jwt));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingMessageService.MessageResponse send(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable long bookingId,
            @Valid @RequestBody BookingMessageCreateRequest request
    ) {
        return messageService.send(bookingId, request.content(), userService.getCurrentUser(jwt));
    }
}