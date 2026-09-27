package com.geekkulcha.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.geekkulcha.backend.entity.ProviderProfile;

public interface ProviderProfileRepository extends JpaRepository<ProviderProfile, Long> {
    Optional<ProviderProfile> findByUserId(long userId);
    boolean existsByUserId(long userId);

    // Locks the provider while their rating is recomputed, so two reviews landing at once each
    // see the other's row instead of one overwriting the other's average.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from ProviderProfile p where p.id = :id")
    Optional<ProviderProfile> findByIdForUpdate(@Param("id") long id);

    /** Every provider with its user loaded in the same query (startup seeding). */
    @Query("select p from ProviderProfile p join fetch p.user")
    List<ProviderProfile> findAllWithUser();

    @Query("select p from ProviderProfile p join fetch p.user where p.idValidated = false")
    List<ProviderProfile> findNotIdValidatedWithUser();
}
