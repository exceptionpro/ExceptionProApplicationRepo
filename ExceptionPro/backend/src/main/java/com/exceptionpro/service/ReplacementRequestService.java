package com.exceptionpro.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.exceptionpro.dto.PurchaseReceiptItemDto;
import com.exceptionpro.dto.ReplacementRequestPayload;
import com.exceptionpro.dto.ReplacementRequestResponse;
import com.exceptionpro.dto.SupplierReplacementApprovalRequest;
import com.exceptionpro.entity.Invoice;
import com.exceptionpro.entity.ReplacementRequest;
import com.exceptionpro.entity.Requisition;
import com.exceptionpro.entity.RequisitionItem;
import com.exceptionpro.entity.User;
import com.exceptionpro.repository.InvoiceRepository;
import com.exceptionpro.repository.ReplacementRequestRepository;
import com.exceptionpro.repository.RequisitionRepository;
import com.exceptionpro.repository.UserRepository;

@Service
@Transactional
public class ReplacementRequestService {

    private final ReplacementRequestRepository replacementRequestRepository;
    private final RequisitionRepository requisitionRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final PurchaseReceiptService purchaseReceiptService;

    public ReplacementRequestService(ReplacementRequestRepository replacementRequestRepository,
                                     RequisitionRepository requisitionRepository,
                                     InvoiceRepository invoiceRepository,
                                     UserRepository userRepository,
                                     PurchaseReceiptService purchaseReceiptService) {
        this.replacementRequestRepository = replacementRequestRepository;
        this.requisitionRepository = requisitionRepository;
        this.invoiceRepository = invoiceRepository;
        this.userRepository = userRepository;
        this.purchaseReceiptService = purchaseReceiptService;
    }

    public ReplacementRequestResponse createReplacementRequest(ReplacementRequestPayload payload, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        if (payload.getRequestNumber() == null || payload.getRequestNumber().trim().isEmpty()) {
            throw new IllegalArgumentException("Request Number is required");
        }

        if (payload.getRequestDate() == null) {
            throw new IllegalArgumentException("Request Date is required");
        }

        if (payload.getPurchaseOrderId() == null) {
            throw new IllegalArgumentException("Purchase Order is required");
        }

        Requisition po = requisitionRepository.findById(Objects.requireNonNull(payload.getPurchaseOrderId()))
                .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found"));

        List<ReplacementRequest> existingForPo = replacementRequestRepository.findByPurchaseOrderId(po.getId());
        if (existingForPo != null && !existingForPo.isEmpty()) {
            throw new IllegalArgumentException("A Replacement Request has already been created for this Purchase Order. Duplicate records are not allowed.");
        }

        if (payload.getReceivedFromSupplierId() == null) {
            throw new IllegalArgumentException("Received From (Supplier) is required");
        }

        User supplier = userRepository.findById(Objects.requireNonNull(payload.getReceivedFromSupplierId()))
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));

        Invoice invoice = null;
        if (payload.getInvoiceId() != null) {
            invoice = invoiceRepository.findById(Objects.requireNonNull(payload.getInvoiceId()))
                    .orElse(null);
        }

        if (payload.getDamagedQuantity() == null || payload.getDamagedQuantity() < 0) {
            throw new IllegalArgumentException("Damaged Quantity is required");
        }

        if (payload.getReplacementQuantity() == null || payload.getReplacementQuantity() < 0) {
            throw new IllegalArgumentException("Replacement Quantity is required");
        }

        if (payload.getReceivedStatus() == null || payload.getReceivedStatus().trim().isEmpty()) {
            throw new IllegalArgumentException("Received status is required");
        }

        String rawReqNo = payload.getRequestNumber().trim();
        String digits = rawReqNo.replaceAll("\\D", "");
        String formattedReqNo = digits.isEmpty() ? rawReqNo : "RR - " + digits;

        String invoiceNo = payload.getInvoiceNumber();
        if ((invoiceNo == null || invoiceNo.isBlank()) && invoice != null) {
            invoiceNo = invoice.getInvoiceNumber();
        }

        BigDecimal invoiceAmt = payload.getInvoiceAmount();
        if (invoiceAmt == null && invoice != null) {
            invoiceAmt = invoice.getTotalAmount();
        }

        String currency = payload.getCurrencyType();
        if ((currency == null || currency.isBlank()) && invoice != null) {
            currency = invoice.getCurrencyType();
        }
        if ((currency == null || currency.isBlank()) && po.getItems() != null && !po.getItems().isEmpty()) {
            currency = po.getItems().stream()
                    .map(item -> item != null ? item.getCurrencyType() : null)
                    .filter(c -> c != null && !c.isBlank())
                    .findFirst()
                    .orElse("USD");
        }
        if (currency == null || currency.isBlank()) {
            currency = "USD";
        }

        ReplacementRequest entity = new ReplacementRequest();
        entity.setId(UUID.randomUUID());
        entity.setBuyer(buyer);
        entity.setRequestNumber(formattedReqNo);
        entity.setRequestDate(payload.getRequestDate());
        entity.setPurchaseOrder(po);
        entity.setReceivedFromSupplier(supplier);
        entity.setInvoice(invoice);
        entity.setInvoiceNumber(invoiceNo != null ? invoiceNo.trim() : null);
        entity.setInvoiceAmount(invoiceAmt);
        entity.setCurrencyType(currency.trim());
        entity.setDamagedQuantity(payload.getDamagedQuantity());
        entity.setReplacementQuantity(payload.getReplacementQuantity());
        entity.setReceivedStatus(payload.getReceivedStatus().trim());
        entity.setSupplierApprovalStatus("Pending Approval");
        entity.setCreatedAt(LocalDateTime.now());

        ReplacementRequest saved = replacementRequestRepository.save(entity);
        return mapToResponse(saved);
    }

    public ReplacementRequestResponse updateReplacementRequest(UUID id, ReplacementRequestPayload payload, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        ReplacementRequest entity = replacementRequestRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Replacement Request not found"));

        if (!entity.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You are not authorized to update this Replacement Request");
        }

        if (payload.getRequestNumber() != null && !payload.getRequestNumber().trim().isEmpty()) {
            String rawReqNo = payload.getRequestNumber().trim();
            String digits = rawReqNo.replaceAll("\\D", "");
            entity.setRequestNumber(digits.isEmpty() ? rawReqNo : "RR - " + digits);
        }

        if (payload.getRequestDate() != null) {
            entity.setRequestDate(payload.getRequestDate());
        }

        if (payload.getPurchaseOrderId() != null) {
            Requisition po = requisitionRepository.findById(Objects.requireNonNull(payload.getPurchaseOrderId()))
                    .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found"));
            entity.setPurchaseOrder(po);
        }

        if (payload.getReceivedFromSupplierId() != null) {
            User supplier = userRepository.findById(Objects.requireNonNull(payload.getReceivedFromSupplierId()))
                    .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));
            entity.setReceivedFromSupplier(supplier);
        }

        if (payload.getInvoiceId() != null) {
            Invoice invoice = invoiceRepository.findById(Objects.requireNonNull(payload.getInvoiceId()))
                    .orElse(null);
            entity.setInvoice(invoice);
        }

        if (payload.getInvoiceNumber() != null) {
            entity.setInvoiceNumber(payload.getInvoiceNumber().trim());
        }

        if (payload.getInvoiceAmount() != null) {
            entity.setInvoiceAmount(payload.getInvoiceAmount());
        }

        if (payload.getCurrencyType() != null && !payload.getCurrencyType().isBlank()) {
            entity.setCurrencyType(payload.getCurrencyType().trim());
        }

        if (payload.getDamagedQuantity() != null) {
            entity.setDamagedQuantity(payload.getDamagedQuantity());
        }

        if (payload.getReplacementQuantity() != null) {
            entity.setReplacementQuantity(payload.getReplacementQuantity());
        }

        if (payload.getReceivedStatus() != null && !payload.getReceivedStatus().isBlank()) {
            entity.setReceivedStatus(payload.getReceivedStatus().trim());
        }

        // Re-enable Supplier approval buttons when Buyer modifies the Replacement Request
        entity.setSupplierApprovalStatus("Pending Approval");
        entity.setSupplierApprovedAt(null);

        entity.setUpdatedAt(LocalDateTime.now());
        ReplacementRequest updated = replacementRequestRepository.save(entity);
        return mapToResponse(updated);
    }

    public ReplacementRequestResponse approveReplacementBySupplier(UUID id, SupplierReplacementApprovalRequest request, String supplierEmail) {
        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));

        ReplacementRequest entity = replacementRequestRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Replacement Request not found"));

        boolean isDesignatedSupplier = entity.getReceivedFromSupplier() != null
                && entity.getReceivedFromSupplier().getId().equals(supplier.getId());
        boolean isAdmin = "ROLE_ADMIN".equals(supplier.getRole());

        if (!isDesignatedSupplier && !isAdmin) {
            throw new IllegalArgumentException("Only the designated supplier or an admin can approve this Replacement Request");
        }

        if (request.getStatus() == null || request.getStatus().trim().isEmpty()) {
            throw new IllegalArgumentException("Supplier approval action status is required");
        }

        if (request.getConfirmationMessage() == null || request.getConfirmationMessage().trim().isEmpty()) {
            throw new IllegalArgumentException("Supplier confirmation message is mandatory (around 200 characters in length).");
        }

        String status = request.getStatus().trim();
        String message = request.getConfirmationMessage().trim();

        Integer approvedQty = request.getApprovedReplacementQuantity();
        int requestedQty = entity.getReplacementQuantity() != null ? entity.getReplacementQuantity() : 0;

        if ("Accept Request".equalsIgnoreCase(status)) {
            status = "Accept Request";
            approvedQty = requestedQty;
        } else if ("Partially Accept".equalsIgnoreCase(status)) {
            status = "Partially Accept";
            if (approvedQty == null) {
                approvedQty = requestedQty > 1 ? requestedQty - 1 : requestedQty;
            }
        } else if ("Reject Request".equalsIgnoreCase(status) || "Decline Request".equalsIgnoreCase(status)) {
            status = "Reject Request";
            approvedQty = 0;
        }

        entity.setSupplierApprovalStatus(status);
        entity.setSupplierConfirmationMessage(message);
        entity.setSupplierApprovedReplacementQuantity(approvedQty);
        entity.setSupplierApprovedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());

        ReplacementRequest saved = replacementRequestRepository.save(entity);
        return mapToResponse(saved);
    }

    public void deleteReplacementRequest(UUID id, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        ReplacementRequest entity = replacementRequestRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Replacement Request not found"));

        if (!entity.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You are not authorized to delete this Replacement Request");
        }

        replacementRequestRepository.delete(entity);
    }

    public List<ReplacementRequestResponse> getBuyerReplacementRequests(String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        return replacementRequestRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ReplacementRequestResponse> getSupplierReplacementRequests(String supplierEmail) {
        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));

        return replacementRequestRepository.findByReceivedFromSupplierIdOrderByCreatedAtDesc(supplier.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ReplacementRequestResponse> getUserReplacementRequests(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String accountType = user.getAccountType() != null ? user.getAccountType().toLowerCase().trim() : "";
        boolean isSupplier = accountType.contains("supplier");
        boolean isBuyer = accountType.contains("buyer");

        List<ReplacementRequest> list;
        if (isBuyer && isSupplier) {
            list = replacementRequestRepository.findByBuyerIdOrReceivedFromSupplierIdOrderByCreatedAtDesc(user.getId(), user.getId());
        } else if (isSupplier) {
            list = replacementRequestRepository.findByReceivedFromSupplierIdOrderByCreatedAtDesc(user.getId());
        } else {
            list = replacementRequestRepository.findByBuyerIdOrderByCreatedAtDesc(user.getId());
        }

        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public ReplacementRequestResponse getReplacementRequestById(UUID id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        ReplacementRequest entity = replacementRequestRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Replacement Request not found"));

        boolean isBuyer = entity.getBuyer() != null && entity.getBuyer().getId().equals(user.getId());
        boolean isSupplier = entity.getReceivedFromSupplier() != null && entity.getReceivedFromSupplier().getId().equals(user.getId());
        boolean isAdmin = "ROLE_ADMIN".equals(user.getRole());

        if (!isBuyer && !isSupplier && !isAdmin) {
            throw new IllegalArgumentException("You are not authorized to view this Replacement Request");
        }

        return mapToResponse(entity);
    }

    public List<Map<String, Object>> getBuyerPurchaseOrders(String buyerEmail) {
        return purchaseReceiptService.getBuyerPurchaseOrders(buyerEmail);
    }

    public List<Map<String, Object>> getConnectedSuppliers(String buyerEmail) {
        return purchaseReceiptService.getConnectedSuppliers(buyerEmail);
    }

    public List<Map<String, Object>> getInvoicesForPurchaseOrder(UUID purchaseOrderId, String buyerEmail) {
        return purchaseReceiptService.getInvoicesForPurchaseOrder(purchaseOrderId, buyerEmail);
    }

    private ReplacementRequestResponse mapToResponse(ReplacementRequest r) {
        ReplacementRequestResponse resp = new ReplacementRequestResponse();
        resp.setId(r.getId());
        resp.setRequestNumber(r.getRequestNumber());
        resp.setRequestDate(r.getRequestDate());

        if (r.getBuyer() != null) {
            resp.setBuyerId(r.getBuyer().getId());
            resp.setBuyerName(getUserDisplayName(r.getBuyer()));
            resp.setBuyerEmail(r.getBuyer().getEmail());
        }

        if (r.getPurchaseOrder() != null) {
            resp.setPurchaseOrderId(r.getPurchaseOrder().getId());
            int num = (r.getPurchaseOrder().getReqNumber() != null) ? r.getPurchaseOrder().getReqNumber().intValue() : 1;
            resp.setPurchaseOrderCode(String.format("PO%02d", num));
            resp.setPurchaseOrderTitle(r.getPurchaseOrder().getTitle());
        }

        if (r.getReceivedFromSupplier() != null) {
            resp.setReceivedFromSupplierId(r.getReceivedFromSupplier().getId());
            resp.setReceivedFromSupplierName(getUserDisplayName(r.getReceivedFromSupplier()));
            resp.setReceivedFromSupplierEmail(r.getReceivedFromSupplier().getEmail());
        }

        if (r.getInvoice() != null) {
            resp.setInvoiceId(r.getInvoice().getId());
            resp.setInvoiceNumber(r.getInvoiceNumber() != null ? r.getInvoiceNumber() : r.getInvoice().getInvoiceNumber());
            resp.setInvoiceAmount(r.getInvoiceAmount() != null ? r.getInvoiceAmount() : r.getInvoice().getTotalAmount());
            resp.setCurrencyType(r.getCurrencyType() != null ? r.getCurrencyType() : r.getInvoice().getCurrencyType());
        } else {
            resp.setInvoiceNumber(r.getInvoiceNumber());
            resp.setInvoiceAmount(r.getInvoiceAmount());
            resp.setCurrencyType(r.getCurrencyType());
        }

        if (resp.getCurrencyType() == null || resp.getCurrencyType().isBlank()) {
            resp.setCurrencyType("USD");
        }

        resp.setDamagedQuantity(r.getDamagedQuantity());
        resp.setReplacementQuantity(r.getReplacementQuantity());
        resp.setReceivedStatus(r.getReceivedStatus());
        resp.setSupplierApprovalStatus(r.getSupplierApprovalStatus() != null ? r.getSupplierApprovalStatus() : "Pending Approval");
        resp.setSupplierConfirmationMessage(r.getSupplierConfirmationMessage());
        resp.setSupplierApprovedReplacementQuantity(r.getSupplierApprovedReplacementQuantity());
        resp.setSupplierApprovedAt(r.getSupplierApprovedAt());

        List<PurchaseReceiptItemDto> itemDtos = new ArrayList<>();
        if (r.getPurchaseOrder() != null && r.getPurchaseOrder().getItems() != null) {
            for (RequisitionItem item : r.getPurchaseOrder().getItems()) {
                itemDtos.add(new PurchaseReceiptItemDto(
                        item.getId(),
                        item.getProductName(),
                        item.getFullDescription(),
                        item.getQuantity(),
                        item.getUnitMeasure(),
                        item.getPrice(),
                        item.getCurrencyType()
                ));
            }
        }
        resp.setItems(itemDtos);

        resp.setCreatedAt(r.getCreatedAt());
        resp.setUpdatedAt(r.getUpdatedAt());
        return resp;
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
            // ignore lazy load error
        }
        return u.getEmail() != null ? u.getEmail() : "User";
    }
}
