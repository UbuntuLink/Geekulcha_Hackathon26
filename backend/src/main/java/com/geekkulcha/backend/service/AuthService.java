package com.geekkulcha.backend.service;

import java.time.Instant;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.geekkulcha.backend.dto.LoginRequest;
import com.geekkulcha.backend.dto.RegisterRequest;
import com.geekkulcha.backend.entity.ProviderProfile;
import com.geekkulcha.backend.entity.User;
import com.geekkulcha.backend.repository.ProviderProfileRepository;
import com.geekkulcha.backend.repository.UserRepository;

@Service
public class AuthService {
    private UserRepository userRepository;
    private ProviderProfileRepository providerProfileRepository;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;

    public AuthService(
        UserRepository userRepository,
        ProviderProfileRepository providerProfileRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.providerProfileRepository = providerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }


    public String login(LoginRequest request) {
        String requestedUserEmail = request.getEmail();
        String requestedUserPassword = request.getPassword();

        Optional<User> user = userRepository.findByEmail(requestedUserEmail);

        if(user.isEmpty()) {
            return null;
        }

        String hashedPassword = user.get().getPasswordHash();
        boolean passwordMatches = passwordEncoder.matches(requestedUserPassword, hashedPassword);

        if(!passwordMatches) {
            return null;
        }

        return jwtService.generateToken(user.get());
    }

    public boolean register(RegisterRequest request) {
        String newUserEmail = request.getEmail();
        String newUserFirstName = request.getFirstName();
        String newUserLastName = request.getLastName();
        String newUserPhoneNumber = request.getPhoneNumber();
    
        Optional<User> userEmail = userRepository.findByEmail(newUserEmail);
        Optional<User> userPhoneNumber = userRepository.findByPhoneNumber(newUserPhoneNumber);

        if(userEmail.isPresent() || userPhoneNumber.isPresent()) {
            return false;
        }

        String newUserEncodedPassword = passwordEncoder.encode(request.getPassword());
        Instant now = Instant.now();

        User newUser = new User();

        newUser.setEmail(newUserEmail);
        newUser.setFirstName(newUserFirstName);
        newUser.setLastName(newUserLastName);
        newUser.setPasswordHash(newUserEncodedPassword);
        newUser.setPhoneNumber(newUserPhoneNumber);
        newUser.setCreatedAt(now);

        User savedUser = userRepository.save(newUser);

        if (request.isIsProvider()) {
            ProviderProfile profile = new ProviderProfile();
            profile.setUser(savedUser);
            profile.setBio("");
            profile.setLocation("");
            providerProfileRepository.save(profile);
        }

        return true;

    }
}
