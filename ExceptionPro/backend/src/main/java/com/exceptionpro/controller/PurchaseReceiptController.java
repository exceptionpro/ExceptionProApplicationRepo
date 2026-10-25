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

import com.exceptionpro.dto.PurchaseReceiptRequest;
import com.exceptionpro.dto.PurchaseReceiptResponse;
import com.exceptionpro.dto.SupplierReceiptApprovalRequest;
import com.exceptionpro.service.PurchaseReceiptService;

@RestController
@RequestMapping("/api/purchase-receipts")
public class PurchaseReceiptController {

    private final PurchaseReceiptService purchaseReceiptService;

    public PurchaseReceiptController(PurchaseReceiptService purchaseReceiptService) {
        this.purchaseReceiptService = purchaseReceiptService;
    }

    @GetMapping
    public ResponseEntity<?> getReceipts(Principal principal, @RequestParam(required = false) String role) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            List<PurchaseReceiptResponse> list;
            if ("supplier".equalsIgnoreCase(role)) {
                list = purchaseReceiptService.getSupplierReceipts(principal.getName());
            } else if ("buyer".equalsIgnoreCase(role)) {
                list = purchaseReceiptService.getBuyerReceipts(principal.getName());
            } else {
                list = purchaseReceiptService.getUserReceipts(principal.getName());
            }
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/supplier")
    public ResponseEntity<?> getSupplierReceipts(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            List<PurchaseReceiptResponse> list = purchaseReceiptService.getSupplierReceipts(principal.getName());
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getReceiptById(Principal principal, @PathVariable UUID id) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            PurchaseReceiptResponse response = purchaseReceiptService.getReceiptById(id, principal.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/supplier-approval")
    public ResponseEntity<?> approveReceiptBySupplier(Principal principal, @PathVariable UUID id, @RequestBody SupplierReceiptApprovalRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            PurchaseReceiptResponse response = purchaseReceiptService.approveReceiptBySupplier(id, request, principal.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/supplier-approval")
    public ResponseEntity<?> approveReceiptBySupplierPut(Principal principal, @PathVariable UUID id, @RequestBody SupplierReceiptApprovalRequest request) {
        return approveReceiptBySupplier(principal, id, request);
    }

    @PostMapping
    public ResponseEntity<?> createReceipt(Principal principal, @RequestBody PurchaseReceiptRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            PurchaseReceiptResponse response = purchaseReceiptService.createReceipt(request, principal.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateReceipt(Principal principal, @PathVariable UUID id, @RequestBody PurchaseReceiptRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            PurchaseReceiptResponse response = purchaseReceiptService.updateReceipt(id, request, principal.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReceipt(Principal principal, @PathVariable UUID id) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            purchaseReceiptService.deleteReceipt(id, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Purchase Receipt deleted successfully"));
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
            List<Map<String, Object>> list = purchaseReceiptService.getBuyerPurchaseOrders(principal.getName());
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
            List<Map<String, Object>> list = purchaseReceiptService.getConnectedSuppliers(principal.getName());
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
            List<Map<String, Object>> list = purchaseReceiptService.getInvoicesForPurchaseOrder(purchaseOrderId, principal.getName());
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
