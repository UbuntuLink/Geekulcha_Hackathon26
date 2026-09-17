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

    // Auth (email/password + JWT, see AuthService/JwtService) isn't enforced on business
    // endpoints yet — see SecurityConfig — so every request acts as this fixed demo customer
    // instead of the real signed-in user. Swap for the JWT's subject claim once that's wired up.
    private static final String DEMO_CUSTOMER_EMAIL = "demo.customer@ubuntulink.local";

    private final UserRepository userRepository;
    private final ProviderProfileRepository providerProfileRepository;

    public User getDemoCustomer() {
        return userRepository.findByEmail(DEMO_CUSTOMER_EMAIL).orElseGet(() -> {
            User user = new User();
            user.setEmail(DEMO_CUSTOMER_EMAIL);
            user.setFirstName("Demo");
            user.setLastName("Customer");
            user.setCreatedAt(Instant.now());
            return userRepository.save(user);
        });
    }

    public boolean isProvider(long userId) {
        return providerProfileRepository.findByUserId(userId).isPresent();
    }
}
