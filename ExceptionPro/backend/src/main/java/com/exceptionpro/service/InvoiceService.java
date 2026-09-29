package com.exceptionpro.service;

import com.exceptionpro.dto.EligibleRequestResponse;
import com.exceptionpro.dto.InvoiceRequest;
import com.exceptionpro.dto.InvoiceResponse;
import com.exceptionpro.entity.*;
import com.exceptionpro.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final RequisitionRepository requisitionRepository;
    private final CollaborationRequisitionRepository collaborationRequisitionRepository;
    private final CollaborationProposalRepository collaborationProposalRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          RequisitionRepository requisitionRepository,
                          CollaborationRequisitionRepository collaborationRequisitionRepository,
                          CollaborationProposalRepository collaborationProposalRepository,
                          UserRepository userRepository,
                          NotificationService notificationService) {
        this.invoiceRepository = invoiceRepository;
        this.requisitionRepository = requisitionRepository;
        this.collaborationRequisitionRepository = collaborationRequisitionRepository;
        this.collaborationProposalRepository = collaborationProposalRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public List<EligibleRequestResponse> getEligibleRequestsForSupplier(String supplierEmail) {
        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));

        if (!List.of("Supplier", "Buyer and Supplier").contains(supplier.getAccountType())) {
            throw new IllegalArgumentException("Only Suppliers can view eligible requests for invoicing");
        }

        List<EligibleRequestResponse> list = new ArrayList<>();

        // 1. Accepted Standard Purchase Requests
        List<Requisition> standardAccepted = requisitionRepository.findBySupplierIdAndStatusInOrderByCreatedAtDesc(
                supplier.getId(), List.of("Accepted")
        );

        for (Requisition r : standardAccepted) {
            int num = r.getReqNumber() != null ? r.getReqNumber() : 1;
            String code = String.format("PO%02d", num);
            BigDecimal total = r.getItems() != null ? r.getItems().stream()
                    .map(i -> i.getPrice() != null ? i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity() != null ? i.getQuantity() : 1)) : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add) : BigDecimal.ZERO;

            list.add(new EligibleRequestResponse(
                    r.getId(),
                    "STANDARD",
                    code,
                    r.getTitle(),
                    r.getBuyer().getId(),
                    getUserDisplayName(r.getBuyer()),
                    r.getBuyer().getEmail(),
                    total,
                    r.getItems() != null ? r.getItems().size() : 0,
                    r.getNeedByDate()
            ));
        }

        // 2. Accepted Collaboration Requests (where Buyer has Accepted supplier's proposal)
        List<CollaborationRequisition> collabRequests = collaborationRequisitionRepository.findDistinctBySuppliersIdOrderByCreatedAtDesc(supplier.getId());
        for (CollaborationRequisition c : collabRequests) {
            List<CollaborationProposal> proposals = collaborationProposalRepository
                    .findByCollaborationRequisitionIdAndSupplierId(c.getId(), supplier.getId());
            boolean isProposalAccepted = proposals.stream()
                    .anyMatch(p -> "Accepted".equalsIgnoreCase(p.getEvaluationStatus()));
            if (isProposalAccepted) {
                BigDecimal total = c.getItems() != null ? c.getItems().stream()
                        .map(i -> i.getPrice() != null ? i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity() != null ? i.getQuantity() : 1)) : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add) : BigDecimal.ZERO;

                list.add(new EligibleRequestResponse(
                        c.getId(),
                        "COLLABORATION",
                        "COLLAB",
                        c.getTitle(),
                        c.getBuyer().getId(),
                        getUserDisplayName(c.getBuyer()),
                        c.getBuyer().getEmail(),
                        total,
                        c.getItems() != null ? c.getItems().size() : 0,
                        c.getNeedByDate()
                ));
            }
        }

        return list;
    }

    public InvoiceResponse createInvoice(InvoiceRequest request, String supplierEmail) {
        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));

        if (!List.of("Supplier", "Buyer and Supplier").contains(supplier.getAccountType())) {
            throw new IllegalArgumentException("Only Suppliers can create invoices");
        }

        if (request.getInvoiceNumber() == null || request.getInvoiceNumber().isBlank()) {
            throw new IllegalArgumentException("Invoice Number is required");
        }

        if (invoiceRepository.existsByInvoiceNumber(request.getInvoiceNumber().trim())) {
            throw new IllegalArgumentException("Invoice Number '" + request.getInvoiceNumber().trim() + "' already exists");
        }

        if (request.getInvoiceDate() == null) {
            throw new IllegalArgumentException("Invoice Date is required");
        }

        if (request.getDueDate() == null) {
            throw new IllegalArgumentException("Due Date is required");
        }

        if (request.getTotalAmount() == null || request.getTotalAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Total Amount must be non-negative");
        }

        Invoice invoice = new Invoice();
        invoice.setId(UUID.randomUUID());
        invoice.setInvoiceNumber(request.getInvoiceNumber().trim());
        invoice.setSupplier(supplier);
        invoice.setInvoiceDate(request.getInvoiceDate());
        invoice.setDueDate(request.getDueDate());
        invoice.setTotalAmount(request.getTotalAmount());
        invoice.setNotes(request.getNotes());
        invoice.setStatus("Submitted");
        invoice.setCreatedAt(LocalDateTime.now());

        String requestType = request.getRequestType() != null ? request.getRequestType() : "STANDARD";
        invoice.setRequestType(requestType);

        String requestTitle = "";
        String requestCode = "";
        User buyer = null;

        if ("COLLABORATION".equalsIgnoreCase(requestType) || request.getCollaborationRequisitionId() != null) {
            UUID collabId = request.getCollaborationRequisitionId() != null ? request.getCollaborationRequisitionId() : request.getRequisitionId();
            CollaborationRequisition collab = collaborationRequisitionRepository.findById(collabId)
                    .orElseThrow(() -> new IllegalArgumentException("Collaboration Requisition not found"));

            boolean isAssigned = collab.getSuppliers() != null && collab.getSuppliers().stream()
                    .anyMatch(s -> s.getId().equals(supplier.getId()));
            if (!isAssigned) {
                throw new IllegalArgumentException("You are not assigned to this Collaboration Requisition");
            }

            List<CollaborationProposal> proposals = collaborationProposalRepository
                    .findByCollaborationRequisitionIdAndSupplierId(collab.getId(), supplier.getId());
            boolean isProposalAccepted = proposals.stream()
                    .anyMatch(p -> "Accepted".equalsIgnoreCase(p.getEvaluationStatus()));
            if (!isProposalAccepted) {
                throw new IllegalArgumentException("Invoices can only be created after the Buyer accepts your proposal. Current status: Pending from Buyer.");
            }

            invoice.setCollaborationRequisition(collab);
            invoice.setRequestType("COLLABORATION");
            buyer = collab.getBuyer();
            requestTitle = collab.getTitle();
            requestCode = "COLLAB";
        } else {
            UUID reqId = request.getRequisitionId();
            if (reqId == null) {
                throw new IllegalArgumentException("Requisition ID is required");
            }
            Requisition req = requisitionRepository.findById(reqId)
                    .orElseThrow(() -> new IllegalArgumentException("Requisition not found"));

            if (!"Accepted".equalsIgnoreCase(req.getStatus())) {
                throw new IllegalArgumentException("Invoices can only be created for Accepted Purchase Requests or Collaboration Requests");
            }

            if (req.getSupplier() != null && !req.getSupplier().getId().equals(supplier.getId())) {
                throw new IllegalArgumentException("You are not assigned as the supplier for this Requisition");
            }

            invoice.setRequisition(req);
            invoice.setRequestType("STANDARD");
            buyer = req.getBuyer();
            requestTitle = req.getTitle();
            int num = req.getReqNumber() != null ? req.getReqNumber() : 1;
            requestCode = String.format("PO%02d", num);
        }

        invoice.setBuyer(buyer);
        Invoice saved = invoiceRepository.save(invoice);

        // Send Notification to Buyer
        String supplierName = getUserDisplayName(supplier);
        String msg = "Supplier " + supplierName + " created Invoice " + saved.getInvoiceNumber() + " ($" + saved.getTotalAmount() + ") for Accepted Request '" + requestTitle + "'.";
        notificationService.createNotification(
                buyer,
                supplier,
                "INVOICES",
                "New Invoice Received (" + saved.getInvoiceNumber() + ")",
                msg,
                saved.getNotes(),
                saved.getId(),
                "INVOICE"
        );

        return mapToResponse(saved);
    }

    public List<InvoiceResponse> getSupplierInvoices(String supplierEmail) {
        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return invoiceRepository.findBySupplierIdOrderByCreatedAtDesc(supplier.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public InvoiceResponse updateInvoice(UUID id, InvoiceRequest request, String supplierEmail) {
        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));

        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));

        if (!invoice.getSupplier().getId().equals(supplier.getId())) {
            throw new IllegalArgumentException("You do not have permission to edit this invoice");
        }

        if (request.getInvoiceNumber() != null && !request.getInvoiceNumber().isBlank()) {
            String newNumber = request.getInvoiceNumber().trim();
            if (!newNumber.equalsIgnoreCase(invoice.getInvoiceNumber()) && invoiceRepository.existsByInvoiceNumber(newNumber)) {
                throw new IllegalArgumentException("Invoice Number '" + newNumber + "' already exists");
            }
            invoice.setInvoiceNumber(newNumber);
        }

        if (request.getInvoiceDate() != null) {
            invoice.setInvoiceDate(request.getInvoiceDate());
        }
        if (request.getDueDate() != null) {
            invoice.setDueDate(request.getDueDate());
        }
        if (request.getTotalAmount() != null && request.getTotalAmount().compareTo(BigDecimal.ZERO) >= 0) {
            invoice.setTotalAmount(request.getTotalAmount());
        }
        if (request.getNotes() != null) {
            invoice.setNotes(request.getNotes());
        }

        // Set status to "Updated Invoice" when modified by supplier
        invoice.setStatus("Updated Invoice");

        Invoice updated = invoiceRepository.save(invoice);

        // Notify Buyer of updated invoice
        String supplierName = getUserDisplayName(supplier);
        String requestTitle = updated.getRequisition() != null ? updated.getRequisition().getTitle() :
                (updated.getCollaborationRequisition() != null ? updated.getCollaborationRequisition().getTitle() : "");
        String msg = "Supplier " + supplierName + " updated Invoice " + updated.getInvoiceNumber() + " ($" + updated.getTotalAmount() + ") for Request '" + requestTitle + "'.";
        
        notificationService.createNotification(
                updated.getBuyer(),
                supplier,
                "INVOICES",
                "Updated Invoice Received (" + updated.getInvoiceNumber() + ")",
                msg,
                updated.getNotes(),
                updated.getId(),
                "INVOICE"
        );

        return mapToResponse(updated);
    }

    public void deleteInvoice(UUID id, String supplierEmail) {
        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));

        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));

        if (!invoice.getSupplier().getId().equals(supplier.getId())) {
            throw new IllegalArgumentException("You do not have permission to delete this invoice");
        }

        invoiceRepository.delete(invoice);
    }

    public List<InvoiceResponse> getBuyerInvoices(String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return invoiceRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private InvoiceResponse mapToResponse(Invoice inv) {
        UUID reqId = inv.getRequisition() != null ? inv.getRequisition().getId() : null;
        UUID collabId = inv.getCollaborationRequisition() != null ? inv.getCollaborationRequisition().getId() : null;

        String title = "";
        String code = "";

        if (inv.getRequisition() != null) {
            title = inv.getRequisition().getTitle();
            int num = inv.getRequisition().getReqNumber() != null ? inv.getRequisition().getReqNumber() : 1;
            code = String.format("PO%02d", num);
        } else if (inv.getCollaborationRequisition() != null) {
            title = inv.getCollaborationRequisition().getTitle();
            code = "COLLAB";
        }

        return new InvoiceResponse(
                inv.getId(),
                inv.getInvoiceNumber(),
                inv.getRequestType(),
                reqId,
                collabId,
                title,
                code,
                inv.getSupplier().getId(),
                getUserDisplayName(inv.getSupplier()),
                inv.getSupplier().getEmail(),
                inv.getBuyer().getId(),
                getUserDisplayName(inv.getBuyer()),
                inv.getBuyer().getEmail(),
                inv.getInvoiceDate(),
                inv.getDueDate(),
                inv.getTotalAmount(),
                inv.getNotes(),
                inv.getStatus(),
                inv.getCreatedAt()
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
            // Ignore lazy loading issue
        }
        return u.getEmail() != null ? u.getEmail() : "User";
    }
}
