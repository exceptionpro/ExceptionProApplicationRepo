package com.exceptionpro.controller;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.exceptionpro.dto.CollaborationRequisitionRequest;
import com.exceptionpro.dto.CollaborationRequisitionResponse;
import com.exceptionpro.dto.CreateCollabPoRequest;
import com.exceptionpro.dto.ProposalRequest;
import com.exceptionpro.dto.RequisitionResponse;
import com.exceptionpro.dto.SupplierActionRequest;
import com.exceptionpro.service.CollaborationRequisitionService;

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
            return ResponseEntity.ok(list != null ? list : java.util.Collections.emptyList());
        } catch (Exception e) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
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
            String fileUrl = request != null ? request.getFileUrl() : null;
            String fileName = request != null ? request.getFileName() : null;
            CollaborationRequisitionResponse response = collaborationRequisitionService.submitProposal(id, text, fileUrl, fileName, principal.getName());
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

    @PutMapping("/{id}/proposals/evaluate-all")
    public ResponseEntity<?> evaluateAllProposals(Principal principal, @PathVariable UUID id, @RequestParam("status") String status) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            CollaborationRequisitionResponse response = collaborationRequisitionService.evaluateAllProposals(id, status, principal.getName());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Failed to evaluate proposals"));
        }
    }

    @PutMapping("/{id}/suppliers/{supplierId}/decline")
    public ResponseEntity<?> declineAcceptedSupplier(Principal principal, @PathVariable UUID id, @PathVariable UUID supplierId) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            CollaborationRequisitionResponse response = collaborationRequisitionService.declineAcceptedSupplierByBuyer(id, supplierId, principal.getName());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Failed to decline supplier"));
        }
    }

    @PostMapping("/{id}/create-po")
    public ResponseEntity<?> createPurchaseOrders(Principal principal, @PathVariable UUID id, @RequestBody CreateCollabPoRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            List<RequisitionResponse> responses = collaborationRequisitionService.createPurchaseOrdersFromCollab(id, request, principal.getName());
            return ResponseEntity.ok(responses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Failed to create Purchase Order"));
        }
    }
}
