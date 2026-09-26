package com.geekkulcha.backend.dto.response;

import java.time.Instant;

/**
 * One row in the inbox, from the viewer's side: who they're talking to, the last message, and
 * how many messages they haven't read. providerProfileId links to the provider's public profile.
 */
public record ConversationResponse(
        long id,
        String otherPartyName,
        String otherPartyRole,
        long providerProfileId,
        String lastMessagePreview,
        Instant lastMessageAt,
        long unreadCount
) {
}
