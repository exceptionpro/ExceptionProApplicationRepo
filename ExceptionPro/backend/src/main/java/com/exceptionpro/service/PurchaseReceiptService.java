package com.exceptionpro.service;

import com.exceptionpro.dto.PurchaseReceiptRequest;
import com.exceptionpro.dto.PurchaseReceiptResponse;
import com.exceptionpro.entity.BusinessPartnerRequest;
import com.exceptionpro.entity.Invoice;
import com.exceptionpro.entity.PurchaseReceipt;
import com.exceptionpro.entity.Requisition;
import com.exceptionpro.entity.User;
import com.exceptionpro.repository.BusinessPartnerRequestRepository;
import com.exceptionpro.repository.InvoiceRepository;
import com.exceptionpro.repository.PurchaseReceiptRepository;
import com.exceptionpro.repository.RequisitionRepository;
import com.exceptionpro.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

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

        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }

        if (request.getReceivedStatus() == null || request.getReceivedStatus().trim().isEmpty()) {
            throw new IllegalArgumentException("Received status is required");
        }

        if (request.getReceivedFromSupplierId() == null) {
            throw new IllegalArgumentException("Received From (Supplier) is required");
        }

        User supplier = userRepository.findById(request.getReceivedFromSupplierId())
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));

        Requisition po = null;
        if (request.getPurchaseOrderId() != null) {
            po = requisitionRepository.findById(request.getPurchaseOrderId())
                    .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found"));
        }

        Invoice invoice = null;
        if (request.getInvoiceId() != null) {
            invoice = invoiceRepository.findById(request.getInvoiceId())
                    .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        }

        PurchaseReceipt receipt = new PurchaseReceipt();
        receipt.setId(UUID.randomUUID());
        receipt.setBuyer(buyer);
        receipt.setReceiptNo(request.getReceiptNo().trim());
        receipt.setReceiptDate(request.getReceiptDate());
        receipt.setPurchaseOrder(po);
        receipt.setReceivedFromSupplier(supplier);
        receipt.setInvoice(invoice);
        receipt.setQuantity(request.getQuantity());
        receipt.setReceivedStatus(request.getReceivedStatus().trim());
        receipt.setCreatedAt(LocalDateTime.now());

        PurchaseReceipt saved = purchaseReceiptRepository.save(receipt);
        return mapToResponse(saved);
    }

    public PurchaseReceiptResponse updateReceipt(UUID id, PurchaseReceiptRequest request, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        PurchaseReceipt receipt = purchaseReceiptRepository.findById(id)
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

        if (request.getQuantity() != null && request.getQuantity() > 0) {
            receipt.setQuantity(request.getQuantity());
        }

        if (request.getReceivedStatus() != null && !request.getReceivedStatus().trim().isEmpty()) {
            receipt.setReceivedStatus(request.getReceivedStatus().trim());
        }

        if (request.getReceivedFromSupplierId() != null) {
            User supplier = userRepository.findById(request.getReceivedFromSupplierId())
                    .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));
            receipt.setReceivedFromSupplier(supplier);
        }

        if (request.getPurchaseOrderId() != null) {
            Requisition po = requisitionRepository.findById(request.getPurchaseOrderId())
                    .orElseThrow(() -> new IllegalArgumentException("Purchase Order not found"));
            receipt.setPurchaseOrder(po);
        } else {
            receipt.setPurchaseOrder(null);
        }

        if (request.getInvoiceId() != null) {
            Invoice invoice = invoiceRepository.findById(request.getInvoiceId())
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

        PurchaseReceipt receipt = purchaseReceiptRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Purchase Receipt not found"));

        if (!receipt.getBuyer().getId().equals(buyer.getId())) {
            throw new IllegalArgumentException("You are not authorized to delete this Purchase Receipt");
        }

        purchaseReceiptRepository.delete(receipt);
    }

    public List<PurchaseReceiptResponse> getBuyerReceipts(String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        return purchaseReceiptRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getBuyerPurchaseOrders(String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        // Fetch POs created by buyer: Requisitions with status in PO, Accepted, Declined or reqNumber != null
        List<Requisition> reqs = requisitionRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        List<Map<String, Object>> poList = new ArrayList<>();

        for (Requisition r : reqs) {
            int num = r.getReqNumber() != null ? r.getReqNumber() : 1;
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
        if (inv.getRequisition() != null) {
            map.put("purchaseOrderId", inv.getRequisition().getId());
            int num = inv.getRequisition().getReqNumber() != null ? inv.getRequisition().getReqNumber() : 1;
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
            int num = r.getPurchaseOrder().getReqNumber() != null ? r.getPurchaseOrder().getReqNumber() : 1;
            poCode = String.format("PO%02d", num);
            poTitle = r.getPurchaseOrder().getTitle();
        }

        UUID supplierId = r.getReceivedFromSupplier() != null ? r.getReceivedFromSupplier().getId() : null;
        String supplierName = r.getReceivedFromSupplier() != null ? getUserDisplayName(r.getReceivedFromSupplier()) : "Unknown";
        String supplierEmail = r.getReceivedFromSupplier() != null ? r.getReceivedFromSupplier().getEmail() : "";

        UUID invoiceId = r.getInvoice() != null ? r.getInvoice().getId() : null;
        String invoiceNumber = r.getInvoice() != null ? r.getInvoice().getInvoiceNumber() : null;

        return new PurchaseReceiptResponse(
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
                r.getReceivedStatus(),
                r.getCreatedAt(),
                r.getUpdatedAt()
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
            // ignore lazy load error
        }
        return u.getEmail() != null ? u.getEmail() : "User";
    }
}
