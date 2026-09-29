package com.exceptionpro.service;

import com.exceptionpro.dto.*;
import com.exceptionpro.entity.Catalogue;
import com.exceptionpro.entity.Requisition;
import com.exceptionpro.entity.RequisitionItem;
import com.exceptionpro.entity.User;
import com.exceptionpro.entity.BusinessPartnerRequest;
import com.exceptionpro.repository.BusinessPartnerRequestRepository;
import com.exceptionpro.repository.CatalogueRepository;
import com.exceptionpro.repository.RequisitionRepository;
import com.exceptionpro.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class RequisitionService {

    private final RequisitionRepository requisitionRepository;
    private final UserRepository userRepository;
    private final CatalogueRepository catalogueRepository;
    private final NotificationService notificationService;
    private final BusinessPartnerRequestRepository businessPartnerRequestRepository;

    public RequisitionService(RequisitionRepository requisitionRepository,
                              UserRepository userRepository,
                              CatalogueRepository catalogueRepository,
                              NotificationService notificationService,
                              BusinessPartnerRequestRepository businessPartnerRequestRepository) {
        this.requisitionRepository = requisitionRepository;
        this.userRepository = userRepository;
        this.catalogueRepository = catalogueRepository;
        this.notificationService = notificationService;
        this.businessPartnerRequestRepository = businessPartnerRequestRepository;
    }

    public RequisitionResponse createRequisition(RequisitionRequest request, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer user not found"));

        if (!List.of("Buyer", "Buyer and Supplier").contains(buyer.getAccountType())) {
            throw new IllegalArgumentException("Only Buyers or Buyer and Suppliers can create a Requisition");
        }

        validateRequisitionRequest(request);

        Requisition requisition = new Requisition();
        requisition.setId(UUID.randomUUID());
        requisition.setBuyer(buyer);
        requisition.setTitle(request.getTitle());
        requisition.setShipTo(request.getShipTo());
        requisition.setDeliverTo(request.getDeliverTo());
        requisition.setNeedByDate(request.getNeedByDate());
        requisition.setComments(request.getComments());
        requisition.setStatus("PR");
        requisition.setCreatedAt(LocalDateTime.now());

        Integer maxReq = requisitionRepository.findMaxReqNumber();
        requisition.setReqNumber((maxReq == null) ? 1 : maxReq + 1);

        if (request.getSupplierId() != null) {
            User supplier = userRepository.findById(request.getSupplierId())
                    .orElse(null);
            requisition.setSupplier(supplier);
        }

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            List<RequisitionItem> itemEntities = new ArrayList<>();
            for (RequisitionItemDto itemDto : request.getItems()) {
                RequisitionItem item = new RequisitionItem();
                item.setId(UUID.randomUUID());
                item.setRequisition(requisition);
                item.setItemType(itemDto.getItemType() != null ? itemDto.getItemType() : "NON_CATALOG");
                item.setCatalogueId(itemDto.getCatalogueId());
                item.setProductName(itemDto.getProductName());
                item.setFullDescription(itemDto.getFullDescription());
                item.setQuantity(itemDto.getQuantity() != null ? itemDto.getQuantity() : 1);
                item.setUnitMeasure(itemDto.getUnitMeasure());
                item.setPrice(itemDto.getPrice());

                if (itemDto.getSupplierId() != null) {
                    User itemSupplier = userRepository.findById(itemDto.getSupplierId()).orElse(null);
                    item.setSupplier(itemSupplier);
                    if (requisition.getSupplier() == null) {
                        requisition.setSupplier(itemSupplier);
                    }
                }
                itemEntities.add(item);
            }
            requisition.setItems(itemEntities);
        }

        Requisition saved = requisitionRepository.save(requisition);
        // Note: Requisition Request is NOT sent to supplier on creation.
        // It will be sent to supplier only when converted to Purchase Order (PO).
        return mapToResponse(saved);
    }

    public List<RequisitionResponse> getUserRequisitions(String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return requisitionRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public RequisitionResponse updateRequisition(UUID id, RequisitionRequest request, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Requisition requisition = requisitionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Requisition not found"));

        if (!requisition.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You can only edit your own requisitions");
        }

        validateRequisitionRequest(request);

        requisition.setTitle(request.getTitle());
        requisition.setShipTo(request.getShipTo());
        requisition.setDeliverTo(request.getDeliverTo());
        requisition.setNeedByDate(request.getNeedByDate());
        requisition.setComments(request.getComments());

        if (request.getSupplierId() != null) {
            User supplier = userRepository.findById(request.getSupplierId()).orElse(null);
            requisition.setSupplier(supplier);
        }

        requisition.getItems().clear();
        if (request.getItems() != null) {
            for (RequisitionItemDto itemDto : request.getItems()) {
                RequisitionItem item = new RequisitionItem();
                item.setId(UUID.randomUUID());
                item.setRequisition(requisition);
                item.setItemType(itemDto.getItemType() != null ? itemDto.getItemType() : "NON_CATALOG");
                item.setCatalogueId(itemDto.getCatalogueId());
                item.setProductName(itemDto.getProductName());
                item.setFullDescription(itemDto.getFullDescription());
                item.setQuantity(itemDto.getQuantity() != null ? itemDto.getQuantity() : 1);
                item.setUnitMeasure(itemDto.getUnitMeasure());
                item.setPrice(itemDto.getPrice());

                if (itemDto.getSupplierId() != null) {
                    User itemSupplier = userRepository.findById(itemDto.getSupplierId()).orElse(null);
                    item.setSupplier(itemSupplier);
                    if (requisition.getSupplier() == null) {
                        requisition.setSupplier(itemSupplier);
                    }
                }
                requisition.getItems().add(item);
            }
        }

        Requisition saved = requisitionRepository.save(requisition);
        return mapToResponse(saved);
    }

    public void deleteRequisition(UUID id, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Requisition requisition = requisitionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Requisition not found"));

        if (!requisition.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You can only delete your own requisitions");
        }

        requisitionRepository.delete(requisition);
    }

    public RequisitionResponse convertToPo(UUID id, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Requisition requisition = requisitionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Requisition not found"));

        if (!requisition.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You can only convert your own requisitions to Purchase Order");
        }

        requisition.setStatus("PO");
        Requisition saved = requisitionRepository.save(requisition);

        // Send Notification to assigned Supplier(s) now that it has become a Purchase Order
        Set<User> targetSuppliers = new HashSet<>();
        if (saved.getSupplier() != null) {
            targetSuppliers.add(saved.getSupplier());
        }
        if (saved.getItems() != null) {
            for (RequisitionItem item : saved.getItems()) {
                if (item.getSupplier() != null) {
                    targetSuppliers.add(item.getSupplier());
                }
            }
        }

        int reqNum = saved.getReqNumber() != null ? saved.getReqNumber() : 1;
        String poCode = String.format("PO%02d", reqNum);

        String buyerName = getUserDisplayName(buyer);
        String productNames = (saved.getItems() != null && !saved.getItems().isEmpty())
                ? saved.getItems().stream()
                        .map(RequisitionItem::getProductName)
                        .filter(p -> p != null && !p.isBlank())
                        .distinct()
                        .collect(Collectors.joining(", "))
                : saved.getTitle();

        String notificationMsg = "Buyer " + buyerName + " submitted a Purchase Order " + poCode + " for Product: " + productNames + ".";

        for (User targetSupplier : targetSuppliers) {
            notificationService.createNotification(
                    targetSupplier,
                    buyer,
                    "REQUISITIONS",
                    "New Purchase Order Submitted (" + poCode + ")",
                    notificationMsg,
                    saved.getComments(),
                    saved.getId(),
                    "REQUISITION"
            );
        }

        return mapToResponse(saved);
    }

    public List<RequisitionResponse> getSupplierRequisitions(String supplierEmail) {
        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!List.of("Supplier", "Buyer and Supplier").contains(supplier.getAccountType())) {
            throw new IllegalArgumentException("Only Suppliers or Buyer and Suppliers can view Purchase Requests");
        }

        List<String> poStatuses = List.of("PO", "Accepted", "Declined");
        return requisitionRepository.findBySupplierIdAndStatusInOrderByCreatedAtDesc(supplier.getId(), poStatuses).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public RequisitionResponse acceptRequisition(UUID id, String supplierComment, String supplierEmail) {
        if (supplierComment == null || supplierComment.trim().isEmpty()) {
            throw new IllegalArgumentException("Comments are required when accepting a purchase request");
        }

        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Requisition requisition = requisitionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Requisition not found"));

        if (requisition.getSupplier() == null || !requisition.getSupplier().getId().equals(supplier.getId())) {
            throw new IllegalArgumentException("You are not assigned as the supplier for this requisition");
        }

        requisition.setStatus("Accepted");
        if (supplierComment.length() > 400) {
            requisition.setSupplierComment(supplierComment.substring(0, 400));
        } else {
            requisition.setSupplierComment(supplierComment);
        }

        Requisition saved = requisitionRepository.save(requisition);

        // Send Notification to Buyer
        String supplierName = getUserDisplayName(supplier);
        String productNames = (saved.getItems() != null && !saved.getItems().isEmpty())
                ? saved.getItems().stream()
                        .map(RequisitionItem::getProductName)
                        .filter(p -> p != null && !p.isBlank())
                        .distinct()
                        .collect(Collectors.joining(", "))
                : saved.getTitle();

        String msg = "Supplier " + supplierName + " accepted your requisition request '" + saved.getTitle() + "' for Product: " + productNames + ".";
        notificationService.createNotification(
                saved.getBuyer(),
                supplier,
                "REQUISITIONS",
                "Requisition Request Accepted",
                msg,
                saved.getSupplierComment(),
                saved.getId(),
                "REQUISITION"
        );

        return mapToResponse(saved);
    }

    public RequisitionResponse declineRequisition(UUID id, String supplierComment, String supplierEmail) {
        if (supplierComment == null || supplierComment.trim().isEmpty()) {
            throw new IllegalArgumentException("Comments are required when declining a purchase request");
        }

        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Requisition requisition = requisitionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Requisition not found"));

        if (requisition.getSupplier() == null || !requisition.getSupplier().getId().equals(supplier.getId())) {
            throw new IllegalArgumentException("You are not assigned as the supplier for this requisition");
        }

        requisition.setStatus("Declined");
        if (supplierComment.length() > 400) {
            requisition.setSupplierComment(supplierComment.substring(0, 400));
        } else {
            requisition.setSupplierComment(supplierComment);
        }

        Requisition saved = requisitionRepository.save(requisition);

        // Send Notification to Buyer
        String supplierName = getUserDisplayName(supplier);
        String productNames = (saved.getItems() != null && !saved.getItems().isEmpty())
                ? saved.getItems().stream()
                        .map(RequisitionItem::getProductName)
                        .filter(p -> p != null && !p.isBlank())
                        .distinct()
                        .collect(Collectors.joining(", "))
                : saved.getTitle();

        String msg = "Supplier " + supplierName + " declined your requisition request '" + saved.getTitle() + "' for Product: " + productNames + ".";
        notificationService.createNotification(
                saved.getBuyer(),
                supplier,
                "REQUISITIONS",
                "Requisition Request Declined",
                msg,
                saved.getSupplierComment(),
                saved.getId(),
                "REQUISITION"
        );

        return mapToResponse(saved);
    }

    public List<SupplierSummaryResponse> getSuppliers(String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<BusinessPartnerRequest> acceptedRequests = businessPartnerRequestRepository.findAcceptedPartnerships(buyer.getId());

        return acceptedRequests.stream()
                .map(r -> r.getSender().getId().equals(buyer.getId()) ? r.getReceiver() : r.getSender())
                .filter(u -> u != null && List.of("Supplier", "Buyer and Supplier").contains(u.getAccountType()))
                .collect(Collectors.toMap(User::getId, u -> u, (u1, u2) -> u1))
                .values().stream()
                .map(u -> new SupplierSummaryResponse(
                        u.getId(),
                        u.getEmail(),
                        getUserDisplayName(u),
                        u.getAccountType()
                ))
                .collect(Collectors.toList());
    }

    public List<SupplierSummaryResponse> getSuppliers() {
        return userRepository.findSuppliers().stream()
                .map(u -> new SupplierSummaryResponse(
                        u.getId(),
                        u.getEmail(),
                        getUserDisplayName(u),
                        u.getAccountType()
                ))
                .collect(Collectors.toList());
    }

    public List<CatalogueResponse> getSupplierCatalogues(UUID supplierId) {
        return catalogueRepository.findByUserIdOrderByCreatedAtDesc(supplierId).stream()
                .map(c -> new CatalogueResponse(
                        c.getId(),
                        c.getProductName(),
                        c.getProductType(),
                        c.getPrice(),
                        c.getDescription(),
                        c.getImageUrl(),
                        c.getUser().getId(),
                        c.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    private void validateRequisitionRequest(RequisitionRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("Title is required");
        }
        if (request.getShipTo() == null || request.getShipTo().isBlank()) {
            throw new IllegalArgumentException("Ship To is required");
        }
        if (request.getDeliverTo() == null || request.getDeliverTo().isBlank()) {
            throw new IllegalArgumentException("Deliver To is required");
        }
        if (request.getNeedByDate() == null) {
            throw new IllegalArgumentException("Need By Date is required");
        }
    }

    private RequisitionResponse mapToResponse(Requisition r) {
        List<RequisitionItemDto> itemDtos = r.getItems().stream()
                .map(item -> new RequisitionItemDto(
                        item.getId(),
                        item.getItemType(),
                        item.getCatalogueId(),
                        item.getProductName(),
                        item.getFullDescription(),
                        item.getQuantity(),
                        item.getUnitMeasure(),
                        item.getPrice(),
                        item.getSupplier() != null ? item.getSupplier().getId() : null,
                        item.getSupplier() != null ? getUserDisplayName(item.getSupplier()) : null
                ))
                .collect(Collectors.toList());

        int reqNum = r.getReqNumber() != null ? r.getReqNumber() : 1;
        String status = r.getStatus();
        String prefix = ("PO".equalsIgnoreCase(status) || "Accepted".equalsIgnoreCase(status) || "Declined".equalsIgnoreCase(status)) ? "PO" : "PR";
        String requisitionId = String.format("%s%02d", prefix, reqNum);

        return new RequisitionResponse(
                r.getId(),
                requisitionId,
                reqNum,
                r.getTitle(),
                r.getShipTo(),
                r.getDeliverTo(),
                r.getNeedByDate(),
                r.getComments(),
                r.getSupplierComment(),
                r.getStatus(),
                r.getCreatedAt(),
                r.getBuyer().getId(),
                r.getBuyer().getEmail(),
                getUserDisplayName(r.getBuyer()),
                r.getSupplier() != null ? r.getSupplier().getId() : null,
                r.getSupplier() != null ? r.getSupplier().getEmail() : null,
                r.getSupplier() != null ? getUserDisplayName(r.getSupplier()) : null,
                itemDtos
        );
    }

    private String getUserDisplayName(User u) {
        if (u.getCorporateProfile() != null && u.getCorporateProfile().getOrganizationName() != null && !u.getCorporateProfile().getOrganizationName().isBlank()) {
            return u.getCorporateProfile().getOrganizationName();
        }
        if (u.getIndividualProfile() != null && u.getIndividualProfile().getFirstName() != null) {
            String last = u.getIndividualProfile().getLastName() != null ? " " + u.getIndividualProfile().getLastName() : "";
            return u.getIndividualProfile().getFirstName() + last;
        }
        return u.getEmail();
    }
}
