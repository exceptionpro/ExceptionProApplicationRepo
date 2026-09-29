package com.exceptionpro.dto;

public class LoginResponse {

    private String token;
    private String email;
    private String role;
    private String accountType;
    private boolean profileComplete;

    public LoginResponse(String token, String email, String role, String accountType, boolean profileComplete) {
        this.token = token;
        this.email = email;
        this.role = role;
        this.accountType = accountType;
        this.profileComplete = profileComplete;
    }

    // Getters and Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }

    public boolean isProfileComplete() { return profileComplete; }
    public void setProfileComplete(boolean profileComplete) { this.profileComplete = profileComplete; }
}
