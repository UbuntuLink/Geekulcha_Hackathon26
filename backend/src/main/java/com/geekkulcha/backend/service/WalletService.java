package com.geekkulcha.backend.service;

import com.geekkulcha.backend.entity.*;
import com.geekkulcha.backend.exception.ForbiddenException;
import com.geekkulcha.backend.exception.ResourceNotFoundException;
import com.geekkulcha.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.Locale;

/**
 * In-app balances and paying for jobs. No real money moves: balances are numbers in our database,
 * kept honest by a ledger (see Wallet, WalletEntry).
 *
 * <ul>
 *   <li>Customers top up, then pay a job once the provider marks it done — by confirming, or
 *       automatically if they turned auto-pay on and the balance covers it.</li>
 *   <li>Paying moves the quote amount out of the customer's balance and, minus the platform fee,
 *       into the provider's, and completes the job.</li>
 *   <li>Every change to a balance writes a ledger entry in the same transaction, with both wallets
 *       locked, so balances can't go negative, a job can't be paid twice, and money never appears
 *       or disappears: the customer's debit always equals the provider's credit plus the fee.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class WalletService {

    // Top-ups: R1 to R50 000 at a time.
    static final long MIN_TOP_UP_CENTS = 100;
    static final long MAX_TOP_UP_CENTS = 5_000_000;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final WalletRepository walletRepository;
    private final WalletEntryRepository entryRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final BookingService bookingService;
    private final MessagingService messagingService;

    @Value("${payments.platform-fee-percent:10}")
    private int platformFeePercent = 10;

    public record WalletView(long balanceCents, boolean autoPay, long awaitingYourPaymentCents, long awaitingPaymentToYouCents) {
    }

    public record EntryView(long id, WalletEntry.Type type, long amountCents, String description, String reference,
                            Long bookingId, Instant createdAt) {
    }

    public record PaymentView(String reference, long amountCents, long platformFeeCents, long providerAmountCents,
                              String method, Instant paidAt) {
    }

    // --- reading --------------------------------------------------------------------------------

    @Transactional
    public WalletView view(long userId) {
        Wallet wallet = getOrCreate(userId);
        long owed = bookingRepository.findByQuote_ServiceRequest_User_Id(userId).stream()
                .filter(b -> b.getStatus() == BookingStatus.AWAITING_PAYMENT)
                .mapToLong(b -> toCents(b.getQuote().getAmount()))
                .sum();
        long incoming = bookingRepository.findByQuote_ProviderProfile_User_Id(userId).stream()
                .filter(b -> b.getStatus() == BookingStatus.AWAITING_PAYMENT)
                .mapToLong(b -> providerShare(toCents(b.getQuote().getAmount())))
                .sum();
        return new WalletView(wallet.getBalanceCents(), wallet.isAutoPay(), owed, incoming);
    }

    @Transactional
    public List<EntryView> history(long userId) {
        Wallet wallet = getOrCreate(userId);
        return entryRepository.findTop100ByWallet_IdOrderByCreatedAtDesc(wallet.getId()).stream()
                .map(e -> new EntryView(e.getId(), e.getType(), e.getAmountCents(), e.getDescription(), e.getReference(),
                        e.getBooking() == null ? null : e.getBooking().getId(), e.getCreatedAt()))
                .toList();
    }

    /** The payment on a booking, for its customer or provider; null if it hasn't been paid in-app. */
    @Transactional(readOnly = true)
    public PaymentView paymentFor(long bookingId, long userId) {
        bookingService.getForParticipant(bookingId, userId);
        return paymentRepository.findByBookingId(bookingId)
                .filter(p -> p.getStatus() == PaymentStatus.PAID)
                .map(p -> new PaymentView(p.getReference(), toCents(p.getAmount()), p.getPlatformFeeCents(),
                        p.getProviderAmountCents(), p.getMethod(), p.getPaidAt()))
                .orElse(null);
    }

    // --- money in and out ------------------------------------------------------------------------

    /**
     * Adds funds. The card is represented only by its brand and last four digits (the browser never
     * sends the full number); test cards ending 0002 and 9995 are declined, like real test cards.
     */
    @Transactional
    public WalletView topUp(long userId, long amountCents, String cardBrand, String cardLast4) {
        if (amountCents < MIN_TOP_UP_CENTS || amountCents > MAX_TOP_UP_CENTS) {
            throw new IllegalArgumentException("Add between R1 and R50 000 at a time.");
        }
        String last4 = cardLast4 == null ? "" : cardLast4.trim();
        if (!last4.matches("\\d{4}")) {
            throw new IllegalArgumentException("Card details are incomplete.");
        }
        if (last4.equals("0002")) {
            throw new IllegalArgumentException("Your card was declined. Try a different card.");
        }
        if (last4.equals("9995")) {
            throw new IllegalArgumentException("Your card was declined: insufficient funds.");
        }

        getOrCreate(userId);
        Wallet wallet = lock(userId);
        String brand = cardBrand == null || cardBrand.isBlank() ? "Card" : cardBrand.trim();
        addEntry(wallet, WalletEntry.Type.TOP_UP, amountCents, null, newReference(),
                "Added funds · " + brand + " •••• " + last4);
        return view(userId);
    }

    /** A one-off starting balance (demo accounts), only if the wallet has never had an entry. */
    @Transactional
    public void grantStartingBalance(long userId, long amountCents, String description) {
        Wallet wallet = getOrCreate(userId);
        if (entryRepository.existsByWallet_Id(wallet.getId())) {
            return;
        }
        addEntry(lock(userId), WalletEntry.Type.TOP_UP, amountCents, null, newReference(), description);
    }

    @Transactional
    public WalletView withdraw(long userId, long amountCents) {
        if (amountCents <= 0) {
            throw new IllegalArgumentException("Enter an amount to withdraw.");
        }
        getOrCreate(userId);
        Wallet wallet = lock(userId);
        if (wallet.getBalanceCents() < amountCents) {
            throw new IllegalStateException("You can withdraw up to " + rands(wallet.getBalanceCents()) + ".");
        }
        addEntry(wallet, WalletEntry.Type.WITHDRAWAL, -amountCents, null, newReference(), "Withdrawn to bank account");
        return view(userId);
    }

    @Transactional
    public WalletView setAutoPay(long userId, boolean enabled) {
        Wallet wallet = getOrCreate(userId);
        wallet.setAutoPay(enabled);
        walletRepository.save(wallet);
        return view(userId);
    }

    // --- paying for a job --------------------------------------------------------------------------

    /** The customer confirms a finished job and pays it from their balance. */
    @Transactional
    public PaymentView pay(long bookingId, long userId) {
        return pay(bookingId, userId, "BALANCE");
    }

    private PaymentView pay(long bookingId, long userId, String method) {
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking " + bookingId + " not found"));
        User customer = booking.getQuote().getServiceRequest().getUser();
        ProviderProfile provider = booking.getQuote().getProviderProfile();
        if (customer.getId() != userId) {
            throw new ForbiddenException("Only the customer who booked this job can pay for it.");
        }
        if (booking.getStatus() == BookingStatus.COMPLETED || paymentRepository.findByBookingId(bookingId).isPresent()) {
            throw new IllegalStateException("This job has already been paid.");
        }
        if (booking.getStatus() != BookingStatus.AWAITING_PAYMENT) {
            throw new IllegalStateException("You can pay once the provider marks the work as done.");
        }

        long amount = toCents(booking.getQuote().getAmount());
        long providerAmount = providerShare(amount);
        long fee = amount - providerAmount;

        // Make sure both wallets exist, then lock them in a fixed order (lowest user id first) so two
        // payments between the same people can never deadlock.
        long providerUserId = provider.getUser().getId();
        getOrCreate(userId);
        getOrCreate(providerUserId);
        Wallet customerWallet;
        Wallet providerWallet;
        if (userId < providerUserId) {
            customerWallet = lock(userId);
            providerWallet = lock(providerUserId);
        } else {
            providerWallet = lock(providerUserId);
            customerWallet = lock(userId);
        }

        if (customerWallet.getBalanceCents() < amount) {
            throw new IllegalStateException("Not enough balance: you need "
                    + rands(amount - customerWallet.getBalanceCents()) + " more.");
        }

        String reference = newReference();
        String job = serviceName(booking);
        addEntry(customerWallet, WalletEntry.Type.JOB_PAYMENT, -amount, booking, reference,
                "Paid " + firstName(provider.getUser()) + " for " + job);
        addEntry(providerWallet, WalletEntry.Type.JOB_EARNING, providerAmount, booking, reference,
                "Payment from " + firstName(customer) + " for " + job + " (" + rands(amount) + " less "
                        + platformFeePercent + "% fee " + rands(fee) + ")");

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setAmount(amount / 100.0);
        payment.setStatus(PaymentStatus.PAID);
        payment.setReference(reference);
        payment.setPlatformFeeCents(fee);
        payment.setProviderAmountCents(providerAmount);
        payment.setMethod(method);
        Instant now = Instant.now();
        payment.setPaidAt(now);
        payment.setCreatedAt(now);
        paymentRepository.save(payment);

        bookingService.completeByPayment(booking, "Paid " + rands(amount) + " · ref " + reference);

        messagingService.notifyProvider(customer, provider, firstName(customer) + " paid " + rands(amount)
                + " for your " + job + " job. " + rands(providerAmount) + " has been added to your balance · ref " + reference);

        return new PaymentView(reference, amount, fee, providerAmount, method, now);
    }

    /**
     * Called when a provider marks a job done: pays it straight away if the customer has auto-pay on
     * and enough balance, otherwise tells the customer it's waiting for them.
     */
    @Transactional
    public void afterWorkDone(long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking " + bookingId + " not found"));
        if (booking.getStatus() != BookingStatus.AWAITING_PAYMENT) {
            return;
        }
        User customer = booking.getQuote().getServiceRequest().getUser();
        ProviderProfile provider = booking.getQuote().getProviderProfile();
        long amount = toCents(booking.getQuote().getAmount());
        Wallet wallet = getOrCreate(customer.getId());

        if (wallet.isAutoPay() && wallet.getBalanceCents() >= amount) {
            PaymentView paid = pay(bookingId, customer.getId(), "AUTO_PAY");
            messagingService.notifyCustomer(customer, provider, "Auto-pay: " + rands(amount) + " paid to "
                    + firstName(provider.getUser()) + " for your " + serviceName(booking) + " job · ref " + paid.reference());
        } else {
            messagingService.notifyCustomer(customer, provider, firstName(provider.getUser())
                    + " marked your " + serviceName(booking) + " job as done. Confirm and pay " + rands(amount)
                    + " on the work tracker.");
        }
    }

    // --- helpers -------------------------------------------------------------------------------------

    /** The customer's wallet, created (at R0) the first time it's needed. */
    Wallet getOrCreate(long userId) {
        return walletRepository.findByUser_Id(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User " + userId + " not found"));
            Wallet wallet = new Wallet();
            wallet.setUser(user);
            wallet.setCreatedAt(Instant.now());
            try {
                return walletRepository.saveAndFlush(wallet);
            } catch (DataIntegrityViolationException raced) {
                return walletRepository.findByUser_Id(userId).orElseThrow(() -> raced);
            }
        });
    }

    private Wallet lock(long userId) {
        return walletRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
    }

    private void addEntry(Wallet wallet, WalletEntry.Type type, long amountCents, Booking booking, String reference,
                          String description) {
        WalletEntry entry = new WalletEntry();
        entry.setWallet(wallet);
        entry.setType(type);
        entry.setAmountCents(amountCents);
        entry.setBooking(booking);
        entry.setReference(reference);
        entry.setDescription(description.length() > 200 ? description.substring(0, 200) : description);
        entry.setCreatedAt(Instant.now());
        entryRepository.save(entry);

        wallet.setBalanceCents(wallet.getBalanceCents() + amountCents);
        walletRepository.save(wallet);
    }

    long providerShare(long amountCents) {
        return amountCents - Math.round(amountCents * platformFeePercent / 100.0);
    }

    static long toCents(double rands) {
        return Math.round(rands * 100);
    }

    static String rands(long cents) {
        return String.format(Locale.ROOT, "R%.2f", cents / 100.0);
    }

    private static String newReference() {
        String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder ref = new StringBuilder("UL-");
        for (int i = 0; i < 8; i++) ref.append(alphabet.charAt(RANDOM.nextInt(alphabet.length())));
        return ref.toString();
    }

    private static String serviceName(Booking booking) {
        com.geekkulcha.backend.entity.Service service = booking.getQuote().getServiceRequest().getService();
        return service == null ? "service" : service.getName().toLowerCase(Locale.ROOT);
    }

    private static String firstName(User user) {
        return user.getFirstName() == null || user.getFirstName().isBlank() ? "Your customer" : user.getFirstName();
    }
}
