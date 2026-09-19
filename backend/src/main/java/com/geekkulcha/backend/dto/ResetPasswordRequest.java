package com.geekkulcha.backend.dto;

/**
 * "Forgot password" — DEMO ONLY, not secure. There's no email/SMS infrastructure to send a
 * real reset link/code, so this just checks that the caller knows both the account's email
 * AND phone number before allowing a new password. That's a much lower bar than a real reset
 * flow (anyone who knows both, not just the account owner, can take over the account) — see
 * PROJECT.md §8 before using this pattern anywhere that matters.
 */
public class ResetPasswordRequest {
    private String email;
    private String phoneNumber;
    private String newPassword;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
