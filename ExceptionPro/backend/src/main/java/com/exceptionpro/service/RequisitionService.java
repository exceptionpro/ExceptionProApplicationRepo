package com.exceptionpro.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.exceptionpro.dto.CatalogueResponse;
import com.exceptionpro.dto.RequisitionItemDto;
import com.exceptionpro.dto.RequisitionRequest;
import com.exceptionpro.dto.RequisitionResponse;
import com.exceptionpro.dto.SupplierSummaryResponse;
import com.exceptionpro.entity.BusinessPartnerRequest;
import com.exceptionpro.entity.Requisition;
import com.exceptionpro.entity.RequisitionItem;
import com.exceptionpro.entity.User;
import com.exceptionpro.repository.BusinessPartnerRequestRepository;
import com.exceptionpro.repository.CatalogueRepository;
import com.exceptionpro.repository.PurchaseReceiptRepository;
import com.exceptionpro.repository.RequisitionRepository;
import com.exceptionpro.repository.UserRepository;

@Service
@Transactional
public class RequisitionService {

    private final RequisitionRepository requisitionRepository;
    private final UserRepository userRepository;
    private final CatalogueRepository catalogueRepository;
    private final NotificationService notificationService;
    private final BusinessPartnerRequestRepository businessPartnerRequestRepository;
    private final PurchaseReceiptRepository purchaseReceiptRepository;

    public RequisitionService(RequisitionRepository requisitionRepository,
                              UserRepository userRepository,
                              CatalogueRepository catalogueRepository,
                              NotificationService notificationService,
                              BusinessPartnerRequestRepository businessPartnerRequestRepository,
                              PurchaseReceiptRepository purchaseReceiptRepository) {
        this.requisitionRepository = requisitionRepository;
        this.userRepository = userRepository;
        this.catalogueRepository = catalogueRepository;
        this.notificationService = notificationService;
        this.businessPartnerRequestRepository = businessPartnerRequestRepository;
        this.purchaseReceiptRepository = purchaseReceiptRepository;
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
        requisition.setSupplierModified(false);
        requisition.setCreatedAt(LocalDateTime.now());

        Integer maxReq = requisitionRepository.findMaxReqNumber();
        requisition.setReqNumber((maxReq == null) ? 1 : maxReq + 1);

        if (request.getSupplierId() != null) {
            User supplier = userRepository.findById(Objects.requireNonNull(request.getSupplierId()))
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
                int qty = itemDto.getQuantity() != null ? itemDto.getQuantity().intValue() : 1;
                item.setQuantity(qty);
                item.setOriginalQuantity(qty);
                item.setUnitMeasure(itemDto.getUnitMeasure());
                item.setPrice(itemDto.getPrice());
                item.setOriginalPrice(itemDto.getPrice());
                item.setCurrencyType(itemDto.getCurrencyType() != null && !itemDto.getCurrencyType().isBlank() ? itemDto.getCurrencyType().trim() : "USD");

                if (itemDto.getSupplierId() != null) {
                    User itemSupplier = userRepository.findById(Objects.requireNonNull(itemDto.getSupplierId())).orElse(null);
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

        Requisition requisition = requisitionRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Requisition not found"));

        if (!requisition.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You can only edit your own requisitions");
        }

        if ("PO Accepted".equalsIgnoreCase(requisition.getStatus()) || "Accepted".equalsIgnoreCase(requisition.getStatus())) {
            throw new IllegalArgumentException("Cannot edit a Purchase Order that has already been accepted by the supplier");
        }

        validateRequisitionRequest(request);

        requisition.setTitle(request.getTitle());
        requisition.setShipTo(request.getShipTo());
        requisition.setDeliverTo(request.getDeliverTo());
        requisition.setNeedByDate(request.getNeedByDate());
        requisition.setComments(request.getComments());

        if (request.getSupplierId() != null) {
            User supplier = userRepository.findById(Objects.requireNonNull(request.getSupplierId())).orElse(null);
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
                int qty = itemDto.getQuantity() != null ? itemDto.getQuantity().intValue() : 1;
                item.setQuantity(qty);
                item.setOriginalQuantity(qty);
                item.setUnitMeasure(itemDto.getUnitMeasure());
                item.setPrice(itemDto.getPrice());
                item.setOriginalPrice(itemDto.getPrice());
                item.setCurrencyType(itemDto.getCurrencyType() != null && !itemDto.getCurrencyType().isBlank() ? itemDto.getCurrencyType().trim() : "USD");

                if (itemDto.getSupplierId() != null) {
                    User itemSupplier = userRepository.findById(Objects.requireNonNull(itemDto.getSupplierId())).orElse(null);
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

        Requisition requisition = requisitionRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Requisition not found"));

        if (!requisition.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You can only delete your own requisitions");
        }

        int reqNum = (requisition.getReqNumber() != null) ? requisition.getReqNumber() : 1;
        String poCode = String.format("PO%02d", reqNum);
        if (purchaseReceiptRepository.existsByPurchaseOrderId(requisition.getId())) {
            throw new IllegalArgumentException("Purchase Receipts Exists on " + poCode);
        }

        if ("PO".equalsIgnoreCase(requisition.getStatus()) || "PO Accepted".equalsIgnoreCase(requisition.getStatus()) || "Accepted".equalsIgnoreCase(requisition.getStatus())) {
            throw new IllegalArgumentException("Cannot delete a requisition that has already been converted to Purchase Order (PO)");
        }

        requisitionRepository.delete(Objects.requireNonNull(requisition));
    }

    public RequisitionResponse convertToPo(UUID id, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Requisition requisition = requisitionRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Requisition not found"));

        if (!requisition.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You can only convert your own requisitions to Purchase Order");
        }

        requisition.setStatus("PO");
        if (requisition.getItems() != null) {
            for (RequisitionItem item : requisition.getItems()) {
                if (item.getOriginalQuantity() == null) {
                    item.setOriginalQuantity(item.getQuantity());
                }
                if (item.getOriginalPrice() == null) {
                    item.setOriginalPrice(item.getPrice());
                }
            }
        }
        Requisition saved = requisitionRepository.save(requisition);

        sendPoNotificationsToSuppliers(saved, buyer);

        return mapToResponse(saved);
    }

    public RequisitionResponse copyPurchaseOrder(UUID sourceId, RequisitionRequest request, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!List.of("Buyer", "Buyer and Supplier").contains(buyer.getAccountType())) {
            throw new IllegalArgumentException("Only Buyers or Buyer and Suppliers can copy a Purchase Order");
        }

        Requisition source = requisitionRepository.findById(Objects.requireNonNull(sourceId))
                .orElseThrow(() -> new IllegalArgumentException("Source Purchase Order not found"));

        if (!source.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You can only copy your own Purchase Orders");
        }

        // Title resolution:
        // If user changed title (non-blank and not equal to source title), use that title.
        // If user didn't change title (or left it blank), title becomes "copy of " + source.getTitle().
        String sourceTitle = source.getTitle() != null ? source.getTitle().trim() : "";
        String requestedTitle = (request != null && request.getTitle() != null) ? request.getTitle().trim() : "";
        String finalTitle;
        if (!requestedTitle.isEmpty() && !requestedTitle.equalsIgnoreCase(sourceTitle)) {
            finalTitle = requestedTitle;
        } else {
            finalTitle = "copy of " + (sourceTitle.isEmpty() ? "Purchase Order" : sourceTitle);
        }

        Requisition newPo = new Requisition();
        newPo.setId(UUID.randomUUID());
        newPo.setBuyer(buyer);
        newPo.setTitle(finalTitle);
        newPo.setShipTo(request != null && request.getShipTo() != null && !request.getShipTo().trim().isEmpty() ? request.getShipTo().trim() : source.getShipTo());
        newPo.setDeliverTo(request != null && request.getDeliverTo() != null && !request.getDeliverTo().trim().isEmpty() ? request.getDeliverTo().trim() : source.getDeliverTo());
        newPo.setNeedByDate(request != null && request.getNeedByDate() != null ? request.getNeedByDate() : source.getNeedByDate());
        newPo.setComments(request != null && request.getComments() != null ? request.getComments().trim() : source.getComments());
        newPo.setStatus("PO"); // Directly created as a new PO
        newPo.setSupplierModified(false);
        newPo.setCreatedAt(LocalDateTime.now());

        Integer maxReq = requisitionRepository.findMaxReqNumber();
        newPo.setReqNumber((maxReq == null) ? 1 : maxReq + 1);

        UUID supplierId = (request != null && request.getSupplierId() != null)
                ? request.getSupplierId()
                : (source.getSupplier() != null ? source.getSupplier().getId() : null);

        if (supplierId != null) {
            User supplier = userRepository.findById(supplierId).orElse(null);
            newPo.setSupplier(supplier);
        }

        List<RequisitionItem> itemEntities = new ArrayList<>();
        if (request != null && request.getItems() != null && !request.getItems().isEmpty()) {
            for (RequisitionItemDto itemDto : request.getItems()) {
                RequisitionItem item = new RequisitionItem();
                item.setId(UUID.randomUUID());
                item.setRequisition(newPo);
                item.setItemType(itemDto.getItemType() != null ? itemDto.getItemType() : "NON_CATALOG");
                item.setCatalogueId(itemDto.getCatalogueId());
                item.setProductName(itemDto.getProductName());
                item.setFullDescription(itemDto.getFullDescription());
                int qty = itemDto.getQuantity() != null ? itemDto.getQuantity().intValue() : 1;
                item.setQuantity(qty);
                item.setOriginalQuantity(qty);
                item.setUnitMeasure(itemDto.getUnitMeasure());
                item.setPrice(itemDto.getPrice());
                item.setOriginalPrice(itemDto.getPrice());
                item.setCurrencyType(itemDto.getCurrencyType() != null && !itemDto.getCurrencyType().isBlank() ? itemDto.getCurrencyType().trim() : "USD");

                if (itemDto.getSupplierId() != null) {
                    User itemSupplier = userRepository.findById(Objects.requireNonNull(itemDto.getSupplierId())).orElse(null);
                    item.setSupplier(itemSupplier);
                    if (newPo.getSupplier() == null) {
                        newPo.setSupplier(itemSupplier);
                    }
                } else if (newPo.getSupplier() != null) {
                    item.setSupplier(newPo.getSupplier());
                }
                itemEntities.add(item);
            }
        } else if (source.getItems() != null) {
            for (RequisitionItem sourceItem : source.getItems()) {
                RequisitionItem item = new RequisitionItem();
                item.setId(UUID.randomUUID());
                item.setRequisition(newPo);
                item.setItemType(sourceItem.getItemType());
                item.setCatalogueId(sourceItem.getCatalogueId());
                item.setProductName(sourceItem.getProductName());
                item.setFullDescription(sourceItem.getFullDescription());
                int qty = sourceItem.getQuantity() != null ? sourceItem.getQuantity() : 1;
                item.setQuantity(qty);
                item.setOriginalQuantity(qty);
                item.setUnitMeasure(sourceItem.getUnitMeasure());
                item.setPrice(sourceItem.getPrice());
                item.setOriginalPrice(sourceItem.getPrice());
                item.setCurrencyType(sourceItem.getCurrencyType());
                item.setSupplier(sourceItem.getSupplier() != null ? sourceItem.getSupplier() : newPo.getSupplier());
                itemEntities.add(item);
            }
        }
        newPo.setItems(itemEntities);

        Requisition saved = requisitionRepository.save(newPo);

        // Send Notification to assigned Supplier(s) for the newly created Purchase Order
        sendPoNotificationsToSuppliers(saved, buyer);

        return mapToResponse(saved);
    }

    private void sendPoNotificationsToSuppliers(Requisition saved, User buyer) {
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

        int reqNum = (saved.getReqNumber() != null) ? saved.getReqNumber().intValue() : 1;
        String poCode = String.format("PO%02d", reqNum);

        String buyerName = getUserDisplayName(buyer);

        for (User targetSupplier : targetSuppliers) {
            String productNames = (saved.getItems() != null && !saved.getItems().isEmpty())
                    ? saved.getItems().stream()
                            .filter(i -> i.getSupplier() == null
                                    || (i.getSupplier() != null && i.getSupplier().getId().equals(targetSupplier.getId()))
                                    || (saved.getSupplier() != null && saved.getSupplier().getId().equals(targetSupplier.getId())))
                            .map(i -> i != null ? i.getProductName() : null)
                            .filter(p -> p != null && !p.isBlank())
                            .distinct()
                            .collect(Collectors.joining(", "))
                    : saved.getTitle();

            if (productNames == null || productNames.isBlank()) {
                productNames = saved.getTitle() != null ? saved.getTitle() : "Product";
            }

            String notificationMsg = "Buyer " + buyerName + " submitted a Purchase Order " + poCode + " for Product: " + productNames + ".";

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
    }

    public List<RequisitionResponse> getSupplierRequisitions(String supplierEmail) {
        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!List.of("Supplier", "Buyer and Supplier").contains(supplier.getAccountType())) {
            throw new IllegalArgumentException("Only Suppliers or Buyer and Suppliers can view Purchase Requests");
        }

        List<String> poStatuses = List.of("PO", "Accepted", "PO Accepted", "Declined", "Cancelled");
        return requisitionRepository.findBySupplierIdAndStatusInOrderByCreatedAtDesc(supplier.getId(), poStatuses).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public RequisitionResponse cancelPurchaseOrder(UUID id, String cancellationReason, String buyerEmail) {
        if (cancellationReason == null || cancellationReason.trim().isEmpty()) {
            throw new IllegalArgumentException("Reason for Cancellation is required");
        }

        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!List.of("Buyer", "Buyer and Supplier").contains(buyer.getAccountType())) {
            throw new IllegalArgumentException("Only Buyers or Buyer and Suppliers can cancel a Purchase Order");
        }

        Requisition requisition = requisitionRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found"));

        if (!requisition.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You can only cancel your own Purchase Orders");
        }

        int reqNum = (requisition.getReqNumber() != null) ? requisition.getReqNumber() : 1;
        String poCode = String.format("PO%02d", reqNum);

        if (purchaseReceiptRepository.existsByPurchaseOrderId(requisition.getId())) {
            throw new IllegalArgumentException("Purchase Receipts Exists on " + poCode);
        }

        if ("Cancelled".equalsIgnoreCase(requisition.getStatus())) {
            throw new IllegalArgumentException("This Purchase Order is already cancelled");
        }

        String reason = cancellationReason.trim();
        if (reason.length() > 500) {
            reason = reason.substring(0, 500);
        }

        requisition.setStatus("Cancelled");
        requisition.setCancellationReason(reason);

        Requisition saved = requisitionRepository.save(requisition);

        // Notify assigned Supplier(s)
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

        String buyerName = getUserDisplayName(buyer);

        for (User targetSupplier : targetSuppliers) {
            String notificationMsg = "Buyer " + buyerName + " cancelled Purchase Order " + poCode + " ('" + saved.getTitle() + "'). Reason for Cancellation: " + reason;
            notificationService.createNotification(
                    targetSupplier,
                    buyer,
                    "REQUISITIONS",
                    "Purchase Order Cancelled (" + poCode + ")",
                    notificationMsg,
                    reason,
                    saved.getId(),
                    "REQUISITION"
            );
        }

        return mapToResponse(saved);
    }

    public RequisitionResponse acceptRequisition(UUID id, String supplierComment, String supplierEmail) {
        return acceptRequisition(id, supplierComment, null, supplierEmail);
    }

    public RequisitionResponse acceptRequisition(UUID id, String supplierComment, List<RequisitionItemDto> modifiedItems, String supplierEmail) {
        if (supplierComment == null || supplierComment.trim().isEmpty()) {
            throw new IllegalArgumentException("Comments are required when accepting a purchase request");
        }

        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Requisition requisition = requisitionRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Requisition not found"));

        if ("Cancelled".equalsIgnoreCase(requisition.getStatus())) {
            throw new IllegalArgumentException("Cannot accept a cancelled Purchase Order");
        }

        if (requisition.getSupplier() == null || !requisition.getSupplier().getId().equals(supplier.getId())) {
            throw new IllegalArgumentException("You are not assigned as the supplier for this requisition");
        }

        boolean anyItemModified = false;
        List<RequisitionItem> currentItems = requisition.getItems();
        if (currentItems != null && !currentItems.isEmpty()) {
            for (int idx = 0; idx < currentItems.size(); idx++) {
                RequisitionItem entityItem = currentItems.get(idx);
                if (entityItem.getOriginalQuantity() == null) {
                    entityItem.setOriginalQuantity(entityItem.getQuantity());
                }
                if (entityItem.getOriginalPrice() == null) {
                    entityItem.setOriginalPrice(entityItem.getPrice());
                }

                if (modifiedItems != null && !modifiedItems.isEmpty()) {
                    RequisitionItemDto dtoMatch = null;
                    if (entityItem.getId() != null) {
                        for (RequisitionItemDto dto : modifiedItems) {
                            if (dto.getId() != null && dto.getId().equals(entityItem.getId())) {
                                dtoMatch = dto;
                                break;
                            }
                        }
                    }
                    if (dtoMatch == null && idx < modifiedItems.size()) {
                        dtoMatch = modifiedItems.get(idx);
                    }

                    if (dtoMatch != null) {
                        if (dtoMatch.getQuantity() != null) {
                            if (dtoMatch.getQuantity() <= 0) {
                                throw new IllegalArgumentException("Quantity must be greater than 0 for item: " + entityItem.getProductName());
                            }
                            entityItem.setQuantity(dtoMatch.getQuantity());
                        }
                        // Only NON_CATALOG items allow price modification by Supplier; CATALOG items only allow Quantity modification
                        if (!"CATALOG".equalsIgnoreCase(entityItem.getItemType()) && dtoMatch.getPrice() != null) {
                            if (dtoMatch.getPrice().compareTo(BigDecimal.ZERO) < 0) {
                                throw new IllegalArgumentException("Price cannot be negative for item: " + entityItem.getProductName());
                            }
                            entityItem.setPrice(dtoMatch.getPrice());
                        } else if ("CATALOG".equalsIgnoreCase(entityItem.getItemType())) {
                            entityItem.setPrice(entityItem.getOriginalPrice());
                        }
                    }
                }

                Integer origQty = entityItem.getOriginalQuantity();
                Integer currQty = entityItem.getQuantity();
                if (origQty != null && currQty != null && !origQty.equals(currQty)) {
                    anyItemModified = true;
                }
                BigDecimal origPrice = entityItem.getOriginalPrice();
                BigDecimal currPrice = entityItem.getPrice();
                if (!"CATALOG".equalsIgnoreCase(entityItem.getItemType())
                        && origPrice != null && currPrice != null
                        && origPrice.compareTo(currPrice) != 0) {
                    anyItemModified = true;
                }
            }
        }

        requisition.setStatus("PO Accepted");
        String trimmedComment = supplierComment.trim();
        if (trimmedComment.length() > 400) {
            requisition.setSupplierComment(trimmedComment.substring(0, 400));
        } else {
            requisition.setSupplierComment(trimmedComment);
        }

        if (anyItemModified) {
            requisition.setSupplierModified(true);
            requisition.setBuyerModificationStatus("PENDING_BUYER_APPROVAL");
            requisition.setBuyerComment(null);
        } else {
            requisition.setSupplierModified(false);
            requisition.setBuyerModificationStatus("PROCEED_INVOICE");
        }

        Requisition saved = requisitionRepository.save(requisition);

        // Send Notification to Buyer
        notificationService.sendOrUpdateBuyerPurchaseOrderNotification(saved, supplier, "PO Accepted");

        return mapToResponse(saved);
    }

    public RequisitionResponse approveSupplierModification(UUID id, String buyerComment, String buyerEmail) {
        if (buyerComment == null || buyerComment.trim().isEmpty()) {
            throw new IllegalArgumentException("Buyer message is mandatory to approve the modification");
        }

        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Requisition requisition = requisitionRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found"));

        if (!requisition.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You can only approve modifications on your own Purchase Orders");
        }

        if (!Boolean.TRUE.equals(requisition.getSupplierModified())) {
            throw new IllegalArgumentException("This Purchase Order was not modified by the Supplier");
        }

        String trimmed = buyerComment.trim();
        if (trimmed.length() > 500) {
            trimmed = trimmed.substring(0, 500);
        }

        requisition.setBuyerModificationStatus("APPROVED");
        requisition.setBuyerComment(trimmed);

        Requisition saved = requisitionRepository.save(requisition);

        if (saved.getSupplier() != null) {
            int reqNum = (saved.getReqNumber() != null) ? saved.getReqNumber() : 1;
            String poCode = String.format("PO%02d", reqNum);
            String buyerName = getUserDisplayName(buyer);
            String msg = "Buyer " + buyerName + " approved your modification on Purchase Order " + poCode + ". Proceed Invoice. Buyer Message: " + trimmed;
            notificationService.createNotification(
                    saved.getSupplier(),
                    buyer,
                    "REQUISITIONS",
                    "PO Modification Approved - Proceed Invoice (" + poCode + ")",
                    msg,
                    trimmed,
                    saved.getId(),
                    "REQUISITION"
            );
        }

        return mapToResponse(saved);
    }

    public RequisitionResponse declineSupplierModification(UUID id, String buyerComment, String buyerEmail) {
        if (buyerComment == null || buyerComment.trim().isEmpty()) {
            throw new IllegalArgumentException("Buyer message is mandatory to decline the modification");
        }

        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Requisition requisition = requisitionRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found"));

        if (!requisition.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You can only decline modifications on your own Purchase Orders");
        }

        if (!Boolean.TRUE.equals(requisition.getSupplierModified())) {
            throw new IllegalArgumentException("This Purchase Order was not modified by the Supplier");
        }

        String trimmed = buyerComment.trim();
        if (trimmed.length() > 500) {
            trimmed = trimmed.substring(0, 500);
        }

        requisition.setBuyerModificationStatus("DECLINED");
        requisition.setBuyerComment(trimmed);

        Requisition saved = requisitionRepository.save(requisition);

        if (saved.getSupplier() != null) {
            int reqNum = (saved.getReqNumber() != null) ? saved.getReqNumber() : 1;
            String poCode = String.format("PO%02d", reqNum);
            String buyerName = getUserDisplayName(buyer);
            String msg = "Buyer " + buyerName + " declined your modification on Purchase Order " + poCode + ". Buyer Message: " + trimmed;
            notificationService.createNotification(
                    saved.getSupplier(),
                    buyer,
                    "REQUISITIONS",
                    "PO Modification Declined (" + poCode + ")",
                    msg,
                    trimmed,
                    saved.getId(),
                    "REQUISITION"
            );
        }

        return mapToResponse(saved);
    }

    public RequisitionResponse declineRequisition(UUID id, String supplierComment, String supplierEmail) {
        if (supplierComment == null || supplierComment.trim().isEmpty()) {
            throw new IllegalArgumentException("Comments are required when declining a purchase request");
        }

        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Requisition requisition = requisitionRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Requisition not found"));

        if ("Cancelled".equalsIgnoreCase(requisition.getStatus())) {
            throw new IllegalArgumentException("Cannot decline a cancelled Purchase Order");
        }

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
        notificationService.sendOrUpdateBuyerPurchaseOrderNotification(saved, supplier, "Declined");

        return mapToResponse(saved);
    }

    public List<SupplierSummaryResponse> getSuppliers(String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<BusinessPartnerRequest> acceptedRequests = businessPartnerRequestRepository.findAcceptedPartnerships(buyer.getId());

        return acceptedRequests.stream()
                .map(r -> r.getSender().getId().equals(buyer.getId()) ? r.getReceiver() : r.getSender())
                .filter(u -> u != null && u.getAccountType() != null &&
                        (u.getAccountType().equalsIgnoreCase("Supplier") || u.getAccountType().equalsIgnoreCase("Buyer and Supplier")))
                .collect(Collectors.toMap(u -> u.getId(), u -> u, (u1, u2) -> u1))
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
        return catalogueRepository.findByUserIdOrderByCreatedAtDesc(Objects.requireNonNull(supplierId)).stream()
                .map(c -> new CatalogueResponse(
                        c.getId(),
                        c.getProductName(),
                        c.getProductType(),
                        c.getPrice(),
                        c.getCurrencyType() != null ? c.getCurrencyType() : "USD",
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
        if (request.getSupplierId() != null && request.getItems() != null) {
            for (RequisitionItemDto item : request.getItems()) {
                if (item.getSupplierId() != null && !item.getSupplierId().equals(request.getSupplierId())) {
                    throw new IllegalArgumentException("The Supplier which was selected in Requisition form should match with item Supplier.");
                }
            }
        }
    }

    private RequisitionResponse mapToResponse(Requisition r) {
        List<RequisitionItemDto> itemDtos = r.getItems().stream()
                .map(item -> {
                    RequisitionItemDto dto = new RequisitionItemDto(
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
                    );
                    dto.setOriginalQuantity(item.getOriginalQuantity() != null ? item.getOriginalQuantity() : item.getQuantity());
                    dto.setOriginalPrice(item.getOriginalPrice() != null ? item.getOriginalPrice() : item.getPrice());
                    return dto;
                })
                .collect(Collectors.toList());

        int reqNum = (r.getReqNumber() != null) ? r.getReqNumber().intValue() : 1;
        String status = r.getStatus();
        String prefix = ("PO".equalsIgnoreCase(status) || "Accepted".equalsIgnoreCase(status) || "PO Accepted".equalsIgnoreCase(status) || "Declined".equalsIgnoreCase(status) || "Cancelled".equalsIgnoreCase(status)) ? "PO" : "PR";
        String requisitionId = String.format("%s%02d", prefix, reqNum);

        RequisitionResponse response = new RequisitionResponse(
                r.getId(),
                requisitionId,
                reqNum,
                r.getTitle(),
                r.getShipTo(),
                r.getDeliverTo(),
                r.getNeedByDate(),
                r.getComments(),
                r.getSupplierComment(),
                r.getCancellationReason(),
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
        boolean isMod = Boolean.TRUE.equals(r.getSupplierModified());
        response.setSupplierModified(isMod);
        String modStatus = r.getBuyerModificationStatus();
        if (modStatus == null && !isMod && ("Accepted".equalsIgnoreCase(status) || "PO Accepted".equalsIgnoreCase(status))) {
            modStatus = "PROCEED_INVOICE";
        }
        response.setBuyerModificationStatus(modStatus);
        response.setBuyerComment(r.getBuyerComment());
        response.setHasPurchaseReceipt(r.getId() != null && purchaseReceiptRepository.existsByPurchaseOrderId(r.getId()));
        return response;
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
