package com.geekkulcha.backend.service;

import com.geekkulcha.backend.dto.response.ConversationResponse;
import com.geekkulcha.backend.dto.response.MessageResponse;
import com.geekkulcha.backend.entity.*;
import com.geekkulcha.backend.exception.ForbiddenException;
import com.geekkulcha.backend.exception.ResourceNotFoundException;
import com.geekkulcha.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Customer–provider messaging.
 *
 * <ul>
 *   <li>A customer can start a conversation with any provider (e.g. from their profile, before
 *       asking for a quote).</li>
 *   <li>A provider can only start one with a customer they're already dealing with: someone who
 *       asked them for a quote, or on whose request they've quoted. This stops providers
 *       cold-messaging customers.</li>
 *   <li>Only the two participants can read or post in a conversation.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class MessagingService {

    public static final int MAX_LENGTH = 2000;

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final UserRepository userRepository;
    private final QuoteRepository quoteRepository;
    private final ServiceRequestRepository serviceRequestRepository;

    /** The caller (as a customer) and this provider's conversation, created if it doesn't exist. */
    @Transactional
    public ConversationResponse openWithProvider(long callerId, long providerProfileId) {
        ProviderProfile provider = providerProfileRepository.findById(providerProfileId)
                .orElseThrow(() -> new ResourceNotFoundException("Provider " + providerProfileId + " not found"));
        if (provider.getUser().getId() == callerId) {
            throw new IllegalArgumentException("You can't message yourself.");
        }
        User customer = userRepository.findById(callerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toResponse(getOrCreate(customer, provider), callerId, 0);
    }

    /** The caller (as a provider) and this customer's conversation, if they already deal with each other. */
    @Transactional
    public ConversationResponse openWithCustomer(long callerId, long customerUserId) {
        ProviderProfile provider = providerProfileRepository.findByUserId(callerId)
                .orElseThrow(() -> new ForbiddenException("Only providers can start a conversation with a customer."));
        if (customerUserId == callerId) {
            throw new IllegalArgumentException("You can't message yourself.");
        }
        boolean related = quoteRepository.existsByProviderProfile_IdAndServiceRequest_User_Id(provider.getId(), customerUserId)
                || serviceRequestRepository.existsByUser_IdAndPreferredProvider_Id(customerUserId, provider.getId());
        if (!related) {
            throw new ForbiddenException("You can message a customer once they've asked you for a quote or you've quoted on their request.");
        }
        User customer = userRepository.findById(customerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        return toResponse(getOrCreate(customer, provider), callerId, 0);
    }

    /** The caller's inbox, most recent first, with unread counts. */
    @Transactional(readOnly = true)
    public List<ConversationResponse> inbox(long callerId) {
        Map<Long, Long> unread = unreadByConversation(callerId);
        return conversationRepository.findAllForUser(callerId).stream()
                .map(c -> toResponse(c, callerId, unread.getOrDefault(c.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadTotal(long callerId) {
        return unreadByConversation(callerId).values().stream().mapToLong(Long::longValue).sum();
    }

    /** Messages after afterId (0 for the whole thread). Reading marks the thread read for the caller. */
    @Transactional
    public List<MessageResponse> messages(long conversationId, long callerId, long afterId) {
        Conversation conversation = requireParticipant(conversationId, callerId);
        List<MessageResponse> result = messageRepository.findAfter(conversationId, Math.max(afterId, 0)).stream()
                .map(m -> toResponse(m, callerId))
                .toList();
        markRead(conversation, callerId);
        return result;
    }

    @Transactional
    public MessageResponse send(long conversationId, long callerId, String body) {
        Conversation conversation = requireParticipant(conversationId, callerId);
        String text = body == null ? "" : body.trim();
        if (text.isEmpty()) {
            throw new IllegalArgumentException("Write a message first.");
        }
        if (text.length() > MAX_LENGTH) {
            throw new IllegalArgumentException("Messages can be up to " + MAX_LENGTH + " characters.");
        }
        User sender = userRepository.findById(callerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Message message = save(conversation, sender, Message.Kind.TEXT, text);
        markRead(conversation, callerId); // your own message doesn't make the thread unread for you
        return toResponse(message, callerId);
    }

    /**
     * A system notice in the customer–provider thread (created if needed), unread for the provider
     * only — e.g. telling them they've been rated. The customer caused it, so it's already read
     * on their side.
     */
    @Transactional
    public void notifyProvider(User customer, ProviderProfile provider, String body) {
        Conversation conversation = getOrCreate(customer, provider);
        save(conversation, null, Message.Kind.SYSTEM, body.length() > MAX_LENGTH ? body.substring(0, MAX_LENGTH) : body);
        conversation.setCustomerLastReadAt(Instant.now());
        conversationRepository.save(conversation);
    }

    /** The same as notifyProvider, the other way round: unread for the customer only. */
    @Transactional
    public void notifyCustomer(User customer, ProviderProfile provider, String body) {
        Conversation conversation = getOrCreate(customer, provider);
        save(conversation, null, Message.Kind.SYSTEM, body.length() > MAX_LENGTH ? body.substring(0, MAX_LENGTH) : body);
        conversation.setProviderLastReadAt(Instant.now());
        conversationRepository.save(conversation);
    }

    // --- helpers -------------------------------------------------------------------------------

    private Conversation getOrCreate(User customer, ProviderProfile provider) {
        return conversationRepository.findByCustomer_IdAndProvider_Id(customer.getId(), provider.getId())
                .orElseGet(() -> {
                    Conversation created = new Conversation();
                    created.setCustomer(customer);
                    created.setProvider(provider);
                    created.setCreatedAt(Instant.now());
                    try {
                        return conversationRepository.saveAndFlush(created);
                    } catch (DataIntegrityViolationException raced) {
                        // Both sides opened the thread at the same moment; the unique constraint
                        // kept one, so use that.
                        return conversationRepository.findByCustomer_IdAndProvider_Id(customer.getId(), provider.getId())
                                .orElseThrow(() -> raced);
                    }
                });
    }

    private Message save(Conversation conversation, User sender, Message.Kind kind, String body) {
        Message message = new Message();
        message.setConversation(conversation);
        message.setSender(sender);
        message.setKind(kind);
        message.setBody(body);
        message.setCreatedAt(Instant.now());
        Message saved = messageRepository.save(message);

        conversation.setLastMessageAt(saved.getCreatedAt());
        String oneLine = body.replaceAll("\\s+", " ");
        conversation.setLastMessagePreview(oneLine.length() > 140 ? oneLine.substring(0, 137) + "..." : oneLine);
        conversationRepository.save(conversation);
        return saved;
    }

    private Conversation requireParticipant(long conversationId, long callerId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation " + conversationId + " not found"));
        if (!isCustomer(conversation, callerId) && !isProvider(conversation, callerId)) {
            throw new ForbiddenException("You're not part of this conversation.");
        }
        return conversation;
    }

    private void markRead(Conversation conversation, long callerId) {
        Instant now = Instant.now();
        if (isCustomer(conversation, callerId)) conversation.setCustomerLastReadAt(now);
        else conversation.setProviderLastReadAt(now);
        conversationRepository.save(conversation);
    }

    private Map<Long, Long> unreadByConversation(long callerId) {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : messageRepository.countUnreadByConversation(callerId)) {
            counts.put((Long) row[0], (Long) row[1]);
        }
        return counts;
    }

    private static boolean isCustomer(Conversation c, long userId) {
        return c.getCustomer().getId() == userId;
    }

    private static boolean isProvider(Conversation c, long userId) {
        return c.getProvider().getUser().getId() == userId;
    }

    private ConversationResponse toResponse(Conversation c, long callerId, long unread) {
        boolean viewerIsCustomer = isCustomer(c, callerId);
        User other = viewerIsCustomer ? c.getProvider().getUser() : c.getCustomer();
        return new ConversationResponse(c.getId(), fullName(other), viewerIsCustomer ? "PROVIDER" : "CUSTOMER",
                c.getProvider().getId(), c.getLastMessagePreview(), c.getLastMessageAt(), unread);
    }

    private MessageResponse toResponse(Message m, long callerId) {
        User sender = m.getSender();
        return new MessageResponse(m.getId(), m.getBody(), m.getKind(),
                sender != null && sender.getId() == callerId,
                sender == null ? null : fullName(sender), m.getCreatedAt());
    }

    private static String fullName(User user) {
        String name = ((user.getFirstName() == null ? "" : user.getFirstName()) + " "
                + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return name.isEmpty() ? "User" : name;
    }
}
