package com.exceptionpro.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.exceptionpro.dto.FeedbackSuggestionResponse;
import com.exceptionpro.dto.PlatformSponsorshipResponse;
import com.exceptionpro.dto.ReportedPostResponse;
import com.exceptionpro.dto.UserProfileResponse;
import com.exceptionpro.service.FeedbackSuggestionService;
import com.exceptionpro.service.PlatformSponsorshipService;
import com.exceptionpro.service.PostService;
import com.exceptionpro.service.UserService;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final FeedbackSuggestionService feedbackSuggestionService;
    private final PlatformSponsorshipService platformSponsorshipService;
    private final PostService postService;

    public AdminController(UserService userService,
                           FeedbackSuggestionService feedbackSuggestionService,
                           PlatformSponsorshipService platformSponsorshipService,
                           PostService postService) {
        this.userService = userService;
        this.feedbackSuggestionService = feedbackSuggestionService;
        this.platformSponsorshipService = platformSponsorshipService;
        this.postService = postService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserProfileResponse>> getAllUsers() {
        List<UserProfileResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/feedback-suggestions")
    public ResponseEntity<List<FeedbackSuggestionResponse>> getAllFeedbackSuggestions() {
        return ResponseEntity.ok(feedbackSuggestionService.getAllFeedbackSuggestions());
    }

    @GetMapping("/support-platform")
    public ResponseEntity<List<PlatformSponsorshipResponse>> getAllPlatformSponsorships() {
        return ResponseEntity.ok(platformSponsorshipService.getAllSponsorships());
    }

    @GetMapping("/reported-posts")
    public ResponseEntity<List<ReportedPostResponse>> getReportedPosts() {
        return ResponseEntity.ok(postService.getReportedPostsForAdmin());
    }

    @PutMapping("/posts/{postId}/disable")
    public ResponseEntity<?> disablePost(@PathVariable UUID postId) {
        try {
            postService.disablePostByAdmin(postId);
            return ResponseEntity.ok(Map.of("message", "Post disabled successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<?> deletePost(@PathVariable UUID postId) {
        try {
            postService.deletePostByAdmin(postId);
            return ResponseEntity.ok(Map.of("message", "Post deleted permanently"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
