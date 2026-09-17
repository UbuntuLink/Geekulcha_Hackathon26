package com.geekkulcha.backend.service;

import com.geekkulcha.backend.entity.User;
import com.geekkulcha.backend.repository.ProviderProfileRepository;
import com.geekkulcha.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class UserService {

    // Auth is disabled for now (PROJECT.md §8) — every request acts as this fixed demo
    // customer instead of a real signed-in user. Remove once Google login is back.
    private static final String DEMO_CUSTOMER_GOOGLE_SUB = "demo-customer";

    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;

    /** Looks up the local {@link User} by Google subject id, creating one on first login. */
    public User findOrCreate(String googleSub, String email, String firstName, String lastName) {
        return userRepository.findByGoogleSub(googleSub).orElseGet(() -> {
            User user = new User();
            user.setGoogleSub(googleSub);
            user.setEmail(email);
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setCreatedAt(Instant.now());
            return userRepository.save(user);
        });
    }

    public User getDemoCustomer() {
        return findOrCreate(DEMO_CUSTOMER_GOOGLE_SUB, "demo.customer@ubuntulink.local", "Demo", "Customer");
    }

    public boolean isProvider(long userId) {
        return providerProfileRepository.findByUserId(userId).isPresent();
    }
}
