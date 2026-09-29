package com.exceptionpro.controller;

import com.exceptionpro.dto.CollaborationRequisitionRequest;
import com.exceptionpro.dto.CollaborationRequisitionResponse;
import com.exceptionpro.dto.ProposalRequest;
import com.exceptionpro.dto.SupplierActionRequest;
import com.exceptionpro.service.CollaborationRequisitionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/collaboration-requisitions")
public class CollaborationRequisitionController {

    private final CollaborationRequisitionService collaborationRequisitionService;

    public CollaborationRequisitionController(CollaborationRequisitionService collaborationRequisitionService) {
        this.collaborationRequisitionService = collaborationRequisitionService;
    }

    @GetMapping
    public ResponseEntity<?> getBuyerCollaborationRequisitions(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            List<CollaborationRequisitionResponse> list = collaborationRequisitionService.getUserCollaborationRequisitions(principal.getName());
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Failed to fetch collaboration requisitions"));
        }
    }

    @PostMapping
    public ResponseEntity<?> createCollaborationRequisition(Principal principal, @RequestBody CollaborationRequisitionRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            CollaborationRequisitionResponse response = collaborationRequisitionService.createCollaborationRequisition(request, principal.getName());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Failed to create collaboration requisition"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCollaborationRequisition(Principal principal, @PathVariable UUID id, @RequestBody CollaborationRequisitionRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            CollaborationRequisitionResponse response = collaborationRequisitionService.updateCollaborationRequisition(id, request, principal.getName());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Failed to update collaboration requisition"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCollaborationRequisition(Principal principal, @PathVariable UUID id) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            collaborationRequisitionService.deleteCollaborationRequisition(id, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Collaboration Requisition deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Failed to delete collaboration requisition"));
        }
    }

    @GetMapping("/requests")
    public ResponseEntity<?> getSupplierCollaborationRequests(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            List<CollaborationRequisitionResponse> list = collaborationRequisitionService.getSupplierCollaborationRequests(principal.getName());
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Failed to fetch collaboration requests"));
        }
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<?> acceptCollaborationRequisition(Principal principal, @PathVariable UUID id, @RequestBody(required = false) SupplierActionRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            String comments = request != null ? request.getComments() : null;
            CollaborationRequisitionResponse response = collaborationRequisitionService.acceptCollaborationRequisition(id, comments, principal.getName());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Failed to accept collaboration requisition"));
        }
    }

    @PutMapping("/{id}/decline")
    public ResponseEntity<?> declineCollaborationRequisition(Principal principal, @PathVariable UUID id, @RequestBody(required = false) SupplierActionRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            String comments = request != null ? request.getComments() : null;
            CollaborationRequisitionResponse response = collaborationRequisitionService.declineCollaborationRequisition(id, comments, principal.getName());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Failed to decline collaboration requisition"));
        }
    }

    @PostMapping("/{id}/proposal")
    public ResponseEntity<?> submitProposal(Principal principal, @PathVariable UUID id, @RequestBody ProposalRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            String text = request != null ? request.getProposalText() : null;
            CollaborationRequisitionResponse response = collaborationRequisitionService.submitProposal(id, text, principal.getName());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Failed to send supplier proposal"));
        }
    }

    @PutMapping("/proposals/{proposalId}/evaluate")
    public ResponseEntity<?> evaluateProposal(Principal principal, @PathVariable UUID proposalId, @RequestParam("status") String status) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            CollaborationRequisitionResponse response = collaborationRequisitionService.evaluateProposal(proposalId, status, principal.getName());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Failed to evaluate proposal"));
        }
    }
}
