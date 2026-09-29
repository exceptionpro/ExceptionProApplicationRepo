package com.exceptionpro.service;

import com.exceptionpro.dto.PaymentResponse;
import com.exceptionpro.dto.PaymentSaveRequest;
import com.exceptionpro.dto.PaymentStatusUpdateRequest;
import com.exceptionpro.entity.*;
import com.exceptionpro.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

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

    public PaymentService(PaymentRepository paymentRepository,
                          RequisitionRepository requisitionRepository,
                          PurchaseReceiptRepository purchaseReceiptRepository,
                          InvoiceRepository invoiceRepository,
                          ReconciliationRepository reconciliationRepository,
                          UserRepository userRepository,
                          NotificationService notificationService) {
        this.paymentRepository = paymentRepository;
        this.requisitionRepository = requisitionRepository;
        this.purchaseReceiptRepository = purchaseReceiptRepository;
        this.invoiceRepository = invoiceRepository;
        this.reconciliationRepository = reconciliationRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
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
        List<Payment> savedPayments = paymentRepository.findBySupplierIdOrderByCreatedAtDesc(supplier.getId());

        // 1. Sync real requisitions where supplier matches
        syncRealSupplierRequisitions(supplier);

        // Reload payments
        savedPayments = paymentRepository.findBySupplierIdOrderByCreatedAtDesc(supplier.getId());

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

        List<Payment> savedPayments = paymentRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());

        // 1. Synchronize real requisitions and invoices into payment records if they exist
        syncRealBuyerRequisitions(buyer);

        // Reload payments after synchronization
        savedPayments = paymentRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());

        // 2. If still no payments exist, initialize with realistic sample records
        if (savedPayments.isEmpty()) {
            initSamplePayments(buyer);
            savedPayments = paymentRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        }

        return savedPayments.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private void syncRealBuyerRequisitions(User buyer) {
        List<Requisition> buyerReqs = requisitionRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        if (buyerReqs.isEmpty()) {
            return;
        }

        List<PurchaseReceipt> allReceipts = purchaseReceiptRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        List<Invoice> allInvoices = invoiceRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());

        for (Requisition req : buyerReqs) {
            int num = req.getReqNumber() != null ? req.getReqNumber() : 1;
            String poNumber = String.format("PO%02d", num);

            // Check if payment already exists for this requisition
            Optional<Payment> existingOpt = paymentRepository.findByPoNumber(poNumber)
                    .or(() -> paymentRepository.findAll().stream()
                            .filter(p -> p.getBuyer() != null && p.getBuyer().getId().equals(buyer.getId()) &&
                                    p.getRequisition() != null && p.getRequisition().getId().equals(req.getId()))
                            .findFirst());

            if (existingOpt.isPresent()) {
                continue;
            }

            // Find matching receipts and invoices
            List<PurchaseReceipt> reqReceipts = allReceipts.stream()
                    .filter(rc -> rc.getPurchaseOrder() != null && rc.getPurchaseOrder().getId().equals(req.getId()))
                    .collect(Collectors.toList());

            List<Invoice> reqInvoices = allInvoices.stream()
                    .filter(inv -> inv.getRequisition() != null && inv.getRequisition().getId().equals(req.getId()))
                    .collect(Collectors.toList());

            Payment payment = new Payment();
            payment.setId(UUID.randomUUID());
            payment.setPaymentId(generateUniquePaymentId());
            payment.setPaymentDate(LocalDate.now());
            payment.setBuyer(buyer);
            payment.setRequisition(req);
            payment.setPoNumber(poNumber);

            if (req.getSupplier() != null) {
                payment.setSupplier(req.getSupplier());
                payment.setSupplierName(getUserDisplayName(req.getSupplier()));
            } else {
                payment.setSupplierName("ABC Technologies Pvt Ltd");
            }

            // Calculate PO totals
            int poQty = 0;
            BigDecimal poAmount = BigDecimal.ZERO;
            if (req.getItems() != null) {
                for (RequisitionItem item : req.getItems()) {
                    int q = item.getQuantity() != null ? item.getQuantity() : 0;
                    BigDecimal price = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
                    poQty += q;
                    poAmount = poAmount.add(price.multiply(BigDecimal.valueOf(q)));
                }
            }
            payment.setPoQuantity(poQty);
            payment.setPoAmount(poAmount.setScale(2, RoundingMode.HALF_UP));
            payment.setPoUnitPrice(poQty > 0 ? poAmount.divide(BigDecimal.valueOf(poQty), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO);

            // Purchase Receipt info
            if (!reqReceipts.isEmpty()) {
                PurchaseReceipt firstRc = reqReceipts.get(0);
                payment.setPurchaseReceipt(firstRc);
                payment.setReceiptNumber(firstRc.getReceiptNo() != null ? firstRc.getReceiptNo() : "REC-001");
                payment.setReceiptDate(firstRc.getReceiptDate() != null ? firstRc.getReceiptDate() : LocalDate.now());
                int recQty = reqReceipts.stream().mapToInt(r -> r.getQuantity() != null ? r.getQuantity() : 0).sum();
                payment.setReceivedQuantity(recQty);
                payment.setReceivedAmount(payment.getPoUnitPrice().multiply(BigDecimal.valueOf(recQty)).setScale(2, RoundingMode.HALF_UP));
            } else {
                payment.setReceiptNumber("REC-" + String.format("%03d", num));
                payment.setReceiptDate(LocalDate.now());
                payment.setReceivedQuantity(poQty);
                payment.setReceivedAmount(poAmount);
            }

            // Invoice info
            if (!reqInvoices.isEmpty()) {
                Invoice firstInv = reqInvoices.get(0);
                payment.setInvoice(firstInv);
                payment.setInvoiceNumber(firstInv.getInvoiceNumber());
                payment.setInvoiceDate(firstInv.getInvoiceDate());
                payment.setInvoiceAmount(firstInv.getTotalAmount());
                int invQty = payment.getPoUnitPrice().compareTo(BigDecimal.ZERO) > 0
                        ? firstInv.getTotalAmount().divide(payment.getPoUnitPrice(), 0, RoundingMode.HALF_UP).intValue()
                        : poQty;
                payment.setInvoiceQuantity(invQty);
                payment.setInvoiceUnitPrice(invQty > 0 ? firstInv.getTotalAmount().divide(BigDecimal.valueOf(invQty), 2, RoundingMode.HALF_UP) : payment.getPoUnitPrice());
            } else {
                payment.setInvoiceNumber("INV-2026-" + String.format("%04d", num + 100));
                payment.setInvoiceDate(LocalDate.now());
                payment.setInvoiceQuantity(poQty);
                payment.setInvoiceUnitPrice(payment.getPoUnitPrice());
                payment.setInvoiceAmount(poAmount);
            }

            // 3-Way Match evaluation
            boolean qtyMatch = payment.getPoQuantity().equals(payment.getReceivedQuantity()) && payment.getReceivedQuantity().equals(payment.getInvoiceQuantity());
            boolean priceMatch = payment.getPoUnitPrice().compareTo(payment.getInvoiceUnitPrice()) == 0;
            boolean amtMatch = payment.getPoAmount().compareTo(payment.getReceivedAmount()) == 0 && payment.getReceivedAmount().compareTo(payment.getInvoiceAmount()) == 0;

            if (qtyMatch && priceMatch && amtMatch) {
                payment.setReconciliationStatus("Matched");
                payment.setPaymentStatus("Payment Due");
            } else {
                payment.setReconciliationStatus("Exception");
                if (!qtyMatch) {
                    payment.setExceptionReason("Invoice quantity (" + payment.getInvoiceQuantity() + ") does not match received quantity (" + payment.getReceivedQuantity() + ").");
                } else if (!priceMatch) {
                    payment.setExceptionReason("Invoice unit price differs from Purchase Order unit price.");
                } else {
                    payment.setExceptionReason("Amount variance detected between Purchase Order, Receipt, and Invoice.");
                }
                payment.setPaymentStatus("On Hold");
            }

            payment.setAmountToPay(payment.getInvoiceAmount());
            payment.setCurrency("INR");
            payment.setCreatedAt(LocalDateTime.now());
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
            int num = req.getReqNumber() != null ? req.getReqNumber() : 1;
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
                    int q = item.getQuantity() != null ? item.getQuantity() : 0;
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
                int recQty = reqReceipts.stream().mapToInt(r -> r.getQuantity() != null ? r.getQuantity() : 0).sum();
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
                int invQty = payment.getPoUnitPrice().compareTo(BigDecimal.ZERO) > 0
                        ? firstInv.getTotalAmount().divide(payment.getPoUnitPrice(), 0, RoundingMode.HALF_UP).intValue()
                        : poQty;
                payment.setInvoiceQuantity(invQty);
                payment.setInvoiceUnitPrice(invQty > 0 ? firstInv.getTotalAmount().divide(BigDecimal.valueOf(invQty), 2, RoundingMode.HALF_UP) : payment.getPoUnitPrice());
            } else {
                payment.setInvoiceNumber("INV-2026-" + String.format("%04d", num + 100));
                payment.setInvoiceDate(LocalDate.now());
                payment.setInvoiceQuantity(poQty);
                payment.setInvoiceUnitPrice(payment.getPoUnitPrice());
                payment.setInvoiceAmount(poAmount);
            }

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
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        return mapToResponse(payment);
    }

    public PaymentResponse updatePaymentStatus(UUID id, PaymentStatusUpdateRequest request, String buyerEmail) {
        Payment payment = paymentRepository.findById(id)
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

        Payment payment = paymentRepository.findById(id)
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

        Payment payment = paymentRepository.findById(id)
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
            payment = paymentRepository.findById(request.getId()).orElse(new Payment());
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
            userRepository.findById(request.getBuyerId()).ifPresent(payment::setBuyer);
        }
        if (request.getBuyerName() != null && !request.getBuyerName().isBlank()) {
            payment.setBuyerName(request.getBuyerName());
        }

        if (request.getSupplierId() != null) {
            userRepository.findById(request.getSupplierId()).ifPresent(payment::setSupplier);
        }
        if (request.getSupplierName() != null) {
            payment.setSupplierName(request.getSupplierName());
        }

        if (request.getRequisitionId() != null) {
            requisitionRepository.findById(request.getRequisitionId()).ifPresent(payment::setRequisition);
        }
        if (request.getPurchaseReceiptId() != null) {
            purchaseReceiptRepository.findById(request.getPurchaseReceiptId()).ifPresent(payment::setPurchaseReceipt);
        }
        if (request.getInvoiceId() != null) {
            invoiceRepository.findById(request.getInvoiceId()).ifPresent(payment::setInvoice);
        }
        if (request.getReconciliationId() != null) {
            reconciliationRepository.findById(request.getReconciliationId()).ifPresent(payment::setReconciliation);
        }

        payment.setPoNumber(request.getPoNumber());
        payment.setPoQuantity(request.getPoQuantity() != null ? request.getPoQuantity() : 0);
        payment.setPoUnitPrice(request.getPoUnitPrice() != null ? request.getPoUnitPrice() : BigDecimal.ZERO);
        payment.setPoAmount(request.getPoAmount() != null ? request.getPoAmount() : BigDecimal.ZERO);

        payment.setReceiptNumber(request.getReceiptNumber());
        payment.setReceiptDate(request.getReceiptDate());
        payment.setReceivedQuantity(request.getReceivedQuantity() != null ? request.getReceivedQuantity() : 0);
        payment.setReceivedAmount(request.getReceivedAmount() != null ? request.getReceivedAmount() : BigDecimal.ZERO);

        payment.setInvoiceNumber(request.getInvoiceNumber());
        payment.setInvoiceDate(request.getInvoiceDate());
        payment.setInvoiceQuantity(request.getInvoiceQuantity() != null ? request.getInvoiceQuantity() : 0);
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

        // Record 2: Exception Case (Invoice quantity exceeds received quantity)
        Payment p2 = new Payment();
        p2.setId(UUID.randomUUID());
        p2.setPaymentId(generateUniquePaymentId());
        p2.setPaymentDate(LocalDate.now());
        p2.setBuyer(buyer);
        p2.setSupplier(supplier);
        p2.setSupplierName(supplier != null ? getUserDisplayName(supplier) : "ABC Technologies Pvt Ltd");
        p2.setPoNumber("PO-2026-00126");
        p2.setPoQuantity(100);
        p2.setPoUnitPrice(new BigDecimal("1250.00"));
        p2.setPoAmount(new BigDecimal("125000.00"));

        p2.setReceiptNumber("REC-004");
        p2.setReceiptDate(LocalDate.now().minusDays(4));
        p2.setReceivedQuantity(80);
        p2.setReceivedAmount(new BigDecimal("100000.00"));

        p2.setInvoiceNumber("INV-2026-00457");
        p2.setInvoiceDate(LocalDate.now().minusDays(1));
        p2.setInvoiceQuantity(100);
        p2.setInvoiceUnitPrice(new BigDecimal("1250.00"));
        p2.setInvoiceAmount(new BigDecimal("125000.00"));

        p2.setAmountToPay(new BigDecimal("125000.00"));
        p2.setReconciliationStatus("Exception");
        p2.setExceptionReason("Invoice quantity exceeds received quantity.");
        p2.setPaymentStatus("On Hold");
        p2.setCurrency("INR");
        p2.setCreatedAt(LocalDateTime.now().minusHours(3));
        paymentRepository.save(p2);

        // Record 3: Paid Case
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
        r.setPoQuantity(p.getPoQuantity() != null ? p.getPoQuantity() : 0);
        r.setPoUnitPrice(p.getPoUnitPrice() != null ? p.getPoUnitPrice() : BigDecimal.ZERO);
        r.setPoAmount(p.getPoAmount() != null ? p.getPoAmount() : BigDecimal.ZERO);

        if (p.getPurchaseReceipt() != null) {
            r.setPurchaseReceiptId(p.getPurchaseReceipt().getId());
        }
        r.setReceiptNumber(p.getReceiptNumber());
        r.setReceiptDate(p.getReceiptDate());
        r.setReceivedQuantity(p.getReceivedQuantity() != null ? p.getReceivedQuantity() : 0);
        r.setReceivedAmount(p.getReceivedAmount() != null ? p.getReceivedAmount() : BigDecimal.ZERO);

        if (p.getInvoice() != null) {
            r.setInvoiceId(p.getInvoice().getId());
        }
        r.setInvoiceNumber(p.getInvoiceNumber());
        r.setInvoiceDate(p.getInvoiceDate());
        r.setInvoiceQuantity(p.getInvoiceQuantity() != null ? p.getInvoiceQuantity() : 0);
        r.setInvoiceUnitPrice(p.getInvoiceUnitPrice() != null ? p.getInvoiceUnitPrice() : BigDecimal.ZERO);
        r.setInvoiceAmount(p.getInvoiceAmount() != null ? p.getInvoiceAmount() : BigDecimal.ZERO);

        if (p.getReconciliation() != null) {
            r.setReconciliationId(p.getReconciliation().getId());
        }
        r.setReconciliationStatus(p.getReconciliationStatus() != null ? p.getReconciliationStatus() : "Matched");
        r.setExceptionReason(p.getExceptionReason());

        int poQ = r.getPoQuantity();
        int recQ = r.getReceivedQuantity();
        int invQ = r.getInvoiceQuantity();
        r.setPoVsReceiptQtyVariance(recQ - poQ);
        r.setReceiptVsInvoiceQtyVariance(invQ - recQ);
        r.setPoVsInvoiceQtyVariance(invQ - poQ);

        BigDecimal poPrice = r.getPoUnitPrice();
        BigDecimal invPrice = r.getInvoiceUnitPrice();
        r.setPriceVariance(invPrice.subtract(poPrice).setScale(2, RoundingMode.HALF_UP));

        BigDecimal poAmt = r.getPoAmount();
        BigDecimal invAmt = r.getInvoiceAmount();
        r.setAmountVariance(invAmt.subtract(poAmt).setScale(2, RoundingMode.HALF_UP));

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

