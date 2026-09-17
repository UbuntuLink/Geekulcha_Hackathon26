package com.geekkulcha.backend.config;

import com.geekkulcha.backend.entity.*;
import com.geekkulcha.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Seeds just enough data for the 12-screen customer flow (PROJECT.md §5) to be click-through-
 * testable locally without a real Supabase dataset. Runs once, only if `service` is empty —
 * safe to leave on for local dev; harmless no-op once real data exists. Not wired into the
 * Render deploy env on purpose (real seed data there should come from Supabase directly).
 */
@Component
@RequiredArgsConstructor
public class DevDataSeeder implements CommandLineRunner {

    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final ProviderServiceRepository providerServiceRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final QuoteRepository quoteRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;

    // Matches the AI classifier's category list, python/prompts/job_classification_prompt.txt
    private static final String[][] SERVICE_CATEGORIES = {
            {"Plumbing", "Leak repairs, blocked drains, installations"},
            {"Electrical", "Wiring, faults, installations"},
            {"Cleaning", "Home and office cleaning"},
            {"Gardening", "Lawn care, landscaping"},
            {"Mechanic", "Vehicle repairs and servicing"},
            {"Tutoring", "Academic tutoring, all levels"},
            {"Beauty", "Hair, nails, makeup"},
            {"Painting", "Interior and exterior painting"},
            {"Handyman", "General home repairs"},
            {"Other", "Anything else"},
    };

    @Override
    public void run(String... args) {
        if (serviceRepository.count() > 0) {
            return;
        }

        var services = new java.util.HashMap<String, Service>();
        for (String[] row : SERVICE_CATEGORIES) {
            Service service = new Service();
            service.setName(row[0]);
            service.setDescription(row[1]);
            services.put(row[0], serviceRepository.save(service));
        }

        Service plumbing = services.get("Plumbing");

        ProviderProfile thabo = seedProvider("Thabo", "Plumbing",
                "Local plumber serving the community with same-day home repairs and transparent pricing.",
                "Pretoria, Gauteng", 4.9, 32);
        providerServiceRepository.save(offer(thabo, plumbing, 350, 500));

        ProviderProfile mpho = seedProvider("Mpho", "Home Services",
                "Reliable home repairs and maintenance across Pretoria.",
                "Pretoria, Gauteng", 4.7, 18);
        providerServiceRepository.save(offer(mpho, plumbing, 400, 550));

        ProviderProfile fixRight = seedProvider("FixRight", "Plumbing",
                "Fast, affordable plumbing call-outs.",
                "Pretoria, Gauteng", 4.6, 41);
        providerServiceRepository.save(offer(fixRight, plumbing, 300, 450));

        seedThaboReview(thabo, plumbing);
    }

    private ProviderProfile seedProvider(String firstName, String lastName, String bio, String location,
                                          double rating, int reviewCount) {
        User user = new User();
        user.setGoogleSub("demo-provider-" + firstName.toLowerCase());
        user.setEmail(firstName.toLowerCase() + "@ubuntulink.local");
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setCreatedAt(Instant.now());
        userRepository.save(user);

        ProviderProfile profile = new ProviderProfile();
        profile.setUser(user);
        profile.setBio(bio);
        profile.setLocation(location);
        profile.setServiceRadiusKm(15);
        profile.setRating(rating);
        profile.setReviewCount(reviewCount);
        profile.setAvailableToday(true);
        return providerProfileRepository.save(profile);
    }

    private ProviderService offer(ProviderProfile provider, Service service, double minPrice, double maxPrice) {
        ProviderService ps = new ProviderService();
        ps.setProviderProfile(provider);
        ps.setService(service);
        ps.setMinPrice(minPrice);
        ps.setMaxPrice(maxPrice);
        return ps;
    }

    // One real Review row so the Provider Profile screen's "Recent reviews" has something to
    // show — matches the copy in Figma screen 8 exactly. reviewCount above is a separate,
    // manually-seeded number (see ProviderProfile.reviewCount) rather than derived from this.
    private void seedThaboReview(ProviderProfile thabo, Service plumbing) {
        User naledi = new User();
        naledi.setGoogleSub("demo-reviewer-naledi");
        naledi.setEmail("naledi@ubuntulink.local");
        naledi.setFirstName("Naledi");
        naledi.setCreatedAt(Instant.now());
        userRepository.save(naledi);

        ServiceRequest request = new ServiceRequest();
        request.setUser(naledi);
        request.setService(plumbing);
        request.setDescription("Kitchen sink is leaking and I need someone to fix it today.");
        request.setStatus(RequestStatus.COMPLETED);
        request.setCreatedAt(Instant.now().minus(3, ChronoUnit.DAYS));
        serviceRequestRepository.save(request);

        Quote quote = new Quote();
        quote.setServiceRequest(request);
        quote.setProviderProfile(thabo);
        quote.setAmount(400);
        quote.setStatus(QuoteStatus.ACCEPTED);
        quote.setCreatedAt(Instant.now().minus(3, ChronoUnit.DAYS));
        quoteRepository.save(quote);

        Booking booking = new Booking();
        booking.setQuote(quote);
        booking.setStatus(BookingStatus.COMPLETED);
        booking.setCreatedAt(Instant.now().minus(3, ChronoUnit.DAYS));
        bookingRepository.save(booking);

        Review review = new Review();
        review.setBooking(booking);
        review.setRating(5);
        review.setComment("Fast, professional and affordable.");
        review.setCreatedAt(Instant.now().minus(2, ChronoUnit.DAYS));
        reviewRepository.save(review);
    }
}
