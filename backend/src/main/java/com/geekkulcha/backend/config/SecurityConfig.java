package com.geekkulcha.backend.config;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Email/password + JWT auth (from the Leshen-Login branch — see PROJECT.md §8). PasswordEncoder
 * (Argon2) + JwtEncoder issue tokens via POST /auth/login and /auth/register
 * (AuthController/AuthService/JwtService). Needs a JWT_SECRET env var (32+ chars — see
 * INSTRUCTIONS.md).
 *
 * Incoming requests ARE validated now: the resource-server filter decodes/verifies the JWT
 * (same HMAC secret used to sign it) on every route except /auth/**. Controllers pull the
 * current user via UserService.getCurrentUser(jwt), reading the `sub` claim as a user id.
 */
@Configuration
public class SecurityConfig {

    @Value("${JWT_SECRET}")
    private String jwtSecret;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
    }

    private SecretKey secretKey() {
        return new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    public JwtEncoder jwtEncoder() {
        return NimbusJwtEncoder.withSecretKey(secretKey()).build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withSecretKey(secretKey()).macAlgorithm(MacAlgorithm.HS256).build();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, CorsConfigurationSource corsConfigurationSource,
                                                     JwtDecoder jwtDecoder) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                                "/auth/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.decoder(jwtDecoder)));

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Origin patterns rather than exact origins, so the deployed frontend keeps working when
        // its URL changes — Vercel issues a new per-deploy hostname every push, plus branch and
        // preview URLs, and any of them would otherwise be rejected.
        List<String> allowedOriginPatterns = new ArrayList<>(List.of(
                "http://localhost:5173",
                "https://*.vercel.app"
        ));

        // FRONTEND_URL is set in Render's dashboard and may be absent, empty, or a comma-separated
        // list. Blanks are filtered out deliberately: getenv().getOrDefault() only falls back when
        // the key is *absent*, so a variable created with an empty value used to put "" into this
        // list, match no origin at all, and reject every browser request with a 403 at preflight —
        // invisible in the backend logs, because the request never reaches a controller.
        String frontendUrl = System.getenv("FRONTEND_URL");
        if (frontendUrl != null) {
            Arrays.stream(frontendUrl.split(","))
                    .map(String::trim)
                    .filter(origin -> !origin.isEmpty())
                    .forEach(allowedOriginPatterns::add);
        }

        configuration.setAllowedOriginPatterns(allowedOriginPatterns);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
