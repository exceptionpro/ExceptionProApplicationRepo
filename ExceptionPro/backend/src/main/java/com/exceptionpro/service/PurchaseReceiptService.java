package com.exceptionpro.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.exceptionpro.dto.PurchaseReceiptItemDto;
import com.exceptionpro.dto.PurchaseReceiptRequest;
import com.exceptionpro.dto.PurchaseReceiptResponse;
import com.exceptionpro.dto.SupplierReceiptApprovalRequest;
import com.exceptionpro.entity.BusinessPartnerRequest;
import com.exceptionpro.entity.Invoice;
import com.exceptionpro.entity.PurchaseReceipt;
import com.exceptionpro.entity.Requisition;
import com.exceptionpro.entity.RequisitionItem;
import com.exceptionpro.entity.User;
import com.exceptionpro.repository.BusinessPartnerRequestRepository;
import com.exceptionpro.repository.InvoiceRepository;
import com.exceptionpro.repository.PurchaseReceiptRepository;
import com.exceptionpro.repository.RequisitionRepository;
import com.exceptionpro.repository.UserRepository;

@Service
@Transactional
public class PurchaseReceiptService {

    private final PurchaseReceiptRepository purchaseReceiptRepository;
    private final RequisitionRepository requisitionRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final BusinessPartnerRequestRepository partnerRequestRepository;

    public PurchaseReceiptService(PurchaseReceiptRepository purchaseReceiptRepository,
                                  RequisitionRepository requisitionRepository,
                                  InvoiceRepository invoiceRepository,
                                  UserRepository userRepository,
                                  BusinessPartnerRequestRepository partnerRequestRepository) {
        this.purchaseReceiptRepository = purchaseReceiptRepository;
        this.requisitionRepository = requisitionRepository;
        this.invoiceRepository = invoiceRepository;
        this.userRepository = userRepository;
        this.partnerRequestRepository = partnerRequestRepository;
    }

    public PurchaseReceiptResponse createReceipt(PurchaseReceiptRequest request, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        if (request.getReceiptNo() == null || request.getReceiptNo().trim().isEmpty()) {
            throw new IllegalArgumentException("Receipt No is required");
        }

        if (request.getReceiptDate() == null) {
            throw new IllegalArgumentException("Receipt Date is required");
        }

        Integer receivedQty = request.getReceivedQuantity() != null ? request.getReceivedQuantity() : request.getQuantity();
        if (receivedQty == null || receivedQty <= 0) {
            throw new IllegalArgumentException("Received quantity must be greater than 0");
        }

        if (request.getReceivedStatus() == null || request.getReceivedStatus().trim().isEmpty()) {
            throw new IllegalArgumentException("Received status is required");
        }

        if (request.getReceivedFromSupplierId() == null) {
            throw new IllegalArgumentException("Received From (Supplier) is required");
        }

        User supplier = userRepository.findById(Objects.requireNonNull(request.getReceivedFromSupplierId()))
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));

        Requisition po = null;
        if (request.getPurchaseOrderId() != null) {
            po = requisitionRepository.findById(Objects.requireNonNull(request.getPurchaseOrderId()))
                    .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found"));
        }

        Invoice invoice = null;
        if (request.getInvoiceId() != null) {
            invoice = invoiceRepository.findById(Objects.requireNonNull(request.getInvoiceId()))
                    .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        }

        Integer poQty = request.getPoQuantity();
        if (poQty == null && po != null) {
            try {
                if (po.getItems() != null) {
                    poQty = po.getItems().stream().mapToInt(i -> i.getQuantity() != null ? i.getQuantity() : 0).sum();
                }
            } catch (Exception ignored) {}
        }
        if (poQty == null) {
            poQty = receivedQty;
        }

        Integer pendingQty = request.getPendingQuantity();
        if (pendingQty == null) {
            pendingQty = Math.max(0, poQty - receivedQty);
        }

        PurchaseReceipt receipt = new PurchaseReceipt();
        receipt.setId(UUID.randomUUID());
        receipt.setBuyer(buyer);
        receipt.setReceiptNo(request.getReceiptNo().trim());
        receipt.setReceiptDate(request.getReceiptDate());
        receipt.setPurchaseOrder(po);
        receipt.setReceivedFromSupplier(supplier);
        receipt.setInvoice(invoice);
        receipt.setQuantity(receivedQty);
        receipt.setReceivedQuantity(receivedQty);
        receipt.setPoQuantity(poQty);
        receipt.setPendingQuantity(pendingQty);
        receipt.setReceivedStatus(request.getReceivedStatus().trim());
        receipt.setCreatedAt(LocalDateTime.now());

        PurchaseReceipt saved = purchaseReceiptRepository.save(receipt);
        return mapToResponse(saved);
    }

    public PurchaseReceiptResponse updateReceipt(UUID id, PurchaseReceiptRequest request, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        PurchaseReceipt receipt = purchaseReceiptRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Purchase Receipt not found"));

        if (!receipt.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You are not authorized to update this Purchase Receipt");
        }

        if (request.getReceiptNo() != null && !request.getReceiptNo().trim().isEmpty()) {
            receipt.setReceiptNo(request.getReceiptNo().trim());
        }

        if (request.getReceiptDate() != null) {
            receipt.setReceiptDate(request.getReceiptDate());
        }

        if (request.getReceivedQuantity() != null && request.getReceivedQuantity() > 0) {
            receipt.setReceivedQuantity(request.getReceivedQuantity());
            receipt.setQuantity(request.getReceivedQuantity());
        } else if (request.getQuantity() != null && request.getQuantity() > 0) {
            receipt.setQuantity(request.getQuantity());
            receipt.setReceivedQuantity(request.getQuantity());
        }

        if (request.getPoQuantity() != null) {
            receipt.setPoQuantity(request.getPoQuantity());
        }

        if (request.getPendingQuantity() != null) {
            receipt.setPendingQuantity(request.getPendingQuantity());
        } else if (receipt.getPoQuantity() != null && receipt.getReceivedQuantity() != null) {
            receipt.setPendingQuantity(Math.max(0, receipt.getPoQuantity() - receipt.getReceivedQuantity()));
        }

        if (request.getReceivedStatus() != null && !request.getReceivedStatus().trim().isEmpty()) {
            receipt.setReceivedStatus(request.getReceivedStatus().trim());
        }

        if (request.getReceivedFromSupplierId() != null) {
            User supplier = userRepository.findById(Objects.requireNonNull(request.getReceivedFromSupplierId()))
                    .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));
            receipt.setReceivedFromSupplier(supplier);
        }

        if (request.getPurchaseOrderId() != null) {
            Requisition po = requisitionRepository.findById(Objects.requireNonNull(request.getPurchaseOrderId()))
                    .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found"));
            receipt.setPurchaseOrder(po);
        } else {
            receipt.setPurchaseOrder(null);
        }

        if (request.getInvoiceId() != null) {
            Invoice invoice = invoiceRepository.findById(Objects.requireNonNull(request.getInvoiceId()))
                    .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
            receipt.setInvoice(invoice);
        } else {
            receipt.setInvoice(null);
        }

        receipt.setUpdatedAt(LocalDateTime.now());
        PurchaseReceipt updated = purchaseReceiptRepository.save(receipt);
        return mapToResponse(updated);
    }

    public void deleteReceipt(UUID id, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        PurchaseReceipt receipt = purchaseReceiptRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Purchase Receipt not found"));

        if (!receipt.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You are not authorized to delete this Purchase Receipt");
        }

        purchaseReceiptRepository.delete(Objects.requireNonNull(receipt));
    }

    public List<PurchaseReceiptResponse> getBuyerReceipts(String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        return purchaseReceiptRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<PurchaseReceiptResponse> getSupplierReceipts(String supplierEmail) {
        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));

        return purchaseReceiptRepository.findByReceivedFromSupplierIdOrderByCreatedAtDesc(supplier.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<PurchaseReceiptResponse> getUserReceipts(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String accountType = user.getAccountType() != null ? user.getAccountType().toLowerCase().trim() : "";
        boolean isSupplier = accountType.contains("supplier");
        boolean isBuyer = accountType.contains("buyer");

        List<PurchaseReceipt> receipts;
        if (isBuyer && isSupplier) {
            receipts = purchaseReceiptRepository.findByBuyerIdOrReceivedFromSupplierIdOrderByCreatedAtDesc(user.getId(), user.getId());
        } else if (isSupplier) {
            receipts = purchaseReceiptRepository.findByReceivedFromSupplierIdOrderByCreatedAtDesc(user.getId());
        } else {
            receipts = purchaseReceiptRepository.findByBuyerIdOrderByCreatedAtDesc(user.getId());
        }

        return receipts.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public PurchaseReceiptResponse getReceiptById(UUID id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        PurchaseReceipt receipt = purchaseReceiptRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Purchase Receipt not found"));

        boolean isBuyer = receipt.getBuyer() != null && receipt.getBuyer().getId().equals(user.getId());
        boolean isSupplier = receipt.getReceivedFromSupplier() != null && receipt.getReceivedFromSupplier().getId().equals(user.getId());
        boolean isAdmin = "ROLE_ADMIN".equals(user.getRole());

        if (!isBuyer && !isSupplier && !isAdmin) {
            throw new IllegalArgumentException("You are not authorized to view this Purchase Receipt");
        }

        return mapToResponse(receipt);
    }

    public PurchaseReceiptResponse approveReceiptBySupplier(UUID id, SupplierReceiptApprovalRequest request, String supplierEmail) {
        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));

        PurchaseReceipt receipt = purchaseReceiptRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Purchase Receipt not found"));

        boolean isSupplier = receipt.getReceivedFromSupplier() != null && receipt.getReceivedFromSupplier().getId().equals(supplier.getId());
        boolean isAdmin = "ROLE_ADMIN".equals(supplier.getRole());

        if (!isSupplier && !isAdmin) {
            throw new IllegalArgumentException("Only the designated supplier or an admin can approve this Purchase Receipt");
        }

        String status = (request.getStatus() != null && !request.getStatus().trim().isEmpty())
                ? request.getStatus().trim()
                : "Approved";
        receipt.setSupplierApprovalStatus(status);

        Integer pendingQty = request.getPendingQuantity() != null
                ? request.getPendingQuantity()
                : (receipt.getPendingQuantity() != null ? receipt.getPendingQuantity() : 0);
        receipt.setSupplierApprovedPendingQuantity(pendingQty);

        String message = request.getConfirmationMessage();
        if (message == null || message.trim().isEmpty() || message.toLowerCase().contains("still pending")) {
            message = (pendingQty == 0) ? "All Items Delivered" : "Items Pending Delivery from Supplier";
        } else {
            message = message.trim();
        }
        receipt.setSupplierConfirmationMessage(message);

        String comments = (request.getComments() != null && !request.getComments().trim().isEmpty())
                ? request.getComments().trim()
                : null;
        receipt.setSupplierComments(comments);

        receipt.setSupplierApprovedAt(LocalDateTime.now());
        receipt.setUpdatedAt(LocalDateTime.now());

        PurchaseReceipt saved = purchaseReceiptRepository.save(receipt);
        return mapToResponse(saved);
    }

    public List<Map<String, Object>> getBuyerPurchaseOrders(String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        // Fetch POs created by buyer: Requisitions with status in PO, Accepted, Declined or reqNumber != null
        List<Requisition> reqs = requisitionRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        List<Invoice> buyerInvoices = invoiceRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        List<Map<String, Object>> poList = new ArrayList<>();

        for (Requisition r : reqs) {
            int num = (r.getReqNumber() != null) ? r.getReqNumber().intValue() : 1;
            String code = String.format("PO%02d", num);

            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("code", code);
            map.put("title", r.getTitle());
            map.put("status", r.getStatus());
            map.put("needByDate", r.getNeedByDate());
            if (r.getSupplier() != null) {
                map.put("supplierId", r.getSupplier().getId());
                map.put("supplierName", getUserDisplayName(r.getSupplier()));
                map.put("supplierEmail", r.getSupplier().getEmail());
            }

            int poQty = 0;
            String poCurrencyType = "USD";
            BigDecimal poTotalAmount = BigDecimal.ZERO;
            try {
                if (r.getItems() != null && !r.getItems().isEmpty()) {
                    poQty = r.getItems().stream()
                            .mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 0)
                            .sum();
                    for (RequisitionItem item : r.getItems()) {
                        if (item.getCurrencyType() != null && !item.getCurrencyType().trim().isEmpty()) {
                            poCurrencyType = item.getCurrencyType().trim();
                        }
                        if (item.getPrice() != null && item.getQuantity() != null) {
                            poTotalAmount = poTotalAmount.add(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity().longValue())));
                        }
                    }
                }
            } catch (Exception ignored) {}
            map.put("poQuantity", poQty);
            map.put("currencyType", poCurrencyType);
            map.put("totalAmount", poTotalAmount);

            Invoice matchedInv = buyerInvoices.stream()
                    .filter(inv -> inv.getRequisition() != null && inv.getRequisition().getId().equals(r.getId()))
                    .findFirst()
                    .orElse(null);
            if (matchedInv != null) {
                map.put("invoiceId", matchedInv.getId());
                map.put("invoiceNumber", matchedInv.getInvoiceNumber());
                map.put("invoiceAmount", matchedInv.getTotalAmount());
                if (matchedInv.getCurrencyType() != null && !matchedInv.getCurrencyType().isBlank()) {
                    map.put("invoiceCurrencyType", matchedInv.getCurrencyType());
                }
            }

            poList.add(map);
        }

        return poList;
    }

    public List<Map<String, Object>> getConnectedSuppliers(String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        List<BusinessPartnerRequest> accepted = partnerRequestRepository.findAcceptedPartnerships(buyer.getId());
        List<Map<String, Object>> suppliers = new ArrayList<>();
        Set<UUID> addedIds = new HashSet<>();

        for (BusinessPartnerRequest r : accepted) {
            User partner = r.getSender().getId().equals(buyer.getId()) ? r.getReceiver() : r.getSender();
            if (partner != null && !addedIds.contains(partner.getId())) {
                addedIds.add(partner.getId());
                Map<String, Object> map = new HashMap<>();
                map.put("id", partner.getId());
                map.put("name", getUserDisplayName(partner));
                map.put("email", partner.getEmail());
                map.put("accountType", partner.getAccountType());
                suppliers.add(map);
            }
        }

        // Also include any suppliers linked via existing requisitions
        List<Requisition> buyerReqs = requisitionRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        for (Requisition req : buyerReqs) {
            if (req.getSupplier() != null && !addedIds.contains(req.getSupplier().getId())) {
                addedIds.add(req.getSupplier().getId());
                Map<String, Object> map = new HashMap<>();
                map.put("id", req.getSupplier().getId());
                map.put("name", getUserDisplayName(req.getSupplier()));
                map.put("email", req.getSupplier().getEmail());
                map.put("accountType", req.getSupplier().getAccountType());
                suppliers.add(map);
            }
        }

        return suppliers;
    }

    public List<Map<String, Object>> getInvoicesForPurchaseOrder(UUID purchaseOrderId, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        List<Invoice> invoices = invoiceRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        List<Map<String, Object>> result = new ArrayList<>();

        for (Invoice inv : invoices) {
            if (purchaseOrderId != null) {
                if (inv.getRequisition() != null && inv.getRequisition().getId().equals(purchaseOrderId)) {
                    result.add(mapInvoiceToSummary(inv));
                }
            } else {
                result.add(mapInvoiceToSummary(inv));
            }
        }

        return result;
    }

    private Map<String, Object> mapInvoiceToSummary(Invoice inv) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", inv.getId());
        map.put("invoiceNumber", inv.getInvoiceNumber());
        map.put("totalAmount", inv.getTotalAmount());
        map.put("invoiceDate", inv.getInvoiceDate());
        map.put("status", inv.getStatus());
        map.put("currencyType", inv.getCurrencyType() != null && !inv.getCurrencyType().isBlank() ? inv.getCurrencyType() : "USD");
        if (inv.getRequisition() != null) {
            map.put("purchaseOrderId", inv.getRequisition().getId());
            int num = (inv.getRequisition().getReqNumber() != null) ? inv.getRequisition().getReqNumber().intValue() : 1;
            map.put("purchaseOrderCode", String.format("PO%02d", num));
            map.put("purchaseOrderTitle", inv.getRequisition().getTitle());
        }
        if (inv.getSupplier() != null) {
            map.put("supplierId", inv.getSupplier().getId());
            map.put("supplierName", getUserDisplayName(inv.getSupplier()));
        }
        return map;
    }

    private PurchaseReceiptResponse mapToResponse(PurchaseReceipt r) {
        UUID poId = r.getPurchaseOrder() != null ? r.getPurchaseOrder().getId() : null;
        String poCode = null;
        String poTitle = null;
        if (r.getPurchaseOrder() != null) {
            int num = (r.getPurchaseOrder().getReqNumber() != null) ? r.getPurchaseOrder().getReqNumber().intValue() : 1;
            poCode = String.format("PO%02d", num);
            poTitle = r.getPurchaseOrder().getTitle();
        }

        UUID supplierId = r.getReceivedFromSupplier() != null ? r.getReceivedFromSupplier().getId() : null;
        String supplierName = r.getReceivedFromSupplier() != null ? getUserDisplayName(r.getReceivedFromSupplier()) : "Unknown";
        String supplierEmail = r.getReceivedFromSupplier() != null ? r.getReceivedFromSupplier().getEmail() : "";

        UUID invoiceId = r.getInvoice() != null ? r.getInvoice().getId() : null;
        String invoiceNumber = r.getInvoice() != null ? r.getInvoice().getInvoiceNumber() : null;

        BigDecimal invoiceAmount = null;
        String currencyType = null;
        if (r.getInvoice() != null) {
            invoiceAmount = r.getInvoice().getTotalAmount();
            currencyType = r.getInvoice().getCurrencyType();
        }
        if ((currencyType == null || currencyType.isBlank()) && r.getPurchaseOrder() != null && r.getPurchaseOrder().getItems() != null && !r.getPurchaseOrder().getItems().isEmpty()) {
            currencyType = r.getPurchaseOrder().getItems().stream()
                    .map(item -> item != null ? item.getCurrencyType() : null)
                    .filter(c -> c != null && !c.isBlank())
                    .findFirst()
                    .orElse("USD");
        }
        if (currencyType == null || currencyType.isBlank()) {
            currencyType = "USD";
        }

        PurchaseReceiptResponse resp = new PurchaseReceiptResponse(
                r.getId(),
                r.getReceiptNo(),
                r.getReceiptDate(),
                poId,
                poCode,
                poTitle,
                supplierId,
                supplierName,
                supplierEmail,
                invoiceId,
                invoiceNumber,
                r.getQuantity(),
                r.getPoQuantity(),
                r.getReceivedQuantity(),
                r.getPendingQuantity(),
                r.getReceivedStatus(),
                r.getCreatedAt(),
                r.getUpdatedAt()
        );
        resp.setInvoiceAmount(invoiceAmount);
        resp.setCurrencyType(currencyType);

        if (r.getBuyer() != null) {
            resp.setBuyerId(r.getBuyer().getId());
            resp.setBuyerName(getUserDisplayName(r.getBuyer()));
            resp.setBuyerEmail(r.getBuyer().getEmail());
        }

        resp.setSupplierApprovalStatus(r.getSupplierApprovalStatus() != null ? r.getSupplierApprovalStatus() : "Pending Approval");
        
        int effectivePending = r.getSupplierApprovedPendingQuantity() != null
                ? r.getSupplierApprovedPendingQuantity()
                : (r.getPendingQuantity() != null ? r.getPendingQuantity() : 0);
        String confMsg = r.getSupplierConfirmationMessage();
        if (confMsg != null && confMsg.toLowerCase().contains("still pending")) {
            confMsg = (effectivePending == 0) ? "All Items Delivered" : "Items Pending Delivery from Supplier";
        }
        resp.setSupplierConfirmationMessage(confMsg);
        resp.setSupplierApprovedPendingQuantity(r.getSupplierApprovedPendingQuantity());
        resp.setSupplierApprovedAt(r.getSupplierApprovedAt());
        resp.setSupplierComments(r.getSupplierComments());

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
