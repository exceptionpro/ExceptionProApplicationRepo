package com.exceptionpro.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.exceptionpro.dto.PaymentResponse;
import com.exceptionpro.dto.PaymentSaveRequest;
import com.exceptionpro.dto.PaymentStatusUpdateRequest;
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

@Service
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final RequisitionRepository requisitionRepository;
    private final PurchaseReceiptRepository purchaseReceiptRepository;
    private final InvoiceRepository invoiceRepository;
    private final ReconciliationRepository reconciliationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ReconciliationService reconciliationService;

    public PaymentService(PaymentRepository paymentRepository,
                          RequisitionRepository requisitionRepository,
                          PurchaseReceiptRepository purchaseReceiptRepository,
                          InvoiceRepository invoiceRepository,
                          ReconciliationRepository reconciliationRepository,
                          UserRepository userRepository,
                          NotificationService notificationService,
                          ReconciliationService reconciliationService) {
        this.paymentRepository = paymentRepository;
        this.requisitionRepository = requisitionRepository;
        this.purchaseReceiptRepository = purchaseReceiptRepository;
        this.invoiceRepository = invoiceRepository;
        this.reconciliationRepository = reconciliationRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.reconciliationService = reconciliationService;
    }

    public synchronized String generateUniquePaymentId() {
        long count = paymentRepository.count() + 1;
        String id = String.format("PAY-%06d", count);
        long offset = 1;
        while (paymentRepository.findByPaymentId(id).isPresent()) {
            id = String.format("PAY-%06d", count + offset);
            offset++;
        }
        return id;
    }

    public List<PaymentResponse> getPaymentsForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String accType = user.getAccountType() != null ? user.getAccountType().toLowerCase().trim() : "";
        if (accType.contains("supplier")) {
            return getSupplierPayments(user);
        } else {
            return getBuyerPayments(userEmail);
        }
    }

    public List<PaymentResponse> getSupplierPayments(User supplier) {
        // 1. Sync real requisitions where supplier matches
        syncRealSupplierRequisitions(supplier);

        // Reload payments
        List<Payment> savedPayments = paymentRepository.findBySupplierIdOrderByCreatedAtDesc(supplier.getId());

        // 2. If no payments exist, initialize with the exact specified sample records
        if (savedPayments.isEmpty()) {
            initSupplierSamplePayments(supplier);
            savedPayments = paymentRepository.findBySupplierIdOrderByCreatedAtDesc(supplier.getId());
        }

        // Return ordered by paymentId / creation
        return savedPayments.stream()
                .sorted((a, b) -> (a.getPaymentId() != null && b.getPaymentId() != null) ? a.getPaymentId().compareTo(b.getPaymentId()) : 0)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<PaymentResponse> getBuyerPayments(String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        // 1. Synchronize real requisitions and invoices into payment records if they exist
        syncRealBuyerRequisitions(buyer);

        // Reload payments after synchronization
        List<Payment> savedPayments = paymentRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());

        // 2. If still no payments exist, initialize with realistic sample records
        if (savedPayments.isEmpty()) {
            initSamplePayments(buyer);
            savedPayments = paymentRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        }

        return savedPayments.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Checks if a standard Purchase Order has reconciled successfully (3-way/4-way match).
     * The overall result must be "MATCHED".
     */
    public boolean isReconciledSuccessfully(Requisition req) {
        if (req == null) {
            return false;
        }

        // 1. Try to evaluate reconciliation result dynamically
        try {
            ReconciliationResponse reconResp = reconciliationService.getReconciliationForStandardRequisition(req);
            if (reconResp != null && "MATCHED".equalsIgnoreCase(reconResp.getOverallResult())) {
                return true;
            }
        } catch (Exception ignored) {}

        // 2. Check saved reconciliation in database as fallback
        Optional<Reconciliation> savedRecon = reconciliationRepository.findByRequisitionId(req.getId());
        if (savedRecon.isPresent()) {
            Reconciliation recon = savedRecon.get();
            String overall = recon.getOverallResult() != null ? recon.getOverallResult() : recon.getStatus();
            return "MATCHED".equalsIgnoreCase(overall);
        }

        return false;
    }

    private void syncRealBuyerRequisitions(User buyer) {
        List<Requisition> buyerReqs = requisitionRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        if (buyerReqs.isEmpty()) {
            return;
        }

        List<PurchaseReceipt> allReceipts = purchaseReceiptRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        List<Invoice> allInvoices = invoiceRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        List<Reconciliation> allReconciliations = reconciliationRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());

        for (Requisition req : buyerReqs) {
            int num = (req.getReqNumber() != null) ? req.getReqNumber().intValue() : 1;
            String poNumber = String.format("PO%02d", num);

            // Check if payment already exists for this requisition
            Optional<Payment> existingOpt = paymentRepository.findByPoNumber(poNumber)
                    .or(() -> paymentRepository.findAll().stream()
                            .filter(p -> p.getBuyer() != null && p.getBuyer().getId().equals(buyer.getId()) &&
                                    p.getRequisition() != null && p.getRequisition().getId().equals(req.getId()))
                            .findFirst());

            // Condition: The Purchase Orders which have Reconciled successfully only those Purchase Orders the Payment Id should be generated.
            boolean reconciled = isReconciledSuccessfully(req);
            if (!reconciled) {
                // If an existing payment was previously created without being paid, delete it so no unauthorized Payment ID exists.
                if (existingOpt.isPresent()) {
                    Payment existingPayment = existingOpt.get();
                    if (!"Paid".equalsIgnoreCase(existingPayment.getPaymentStatus())) {
                        paymentRepository.delete(existingPayment);
                    }
                }
                continue;
            }

            Payment payment;
            if (existingOpt.isPresent()) {
                payment = existingOpt.get();
                if (payment.getPaymentId() == null || payment.getPaymentId().isBlank()) {
                    payment.setPaymentId(generateUniquePaymentId());
                }
            } else {
                payment = new Payment();
                payment.setId(UUID.randomUUID());
                payment.setPaymentId(generateUniquePaymentId());
                payment.setPaymentDate(LocalDate.now());
                payment.setPaymentStatus("Payment Due");
                payment.setCreatedAt(LocalDateTime.now());
            }

            // Find matching receipts and invoices
            List<PurchaseReceipt> reqReceipts = allReceipts.stream()
                    .filter(rc -> rc.getPurchaseOrder() != null && rc.getPurchaseOrder().getId().equals(req.getId()))
                    .collect(Collectors.toList());

            List<Invoice> reqInvoices = allInvoices.stream()
                    .filter(inv -> inv.getRequisition() != null && inv.getRequisition().getId().equals(req.getId()))
                    .collect(Collectors.toList());

            payment.setBuyer(buyer);
            payment.setBuyerName(getUserDisplayName(buyer));
            payment.setRequisition(req);
            payment.setPoNumber(poNumber);

            if (req.getSupplier() != null) {
                payment.setSupplier(req.getSupplier());
                payment.setSupplierName(getUserDisplayName(req.getSupplier()));
            } else if (payment.getSupplierName() == null || payment.getSupplierName().isBlank()) {
                payment.setSupplierName("ABC Technologies Pvt Ltd");
            }

            // 1. Calculate PO totals (from Specific Purchase Order)
            int poQty = 0;
            BigDecimal poAmount = BigDecimal.ZERO;
            if (req.getItems() != null) {
                for (RequisitionItem item : req.getItems()) {
                    int q = (item.getQuantity() != null) ? item.getQuantity().intValue() : 0;
                    BigDecimal price = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
                    poQty += q;
                    poAmount = poAmount.add(price.multiply(BigDecimal.valueOf(q)));
                }
            }
            payment.setPoQuantity(poQty);
            payment.setPoAmount(poAmount.setScale(2, RoundingMode.HALF_UP));
            payment.setPoUnitPrice(poQty > 0 ? poAmount.divide(BigDecimal.valueOf(poQty), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO);

            // 2. Purchase Receipt info (created based on selected Specific Purchase Order)
            // Requirement 2: Receipt Amount should be "Received Quantity * PO Price"
            if (!reqReceipts.isEmpty()) {
                PurchaseReceipt firstRc = reqReceipts.get(0);
                payment.setPurchaseReceipt(firstRc);
                payment.setReceiptNumber(firstRc.getReceiptNo() != null ? firstRc.getReceiptNo() : "REC-001");
                payment.setReceiptDate(firstRc.getReceiptDate() != null ? firstRc.getReceiptDate() : LocalDate.now());
                int recQty = reqReceipts.stream().mapToInt(r -> (r.getReceivedQuantity() != null) ? r.getReceivedQuantity().intValue() : (r.getQuantity() != null ? r.getQuantity().intValue() : 0)).sum();
                payment.setReceivedQuantity(recQty);
                payment.setReceivedAmount(payment.getPoUnitPrice().multiply(BigDecimal.valueOf(recQty)).setScale(2, RoundingMode.HALF_UP));
            } else {
                if (payment.getReceiptNumber() == null || payment.getReceiptNumber().isBlank()) {
                    payment.setReceiptNumber("REC-" + String.format("%03d", num));
                }
                if (payment.getReceiptDate() == null) {
                    payment.setReceiptDate(LocalDate.now());
                }
                int recQty = payment.getReceivedQuantity() != null && payment.getReceivedQuantity() > 0 ? payment.getReceivedQuantity() : poQty;
                payment.setReceivedQuantity(recQty);
                payment.setReceivedAmount(payment.getPoUnitPrice().multiply(BigDecimal.valueOf(recQty)).setScale(2, RoundingMode.HALF_UP));
            }

            // 3. Invoice info (created on specific Purchase Order)
            // Requirement 3: In Invoices, PO Quantity * Price provides PO Amount, for this PO Amount, Tax will be Added.
            // (PO Amount * Percentage of Tax)/100. So Invoice quantity should be same as PO Quantity!
            if (!reqInvoices.isEmpty()) {
                Invoice firstInv = reqInvoices.get(0);
                payment.setInvoice(firstInv);
                payment.setInvoiceNumber(firstInv.getInvoiceNumber());
                payment.setInvoiceDate(firstInv.getInvoiceDate());
                payment.setInvoiceAmount(firstInv.getTotalAmount());
                payment.setInvoiceQuantity(poQty);
                payment.setInvoiceUnitPrice(payment.getPoUnitPrice());
            } else {
                if (payment.getInvoiceNumber() == null || payment.getInvoiceNumber().isBlank()) {
                    payment.setInvoiceNumber("INV-2026-" + String.format("%04d", num + 100));
                }
                if (payment.getInvoiceDate() == null) {
                    payment.setInvoiceDate(LocalDate.now());
                }
                payment.setInvoiceQuantity(poQty);
                payment.setInvoiceUnitPrice(payment.getPoUnitPrice());
                if (payment.getInvoiceAmount() == null || payment.getInvoiceAmount().compareTo(BigDecimal.ZERO) == 0) {
                    payment.setInvoiceAmount(poAmount);
                }
            }

            // 4. Reconciliation (3-Way Match)
            // Requirement 4: It should be populated from the Reconciliation.
            // Expected Result: If Reconciliation has matched for Quantity Reconciliation, Price Reconciliation,
            // Amount Reconciliation, Tax Reconciliation then the same should be matched in Payments -> RECONCILIATION (3-WAY MATCH).
            ReconciliationResponse reconResp = null;
            try {
                reconResp = reconciliationService.getReconciliationForStandardRequisition(req);
            } catch (Exception e) {
                // ignore
            }

            if (reconResp != null) {
                if (reconResp.getId() != null) {
                    reconciliationRepository.findById(Objects.requireNonNull(reconResp.getId())).ifPresent(payment::setReconciliation);
                }
                String rStatus = reconResp.getOverallResult() != null ? reconResp.getOverallResult() : "MATCHED";
                if ("MATCHED".equalsIgnoreCase(rStatus)) {
                    payment.setReconciliationStatus("Matched");
                    payment.setExceptionReason(null);
                } else {
                    payment.setReconciliationStatus("Exception");
                    payment.setExceptionReason(reconResp.getRemarks() != null && !reconResp.getRemarks().isBlank()
                            ? reconResp.getRemarks()
                            : "Variance detected during 3-way reconciliation match.");
                }
            } else {
                Optional<Reconciliation> matchedRecon = allReconciliations.stream()
                        .filter(rc -> (rc.getRequisition() != null && rc.getRequisition().getId().equals(req.getId())) ||
                                (rc.getPoNumber() != null && rc.getPoNumber().equalsIgnoreCase(poNumber)))
                        .findFirst();

                if (matchedRecon.isPresent()) {
                    Reconciliation recon = matchedRecon.get();
                    payment.setReconciliation(recon);
                    String rStatus = recon.getOverallResult() != null ? recon.getOverallResult() : recon.getStatus();
                    if ("MATCHED".equalsIgnoreCase(rStatus)) {
                        payment.setReconciliationStatus("Matched");
                        payment.setExceptionReason(null);
                    } else if ("EXCEPTION".equalsIgnoreCase(rStatus)) {
                        payment.setReconciliationStatus("Exception");
                    } else {
                        payment.setReconciliationStatus(rStatus);
                    }
                    if (recon.getRemarks() != null && !recon.getRemarks().isBlank()) {
                        payment.setExceptionReason(recon.getRemarks());
                    } else if ("Exception".equalsIgnoreCase(payment.getReconciliationStatus())) {
                        payment.setExceptionReason("Variance detected during 3-way reconciliation match.");
                    } else {
                        payment.setExceptionReason(null);
                    }
                } else {
                    // 3-Way Match evaluation fallback
                    boolean qtyMatch = payment.getPoQuantity().equals(payment.getReceivedQuantity()) && payment.getReceivedQuantity().equals(payment.getInvoiceQuantity());
                    boolean priceMatch = payment.getPoUnitPrice().compareTo(payment.getInvoiceUnitPrice()) == 0;
                    boolean amtMatch = payment.getPoAmount().compareTo(payment.getReceivedAmount()) == 0;

                    if (qtyMatch && priceMatch && amtMatch) {
                        payment.setReconciliationStatus("Matched");
                        payment.setExceptionReason(null);
                    } else {
                        payment.setReconciliationStatus("Exception");
                        if (!qtyMatch) {
                            payment.setExceptionReason("Invoice quantity (" + payment.getInvoiceQuantity() + ") does not match received quantity (" + payment.getReceivedQuantity() + ").");
                        } else if (!priceMatch) {
                            payment.setExceptionReason("Invoice unit price differs from Purchase Order unit price.");
                        } else {
                            payment.setExceptionReason("Amount variance detected between Purchase Order, Receipt, and Invoice.");
                        }
                    }
                }
            }

            // Update payment status (preserve "Paid" if already paid)
            if (!"Paid".equalsIgnoreCase(payment.getPaymentStatus())) {
                if ("Exception".equalsIgnoreCase(payment.getReconciliationStatus())) {
                    payment.setPaymentStatus("On Hold");
                } else {
                    payment.setPaymentStatus("Payment Due");
                }
            }

            payment.setAmountToPay(payment.getInvoiceAmount());
            payment.setCurrency("INR");
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);
        }
    }

    private void syncRealSupplierRequisitions(User supplier) {
        List<Requisition> suppReqs = requisitionRepository.findAll().stream()
                .filter(r -> r.getSupplier() != null && r.getSupplier().getId().equals(supplier.getId()))
                .collect(Collectors.toList());
        if (suppReqs.isEmpty()) {
            return;
        }

        List<PurchaseReceipt> allReceipts = purchaseReceiptRepository.findAll().stream()
                .filter(r -> r.getReceivedFromSupplier() != null && r.getReceivedFromSupplier().getId().equals(supplier.getId()))
                .collect(Collectors.toList());
        List<Invoice> allInvoices = invoiceRepository.findAll().stream()
                .filter(i -> i.getSupplier() != null && i.getSupplier().getId().equals(supplier.getId()))
                .collect(Collectors.toList());

        for (Requisition req : suppReqs) {
            int num = (req.getReqNumber() != null) ? req.getReqNumber().intValue() : 1;
            String poNumber = String.format("PO%02d", num);

            Optional<Payment> existingOpt = paymentRepository.findAll().stream()
                    .filter(p -> p.getSupplier() != null && p.getSupplier().getId().equals(supplier.getId()) &&
                            ((p.getRequisition() != null && p.getRequisition().getId().equals(req.getId())) ||
                                    (p.getPoNumber() != null && p.getPoNumber().equalsIgnoreCase(poNumber))))
                    .findFirst();

            if (existingOpt.isPresent()) {
                continue;
            }

            Payment payment = new Payment();
            payment.setId(UUID.randomUUID());
            payment.setPaymentId(generateUniquePaymentId());
            payment.setPaymentDate(LocalDate.now());
            payment.setSupplier(supplier);
            payment.setSupplierName(getUserDisplayName(supplier));
            payment.setBuyer(req.getBuyer());
            payment.setBuyerName(req.getBuyer() != null ? getUserDisplayName(req.getBuyer()) : "Enterprise Buyer");
            payment.setRequisition(req);
            payment.setPoNumber(poNumber);

            int poQty = 0;
            BigDecimal poAmount = BigDecimal.ZERO;
            if (req.getItems() != null) {
                for (RequisitionItem item : req.getItems()) {
                    int q = (item.getQuantity() != null) ? item.getQuantity().intValue() : 0;
                    BigDecimal price = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
                    poQty += q;
                    poAmount = poAmount.add(price.multiply(BigDecimal.valueOf(q)));
                }
            }
            payment.setPoQuantity(poQty);
            payment.setPoAmount(poAmount.setScale(2, RoundingMode.HALF_UP));
            payment.setPoUnitPrice(poQty > 0 ? poAmount.divide(BigDecimal.valueOf(poQty), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO);

            List<PurchaseReceipt> reqReceipts = allReceipts.stream()
                    .filter(rc -> rc.getPurchaseOrder() != null && rc.getPurchaseOrder().getId().equals(req.getId()))
                    .collect(Collectors.toList());
            if (!reqReceipts.isEmpty()) {
                PurchaseReceipt firstRc = reqReceipts.get(0);
                payment.setPurchaseReceipt(firstRc);
                payment.setReceiptNumber(firstRc.getReceiptNo() != null ? firstRc.getReceiptNo() : "REC-001");
                payment.setReceiptDate(firstRc.getReceiptDate() != null ? firstRc.getReceiptDate() : LocalDate.now());
                int recQty = reqReceipts.stream().mapToInt(r -> (r.getQuantity() != null) ? r.getQuantity().intValue() : 0).sum();
                payment.setReceivedQuantity(recQty);
                payment.setReceivedAmount(payment.getPoUnitPrice().multiply(BigDecimal.valueOf(recQty)).setScale(2, RoundingMode.HALF_UP));
            } else {
                payment.setReceiptNumber("REC-" + String.format("%03d", num));
                payment.setReceiptDate(LocalDate.now());
                payment.setReceivedQuantity(poQty);
                payment.setReceivedAmount(poAmount);
            }

            List<Invoice> reqInvoices = allInvoices.stream()
                    .filter(inv -> inv.getRequisition() != null && inv.getRequisition().getId().equals(req.getId()))
                    .collect(Collectors.toList());
            if (!reqInvoices.isEmpty()) {
                Invoice firstInv = reqInvoices.get(0);
                payment.setInvoice(firstInv);
                payment.setInvoiceNumber(firstInv.getInvoiceNumber());
                payment.setInvoiceDate(firstInv.getInvoiceDate());
                payment.setInvoiceAmount(firstInv.getTotalAmount());
                // Requirement 3: Invoice quantity should be same as PO Quantity
                payment.setInvoiceQuantity(poQty);
                payment.setInvoiceUnitPrice(payment.getPoUnitPrice());
            } else {
                payment.setInvoiceNumber("INV-2026-" + String.format("%04d", num + 100));
                payment.setInvoiceDate(LocalDate.now());
                payment.setInvoiceQuantity(poQty);
                payment.setInvoiceUnitPrice(payment.getPoUnitPrice());
                payment.setInvoiceAmount(poAmount);
            }

            ReconciliationResponse suppReconResp = null;
            try {
                suppReconResp = reconciliationService.getReconciliationForStandardRequisition(req);
            } catch (Exception e) {
                // ignore
            }

            if (suppReconResp != null) {
                String rStatus = suppReconResp.getOverallResult() != null ? suppReconResp.getOverallResult() : "MATCHED";
                if ("MATCHED".equalsIgnoreCase(rStatus)) {
                    payment.setReconciliationStatus("Matched");
                    payment.setPaymentStatus("Payment Due");
                } else {
                    payment.setReconciliationStatus("Exception");
                    payment.setExceptionReason(suppReconResp.getRemarks() != null && !suppReconResp.getRemarks().isBlank() ? suppReconResp.getRemarks() : "Variance detected during reconciliation match.");
                    payment.setPaymentStatus("On Hold");
                }
            } else {
                boolean qtyMatch = payment.getPoQuantity().equals(payment.getReceivedQuantity()) && payment.getReceivedQuantity().equals(payment.getInvoiceQuantity());
                boolean priceMatch = payment.getPoUnitPrice().compareTo(payment.getInvoiceUnitPrice()) == 0;
                boolean amtMatch = payment.getPoAmount().compareTo(payment.getReceivedAmount()) == 0 && payment.getReceivedAmount().compareTo(payment.getInvoiceAmount()) == 0;

                if (qtyMatch && priceMatch && amtMatch) {
                    payment.setReconciliationStatus("Matched");
                    payment.setPaymentStatus("Payment Due");
                } else {
                    payment.setReconciliationStatus("Exception");
                    payment.setExceptionReason("Variance detected in quantities or amounts.");
                    payment.setPaymentStatus("On Hold");
                }
            }

            payment.setAmountToPay(payment.getInvoiceAmount());
            payment.setCurrency("INR");
            payment.setCreatedAt(LocalDateTime.now());
            paymentRepository.save(payment);
        }
    }

    private void initSupplierSamplePayments(User supplier) {
        String suppName = getUserDisplayName(supplier);

        // 1. PAY-000001: XYZ Manufacturing | INV-00456 | ₹1,25,000 | Paid
        Payment p1 = new Payment();
        p1.setId(UUID.randomUUID());
        p1.setPaymentId("PAY-000001");
        p1.setPaymentDate(LocalDate.now().minusDays(3));
        p1.setSupplier(supplier);
        p1.setSupplierName(suppName);
        p1.setBuyerName("XYZ Manufacturing");
        p1.setPoNumber("PO-00125");
        p1.setPoQuantity(100);
        p1.setPoUnitPrice(new BigDecimal("1250.00"));
        p1.setPoAmount(new BigDecimal("125000.00"));

        p1.setReceiptNumber("REC-003");
        p1.setReceiptDate(LocalDate.now().minusDays(3));
        p1.setReceivedQuantity(100);
        p1.setReceivedAmount(new BigDecimal("125000.00"));

        p1.setInvoiceNumber("INV-00456");
        p1.setInvoiceDate(LocalDate.now().minusDays(2));
        p1.setInvoiceQuantity(100);
        p1.setInvoiceUnitPrice(new BigDecimal("1250.00"));
        p1.setInvoiceAmount(new BigDecimal("125000.00"));

        p1.setAmountToPay(new BigDecimal("125000.00"));
        p1.setReconciliationStatus("Matched");
        p1.setPaymentStatus("Paid");
        p1.setCurrency("INR");
        p1.setCreatedAt(LocalDateTime.now().minusHours(8));
        paymentRepository.save(p1);

        // 2. PAY-000002: ABC Industries | INV-00478 | ₹85,000 | Payment Due
        Payment p2 = new Payment();
        p2.setId(UUID.randomUUID());
        p2.setPaymentId("PAY-000002");
        p2.setPaymentDate(LocalDate.now().minusDays(2));
        p2.setSupplier(supplier);
        p2.setSupplierName(suppName);
        p2.setBuyerName("ABC Industries");
        p2.setPoNumber("PO-00126");
        p2.setPoQuantity(85);
        p2.setPoUnitPrice(new BigDecimal("1000.00"));
        p2.setPoAmount(new BigDecimal("85000.00"));

        p2.setReceiptNumber("REC-004");
        p2.setReceiptDate(LocalDate.now().minusDays(2));
        p2.setReceivedQuantity(85);
        p2.setReceivedAmount(new BigDecimal("85000.00"));

        p2.setInvoiceNumber("INV-00478");
        p2.setInvoiceDate(LocalDate.now().minusDays(1));
        p2.setInvoiceQuantity(85);
        p2.setInvoiceUnitPrice(new BigDecimal("1000.00"));
        p2.setInvoiceAmount(new BigDecimal("85000.00"));

        p2.setAmountToPay(new BigDecimal("85000.00"));
        p2.setReconciliationStatus("Matched");
        p2.setPaymentStatus("Payment Due");
        p2.setCurrency("INR");
        p2.setCreatedAt(LocalDateTime.now().minusHours(6));
        paymentRepository.save(p2);

        // 3. PAY-000003: DEF Corp | INV-00489 | ₹50,000 | On Hold
        Payment p3 = new Payment();
        p3.setId(UUID.randomUUID());
        p3.setPaymentId("PAY-000003");
        p3.setPaymentDate(LocalDate.now().minusDays(4));
        p3.setSupplier(supplier);
        p3.setSupplierName(suppName);
        p3.setBuyerName("DEF Corp");
        p3.setPoNumber("PO-00127");
        p3.setPoQuantity(50);
        p3.setPoUnitPrice(new BigDecimal("1000.00"));
        p3.setPoAmount(new BigDecimal("50000.00"));

        p3.setReceiptNumber("REC-005");
        p3.setReceiptDate(LocalDate.now().minusDays(4));
        p3.setReceivedQuantity(40);
        p3.setReceivedAmount(new BigDecimal("40000.00"));

        p3.setInvoiceNumber("INV-00489");
        p3.setInvoiceDate(LocalDate.now().minusDays(1));
        p3.setInvoiceQuantity(50);
        p3.setInvoiceUnitPrice(new BigDecimal("1000.00"));
        p3.setInvoiceAmount(new BigDecimal("50000.00"));

        p3.setAmountToPay(new BigDecimal("50000.00"));
        p3.setReconciliationStatus("Exception");
        p3.setExceptionReason("Invoice quantity exceeds received quantity.");
        p3.setPaymentStatus("On Hold");
        p3.setCurrency("INR");
        p3.setCreatedAt(LocalDateTime.now().minusHours(4));
        paymentRepository.save(p3);

        // 4. PAY-000004: PQR Ltd | INV-00501 | ₹75,000 | Pending
        Payment p4 = new Payment();
        p4.setId(UUID.randomUUID());
        p4.setPaymentId("PAY-000004");
        p4.setPaymentDate(LocalDate.now());
        p4.setSupplier(supplier);
        p4.setSupplierName(suppName);
        p4.setBuyerName("PQR Ltd");
        p4.setPoNumber("PO-00128");
        p4.setPoQuantity(75);
        p4.setPoUnitPrice(new BigDecimal("1000.00"));
        p4.setPoAmount(new BigDecimal("75000.00"));

        p4.setReceiptNumber("REC-006");
        p4.setReceiptDate(LocalDate.now().minusDays(1));
        p4.setReceivedQuantity(75);
        p4.setReceivedAmount(new BigDecimal("75000.00"));

        p4.setInvoiceNumber("INV-00501");
        p4.setInvoiceDate(LocalDate.now());
        p4.setInvoiceQuantity(75);
        p4.setInvoiceUnitPrice(new BigDecimal("1000.00"));
        p4.setInvoiceAmount(new BigDecimal("75000.00"));

        p4.setAmountToPay(new BigDecimal("75000.00"));
        p4.setReconciliationStatus("Matched");
        p4.setPaymentStatus("Pending");
        p4.setCurrency("INR");
        p4.setCreatedAt(LocalDateTime.now().minusHours(2));
        paymentRepository.save(p4);
    }

    public PaymentResponse getPaymentById(UUID id, String userEmail) {
        Payment payment = paymentRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        return mapToResponse(payment);
    }

    public PaymentResponse updatePaymentStatus(UUID id, PaymentStatusUpdateRequest request, String buyerEmail) {
        Payment payment = paymentRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        if (request.getPaymentStatus() != null && !request.getPaymentStatus().isBlank()) {
            payment.setPaymentStatus(request.getPaymentStatus().trim());
        }
        if (request.getNotes() != null) {
            payment.setNotes(request.getNotes());
        }
        payment.setUpdatedAt(LocalDateTime.now());
        Payment saved = paymentRepository.save(payment);
        return mapToResponse(saved);
    }

    public PaymentResponse approvePayment(UUID id, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        Payment payment = paymentRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        payment.setPaymentStatus("Payment Due");
        payment.setUpdatedAt(LocalDateTime.now());
        Payment saved = paymentRepository.save(payment);

        // Notify Supplier if assigned
        if (payment.getSupplier() != null) {
            String msg = "Payment of " + saved.getCurrency() + " " + saved.getAmountToPay() + " for PO " + saved.getPoNumber() + " has been Approved for disbursement.";
            notificationService.createNotification(
                    payment.getSupplier(),
                    buyer,
                    "PAYMENTS",
                    "Payment Approved (" + saved.getPaymentId() + ")",
                    msg,
                    "Approved by buyer for disbursement",
                    saved.getId(),
                    "PAYMENT"
            );
        }

        return mapToResponse(saved);
    }

    public PaymentResponse markAsPaid(UUID id, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        Payment payment = paymentRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        payment.setPaymentStatus("Paid");
        payment.setUpdatedAt(LocalDateTime.now());
        Payment saved = paymentRepository.save(payment);

        // Notify Supplier if assigned
        if (payment.getSupplier() != null) {
            String msg = "Payment of " + saved.getCurrency() + " " + saved.getAmountToPay() + " for Invoice " + saved.getInvoiceNumber() + " (PO " + saved.getPoNumber() + ") has been settled and marked as Paid.";
            notificationService.createNotification(
                    payment.getSupplier(),
                    buyer,
                    "PAYMENTS",
                    "Payment Settled (" + saved.getPaymentId() + ")",
                    msg,
                    "Disbursement completed successfully",
                    saved.getId(),
                    "PAYMENT"
            );
        }

        return mapToResponse(saved);
    }

    public PaymentResponse savePayment(PaymentSaveRequest request, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        Payment payment;
        if (request.getId() != null) {
            payment = paymentRepository.findById(Objects.requireNonNull(request.getId())).orElse(new Payment());
        } else if (request.getPaymentId() != null) {
            payment = paymentRepository.findByPaymentId(request.getPaymentId()).orElse(new Payment());
        } else {
            payment = new Payment();
        }

        if (payment.getId() == null) {
            payment.setId(UUID.randomUUID());
            payment.setCreatedAt(LocalDateTime.now());
        }

        payment.setBuyer(buyer);

        if (request.getPaymentId() != null && !request.getPaymentId().isBlank()) {
            payment.setPaymentId(request.getPaymentId());
        } else if (payment.getPaymentId() == null) {
            payment.setPaymentId(generateUniquePaymentId());
        }

        payment.setPaymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now());

        if (request.getBuyerId() != null) {
            userRepository.findById(Objects.requireNonNull(request.getBuyerId())).ifPresent(payment::setBuyer);
        }
        if (request.getBuyerName() != null && !request.getBuyerName().isBlank()) {
            payment.setBuyerName(request.getBuyerName());
        }

        if (request.getSupplierId() != null) {
            userRepository.findById(Objects.requireNonNull(request.getSupplierId())).ifPresent(payment::setSupplier);
        }
        if (request.getSupplierName() != null) {
            payment.setSupplierName(request.getSupplierName());
        }

        if (request.getRequisitionId() != null) {
            requisitionRepository.findById(Objects.requireNonNull(request.getRequisitionId())).ifPresent(payment::setRequisition);
        }
        if (request.getPurchaseReceiptId() != null) {
            purchaseReceiptRepository.findById(Objects.requireNonNull(request.getPurchaseReceiptId())).ifPresent(payment::setPurchaseReceipt);
        }
        if (request.getInvoiceId() != null) {
            invoiceRepository.findById(Objects.requireNonNull(request.getInvoiceId())).ifPresent(payment::setInvoice);
        }
        if (request.getReconciliationId() != null) {
            reconciliationRepository.findById(Objects.requireNonNull(request.getReconciliationId())).ifPresent(payment::setReconciliation);
        }

        payment.setPoNumber(request.getPoNumber());
        payment.setPoQuantity(request.getPoQuantity() != null ? request.getPoQuantity() : Integer.valueOf(0));
        payment.setPoUnitPrice(request.getPoUnitPrice() != null ? request.getPoUnitPrice() : BigDecimal.ZERO);
        payment.setPoAmount(request.getPoAmount() != null ? request.getPoAmount() : BigDecimal.ZERO);

        payment.setReceiptNumber(request.getReceiptNumber());
        payment.setReceiptDate(request.getReceiptDate());
        payment.setReceivedQuantity(request.getReceivedQuantity() != null ? request.getReceivedQuantity() : Integer.valueOf(0));
        payment.setReceivedAmount(request.getReceivedAmount() != null ? request.getReceivedAmount() : BigDecimal.ZERO);

        payment.setInvoiceNumber(request.getInvoiceNumber());
        payment.setInvoiceDate(request.getInvoiceDate());
        payment.setInvoiceQuantity(request.getInvoiceQuantity() != null ? request.getInvoiceQuantity() : Integer.valueOf(0));
        payment.setInvoiceUnitPrice(request.getInvoiceUnitPrice() != null ? request.getInvoiceUnitPrice() : BigDecimal.ZERO);
        payment.setInvoiceAmount(request.getInvoiceAmount() != null ? request.getInvoiceAmount() : BigDecimal.ZERO);

        payment.setAmountToPay(request.getAmountToPay() != null ? request.getAmountToPay() : payment.getInvoiceAmount());
        payment.setReconciliationStatus(request.getReconciliationStatus() != null ? request.getReconciliationStatus() : "Matched");
        payment.setExceptionReason(request.getExceptionReason());
        payment.setPaymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : "Payment Due");
        payment.setCurrency(request.getCurrency() != null ? request.getCurrency() : "INR");
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setPaymentReference(request.getPaymentReference());
        payment.setNotes(request.getNotes());
        payment.setUpdatedAt(LocalDateTime.now());

        Payment saved = paymentRepository.save(payment);
        return mapToResponse(saved);
    }

    private void initSamplePayments(User buyer) {
        // Find or create sample supplier user
        User supplier = userRepository.findAll().stream()
                .filter(u -> u.getAccountType() != null && u.getAccountType().equalsIgnoreCase("supplier"))
                .findFirst()
                .orElse(null);

        // Record 1: Matched (Standard 3-way matched statement)
        Payment p1 = new Payment();
        p1.setId(UUID.randomUUID());
        p1.setPaymentId(generateUniquePaymentId());
        p1.setPaymentDate(LocalDate.now());
        p1.setBuyer(buyer);
        p1.setSupplier(supplier);
        p1.setSupplierName(supplier != null ? getUserDisplayName(supplier) : "ABC Technologies Pvt Ltd");
        p1.setPoNumber("PO-2026-00125");
        p1.setPoQuantity(100);
        p1.setPoUnitPrice(new BigDecimal("1250.00"));
        p1.setPoAmount(new BigDecimal("125000.00"));

        p1.setReceiptNumber("REC-003");
        p1.setReceiptDate(LocalDate.now().minusDays(3));
        p1.setReceivedQuantity(100);
        p1.setReceivedAmount(new BigDecimal("125000.00"));

        p1.setInvoiceNumber("INV-2026-00456");
        p1.setInvoiceDate(LocalDate.now().minusDays(2));
        p1.setInvoiceQuantity(100);
        p1.setInvoiceUnitPrice(new BigDecimal("1250.00"));
        p1.setInvoiceAmount(new BigDecimal("125000.00"));

        p1.setAmountToPay(new BigDecimal("125000.00"));
        p1.setReconciliationStatus("Matched");
        p1.setPaymentStatus("Payment Due");
        p1.setCurrency("INR");
        p1.setCreatedAt(LocalDateTime.now().minusHours(5));
        paymentRepository.save(p1);

        // Record 2: Paid Case (Successfully Reconciled)
        Payment p3 = new Payment();
        p3.setId(UUID.randomUUID());
        p3.setPaymentId(generateUniquePaymentId());
        p3.setPaymentDate(LocalDate.now().minusDays(5));
        p3.setBuyer(buyer);
        p3.setSupplier(supplier);
        p3.setSupplierName(supplier != null ? getUserDisplayName(supplier) : "Global Hardware Solutions");
        p3.setPoNumber("PO-2026-00120");
        p3.setPoQuantity(50);
        p3.setPoUnitPrice(new BigDecimal("2000.00"));
        p3.setPoAmount(new BigDecimal("100000.00"));

        p3.setReceiptNumber("REC-001");
        p3.setReceiptDate(LocalDate.now().minusDays(7));
        p3.setReceivedQuantity(50);
        p3.setReceivedAmount(new BigDecimal("100000.00"));

        p3.setInvoiceNumber("INV-2026-00450");
        p3.setInvoiceDate(LocalDate.now().minusDays(6));
        p3.setInvoiceQuantity(50);
        p3.setInvoiceUnitPrice(new BigDecimal("2000.00"));
        p3.setInvoiceAmount(new BigDecimal("100000.00"));

        p3.setAmountToPay(new BigDecimal("100000.00"));
        p3.setReconciliationStatus("Matched");
        p3.setPaymentStatus("Paid");
        p3.setCurrency("INR");
        p3.setCreatedAt(LocalDateTime.now().minusDays(5));
        paymentRepository.save(p3);
    }

    private PaymentResponse mapToResponse(Payment p) {
        PaymentResponse r = new PaymentResponse();
        r.setId(p.getId());
        r.setPaymentId(p.getPaymentId());
        r.setPaymentDate(p.getPaymentDate());
        r.setPaymentStatus(p.getPaymentStatus());
        r.setCurrency(p.getCurrency() != null ? p.getCurrency() : "INR");

        if (p.getSupplier() != null) {
            r.setSupplierId(p.getSupplier().getId());
            r.setSupplierName(p.getSupplierName() != null ? p.getSupplierName() : getUserDisplayName(p.getSupplier()));
            r.setSupplierEmail(p.getSupplier().getEmail());
        } else {
            r.setSupplierName(p.getSupplierName() != null ? p.getSupplierName() : "ABC Technologies Pvt Ltd");
        }

        if (p.getBuyer() != null) {
            r.setBuyerId(p.getBuyer().getId());
            r.setBuyerName(p.getBuyerName() != null && !p.getBuyerName().isBlank() ? p.getBuyerName() : getUserDisplayName(p.getBuyer()));
            r.setBuyerEmail(p.getBuyer().getEmail());
        } else if (p.getBuyerName() != null && !p.getBuyerName().isBlank()) {
            r.setBuyerName(p.getBuyerName());
        } else {
            r.setBuyerName("XYZ Manufacturing");
        }

        if (p.getRequisition() != null) {
            r.setRequisitionId(p.getRequisition().getId());
        }
        r.setPoNumber(p.getPoNumber());
        r.setPoQuantity(p.getPoQuantity() != null ? p.getPoQuantity() : Integer.valueOf(0));
        r.setPoUnitPrice(p.getPoUnitPrice() != null ? p.getPoUnitPrice() : BigDecimal.ZERO);
        r.setPoAmount(p.getPoAmount() != null ? p.getPoAmount() : BigDecimal.ZERO);

        if (p.getPurchaseReceipt() != null) {
            r.setPurchaseReceiptId(p.getPurchaseReceipt().getId());
        }
        r.setReceiptNumber(p.getReceiptNumber());
        r.setReceiptDate(p.getReceiptDate());
        r.setReceivedQuantity(p.getReceivedQuantity() != null ? p.getReceivedQuantity() : Integer.valueOf(0));
        r.setReceivedAmount(p.getReceivedAmount() != null ? p.getReceivedAmount() : BigDecimal.ZERO);
        r.setReceiptAmount(r.getReceivedAmount());

        if (p.getInvoice() != null) {
            r.setInvoiceId(p.getInvoice().getId());
            r.setTaxPercentage(p.getInvoice().getTaxPercentage());
            r.setTaxAmount(p.getInvoice().getTaxAmount());
        }
        r.setInvoiceNumber(p.getInvoiceNumber());
        r.setInvoiceDate(p.getInvoiceDate());
        r.setInvoiceQuantity(p.getInvoiceQuantity() != null ? p.getInvoiceQuantity() : Integer.valueOf(0));
        r.setInvoiceUnitPrice(p.getInvoiceUnitPrice() != null ? p.getInvoiceUnitPrice() : BigDecimal.ZERO);
        r.setInvoiceAmount(p.getInvoiceAmount() != null ? p.getInvoiceAmount() : BigDecimal.ZERO);

        if (p.getReconciliation() != null) {
            r.setReconciliationId(p.getReconciliation().getId());
            r.setReconciliationNumber(p.getReconciliation().getReconciliationNumber());
        }
        r.setReconciliationStatus(p.getReconciliationStatus() != null ? p.getReconciliationStatus() : "Matched");
        r.setExceptionReason(p.getExceptionReason());

        // Populate 4-way reconciliation details (Quantity, Price, Amount, Tax) from Reconciliation functionality
        ReconciliationResponse reconResp = null;
        if (p.getRequisition() != null) {
            try {
                reconResp = reconciliationService.getReconciliationForStandardRequisition(p.getRequisition());
            } catch (Exception e) {
                // ignore
            }
        }

        if (reconResp != null) {
            r.setQuantityMatchStatus(reconResp.getQuantityMatchStatus());
            r.setPriceMatchStatus(reconResp.getPriceMatchStatus());
            r.setAmountMatchStatus(reconResp.getAmountMatchStatus());
            r.setTaxMatchStatus(reconResp.getTaxMatchStatus());
            r.setOverallResult(reconResp.getOverallResult());
            r.setInvoiceBaseAmount(reconResp.getInvoiceBaseAmount() != null ? reconResp.getInvoiceBaseAmount() : r.getPoAmount());
            r.setCalculatedTaxAmount(reconResp.getCalculatedTaxAmount());
            r.setTaxVariance(reconResp.getTaxVariance());
            if (reconResp.getTaxPercentage() != null) {
                r.setTaxPercentage(reconResp.getTaxPercentage());
            }
            if (reconResp.getTaxAmount() != null) {
                r.setTaxAmount(reconResp.getTaxAmount());
            }
            if (reconResp.getReconciliationNumber() != null) {
                r.setReconciliationNumber(reconResp.getReconciliationNumber());
            }
            if (reconResp.getId() != null && r.getReconciliationId() == null) {
                r.setReconciliationId(reconResp.getId());
            }
            if (reconResp.getPoVsReceiptQtyVariance() != null) {
                r.setPoVsReceiptQtyVariance(reconResp.getPoVsReceiptQtyVariance());
            }
            if (reconResp.getReceiptVsInvoiceQtyVariance() != null) {
                r.setReceiptVsInvoiceQtyVariance(reconResp.getReceiptVsInvoiceQtyVariance());
            }
            if (reconResp.getPoVsInvoiceQtyVariance() != null) {
                r.setPoVsInvoiceQtyVariance(reconResp.getPoVsInvoiceQtyVariance());
            }
            if (reconResp.getPriceVariance() != null) {
                r.setPriceVariance(reconResp.getPriceVariance());
            }
            if (reconResp.getPoVsInvoiceAmtVariance() != null) {
                r.setAmountVariance(reconResp.getPoVsInvoiceAmtVariance());
            }
        } else if (p.getReconciliation() != null) {
            Reconciliation rec = p.getReconciliation();
            r.setQuantityMatchStatus(rec.getQuantityMatchStatus() != null ? rec.getQuantityMatchStatus() : "MATCHED");
            r.setPriceMatchStatus(rec.getPriceMatchStatus() != null ? rec.getPriceMatchStatus() : "MATCHED");
            r.setAmountMatchStatus(rec.getAmountMatchStatus() != null ? rec.getAmountMatchStatus() : "MATCHED");
            r.setTaxMatchStatus(rec.getTaxMatchStatus() != null ? rec.getTaxMatchStatus() : "MATCHED");
            r.setOverallResult(rec.getOverallResult() != null ? rec.getOverallResult() : "MATCHED");
            r.setInvoiceBaseAmount(rec.getPoAmount() != null ? rec.getPoAmount() : r.getPoAmount());
            r.setCalculatedTaxAmount(rec.getCalculatedTaxAmount());
            r.setTaxVariance(rec.getTaxVariance());
            if (rec.getTaxPercentage() != null) {
                r.setTaxPercentage(rec.getTaxPercentage());
            }
            if (rec.getTaxAmount() != null) {
                r.setTaxAmount(rec.getTaxAmount());
            }
        } else {
            // Fallback for sample/mock payments
            int poQ = r.getPoQuantity() != null ? r.getPoQuantity().intValue() : 0;
            int recQ = r.getReceivedQuantity() != null ? r.getReceivedQuantity().intValue() : 0;
            int invQ = r.getInvoiceQuantity() != null ? r.getInvoiceQuantity().intValue() : 0;
            boolean qtyOk = (poQ == recQ && recQ == invQ);
            boolean priceOk = (r.getPoUnitPrice().compareTo(r.getInvoiceUnitPrice()) == 0);
            boolean amtOk = (r.getPoAmount().compareTo(r.getReceivedAmount()) == 0);

            boolean isMatchedRecord = "Matched".equalsIgnoreCase(p.getReconciliationStatus()) || "Paid".equalsIgnoreCase(p.getPaymentStatus());
            r.setQuantityMatchStatus(isMatchedRecord || qtyOk ? "MATCHED" : "MISMATCH");
            r.setPriceMatchStatus(isMatchedRecord || priceOk ? "MATCHED" : "MISMATCH");
            r.setAmountMatchStatus(isMatchedRecord || amtOk ? "MATCHED" : "MISMATCH");
            r.setTaxMatchStatus("MATCHED");
            r.setOverallResult((r.getQuantityMatchStatus().equals("MATCHED") &&
                                r.getPriceMatchStatus().equals("MATCHED") &&
                                r.getAmountMatchStatus().equals("MATCHED") &&
                                r.getTaxMatchStatus().equals("MATCHED")) ? "MATCHED" : "EXCEPTION");
            r.setInvoiceBaseAmount(r.getPoAmount());
            BigDecimal taxRate = r.getTaxPercentage() != null ? r.getTaxPercentage() : new BigDecimal("18.00");
            r.setTaxPercentage(taxRate);
            BigDecimal calcTax = r.getPoAmount().multiply(taxRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            r.setCalculatedTaxAmount(calcTax);
            r.setTaxVariance(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            if (r.getTaxAmount() == null) {
                r.setTaxAmount(calcTax);
            }
            if (r.getReconciliationNumber() == null) {
                r.setReconciliationNumber("REC-" + (r.getPoNumber() != null ? r.getPoNumber().replace("PO-", "").replace("PO", "") : "001"));
            }
        }

        if (r.getPoVsReceiptQtyVariance() == null) {
            int poQ = r.getPoQuantity() != null ? r.getPoQuantity().intValue() : 0;
            int recQ = r.getReceivedQuantity() != null ? r.getReceivedQuantity().intValue() : 0;
            int invQ = r.getInvoiceQuantity() != null ? r.getInvoiceQuantity().intValue() : 0;
            r.setPoVsReceiptQtyVariance(recQ - poQ);
            r.setReceiptVsInvoiceQtyVariance(invQ - recQ);
            r.setPoVsInvoiceQtyVariance(invQ - poQ);
        }

        if (r.getPriceVariance() == null) {
            BigDecimal poPrice = r.getPoUnitPrice();
            BigDecimal invPrice = r.getInvoiceUnitPrice();
            r.setPriceVariance(invPrice.subtract(poPrice).setScale(2, RoundingMode.HALF_UP));
        }

        if (r.getAmountVariance() == null) {
            BigDecimal poAmt = r.getPoAmount();
            BigDecimal baseInvAmt = r.getInvoiceBaseAmount() != null ? r.getInvoiceBaseAmount() : r.getInvoiceAmount();
            r.setAmountVariance(baseInvAmt.subtract(poAmt).setScale(2, RoundingMode.HALF_UP));
        }

        r.setAmountToPay(p.getAmountToPay() != null ? p.getAmountToPay() : r.getInvoiceAmount());
        r.setPaymentMethod(p.getPaymentMethod());
        r.setPaymentReference(p.getPaymentReference());
        r.setNotes(p.getNotes());
        r.setCreatedAt(p.getCreatedAt());
        r.setUpdatedAt(p.getUpdatedAt());

        return r;
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
            // ignore
        }
        return u.getEmail() != null ? u.getEmail() : "User";
    }
}

