package com.exceptionpro.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.exceptionpro.dto.BuyerDashboardResponse;
import com.exceptionpro.dto.BuyerDashboardResponse.DashboardKpiSummary;
import com.exceptionpro.dto.BuyerDashboardResponse.InvoiceReconciliationSection;
import com.exceptionpro.dto.BuyerDashboardResponse.PaymentDistribution;
import com.exceptionpro.dto.BuyerDashboardResponse.PaymentsSection;
import com.exceptionpro.dto.BuyerDashboardResponse.PeriodData;
import com.exceptionpro.dto.BuyerDashboardResponse.PoReceiptInvoiceReconItem;
import com.exceptionpro.dto.BuyerDashboardResponse.PoReconVsPaymentItem;
import com.exceptionpro.dto.BuyerDashboardResponse.PurchaseOrderSection;
import com.exceptionpro.dto.BuyerDashboardResponse.SupplierAcceptanceItem;
import com.exceptionpro.dto.BuyerDashboardResponse.SupplierPoItem;
import com.exceptionpro.dto.BuyerDashboardResponse.SupplierPoVsInvoiceItem;
import com.exceptionpro.dto.ReconciliationResponse;
import com.exceptionpro.entity.Invoice;
import com.exceptionpro.entity.Payment;
import com.exceptionpro.entity.PurchaseReceipt;
import com.exceptionpro.entity.Reconciliation;
import com.exceptionpro.entity.Requisition;
import com.exceptionpro.entity.RequisitionItem;
import com.exceptionpro.entity.User;
import com.exceptionpro.repository.InvoiceRepository;
import com.exceptionpro.repository.PaymentRepository;
import com.exceptionpro.repository.PurchaseReceiptRepository;
import com.exceptionpro.repository.ReconciliationRepository;
import com.exceptionpro.repository.RequisitionRepository;
import com.exceptionpro.repository.UserRepository;
import com.exceptionpro.repository.CollaborationRequisitionRepository;
import com.exceptionpro.repository.CollaborationSupplierResponseRepository;
import com.exceptionpro.repository.CollaborationProposalRepository;
import com.exceptionpro.dto.SupplierDashboardResponse;
import com.exceptionpro.dto.SupplierDashboardResponse.ChartDistributionItem;
import com.exceptionpro.dto.SupplierDashboardResponse.DashboardSummary;
import com.exceptionpro.dto.SupplierDashboardResponse.PurchaseAndCollaborationSection;
import com.exceptionpro.dto.SupplierDashboardResponse.PeriodSupplierData;
import com.exceptionpro.dto.SupplierDashboardResponse.BuyerPrItem;
import com.exceptionpro.dto.SupplierDashboardResponse.BuyerCollaborationItem;
import com.exceptionpro.dto.SupplierDashboardResponse.ReceiptsSection;
import com.exceptionpro.dto.SupplierDashboardResponse.ReceiptSubGroup;
import com.exceptionpro.dto.SupplierDashboardResponse.BuyerReceiptItem;
import com.exceptionpro.dto.SupplierDashboardResponse.InvoiceAndPaymentsSection;
import com.exceptionpro.dto.SupplierDashboardResponse.BuyerPoVsInvoiceItem;
import com.exceptionpro.dto.SupplierDashboardResponse.BuyerInvoiceVsPaymentItem;
import com.exceptionpro.entity.CollaborationRequisition;
import com.exceptionpro.entity.CollaborationSupplierResponse;
import com.exceptionpro.entity.CollaborationProposal;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final RequisitionRepository requisitionRepository;
    private final InvoiceRepository invoiceRepository;
    private final PurchaseReceiptRepository purchaseReceiptRepository;
    private final ReconciliationRepository reconciliationRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final ReconciliationService reconciliationService;
    private final CollaborationRequisitionRepository collaborationRequisitionRepository;
    private final CollaborationSupplierResponseRepository collaborationSupplierResponseRepository;
    private final CollaborationProposalRepository collaborationProposalRepository;

    public DashboardService(RequisitionRepository requisitionRepository,
                            InvoiceRepository invoiceRepository,
                            PurchaseReceiptRepository purchaseReceiptRepository,
                            ReconciliationRepository reconciliationRepository,
                            PaymentRepository paymentRepository,
                            UserRepository userRepository,
                            ReconciliationService reconciliationService,
                            CollaborationRequisitionRepository collaborationRequisitionRepository,
                            CollaborationSupplierResponseRepository collaborationSupplierResponseRepository,
                            CollaborationProposalRepository collaborationProposalRepository) {
        this.requisitionRepository = requisitionRepository;
        this.invoiceRepository = invoiceRepository;
        this.purchaseReceiptRepository = purchaseReceiptRepository;
        this.reconciliationRepository = reconciliationRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.reconciliationService = reconciliationService;
        this.collaborationRequisitionRepository = collaborationRequisitionRepository;
        this.collaborationSupplierResponseRepository = collaborationSupplierResponseRepository;
        this.collaborationProposalRepository = collaborationProposalRepository;
    }

    public BuyerDashboardResponse getBuyerDashboard(String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        List<Requisition> allReqs = requisitionRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        List<Invoice> allInvoices = invoiceRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        List<PurchaseReceipt> allReceipts = purchaseReceiptRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        List<Payment> allPayments = paymentRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());

        BuyerDashboardResponse response = new BuyerDashboardResponse();

        // --------------------------------------------------------------------
        // 1. PURCHASE ORDER SECTION (Weekly, Monthly, Quarterly)
        // --------------------------------------------------------------------
        PurchaseOrderSection poSection = new PurchaseOrderSection();
        LocalDateTime now = LocalDateTime.now();

        poSection.setWeekly(buildPeriodData(allReqs, now.minusDays(7)));
        poSection.setMonthly(buildPeriodData(allReqs, now.minusDays(30)));
        poSection.setQuarterly(buildPeriodData(allReqs, now.minusDays(90)));

        response.setPurchaseOrders(poSection);

        // --------------------------------------------------------------------
        // 2. INVOICE & RECONCILIATION SECTION
        // --------------------------------------------------------------------
        InvoiceReconciliationSection invReconSection = new InvoiceReconciliationSection();

        // a) Supplier-wise PO vs Invoices Available
        invReconSection.setSupplierPoVsInvoices(buildSupplierPoVsInvoices(allReqs, allInvoices));

        // b) Receipts and Invoices vs Reconciliation per Purchase Order
        List<PoReceiptInvoiceReconItem> poReconItems = buildPoReceiptInvoiceReconList(allReqs, allReceipts, allInvoices);
        invReconSection.setPoReceiptsInvoicesVsRecon(poReconItems);

        response.setInvoiceAndReconciliation(invReconSection);

        // --------------------------------------------------------------------
        // 3. PAYMENTS SECTION
        // --------------------------------------------------------------------
        PaymentsSection paymentsSection = new PaymentsSection();
        List<PoReconVsPaymentItem> poPaymentItems = buildPoReconVsPaymentList(allReqs, poReconItems, allPayments);
        paymentsSection.setPoReconVsPayments(poPaymentItems);

        PaymentDistribution dist = buildPaymentDistribution(poPaymentItems);
        paymentsSection.setDistribution(dist);

        response.setPayments(paymentsSection);

        // --------------------------------------------------------------------
        // 4. EXECUTIVE SUMMARY KPIS
        // --------------------------------------------------------------------
        DashboardKpiSummary summary = new DashboardKpiSummary();
        summary.setTotalPurchaseOrders(allReqs.size());

        long acceptedCount = allReqs.stream()
                .filter(r -> "PO Accepted".equalsIgnoreCase(r.getStatus()))
                .count();
        summary.setAcceptedPurchaseOrders((int) acceptedCount);
        summary.setOverallAcceptanceRate(allReqs.isEmpty() ? 0.0 : Math.round((acceptedCount * 1000.0 / allReqs.size())) / 10.0);

        summary.setTotalInvoices(allInvoices.size());
        summary.setTotalReceipts(allReceipts.size());

        long matchedCount = poReconItems.stream().filter(i -> i != null && i.isReconciled()).count();
        long exceptionCount = poReconItems.stream()
                .filter(i -> "EXCEPTION".equalsIgnoreCase(i.getReconciliationStatus()))
                .count();
        summary.setReconciledMatchedCount((int) matchedCount);
        summary.setReconciledExceptionCount((int) exceptionCount);

        summary.setTotalPaymentAmountDisbursed(dist.getTotalPaidAmount());
        summary.setTotalPaymentAmountDue(dist.getTotalDueAmount());

        response.setSummary(summary);

        return response;
    }

    private PeriodData buildPeriodData(List<Requisition> allReqs, LocalDateTime startDate) {
        PeriodData period = new PeriodData();

        List<Requisition> filtered = allReqs.stream()
                .filter(r -> r.getCreatedAt() != null && r.getCreatedAt().isAfter(startDate))
                .collect(Collectors.toList());

        // Group by supplier
        Map<String, List<Requisition>> supplierMap = new HashMap<>();
        Map<String, UUID> supplierIdMap = new HashMap<>();

        for (Requisition req : filtered) {
            String supplierName = getSupplierDisplayName(req.getSupplier());
            supplierMap.computeIfAbsent(supplierName, k -> new ArrayList<>()).add(req);
            if (req.getSupplier() != null) {
                supplierIdMap.put(supplierName, req.getSupplier().getId());
            }
        }

        // a) Supplier-wise POs created
        List<SupplierPoItem> poItems = new ArrayList<>();
        // b) Supplier accepted PO rate
        List<SupplierAcceptanceItem> acceptanceItems = new ArrayList<>();

        for (Map.Entry<String, List<Requisition>> entry : supplierMap.entrySet()) {
            String sName = entry.getKey();
            List<Requisition> reqs = entry.getValue();
            UUID sId = supplierIdMap.get(sName);

            BigDecimal totalAmt = BigDecimal.ZERO;
            int accepted = 0;
            int declined = 0;
            int pending = 0;

            for (Requisition r : reqs) {
                totalAmt = totalAmt.add(calculatePoTotalAmount(r));
                String st = r.getStatus() != null ? r.getStatus().trim() : "";
                if ("PO Accepted".equalsIgnoreCase(st)) {
                    accepted++;
                } else if ("PO Declined".equalsIgnoreCase(st) || "Cancelled".equalsIgnoreCase(st)) {
                    declined++;
                } else {
                    pending++;
                }
            }

            poItems.add(new SupplierPoItem(sId, sName, reqs.size(), totalAmt.setScale(2, RoundingMode.HALF_UP)));

            int totalAssigned = reqs.size();
            double rate = totalAssigned > 0 ? Math.round((accepted * 1000.0 / totalAssigned)) / 10.0 : 0.0;
            acceptanceItems.add(new SupplierAcceptanceItem(sId, sName, totalAssigned, accepted, declined, pending, rate));
        }

        // Sort descending by count
        poItems.sort((a, b) -> Integer.compare(b.getPoCount(), a.getPoCount()));
        acceptanceItems.sort((a, b) -> Double.compare(b.getAcceptanceRatePercent(), a.getAcceptanceRatePercent()));

        period.setSupplierPoCreated(poItems);
        period.setSupplierAcceptanceRate(acceptanceItems);

        return period;
    }

    private List<SupplierPoVsInvoiceItem> buildSupplierPoVsInvoices(List<Requisition> allReqs, List<Invoice> allInvoices) {
        Set<String> allSupplierNames = new HashSet<>();
        Map<String, UUID> supplierIdMap = new HashMap<>();

        for (Requisition r : allReqs) {
            String name = getSupplierDisplayName(r.getSupplier());
            allSupplierNames.add(name);
            if (r.getSupplier() != null) {
                supplierIdMap.put(name, r.getSupplier().getId());
            }
        }

        for (Invoice inv : allInvoices) {
            String name = getSupplierDisplayName(inv.getSupplier());
            allSupplierNames.add(name);
            if (inv.getSupplier() != null) {
                supplierIdMap.put(name, inv.getSupplier().getId());
            }
        }

        List<SupplierPoVsInvoiceItem> list = new ArrayList<>();

        for (String sName : allSupplierNames) {
            UUID sId = supplierIdMap.get(sName);

            // Filter POs
            List<Requisition> suppReqs = allReqs.stream()
                    .filter(r -> sName.equals(getSupplierDisplayName(r.getSupplier())))
                    .collect(Collectors.toList());

            BigDecimal poTotal = suppReqs.stream()
                    .map(this::calculatePoTotalAmount)
                    .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));

            // Filter Invoices
            List<Invoice> suppInvoices = allInvoices.stream()
                    .filter(i -> sName.equals(getSupplierDisplayName(i.getSupplier())))
                    .collect(Collectors.toList());

            BigDecimal invTotal = suppInvoices.stream()
                    .map(i -> i.getTotalAmount() != null ? i.getTotalAmount() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));

            list.add(new SupplierPoVsInvoiceItem(
                    sId,
                    sName,
                    suppReqs.size(),
                    suppInvoices.size(),
                    poTotal.setScale(2, RoundingMode.HALF_UP),
                    invTotal.setScale(2, RoundingMode.HALF_UP)
            ));
        }

        list.sort((a, b) -> Integer.compare(b.getPoCount(), a.getPoCount()));
        return list;
    }

    private List<PoReceiptInvoiceReconItem> buildPoReceiptInvoiceReconList(List<Requisition> allReqs,
                                                                         List<PurchaseReceipt> allReceipts,
                                                                         List<Invoice> allInvoices) {
        List<PoReceiptInvoiceReconItem> list = new ArrayList<>();

        for (Requisition req : allReqs) {
            int num = req.getReqNumber() != null ? req.getReqNumber() : 1;
            String poCode = String.format("PO%02d", num);

            PoReceiptInvoiceReconItem item = new PoReceiptInvoiceReconItem();
            item.setPoId(req.getId());
            item.setPoNumber(poCode);
            item.setPoTitle(req.getTitle());
            item.setSupplierName(getSupplierDisplayName(req.getSupplier()));

            // PO Quantities and Amounts
            int poQty = 0;
            BigDecimal poAmount = BigDecimal.ZERO;
            if (req.getItems() != null) {
                for (RequisitionItem i : req.getItems()) {
                    int q = i.getQuantity() != null ? i.getQuantity() : 0;
                    BigDecimal price = i.getPrice() != null ? i.getPrice() : BigDecimal.ZERO;
                    poQty += q;
                    poAmount = poAmount.add(price.multiply(BigDecimal.valueOf(q)));
                }
            }
            item.setPoQuantity(poQty);
            item.setPoAmount(poAmount.setScale(2, RoundingMode.HALF_UP));

            // Matching Receipts
            List<PurchaseReceipt> reqReceipts = allReceipts.stream()
                    .filter(rc -> rc.getPurchaseOrder() != null && rc.getPurchaseOrder().getId().equals(req.getId()))
                    .collect(Collectors.toList());

            int recQty = 0;
            List<String> grnList = new ArrayList<>();
            for (PurchaseReceipt rc : reqReceipts) {
                recQty += (rc.getReceivedQuantity() != null ? rc.getReceivedQuantity() : (rc.getQuantity() != null ? rc.getQuantity() : 0));
                if (rc.getReceiptNo() != null && !rc.getReceiptNo().isBlank()) {
                    grnList.add(rc.getReceiptNo());
                }
            }
            item.setReceivedQuantity(recQty);
            BigDecimal unitPrice = poQty > 0 ? poAmount.divide(BigDecimal.valueOf(poQty), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            item.setReceivedAmount(unitPrice.multiply(BigDecimal.valueOf(recQty)).setScale(2, RoundingMode.HALF_UP));
            item.setReceiptGrnNumber(grnList.isEmpty() ? "N/A" : String.join(", ", grnList));

            // Matching Invoices
            List<Invoice> reqInvoices = allInvoices.stream()
                    .filter(inv -> inv.getRequisition() != null && inv.getRequisition().getId().equals(req.getId()))
                    .collect(Collectors.toList());

            int invQty = 0;
            BigDecimal invAmount = BigDecimal.ZERO;
            List<String> invList = new ArrayList<>();
            for (Invoice inv : reqInvoices) {
                if (inv.getTotalAmount() != null) {
                    invAmount = invAmount.add(inv.getTotalAmount());
                }
                if (inv.getInvoiceNumber() != null && !inv.getInvoiceNumber().isBlank()) {
                    invList.add(inv.getInvoiceNumber());
                }
            }
            invQty = reqInvoices.isEmpty() ? 0 : poQty;
            item.setInvoiceQuantity(invQty);
            item.setInvoiceAmount(invAmount.setScale(2, RoundingMode.HALF_UP));
            item.setInvoiceNumber(invList.isEmpty() ? "N/A" : String.join(", ", invList));

            // Reconciliation Status
            ReconciliationResponse recon = null;
            try {
                recon = reconciliationService.getReconciliationForStandardRequisition(req);
            } catch (Exception ignored) {}

            String rStatus = "PENDING";
            boolean isMatched = false;
            if (recon != null) {
                rStatus = recon.getOverallResult() != null ? recon.getOverallResult() : "PENDING";
                isMatched = "MATCHED".equalsIgnoreCase(rStatus);
            } else if (reqReceipts.isEmpty() && reqInvoices.isEmpty()) {
                rStatus = "PENDING";
            }

            item.setReconciliationStatus(rStatus);
            item.setReconciled(isMatched);

            list.add(item);
        }

        return list;
    }

    private List<PoReconVsPaymentItem> buildPoReconVsPaymentList(List<Requisition> allReqs,
                                                                 List<PoReceiptInvoiceReconItem> reconItems,
                                                                 List<Payment> allPayments) {
        List<PoReconVsPaymentItem> list = new ArrayList<>();

        for (PoReceiptInvoiceReconItem reconItem : reconItems) {
            PoReconVsPaymentItem payItem = new PoReconVsPaymentItem();
            payItem.setPoId(reconItem.getPoId());
            payItem.setPoNumber(reconItem.getPoNumber());
            payItem.setPoTitle(reconItem.getPoTitle());
            payItem.setSupplierName(reconItem.getSupplierName());
            payItem.setReconciliationStatus(reconItem.getReconciliationStatus());
            payItem.setReconciled(reconItem.isReconciled());

            // Look up matching payment record
            Payment payment = allPayments.stream()
                    .filter(p -> (p.getRequisition() != null && p.getRequisition().getId().equals(reconItem.getPoId())) ||
                            (p.getPoNumber() != null && p.getPoNumber().equalsIgnoreCase(reconItem.getPoNumber())))
                    .findFirst()
                    .orElse(null);

            // Invariant: The Purchase Orders which have Reconciled successfully only those Purchase Orders the Payment Id should be generated.
            boolean hasPaymentId = reconItem.isReconciled() && payment != null && payment.getPaymentId() != null && !payment.getPaymentId().isBlank();
            payItem.setHasPaymentId(hasPaymentId);

            if (hasPaymentId && payment != null) {
                payItem.setPaymentId(payment.getPaymentId());
                payItem.setPaymentStatus(payment.getPaymentStatus() != null ? payment.getPaymentStatus() : "Payment Due");
                BigDecimal amt = payment.getAmountToPay() != null ? payment.getAmountToPay() : reconItem.getInvoiceAmount();
                payItem.setReconciledAmount(amt);

                if ("Paid".equalsIgnoreCase(payment.getPaymentStatus())) {
                    payItem.setPaidAmount(amt);
                    payItem.setPaymentDueAmount(BigDecimal.ZERO);
                } else {
                    payItem.setPaidAmount(BigDecimal.ZERO);
                    payItem.setPaymentDueAmount(amt);
                }
            } else {
                payItem.setPaymentId(null);
                payItem.setPaymentStatus(reconItem.isReconciled() ? "Payment Due" : "Blocked (Unreconciled)");
                payItem.setReconciledAmount(reconItem.isReconciled() ? reconItem.getPoAmount() : BigDecimal.ZERO);
                payItem.setPaidAmount(BigDecimal.ZERO);
                payItem.setPaymentDueAmount(reconItem.isReconciled() ? reconItem.getPoAmount() : BigDecimal.ZERO);
            }

            list.add(payItem);
        }

        return list;
    }

    private PaymentDistribution buildPaymentDistribution(List<PoReconVsPaymentItem> items) {
        PaymentDistribution dist = new PaymentDistribution();
        int paidCount = 0;
        int dueCount = 0;
        int onHoldCount = 0;
        int unreconciledCount = 0;
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal totalDue = BigDecimal.ZERO;

        for (PoReconVsPaymentItem item : items) {
            if ("Paid".equalsIgnoreCase(item.getPaymentStatus())) {
                paidCount++;
                totalPaid = totalPaid.add(item.getPaidAmount());
            } else if ("Payment Due".equalsIgnoreCase(item.getPaymentStatus())) {
                dueCount++;
                totalDue = totalDue.add(item.getPaymentDueAmount());
            } else if ("On Hold".equalsIgnoreCase(item.getPaymentStatus())) {
                onHoldCount++;
            } else {
                unreconciledCount++;
            }
        }

        dist.setPaidCount(paidCount);
        dist.setPaymentDueCount(dueCount);
        dist.setOnHoldCount(onHoldCount);
        dist.setUnreconciledCount(unreconciledCount);
        dist.setTotalPaidAmount(totalPaid.setScale(2, RoundingMode.HALF_UP));
        dist.setTotalDueAmount(totalDue.setScale(2, RoundingMode.HALF_UP));

        return dist;
    }

    private BigDecimal calculatePoTotalAmount(Requisition r) {
        if (r.getItems() == null || r.getItems().isEmpty()) {
            return BigDecimal.ZERO;
        }
        BigDecimal sum = BigDecimal.ZERO;
        for (RequisitionItem item : r.getItems()) {
            int q = item.getQuantity() != null ? item.getQuantity() : 0;
            BigDecimal price = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
            sum = sum.add(price.multiply(BigDecimal.valueOf(q)));
        }
        return sum;
    }

    private String getSupplierDisplayName(User user) {
        if (user == null) {
            return "Unassigned Supplier";
        }
        try {
            if (user.getCorporateProfile() != null && user.getCorporateProfile().getOrganizationName() != null &&
                    !user.getCorporateProfile().getOrganizationName().trim().isEmpty()) {
                return user.getCorporateProfile().getOrganizationName().trim();
            }
            if (user.getIndividualProfile() != null) {
                String full = ((user.getIndividualProfile().getFirstName() != null ? user.getIndividualProfile().getFirstName() : "") + " " +
                        (user.getIndividualProfile().getLastName() != null ? user.getIndividualProfile().getLastName() : "")).trim();
                if (!full.isEmpty()) {
                    return full;
                }
            }
        } catch (Exception ignored) {}
        return user.getEmail() != null ? user.getEmail() : "Supplier";
    }

    private String getBuyerDisplayName(User user) {
        if (user == null) {
            return "Buyer";
        }
        try {
            if (user.getCorporateProfile() != null && user.getCorporateProfile().getOrganizationName() != null &&
                    !user.getCorporateProfile().getOrganizationName().trim().isEmpty()) {
                return user.getCorporateProfile().getOrganizationName().trim();
            }
            if (user.getIndividualProfile() != null) {
                String full = ((user.getIndividualProfile().getFirstName() != null ? user.getIndividualProfile().getFirstName() : "") + " " +
                        (user.getIndividualProfile().getLastName() != null ? user.getIndividualProfile().getLastName() : "")).trim();
                if (!full.isEmpty()) {
                    return full;
                }
            }
        } catch (Exception ignored) {}
        return user.getEmail() != null ? user.getEmail() : "Buyer";
    }

    public SupplierDashboardResponse getSupplierDashboard(String supplierEmail) {
        User supplier = userRepository.findByEmail(supplierEmail)
                .orElseThrow(() -> new IllegalArgumentException("Supplier not found"));

        List<Requisition> allReqs = requisitionRepository.findAllBySupplierIdOrderByCreatedAtDesc(supplier.getId());
        List<CollaborationRequisition> allCollabReqs = collaborationRequisitionRepository.findDistinctBySuppliersIdOrderByCreatedAtDesc(supplier.getId());
        List<CollaborationSupplierResponse> allCollabResponses = collaborationSupplierResponseRepository.findBySupplierIdOrderByCreatedAtDesc(supplier.getId());
        List<CollaborationProposal> allCollabProposals = collaborationProposalRepository.findBySupplierIdOrderByCreatedAtDesc(supplier.getId());
        List<PurchaseReceipt> allReceipts = purchaseReceiptRepository.findByReceivedFromSupplierIdOrderByCreatedAtDesc(supplier.getId());
        List<Invoice> allInvoices = invoiceRepository.findBySupplierIdOrderByCreatedAtDesc(supplier.getId());
        List<Payment> allPayments = paymentRepository.findBySupplierIdOrderByCreatedAtDesc(supplier.getId());

        SupplierDashboardResponse response = new SupplierDashboardResponse();
        LocalDateTime now = LocalDateTime.now();

        // 1. Purchase & Collaboration Requests (Weekly, Monthly, Quarterly)
        PurchaseAndCollaborationSection pcSection = new PurchaseAndCollaborationSection();
        pcSection.setWeekly(buildSupplierPeriodData(allReqs, allCollabReqs, allCollabResponses, allCollabProposals, now.minusDays(7)));
        pcSection.setMonthly(buildSupplierPeriodData(allReqs, allCollabReqs, allCollabResponses, allCollabProposals, now.minusDays(30)));
        pcSection.setQuarterly(buildSupplierPeriodData(allReqs, allCollabReqs, allCollabResponses, allCollabProposals, now.minusDays(90)));
        response.setPurchaseAndCollaboration(pcSection);

        // 2. Receipts Section
        ReceiptsSection receiptsSection = buildSupplierReceiptsSection(allReceipts);
        response.setReceipts(receiptsSection);

        // 3. Invoice & Payments Section
        InvoiceAndPaymentsSection invPaySection = buildSupplierInvoiceAndPaymentsSection(allReqs, allInvoices, allPayments);
        response.setInvoiceAndPayments(invPaySection);

        // 4. Overall Summary KPIs
        DashboardSummary summary = buildSupplierSummary(allReqs, allCollabReqs, allCollabResponses, allCollabProposals, allReceipts, allInvoices, allPayments);
        response.setSummary(summary);

        return response;
    }

    private PeriodSupplierData buildSupplierPeriodData(List<Requisition> allReqs,
                                                       List<CollaborationRequisition> allCollabReqs,
                                                       List<CollaborationSupplierResponse> allCollabResponses,
                                                       List<CollaborationProposal> allCollabProposals,
                                                       LocalDateTime threshold) {
        PeriodSupplierData data = new PeriodSupplierData();

        // --------------------------------------------------------------------
        // Part A: Buyer-wise Purchase Requests (Approved vs Declined)
        // --------------------------------------------------------------------
        List<Requisition> periodReqs = allReqs.stream()
                .filter(r -> r.getCreatedAt() != null && r.getCreatedAt().isAfter(threshold))
                .filter(r -> r.getCollaborationRequisitionId() == null)
                .collect(Collectors.toList());

        Map<UUID, User> buyerMap = new HashMap<>();
        Map<UUID, int[]> prCountsByBuyer = new HashMap<>(); // [total, approved, declined, pending]

        for (Requisition r : periodReqs) {
            User buyer = r.getBuyer();
            if (buyer == null) continue;
            buyerMap.put(buyer.getId(), buyer);
            int[] counts = prCountsByBuyer.computeIfAbsent(buyer.getId(), k -> new int[4]);
            counts[0]++; // total

            String status = r.getStatus() != null ? r.getStatus().trim() : "";
            if ("PO Accepted".equalsIgnoreCase(status) || "PO".equalsIgnoreCase(status)) {
                counts[1]++; // approved
            } else if ("Declined".equalsIgnoreCase(status)) {
                counts[2]++; // declined
            } else {
                counts[3]++; // pending
            }
        }

        List<BuyerPrItem> buyerPrList = new ArrayList<>();
        int totalPrApproved = 0;
        int totalPrDeclined = 0;
        int totalPrPending = 0;

        for (Map.Entry<UUID, int[]> entry : prCountsByBuyer.entrySet()) {
            UUID buyerId = entry.getKey();
            int[] c = entry.getValue();
            User buyer = buyerMap.get(buyerId);

            BuyerPrItem item = new BuyerPrItem();
            item.setBuyerId(buyerId);
            item.setBuyerName(getBuyerDisplayName(buyer));
            item.setBuyerEmail(buyer != null ? buyer.getEmail() : "");
            item.setTotalRequested(c[0]);
            item.setApprovedCount(c[1]);
            item.setDeclinedCount(c[2]);
            item.setPendingCount(c[3]);
            double rate = c[0] > 0 ? (c[1] * 100.0 / c[0]) : 0.0;
            item.setApprovalRatePercent(Math.round(rate * 10.0) / 10.0);

            buyerPrList.add(item);
            totalPrApproved += c[1];
            totalPrDeclined += c[2];
            totalPrPending += c[3];
        }

        // Sort descending by total requested
        buyerPrList.sort((a, b) -> Integer.compare(b.getTotalRequested(), a.getTotalRequested()));
        data.setBuyerPurchaseRequests(buyerPrList);

        // PR Status Distribution for Pie Chart
        int totalPrAll = totalPrApproved + totalPrDeclined + totalPrPending;
        List<ChartDistributionItem> prPie = new ArrayList<>();
        if (totalPrAll > 0) {
            prPie.add(new ChartDistributionItem("Approved", totalPrApproved, Math.round((totalPrApproved * 100.0 / totalPrAll) * 10.0) / 10.0, "#10b981"));
            prPie.add(new ChartDistributionItem("Declined", totalPrDeclined, Math.round((totalPrDeclined * 100.0 / totalPrAll) * 10.0) / 10.0, "#ef4444"));
            prPie.add(new ChartDistributionItem("Pending / In-Review", totalPrPending, Math.round((totalPrPending * 100.0 / totalPrAll) * 10.0) / 10.0, "#f59e0b"));
        }
        data.setPrStatusDistribution(prPie);

        // --------------------------------------------------------------------
        // Part B: Buyer-wise Collaboration Requests & Proposals & Conversion Rate
        // --------------------------------------------------------------------
        List<CollaborationRequisition> periodCollabs = allCollabReqs.stream()
                .filter(c -> c.getCreatedAt() != null && c.getCreatedAt().isAfter(threshold))
                .collect(Collectors.toList());

        List<CollaborationSupplierResponse> periodResponses = allCollabResponses.stream()
                .filter(res -> res.getCreatedAt() != null && res.getCreatedAt().isAfter(threshold))
                .collect(Collectors.toList());

        List<CollaborationProposal> periodProposals = allCollabProposals.stream()
                .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().isAfter(threshold))
                .collect(Collectors.toList());

        // Converted POs generated on buyer side for this supplier
        List<Requisition> periodConvertedPos = allReqs.stream()
                .filter(r -> r.getCollaborationRequisitionId() != null && r.getCreatedAt() != null && r.getCreatedAt().isAfter(threshold))
                .collect(Collectors.toList());

        Map<UUID, User> collabBuyerMap = new HashMap<>();
        Map<UUID, int[]> collabCounts = new HashMap<>(); // [totalRequests, approved, declined, proposals, convertedToPo]

        for (CollaborationRequisition cr : periodCollabs) {
            User buyer = cr.getBuyer();
            if (buyer == null) continue;
            collabBuyerMap.put(buyer.getId(), buyer);
            collabCounts.computeIfAbsent(buyer.getId(), k -> new int[5])[0]++;
        }

        for (CollaborationSupplierResponse resp : periodResponses) {
            if (resp.getCollaborationRequisition() != null && resp.getCollaborationRequisition().getBuyer() != null) {
                User buyer = resp.getCollaborationRequisition().getBuyer();
                collabBuyerMap.put(buyer.getId(), buyer);
                int[] c = collabCounts.computeIfAbsent(buyer.getId(), k -> new int[5]);
                if ("Accepted".equalsIgnoreCase(resp.getStatus())) {
                    c[1]++;
                } else if ("Declined".equalsIgnoreCase(resp.getStatus())) {
                    c[2]++;
                }
            }
        }

        for (CollaborationProposal prop : periodProposals) {
            if (prop.getCollaborationRequisition() != null && prop.getCollaborationRequisition().getBuyer() != null) {
                User buyer = prop.getCollaborationRequisition().getBuyer();
                collabBuyerMap.put(buyer.getId(), buyer);
                collabCounts.computeIfAbsent(buyer.getId(), k -> new int[5])[3]++;
            }
        }

        for (Requisition po : periodConvertedPos) {
            if (po.getBuyer() != null) {
                User buyer = po.getBuyer();
                collabBuyerMap.put(buyer.getId(), buyer);
                collabCounts.computeIfAbsent(buyer.getId(), k -> new int[5])[4]++;
            }
        }

        List<BuyerCollaborationItem> buyerCollabList = new ArrayList<>();
        int totalCollabApproved = 0;
        int totalCollabDeclined = 0;
        int totalCollabProposals = 0;
        int totalCollabConvertedToPo = 0;

        for (Map.Entry<UUID, int[]> entry : collabCounts.entrySet()) {
            UUID buyerId = entry.getKey();
            int[] c = entry.getValue();
            User buyer = collabBuyerMap.get(buyerId);

            BuyerCollaborationItem item = new BuyerCollaborationItem();
            item.setBuyerId(buyerId);
            item.setBuyerName(getBuyerDisplayName(buyer));
            item.setBuyerEmail(buyer != null ? buyer.getEmail() : "");
            item.setTotalRequests(c[0]);
            item.setApprovedCount(c[1]);
            item.setDeclinedCount(c[2]);
            item.setProposalsCount(c[3]);
            item.setConvertedToPoCount(c[4]);

            int denominator = c[1] + c[3]; // Approved requests + Proposals
            if (denominator == 0) denominator = c[0]; // fallback to total requests
            double convRate = denominator > 0 ? Math.min(100.0, (c[4] * 100.0 / denominator)) : 0.0;
            item.setConversionRatePercent(Math.round(convRate * 10.0) / 10.0);

            buyerCollabList.add(item);
            totalCollabApproved += c[1];
            totalCollabDeclined += c[2];
            totalCollabProposals += c[3];
            totalCollabConvertedToPo += c[4];
        }

        buyerCollabList.sort((a, b) -> Integer.compare(b.getTotalRequests(), a.getTotalRequests()));
        data.setBuyerCollaborationRequests(buyerCollabList);

        // Collaboration Status Distribution for Pie Chart
        int totalCollabAll = totalCollabApproved + totalCollabDeclined + totalCollabProposals + totalCollabConvertedToPo;
        List<ChartDistributionItem> collabPie = new ArrayList<>();
        if (totalCollabAll > 0) {
            collabPie.add(new ChartDistributionItem("Converted to PO", totalCollabConvertedToPo, Math.round((totalCollabConvertedToPo * 100.0 / totalCollabAll) * 10.0) / 10.0, "#6366f1"));
            collabPie.add(new ChartDistributionItem("Accepted", totalCollabApproved, Math.round((totalCollabApproved * 100.0 / totalCollabAll) * 10.0) / 10.0, "#10b981"));
            collabPie.add(new ChartDistributionItem("Proposals Submitted", totalCollabProposals, Math.round((totalCollabProposals * 100.0 / totalCollabAll) * 10.0) / 10.0, "#3b82f6"));
            collabPie.add(new ChartDistributionItem("Declined", totalCollabDeclined, Math.round((totalCollabDeclined * 100.0 / totalCollabAll) * 10.0) / 10.0, "#ef4444"));
        }
        data.setCollabStatusDistribution(collabPie);

        return data;
    }

    private ReceiptsSection buildSupplierReceiptsSection(List<PurchaseReceipt> allReceipts) {
        ReceiptsSection section = new ReceiptsSection();

        List<PurchaseReceipt> zeroList = new ArrayList<>();
        List<PurchaseReceipt> greaterList = new ArrayList<>();

        for (PurchaseReceipt r : allReceipts) {
            int pending = r.getPendingQuantity() != null ? r.getPendingQuantity() : 0;
            if (pending == 0) {
                zeroList.add(r);
            } else {
                greaterList.add(r);
            }
        }

        // Subgroup 1: All Items Delivered (Pending = 0)
        ReceiptSubGroup zeroGroup = buildReceiptSubGroup(zeroList, false);
        section.setAllDeliveredReceipts(zeroGroup);

        // Subgroup 2: Pending Quantity > 0
        ReceiptSubGroup greaterGroup = buildReceiptSubGroup(greaterList, true);
        section.setPendingQuantityReceipts(greaterGroup);

        // Donut: Distribution of All Items Delivered vs Partial Delivery
        int totalReceipts = allReceipts.size();
        List<ChartDistributionItem> dist = new ArrayList<>();
        if (totalReceipts > 0) {
            dist.add(new ChartDistributionItem("All Items Delivered (Pending = 0)", zeroList.size(),
                    Math.round((zeroList.size() * 100.0 / totalReceipts) * 10.0) / 10.0, "#10b981"));
            dist.add(new ChartDistributionItem("Partial Delivery (Pending > 0)", greaterList.size(),
                    Math.round((greaterList.size() * 100.0 / totalReceipts) * 10.0) / 10.0, "#f59e0b"));
        }
        section.setReceiptDistribution(dist);

        return section;
    }

    private ReceiptSubGroup buildReceiptSubGroup(List<PurchaseReceipt> receipts, boolean hasPendingQuantity) {
        ReceiptSubGroup group = new ReceiptSubGroup();
        Map<UUID, User> buyerMap = new HashMap<>();
        Map<UUID, int[]> buyerStats = new HashMap<>(); // [total, approved, pendingApproval, totalPendingQty]

        for (PurchaseReceipt r : receipts) {
            User buyer = r.getBuyer();
            if (buyer == null) continue;
            buyerMap.put(buyer.getId(), buyer);
            int[] s = buyerStats.computeIfAbsent(buyer.getId(), k -> new int[4]);
            s[0]++; // total

            boolean isApproved = "Approved".equalsIgnoreCase(r.getSupplierApprovalStatus());
            if (isApproved) {
                s[1]++;
            } else {
                s[2]++;
            }
            if (hasPendingQuantity && r.getPendingQuantity() != null) {
                s[3] += r.getPendingQuantity();
            }
        }

        List<BuyerReceiptItem> list = new ArrayList<>();
        int totalAll = 0;
        int approvedAll = 0;
        int pendingApprovalAll = 0;
        int totalPendingQtyAll = 0;

        for (Map.Entry<UUID, int[]> entry : buyerStats.entrySet()) {
            UUID buyerId = entry.getKey();
            int[] s = entry.getValue();
            User buyer = buyerMap.get(buyerId);

            BuyerReceiptItem item = new BuyerReceiptItem();
            item.setBuyerId(buyerId);
            item.setBuyerName(getBuyerDisplayName(buyer));
            item.setBuyerEmail(buyer != null ? buyer.getEmail() : "");
            item.setTotalReceipts(s[0]);
            item.setApprovedCount(s[1]);
            item.setPendingApprovalCount(s[2]);
            item.setPendingQuantity(s[3]);
            double rate = s[0] > 0 ? (s[1] * 100.0 / s[0]) : 0.0;
            item.setApprovalRatePercent(Math.round(rate * 10.0) / 10.0);

            list.add(item);
            totalAll += s[0];
            approvedAll += s[1];
            pendingApprovalAll += s[2];
            totalPendingQtyAll += s[3];
        }

        list.sort((a, b) -> Integer.compare(b.getTotalReceipts(), a.getTotalReceipts()));
        group.setBuyerStats(list);
        group.setTotalReceipts(totalAll);
        group.setApprovedCount(approvedAll);
        group.setPendingApprovalCount(pendingApprovalAll);
        group.setTotalPendingQuantity(totalPendingQtyAll);
        double overallRate = totalAll > 0 ? (approvedAll * 100.0 / totalAll) : 0.0;
        group.setApprovalRatePercent(Math.round(overallRate * 10.0) / 10.0);

        List<ChartDistributionItem> pie = new ArrayList<>();
        if (totalAll > 0) {
            pie.add(new ChartDistributionItem("Approved", approvedAll, Math.round((approvedAll * 100.0 / totalAll) * 10.0) / 10.0, "#10b981"));
            pie.add(new ChartDistributionItem("Pending Confirmation", pendingApprovalAll, Math.round((pendingApprovalAll * 100.0 / totalAll) * 10.0) / 10.0, "#f59e0b"));
        }
        group.setApprovalDistribution(pie);

        return group;
    }

    private InvoiceAndPaymentsSection buildSupplierInvoiceAndPaymentsSection(List<Requisition> allReqs,
                                                                             List<Invoice> allInvoices,
                                                                             List<Payment> allPayments) {
        InvoiceAndPaymentsSection section = new InvoiceAndPaymentsSection();

        Map<UUID, User> buyerMap = new HashMap<>();
        Map<UUID, Integer> poCountMap = new HashMap<>();
        Map<UUID, BigDecimal> poAmountMap = new HashMap<>();
        Map<UUID, Integer> invCountMap = new HashMap<>();
        Map<UUID, BigDecimal> invAmountMap = new HashMap<>();
        Map<UUID, Integer> payCountMap = new HashMap<>();
        Map<UUID, BigDecimal> payAmountMap = new HashMap<>();

        for (Requisition r : allReqs) {
            if ("Cancelled".equalsIgnoreCase(r.getStatus())) continue;
            User buyer = r.getBuyer();
            if (buyer == null) continue;
            buyerMap.put(buyer.getId(), buyer);
            poCountMap.merge(buyer.getId(), 1, (a, b) -> a + b);
            BigDecimal amt = calculatePoTotalAmount(r);
            poAmountMap.merge(buyer.getId(), amt, (a, b) -> a.add(b));
        }

        for (Invoice inv : allInvoices) {
            User buyer = inv.getBuyer();
            if (buyer == null) continue;
            buyerMap.put(buyer.getId(), buyer);
            invCountMap.merge(buyer.getId(), 1, (a, b) -> a + b);
            BigDecimal amt = inv.getTotalAmount() != null ? inv.getTotalAmount() : BigDecimal.ZERO;
            invAmountMap.merge(buyer.getId(), amt, (a, b) -> a.add(b));
        }

        for (Payment pay : allPayments) {
            User buyer = pay.getBuyer();
            if (buyer == null) continue;
            buyerMap.put(buyer.getId(), buyer);
            if ("Paid".equalsIgnoreCase(pay.getPaymentStatus())) {
                payCountMap.merge(buyer.getId(), 1, (a, b) -> a + b);
                BigDecimal amt = pay.getAmountToPay() != null ? pay.getAmountToPay() : BigDecimal.ZERO;
                payAmountMap.merge(buyer.getId(), amt, (a, b) -> a.add(b));
            }
        }

        // PO vs Invoices List
        List<BuyerPoVsInvoiceItem> poVsInvList = new ArrayList<>();
        int totalPoAll = 0;
        int totalInvAll = 0;

        for (UUID buyerId : buyerMap.keySet()) {
            User buyer = buyerMap.get(buyerId);
            int poC = poCountMap.getOrDefault(buyerId, 0);
            BigDecimal poA = poAmountMap.getOrDefault(buyerId, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            int invC = invCountMap.getOrDefault(buyerId, 0);
            BigDecimal invA = invAmountMap.getOrDefault(buyerId, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

            BuyerPoVsInvoiceItem item = new BuyerPoVsInvoiceItem();
            item.setBuyerId(buyerId);
            item.setBuyerName(getBuyerDisplayName(buyer));
            item.setBuyerEmail(buyer != null ? buyer.getEmail() : "");
            item.setPoCount(poC);
            item.setPoTotalAmount(poA);
            item.setInvoicesCreatedCount(invC);
            item.setInvoicesTotalAmount(invA);
            double rate = poC > 0 ? Math.min(100.0, (invC * 100.0 / poC)) : (invC > 0 ? 100.0 : 0.0);
            item.setInvoicingRatePercent(Math.round(rate * 10.0) / 10.0);

            poVsInvList.add(item);
            totalPoAll += poC;
            totalInvAll += invC;
        }

        poVsInvList.sort((a, b) -> Integer.compare(b.getPoCount(), a.getPoCount()));
        section.setBuyerPoVsInvoices(poVsInvList);

        // Invoices vs Payments List
        List<BuyerInvoiceVsPaymentItem> invVsPayList = new ArrayList<>();
        BigDecimal totalInvoicedAll = BigDecimal.ZERO;
        BigDecimal totalPaidAll = BigDecimal.ZERO;

        for (UUID buyerId : buyerMap.keySet()) {
            User buyer = buyerMap.get(buyerId);
            int invC = invCountMap.getOrDefault(buyerId, 0);
            BigDecimal invA = invAmountMap.getOrDefault(buyerId, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
            int payC = payCountMap.getOrDefault(buyerId, 0);
            BigDecimal payA = payAmountMap.getOrDefault(buyerId, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);

            BigDecimal due = invA.subtract(payA);
            if (due.compareTo(BigDecimal.ZERO) < 0) due = BigDecimal.ZERO;

            BuyerInvoiceVsPaymentItem item = new BuyerInvoiceVsPaymentItem();
            item.setBuyerId(buyerId);
            item.setBuyerName(getBuyerDisplayName(buyer));
            item.setBuyerEmail(buyer != null ? buyer.getEmail() : "");
            item.setInvoicesCount(invC);
            item.setInvoicesTotalAmount(invA);
            item.setPaymentsReceivedCount(payC);
            item.setPaymentsReceivedAmount(payA);
            item.setDueAmount(due.setScale(2, RoundingMode.HALF_UP));

            double rate = invA.compareTo(BigDecimal.ZERO) > 0
                    ? Math.min(100.0, payA.multiply(BigDecimal.valueOf(100)).divide(invA, 2, RoundingMode.HALF_UP).doubleValue())
                    : (payA.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0);
            item.setPaymentSettlementRatePercent(Math.round(rate * 10.0) / 10.0);

            invVsPayList.add(item);
            totalInvoicedAll = totalInvoicedAll.add(invA);
            totalPaidAll = totalPaidAll.add(payA);
        }

        invVsPayList.sort((a, b) -> b.getInvoicesTotalAmount().compareTo(a.getInvoicesTotalAmount()));
        section.setBuyerInvoiceVsPayments(invVsPayList);

        // Pie 1: PO Invoicing Distribution
        List<ChartDistributionItem> poPie = new ArrayList<>();
        if (totalPoAll > 0) {
            int invoicedPos = Math.min(totalPoAll, totalInvAll);
            int pendingInvoicing = Math.max(0, totalPoAll - invoicedPos);
            poPie.add(new ChartDistributionItem("Invoiced POs", invoicedPos, Math.round((invoicedPos * 100.0 / totalPoAll) * 10.0) / 10.0, "#6366f1"));
            poPie.add(new ChartDistributionItem("Pending Invoicing", pendingInvoicing, Math.round((pendingInvoicing * 100.0 / totalPoAll) * 10.0) / 10.0, "#f59e0b"));
        }
        section.setPoInvoicingDistribution(poPie);

        // Pie 2: Payment Status Distribution
        List<ChartDistributionItem> payPie = new ArrayList<>();
        if (totalInvoicedAll.compareTo(BigDecimal.ZERO) > 0) {
            double paidPct = totalPaidAll.multiply(BigDecimal.valueOf(100)).divide(totalInvoicedAll, 2, RoundingMode.HALF_UP).doubleValue();
            paidPct = Math.min(100.0, Math.max(0.0, paidPct));
            double duePct = Math.max(0.0, 100.0 - paidPct);

            payPie.add(new ChartDistributionItem("Paid Amount", totalPaidAll.doubleValue(), Math.round(paidPct * 10.0) / 10.0, "#10b981"));
            BigDecimal dueAmt = totalInvoicedAll.subtract(totalPaidAll);
            if (dueAmt.compareTo(BigDecimal.ZERO) < 0) dueAmt = BigDecimal.ZERO;
            payPie.add(new ChartDistributionItem("Outstanding Due", dueAmt.doubleValue(), Math.round(duePct * 10.0) / 10.0, "#ef4444"));
        }
        section.setPaymentStatusDistribution(payPie);

        return section;
    }

    private DashboardSummary buildSupplierSummary(List<Requisition> allReqs,
                                                  List<CollaborationRequisition> allCollabReqs,
                                                  List<CollaborationSupplierResponse> allCollabResponses,
                                                  List<CollaborationProposal> allCollabProposals,
                                                  List<PurchaseReceipt> allReceipts,
                                                  List<Invoice> allInvoices,
                                                  List<Payment> allPayments) {
        DashboardSummary summary = new DashboardSummary();

        // 1. PR stats
        int prTotal = 0;
        int prApproved = 0;
        int prDeclined = 0;
        for (Requisition r : allReqs) {
            if (r.getCollaborationRequisitionId() != null) continue;
            prTotal++;
            String status = r.getStatus() != null ? r.getStatus().trim() : "";
            if ("PO Accepted".equalsIgnoreCase(status) || "PO".equalsIgnoreCase(status)) {
                prApproved++;
            } else if ("Declined".equalsIgnoreCase(status)) {
                prDeclined++;
            }
        }
        summary.setTotalPurchaseRequests(prTotal);
        summary.setApprovedPurchaseRequests(prApproved);
        summary.setDeclinedPurchaseRequests(prDeclined);
        summary.setPrApprovalRate(prTotal > 0 ? Math.round((prApproved * 100.0 / prTotal) * 10.0) / 10.0 : 0.0);

        // 2. Collab stats
        int collabTotal = allCollabReqs.size();
        int collabApproved = 0;
        int collabDeclined = 0;
        for (CollaborationSupplierResponse resp : allCollabResponses) {
            if ("Accepted".equalsIgnoreCase(resp.getStatus())) collabApproved++;
            else if ("Declined".equalsIgnoreCase(resp.getStatus())) collabDeclined++;
        }
        int proposals = allCollabProposals.size();
        int convertedPo = (int) allReqs.stream().filter(r -> r.getCollaborationRequisitionId() != null).count();

        summary.setTotalCollaborationRequests(collabTotal);
        summary.setApprovedCollaborationRequests(collabApproved);
        summary.setDeclinedCollaborationRequests(collabDeclined);
        summary.setProposalsSubmitted(proposals);
        summary.setConvertedToPoCount(convertedPo);
        int denom = collabApproved + proposals;
        if (denom == 0) denom = collabTotal;
        summary.setCollabConversionRate(denom > 0 ? Math.min(100.0, Math.round((convertedPo * 100.0 / denom) * 10.0) / 10.0) : 0.0);

        // 3. Receipts stats
        int receiptsTotal = allReceipts.size();
        int pendingZeroCount = 0;
        int pendingZeroApproved = 0;
        int pendingGreaterCount = 0;
        int pendingGreaterApproved = 0;

        for (PurchaseReceipt r : allReceipts) {
            int pending = r.getPendingQuantity() != null ? r.getPendingQuantity() : 0;
            boolean approved = "Approved".equalsIgnoreCase(r.getSupplierApprovalStatus());
            if (pending == 0) {
                pendingZeroCount++;
                if (approved) pendingZeroApproved++;
            } else {
                pendingGreaterCount++;
                if (approved) pendingGreaterApproved++;
            }
        }
        summary.setTotalReceipts(receiptsTotal);
        summary.setPendingZeroReceipts(pendingZeroCount);
        summary.setPendingZeroApprovedRate(pendingZeroCount > 0 ? Math.round((pendingZeroApproved * 100.0 / pendingZeroCount) * 10.0) / 10.0 : 0.0);
        summary.setPendingGreaterThanZeroReceipts(pendingGreaterCount);
        summary.setPendingGreaterThanZeroApprovedRate(pendingGreaterCount > 0 ? Math.round((pendingGreaterApproved * 100.0 / pendingGreaterCount) * 10.0) / 10.0 : 0.0);

        // 4. Invoices & Payments stats
        int poCount = 0;
        BigDecimal poAmount = BigDecimal.ZERO;
        for (Requisition r : allReqs) {
            if (!"Cancelled".equalsIgnoreCase(r.getStatus())) {
                poCount++;
                poAmount = poAmount.add(calculatePoTotalAmount(r));
            }
        }
        summary.setTotalPos(poCount);
        summary.setTotalPoAmount(poAmount.setScale(2, RoundingMode.HALF_UP));

        int invCount = allInvoices.size();
        BigDecimal invAmount = allInvoices.stream()
                .map(i -> i.getTotalAmount() != null ? i.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));
        summary.setTotalInvoices(invCount);
        summary.setTotalInvoicedAmount(invAmount.setScale(2, RoundingMode.HALF_UP));

        int payCount = (int) allPayments.stream()
                .filter(p -> "Paid".equalsIgnoreCase(p.getPaymentStatus()))
                .count();
        BigDecimal payAmount = allPayments.stream()
                .filter(p -> "Paid".equalsIgnoreCase(p.getPaymentStatus()))
                .map(p -> p.getAmountToPay() != null ? p.getAmountToPay() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));
        summary.setTotalPaymentsReceived(payCount);
        summary.setTotalPaidAmount(payAmount.setScale(2, RoundingMode.HALF_UP));

        return summary;
    }
}
