package com.geekkulcha.backend.controller;

import com.geekkulcha.backend.dto.response.UserResponse;
import com.geekkulcha.backend.entity.User;
import com.geekkulcha.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Google sign-in itself is handled by Spring Security at GET /oauth2/authorization/google
 * (redirects to Google, then back here once GOOGLE_CLIENT_ID/SECRET are set — see §8).
 * This controller just exposes "who am I" for the frontend to call after the redirect.
 *
 * Google login is currently disabled (see SecurityConfig), so principal is always null here —
 * this returns 401 rather than NPE-ing until auth is wired back in.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal OidcUser principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userService.findOrCreate(
                principal.getSubject(),
                principal.getEmail(),
                principal.getGivenName(),
                principal.getFamilyName()
        );
        return ResponseEntity.ok(new UserResponse(user.getId(), user.getEmail(), user.getFirstName(),
                user.getLastName(), userService.isProvider(user.getId())));
    }
}
