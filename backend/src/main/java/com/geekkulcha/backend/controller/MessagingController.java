package com.geekkulcha.backend.controller;

import com.geekkulcha.backend.dto.response.ConversationResponse;
import com.geekkulcha.backend.dto.response.MessageResponse;
import com.geekkulcha.backend.service.MessagingService;
import com.geekkulcha.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Customer–provider messaging. Rules live in MessagingService. */
@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class MessagingController {

    private final MessagingService messagingService;
    private final UserService userService;

    public record SendMessageRequest(String body) {
    }

    @GetMapping
    public List<ConversationResponse> inbox(@AuthenticationPrincipal Jwt jwt) {
        return messagingService.inbox(me(jwt));
    }

    /** Total unread messages, for the badge on the Messages nav item. */
    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(@AuthenticationPrincipal Jwt jwt) {
        return Map.of("count", messagingService.unreadTotal(me(jwt)));
    }

    @PostMapping("/with-provider/{providerProfileId}")
    public ConversationResponse withProvider(@AuthenticationPrincipal Jwt jwt, @PathVariable long providerProfileId) {
        return messagingService.openWithProvider(me(jwt), providerProfileId);
    }

    @PostMapping("/with-customer/{customerUserId}")
    public ConversationResponse withCustomer(@AuthenticationPrincipal Jwt jwt, @PathVariable long customerUserId) {
        return messagingService.openWithCustomer(me(jwt), customerUserId);
    }

    /** after: only messages newer than this id, so an open chat can poll cheaply. */
    @GetMapping("/{id}/messages")
    public List<MessageResponse> messages(@AuthenticationPrincipal Jwt jwt, @PathVariable long id,
                                          @RequestParam(defaultValue = "0") long after) {
        return messagingService.messages(id, me(jwt), after);
    }

    @PostMapping("/{id}/messages")
    public MessageResponse send(@AuthenticationPrincipal Jwt jwt, @PathVariable long id,
                                @RequestBody SendMessageRequest request) {
        return messagingService.send(id, me(jwt), request.body());
    }

    private long me(Jwt jwt) {
        return userService.getCurrentUser(jwt).getId();
    }
}
