package com.exceptionpro.controller;

import com.exceptionpro.dto.PartnerSearchResponse;
import com.exceptionpro.dto.PartnerRecommendationsResponse;
import com.exceptionpro.service.PartnerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final PartnerService partnerService;

    public UserController(PartnerService partnerService) {
        this.partnerService = partnerService;
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(Principal principal, @RequestParam(value = "query", required = false, defaultValue = "") String query) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            List<PartnerSearchResponse> results = partnerService.searchUsers(principal.getName(), query);
            return ResponseEntity.ok(results);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/recommendations")
    public ResponseEntity<?> getRecommendations(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            PartnerRecommendationsResponse results = partnerService.getRecommendations(principal.getName());
            return ResponseEntity.ok(results);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile(Principal principal, @RequestParam("email") String email) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            PartnerSearchResponse result = partnerService.getUserProfileAndStatus(principal.getName(), email);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
