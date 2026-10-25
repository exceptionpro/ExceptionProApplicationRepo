package com.exceptionpro.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.exceptionpro.dto.EligibleRequestResponse;
import com.exceptionpro.dto.InvoiceItemResponse;
import com.exceptionpro.dto.InvoiceRequest;
import com.exceptionpro.dto.InvoiceResponse;
import com.exceptionpro.entity.CollaborationProposal;
import com.exceptionpro.entity.CollaborationRequisition;
import com.exceptionpro.entity.CollaborationRequisitionItem;
import com.exceptionpro.entity.CorporateProfile;
import com.exceptionpro.entity.Invoice;
import com.exceptionpro.entity.Requisition;
import com.exceptionpro.entity.RequisitionItem;
import com.exceptionpro.entity.User;
import com.exceptionpro.repository.CollaborationProposalRepository;
import com.exceptionpro.repository.CollaborationRequisitionRepository;
import com.exceptionpro.repository.InvoiceRepository;
import com.exceptionpro.repository.RequisitionRepository;
import com.exceptionpro.repository.UserRepository;

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
                supplier.getId(), List.of("Accepted", "PO Accepted")
        );

        for (Requisition r : standardAccepted) {
            int num = (r.getReqNumber() != null) ? r.getReqNumber().intValue() : 1;
            String code = String.format("PO%02d", num);
            BigDecimal total = r.getItems() != null ? r.getItems().stream()
                    .map(i -> i.getPrice() != null ? i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity() != null ? i.getQuantity().longValue() : 1L)) : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, (a, b) -> a.add(b)) : BigDecimal.ZERO;

            String currencyType = (r.getItems() != null && !r.getItems().isEmpty())
                    ? r.getItems().stream()
                            .map(RequisitionItem::getCurrencyType)
                            .filter(c -> c != null && !c.isBlank())
                            .findFirst()
                            .orElse("USD")
                    : "USD";

            list.add(new EligibleRequestResponse(
                    r.getId(),
                    "STANDARD",
                    code,
                    r.getTitle(),
                    r.getBuyer().getId(),
                    getUserDisplayName(r.getBuyer()),
                    r.getBuyer().getEmail(),
                    total,
                    currencyType,
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
                        .map(i -> i.getPrice() != null ? i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity() != null ? i.getQuantity().longValue() : 1L)) : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, (a, b) -> a.add(b)) : BigDecimal.ZERO;

                String currencyType = (c.getItems() != null && !c.getItems().isEmpty())
                        ? c.getItems().stream()
                                .map(CollaborationRequisitionItem::getCurrencyType)
                                .filter(cType -> cType != null && !cType.isBlank())
                                .findFirst()
                                .orElse("USD")
                        : "USD";

                list.add(new EligibleRequestResponse(
                        c.getId(),
                        "COLLABORATION",
                        "COLLAB",
                        c.getTitle(),
                        c.getBuyer().getId(),
                        getUserDisplayName(c.getBuyer()),
                        c.getBuyer().getEmail(),
                        total,
                        currencyType,
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
        BigDecimal poAmt = request.getPoAmount() != null ? request.getPoAmount() : request.getTotalAmount();
        BigDecimal taxPct = request.getTaxPercentage() != null ? request.getTaxPercentage() : BigDecimal.ZERO;
        BigDecimal taxAmt = request.getTaxAmount() != null ? request.getTaxAmount() :
                (poAmt != null && taxPct != null && taxPct.compareTo(BigDecimal.ZERO) > 0 ?
                        poAmt.multiply(taxPct).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO);
        invoice.setPoAmount(poAmt);
        invoice.setTaxPercentage(taxPct);
        invoice.setTaxAmount(taxAmt);
        invoice.setCurrencyType(request.getCurrencyType() != null && !request.getCurrencyType().isBlank() ? request.getCurrencyType().trim() : "USD");
        invoice.setNotes(request.getNotes());
        invoice.setStatus("Submitted");
        invoice.setCreatedAt(LocalDateTime.now());

        String requestType = request.getRequestType() != null ? request.getRequestType() : "STANDARD";
        invoice.setRequestType(requestType);

        String requestTitle = "";
        User buyer = null;

        if ("COLLABORATION".equalsIgnoreCase(requestType) || request.getCollaborationRequisitionId() != null) {
            UUID collabId = request.getCollaborationRequisitionId() != null ? request.getCollaborationRequisitionId() : request.getRequisitionId();
            if (collabId == null) {
                throw new IllegalArgumentException("Collaboration Requisition ID is required");
            }
            CollaborationRequisition collab = collaborationRequisitionRepository.findById(Objects.requireNonNull(collabId))
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
        } else {
            UUID reqId = request.getRequisitionId();
            if (reqId == null) {
                throw new IllegalArgumentException("Requisition ID is required");
            }
            Requisition req = requisitionRepository.findById(Objects.requireNonNull(reqId))
                    .orElseThrow(() -> new IllegalArgumentException("Requisition not found"));

            if ("Cancelled".equalsIgnoreCase(req.getStatus())) {
                throw new IllegalArgumentException("Cannot create invoice for a cancelled Purchase Order");
            }

            if (!"Accepted".equalsIgnoreCase(req.getStatus()) && !"PO Accepted".equalsIgnoreCase(req.getStatus())) {
                throw new IllegalArgumentException("Invoices can only be created for Accepted Purchase Requests or Collaboration Requests");
            }

            if (req.getSupplier() != null && !req.getSupplier().getId().equals(supplier.getId())) {
                throw new IllegalArgumentException("You are not assigned as the supplier for this Requisition");
            }

            invoice.setRequisition(req);
            invoice.setRequestType("STANDARD");
            buyer = req.getBuyer();
            requestTitle = req.getTitle();
        }

        invoice.setBuyer(buyer);
        Invoice saved = invoiceRepository.save(invoice);

        // Send Notification to Buyer
        String supplierName = getUserDisplayName(supplier);
        String msg = "Supplier " + supplierName + " created Invoice " + saved.getInvoiceNumber() + " (" + saved.getCurrencyType() + " " + saved.getTotalAmount() + ") for Accepted Request '" + requestTitle + "'.";
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

        Invoice invoice = invoiceRepository.findById(Objects.requireNonNull(id))
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
        if (request.getPoAmount() != null && request.getPoAmount().compareTo(BigDecimal.ZERO) >= 0) {
            invoice.setPoAmount(request.getPoAmount());
        }
        if (request.getTaxPercentage() != null && request.getTaxPercentage().compareTo(BigDecimal.ZERO) >= 0) {
            invoice.setTaxPercentage(request.getTaxPercentage());
        }
        if (request.getTaxAmount() != null && request.getTaxAmount().compareTo(BigDecimal.ZERO) >= 0) {
            invoice.setTaxAmount(request.getTaxAmount());
        } else if (invoice.getPoAmount() != null && invoice.getTaxPercentage() != null) {
            invoice.setTaxAmount(invoice.getPoAmount().multiply(invoice.getTaxPercentage()).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP));
        }
        if (request.getCurrencyType() != null && !request.getCurrencyType().isBlank()) {
            invoice.setCurrencyType(request.getCurrencyType().trim());
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
        String msg = "Supplier " + supplierName + " updated Invoice " + updated.getInvoiceNumber() + " (" + updated.getCurrencyType() + " " + updated.getTotalAmount() + ") for Request '" + requestTitle + "'.";
        
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

        Invoice invoice = invoiceRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));

        if (!invoice.getSupplier().getId().equals(supplier.getId())) {
            throw new IllegalArgumentException("You do not have permission to delete this invoice");
        }

        invoiceRepository.delete(Objects.requireNonNull(invoice));
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

        List<InvoiceItemResponse> items = new ArrayList<>();
        if (inv.getRequisition() != null) {
            title = inv.getRequisition().getTitle();
            int num = (inv.getRequisition().getReqNumber() != null) ? inv.getRequisition().getReqNumber().intValue() : 1;
            code = String.format("PO%02d", num);
            if (inv.getRequisition().getItems() != null) {
                for (RequisitionItem item : inv.getRequisition().getItems()) {
                    items.add(new InvoiceItemResponse(
                            item.getProductName(),
                            item.getQuantity(),
                            item.getPrice(),
                            item.getCurrencyType(),
                            item.getUnitMeasure()
                    ));
                }
            }
        } else if (inv.getCollaborationRequisition() != null) {
            title = inv.getCollaborationRequisition().getTitle();
            code = "COLLAB";
            if (inv.getCollaborationRequisition().getItems() != null) {
                for (CollaborationRequisitionItem item : inv.getCollaborationRequisition().getItems()) {
                    items.add(new InvoiceItemResponse(
                            item.getProductName(),
                            item.getQuantity(),
                            item.getPrice(),
                            item.getCurrencyType(),
                            item.getUnitMeasure()
                    ));
                }
            }
        }

        String supplierAddress = getUserAddress(inv.getSupplier());
        String buyerAddress = getUserAddress(inv.getBuyer());

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
                supplierAddress,
                inv.getBuyer().getId(),
                getUserDisplayName(inv.getBuyer()),
                inv.getBuyer().getEmail(),
                buyerAddress,
                inv.getInvoiceDate(),
                inv.getDueDate(),
                inv.getTotalAmount(),
                inv.getPoAmount() != null ? inv.getPoAmount() : inv.getTotalAmount(),
                inv.getTaxPercentage() != null ? inv.getTaxPercentage() : BigDecimal.ZERO,
                inv.getTaxAmount() != null ? inv.getTaxAmount() : BigDecimal.ZERO,
                inv.getCurrencyType() != null ? inv.getCurrencyType() : "USD",
                inv.getNotes(),
                inv.getStatus(),
                inv.getCreatedAt(),
                items
        );
    }

    private String getUserAddress(User u) {
        if (u == null) return "Address not specified";
        try {
            User fullUser = u;
            if (u.getId() != null) {
                fullUser = userRepository.findByIdFetchProfiles(u.getId()).orElse(u);
            }
            if (fullUser.getCorporateProfile() != null) {
                CorporateProfile cp = fullUser.getCorporateProfile();
                List<String> parts = new ArrayList<>();
                if (cp.getStreetAddress() != null && !cp.getStreetAddress().isBlank()) {
                    parts.add(cp.getStreetAddress().trim());
                }
                if (cp.getCity() != null && !cp.getCity().isBlank()) {
                    parts.add(cp.getCity().trim());
                }
                if (cp.getState() != null && !cp.getState().isBlank()) {
                    parts.add(cp.getState().trim());
                }
                if (cp.getCountry() != null && !cp.getCountry().isBlank()) {
                    parts.add(cp.getCountry().trim());
                }
                if (cp.getPincode() != null && !cp.getPincode().isBlank()) {
                    parts.add(cp.getPincode().trim());
                }
                if (!parts.isEmpty()) {
                    return String.join(", ", parts);
                }
            }
        } catch (Exception e) {
            // Ignore lazy loading issue
        }
        return "Address not specified";
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
