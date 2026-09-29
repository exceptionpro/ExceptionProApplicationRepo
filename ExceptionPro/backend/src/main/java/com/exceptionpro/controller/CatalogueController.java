package com.exceptionpro.controller;

import com.exceptionpro.dto.CatalogueRequest;
import com.exceptionpro.dto.CatalogueResponse;
import com.exceptionpro.service.CatalogueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/catalogue")
public class CatalogueController {

    private final CatalogueService catalogueService;

    public CatalogueController(CatalogueService catalogueService) {
        this.catalogueService = catalogueService;
    }

    @GetMapping
    public ResponseEntity<List<CatalogueResponse>> getCatalogues(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(catalogueService.getUserCatalogues(principal.getName()));
    }

    @PostMapping
    public ResponseEntity<?> createCatalogue(Principal principal, @RequestBody CatalogueRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            CatalogueResponse created = catalogueService.createCatalogue(request, principal.getName());
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCatalogue(Principal principal, @PathVariable UUID id, @RequestBody CatalogueRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            CatalogueResponse updated = catalogueService.updateCatalogue(id, request, principal.getName());
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCatalogue(Principal principal, @PathVariable UUID id) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            catalogueService.deleteCatalogue(id, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Catalogue item deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
