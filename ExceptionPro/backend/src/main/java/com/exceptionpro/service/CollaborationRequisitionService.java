package com.exceptionpro.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.exceptionpro.dto.CollaborationItemDto;
import com.exceptionpro.dto.CollaborationProposalDto;
import com.exceptionpro.dto.CollaborationRequisitionRequest;
import com.exceptionpro.dto.CollaborationRequisitionResponse;
import com.exceptionpro.dto.CreateCollabPoRequest;
import com.exceptionpro.dto.RequisitionItemDto;
import com.exceptionpro.dto.RequisitionResponse;
import com.exceptionpro.dto.SupplierSummaryResponse;
import com.exceptionpro.entity.CollaborationProposal;
import com.exceptionpro.entity.CollaborationRequisition;
import com.exceptionpro.entity.CollaborationRequisitionItem;
import com.exceptionpro.entity.CollaborationSupplierResponse;
import com.exceptionpro.entity.Requisition;
import com.exceptionpro.entity.RequisitionItem;
import com.exceptionpro.entity.User;
import com.exceptionpro.repository.CollaborationProposalRepository;
import com.exceptionpro.repository.CollaborationRequisitionRepository;
import com.exceptionpro.repository.CollaborationSupplierResponseRepository;
import com.exceptionpro.repository.RequisitionRepository;
import com.exceptionpro.repository.UserRepository;

@Service
@Transactional
@SuppressWarnings("null")
public class CollaborationRequisitionService {

    private final CollaborationRequisitionRepository collaborationRequisitionRepository;
    private final CollaborationProposalRepository collaborationProposalRepository;
    private final CollaborationSupplierResponseRepository collaborationSupplierResponseRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final RequisitionRepository requisitionRepository;

    public CollaborationRequisitionService(CollaborationRequisitionRepository collaborationRequisitionRepository,
                                           CollaborationProposalRepository collaborationProposalRepository,
                                           CollaborationSupplierResponseRepository collaborationSupplierResponseRepository,
                                           UserRepository userRepository,
                                           NotificationService notificationService,
                                           RequisitionRepository requisitionRepository) {
        this.collaborationRequisitionRepository = collaborationRequisitionRepository;
        this.collaborationProposalRepository = collaborationProposalRepository;
        this.collaborationSupplierResponseRepository = collaborationSupplierResponseRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.requisitionRepository = requisitionRepository;
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

        List<UUID> supplierIds = request.getSupplierIds();
        if (supplierIds != null && !supplierIds.isEmpty()) {
            List<User> suppliers = userRepository.findAllById(Objects.requireNonNull(supplierIds));
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
                Integer itemQty = itemDto.getQuantity();
                item.setQuantity(itemQty != null ? itemQty : 1);
                item.setUnitMeasure(itemDto.getUnitMeasure());
                item.setPrice(itemDto.getPrice());
                item.setCurrencyType(itemDto.getCurrencyType() != null && !itemDto.getCurrencyType().trim().isEmpty() ? itemDto.getCurrencyType().trim() : "USD");
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
                            .filter(Objects::nonNull)
                            .map(item -> item != null ? item.getProductName() : null)
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
        User buyer = userRepository.findByEmailIgnoreCase(buyerEmail)
                .orElseGet(() -> userRepository.findByEmail(buyerEmail).orElse(null));

        if (buyer == null) {
            return Collections.emptyList();
        }

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

        CollaborationRequisition req = collaborationRequisitionRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Collaboration Requisition not found"));

        if (!req.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You can only edit your own collaboration requisitions");
        }

        boolean poExists = !requisitionRepository.findByCollaborationRequisitionIdOrderByCreatedAtDesc(Objects.requireNonNull(id)).isEmpty();
        if (poExists || "Purchase Order Generated".equalsIgnoreCase(req.getStatus())) {
            throw new IllegalArgumentException("Cannot edit collaboration requisition because a Purchase Order has already been generated");
        }

        validateRequest(request);

        req.setTitle(request.getTitle());
        req.setShipTo(request.getShipTo());
        req.setDeliverTo(request.getDeliverTo());
        req.setNeedByDate(request.getNeedByDate());
        req.setComments(request.getComments());

        List<UUID> updateSupplierIds = request.getSupplierIds();
        if (updateSupplierIds != null) {
            List<User> suppliers = userRepository.findAllById(Objects.requireNonNull(updateSupplierIds));
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
                Integer itemQty = itemDto.getQuantity();
                item.setQuantity(itemQty != null ? itemQty : 1);
                item.setUnitMeasure(itemDto.getUnitMeasure());
                item.setPrice(itemDto.getPrice());
                item.setCurrencyType(itemDto.getCurrencyType() != null && !itemDto.getCurrencyType().trim().isEmpty() ? itemDto.getCurrencyType().trim() : "USD");
                req.getItems().add(item);
            }
        }

        CollaborationRequisition saved = collaborationRequisitionRepository.save(req);
        return mapToResponse(saved);
    }

    public void deleteCollaborationRequisition(UUID id, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CollaborationRequisition req = collaborationRequisitionRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Collaboration Requisition not found"));

        if (!req.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You can only delete your own collaboration requisitions");
        }

        boolean poExists = !requisitionRepository.findByCollaborationRequisitionIdOrderByCreatedAtDesc(Objects.requireNonNull(id)).isEmpty();
        if (poExists || "Purchase Order Generated".equalsIgnoreCase(req.getStatus())) {
            throw new IllegalArgumentException("Cannot delete collaboration requisition because a Purchase Order has already been generated");
        }

        if (req.getSuppliers() != null) {
            req.getSuppliers().clear();
            collaborationRequisitionRepository.save(req);
        }

        collaborationRequisitionRepository.delete(req);
    }

    public List<CollaborationRequisitionResponse> getSupplierCollaborationRequests(String supplierEmail) {
        User supplier = userRepository.findByEmailIgnoreCase(supplierEmail)
                .orElseGet(() -> userRepository.findByEmail(supplierEmail).orElse(null));

        if (supplier == null) {
            return Collections.emptyList();
        }

        if (!List.of("Supplier", "Buyer and Supplier").contains(supplier.getAccountType())) {
            throw new IllegalArgumentException("Only Suppliers or Buyer and Suppliers can view Collaboration Requests");
        }

        List<CollaborationRequisition> list = collaborationRequisitionRepository.findDistinctBySuppliersIdOrderByCreatedAtDesc(supplier.getId());
        if (list == null) {
            return Collections.emptyList();
        }
        return list.stream()
                .filter(Objects::nonNull)
                .map(r -> mapToResponseForSupplier(r, supplier))
                .collect(Collectors.toList());
    }

    public CollaborationRequisitionResponse acceptCollaborationRequisition(UUID id, String comments, String supplierEmail) {
        if (comments == null || comments.trim().isEmpty()) {
            throw new IllegalArgumentException("Comments are required when accepting a collaboration request");
        }

        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CollaborationRequisition req = collaborationRequisitionRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Collaboration Requisition not found"));

        boolean isAssigned = req.getSuppliers() != null && req.getSuppliers().stream()
                .anyMatch(s -> s.getId() != null && s.getId().toString().equalsIgnoreCase(supplier.getId().toString()));
        if (!isAssigned) {
            throw new IllegalArgumentException("You are not assigned to this collaboration requisition");
        }

        boolean poExists = requisitionRepository.findByCollaborationRequisitionIdOrderByCreatedAtDesc(Objects.requireNonNull(id))
                .stream()
                .anyMatch(po -> po.getSupplier() != null && (
                        (po.getSupplier().getId() != null && po.getSupplier().getId().equals(supplier.getId())) ||
                        (po.getSupplier().getEmail() != null && po.getSupplier().getEmail().equalsIgnoreCase(supplier.getEmail()))
                ));
        if (poExists || "Purchase Order Generated".equalsIgnoreCase(req.getStatus())) {
            throw new IllegalArgumentException("Cannot accept request: Purchase Order has already been generated.");
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
                        .filter(Objects::nonNull)
                        .map(item -> item != null ? item.getProductName() : null)
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

        return mapToResponseForSupplier(saved, supplier);
    }

    public CollaborationRequisitionResponse declineCollaborationRequisition(UUID id, String comments, String supplierEmail) {
        if (comments == null || comments.trim().isEmpty()) {
            throw new IllegalArgumentException("Comments are required when declining a collaboration request");
        }

        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CollaborationRequisition req = collaborationRequisitionRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Collaboration Requisition not found"));

        boolean isAssigned = req.getSuppliers() != null && req.getSuppliers().stream()
                .anyMatch(s -> s.getId() != null && s.getId().toString().equalsIgnoreCase(supplier.getId().toString()));
        if (!isAssigned) {
            throw new IllegalArgumentException("You are not assigned to this collaboration requisition");
        }

        boolean poExists = requisitionRepository.findByCollaborationRequisitionIdOrderByCreatedAtDesc(Objects.requireNonNull(id))
                .stream()
                .anyMatch(po -> po.getSupplier() != null && (
                        (po.getSupplier().getId() != null && po.getSupplier().getId().equals(supplier.getId())) ||
                        (po.getSupplier().getEmail() != null && po.getSupplier().getEmail().equalsIgnoreCase(supplier.getEmail()))
                ));
        if (poExists || "Purchase Order Generated".equalsIgnoreCase(req.getStatus())) {
            throw new IllegalArgumentException("Cannot decline request: Purchase Order has already been generated.");
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
                        .filter(Objects::nonNull)
                        .map(item -> item != null ? item.getProductName() : null)
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

        return mapToResponseForSupplier(saved, supplier);
    }

    public CollaborationRequisitionResponse evaluateProposal(UUID proposalId, String evaluationStatus, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CollaborationProposal proposal = collaborationProposalRepository.findById(Objects.requireNonNull(proposalId))
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found"));

        CollaborationRequisition req = proposal.getCollaborationRequisition();
        if (!req.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("Only the buyer who created this collaboration requisition can evaluate proposals");
        }

        String newStatus;
        if ("Accepted".equalsIgnoreCase(evaluationStatus)) {
            newStatus = "Accepted";
        } else if ("Declined".equalsIgnoreCase(evaluationStatus)) {
            newStatus = "Declined";
        } else if ("Pending".equalsIgnoreCase(evaluationStatus)) {
            newStatus = "Pending";
        } else {
            newStatus = "Need to Evaluate";
        }
        proposal.setEvaluationStatus(newStatus);
        collaborationProposalRepository.save(proposal);

        if ("Declined".equalsIgnoreCase(newStatus)) {
            CollaborationSupplierResponse resp = collaborationSupplierResponseRepository
                    .findByCollaborationRequisitionIdAndSupplierId(req.getId(), proposal.getSupplier().getId())
                    .orElse(new CollaborationSupplierResponse());
            if (resp.getId() == null) {
                resp.setId(UUID.randomUUID());
                resp.setCollaborationRequisition(req);
                resp.setSupplier(proposal.getSupplier());
            }
            resp.setStatus("Declined");
            resp.setComments(proposal.getProposalText() != null ? "Proposal Declined: " + proposal.getProposalText() : "Declined by Buyer");
            resp.setCreatedAt(LocalDateTime.now());
            collaborationSupplierResponseRepository.save(resp);
        }

        // Send Notification to Supplier (Populates in Supplier -> Notifications -> Collaborations)
        String title = "Accepted".equalsIgnoreCase(newStatus) ? "Proposal Accepted" :
                       "Declined".equalsIgnoreCase(newStatus) ? "Proposal Declined" : "Proposal Needs Evaluation";
        String msg = "Accepted".equalsIgnoreCase(newStatus)
                ? "Buyer " + getUserDisplayName(buyer) + " has ACCEPTED your proposal for collaboration requisition '" + req.getTitle() + "'."
                : "Declined".equalsIgnoreCase(newStatus)
                ? "Buyer " + getUserDisplayName(buyer) + " has DECLINED your proposal for collaboration requisition '" + req.getTitle() + "'."
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

    public CollaborationRequisitionResponse evaluateAllProposals(UUID collabReqId, String evaluationStatus, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CollaborationRequisition req = collaborationRequisitionRepository.findById(Objects.requireNonNull(collabReqId))
                .orElseThrow(() -> new IllegalArgumentException("Collaboration Requisition not found"));

        if (!req.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("Only the buyer who created this collaboration requisition can evaluate proposals");
        }

        List<CollaborationProposal> proposals = collaborationProposalRepository.findByCollaborationRequisitionIdOrderByCreatedAtDesc(collabReqId);
        if (proposals != null) {
            String newStatus;
            if ("Accepted".equalsIgnoreCase(evaluationStatus)) {
                newStatus = "Accepted";
            } else if ("Declined".equalsIgnoreCase(evaluationStatus)) {
                newStatus = "Declined";
            } else if ("Pending".equalsIgnoreCase(evaluationStatus)) {
                newStatus = "Pending";
            } else {
                newStatus = "Need to Evaluate";
            }

            for (CollaborationProposal p : proposals) {
                p.setEvaluationStatus(newStatus);
                collaborationProposalRepository.save(p);

                String title = "Accepted".equalsIgnoreCase(newStatus) ? "Proposal Accepted" :
                               "Declined".equalsIgnoreCase(newStatus) ? "Proposal Declined" : "Proposal Needs Evaluation";
                String msg = "Accepted".equalsIgnoreCase(newStatus)
                        ? "Buyer " + getUserDisplayName(buyer) + " has ACCEPTED your proposal for collaboration requisition '" + req.getTitle() + "'."
                        : "Declined".equalsIgnoreCase(newStatus)
                        ? "Buyer " + getUserDisplayName(buyer) + " has DECLINED your proposal for collaboration requisition '" + req.getTitle() + "'."
                        : "Buyer " + getUserDisplayName(buyer) + " marked your proposal for collaboration requisition '" + req.getTitle() + "' as 'Need to Evaluate'.";

                notificationService.createNotification(
                        p.getSupplier(),
                        buyer,
                        "COLLABORATIONS",
                        title,
                        msg,
                        "Evaluation Status: " + newStatus,
                        req.getId(),
                        "COLLABORATION_REQUISITION"
                );
            }
        }

        return mapToResponse(req);
    }

    public CollaborationRequisitionResponse declineAcceptedSupplierByBuyer(UUID collabReqId, UUID supplierId, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CollaborationRequisition req = collaborationRequisitionRepository.findById(Objects.requireNonNull(collabReqId))
                .orElseThrow(() -> new IllegalArgumentException("Collaboration Requisition not found"));

        if (!req.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("Only the buyer who created this collaboration requisition can decline suppliers");
        }

        User supplier = userRepository.findById(Objects.requireNonNull(supplierId))
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));

        CollaborationSupplierResponse resp = collaborationSupplierResponseRepository
                .findByCollaborationRequisitionIdAndSupplierId(req.getId(), supplier.getId())
                .orElse(new CollaborationSupplierResponse());

        if (resp.getId() == null) {
            resp.setId(UUID.randomUUID());
            resp.setCollaborationRequisition(req);
            resp.setSupplier(supplier);
        }
        resp.setStatus("Declined");
        resp.setComments("Declined by Buyer");
        resp.setCreatedAt(LocalDateTime.now());
        collaborationSupplierResponseRepository.save(resp);

        List<CollaborationProposal> props = collaborationProposalRepository.findByCollaborationRequisitionIdOrderByCreatedAtDesc(req.getId());
        if (props != null) {
            for (CollaborationProposal p : props) {
                if (p != null && p.getSupplier() != null && Objects.equals(p.getSupplier().getId(), supplier.getId())) {
                    p.setEvaluationStatus("Declined");
                    collaborationProposalRepository.save(p);
                }
            }
        }

        // Send notification to supplier
        String buyerName = getUserDisplayName(buyer);
        notificationService.createNotification(
                supplier,
                buyer,
                "COLLABORATIONS",
                "Collaboration Participation Declined",
                "Buyer " + buyerName + " has declined your participation for collaboration requisition '" + req.getTitle() + "'.",
                "Status: Declined by Buyer",
                req.getId(),
                "COLLABORATION_REQUISITION"
        );

        return mapToResponse(req);
    }

    public List<RequisitionResponse> createPurchaseOrdersFromCollab(UUID collabReqId, CreateCollabPoRequest request, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CollaborationRequisition req = collaborationRequisitionRepository.findById(Objects.requireNonNull(collabReqId))
                .orElseThrow(() -> new IllegalArgumentException("Collaboration Requisition not found"));

        if (!req.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("Only the buyer who created this collaboration requisition can generate Purchase Orders");
        }

        List<UUID> targetSupplierIds = request.getSupplierIds();
        if (targetSupplierIds == null || targetSupplierIds.isEmpty()) {
            if (req.getSuppliers() != null && !req.getSuppliers().isEmpty()) {
                targetSupplierIds = req.getSuppliers().stream()
                        .filter(Objects::nonNull)
                        .map(User::getId)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());
            } else {
                throw new IllegalArgumentException("Please select at least one supplier to assign the Purchase Order to.");
            }
        }

        List<CollaborationItemDto> validItems;
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            validItems = request.getItems().stream()
                    .filter(i -> i.getQuantity() != null && i.getQuantity() > 0)
                    .collect(Collectors.toList());
        } else if (req.getItems() != null && !req.getItems().isEmpty()) {
            validItems = req.getItems().stream()
                    .filter(Objects::nonNull)
                    .map(item -> new CollaborationItemDto(
                            item.getId(),
                            item.getItemType(),
                            item.getProductName(),
                            item.getFullDescription(),
                            item.getQuantity(),
                            item.getUnitMeasure(),
                            item.getPrice(),
                            item.getCurrencyType()
                    ))
                    .collect(Collectors.toList());
        } else {
            validItems = Collections.emptyList();
        }

        if (validItems.isEmpty()) {
            throw new IllegalArgumentException("At least one item with a quantity greater than 0 must be assigned.");
        }

        List<RequisitionResponse> createdPOs = new ArrayList<>();
        String buyerName = getUserDisplayName(buyer);

        for (UUID supId : targetSupplierIds) {
            User supplier = userRepository.findById(Objects.requireNonNull(supId))
                    .orElseThrow(() -> new IllegalArgumentException("Supplier with ID " + supId + " not found"));

            Integer maxReq = requisitionRepository.findMaxReqNumber();
            int nextReqNum = (maxReq != null ? maxReq : 0) + 1;

            Requisition po = new Requisition();
            po.setId(UUID.randomUUID());
            po.setBuyer(buyer);
            po.setSupplier(supplier);
            po.setTitle(request.getTitle() != null && !request.getTitle().isBlank() ? request.getTitle().trim() : req.getTitle());
            po.setShipTo(request.getShipTo() != null && !request.getShipTo().isBlank() ? request.getShipTo().trim() : req.getShipTo());
            po.setDeliverTo(request.getDeliverTo() != null && !request.getDeliverTo().isBlank() ? request.getDeliverTo().trim() : req.getDeliverTo());
            po.setNeedByDate(request.getNeedByDate() != null ? request.getNeedByDate() : req.getNeedByDate());
            po.setComments(request.getComments() != null && !request.getComments().isBlank() ? request.getComments().trim() : req.getComments());
            po.setStatus("PO");
            po.setReqNumber(nextReqNum);
            po.setCollaborationRequisitionId(req.getId());
            po.setCreatedAt(LocalDateTime.now());

            List<RequisitionItem> poItems = new ArrayList<>();
            for (CollaborationItemDto itemDto : validItems) {
                RequisitionItem item = new RequisitionItem();
                item.setId(UUID.randomUUID());
                item.setRequisition(po);
                item.setItemType("NON_CATALOG");
                item.setProductName(itemDto.getProductName());
                item.setFullDescription(itemDto.getFullDescription());
                item.setQuantity(itemDto.getQuantity());
                item.setUnitMeasure(itemDto.getUnitMeasure());
                item.setPrice(itemDto.getPrice() != null ? itemDto.getPrice() : BigDecimal.ZERO);
                item.setCurrencyType(itemDto.getCurrencyType() != null && !itemDto.getCurrencyType().isBlank() ? itemDto.getCurrencyType().trim() : "USD");
                item.setSupplier(supplier);
                poItems.add(item);
            }
            po.setItems(poItems);

            Requisition savedPo = requisitionRepository.save(po);

            String poCode = String.format("PO%02d", nextReqNum);
            String productNames = poItems.stream()
                    .filter(Objects::nonNull)
                    .map(item -> item != null ? item.getProductName() : null)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.joining(", "));

            String notificationMsg = "Buyer " + buyerName + " submitted a Purchase Order " + poCode + " for Product: " + productNames + ".";

            notificationService.createNotification(
                    supplier,
                    buyer,
                    "REQUISITIONS",
                    "New Purchase Order Submitted (" + poCode + ")",
                    notificationMsg,
                    savedPo.getComments(),
                    savedPo.getId(),
                    "REQUISITION"
            );

            notificationService.createNotification(
                    supplier,
                    buyer,
                    "COLLABORATIONS",
                    "Purchase Order Generated (" + poCode + ")",
                    "Purchase Order " + poCode + " was generated from Collaboration Requisition '" + req.getTitle() + "' for Product: " + productNames + ".",
                    savedPo.getComments(),
                    savedPo.getId(),
                    "REQUISITION"
            );

            // Record per-supplier response
            CollaborationSupplierResponse resp = collaborationSupplierResponseRepository
                    .findByCollaborationRequisitionIdAndSupplierId(req.getId(), supplier.getId())
                    .orElse(new CollaborationSupplierResponse());
            if (resp.getId() == null) resp.setId(UUID.randomUUID());
            resp.setCollaborationRequisition(req);
            resp.setSupplier(supplier);
            resp.setStatus("Purchase Order Generated");
            resp.setCreatedAt(LocalDateTime.now());
            collaborationSupplierResponseRepository.save(resp);

            List<CollaborationProposal> proposals = collaborationProposalRepository.findByCollaborationRequisitionIdOrderByCreatedAtDesc(req.getId());
            if (proposals != null) {
                for (CollaborationProposal prop : proposals) {
                    if (prop != null && prop.getSupplier() != null && Objects.equals(prop.getSupplier().getId(), supplier.getId())) {
                        prop.setEvaluationStatus("Accepted");
                        collaborationProposalRepository.save(prop);
                    }
                }
            }

            createdPOs.add(mapPoToResponse(savedPo));
        }

        // Determine whether all quantities of the requisition items have been converted
        int totalReqQty = (req.getItems() != null)
                ? req.getItems().stream().mapToInt(CollaborationRequisitionItem::getQuantity).sum()
                : 0;

        List<Requisition> allPos = requisitionRepository.findByCollaborationRequisitionIdOrderByCreatedAtDesc(req.getId());
        int totalAllocatedQty = 0;
        if (allPos != null) {
            for (Requisition poRef : allPos) {
                if (poRef.getItems() != null) {
                    for (RequisitionItem rItem : poRef.getItems()) {
                        totalAllocatedQty += (rItem.getQuantity() != null ? rItem.getQuantity() : 0);
                    }
                }
            }
        }

        if (totalReqQty == 0 || totalAllocatedQty >= totalReqQty) {
            req.setStatus("Purchase Order Generated");
        } else {
            req.setStatus("Partially Converted");
        }
        collaborationRequisitionRepository.save(req);

        return createdPOs;
    }

    public CollaborationRequisitionResponse submitProposal(UUID id, String proposalText, String supplierEmail) {
        return submitProposal(id, proposalText, null, null, supplierEmail);
    }

    public CollaborationRequisitionResponse submitProposal(UUID id, String proposalText, String fileUrl, String fileName, String supplierEmail) {
        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        CollaborationRequisition req = collaborationRequisitionRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Collaboration Requisition not found"));

        boolean isAssigned = req.getSuppliers() != null && req.getSuppliers().stream()
                .anyMatch(s -> s.getId() != null && s.getId().toString().equalsIgnoreCase(supplier.getId().toString()));
        if (!isAssigned) {
            throw new IllegalArgumentException("You are not assigned to this collaboration requisition");
        }

        boolean poExists = requisitionRepository.findByCollaborationRequisitionIdOrderByCreatedAtDesc(Objects.requireNonNull(id))
                .stream()
                .anyMatch(po -> po.getSupplier() != null && (
                        (po.getSupplier().getId() != null && po.getSupplier().getId().equals(supplier.getId())) ||
                        (po.getSupplier().getEmail() != null && po.getSupplier().getEmail().equalsIgnoreCase(supplier.getEmail()))
                ));
        if (poExists || "Purchase Order Generated".equalsIgnoreCase(req.getStatus())) {
            throw new IllegalArgumentException("Cannot submit proposal: Purchase Order has already been generated.");
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
        if (fileUrl != null && !fileUrl.isBlank()) {
            proposal.setFileUrl(fileUrl.trim());
        }
        if (fileName != null && !fileName.isBlank()) {
            proposal.setFileName(fileName.trim());
        }

        collaborationProposalRepository.save(proposal);

        // Send Notification to Buyer
        String supplierName = getUserDisplayName(supplier);
        String productNames = (req.getItems() != null && !req.getItems().isEmpty())
                ? req.getItems().stream()
                        .filter(Objects::nonNull)
                        .map(item -> item != null ? item.getProductName() : null)
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

        return mapToResponseForSupplier(req, supplier);
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

        List<Requisition> pos = requisitionRepository.findByCollaborationRequisitionIdOrderByCreatedAtDesc(r.getId());
        List<RequisitionResponse> poResponses = (pos != null ? pos : Collections.<Requisition>emptyList()).stream()
                .filter(Objects::nonNull)
                .map(this::mapPoToResponse)
                .collect(Collectors.toList());

        List<CollaborationSupplierResponse> allResponses = collaborationSupplierResponseRepository
                .findByCollaborationRequisitionId(r.getId());
        List<SupplierSummaryResponse> acceptedSuppliers = new ArrayList<>();
        List<SupplierSummaryResponse> declinedSuppliers = new ArrayList<>();
        Set<UUID> seenSupplierIds = new HashSet<>();
        Set<UUID> seenDeclinedSupplierIds = new HashSet<>();

        if (allResponses != null) {
            for (CollaborationSupplierResponse respItem : allResponses) {
                if (respItem != null && respItem.getSupplier() != null && respItem.getSupplier().getId() != null) {
                    String status = respItem.getStatus();
                    boolean isAccepted = "Accepted".equalsIgnoreCase(status);
                    boolean isPoGen = "Purchase Order Generated".equalsIgnoreCase(status);
                    boolean isDeclined = "Declined".equalsIgnoreCase(status);

                    Requisition matchingPo = (pos != null ? pos : Collections.<Requisition>emptyList()).stream()
                            .filter(p -> p != null && p.getSupplier() != null && Objects.equals(p.getSupplier().getId(), respItem.getSupplier().getId()))
                            .findFirst()
                            .orElse(null);

                    if (isAccepted || isPoGen || matchingPo != null) {
                        SupplierSummaryResponse summary = new SupplierSummaryResponse(
                                respItem.getSupplier().getId(),
                                respItem.getSupplier().getEmail(),
                                getUserDisplayName(respItem.getSupplier()),
                                respItem.getSupplier().getAccountType()
                        );
                        summary.setComments(respItem.getComments());
                        if (matchingPo != null) {
                            summary.setStatus("Purchase Order Generated");
                            Integer reqNum = matchingPo.getReqNumber();
                            summary.setPoNumber(String.format("PO%02d", reqNum != null ? reqNum : 0));
                        } else if (isPoGen) {
                            summary.setStatus("Purchase Order Generated");
                        } else {
                            summary.setStatus("Accepted");
                        }
                        acceptedSuppliers.add(summary);
                        seenSupplierIds.add(respItem.getSupplier().getId());
                    } else if (isDeclined) {
                        if (!seenDeclinedSupplierIds.contains(respItem.getSupplier().getId())) {
                            SupplierSummaryResponse summary = new SupplierSummaryResponse(
                                    respItem.getSupplier().getId(),
                                    respItem.getSupplier().getEmail(),
                                    getUserDisplayName(respItem.getSupplier()),
                                    respItem.getSupplier().getAccountType()
                            );
                            summary.setStatus("Declined");
                            summary.setComments(respItem.getComments());
                            declinedSuppliers.add(summary);
                            seenDeclinedSupplierIds.add(respItem.getSupplier().getId());
                        }
                    }
                }
            }
        }

        List<CollaborationProposal> proposalsList = collaborationProposalRepository.findByCollaborationRequisitionIdOrderByCreatedAtDesc(r.getId());
        if (proposalsList != null) {
            for (CollaborationProposal p : proposalsList) {
                if (p != null && p.getSupplier() != null && "Declined".equalsIgnoreCase(p.getEvaluationStatus())) {
                    if (!seenDeclinedSupplierIds.contains(p.getSupplier().getId())) {
                        SupplierSummaryResponse summary = new SupplierSummaryResponse(
                                p.getSupplier().getId(),
                                p.getSupplier().getEmail(),
                                getUserDisplayName(p.getSupplier()),
                                p.getSupplier().getAccountType()
                        );
                        summary.setStatus("Declined");
                        summary.setComments(p.getProposalText() != null ? p.getProposalText() : "Declined by Buyer");
                        declinedSuppliers.add(summary);
                        seenDeclinedSupplierIds.add(p.getSupplier().getId());
                    }
                }
            }
        }

        if (pos != null) {
            for (Requisition p : pos) {
                if (p != null && p.getSupplier() != null && p.getSupplier().getId() != null && !seenSupplierIds.contains(p.getSupplier().getId())) {
                    SupplierSummaryResponse summary = new SupplierSummaryResponse(
                            p.getSupplier().getId(),
                            p.getSupplier().getEmail(),
                            getUserDisplayName(p.getSupplier()),
                            p.getSupplier().getAccountType()
                    );
                    summary.setStatus("Purchase Order Generated");
                    Integer reqNum = p.getReqNumber();
                    summary.setPoNumber(String.format("PO%02d", reqNum != null ? reqNum : 0));
                    acceptedSuppliers.add(summary);
                    seenSupplierIds.add(p.getSupplier().getId());
                }
            }
        }

        List<CollaborationItemDto> itemDtos = (r.getItems() != null ? r.getItems() : Collections.<CollaborationRequisitionItem>emptyList()).stream()
                .filter(Objects::nonNull)
                .map(i -> new CollaborationItemDto(
                        i.getId(),
                        i.getItemType(),
                        i.getProductName(),
                        i.getFullDescription(),
                        i.getQuantity(),
                        i.getUnitMeasure(),
                        i.getPrice(),
                        i.getCurrencyType()
                ))
                .collect(Collectors.toList());

        List<CollaborationProposalDto> proposalDtos = (proposalsList != null ? proposalsList : Collections.<CollaborationProposal>emptyList()).stream()
                .filter(p -> p != null && p.getSupplier() != null)
                .map(p -> new CollaborationProposalDto(
                        p.getId(),
                        p.getSupplier().getId(),
                        p.getSupplier().getEmail(),
                        getUserDisplayName(p.getSupplier()),
                        p.getProposalText(),
                        p.getEvaluationStatus() != null ? p.getEvaluationStatus() : "Need to Evaluate",
                        p.getCreatedAt(),
                        p.getFileUrl(),
                        p.getFileName()
                ))
                .collect(Collectors.toList());

        CollaborationRequisitionResponse resp = new CollaborationRequisitionResponse(
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
                proposalDtos,
                poResponses
        );
        resp.setDeclinedSuppliers(declinedSuppliers);
        if (poResponses != null && !poResponses.isEmpty()) {
            String poNumStr = poResponses.stream()
                    .map(RequisitionResponse::getRequisitionId)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.joining(", "));
            resp.setPoNumber(poNumStr);

            int totalReqQty = (r.getItems() != null)
                    ? r.getItems().stream().mapToInt(CollaborationRequisitionItem::getQuantity).sum()
                    : 0;
            int totalAllocatedQty = 0;
            if (pos != null) {
                for (Requisition poRef : pos) {
                    if (poRef.getItems() != null) {
                        for (RequisitionItem rItem : poRef.getItems()) {
                            totalAllocatedQty += (rItem.getQuantity() != null ? rItem.getQuantity() : 0);
                        }
                    }
                }
            }
            boolean isFullyConverted = (totalReqQty == 0) || (totalAllocatedQty >= totalReqQty) || "Purchase Order Generated".equalsIgnoreCase(r.getStatus());
            resp.setPurchaseOrderGenerated(isFullyConverted);
            if (isFullyConverted) {
                resp.setStatus("Purchase Order Generated");
            } else {
                resp.setStatus("Partially Converted");
            }
        } else if ("Purchase Order Generated".equalsIgnoreCase(r.getStatus())) {
            resp.setPurchaseOrderGenerated(true);
        }
        return resp;
    }

    public CollaborationRequisitionResponse mapToResponseForSupplier(CollaborationRequisition r, User supplier) {
        CollaborationRequisitionResponse resp = mapToResponse(r);
        if (resp == null) return null;

        // Privacy: Suppliers must only see their own proposals, not proposals from other suppliers
        if (resp.getProposals() != null && supplier != null) {
            List<CollaborationProposalDto> ownProposals = resp.getProposals().stream()
                    .filter(p -> p != null && (
                            (p.getSupplierId() != null && p.getSupplierId().equals(supplier.getId())) ||
                            (p.getSupplierEmail() != null && p.getSupplierEmail().equalsIgnoreCase(supplier.getEmail()))
                    ))
                    .collect(Collectors.toList());
            resp.setProposals(ownProposals);
        }

        boolean hasPoForSupplier = requisitionRepository.findByCollaborationRequisitionIdOrderByCreatedAtDesc(r.getId())
                .stream()
                .anyMatch(po -> po.getSupplier() != null && (
                        (po.getSupplier().getId() != null && po.getSupplier().getId().equals(supplier.getId())) ||
                        (po.getSupplier().getEmail() != null && po.getSupplier().getEmail().equalsIgnoreCase(supplier.getEmail()))
                ));

        Optional<CollaborationSupplierResponse> supplierResp = collaborationSupplierResponseRepository
                .findByCollaborationRequisitionIdAndSupplierId(r.getId(), supplier.getId());
        boolean hasPoStatusInResponse = supplierResp
                .map(sr -> "Purchase Order Generated".equalsIgnoreCase(sr.getStatus()))
                .orElse(false);

        if (hasPoForSupplier || hasPoStatusInResponse) {
            resp.setStatus("Purchase Order Generated");
            resp.setCurrentSupplierStatus("Purchase Order Generated");
            resp.setPurchaseOrderGenerated(true);

            String supplierPoNum = requisitionRepository.findByCollaborationRequisitionIdOrderByCreatedAtDesc(r.getId())
                    .stream()
                    .filter(po -> po.getSupplier() != null && (
                            (po.getSupplier().getId() != null && po.getSupplier().getId().equals(supplier.getId())) ||
                            (po.getSupplier().getEmail() != null && po.getSupplier().getEmail().equalsIgnoreCase(supplier.getEmail()))
                    ))
                    .map(this::mapPoToResponse)
                    .map(RequisitionResponse::getRequisitionId)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.joining(", "));
            if (!supplierPoNum.isEmpty()) {
                resp.setPoNumber(supplierPoNum);
            }
        } else {
            resp.setPurchaseOrderGenerated(false);
            if (supplierResp.isPresent()) {
                resp.setCurrentSupplierStatus(supplierResp.get().getStatus());
                resp.setStatus(supplierResp.get().getStatus());
            } else {
                resp.setCurrentSupplierStatus("Pending from Buyer");
                if ("Purchase Order Generated".equalsIgnoreCase(resp.getStatus())) {
                    resp.setStatus("Collaborating");
                }
            }
        }

        return resp;
    }

    private RequisitionResponse mapPoToResponse(Requisition r) {
        if (r == null) return null;
        List<RequisitionItemDto> itemDtos = (r.getItems() != null ? r.getItems() : Collections.<RequisitionItem>emptyList()).stream()
                .filter(Objects::nonNull)
                .map(item -> new RequisitionItemDto(
                        item.getId(),
                        item.getItemType(),
                        item.getCatalogueId(),
                        item.getProductName(),
                        item.getFullDescription(),
                        item.getQuantity(),
                        item.getUnitMeasure(),
                        item.getPrice(),
                        item.getCurrencyType() != null ? item.getCurrencyType() : "USD",
                        item.getSupplier() != null ? item.getSupplier().getId() : null,
                        item.getSupplier() != null ? getUserDisplayName(item.getSupplier()) : null
                ))
                .collect(Collectors.toList());

        Integer reqNumVal = r.getReqNumber();
        Integer reqNum = reqNumVal != null ? reqNumVal : 1;
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
                r.getBuyer() != null ? r.getBuyer().getId() : null,
                r.getBuyer() != null ? r.getBuyer().getEmail() : null,
                r.getBuyer() != null ? getUserDisplayName(r.getBuyer()) : "Unknown",
                r.getSupplier() != null ? r.getSupplier().getId() : null,
                r.getSupplier() != null ? r.getSupplier().getEmail() : null,
                r.getSupplier() != null ? getUserDisplayName(r.getSupplier()) : null,
                itemDtos
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
