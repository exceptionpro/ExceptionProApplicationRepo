package com.exceptionpro.service;

import com.exceptionpro.dto.ReconciliationItemDto;
import com.exceptionpro.dto.ReconciliationResponse;
import com.exceptionpro.dto.ReconciliationSaveRequest;
import com.exceptionpro.dto.ReconciliationSummaryDto;
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
public class ReconciliationService {

    private final RequisitionRepository requisitionRepository;
    private final CollaborationRequisitionRepository collaborationRequisitionRepository;
    private final PurchaseReceiptRepository purchaseReceiptRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;
    private final ReconciliationRepository reconciliationRepository;

    public ReconciliationService(RequisitionRepository requisitionRepository,
                                 CollaborationRequisitionRepository collaborationRequisitionRepository,
                                 PurchaseReceiptRepository purchaseReceiptRepository,
                                 InvoiceRepository invoiceRepository,
                                 UserRepository userRepository,
                                 ReconciliationRepository reconciliationRepository) {
        this.requisitionRepository = requisitionRepository;
        this.collaborationRequisitionRepository = collaborationRequisitionRepository;
        this.purchaseReceiptRepository = purchaseReceiptRepository;
        this.invoiceRepository = invoiceRepository;
        this.userRepository = userRepository;
        this.reconciliationRepository = reconciliationRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getBuyerReconciliationData(String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        List<Requisition> standardReqs = requisitionRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        List<CollaborationRequisition> collabReqs = collaborationRequisitionRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        List<PurchaseReceipt> allReceipts = purchaseReceiptRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        List<Invoice> allInvoices = invoiceRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());
        List<Reconciliation> savedReconciliations = reconciliationRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());

        Map<UUID, Reconciliation> savedMap = savedReconciliations.stream()
                .filter(r -> r.getRequisition() != null)
                .collect(Collectors.toMap(r -> r.getRequisition().getId(), r -> r, (a, b) -> a));

        List<ReconciliationResponse> records = new ArrayList<>();

        // 1. Process Standard Purchase Orders
        for (Requisition req : standardReqs) {
            List<PurchaseReceipt> poReceipts = allReceipts.stream()
                    .filter(rc -> rc.getPurchaseOrder() != null && rc.getPurchaseOrder().getId().equals(req.getId()))
                    .collect(Collectors.toList());

            List<Invoice> poInvoices = allInvoices.stream()
                    .filter(inv -> inv.getRequisition() != null && inv.getRequisition().getId().equals(req.getId()))
                    .collect(Collectors.toList());

            Reconciliation saved = savedMap.get(req.getId());
            ReconciliationResponse resp = buildStandardReconciliation(req, poReceipts, poInvoices, saved);
            records.add(resp);
        }

        // 2. Process Collaboration Requisitions
        for (CollaborationRequisition collab : collabReqs) {
            List<Invoice> collabInvoices = allInvoices.stream()
                    .filter(inv -> inv.getCollaborationRequisition() != null && inv.getCollaborationRequisition().getId().equals(collab.getId()))
                    .collect(Collectors.toList());

            if (!collab.getItems().isEmpty()) {
                ReconciliationResponse resp = buildCollabReconciliation(collab, collabInvoices);
                records.add(resp);
            }
        }

        // Build Summary KPIs
        ReconciliationSummaryDto summary = buildSummary(records);

        Map<String, Object> result = new HashMap<>();
        result.put("summary", summary);
        result.put("records", records);

        return result;
    }

    public ReconciliationResponse saveReconciliation(ReconciliationSaveRequest request, String buyerEmail) {
        User buyer = userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        Requisition req = null;
        if (request.getRequisitionId() != null) {
            req = requisitionRepository.findById(request.getRequisitionId()).orElse(null);
        }

        User supplier = null;
        if (request.getSupplierId() != null) {
            supplier = userRepository.findById(request.getSupplierId()).orElse(null);
        } else if (req != null && req.getSupplier() != null) {
            supplier = req.getSupplier();
        }

        String recNum = request.getReconciliationNumber();
        if (recNum == null || recNum.trim().isEmpty()) {
            int count = (int) reconciliationRepository.count() + 1;
            recNum = String.format("REC-%d-%04d", LocalDate.now().getYear(), count);
        }

        Reconciliation rec = reconciliationRepository.findByReconciliationNumber(recNum.trim())
                .orElse(new Reconciliation());

        if (rec.getId() == null) {
            rec.setId(UUID.randomUUID());
            rec.setCreatedAt(LocalDateTime.now());
        }

        rec.setReconciliationNumber(recNum.trim());
        rec.setReconciliationDate(request.getReconciliationDate() != null ? request.getReconciliationDate() : LocalDate.now());
        rec.setBuyer(buyer);
        rec.setSupplier(supplier);
        rec.setRequisition(req);
        rec.setPoNumber(request.getPoNumber());
        rec.setReceiptGrnNumber(request.getReceiptGrnNumber());
        rec.setInvoiceNumber(request.getInvoiceNumber());
        rec.setCurrency(request.getCurrency() != null ? request.getCurrency() : "INR");
        rec.setStatus(request.getStatus() != null ? request.getStatus() : request.getOverallResult());

        rec.setPoQuantity(request.getPoQuantity() != null ? request.getPoQuantity() : 0);
        rec.setReceiptQuantity(request.getReceiptQuantity() != null ? request.getReceiptQuantity() : 0);
        rec.setInvoiceQuantity(request.getInvoiceQuantity() != null ? request.getInvoiceQuantity() : 0);
        rec.setPoVsReceiptQtyVariance(request.getPoVsReceiptQtyVariance() != null ? request.getPoVsReceiptQtyVariance() : 0);
        rec.setReceiptVsInvoiceQtyVariance(request.getReceiptVsInvoiceQtyVariance() != null ? request.getReceiptVsInvoiceQtyVariance() : 0);
        rec.setPoVsInvoiceQtyVariance(request.getPoVsInvoiceQtyVariance() != null ? request.getPoVsInvoiceQtyVariance() : 0);
        rec.setQuantityMatchStatus(request.getQuantityMatchStatus() != null ? request.getQuantityMatchStatus() : "PARTIAL");

        rec.setPoUnitPrice(request.getPoUnitPrice() != null ? request.getPoUnitPrice() : BigDecimal.ZERO);
        rec.setInvoiceUnitPrice(request.getInvoiceUnitPrice() != null ? request.getInvoiceUnitPrice() : BigDecimal.ZERO);
        rec.setPriceVariance(request.getPriceVariance() != null ? request.getPriceVariance() : BigDecimal.ZERO);
        rec.setPriceVariancePercentage(request.getPriceVariancePercentage() != null ? request.getPriceVariancePercentage() : BigDecimal.ZERO);
        rec.setPriceMatchStatus(request.getPriceMatchStatus() != null ? request.getPriceMatchStatus() : "MISMATCH");

        rec.setPoAmount(request.getPoAmount() != null ? request.getPoAmount() : BigDecimal.ZERO);
        rec.setReceiptAmount(request.getReceiptAmount() != null ? request.getReceiptAmount() : BigDecimal.ZERO);
        rec.setInvoiceAmount(request.getInvoiceAmount() != null ? request.getInvoiceAmount() : BigDecimal.ZERO);
        rec.setPoVsReceiptAmtVariance(request.getPoVsReceiptAmtVariance() != null ? request.getPoVsReceiptAmtVariance() : BigDecimal.ZERO);
        rec.setReceiptVsInvoiceAmtVariance(request.getReceiptVsInvoiceAmtVariance() != null ? request.getReceiptVsInvoiceAmtVariance() : BigDecimal.ZERO);
        rec.setPoVsInvoiceAmtVariance(request.getPoVsInvoiceAmtVariance() != null ? request.getPoVsInvoiceAmtVariance() : BigDecimal.ZERO);
        rec.setAmountMatchStatus(request.getAmountMatchStatus() != null ? request.getAmountMatchStatus() : "PARTIAL");

        rec.setOverallResult(request.getOverallResult() != null ? request.getOverallResult() : "EXCEPTION");
        rec.setRemarks(request.getRemarks());
        rec.setUpdatedAt(LocalDateTime.now());

        Reconciliation saved = reconciliationRepository.save(rec);

        // Convert saved to response
        ReconciliationResponse resp = new ReconciliationResponse();
        resp.setId(saved.getId());
        resp.setReconciliationNumber(saved.getReconciliationNumber());
        resp.setReconciliationDate(saved.getReconciliationDate());
        resp.setPoNumber(saved.getPoNumber());
        resp.setReceiptGrnNumber(saved.getReceiptGrnNumber());
        resp.setInvoiceNumber(saved.getInvoiceNumber());
        resp.setCurrency(saved.getCurrency());
        resp.setStatus(saved.getStatus());

        resp.setPoQuantity(saved.getPoQuantity());
        resp.setReceiptQuantity(saved.getReceiptQuantity());
        resp.setInvoiceQuantity(saved.getInvoiceQuantity());
        resp.setPoVsReceiptQtyVariance(saved.getPoVsReceiptQtyVariance());
        resp.setReceiptVsInvoiceQtyVariance(saved.getReceiptVsInvoiceQtyVariance());
        resp.setPoVsInvoiceQtyVariance(saved.getPoVsInvoiceQtyVariance());
        resp.setQuantityMatchStatus(saved.getQuantityMatchStatus());
        resp.setQuantityMatch(saved.getQuantityMatchStatus());

        resp.setPoUnitPrice(saved.getPoUnitPrice());
        resp.setInvoiceUnitPrice(saved.getInvoiceUnitPrice());
        resp.setPriceVariance(saved.getPriceVariance());
        resp.setPriceVariancePercentage(saved.getPriceVariancePercentage());
        resp.setPriceMatchStatus(saved.getPriceMatchStatus());
        resp.setPriceMatch(saved.getPriceMatchStatus());

        resp.setPoAmount(saved.getPoAmount());
        resp.setReceiptAmount(saved.getReceiptAmount());
        resp.setInvoiceAmount(saved.getInvoiceAmount());
        resp.setPoVsReceiptAmtVariance(saved.getPoVsReceiptAmtVariance());
        resp.setReceiptVsInvoiceAmtVariance(saved.getReceiptVsInvoiceAmtVariance());
        resp.setPoVsInvoiceAmtVariance(saved.getPoVsInvoiceAmtVariance());
        resp.setAmountMatchStatus(saved.getAmountMatchStatus());
        resp.setAmountMatch(saved.getAmountMatchStatus());

        resp.setOverallResult(saved.getOverallResult());
        resp.setRemarks(saved.getRemarks());

        if (saved.getSupplier() != null) {
            resp.setSupplierId(saved.getSupplier().getId());
            resp.setSupplierName(getUserDisplayName(saved.getSupplier()));
            resp.setSupplierEmail(saved.getSupplier().getEmail());
        }

        return resp;
    }

    private ReconciliationResponse buildStandardReconciliation(Requisition req,
                                                               List<PurchaseReceipt> receipts,
                                                               List<Invoice> invoices,
                                                               Reconciliation saved) {
        ReconciliationResponse resp = new ReconciliationResponse();
        resp.setId(req.getId());
        resp.setRequestType("STANDARD");
        int num = req.getReqNumber() != null ? req.getReqNumber() : 1;
        String poCode = String.format("PO%02d", num);
        resp.setPoNumber(poCode);
        resp.setOrderTitle(req.getTitle());
        resp.setCurrency("INR");

        // Reconciliation Number & Date
        if (saved != null && saved.getReconciliationNumber() != null) {
            resp.setReconciliationNumber(saved.getReconciliationNumber());
            resp.setReconciliationDate(saved.getReconciliationDate());
            resp.setRemarks(saved.getRemarks());
        } else {
            resp.setReconciliationNumber(String.format("REC-%d-%04d", LocalDate.now().getYear(), num));
            resp.setReconciliationDate(LocalDate.now());
        }

        // Supplier info
        if (req.getSupplier() != null) {
            resp.setSupplierId(req.getSupplier().getId());
            resp.setSupplierName(getUserDisplayName(req.getSupplier()));
            resp.setSupplierEmail(req.getSupplier().getEmail());
        } else {
            resp.setSupplierName("Unassigned Supplier");
            resp.setSupplierEmail("");
        }

        if (req.getBuyer() != null) {
            resp.setBuyerId(req.getBuyer().getId());
            resp.setBuyerName(getUserDisplayName(req.getBuyer()));
        }

        // 1. PO Calculations
        int totalPoQty = 0;
        BigDecimal totalPoAmount = BigDecimal.ZERO;

        List<ReconciliationItemDto> itemDtos = new ArrayList<>();
        if (req.getItems() != null) {
            for (RequisitionItem item : req.getItems()) {
                int q = item.getQuantity() != null ? item.getQuantity() : 0;
                BigDecimal price = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
                BigDecimal lineAmount = price.multiply(BigDecimal.valueOf(q));

                totalPoQty += q;
                totalPoAmount = totalPoAmount.add(lineAmount);
            }
        }

        resp.setPoQuantity(totalPoQty);
        resp.setPoAmount(totalPoAmount.setScale(2, RoundingMode.HALF_UP));

        BigDecimal poUnitPrice = totalPoQty > 0
                ? totalPoAmount.divide(BigDecimal.valueOf(totalPoQty), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        resp.setPoUnitPrice(poUnitPrice);

        // 2. Receipt / GRN Calculations
        int totalReceiptQty = 0;
        List<String> grnList = new ArrayList<>();
        for (PurchaseReceipt rc : receipts) {
            if (rc.getQuantity() != null) {
                totalReceiptQty += rc.getQuantity();
            }
            if (rc.getReceiptNo() != null) {
                grnList.add(rc.getReceiptNo());
                resp.getReceiptNumbers().add(rc.getReceiptNo());
            }
            if (rc.getReceiptDate() != null) {
                resp.getReceiptDates().add(rc.getReceiptDate());
            }
            if (rc.getReceivedStatus() != null) {
                resp.getReceiptStatuses().add(rc.getReceivedStatus());
            }
        }

        resp.setReceiptQuantity(totalReceiptQty);
        BigDecimal receiptAmount = poUnitPrice.multiply(BigDecimal.valueOf(totalReceiptQty)).setScale(2, RoundingMode.HALF_UP);
        resp.setReceiptAmount(receiptAmount);
        resp.setReceiptGrnNumber(grnList.isEmpty() ? "N/A" : String.join(", ", grnList));

        // 3. Invoice Calculations
        BigDecimal totalInvoiceAmount = BigDecimal.ZERO;
        List<String> invList = new ArrayList<>();
        for (Invoice inv : invoices) {
            if (inv.getTotalAmount() != null) {
                totalInvoiceAmount = totalInvoiceAmount.add(inv.getTotalAmount());
            }
            if (inv.getInvoiceNumber() != null) {
                invList.add(inv.getInvoiceNumber());
                resp.getInvoiceNumbers().add(inv.getInvoiceNumber());
            }
            if (inv.getInvoiceDate() != null) {
                resp.getInvoiceDates().add(inv.getInvoiceDate());
            }
            if (inv.getStatus() != null) {
                resp.getInvoiceStatuses().add(inv.getStatus());
            }
        }

        resp.setInvoiceAmount(totalInvoiceAmount.setScale(2, RoundingMode.HALF_UP));
        resp.setInvoiceNumber(invList.isEmpty() ? "N/A" : String.join(", ", invList));

        int invoiceQty;
        BigDecimal invoiceUnitPrice;

        if (invoices.isEmpty()) {
            invoiceQty = 0;
            invoiceUnitPrice = BigDecimal.ZERO;
        } else if (poUnitPrice.compareTo(BigDecimal.ZERO) > 0) {
            invoiceQty = totalInvoiceAmount.divide(poUnitPrice, 0, RoundingMode.HALF_UP).intValue();
            invoiceUnitPrice = invoiceQty > 0
                    ? totalInvoiceAmount.divide(BigDecimal.valueOf(invoiceQty), 2, RoundingMode.HALF_UP)
                    : poUnitPrice;
        } else {
            invoiceQty = totalPoQty;
            invoiceUnitPrice = totalPoQty > 0
                    ? totalInvoiceAmount.divide(BigDecimal.valueOf(totalPoQty), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
        }

        resp.setInvoiceQuantity(invoiceQty);
        resp.setInvoiceUnitPrice(invoiceUnitPrice.setScale(2, RoundingMode.HALF_UP));

        // ----------------------------------------------------
        // 1. QUANTITY RECONCILIATION VARIANCES & STATUS
        // ----------------------------------------------------
        int poVsReceiptQtyVar = totalReceiptQty - totalPoQty;
        int receiptVsInvoiceQtyVar = invoiceQty - totalReceiptQty;
        int poVsInvoiceQtyVar = invoiceQty - totalPoQty;

        resp.setPoVsReceiptQtyVariance(poVsReceiptQtyVar);
        resp.setReceiptVsInvoiceQtyVariance(receiptVsInvoiceQtyVar);
        resp.setPoVsInvoiceQtyVariance(poVsInvoiceQtyVar);

        String qStatus;
        if (receipts.isEmpty() && invoices.isEmpty()) {
            qStatus = "MISMATCH";
        } else if (totalPoQty == totalReceiptQty && totalReceiptQty == invoiceQty) {
            qStatus = "MATCHED";
        } else if (totalReceiptQty > 0 || invoiceQty > 0) {
            qStatus = "PARTIAL";
        } else {
            qStatus = "MISMATCH";
        }
        resp.setQuantityMatchStatus(qStatus);
        resp.setQuantityMatch(qStatus);

        // ----------------------------------------------------
        // 2. PRICE RECONCILIATION VARIANCES & STATUS
        // ----------------------------------------------------
        BigDecimal priceVar = invoiceUnitPrice.subtract(poUnitPrice).setScale(2, RoundingMode.HALF_UP);
        BigDecimal priceVarPct = BigDecimal.ZERO;
        if (poUnitPrice.compareTo(BigDecimal.ZERO) > 0) {
            priceVarPct = priceVar.multiply(BigDecimal.valueOf(100)).divide(poUnitPrice, 2, RoundingMode.HALF_UP);
        }

        resp.setPriceVariance(priceVar);
        resp.setPriceVariancePercentage(priceVarPct);

        String pStatus;
        if (invoices.isEmpty()) {
            pStatus = "MISMATCH";
        } else if (poUnitPrice.compareTo(invoiceUnitPrice) == 0) {
            pStatus = "MATCHED";
        } else {
            pStatus = "MISMATCH";
        }
        resp.setPriceMatchStatus(pStatus);
        resp.setPriceMatch(pStatus);

        // ----------------------------------------------------
        // 3. AMOUNT RECONCILIATION VARIANCES & STATUS
        // ----------------------------------------------------
        BigDecimal poVsReceiptAmtVar = receiptAmount.subtract(totalPoAmount).setScale(2, RoundingMode.HALF_UP);
        BigDecimal receiptVsInvoiceAmtVar = totalInvoiceAmount.subtract(receiptAmount).setScale(2, RoundingMode.HALF_UP);
        BigDecimal poVsInvoiceAmtVar = totalInvoiceAmount.subtract(totalPoAmount).setScale(2, RoundingMode.HALF_UP);

        resp.setPoVsReceiptAmtVariance(poVsReceiptAmtVar);
        resp.setReceiptVsInvoiceAmtVariance(receiptVsInvoiceAmtVar);
        resp.setPoVsInvoiceAmtVariance(poVsInvoiceAmtVar);

        String aStatus;
        if (receipts.isEmpty() && invoices.isEmpty()) {
            aStatus = "MISMATCH";
        } else if (totalPoAmount.compareTo(receiptAmount) == 0 && receiptAmount.compareTo(totalInvoiceAmount) == 0) {
            aStatus = "MATCHED";
        } else if (receiptAmount.compareTo(BigDecimal.ZERO) > 0 || totalInvoiceAmount.compareTo(BigDecimal.ZERO) > 0) {
            aStatus = "PARTIAL";
        } else {
            aStatus = "MISMATCH";
        }
        resp.setAmountMatchStatus(aStatus);
        resp.setAmountMatch(aStatus);

        // ----------------------------------------------------
        // 4. OVERALL RECONCILIATION RESULT
        // ----------------------------------------------------
        String overall;
        if ("MATCHED".equals(qStatus) && "MATCHED".equals(pStatus) && "MATCHED".equals(aStatus)) {
            overall = "MATCHED";
        } else if ("PARTIAL".equals(qStatus) || "PARTIAL".equals(aStatus) || "MISMATCH".equals(pStatus)) {
            overall = "EXCEPTION";
        } else {
            overall = "EXCEPTION";
        }

        resp.setOverallResult(overall);
        resp.setStatus(saved != null && saved.getStatus() != null ? saved.getStatus() : overall);

        // Line item details
        if (req.getItems() != null) {
            int itemCount = req.getItems().size();
            for (RequisitionItem item : req.getItems()) {
                int itemPoQty = item.getQuantity() != null ? item.getQuantity() : 0;
                BigDecimal itemPoPrice = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
                BigDecimal itemPoAmt = itemPoPrice.multiply(BigDecimal.valueOf(itemPoQty)).setScale(2, RoundingMode.HALF_UP);

                int itemRecQty = (itemCount == 1) ? totalReceiptQty : (totalPoQty > 0 ? (int) Math.round((double) itemPoQty / totalPoQty * totalReceiptQty) : 0);
                BigDecimal itemRecAmt = itemPoPrice.multiply(BigDecimal.valueOf(itemRecQty)).setScale(2, RoundingMode.HALF_UP);

                int itemInvQty = (itemCount == 1) ? invoiceQty : (totalPoQty > 0 ? (int) Math.round((double) itemPoQty / totalPoQty * invoiceQty) : 0);
                BigDecimal itemInvPrice = !invoices.isEmpty() ? invoiceUnitPrice : BigDecimal.ZERO;
                BigDecimal itemInvAmt = (itemCount == 1) ? totalInvoiceAmount : (totalPoAmount.compareTo(BigDecimal.ZERO) > 0 ? totalInvoiceAmount.multiply(itemPoAmt).divide(totalPoAmount, 2, RoundingMode.HALF_UP) : BigDecimal.ZERO);

                ReconciliationItemDto itemDto = new ReconciliationItemDto(
                        item.getId(),
                        item.getProductName(),
                        item.getFullDescription(),
                        item.getUnitMeasure(),
                        itemPoQty,
                        itemPoPrice,
                        itemPoAmt,
                        itemRecQty,
                        itemRecAmt,
                        itemInvQty,
                        itemInvPrice,
                        itemInvAmt,
                        (itemPoQty == itemRecQty && itemRecQty == itemInvQty) ? "MATCHED" : "PARTIAL",
                        (itemPoPrice.compareTo(itemInvPrice) == 0) ? "MATCHED" : "MISMATCH",
                        (itemPoAmt.compareTo(itemRecAmt) == 0 && itemRecAmt.compareTo(itemInvAmt) == 0) ? "MATCHED" : "PARTIAL"
                );
                itemDtos.add(itemDto);
            }
        }
        resp.setItems(itemDtos);

        return resp;
    }

    private ReconciliationResponse buildCollabReconciliation(CollaborationRequisition collab,
                                                              List<Invoice> invoices) {
        ReconciliationResponse resp = new ReconciliationResponse();
        resp.setId(collab.getId());
        resp.setRequestType("COLLABORATION");
        resp.setPoNumber("COLLAB");
        resp.setOrderTitle(collab.getTitle());
        resp.setCurrency("INR");
        resp.setReconciliationNumber(String.format("REC-%d-COL", LocalDate.now().getYear()));
        resp.setReconciliationDate(LocalDate.now());

        if (collab.getSuppliers() != null && !collab.getSuppliers().isEmpty()) {
            User sup = collab.getSuppliers().get(0);
            resp.setSupplierId(sup.getId());
            resp.setSupplierName(getUserDisplayName(sup));
            resp.setSupplierEmail(sup.getEmail());
        } else {
            resp.setSupplierName("Collaborative Supplier");
            resp.setSupplierEmail("");
        }

        int totalPoQty = 0;
        BigDecimal totalPoAmount = BigDecimal.ZERO;

        if (collab.getItems() != null) {
            for (CollaborationRequisitionItem item : collab.getItems()) {
                int q = item.getQuantity() != null ? item.getQuantity() : 0;
                BigDecimal price = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
                totalPoQty += q;
                totalPoAmount = totalPoAmount.add(price.multiply(BigDecimal.valueOf(q)));
            }
        }

        resp.setPoQuantity(totalPoQty);
        resp.setPoAmount(totalPoAmount.setScale(2, RoundingMode.HALF_UP));

        BigDecimal poUnitPrice = totalPoQty > 0
                ? totalPoAmount.divide(BigDecimal.valueOf(totalPoQty), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        resp.setPoUnitPrice(poUnitPrice);

        resp.setReceiptQuantity(0);
        resp.setReceiptAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        resp.setReceiptGrnNumber("N/A");

        BigDecimal totalInvoiceAmount = BigDecimal.ZERO;
        List<String> invList = new ArrayList<>();
        for (Invoice inv : invoices) {
            if (inv.getTotalAmount() != null) {
                totalInvoiceAmount = totalInvoiceAmount.add(inv.getTotalAmount());
            }
            if (inv.getInvoiceNumber() != null) {
                invList.add(inv.getInvoiceNumber());
            }
        }

        resp.setInvoiceAmount(totalInvoiceAmount.setScale(2, RoundingMode.HALF_UP));
        resp.setInvoiceNumber(invList.isEmpty() ? "N/A" : String.join(", ", invList));

        int invoiceQty = invoices.isEmpty() ? 0 : totalPoQty;
        BigDecimal invoiceUnitPrice = invoiceQty > 0 ? totalInvoiceAmount.divide(BigDecimal.valueOf(invoiceQty), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        resp.setInvoiceQuantity(invoiceQty);
        resp.setInvoiceUnitPrice(invoiceUnitPrice.setScale(2, RoundingMode.HALF_UP));

        resp.setPoVsReceiptQtyVariance(-totalPoQty);
        resp.setReceiptVsInvoiceQtyVariance(invoiceQty);
        resp.setPoVsInvoiceQtyVariance(invoiceQty - totalPoQty);
        resp.setQuantityMatchStatus(invoices.isEmpty() ? "MISMATCH" : "PARTIAL");
        resp.setQuantityMatch(resp.getQuantityMatchStatus());

        BigDecimal priceVar = invoiceUnitPrice.subtract(poUnitPrice).setScale(2, RoundingMode.HALF_UP);
        BigDecimal priceVarPct = poUnitPrice.compareTo(BigDecimal.ZERO) > 0 ? priceVar.multiply(BigDecimal.valueOf(100)).divide(poUnitPrice, 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        resp.setPriceVariance(priceVar);
        resp.setPriceVariancePercentage(priceVarPct);
        resp.setPriceMatchStatus(poUnitPrice.compareTo(invoiceUnitPrice) == 0 ? "MATCHED" : "MISMATCH");
        resp.setPriceMatch(resp.getPriceMatchStatus());

        resp.setPoVsReceiptAmtVariance(totalPoAmount.negate().setScale(2, RoundingMode.HALF_UP));
        resp.setReceiptVsInvoiceAmtVariance(totalInvoiceAmount.setScale(2, RoundingMode.HALF_UP));
        resp.setPoVsInvoiceAmtVariance(totalInvoiceAmount.subtract(totalPoAmount).setScale(2, RoundingMode.HALF_UP));
        resp.setAmountMatchStatus(invoices.isEmpty() ? "MISMATCH" : "PARTIAL");
        resp.setAmountMatch(resp.getAmountMatchStatus());

        resp.setOverallResult("EXCEPTION");
        resp.setStatus("EXCEPTION");

        return resp;
    }

    private ReconciliationSummaryDto buildSummary(List<ReconciliationResponse> records) {
        int total = records.size();
        int fullMatch = 0;
        int qtyMismatch = 0;
        int priceMismatch = 0;
        int amountMismatch = 0;
        int missingReceipt = 0;
        int missingInvoice = 0;

        BigDecimal totalPo = BigDecimal.ZERO;
        BigDecimal totalRec = BigDecimal.ZERO;
        BigDecimal totalInv = BigDecimal.ZERO;

        for (ReconciliationResponse r : records) {
            if ("MATCHED".equalsIgnoreCase(r.getOverallResult())) {
                fullMatch++;
            } else if ("EXCEPTION".equalsIgnoreCase(r.getOverallResult())) {
                if ("MISMATCH".equalsIgnoreCase(r.getPriceMatch()) || "MISMATCH".equalsIgnoreCase(r.getPriceMatchStatus())) {
                    priceMismatch++;
                }
                if ("PARTIAL".equalsIgnoreCase(r.getQuantityMatch()) || "MISMATCH".equalsIgnoreCase(r.getQuantityMatch())) {
                    qtyMismatch++;
                }
                if ("PARTIAL".equalsIgnoreCase(r.getAmountMatch()) || "MISMATCH".equalsIgnoreCase(r.getAmountMatch())) {
                    amountMismatch++;
                }
            }

            if (r.getReceiptQuantity() == null || r.getReceiptQuantity() == 0) {
                missingReceipt++;
            }
            if (r.getInvoiceQuantity() == null || r.getInvoiceQuantity() == 0) {
                missingInvoice++;
            }

            if (r.getPoAmount() != null) {
                totalPo = totalPo.add(r.getPoAmount());
            }
            if (r.getReceiptAmount() != null) {
                totalRec = totalRec.add(r.getReceiptAmount());
            }
            if (r.getInvoiceAmount() != null) {
                totalInv = totalInv.add(r.getInvoiceAmount());
            }
        }

        return new ReconciliationSummaryDto(
                total,
                fullMatch,
                qtyMismatch,
                priceMismatch,
                amountMismatch,
                missingReceipt,
                missingInvoice,
                totalPo.setScale(2, RoundingMode.HALF_UP),
                totalRec.setScale(2, RoundingMode.HALF_UP),
                totalInv.setScale(2, RoundingMode.HALF_UP)
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
