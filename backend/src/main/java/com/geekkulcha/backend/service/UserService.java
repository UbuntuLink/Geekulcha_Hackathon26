package com.geekkulcha.backend.service;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import com.geekkulcha.backend.entity.ProviderProfile;
import com.geekkulcha.backend.entity.User;
import com.geekkulcha.backend.exception.ResourceNotFoundException;
import com.geekkulcha.backend.repository.ProviderProfileRepository;
import com.geekkulcha.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;

    /** The JWT's `sub` claim is the user's id (see JwtService.generateToken). */
    public User getCurrentUser(Jwt jwt) {
        long userId = Long.parseLong(jwt.getSubject());
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User " + userId + " not found"));
    }

    public boolean isProvider(long userId) {
        return providerProfileRepository
                .findByUserId(userId)
                .map(ProviderProfile::isIdValidated)
                .orElse(false);
    }
}
