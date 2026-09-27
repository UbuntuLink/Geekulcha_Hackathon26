package com.geekkulcha.backend.service;

import com.geekkulcha.backend.entity.*;
import com.geekkulcha.backend.exception.ForbiddenException;
import com.geekkulcha.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class WalletServiceTest {

    private static final long CUSTOMER_ID = 1L;
    private static final long PROVIDER_USER_ID = 2L;
    private static final long BOOKING_ID = 10L;

    private WalletRepository walletRepository;
    private WalletEntryRepository entryRepository;
    private PaymentRepository paymentRepository;
    private BookingService bookingService;
    private MessagingService messagingService;
    private WalletService service;
    private Booking booking;
    private final Map<Long, Wallet> wallets = new HashMap<>();

    @BeforeEach
    void setUp() {
        walletRepository = mock(WalletRepository.class);
        entryRepository = mock(WalletEntryRepository.class);
        paymentRepository = mock(PaymentRepository.class);
        bookingService = mock(BookingService.class);
        messagingService = mock(MessagingService.class);
        UserRepository userRepository = mock(UserRepository.class);
        BookingRepository bookingRepository = mock(BookingRepository.class);
        service = new WalletService(walletRepository, entryRepository, userRepository, bookingRepository,
                paymentRepository, bookingService, messagingService);

        User customer = user(CUSTOMER_ID, "Thandi");
        User providerUser = user(PROVIDER_USER_ID, "Thabo");
        ProviderProfile provider = new ProviderProfile();
        provider.setUser(providerUser);
        ServiceRequest request = new ServiceRequest();
        request.setUser(customer);
        Quote quote = new Quote();
        quote.setServiceRequest(request);
        quote.setProviderProfile(provider);
        quote.setAmount(650);
        booking = new Booking();
        booking.setId(BOOKING_ID);
        booking.setQuote(quote);
        booking.setStatus(BookingStatus.AWAITING_PAYMENT);

        wallets.put(CUSTOMER_ID, wallet(customer, 200_000));
        wallets.put(PROVIDER_USER_ID, wallet(providerUser, 0));

        when(bookingRepository.findByIdForUpdate(BOOKING_ID)).thenReturn(Optional.of(booking));
        when(walletRepository.findByUser_Id(anyLong())).thenAnswer(inv -> Optional.ofNullable(wallets.get(inv.<Long>getArgument(0))));
        when(walletRepository.findByUserIdForUpdate(anyLong())).thenAnswer(inv -> Optional.ofNullable(wallets.get(inv.<Long>getArgument(0))));
        when(paymentRepository.findByBookingId(BOOKING_ID)).thenReturn(Optional.empty());
    }

    @Test
    void payingMovesTheAmountFromCustomerToProviderLessTheFee() {
        WalletService.PaymentView paid = service.pay(BOOKING_ID, CUSTOMER_ID);

        assertEquals(65_000, paid.amountCents());
        assertEquals(6_500, paid.platformFeeCents());
        assertEquals(58_500, paid.providerAmountCents());
        assertEquals(200_000 - 65_000, wallets.get(CUSTOMER_ID).getBalanceCents());
        assertEquals(58_500, wallets.get(PROVIDER_USER_ID).getBalanceCents());
        // The ledger balances: customer's debit = provider's credit + fee.
        assertEquals(paid.amountCents(), paid.providerAmountCents() + paid.platformFeeCents());

        verify(bookingService).completeByPayment(eq(booking), anyString());
        verify(messagingService).notifyProvider(any(), any(), anyString());
        ArgumentCaptor<WalletEntry> entries = ArgumentCaptor.forClass(WalletEntry.class);
        verify(entryRepository, times(2)).save(entries.capture());
        assertEquals(WalletEntry.Type.JOB_PAYMENT, entries.getAllValues().get(0).getType());
        assertEquals(WalletEntry.Type.JOB_EARNING, entries.getAllValues().get(1).getType());
    }

    @Test
    void notEnoughBalanceIsRefusedAndNothingMoves() {
        wallets.get(CUSTOMER_ID).setBalanceCents(50_000);

        IllegalStateException error = assertThrows(IllegalStateException.class, () -> service.pay(BOOKING_ID, CUSTOMER_ID));
        assertTrue(error.getMessage().contains("R150.00 more"), error.getMessage());
        assertEquals(50_000, wallets.get(CUSTOMER_ID).getBalanceCents());
        assertEquals(0, wallets.get(PROVIDER_USER_ID).getBalanceCents());
        verify(entryRepository, never()).save(any());
    }

    @Test
    void onlyTheCustomerCanPayAndOnlyOnce() {
        assertThrows(ForbiddenException.class, () -> service.pay(BOOKING_ID, PROVIDER_USER_ID));

        when(paymentRepository.findByBookingId(BOOKING_ID)).thenReturn(Optional.of(new Payment()));
        assertThrows(IllegalStateException.class, () -> service.pay(BOOKING_ID, CUSTOMER_ID));
        verify(entryRepository, never()).save(any());
    }

    @Test
    void cannotPayBeforeTheWorkIsDone() {
        booking.setStatus(BookingStatus.IN_PROGRESS);
        assertThrows(IllegalStateException.class, () -> service.pay(BOOKING_ID, CUSTOMER_ID));
    }

    @Test
    void topUpsAddFundsAndTestCardsDecline() {
        service.topUp(CUSTOMER_ID, 50_000, "Visa", "4242");
        assertEquals(250_000, wallets.get(CUSTOMER_ID).getBalanceCents());

        assertThrows(IllegalArgumentException.class, () -> service.topUp(CUSTOMER_ID, 50_000, "Visa", "0002"));
        assertThrows(IllegalArgumentException.class, () -> service.topUp(CUSTOMER_ID, 50, "Visa", "4242"));
        assertEquals(250_000, wallets.get(CUSTOMER_ID).getBalanceCents());
    }

    @Test
    void withdrawalsCantExceedTheBalance() {
        wallets.get(PROVIDER_USER_ID).setBalanceCents(10_000);
        assertThrows(IllegalStateException.class, () -> service.withdraw(PROVIDER_USER_ID, 20_000));
        service.withdraw(PROVIDER_USER_ID, 10_000);
        assertEquals(0, wallets.get(PROVIDER_USER_ID).getBalanceCents());
    }

    private static User user(long id, String firstName) {
        User user = new User();
        user.setId(id);
        user.setFirstName(firstName);
        return user;
    }

    private static Wallet wallet(User user, long balanceCents) {
        Wallet wallet = new Wallet();
        wallet.setUser(user);
        wallet.setBalanceCents(balanceCents);
        return wallet;
    }
}
