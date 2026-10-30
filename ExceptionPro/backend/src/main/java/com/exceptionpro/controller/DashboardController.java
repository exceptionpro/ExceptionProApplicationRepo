package com.exceptionpro.controller;

import java.security.Principal;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.exceptionpro.dto.BuyerDashboardResponse;
import com.exceptionpro.dto.SupplierDashboardResponse;
import com.exceptionpro.service.DashboardService;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/buyer")
    public ResponseEntity<?> getBuyerDashboard(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            BuyerDashboardResponse response = dashboardService.getBuyerDashboard(principal.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to load buyer dashboard: " + e.getMessage()));
        }
    }

    @GetMapping("/supplier")
    public ResponseEntity<?> getSupplierDashboard(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        try {
            SupplierDashboardResponse response = dashboardService.getSupplierDashboard(principal.getName());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to load supplier dashboard: " + e.getMessage()));
        }
    }
}
