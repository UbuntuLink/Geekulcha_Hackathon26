package com.geekkulcha.backend.controller;

import com.geekkulcha.backend.dto.response.UserResponse;
import com.geekkulcha.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** "Who am I" — the frontend calls this right after login/register to know who's signed in. */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        var user = userService.getCurrentUser(jwt);
        return new UserResponse(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(),
                userService.isProvider(user.getId()));
    }
}
