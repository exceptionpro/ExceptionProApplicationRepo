package com.exceptionpro.controller;

import com.exceptionpro.dto.CatalogueResponse;
import com.exceptionpro.dto.RequisitionRequest;
import com.exceptionpro.dto.RequisitionResponse;
import com.exceptionpro.dto.SupplierActionRequest;
import com.exceptionpro.dto.SupplierSummaryResponse;
import com.exceptionpro.service.RequisitionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/requisitions")
public class RequisitionController {

    private final RequisitionService requisitionService;

    public RequisitionController(RequisitionService requisitionService) {
        this.requisitionService = requisitionService;
    }

    @GetMapping
    public ResponseEntity<?> getBuyerRequisitions(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            List<RequisitionResponse> list = requisitionService.getUserRequisitions(principal.getName());
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createRequisition(Principal principal, @RequestBody RequisitionRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            RequisitionResponse response = requisitionService.createRequisition(request, principal.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateRequisition(Principal principal, @PathVariable UUID id, @RequestBody RequisitionRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            RequisitionResponse response = requisitionService.updateRequisition(id, request, principal.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRequisition(Principal principal, @PathVariable UUID id) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            requisitionService.deleteRequisition(id, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Requisition deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/po")
    public ResponseEntity<?> convertToPo(Principal principal, @PathVariable UUID id) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            RequisitionResponse response = requisitionService.convertToPo(id, principal.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/requests")
    public ResponseEntity<?> getSupplierRequestNotifications(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            List<RequisitionResponse> list = requisitionService.getSupplierRequisitions(principal.getName());
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<?> acceptRequisition(Principal principal, @PathVariable UUID id, @RequestBody(required = false) SupplierActionRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            String comments = request != null ? request.getComments() : null;
            RequisitionResponse response = requisitionService.acceptRequisition(id, comments, principal.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/decline")
    public ResponseEntity<?> declineRequisition(Principal principal, @PathVariable UUID id, @RequestBody(required = false) SupplierActionRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            String comments = request != null ? request.getComments() : null;
            RequisitionResponse response = requisitionService.declineRequisition(id, comments, principal.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/suppliers")
    public ResponseEntity<?> getSuppliers(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        List<SupplierSummaryResponse> suppliers = requisitionService.getSuppliers(principal.getName());
        return ResponseEntity.ok(suppliers);
    }

    @GetMapping("/suppliers/{supplierId}/catalogs")
    public ResponseEntity<?> getSupplierCatalogues(Principal principal, @PathVariable UUID supplierId) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        List<CatalogueResponse> catalogs = requisitionService.getSupplierCatalogues(supplierId);
        return ResponseEntity.ok(catalogs);
    }
}
