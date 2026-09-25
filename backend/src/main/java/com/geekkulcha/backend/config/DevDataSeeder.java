package com.geekkulcha.backend.config;

import com.geekkulcha.backend.entity.*;
import com.geekkulcha.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.time.temporal.ChronoUnit;

/**
 * Seeds just enough data for the 12-screen customer flow (PROJECT.md §5) to be click-through-
 * testable locally without a real Supabase dataset, PLUS two real login-capable demo accounts
 * (see seedDemoLoginAccounts) so you can test without registering by hand every time.
 *
 * The catalog/provider data (run()) only seeds once, guarded by `service` being empty — safe to
 * leave on for local dev; harmless no-op once real data exists. The demo accounts are seeded
 * independently of that guard (their own "does this email already exist" check) so they get
 * created even on a DB that already has catalog data from elsewhere — which the shared Supabase
 * DB did (see PROJECT.md §2). Not wired into the Render deploy env on purpose (real seed data
 * there should come from Supabase directly).
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
    private final PasswordEncoder passwordEncoder;

    // Known credentials so you can log in immediately without registering — see INSTRUCTIONS.md.
    private static final String DEMO_PASSWORD = "Demo1234!";

    // The real catalog, matching 01_Database/ubuntulink_services.csv — which is what the shared
    // Supabase database actually contains. Local dev used to seed a different, shorter list
    // ("Mechanic", "Beauty", "Other"), so a query that worked locally could find nothing in
    // production. The AI classifier is given these exact names at call time
    // (see python/app/services/classification_service.py), so the two never drift apart again.
    private static final String[][] SERVICE_CATEGORIES = {
            {"Plumbing", "Pipe, tap, drain, toilet, sink, geyser and general plumbing repairs or installations"},
            {"Cleaning", "Home, office and general cleaning services"},
            {"Electrical", "Electrical repairs, fault finding, wiring and installation services"},
            {"Gardening", "Garden maintenance, lawn care, trimming, planting and general outdoor upkeep"},
            {"Automotive Repair", "Vehicle inspection, maintenance and general mechanic repair services"},
            {"Tutoring", "Academic tutoring and learning support for school, college or other subjects"},
            {"Braiding", "Hair braiding and related styling services"},
            {"Hairdressing", "Hair cutting, styling, treatment and general hairdressing services"},
            {"Nail Services", "Manicures, pedicures, nail care and nail styling services"},
            {"Makeup Services", "Makeup application for everyday, event and special-occasion needs"},
            {"Painting", "Interior, exterior and general painting services"},
            {"Building & Construction", "General building, construction, repairs and small structural work"},
            {"Tailoring", "Clothing alterations, repairs, sewing and custom tailoring services"},
            {"Photography", "Photography services for events, portraits, products and other occasions"},
            {"Handyman", "General home repairs and odd jobs"},
    };

    // Typical ZAR ranges per catalog category, used to fill in offerings that reached the shared
    // database without any pricing — 51 of 58 of them. A provider card with "R0-R0" reads as
    // broken, and the "cheapest first" sort has nothing to order by while every row is zero.
    private static final Map<String, int[]> PRICE_GUIDE = Map.ofEntries(
            Map.entry("Plumbing", new int[]{450, 1800}),
            Map.entry("Cleaning", new int[]{300, 900}),
            Map.entry("Electrical", new int[]{500, 2200}),
            Map.entry("Gardening", new int[]{250, 900}),
            Map.entry("Automotive Repair", new int[]{600, 3500}),
            Map.entry("Tutoring", new int[]{180, 550}),
            Map.entry("Braiding", new int[]{250, 1200}),
            Map.entry("Hairdressing", new int[]{150, 700}),
            Map.entry("Nail Services", new int[]{180, 550}),
            Map.entry("Makeup Services", new int[]{400, 1500}),
            Map.entry("Painting", new int[]{800, 5000}),
            Map.entry("Building & Construction", new int[]{1500, 15000}),
            Map.entry("Tailoring", new int[]{120, 800}),
            Map.entry("Photography", new int[]{900, 6000}),
            Map.entry("Handyman", new int[]{300, 1200})
    );

    // Trade-neutral on purpose, so the same pool reads naturally under a plumber or a nail tech.
    private static final String[] REVIEW_COMMENTS = {
            "Arrived on time and sorted it out the same day.",
            "Fair price and neat work. Would use again.",
            "Very professional — explained everything before starting.",
            "Quick to respond and stuck to the quote, no surprises.",
            "Knows his stuff. Sorted what two other people couldn't.",
            "Friendly, and left the place tidy afterwards.",
            "Good work overall, though arrived a bit later than agreed.",
            "Reasonable rates and no hidden costs.",
    };

    private static final String[] REVIEWER_NAMES = {
            "Naledi", "Sibusiso", "Anele", "Farhana", "Karabo", "Michelle",
    };

    @Override
    public void run(String... args) {
        if (serviceRepository.count() == 0) {
            seedCatalogAndDemoProviders();
        }
        // Runs every startup regardless — cheap "does this email exist" checks make it a no-op
        // after the first run. Deliberately after the block above so the catalog (needed to
        // attach a service offering to the demo provider) definitely exists by this point,
        // whether it was just created or already there.
        seedDemoLoginAccounts();
        seedShowcaseData();
    }

    /**
     * Fills the gaps in whatever provider data already exists, rather than creating providers.
     *
     * The shared Supabase database was populated outside this seeder and arrived half-dressed:
     * no prices, no reviews, and every provider flagged available today. Each step below is
     * guarded on the specific thing being missing, so this is a no-op from the second run
     * onwards and never overwrites data somebody entered deliberately.
     */
    private void seedShowcaseData() {
        int pricesFilled = backfillOfferingPrices();
        int providersReviewed = backfillReviews();

        if (pricesFilled > 0 || providersReviewed > 0) {
            System.out.printf("DevDataSeeder: priced %d offering(s), reviewed %d provider(s)%n",
                    pricesFilled, providersReviewed);
        }
    }

    private int backfillOfferingPrices() {
        int filled = 0;

        for (ProviderService offering : providerServiceRepository.findAll()) {
            if (offering.getMinPrice() > 0 || offering.getMaxPrice() > 0) {
                continue;
            }

            int[] guide = PRICE_GUIDE.get(offering.getService().getName());
            if (guide == null) {
                continue;
            }

            // Spread deterministically off the provider id so two plumbers don't quote an
            // identical range, while a given provider's prices stay stable across restarts.
            long seed = offering.getProviderProfile().getId();
            int span = guide[1] - guide[0];
            int min = guide[0] + (int) (seed % 4) * span / 16;
            int max = guide[1] - (int) (seed % 3) * span / 12;
            if (max <= min) {
                max = min + Math.max(50, span / 4);
            }

            offering.setMinPrice(roundToNearest(min, 10));
            offering.setMaxPrice(roundToNearest(max, 10));
            providerServiceRepository.save(offering);
            filled++;
        }

        return filled;
    }

    /**
     * Gives every unreviewed provider two real Review rows, through the Booking -> Quote chain
     * the app actually reads.
     *
     * Bumping ProviderProfile.reviewCount on its own would be quicker and would look fine on a
     * provider card, but the profile screen lists real Review rows: the card would claim two
     * reviews while the page underneath said there were none.
     */
    private int backfillReviews() {
        List<User> reviewers = ensureReviewerAccounts();
        int reviewed = 0;

        for (ProviderProfile profile : providerProfileRepository.findAll()) {
            if (!reviewRepository.findByBooking_Quote_ProviderProfile_Id(profile.getId()).isEmpty()) {
                continue;
            }

            List<ProviderService> offerings = providerServiceRepository.findAll().stream()
                    .filter(offering -> offering.getProviderProfile().getId() == profile.getId())
                    .toList();
            if (offerings.isEmpty()) {
                continue;
            }

            ProviderService offering = offerings.get(0);
            long seed = profile.getId();

            // Keep the star ratings consistent with the rating this provider already carries,
            // instead of recomputing and flattening a curated number.
            double existing = profile.getRating();
            int[] stars = existing >= 4.75 ? new int[]{5, 5}
                    : existing >= 4.5 ? new int[]{5, 4}
                    : existing >= 4.0 ? new int[]{4, 4}
                    : existing > 0 ? new int[]{4, 3}
                    : new int[]{5, 4};

            for (int i = 0; i < stars.length; i++) {
                User reviewer = reviewers.get((int) ((seed + i) % reviewers.size()));
                int daysAgo = 3 + (int) ((seed + i * 5L) % 40);
                writeReview(profile, offering, reviewer, stars[i],
                        REVIEW_COMMENTS[(int) ((seed * 2 + i) % REVIEW_COMMENTS.length)], daysAgo);
            }

            if (existing <= 0) {
                profile.setRating(4.5);
            }
            profile.setReviewCount(stars.length);
            // Not everyone can be free on the same day. While every row said true, the "available
            // today" filter in the customer search had nothing to filter out.
            profile.setAvailableToday(seed % 3 != 0);
            providerProfileRepository.save(profile);
            reviewed++;
        }

        return reviewed;
    }

    private void writeReview(ProviderProfile profile, ProviderService offering, User reviewer,
                             int stars, String comment, int daysAgo) {
        Instant when = Instant.now().minus(daysAgo, ChronoUnit.DAYS);

        ServiceRequest request = new ServiceRequest();
        request.setUser(reviewer);
        request.setService(offering.getService());
        request.setDescription("Completed " + offering.getService().getName().toLowerCase() + " job.");
        request.setStatus(RequestStatus.COMPLETED);
        request.setCreatedAt(when);
        serviceRequestRepository.save(request);

        Quote quote = new Quote();
        quote.setServiceRequest(request);
        quote.setProviderProfile(profile);
        quote.setAmount(roundToNearest((offering.getMinPrice() + offering.getMaxPrice()) / 2, 10));
        quote.setStatus(QuoteStatus.ACCEPTED);
        quote.setCreatedAt(when);
        quoteRepository.save(quote);

        Booking booking = new Booking();
        booking.setQuote(quote);
        booking.setStatus(BookingStatus.COMPLETED);
        booking.setCreatedAt(when);
        bookingRepository.save(booking);

        Review review = new Review();
        review.setBooking(booking);
        review.setRating(stars);
        review.setComment(comment);
        review.setCreatedAt(when.plus(1, ChronoUnit.DAYS));
        reviewRepository.save(review);
    }

    /** Passwordless accounts, like the catalog-filler providers — they exist to author reviews. */
    private List<User> ensureReviewerAccounts() {
        List<User> reviewers = new java.util.ArrayList<>();

        for (String firstName : REVIEWER_NAMES) {
            String email = firstName.toLowerCase() + ".reviews@ubuntulink.local";
            reviewers.add(userRepository.findByEmail(email).orElseGet(() -> {
                User user = new User();
                user.setEmail(email);
                user.setFirstName(firstName);
                user.setLastName("M.");
                user.setCreatedAt(Instant.now());
                return userRepository.save(user);
            }));
        }

        return reviewers;
    }

    private static double roundToNearest(double value, int step) {
        return Math.round(value / step) * (double) step;
    }

    private void seedCatalogAndDemoProviders() {
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

    // Real, login-capable accounts (unlike the catalog-filler providers above, which have no
    // password and can't log in) — so you can test the full flow immediately. See INSTRUCTIONS.md.
    private void seedDemoLoginAccounts() {
        if (userRepository.findByEmail("customer@ubuntulink.demo").isEmpty()) {
            User customer = new User();
            customer.setEmail("customer@ubuntulink.demo");
            customer.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
            customer.setFirstName("Demo");
            customer.setLastName("Customer");
            customer.setPhoneNumber("0810000001");
            customer.setCreatedAt(Instant.now());
            userRepository.save(customer);
        }

        if (userRepository.findByEmail("provider@ubuntulink.demo").isEmpty()) {
            User providerUser = new User();
            providerUser.setEmail("provider@ubuntulink.demo");
            providerUser.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
            providerUser.setFirstName("Demo");
            providerUser.setLastName("Provider");
            providerUser.setPhoneNumber("0810000002");
            providerUser.setCreatedAt(Instant.now());
            userRepository.save(providerUser);

            ProviderProfile profile = new ProviderProfile();
            profile.setUser(providerUser);
            profile.setBio("Demo provider account, seeded for testing - not a real tradesperson.");
            profile.setLocation("Pretoria, Gauteng");
            profile.setServiceRadiusKm(20);
            profile.setRating(5.0);
            profile.setAvailableToday(true);
            providerProfileRepository.save(profile);

            // Whatever category comes first alphabetically-ish in SERVICE_CATEGORIES ("Plumbing")
            // if it exists; falls back to any service so this still works on a schema with a
            // differently-named catalog.
            serviceRepository.findAll().stream()
                    .filter(s -> s.getName().equalsIgnoreCase("Plumbing"))
                    .findFirst()
                    .or(() -> serviceRepository.findAll().stream().findFirst())
                    .ifPresent(service -> {
                        ProviderService offering = new ProviderService();
                        offering.setProviderProfile(profile);
                        offering.setService(service);
                        offering.setMinPrice(300);
                        offering.setMaxPrice(600);
                        providerServiceRepository.save(offering);
                    });
        }
    }
}
