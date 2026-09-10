package com.geekkulcha.backend.service;

import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.geekkulcha.backend.dto.LoginRequest;
import com.geekkulcha.backend.entity.User;
import com.geekkulcha.backend.repository.UserRepository;

@Service 
public class AuthService {
    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;

    public AuthService(
        UserRepository userRepository, 
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }


    public boolean login(LoginRequest request) {
        String requestedUserEmail = request.getEmail();
        String requestedUserPassword = request.getPassword();

        Optional<User> user = userRepository.findByEmail(requestedUserEmail);

        if(user.isEmpty()) {
            return false;
        }

        String hashedPassword = user.get().getPasswordHash();
        return passwordEncoder.matches(requestedUserPassword, hashedPassword);
    }
}
