package com.exceptionpro.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class PlatformSponsorshipResponse {

    private UUID id;
    private UUID userId;
    private String sponsorName;
    private String emailId;
    private String phoneNumber;
    private String amountRange;
    private String currency;
    private String accountType;
    private String submittedByEmail;
    private LocalDateTime createdAt;

    public PlatformSponsorshipResponse() {
    }

    public PlatformSponsorshipResponse(UUID id, UUID userId, String sponsorName, String emailId,
                                       String phoneNumber, String amountRange, String currency,
                                       String accountType, String submittedByEmail, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.sponsorName = sponsorName;
        this.emailId = emailId;
        this.phoneNumber = phoneNumber;
        this.amountRange = amountRange;
        this.currency = currency;
        this.accountType = accountType;
        this.submittedByEmail = submittedByEmail;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getSponsorName() {
        return sponsorName;
    }

    public void setSponsorName(String sponsorName) {
        this.sponsorName = sponsorName;
    }

    public String getEmailId() {
        return emailId;
    }

    public void setEmailId(String emailId) {
        this.emailId = emailId;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getAmountRange() {
        return amountRange;
    }

    public void setAmountRange(String amountRange) {
        this.amountRange = amountRange;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getAccountType() {
        return accountType;
    }

    public void setAccountType(String accountType) {
        this.accountType = accountType;
    }

    public String getSubmittedByEmail() {
        return submittedByEmail;
    }

    public void setSubmittedByEmail(String submittedByEmail) {
        this.submittedByEmail = submittedByEmail;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
