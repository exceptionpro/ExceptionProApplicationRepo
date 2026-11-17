package com.exceptionpro.controller;

import com.exceptionpro.dto.FeedbackSuggestionRequest;
import com.exceptionpro.dto.FeedbackSuggestionResponse;
import com.exceptionpro.service.FeedbackSuggestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback-suggestions")
public class FeedbackSuggestionController {

    private final FeedbackSuggestionService feedbackSuggestionService;

    public FeedbackSuggestionController(FeedbackSuggestionService feedbackSuggestionService) {
        this.feedbackSuggestionService = feedbackSuggestionService;
    }

    @PostMapping
    public ResponseEntity<?> submitFeedbackSuggestion(@RequestBody FeedbackSuggestionRequest request,
                                                      Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            FeedbackSuggestionResponse response = feedbackSuggestionService.submitFeedbackSuggestion(request, userEmail);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to submit feedback/suggestion: " + e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<List<FeedbackSuggestionResponse>> getMyFeedbackSuggestions(Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(feedbackSuggestionService.getMyFeedbackSuggestions(userEmail));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<FeedbackSuggestionResponse>> getAllFeedbackSuggestionsForAdmin() {
        return ResponseEntity.ok(feedbackSuggestionService.getAllFeedbackSuggestions());
    }
}
