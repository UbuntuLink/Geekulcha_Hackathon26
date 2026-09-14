package com.geekkulcha.backend.service;


import java.time.Instant;

import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import com.geekkulcha.backend.entity.User;

@Service
public class JwtService {
    private final JwtEncoder jwtEncoder;

    public JwtService(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    public String generateToken(User user) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(3600);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                                            .subject(user.getId().toString())
                                            .issuedAt(now)
                                            .expiresAt(expiry)
                                            .build();

        JwtEncoderParameters parameters =
                JwtEncoderParameters.from(claims);

        return jwtEncoder
                .encode(parameters)
                .getTokenValue();
    }
}
