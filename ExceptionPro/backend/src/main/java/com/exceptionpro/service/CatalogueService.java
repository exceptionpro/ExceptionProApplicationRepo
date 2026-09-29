package com.exceptionpro.service;

import com.exceptionpro.dto.CatalogueRequest;
import com.exceptionpro.dto.CatalogueResponse;
import com.exceptionpro.entity.Catalogue;
import com.exceptionpro.entity.User;
import com.exceptionpro.repository.CatalogueRepository;
import com.exceptionpro.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class CatalogueService {

    private final CatalogueRepository catalogueRepository;
    private final UserRepository userRepository;

    public CatalogueService(CatalogueRepository catalogueRepository, UserRepository userRepository) {
        this.catalogueRepository = catalogueRepository;
        this.userRepository = userRepository;
    }

    public List<CatalogueResponse> getUserCatalogues(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return catalogueRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CatalogueResponse createCatalogue(CatalogueRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!List.of("Supplier", "Buyer and Supplier").contains(user.getAccountType())) {
            throw new IllegalArgumentException("Only Suppliers or Buyer and Suppliers can create a catalogue");
        }

        if (request.getProductName() == null || request.getProductName().isBlank()) {
            throw new IllegalArgumentException("Product Name is required");
        }
        if (request.getProductType() == null || request.getProductType().isBlank()) {
            throw new IllegalArgumentException("Product Type is required");
        }
        if (request.getPrice() == null) {
            throw new IllegalArgumentException("Price is required");
        }
        if (request.getDescription() == null || request.getDescription().isBlank()) {
            throw new IllegalArgumentException("Description is required");
        }

        Catalogue catalogue = new Catalogue();
        catalogue.setId(UUID.randomUUID());
        catalogue.setUser(user);
        catalogue.setProductName(request.getProductName());
        catalogue.setProductType(request.getProductType());
        catalogue.setPrice(request.getPrice());
        catalogue.setDescription(request.getDescription());
        catalogue.setImageUrl(request.getImageUrl());
        catalogue.setCreatedAt(LocalDateTime.now());

        Catalogue saved = catalogueRepository.save(catalogue);
        return mapToResponse(saved);
    }

    public CatalogueResponse updateCatalogue(UUID id, CatalogueRequest request, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Catalogue catalogue = catalogueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Catalogue not found"));

        if (!catalogue.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You can only edit your own catalogues");
        }

        if (request.getProductName() == null || request.getProductName().isBlank()) {
            throw new IllegalArgumentException("Product Name is required");
        }
        if (request.getProductType() == null || request.getProductType().isBlank()) {
            throw new IllegalArgumentException("Product Type is required");
        }
        if (request.getPrice() == null) {
            throw new IllegalArgumentException("Price is required");
        }
        if (request.getDescription() == null || request.getDescription().isBlank()) {
            throw new IllegalArgumentException("Description is required");
        }

        catalogue.setProductName(request.getProductName());
        catalogue.setProductType(request.getProductType());
        catalogue.setPrice(request.getPrice());
        catalogue.setDescription(request.getDescription());
        catalogue.setImageUrl(request.getImageUrl());

        Catalogue saved = catalogueRepository.save(catalogue);
        return mapToResponse(saved);
    }

    public void deleteCatalogue(UUID id, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Catalogue catalogue = catalogueRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Catalogue not found"));

        if (!catalogue.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You can only delete your own catalogues");
        }

        catalogueRepository.delete(catalogue);
    }

    private CatalogueResponse mapToResponse(Catalogue c) {
        return new CatalogueResponse(
                c.getId(),
                c.getProductName(),
                c.getProductType(),
                c.getPrice(),
                c.getDescription(),
                c.getImageUrl(),
                c.getUser().getId(),
                c.getCreatedAt()
        );
    }
}
