package com.geekkulcha.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.geekkulcha.backend.dto.LoginRequest;
import com.geekkulcha.backend.dto.RegisterRequest;
import com.geekkulcha.backend.service.AuthService;

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

        if(token != null) {
            return ResponseEntity.ok(token);
        }

        return ResponseEntity
               .status(401)
               .body("Invalid email or password");
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        boolean registered = authService.register(request);

        if(registered) {
            return ResponseEntity.ok("Registered Successfully");
        }

        return ResponseEntity
               .status(401)
               .body("Email / Phone Number already exists. Please log in");
    }
}
