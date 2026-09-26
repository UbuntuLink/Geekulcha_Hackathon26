package com.geekkulcha.backend.repository;

import com.geekkulcha.backend.entity.Quote;
import com.geekkulcha.backend.dto.response.QuoteSummaryResponse;
import com.geekkulcha.backend.entity.QuoteStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuoteRepository extends JpaRepository<Quote, Long> {
    List<Quote> findByServiceRequestId(long serviceRequestId);
    List<Quote> findByProviderProfileId(long providerProfileId);

    /** Every quote on this customer's requests, newest first, as page-ready summaries (one query). */
    @Query("select new com.geekkulcha.backend.dto.response.QuoteSummaryResponse("
            + "q.id, q.amount, q.message, q.status, q.createdAt, "
            + "p.id, concat(u.firstName, ' ', u.lastName), p.rating, p.reviewCount, "
            + "r.id, r.description, r.status, s.name) "
            + "from Quote q join q.serviceRequest r left join r.service s "
            + "join q.providerProfile p join p.user u "
            + "where r.user.id = :customerId order by q.createdAt desc")
    List<QuoteSummaryResponse> findSummariesForCustomer(@Param("customerId") long customerId);

    /** The same summaries, for the quotes a provider has sent. */
    @Query("select new com.geekkulcha.backend.dto.response.QuoteSummaryResponse("
            + "q.id, q.amount, q.message, q.status, q.createdAt, "
            + "p.id, concat(u.firstName, ' ', u.lastName), p.rating, p.reviewCount, "
            + "r.id, r.description, r.status, s.name) "
            + "from Quote q join q.serviceRequest r left join r.service s "
            + "join q.providerProfile p join p.user u "
            + "where p.id = :providerProfileId order by q.createdAt desc")
    List<QuoteSummaryResponse> findSummariesForProvider(@Param("providerProfileId") long providerProfileId);

    boolean existsByServiceRequestIdAndProviderProfileIdAndStatus(long serviceRequestId, long providerProfileId,
                                                                 QuoteStatus status);

    @Query("select q.serviceRequest.id from Quote q where q.providerProfile.id = :providerProfileId "
            + "and q.status = com.geekkulcha.backend.entity.QuoteStatus.PENDING")
    List<Long> findPendingRequestIdsForProvider(@Param("providerProfileId") long providerProfileId);
}
