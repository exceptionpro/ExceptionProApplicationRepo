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

import com.exceptionpro.dto.ReplacementRequestPayload;
import com.exceptionpro.dto.ReplacementRequestResponse;
import com.exceptionpro.dto.SupplierReplacementApprovalRequest;
import com.exceptionpro.service.ReplacementRequestService;

@RestController
@RequestMapping("/api/replacement-requests")
public class ReplacementRequestController {

    private final ReplacementRequestService replacementRequestService;

    public ReplacementRequestController(ReplacementRequestService replacementRequestService) {
        this.replacementRequestService = replacementRequestService;
    }

    @GetMapping
    public ResponseEntity<?> getReplacementRequests(Principal principal, @RequestParam(required = false) String role) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            List<ReplacementRequestResponse> list;
            if ("supplier".equalsIgnoreCase(role)) {
                list = replacementRequestService.getSupplierReplacementRequests(principal.getName());
            } else if ("buyer".equalsIgnoreCase(role)) {
                list = replacementRequestService.getBuyerReplacementRequests(principal.getName());
            } else {
                list = replacementRequestService.getUserReplacementRequests(principal.getName());
            }
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/supplier")
    public ResponseEntity<?> getSupplierReplacementRequests(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            List<ReplacementRequestResponse> list = replacementRequestService.getSupplierReplacementRequests(principal.getName());
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getReplacementRequestById(Principal principal, @PathVariable UUID id) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            ReplacementRequestResponse response = replacementRequestService.getReplacementRequestById(id, principal.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/supplier-approval")
    public ResponseEntity<?> approveReplacementBySupplier(Principal principal,
                                                          @PathVariable UUID id,
                                                          @RequestBody SupplierReplacementApprovalRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            ReplacementRequestResponse response = replacementRequestService.approveReplacementBySupplier(id, request, principal.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/supplier-approval")
    public ResponseEntity<?> approveReplacementBySupplierPut(Principal principal,
                                                             @PathVariable UUID id,
                                                             @RequestBody SupplierReplacementApprovalRequest request) {
        return approveReplacementBySupplier(principal, id, request);
    }

    @PostMapping
    public ResponseEntity<?> createReplacementRequest(Principal principal, @RequestBody ReplacementRequestPayload payload) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            ReplacementRequestResponse response = replacementRequestService.createReplacementRequest(payload, principal.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateReplacementRequest(Principal principal, @PathVariable UUID id, @RequestBody ReplacementRequestPayload payload) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            ReplacementRequestResponse response = replacementRequestService.updateReplacementRequest(id, payload, principal.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReplacementRequest(Principal principal, @PathVariable UUID id) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            replacementRequestService.deleteReplacementRequest(id, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Replacement Request deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/purchase-orders")
    public ResponseEntity<?> getBuyerPurchaseOrders(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            List<Map<String, Object>> list = replacementRequestService.getBuyerPurchaseOrders(principal.getName());
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/connected-suppliers")
    public ResponseEntity<?> getConnectedSuppliers(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            List<Map<String, Object>> list = replacementRequestService.getConnectedSuppliers(principal.getName());
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/invoices")
    public ResponseEntity<?> getInvoicesForPurchaseOrder(Principal principal, @RequestParam(required = false) UUID purchaseOrderId) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            List<Map<String, Object>> list = replacementRequestService.getInvoicesForPurchaseOrder(purchaseOrderId, principal.getName());
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
