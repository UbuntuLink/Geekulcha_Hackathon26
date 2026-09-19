package com.geekkulcha.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.geekkulcha.backend.dto.LoginRequest;
import com.geekkulcha.backend.dto.RegisterRequest;
import com.geekkulcha.backend.dto.ResetPasswordRequest;
import com.geekkulcha.backend.service.AuthService;

/**
 * Email/password + JWT auth (from the Leshen-Login branch — see PROJECT.md §8). Login returns a
 * raw JWT string. Every other route requires it (SecurityConfig) — this controller and
 * everything under /auth/** is the one part of the API that's intentionally public.
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest request) {
        String token = authService.login(request);

        if (token != null) {
            return ResponseEntity.ok(token);
        }

        return ResponseEntity
               .status(401)
               .body("Invalid email or password");
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        boolean registered = authService.register(request);

        if (registered) {
            return ResponseEntity.ok("Registered Successfully");
        }

        return ResponseEntity
               .status(401)
               .body("Email / Phone Number already exists. Please log in");
    }

    /** DEMO ONLY — see ResetPasswordRequest's javadoc for why this isn't a real reset flow. */
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest request) {
        boolean reset = authService.resetPassword(request);

        if (reset) {
            return ResponseEntity.ok("Password updated. Please log in.");
        }

        return ResponseEntity
               .status(401)
               .body("We couldn't find an account matching that email and phone number.");
    }
}
