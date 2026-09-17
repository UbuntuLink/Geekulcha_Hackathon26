package com.geekkulcha.backend.repository;

import com.geekkulcha.backend.entity.Quote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuoteRepository extends JpaRepository<Quote, Long> {
    List<Quote> findByServiceRequestId(long serviceRequestId);
    List<Quote> findByProviderProfileId(long providerProfileId);
}
