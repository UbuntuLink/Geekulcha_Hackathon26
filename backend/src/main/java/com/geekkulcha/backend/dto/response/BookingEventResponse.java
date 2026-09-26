package com.geekkulcha.backend.dto.response;

import com.geekkulcha.backend.entity.BookingStatus;
import com.geekkulcha.backend.entity.BookingStatusEvent;

import java.time.Instant;

/** One entry on the work tracker's timeline. */
public record BookingEventResponse(BookingStatus status, BookingStatusEvent.Actor changedBy, String note, Instant at) {
}
