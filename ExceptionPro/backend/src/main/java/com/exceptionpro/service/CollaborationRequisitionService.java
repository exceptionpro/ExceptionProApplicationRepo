package com.exceptionpro.service;

import com.exceptionpro.dto.*;
import com.exceptionpro.entity.*;
import com.exceptionpro.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class CollaborationRequisitionService {

    private final CollaborationRequisitionRepository collaborationRequisitionRepository;
    private final CollaborationProposalRepository collaborationProposalRepository;
    private final CollaborationSupplierResponseRepository collaborationSupplierResponseRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public CollaborationRequisitionService(CollaborationRequisitionRepository collaborationRequisitionRepository,
                                           CollaborationProposalRepository collaborationProposalRepository,
                                           CollaborationSupplierResponseRepository collaborationSupplierResponseRepository,
                                           UserRepository userRepository,
                                           NotificationService notificationService) {
        this.collaborationRequisitionRepository = collaborationRequisitionRepository;
        this.collaborationProposalRepository = collaborationProposalRepository;
        this.collaborationSupplierResponseRepository = collaborationSupplierResponseRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public CollaborationRequisitionResponse createCollaborationRequisition(CollaborationRequisitionRequest request, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer user not found"));

        if (!List.of("Buyer", "Buyer and Supplier").contains(buyer.getAccountType())) {
            throw new IllegalArgumentException("Only Buyers or Buyer and Suppliers can create a Collaboration Requisition");
        }

        validateRequest(request);

        CollaborationRequisition req = new CollaborationRequisition();
        req.setId(UUID.randomUUID());
        req.setBuyer(buyer);
        req.setTitle(request.getTitle());
        req.setShipTo(request.getShipTo());
        req.setDeliverTo(request.getDeliverTo());
        req.setNeedByDate(request.getNeedByDate());
        req.setComments(request.getComments());
        req.setStatus("Collaborating");
        req.setCreatedAt(LocalDateTime.now());

        if (request.getSupplierIds() != null && !request.getSupplierIds().isEmpty()) {
            List<User> suppliers = userRepository.findAllById(request.getSupplierIds());
            req.setSuppliers(suppliers);
        }

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            List<CollaborationRequisitionItem> itemEntities = new ArrayList<>();
            for (CollaborationItemDto itemDto : request.getItems()) {
                CollaborationRequisitionItem item = new CollaborationRequisitionItem();
                item.setId(UUID.randomUUID());
                item.setCollaborationRequisition(req);
                item.setItemType(itemDto.getItemType() != null ? itemDto.getItemType() : "NON_CATALOG");
                item.setProductName(itemDto.getProductName());
                item.setFullDescription(itemDto.getFullDescription());
                item.setQuantity(itemDto.getQuantity() != null ? itemDto.getQuantity() : 1);
                item.setUnitMeasure(itemDto.getUnitMeasure());
                item.setPrice(itemDto.getPrice());
                itemEntities.add(item);
            }
            req.setItems(itemEntities);
        }

        CollaborationRequisition saved = collaborationRequisitionRepository.save(req);

        // Send Notifications to all assigned Suppliers
        if (saved.getSuppliers() != null && !saved.getSuppliers().isEmpty()) {
            String buyerName = getUserDisplayName(buyer);
            String productNames = (saved.getItems() != null && !saved.getItems().isEmpty())
                    ? saved.getItems().stream()
                            .map(CollaborationRequisitionItem::getProductName)
                            .filter(p -> p != null && !p.isBlank())
                            .distinct()
                            .collect(Collectors.joining(", "))
                    : saved.getTitle();

            String msg = "Buyer " + buyerName + " submitted a new collaboration requisition '" + saved.getTitle() + "' for Product: " + productNames + ".";

            for (User supplier : saved.getSuppliers()) {
                notificationService.createNotification(
                        supplier,
                        buyer,
                        "COLLABORATIONS",
                        "New Collaboration Request Received",
                        msg,
                        saved.getComments(),
                        saved.getId(),
                        "COLLABORATION_REQUISITION"
                );
            }
        }

        return mapToResponse(saved);
    }

    public List<CollaborationRequisitionResponse> getUserCollaborationRequisitions(String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<CollaborationRequisition> list = collaborationRequisitionRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        if (list == null) {
            return Collections.emptyList();
        }
        return list.stream()
                .filter(Objects::nonNull)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CollaborationRequisitionResponse updateCollaborationRequisition(UUID id, CollaborationRequisitionRequest request, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CollaborationRequisition req = collaborationRequisitionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Collaboration Requisition not found"));

        if (!req.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You can only edit your own collaboration requisitions");
        }

        validateRequest(request);

        req.setTitle(request.getTitle());
        req.setShipTo(request.getShipTo());
        req.setDeliverTo(request.getDeliverTo());
        req.setNeedByDate(request.getNeedByDate());
        req.setComments(request.getComments());

        if (request.getSupplierIds() != null) {
            List<User> suppliers = userRepository.findAllById(request.getSupplierIds());
            req.setSuppliers(suppliers);
        }

        req.getItems().clear();
        if (request.getItems() != null) {
            for (CollaborationItemDto itemDto : request.getItems()) {
                CollaborationRequisitionItem item = new CollaborationRequisitionItem();
                item.setId(UUID.randomUUID());
                item.setCollaborationRequisition(req);
                item.setItemType(itemDto.getItemType() != null ? itemDto.getItemType() : "NON_CATALOG");
                item.setProductName(itemDto.getProductName());
                item.setFullDescription(itemDto.getFullDescription());
                item.setQuantity(itemDto.getQuantity() != null ? itemDto.getQuantity() : 1);
                item.setUnitMeasure(itemDto.getUnitMeasure());
                item.setPrice(itemDto.getPrice());
                req.getItems().add(item);
            }
        }

        CollaborationRequisition saved = collaborationRequisitionRepository.save(req);
        return mapToResponse(saved);
    }

    public void deleteCollaborationRequisition(UUID id, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CollaborationRequisition req = collaborationRequisitionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Collaboration Requisition not found"));

        if (!req.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You can only delete your own collaboration requisitions");
        }

        collaborationRequisitionRepository.delete(req);
    }

    public List<CollaborationRequisitionResponse> getSupplierCollaborationRequests(String supplierEmail) {
        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!List.of("Supplier", "Buyer and Supplier").contains(supplier.getAccountType())) {
            throw new IllegalArgumentException("Only Suppliers or Buyer and Suppliers can view Collaboration Requests");
        }

        List<CollaborationRequisition> list = collaborationRequisitionRepository.findDistinctBySuppliersIdOrderByCreatedAtDesc(supplier.getId());
        if (list == null) {
            return Collections.emptyList();
        }
        return list.stream()
                .filter(Objects::nonNull)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CollaborationRequisitionResponse acceptCollaborationRequisition(UUID id, String comments, String supplierEmail) {
        if (comments == null || comments.trim().isEmpty()) {
            throw new IllegalArgumentException("Comments are required when accepting a collaboration request");
        }

        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CollaborationRequisition req = collaborationRequisitionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Collaboration Requisition not found"));

        boolean isAssigned = req.getSuppliers() != null && req.getSuppliers().stream()
                .anyMatch(s -> s.getId() != null && s.getId().toString().equalsIgnoreCase(supplier.getId().toString()));
        if (!isAssigned) {
            throw new IllegalArgumentException("You are not assigned to this collaboration requisition");
        }

        req.setStatus("Accepted");
        CollaborationRequisition saved = collaborationRequisitionRepository.save(req);

        // Record per-supplier response
        CollaborationSupplierResponse resp = collaborationSupplierResponseRepository
                .findByCollaborationRequisitionIdAndSupplierId(req.getId(), supplier.getId())
                .orElse(new CollaborationSupplierResponse());
        if (resp.getId() == null) resp.setId(UUID.randomUUID());
        resp.setCollaborationRequisition(req);
        resp.setSupplier(supplier);
        resp.setStatus("Accepted");
        resp.setComments(comments.trim());
        resp.setCreatedAt(LocalDateTime.now());
        collaborationSupplierResponseRepository.save(resp);

        // Send Notification to Buyer
        String supplierName = getUserDisplayName(supplier);
        String productNames = (saved.getItems() != null && !saved.getItems().isEmpty())
                ? saved.getItems().stream()
                        .map(CollaborationRequisitionItem::getProductName)
                        .filter(p -> p != null && !p.isBlank())
                        .distinct()
                        .collect(Collectors.joining(", "))
                : saved.getTitle();

        String msg = "Supplier " + supplierName + " accepted your collaboration requisition request '" + saved.getTitle() + "' for Product: " + productNames + ".";
        notificationService.createNotification(
                saved.getBuyer(),
                supplier,
                "COLLABORATIONS",
                "Collaboration Request Accepted",
                msg,
                comments.trim(),
                saved.getId(),
                "COLLABORATION_REQUISITION"
        );

        return mapToResponse(saved);
    }

    public CollaborationRequisitionResponse declineCollaborationRequisition(UUID id, String comments, String supplierEmail) {
        if (comments == null || comments.trim().isEmpty()) {
            throw new IllegalArgumentException("Comments are required when declining a collaboration request");
        }

        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CollaborationRequisition req = collaborationRequisitionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Collaboration Requisition not found"));

        boolean isAssigned = req.getSuppliers() != null && req.getSuppliers().stream()
                .anyMatch(s -> s.getId() != null && s.getId().toString().equalsIgnoreCase(supplier.getId().toString()));
        if (!isAssigned) {
            throw new IllegalArgumentException("You are not assigned to this collaboration requisition");
        }

        req.setStatus("Declined");
        CollaborationRequisition saved = collaborationRequisitionRepository.save(req);

        // Record per-supplier response
        CollaborationSupplierResponse resp = collaborationSupplierResponseRepository
                .findByCollaborationRequisitionIdAndSupplierId(req.getId(), supplier.getId())
                .orElse(new CollaborationSupplierResponse());
        if (resp.getId() == null) resp.setId(UUID.randomUUID());
        resp.setCollaborationRequisition(req);
        resp.setSupplier(supplier);
        resp.setStatus("Declined");
        resp.setComments(comments.trim());
        resp.setCreatedAt(LocalDateTime.now());
        collaborationSupplierResponseRepository.save(resp);

        // Send Notification to Buyer
        String supplierName = getUserDisplayName(supplier);
        String productNames = (saved.getItems() != null && !saved.getItems().isEmpty())
                ? saved.getItems().stream()
                        .map(CollaborationRequisitionItem::getProductName)
                        .filter(p -> p != null && !p.isBlank())
                        .distinct()
                        .collect(Collectors.joining(", "))
                : saved.getTitle();

        String msg = "Supplier " + supplierName + " declined your collaboration requisition request '" + saved.getTitle() + "' for Product: " + productNames + ".";
        notificationService.createNotification(
                saved.getBuyer(),
                supplier,
                "COLLABORATIONS",
                "Collaboration Request Declined",
                msg,
                comments.trim(),
                saved.getId(),
                "COLLABORATION_REQUISITION"
        );

        return mapToResponse(saved);
    }

    public CollaborationRequisitionResponse evaluateProposal(UUID proposalId, String evaluationStatus, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CollaborationProposal proposal = collaborationProposalRepository.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found"));

        CollaborationRequisition req = proposal.getCollaborationRequisition();
        if (!req.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("Only the buyer who created this collaboration requisition can evaluate proposals");
        }

        String newStatus = "Accepted".equalsIgnoreCase(evaluationStatus) ? "Accepted" : "Need to Evaluate";
        proposal.setEvaluationStatus(newStatus);
        collaborationProposalRepository.save(proposal);

        // Send Notification to Supplier (Populates in Supplier -> Notifications -> Collaborations)
        String title = "Accepted".equalsIgnoreCase(newStatus) ? "Proposal Accepted" : "Proposal Needs Evaluation";
        String msg = "Accepted".equalsIgnoreCase(newStatus)
                ? "Buyer " + getUserDisplayName(buyer) + " has ACCEPTED your proposal for collaboration requisition '" + req.getTitle() + "'."
                : "Buyer " + getUserDisplayName(buyer) + " marked your proposal for collaboration requisition '" + req.getTitle() + "' as 'Need to Evaluate'.";

        notificationService.createNotification(
                proposal.getSupplier(),
                buyer,
                "COLLABORATIONS",
                title,
                msg,
                "Evaluation Status: " + newStatus,
                req.getId(),
                "COLLABORATION_REQUISITION"
        );

        return mapToResponse(req);
    }

    public CollaborationRequisitionResponse submitProposal(UUID id, String proposalText, String supplierEmail) {
        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CollaborationRequisition req = collaborationRequisitionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Collaboration Requisition not found"));

        boolean isAssigned = req.getSuppliers() != null && req.getSuppliers().stream()
                .anyMatch(s -> s.getId() != null && s.getId().toString().equalsIgnoreCase(supplier.getId().toString()));
        if (!isAssigned) {
            throw new IllegalArgumentException("You are not assigned to this collaboration requisition");
        }

        if (proposalText == null || proposalText.trim().isEmpty()) {
            throw new IllegalArgumentException("Proposal comments are required");
        }

        CollaborationProposal proposal = new CollaborationProposal();
        proposal.setId(UUID.randomUUID());
        proposal.setCollaborationRequisition(req);
        proposal.setSupplier(supplier);
        proposal.setProposalText(proposalText.trim());
        proposal.setEvaluationStatus("Need to Evaluate");
        proposal.setCreatedAt(LocalDateTime.now());

        collaborationProposalRepository.save(proposal);

        // Send Notification to Buyer
        String supplierName = getUserDisplayName(supplier);
        String productNames = (req.getItems() != null && !req.getItems().isEmpty())
                ? req.getItems().stream()
                        .map(CollaborationRequisitionItem::getProductName)
                        .filter(p -> p != null && !p.isBlank())
                        .distinct()
                        .collect(Collectors.joining(", "))
                : req.getTitle();

        String msg = "Supplier " + supplierName + " submitted a proposal for collaboration requisition '" + req.getTitle() + "' for Product: " + productNames + ".";
        notificationService.createNotification(
                req.getBuyer(),
                supplier,
                "COLLABORATIONS",
                "New Supplier Proposal Received",
                msg,
                proposalText.trim(),
                req.getId(),
                "COLLABORATION_REQUISITION"
        );

        return mapToResponse(req);
    }

    private void validateRequest(CollaborationRequisitionRequest request) {
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

    private CollaborationRequisitionResponse mapToResponse(CollaborationRequisition r) {
        if (r == null) return null;

        List<SupplierSummaryResponse> supplierSummaries = (r.getSuppliers() != null ? r.getSuppliers() : Collections.<User>emptyList()).stream()
                .filter(Objects::nonNull)
                .map(s -> new SupplierSummaryResponse(
                        s.getId(),
                        s.getEmail(),
                        getUserDisplayName(s),
                        s.getAccountType()
                ))
                .collect(Collectors.toList());

        List<CollaborationSupplierResponse> acceptedResponses = collaborationSupplierResponseRepository
                .findByCollaborationRequisitionIdAndStatus(r.getId(), "Accepted");
        List<SupplierSummaryResponse> acceptedSuppliers = (acceptedResponses != null ? acceptedResponses : Collections.<CollaborationSupplierResponse>emptyList()).stream()
                .filter(resp -> resp != null && resp.getSupplier() != null)
                .map(resp -> new SupplierSummaryResponse(
                        resp.getSupplier().getId(),
                        resp.getSupplier().getEmail(),
                        getUserDisplayName(resp.getSupplier()),
                        resp.getSupplier().getAccountType()
                ))
                .collect(Collectors.toList());

        List<CollaborationItemDto> itemDtos = (r.getItems() != null ? r.getItems() : Collections.<CollaborationRequisitionItem>emptyList()).stream()
                .filter(Objects::nonNull)
                .map(i -> new CollaborationItemDto(
                        i.getId(),
                        i.getItemType(),
                        i.getProductName(),
                        i.getFullDescription(),
                        i.getQuantity(),
                        i.getUnitMeasure(),
                        i.getPrice()
                ))
                .collect(Collectors.toList());

        List<CollaborationProposal> proposalsList = collaborationProposalRepository.findByCollaborationRequisitionIdOrderByCreatedAtDesc(r.getId());
        List<CollaborationProposalDto> proposalDtos = (proposalsList != null ? proposalsList : Collections.<CollaborationProposal>emptyList()).stream()
                .filter(p -> p != null && p.getSupplier() != null)
                .map(p -> new CollaborationProposalDto(
                        p.getId(),
                        p.getSupplier().getId(),
                        p.getSupplier().getEmail(),
                        getUserDisplayName(p.getSupplier()),
                        p.getProposalText(),
                        p.getEvaluationStatus() != null ? p.getEvaluationStatus() : "Need to Evaluate",
                        p.getCreatedAt()
                ))
                .collect(Collectors.toList());

        return new CollaborationRequisitionResponse(
                r.getId(),
                r.getTitle(),
                r.getShipTo(),
                r.getDeliverTo(),
                r.getNeedByDate(),
                r.getComments(),
                r.getStatus(),
                r.getCreatedAt(),
                r.getBuyer() != null ? r.getBuyer().getId() : null,
                r.getBuyer() != null ? r.getBuyer().getEmail() : null,
                r.getBuyer() != null ? getUserDisplayName(r.getBuyer()) : "Unknown",
                supplierSummaries,
                acceptedSuppliers,
                acceptedSuppliers.size(),
                itemDtos,
                proposalDtos
        );
    }

    private String getUserDisplayName(User u) {
        if (u == null) return "Unknown";
        try {
            if (u.getCorporateProfile() != null && u.getCorporateProfile().getOrganizationName() != null && !u.getCorporateProfile().getOrganizationName().isBlank()) {
                return u.getCorporateProfile().getOrganizationName();
            }
            if (u.getIndividualProfile() != null && u.getIndividualProfile().getFirstName() != null) {
                String last = u.getIndividualProfile().getLastName() != null ? " " + u.getIndividualProfile().getLastName() : "";
                return u.getIndividualProfile().getFirstName() + last;
            }
        } catch (Exception e) {
            // Ignore lazy profile exception
        }
        return u.getEmail() != null ? u.getEmail() : "User";
    }
}
