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
 * The catalog/classic-provider data (run()) only seeds once, guarded by `service` being empty —
 * safe to leave on for local dev; harmless no-op once real data exists. The demo accounts and
 * the per-category provider top-up are seeded independently of that guard (their own "does this
 * email exist" checks) so they run even on a DB that already has catalog data from elsewhere —
 * which the shared Supabase DB did (see PROJECT.md §2). Not wired into the Render deploy env on
 * purpose (real seed data there should come from Supabase directly).
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

    // A request that classifies into a category with no providers leaves the customer with
    // nobody to browse or quote — the classification prompt calls that its worst outcome. The
    // floor counts idValidated providers only, because that's all matching ever shows
    // (ProviderMatchService), so every category ends up genuinely browsable.
    private static final int MIN_PROVIDERS_PER_CATEGORY = 4;

    private record DemoProvider(String firstName, String lastName, String bio, String location,
                                double rating, double minPrice, double maxPrice) {
        String email() {
            return firstName.toLowerCase() + "." + lastName.toLowerCase() + "@ubuntulink.local";
        }
    }

    // Catalog-filler roster, one list per category (SERVICE_CATEGORIES order). Only the first
    // entries of a list are ever used — just enough to top the category up to
    // MIN_PROVIDERS_PER_CATEGORY — so categories with real providers are never crowded out.
    private static final Map<String, List<DemoProvider>> CATEGORY_ROSTER = Map.ofEntries(
            Map.entry("Plumbing", List.of(
                    new DemoProvider("Sipho", "Nkosi", "Geyser and burst-pipe specialist with same-day call-outs.", "Benoni, Gauteng", 4.8, 400, 900),
                    new DemoProvider("Mariaan", "Van Wyk", "Upfront quotes for plumbing repairs and bathroom renovations.", "Krugersdorp, Gauteng", 4.4, 350, 800),
                    new DemoProvider("Desmond", "Moyo", "Drain unblocking, leak detection and general maintenance.", "Soweto, Gauteng", 4.3, 300, 750),
                    new DemoProvider("Anna", "Khumalo", "Leaking taps, toilet repairs and winter geyser checks.", "Tembisa, Gauteng", 4.5, 350, 850))),
            Map.entry("Cleaning", List.of(
                    new DemoProvider("Palesa", "Mokoena", "Deep cleans, move-in/move-out and regular home cleaning with own supplies.", "Johannesburg, Gauteng", 4.9, 350, 800),
                    new DemoProvider("Charmaine", "Petersen", "Office and home cleaning with reliable weekly slots.", "Centurion, Gauteng", 4.5, 300, 700),
                    new DemoProvider("Zanele", "Mbeki", "Post-renovation and end-of-lease cleaning specialist.", "Pretoria, Gauteng", 4.6, 400, 900),
                    new DemoProvider("Lindiwe", "Dlamini", "Weekly and once-off home cleaning, own products and equipment.", "Soweto, Gauteng", 4.4, 280, 750))),
            Map.entry("Electrical", List.of(
                    new DemoProvider("Kobus", "Botha", "COC certificates, DB board upgrades and fault finding.", "Pretoria, Gauteng", 4.7, 500, 1500),
                    new DemoProvider("Treasure", "Mabaso", "House rewiring, plug points and lighting installations.", "Tembisa, Gauteng", 4.5, 450, 1300),
                    new DemoProvider("Farhad", "Osman", "Emergency call-outs — tripping units and faults sorted same day.", "Johannesburg, Gauteng", 4.6, 550, 1600),
                    new DemoProvider("Nomvula", "Khanyile", "Certificate-of-compliance inspections, lighting and plug circuits.", "Johannesburg, Gauteng", 4.6, 500, 1400))),
            Map.entry("Gardening", List.of(
                    new DemoProvider("Jonas", "Chauke", "Lawn mowing, hedge trimming and garden clean-ups, own equipment.", "Midrand, Gauteng", 4.6, 250, 600),
                    new DemoProvider("Elmarie", "Du Plessis", "Garden design, planting and seasonal maintenance.", "Pretoria, Gauteng", 4.7, 350, 900),
                    new DemoProvider("Bheki", "Ndlovu", "Rubbish removal, tree felling and plot clearing.", "Vereeniging, Gauteng", 4.3, 300, 850),
                    new DemoProvider("Steven", "Radebe", "Lawn care, weed control and irrigation repairs.", "Randburg, Gauteng", 4.5, 250, 700))),
            Map.entry("Automotive Repair", List.of(
                    new DemoProvider("Vusi", "Mahlangu", "Mobile mechanic — brakes, services and diagnostics at your home or office.", "Johannesburg, Gauteng", 4.8, 600, 2500),
                    new DemoProvider("Riaan", "Venter", "Affordable minor and major services, suspension and clutches.", "Kempton Park, Gauteng", 4.5, 500, 2200),
                    new DemoProvider("Sanele", "Buthelezi", "Pre-purchase inspections and roadside breakdown assistance.", "Durban, KwaZulu-Natal", 4.4, 700, 2800),
                    new DemoProvider("Peter", "Mokwena", "Engine diagnostics, batteries and alternators at your driveway.", "Pretoria, Gauteng", 4.5, 600, 2600))),
            Map.entry("Tutoring", List.of(
                    new DemoProvider("Nomvula", "Dlamini", "Maths and Physical Sciences, grades 8-12 — 15 years in the classroom.", "Pietermaritzburg, KwaZulu-Natal", 4.9, 200, 450),
                    new DemoProvider("Tumi", "Rakoma", "English and isiZulu tutoring for primary school learners.", "Pretoria, Gauteng", 4.6, 180, 400),
                    new DemoProvider("Kevin", "Naidoo", "Accounting and CAT for high school and first-year university.", "Durban, KwaZulu-Natal", 4.7, 220, 500),
                    new DemoProvider("Zanele", "Mabuza", "Homework help and exam prep, all primary subjects.", "Johannesburg, Gauteng", 4.5, 150, 350))),
            Map.entry("Braiding", List.of(
                    new DemoProvider("Pumzile", "Ncube", "Knotless, box braids and crochet — neat, gentle and on time.", "Johannesburg, Gauteng", 4.8, 300, 900),
                    new DemoProvider("Chantel", "Fortuin", "Kids' braids, twists and protective styles.", "Cape Town, Western Cape", 4.6, 250, 800),
                    new DemoProvider("Nomsa", "Zwane", "Hair braiding at your home, evenings and weekends.", "Soweto, Gauteng", 4.5, 250, 750),
                    new DemoProvider("Thandeka", "Ngubane", "Knotless braids and twists with a gentle, patient touch.", "Durban, KwaZulu-Natal", 4.7, 280, 850))),
            Map.entry("Hairdressing", List.of(
                    new DemoProvider("Refiloe", "Modise", "Cuts, colour and treatments for the whole family.", "Pretoria, Gauteng", 4.7, 200, 600),
                    new DemoProvider("Bianca", "Fourie", "Bridal and matric dance styling, mobile service available.", "Bloemfontein, Free State", 4.8, 250, 700),
                    new DemoProvider("Ayanda", "Mnguni", "Relaxers, weaves and natural hair care.", "Johannesburg, Gauteng", 4.4, 180, 550),
                    new DemoProvider("Sibongile", "Nkala", "Cuts, colour and treatments; walk-ins welcome.", "Johannesburg, Gauteng", 4.6, 190, 600))),
            Map.entry("Nail Services", List.of(
                    new DemoProvider("Thandi", "Mahlaba", "Acrylic, gel and French tips — salon or mobile.", "Pretoria, Gauteng", 4.7, 200, 500),
                    new DemoProvider("Melissa", "Jacobs", "Manicures, pedicures and nail art for events.", "Cape Town, Western Cape", 4.6, 180, 450),
                    new DemoProvider("Kgomotso", "Sefara", "Quick, neat gel overlays and refills.", "Johannesburg, Gauteng", 4.5, 160, 400),
                    new DemoProvider("Precious", "Mhlanga", "Acrylics, gels and pedicures in a hygienic home salon.", "Soweto, Gauteng", 4.6, 180, 480))),
            Map.entry("Makeup Services", List.of(
                    new DemoProvider("Aisha", "Suleman", "Bridal and event makeup, lashes and setting spray included.", "Johannesburg, Gauteng", 4.9, 600, 1500),
                    new DemoProvider("Lorraine", "Chiwara", "Matric dance and photoshoot makeup, mobile.", "Pretoria, Gauteng", 4.6, 450, 1200),
                    new DemoProvider("Yolanda", "Motaung", "Natural and full-glam looks for any occasion.", "Soweto, Gauteng", 4.5, 400, 1000),
                    new DemoProvider("Nadia", "Mohamed", "Soft glam to full glam, lashes included, mobile service.", "Cape Town, Western Cape", 4.7, 450, 1300))),
            Map.entry("Painting", List.of(
                    new DemoProvider("Patrick", "Muthambi", "Interior and exterior painting, roof and waterproofing.", "Johannesburg, Gauteng", 4.6, 1500, 6000),
                    new DemoProvider("Dawie", "Kruger", "Painting teams for houses and complexes, free quotes.", "Pretoria, Gauteng", 4.4, 1200, 5000),
                    new DemoProvider("Sizwe", "Mhlongo", "Room-by-room painting with premium finishes.", "Durban, KwaZulu-Natal", 4.7, 1000, 4500),
                    new DemoProvider("Clement", "Banda", "Interior and exterior painting with paint included in the quote.", "Springs, Gauteng", 4.4, 1200, 5500))),
            Map.entry("Building & Construction", List.of(
                    new DemoProvider("Joseph", "Mabena", "Paving, boundary walls and small extensions.", "Pretoria, Gauteng", 4.5, 3000, 15000),
                    new DemoProvider("Freddie", "Sampson", "Patio and pergola construction, concrete work.", "Johannesburg, Gauteng", 4.6, 2500, 12000),
                    new DemoProvider("Amos", "Tshabalala", "Renovations, tiling and plastering — registered builder.", "Vereeniging, Gauteng", 4.4, 2000, 14000),
                    new DemoProvider("Xolani", "Ngema", "Boundary walls, driveways and paving done to spec.", "Pietermaritzburg, KwaZulu-Natal", 4.5, 2500, 13000))),
            Map.entry("Tailoring", List.of(
                    new DemoProvider("Grace", "Adeyemi", "Dressmaking, alterations and school uniforms.", "Johannesburg, Gauteng", 4.8, 150, 700),
                    new DemoProvider("Sammy", "Pillay", "Suit alterations, hemming and repairs, quick turnaround.", "Durban, KwaZulu-Natal", 4.6, 120, 600),
                    new DemoProvider("Dorah", "Sithole", "Clothing repairs, zips and custom fits.", "Pretoria, Gauteng", 4.5, 100, 500),
                    new DemoProvider("Miriam", "Setshedi", "School uniforms, alterations and made-to-measure outfits.", "Johannesburg, Gauteng", 4.6, 130, 650))),
            Map.entry("Photography", List.of(
                    new DemoProvider("Karabo", "Maseko", "Weddings, lobola ceremonies and family portraits.", "Johannesburg, Gauteng", 4.9, 1500, 6000),
                    new DemoProvider("Ilse", "Van Rooyen", "Newborn and maternity photography, studio or on location.", "Pretoria, Gauteng", 4.8, 1200, 5000),
                    new DemoProvider("Terence", "Khoza", "Events and product photography, same-week delivery.", "Soweto, Gauteng", 4.6, 1000, 4500),
                    new DemoProvider("Fatima", "Patel", "Studio and outdoor shoots with an edited gallery within a week.", "Durban, KwaZulu-Natal", 4.7, 1100, 5000))),
            Map.entry("Handyman", List.of(
                    new DemoProvider("Felix", "Onyango", "Shelves, flat-pack assembly, taps and door locks — no job too small.", "Centurion, Gauteng", 4.7, 300, 900),
                    new DemoProvider("Pieter", "Steyn", "General home maintenance, gutters and odd jobs.", "Randburg, Gauteng", 4.5, 350, 1000),
                    new DemoProvider("Lesego", "Magano", "Picture hanging, sealing, patching — the fix-it list, done.", "Pretoria, Gauteng", 4.4, 250, 800),
                    new DemoProvider("Given", "Mabunda", "Mounting, assembly, silicone and those jobs you keep putting off.", "Johannesburg, Gauteng", 4.5, 280, 850)))
    );

    @Override
    public void run(String... args) {
        if (serviceRepository.count() == 0) {
            seedCatalogAndDemoProviders();
        }
        // Runs every startup regardless — cheap "does this email exist" checks make it a no-op
        // after the first run. Deliberately after the block above so the catalog (needed to
        // attach a service offering to the demo provider) definitely exists by this point,
        // whether it was just created or already there. backfillIdValidation() runs before the
        // category top-up so its floor counts the team providers it repairs instead of padding
        // categories around invisible ones. The top-up likewise runs before seedShowcaseData()
        // so its fresh providers get reviews and availability backfilled in the same startup
        // (backfillReviews only touches providers with no reviews yet).
        seedDemoLoginAccounts();
        backfillIdValidation();
        seedProvidersAcrossCategories();
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
        // Matching only shows idValidated providers (ProviderMatchService) — without this the
        // classic trio would be seeded but invisible, and a fresh DB would look empty.
        profile.setIdValidated(true);
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

    /**
     * Tops up every catalog category to MIN_PROVIDERS_PER_CATEGORY visible providers.
     *
     * The shared Supabase DB arrived with providers clustered in a few categories and test rows
     * in others, and a fresh local DB only ever got the three plumbing names — either way, a
     * request that classifies into a thin category finds nobody to quote on it. Categories
     * already at or above the floor are left untouched, so real providers stay the majority.
     */
    private void seedProvidersAcrossCategories() {
        int added = 0;

        for (Service service : serviceRepository.findAll()) {
            List<DemoProvider> roster = CATEGORY_ROSTER.get(service.getName());
            if (roster == null) {
                continue; // a category the roster doesn't know (team-added) — not ours to fill
            }

            long visible = providerServiceRepository.findByServiceId(service.getId()).stream()
                    .filter(offering -> offering.getProviderProfile().isIdValidated())
                    .count();

            for (DemoProvider demo : roster) {
                if (visible >= MIN_PROVIDERS_PER_CATEGORY) {
                    break;
                }
                if (userRepository.findByEmail(demo.email()).isPresent()) {
                    visible++; // seeded on an earlier run — still counts towards the floor
                    continue;
                }

                ProviderProfile profile = seedRosterProvider(demo);
                providerServiceRepository.save(offer(profile, service, demo.minPrice(), demo.maxPrice()));
                visible++;
                added++;
            }
        }

        if (added > 0) {
            System.out.printf("DevDataSeeder: added %d roster provider(s) to thin categories%n", added);
        }
    }

    /**
     * Repairs providers stranded invisible by the id_validated column (added with a default of
     * false): every provider that already existed in the shared database — including the demo
     * provider account and entire categories of team-entered providers — silently dropped out
     * of matching the moment that column appeared. The app has no pending state to respect:
     * BecomeProvider (ProviderProfileService) sets idValidated=true itself once the SA ID
     * check passes, so an unvalidated profile with offerings is always a legacy row, never a
     * genuine applicant waiting on approval.
     */
    private void backfillIdValidation() {
        int repaired = 0;

        for (ProviderProfile profile : providerProfileRepository.findAll()) {
            if (profile.isIdValidated()) {
                continue;
            }
            if (providerServiceRepository.findByProviderProfileId(profile.getId()).isEmpty()) {
                continue; // no offerings — never set up to serve; not ours to flip
            }
            profile.setIdValidated(true);
            providerProfileRepository.save(profile);
            repaired++;
        }

        if (repaired > 0) {
            System.out.printf("DevDataSeeder: validated %d legacy provider(s) stranded by the id_validated default%n",
                    repaired);
        }
    }

    /** A roster provider: passwordless like the classic trio, but idValidated so matching shows it. */
    private ProviderProfile seedRosterProvider(DemoProvider demo) {
        User user = new User();
        user.setEmail(demo.email());
        user.setFirstName(demo.firstName());
        user.setLastName(demo.lastName());
        user.setCreatedAt(Instant.now());
        userRepository.save(user);

        ProviderProfile profile = new ProviderProfile();
        profile.setUser(user);
        profile.setBio(demo.bio());
        profile.setLocation(demo.location());
        profile.setServiceRadiusKm(15);
        profile.setRating(demo.rating());
        profile.setIdValidated(true);
        profile.setAvailableToday(true);
        return providerProfileRepository.save(profile);
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
            profile.setIdValidated(true);
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
