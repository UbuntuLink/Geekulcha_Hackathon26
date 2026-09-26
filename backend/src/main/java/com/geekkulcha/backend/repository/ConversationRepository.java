package com.geekkulcha.backend.repository;

import com.geekkulcha.backend.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByCustomer_IdAndProvider_Id(long customerId, long providerProfileId);

    /** Every conversation the user is in, on either side, most recently active first. */
    @Query("select c from Conversation c join fetch c.customer join fetch c.provider p join fetch p.user "
            + "where c.customer.id = :userId or p.user.id = :userId "
            + "order by coalesce(c.lastMessageAt, c.createdAt) desc")
    List<Conversation> findAllForUser(@Param("userId") long userId);
}
