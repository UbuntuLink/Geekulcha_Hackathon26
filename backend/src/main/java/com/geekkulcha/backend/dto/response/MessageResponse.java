package com.geekkulcha.backend.dto.response;

import com.geekkulcha.backend.entity.Message;

import java.time.Instant;

/** A message as the viewer sees it; mine is true for their own messages. */
public record MessageResponse(long id, String body, Message.Kind kind, boolean mine, String senderName, Instant createdAt) {
}
