package com.geekkulcha.backend.controller;

import com.geekkulcha.backend.service.UserService;
import com.geekkulcha.backend.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** In-app balances and paying for completed jobs. Rules live in WalletService. */
@RestController
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final UserService userService;

    public record TopUpRequest(long amountCents, String cardBrand, String cardLast4) {
    }

    public record WithdrawRequest(long amountCents) {
    }

    public record AutoPayRequest(boolean enabled) {
    }

    @GetMapping("/api/wallet")
    public WalletService.WalletView wallet(@AuthenticationPrincipal Jwt jwt) {
        return walletService.view(me(jwt));
    }

    @GetMapping("/api/wallet/entries")
    public List<WalletService.EntryView> entries(@AuthenticationPrincipal Jwt jwt) {
        return walletService.history(me(jwt));
    }

    @PostMapping("/api/wallet/top-up")
    public WalletService.WalletView topUp(@AuthenticationPrincipal Jwt jwt, @RequestBody TopUpRequest request) {
        return walletService.topUp(me(jwt), request.amountCents(), request.cardBrand(), request.cardLast4());
    }

    @PostMapping("/api/wallet/withdraw")
    public WalletService.WalletView withdraw(@AuthenticationPrincipal Jwt jwt, @RequestBody WithdrawRequest request) {
        return walletService.withdraw(me(jwt), request.amountCents());
    }

    @PatchMapping("/api/wallet/auto-pay")
    public WalletService.WalletView autoPay(@AuthenticationPrincipal Jwt jwt, @RequestBody AutoPayRequest request) {
        return walletService.setAutoPay(me(jwt), request.enabled());
    }

    /** The customer confirms a finished job and pays it from their balance. */
    @PostMapping("/api/bookings/{bookingId}/pay")
    public WalletService.PaymentView pay(@AuthenticationPrincipal Jwt jwt, @PathVariable long bookingId) {
        return walletService.pay(bookingId, me(jwt));
    }

    /** The payment on a booking (reference, amount, fee), or empty if not paid yet. */
    @GetMapping("/api/bookings/{bookingId}/payment")
    public WalletService.PaymentView payment(@AuthenticationPrincipal Jwt jwt, @PathVariable long bookingId) {
        return walletService.paymentFor(bookingId, me(jwt));
    }

    private long me(Jwt jwt) {
        return userService.getCurrentUser(jwt).getId();
    }
}
