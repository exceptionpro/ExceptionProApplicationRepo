package com.exceptionpro.controller;

import com.exceptionpro.dto.PlatformSponsorshipRequest;
import com.exceptionpro.dto.PlatformSponsorshipResponse;
import com.exceptionpro.service.PlatformSponsorshipService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/support-platform")
public class PlatformSponsorshipController {

    private final PlatformSponsorshipService sponsorshipService;

    public PlatformSponsorshipController(PlatformSponsorshipService sponsorshipService) {
        this.sponsorshipService = sponsorshipService;
    }

    @PostMapping
    public ResponseEntity<?> submitSponsorship(@RequestBody PlatformSponsorshipRequest request,
                                               Authentication authentication) {
        try {
            String userEmail = authentication != null ? authentication.getName() : null;
            PlatformSponsorshipResponse response = sponsorshipService.submitSponsorship(request, userEmail);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to submit sponsorship details: " + e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<List<PlatformSponsorshipResponse>> getMySponsorships(Authentication authentication) {
        String userEmail = authentication.getName();
        return ResponseEntity.ok(sponsorshipService.getMySponsorships(userEmail));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PlatformSponsorshipResponse>> getAllSponsorshipsForAdmin() {
        return ResponseEntity.ok(sponsorshipService.getAllSponsorships());
    }
}
