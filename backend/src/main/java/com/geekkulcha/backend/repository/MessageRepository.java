package com.geekkulcha.backend.repository;

import com.geekkulcha.backend.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    /** A thread's messages after a given id (0 for all), oldest first — polling asks only for new ones. */
    @Query("select m from Message m left join fetch m.sender "
            + "where m.conversation.id = :conversationId and m.id > :afterId order by m.id asc")
    List<Message> findAfter(@Param("conversationId") long conversationId, @Param("afterId") long afterId);

    /**
     * Unread messages per conversation for this user, in one query: messages newer than their side's
     * lastReadAt that they didn't send themselves. Rows are [conversationId, count].
     */
    @Query("select c.id, count(m) from Message m join m.conversation c "
            + "where (m.sender is null or m.sender.id <> :userId) and ("
            + "  (c.customer.id = :userId and (c.customerLastReadAt is null or m.createdAt > c.customerLastReadAt)) or "
            + "  (c.provider.user.id = :userId and (c.providerLastReadAt is null or m.createdAt > c.providerLastReadAt))"
            + ") group by c.id")
    List<Object[]> countUnreadByConversation(@Param("userId") long userId);
}
