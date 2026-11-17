package com.exceptionpro.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class FeedbackSuggestionResponse {

    private UUID id;
    private UUID userId;
    private String userName;
    private String userEmail;
    private String accountType;
    private String submissionType;
    private String feedbackText;
    private String suggestionText;
    private String screenshotUrl;
    private String screenshotFileName;
    private LocalDateTime createdAt;

    public FeedbackSuggestionResponse() {
    }

    public FeedbackSuggestionResponse(UUID id, UUID userId, String userName, String userEmail, String accountType,
                                      String submissionType, String feedbackText, String suggestionText,
                                      String screenshotUrl, String screenshotFileName, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.accountType = accountType;
        this.submissionType = submissionType;
        this.feedbackText = feedbackText;
        this.suggestionText = suggestionText;
        this.screenshotUrl = screenshotUrl;
        this.screenshotFileName = screenshotFileName;
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

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getAccountType() {
        return accountType;
    }

    public void setAccountType(String accountType) {
        this.accountType = accountType;
    }

    public String getSubmissionType() {
        return submissionType;
    }

    public void setSubmissionType(String submissionType) {
        this.submissionType = submissionType;
    }

    public String getFeedbackText() {
        return feedbackText;
    }

    public void setFeedbackText(String feedbackText) {
        this.feedbackText = feedbackText;
    }

    public String getSuggestionText() {
        return suggestionText;
    }

    public void setSuggestionText(String suggestionText) {
        this.suggestionText = suggestionText;
    }

    public String getScreenshotUrl() {
        return screenshotUrl;
    }

    public void setScreenshotUrl(String screenshotUrl) {
        this.screenshotUrl = screenshotUrl;
    }

    public String getScreenshotFileName() {
        return screenshotFileName;
    }

    public void setScreenshotFileName(String screenshotFileName) {
        this.screenshotFileName = screenshotFileName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
