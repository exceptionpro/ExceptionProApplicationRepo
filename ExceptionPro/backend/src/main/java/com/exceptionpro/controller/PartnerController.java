package com.exceptionpro.controller;

import com.exceptionpro.dto.PartnerRequestDto;
import com.exceptionpro.dto.PartnerSearchResponse;
import com.exceptionpro.service.PartnerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/partners")
public class PartnerController {

    private final PartnerService partnerService;

    public PartnerController(PartnerService partnerService) {
        this.partnerService = partnerService;
    }

    @PostMapping("/request")
    public ResponseEntity<?> sendPartnerRequest(Principal principal, @RequestBody PartnerRequestDto requestDto) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        if (requestDto.getReceiverId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Receiver ID is required"));
        }
        try {
            partnerService.sendPartnerRequest(principal.getName(), requestDto.getReceiverId());
            return ResponseEntity.ok(Map.of("message", "Business Partner Request sent successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/requests/{requestId}/accept")
    public ResponseEntity<?> acceptPartnerRequest(Principal principal, @PathVariable UUID requestId) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            partnerService.acceptPartnerRequest(principal.getName(), requestId);
            return ResponseEntity.ok(Map.of("message", "Business Partner Request accepted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/requests/{requestId}/decline")
    public ResponseEntity<?> declinePartnerRequest(Principal principal, @PathVariable UUID requestId) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            partnerService.declinePartnerRequest(principal.getName(), requestId);
            return ResponseEntity.ok(Map.of("message", "Business Partner Request declined successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/requests/{requestId}")
    public ResponseEntity<?> cancelOrRemovePartnerRequest(Principal principal, @PathVariable UUID requestId) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            partnerService.cancelOrRemovePartnerRequest(principal.getName(), requestId);
            return ResponseEntity.ok(Map.of("message", "Partnership/Request removed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/requests/incoming")
    public ResponseEntity<?> getIncomingPendingRequests(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            List<PartnerSearchResponse> list = partnerService.getIncomingPendingRequests(principal.getName());
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/requests/outgoing")
    public ResponseEntity<?> getOutgoingPendingRequests(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            List<PartnerSearchResponse> list = partnerService.getOutgoingPendingRequests(principal.getName());
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAcceptedPartnerships(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            List<PartnerSearchResponse> list = partnerService.getAcceptedPartnerships(principal.getName());
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
