package com.geekkulcha.backend.repository;

import com.geekkulcha.backend.entity.ProviderService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProviderServiceRepository extends JpaRepository<ProviderService, Long> {
    List<ProviderService> findByServiceId(long serviceId);

    /**
     * Every ID-validated provider offering a service, with their profile and user loaded in the
     * same query. Matching reads the provider's name, location and radius for each row; loading
     * them lazily cost two extra round trips per provider — ~5 s for 15 plumbers against Supabase.
     */
    @Query("select ps from ProviderService ps join fetch ps.providerProfile p join fetch p.user "
            + "where ps.service.id = :serviceId and p.idValidated = true")
    List<ProviderService> findValidatedWithProviderByServiceId(@Param("serviceId") long serviceId);
    List<ProviderService> findByProviderProfileId(long providerProfileId);

    /** Visible (ID-validated) providers offering a service, counted by the database (startup seeding). */
    @Query("select count(ps) from ProviderService ps where ps.service.id = :serviceId and ps.providerProfile.idValidated = true")
    long countValidatedByServiceId(@Param("serviceId") long serviceId);

    /** Offerings with no price yet, with their provider and service loaded (startup seeding). */
    @Query("select ps from ProviderService ps join fetch ps.providerProfile join fetch ps.service "
            + "where ps.minPrice <= 0 and ps.maxPrice <= 0")
    List<ProviderService> findUnpricedWithDetails();
    Optional<ProviderService> findByProviderProfileIdAndServiceId(long providerProfileId, long serviceId);
    void deleteByProviderProfileIdAndServiceId(long providerProfileId, long serviceId);
}
