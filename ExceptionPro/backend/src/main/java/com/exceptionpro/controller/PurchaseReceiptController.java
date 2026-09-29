package com.exceptionpro.controller;

import com.exceptionpro.dto.PurchaseReceiptRequest;
import com.exceptionpro.dto.PurchaseReceiptResponse;
import com.exceptionpro.service.PurchaseReceiptService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/purchase-receipts")
public class PurchaseReceiptController {

    private final PurchaseReceiptService purchaseReceiptService;

    public PurchaseReceiptController(PurchaseReceiptService purchaseReceiptService) {
        this.purchaseReceiptService = purchaseReceiptService;
    }

    @GetMapping
    public ResponseEntity<?> getBuyerReceipts(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            List<PurchaseReceiptResponse> list = purchaseReceiptService.getBuyerReceipts(principal.getName());
            return ResponseEntity.ok(list);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
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
