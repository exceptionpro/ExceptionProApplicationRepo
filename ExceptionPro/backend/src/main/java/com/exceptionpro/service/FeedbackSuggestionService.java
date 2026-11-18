package com.exceptionpro.service;

import com.exceptionpro.dto.FeedbackSuggestionRequest;
import com.exceptionpro.dto.FeedbackSuggestionResponse;
import com.exceptionpro.entity.FeedbackSuggestion;
import com.exceptionpro.entity.User;
import com.exceptionpro.repository.FeedbackSuggestionRepository;
import com.exceptionpro.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class FeedbackSuggestionService {

    private final FeedbackSuggestionRepository feedbackSuggestionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public FeedbackSuggestionService(FeedbackSuggestionRepository feedbackSuggestionRepository,
                                     UserRepository userRepository,
                                     NotificationService notificationService) {
        this.feedbackSuggestionRepository = feedbackSuggestionRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public FeedbackSuggestionResponse submitFeedbackSuggestion(FeedbackSuggestionRequest request, String userEmail) {
        if (request.getId() != null) {
            return updateFeedbackSuggestion(request.getId(), request, userEmail);
        }

        User user = userRepository.findByEmailFetchProfiles(userEmail)
                .orElseGet(() -> userRepository.findByEmail(userEmail)
                        .orElseThrow(() -> new IllegalArgumentException("User not found")));

        String feedbackText = request.getFeedbackText() != null ? request.getFeedbackText().trim() : "";
        String suggestionText = request.getSuggestionText() != null ? request.getSuggestionText().trim() : "";
        String screenshotUrl = request.getScreenshotUrl() != null ? request.getScreenshotUrl().trim() : "";
        String screenshotFileName = request.getScreenshotFileName() != null ? request.getScreenshotFileName().trim() : "";

        if (feedbackText.isEmpty() && suggestionText.isEmpty()) {
            throw new IllegalArgumentException("Please enter Feedback or Suggestions / Detailed steps before submitting.");
        }

        String submissionType = request.getSubmissionType();
        if (submissionType == null || submissionType.isBlank()) {
            if (!feedbackText.isEmpty() && !suggestionText.isEmpty()) {
                submissionType = "Feedback & Suggestion";
            } else if (!feedbackText.isEmpty()) {
                submissionType = "Feedback";
            } else {
                submissionType = "Suggestion";
            }
        }

        String displayName = resolveUserDisplayName(user);
        String accountType = user.getAccountType() != null && !user.getAccountType().isBlank()
                ? user.getAccountType()
                : ("ROLE_ADMIN".equalsIgnoreCase(user.getRole()) ? "Admin" : "Member");

        FeedbackSuggestion entity = new FeedbackSuggestion();
        entity.setId(UUID.randomUUID());
        entity.setUser(user);
        entity.setUserName(displayName);
        entity.setUserEmail(user.getEmail());
        entity.setAccountType(accountType);
        entity.setSubmissionType(submissionType);
        entity.setFeedbackText(feedbackText.isEmpty() ? null : feedbackText);
        entity.setSuggestionText(suggestionText.isEmpty() ? null : suggestionText);
        entity.setScreenshotUrl(screenshotUrl.isEmpty() ? null : screenshotUrl);
        entity.setScreenshotFileName(screenshotFileName.isEmpty() ? null : screenshotFileName);
        entity.setCreatedAt(LocalDateTime.now());

        FeedbackSuggestion saved = feedbackSuggestionRepository.save(entity);

        // Notify Admin users
        try {
            List<User> allUsers = userRepository.findAll();
            for (User u : allUsers) {
                if (u != null && "ROLE_ADMIN".equalsIgnoreCase(u.getRole())) {
                    String summaryMsg = displayName + " (" + user.getEmail() + ") submitted new " + submissionType + ".";
                    String commentDetail = !feedbackText.isEmpty() ? feedbackText : suggestionText;
                    notificationService.createNotification(
                            u,
                            user,
                            "FEEDBACK",
                            "New " + submissionType + " Submitted",
                            summaryMsg,
                            commentDetail,
                            saved.getId(),
                            "FEEDBACK_SUGGESTION"
                    );
                }
            }
        } catch (Exception ignored) {
            // Do not fail submission if notification fails
        }

        return mapToResponse(saved);
    }

    public FeedbackSuggestionResponse updateFeedbackSuggestion(UUID id, FeedbackSuggestionRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        FeedbackSuggestion entity = feedbackSuggestionRepository.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Feedback / Suggestion record not found"));

        if (entity.getUser() != null && !entity.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You are not authorized to edit this record.");
        }

        String feedbackText = request.getFeedbackText() != null ? request.getFeedbackText().trim() : "";
        String suggestionText = request.getSuggestionText() != null ? request.getSuggestionText().trim() : "";

        if ("Feedback".equalsIgnoreCase(entity.getSubmissionType())) {
            if (feedbackText.isEmpty()) {
                throw new IllegalArgumentException("Please enter your Feedback before saving.");
            }
            entity.setFeedbackText(feedbackText);
        } else if ("Suggestion".equalsIgnoreCase(entity.getSubmissionType())) {
            if (suggestionText.isEmpty()) {
                throw new IllegalArgumentException("Please enter Detailed steps in the Suggestions section before saving.");
            }
            entity.setSuggestionText(suggestionText);
            if (request.getScreenshotUrl() != null) {
                String url = request.getScreenshotUrl().trim();
                entity.setScreenshotUrl(url.isEmpty() ? null : url);
            }
            if (request.getScreenshotFileName() != null) {
                String fname = request.getScreenshotFileName().trim();
                entity.setScreenshotFileName(fname.isEmpty() ? null : fname);
            }
        } else {
            if (feedbackText.isEmpty() && suggestionText.isEmpty()) {
                throw new IllegalArgumentException("Please enter Feedback or Suggestions / Detailed steps before saving.");
            }
            entity.setFeedbackText(feedbackText.isEmpty() ? null : feedbackText);
            entity.setSuggestionText(suggestionText.isEmpty() ? null : suggestionText);
            if (request.getScreenshotUrl() != null) {
                String url = request.getScreenshotUrl().trim();
                entity.setScreenshotUrl(url.isEmpty() ? null : url);
            }
            if (request.getScreenshotFileName() != null) {
                String fname = request.getScreenshotFileName().trim();
                entity.setScreenshotFileName(fname.isEmpty() ? null : fname);
            }
        }

        FeedbackSuggestion updated = feedbackSuggestionRepository.save(entity);
        return mapToResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<FeedbackSuggestionResponse> getAllFeedbackSuggestions() {
        List<FeedbackSuggestion> list = feedbackSuggestionRepository.findAllByOrderByCreatedAtDesc();
        if (list == null) {
            return Collections.emptyList();
        }
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FeedbackSuggestionResponse> getMyFeedbackSuggestions(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<FeedbackSuggestion> list = feedbackSuggestionRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        if (list == null) {
            return Collections.emptyList();
        }
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private String resolveUserDisplayName(User user) {
        if (user.getCorporateProfile() != null && user.getCorporateProfile().getOrganizationName() != null
                && !user.getCorporateProfile().getOrganizationName().isBlank()) {
            return user.getCorporateProfile().getOrganizationName().trim();
        }
        if (user.getIndividualProfile() != null) {
            String first = user.getIndividualProfile().getFirstName() != null ? user.getIndividualProfile().getFirstName().trim() : "";
            String last = user.getIndividualProfile().getLastName() != null ? user.getIndividualProfile().getLastName().trim() : "";
            String full = (first + " " + last).trim();
            if (!full.isEmpty()) {
                return full;
            }
        }
        return user.getEmail();
    }

    private FeedbackSuggestionResponse mapToResponse(FeedbackSuggestion entity) {
        return new FeedbackSuggestionResponse(
                entity.getId(),
                entity.getUser() != null ? entity.getUser().getId() : null,
                entity.getUserName(),
                entity.getUserEmail(),
                entity.getAccountType(),
                entity.getSubmissionType(),
                entity.getFeedbackText(),
                entity.getSuggestionText(),
                entity.getScreenshotUrl(),
                entity.getScreenshotFileName(),
                entity.getCreatedAt()
        );
    }
}
