package com.exceptionpro.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.exceptionpro.dto.ReconciliationItemDto;
import com.exceptionpro.dto.ReconciliationResponse;
import com.exceptionpro.dto.ReconciliationSaveRequest;
import com.exceptionpro.dto.ReconciliationSummaryDto;
import com.exceptionpro.entity.CollaborationRequisition;
import com.exceptionpro.entity.CollaborationRequisitionItem;
import com.exceptionpro.entity.Invoice;
import com.exceptionpro.entity.PurchaseReceipt;
import com.exceptionpro.entity.Reconciliation;
import com.exceptionpro.entity.Requisition;
import com.exceptionpro.entity.RequisitionItem;
import com.exceptionpro.entity.User;
import com.exceptionpro.repository.CollaborationRequisitionRepository;
import com.exceptionpro.repository.InvoiceRepository;
import com.exceptionpro.repository.PurchaseReceiptRepository;
import com.exceptionpro.repository.ReconciliationRepository;
import com.exceptionpro.repository.RequisitionRepository;
import com.exceptionpro.repository.UserRepository;

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

            // Check if PO satisfies conditions a, b, c, d
            if (!isPurchaseOrderEligibleForReconciliation(req, poInvoices, poReceipts)) {
                continue;
            }

            Reconciliation saved = savedMap.get(req.getId());
            ReconciliationResponse resp = buildStandardReconciliation(req, poReceipts, poInvoices, saved);
            records.add(resp);
        }

        // 2. Collaboration Requisitions are excluded from the PO Reconciliation dropdown as they do not have Purchase Receipts

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
            req = requisitionRepository.findById(Objects.requireNonNull(request.getRequisitionId())).orElse(null);
        }

        User supplier = null;
        if (request.getSupplierId() != null) {
            supplier = userRepository.findById(Objects.requireNonNull(request.getSupplierId())).orElse(null);
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

        rec.setPoQuantity(request.getPoQuantity() != null ? request.getPoQuantity() : Integer.valueOf(0));
        rec.setReceiptQuantity(request.getReceiptQuantity() != null ? request.getReceiptQuantity() : Integer.valueOf(0));
        rec.setInvoiceQuantity(request.getInvoiceQuantity() != null ? request.getInvoiceQuantity() : Integer.valueOf(0));
        rec.setPoVsReceiptQtyVariance(request.getPoVsReceiptQtyVariance() != null ? request.getPoVsReceiptQtyVariance() : Integer.valueOf(0));
        rec.setReceiptVsInvoiceQtyVariance(request.getReceiptVsInvoiceQtyVariance() != null ? request.getReceiptVsInvoiceQtyVariance() : Integer.valueOf(0));
        rec.setPoVsInvoiceQtyVariance(request.getPoVsInvoiceQtyVariance() != null ? request.getPoVsInvoiceQtyVariance() : Integer.valueOf(0));
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

        rec.setTaxPercentage(request.getTaxPercentage() != null ? request.getTaxPercentage() : BigDecimal.ZERO);
        rec.setTaxAmount(request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO);
        rec.setCalculatedTaxAmount(request.getCalculatedTaxAmount() != null ? request.getCalculatedTaxAmount() : BigDecimal.ZERO);
        rec.setTaxVariance(request.getTaxVariance() != null ? request.getTaxVariance() : BigDecimal.ZERO);
        rec.setTaxMatchStatus(request.getTaxMatchStatus() != null ? request.getTaxMatchStatus() : "MATCHED");
        rec.setInvoiceBaseAmount(request.getInvoiceBaseAmount() != null ? request.getInvoiceBaseAmount() : BigDecimal.ZERO);

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

        resp.setTaxPercentage(saved.getTaxPercentage());
        resp.setTaxAmount(saved.getTaxAmount());
        resp.setCalculatedTaxAmount(saved.getCalculatedTaxAmount());
        resp.setTaxVariance(saved.getTaxVariance());
        resp.setTaxMatchStatus(saved.getTaxMatchStatus());
        resp.setTaxMatch(saved.getTaxMatchStatus());
        resp.setInvoiceBaseAmount(saved.getInvoiceBaseAmount());

        resp.setOverallResult(saved.getOverallResult());
        resp.setRemarks(saved.getRemarks());

        if (saved.getSupplier() != null) {
            resp.setSupplierId(saved.getSupplier().getId());
            resp.setSupplierName(getUserDisplayName(saved.getSupplier()));
            resp.setSupplierEmail(saved.getSupplier().getEmail());
        }

        return resp;
    }

    /**
     * Checks if a standard Purchase Order satisfies the buyer reconciliation conditions:
     * a) Supplier has created Invoice for that Purchase Order
     * b) Buyer has created Purchase Receipts and if it has Pending quantity = 0 and It must be approved by the Supplier
     * c) Buyer has created Purchase Receipts and It must got the Confirmation Message from the Supplier that contains content "All Items Delivered"
     * d) Buyer has created Purchase Receipts and if it has any Pending quantity > 0 and It must be approved by Supplier
     */
    public boolean isPurchaseOrderEligibleForReconciliation(Requisition req,
                                                           List<Invoice> poInvoices,
                                                           List<PurchaseReceipt> poReceipts) {
        // Condition (a): Supplier has created Invoice for that Purchase Order
        if (poInvoices == null || poInvoices.isEmpty()) {
            return false;
        }

        // Must have created Purchase Receipts
        if (poReceipts == null || poReceipts.isEmpty()) {
            return false;
        }

        // Evaluate all receipts created for this Purchase Order against conditions (b), (c), and (d)
        for (PurchaseReceipt receipt : poReceipts) {
            String approvalStatus = receipt.getSupplierApprovalStatus();
            boolean isApproved = approvalStatus != null && "Approved".equalsIgnoreCase(approvalStatus.trim());

            // All created receipts must be approved by the Supplier
            if (!isApproved) {
                return false;
            }

            int effectivePending;
            if (receipt.getSupplierApprovedPendingQuantity() != null) {
                effectivePending = receipt.getSupplierApprovedPendingQuantity();
            } else if (receipt.getPendingQuantity() != null) {
                effectivePending = receipt.getPendingQuantity();
            } else if (receipt.getPoQuantity() != null && receipt.getReceivedQuantity() != null) {
                effectivePending = Math.max(0, receipt.getPoQuantity() - receipt.getReceivedQuantity());
            } else {
                effectivePending = 0;
            }

            String confMsg = receipt.getSupplierConfirmationMessage();
            if (confMsg != null && confMsg.toLowerCase().contains("still pending")) {
                confMsg = (effectivePending == 0) ? "All Items Delivered" : "Items Pending Delivery from Supplier";
            }

            if (effectivePending == 0) {
                // Condition (b) & (c): Pending quantity = 0, must be approved by Supplier AND
                // confirmation message must contain "All Items Delivered"
                boolean hasAllDeliveredMsg = confMsg != null && confMsg.toLowerCase().contains("all items delivered");
                if (!hasAllDeliveredMsg) {
                    return false;
                }
            } else {
                // Condition (d): Pending quantity > 0 and must be approved by Supplier
                // isApproved is already validated above
            }
        }

        return true;
    }

    @Transactional(readOnly = true)
    public ReconciliationResponse getReconciliationForStandardRequisition(Requisition req) {
        if (req == null) {
            return null;
        }
        List<PurchaseReceipt> poReceipts = purchaseReceiptRepository.findAll().stream()
                .filter(rc -> rc.getPurchaseOrder() != null && rc.getPurchaseOrder().getId().equals(req.getId()))
                .collect(Collectors.toList());

        List<Invoice> poInvoices = invoiceRepository.findAll().stream()
                .filter(inv -> inv.getRequisition() != null && inv.getRequisition().getId().equals(req.getId()))
                .collect(Collectors.toList());

        Reconciliation saved = reconciliationRepository.findByRequisitionId(req.getId()).orElse(null);
        return buildStandardReconciliation(req, poReceipts, poInvoices, saved);
    }

    private ReconciliationResponse buildStandardReconciliation(Requisition req,
                                                               List<PurchaseReceipt> receipts,
                                                               List<Invoice> invoices,
                                                               Reconciliation saved) {
        ReconciliationResponse resp = new ReconciliationResponse();
        resp.setId(req.getId());
        resp.setRequestType("STANDARD");
        int num = req.getReqNumber() != null ? req.getReqNumber().intValue() : 1;
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
                int q = item.getQuantity() != null ? item.getQuantity().intValue() : 0;
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

        // 2. Receipt / GRN Calculations (Requirement 1c: use receivedQuantity)
        int totalReceiptQty = 0;
        List<String> grnList = new ArrayList<>();
        for (PurchaseReceipt rc : receipts) {
            int rQty = rc.getReceivedQuantity() != null ? rc.getReceivedQuantity().intValue() : (rc.getQuantity() != null ? rc.getQuantity().intValue() : 0);
            totalReceiptQty += rQty;
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
        // Requirement 3b: Receipt Amount = Received Quantity * PO Price
        BigDecimal receiptAmount = poUnitPrice.multiply(BigDecimal.valueOf(totalReceiptQty)).setScale(2, RoundingMode.HALF_UP);
        resp.setReceiptAmount(receiptAmount);
        resp.setReceiptGrnNumber(grnList.isEmpty() ? "N/A" : String.join(", ", grnList));

        // 3. Invoice Calculations (Requirements 1b, 2b, 3c, 4)
        BigDecimal totalInvoiceAmount = BigDecimal.ZERO;
        BigDecimal totalInvoicePoAmount = BigDecimal.ZERO;
        BigDecimal invoiceTaxPct = BigDecimal.ZERO;
        BigDecimal invoiceTaxAmt = BigDecimal.ZERO;
        List<String> invList = new ArrayList<>();
        for (Invoice inv : invoices) {
            if (inv.getTotalAmount() != null) {
                totalInvoiceAmount = totalInvoiceAmount.add(inv.getTotalAmount());
            }
            if (inv.getPoAmount() != null) {
                totalInvoicePoAmount = totalInvoicePoAmount.add(inv.getPoAmount());
            }
            if (inv.getTaxPercentage() != null) {
                invoiceTaxPct = inv.getTaxPercentage();
            }
            if (inv.getTaxAmount() != null) {
                invoiceTaxAmt = invoiceTaxAmt.add(inv.getTaxAmount());
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

        // Requirement 1b: Invoice quantity should be same as PO Quantity (when invoiced)
        int invoiceQty;
        BigDecimal invoiceUnitPrice;
        BigDecimal invoiceBaseAmount;

        if (invoices.isEmpty()) {
            invoiceQty = 0;
            invoiceUnitPrice = BigDecimal.ZERO;
            invoiceBaseAmount = BigDecimal.ZERO;
        } else {
            invoiceQty = totalPoQty;

            // Base amount excluding tax (Requirement 3c)
            if (totalInvoicePoAmount.compareTo(BigDecimal.ZERO) > 0) {
                invoiceBaseAmount = totalInvoicePoAmount;
                invoiceUnitPrice = invoiceQty > 0
                        ? totalInvoicePoAmount.divide(BigDecimal.valueOf(invoiceQty), 2, RoundingMode.HALF_UP)
                        : poUnitPrice;
            } else if (invoiceQty > 0 && poUnitPrice.compareTo(BigDecimal.ZERO) > 0) {
                invoiceUnitPrice = poUnitPrice;
                invoiceBaseAmount = poUnitPrice.multiply(BigDecimal.valueOf(invoiceQty)).setScale(2, RoundingMode.HALF_UP);
            } else {
                invoiceBaseAmount = totalInvoiceAmount;
                invoiceUnitPrice = invoiceQty > 0
                        ? totalInvoiceAmount.divide(BigDecimal.valueOf(invoiceQty), 2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;
            }
        }

        resp.setInvoiceQuantity(invoiceQty);
        resp.setInvoiceUnitPrice(invoiceUnitPrice.setScale(2, RoundingMode.HALF_UP));
        resp.setInvoiceBaseAmount(invoiceBaseAmount.setScale(2, RoundingMode.HALF_UP));

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
        } else if (totalPoQty == totalReceiptQty && totalReceiptQty == invoiceQty && totalPoQty > 0) {
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
        if (invoices.isEmpty() || poUnitPrice.compareTo(BigDecimal.ZERO) == 0) {
            pStatus = "MISMATCH";
        } else if (poUnitPrice.compareTo(invoiceUnitPrice) == 0) {
            pStatus = "MATCHED";
        } else {
            pStatus = "MISMATCH";
        }
        resp.setPriceMatchStatus(pStatus);
        resp.setPriceMatch(pStatus);

        // ----------------------------------------------------
        // 3. AMOUNT RECONCILIATION VARIANCES & STATUS (Excluding tax)
        // ----------------------------------------------------
        BigDecimal poVsReceiptAmtVar = receiptAmount.subtract(totalPoAmount).setScale(2, RoundingMode.HALF_UP);
        BigDecimal receiptVsInvoiceAmtVar = invoiceBaseAmount.subtract(receiptAmount).setScale(2, RoundingMode.HALF_UP);
        BigDecimal poVsInvoiceAmtVar = invoiceBaseAmount.subtract(totalPoAmount).setScale(2, RoundingMode.HALF_UP);

        resp.setPoVsReceiptAmtVariance(poVsReceiptAmtVar);
        resp.setReceiptVsInvoiceAmtVariance(receiptVsInvoiceAmtVar);
        resp.setPoVsInvoiceAmtVariance(poVsInvoiceAmtVar);

        String aStatus;
        if (receipts.isEmpty() && invoices.isEmpty()) {
            aStatus = "MISMATCH";
        } else if (totalPoAmount.compareTo(receiptAmount) == 0 && receiptAmount.compareTo(invoiceBaseAmount) == 0 && totalPoAmount.compareTo(BigDecimal.ZERO) > 0) {
            aStatus = "MATCHED";
        } else if (receiptAmount.compareTo(BigDecimal.ZERO) > 0 || invoiceBaseAmount.compareTo(BigDecimal.ZERO) > 0) {
            aStatus = "PARTIAL";
        } else {
            aStatus = "MISMATCH";
        }
        resp.setAmountMatchStatus(aStatus);
        resp.setAmountMatch(aStatus);

        // ----------------------------------------------------
        // 4. TAX RECONCILIATION (Requirement 4)
        // ----------------------------------------------------
        // Calculated Tax = (PO Amount * Percentage of Tax) / 100
        BigDecimal calculatedTax = totalPoAmount.multiply(invoiceTaxPct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal effectiveInvoiceTax = invoiceTaxAmt;
        if (effectiveInvoiceTax.compareTo(BigDecimal.ZERO) == 0 && totalInvoiceAmount.compareTo(invoiceBaseAmount) > 0) {
            effectiveInvoiceTax = totalInvoiceAmount.subtract(invoiceBaseAmount).setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal taxVariance = effectiveInvoiceTax.subtract(calculatedTax).setScale(2, RoundingMode.HALF_UP);
        String tStatus = (invoices.isEmpty() || totalPoAmount.compareTo(BigDecimal.ZERO) == 0)
                ? "MISMATCH"
                : (taxVariance.compareTo(BigDecimal.ZERO) == 0 ? "MATCHED" : "MISMATCH");

        resp.setTaxPercentage(invoiceTaxPct.setScale(2, RoundingMode.HALF_UP));
        resp.setCalculatedTaxAmount(calculatedTax);
        resp.setTaxAmount(effectiveInvoiceTax);
        resp.setTaxVariance(taxVariance);
        resp.setTaxMatchStatus(tStatus);
        resp.setTaxMatch(tStatus);

        // ----------------------------------------------------
        // 5. OVERALL RECONCILIATION RESULT
        // ----------------------------------------------------
        String overall;
        if ("MATCHED".equals(qStatus) && "MATCHED".equals(pStatus) && "MATCHED".equals(aStatus) && "MATCHED".equals(tStatus)) {
            overall = "MATCHED";
        } else {
            overall = "EXCEPTION";
        }

        resp.setOverallResult(overall);
        resp.setStatus(saved != null && saved.getStatus() != null ? saved.getStatus() : overall);

        // Line item details
        if (req.getItems() != null) {
            int itemCount = req.getItems().size();
            for (RequisitionItem item : req.getItems()) {
                int itemPoQty = item.getQuantity() != null ? item.getQuantity().intValue() : 0;
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

    @SuppressWarnings("unused")
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
                int q = item.getQuantity() != null ? item.getQuantity().intValue() : 0;
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

        resp.setTaxPercentage(BigDecimal.ZERO);
        resp.setTaxAmount(BigDecimal.ZERO);
        resp.setCalculatedTaxAmount(BigDecimal.ZERO);
        resp.setTaxVariance(BigDecimal.ZERO);
        resp.setTaxMatchStatus(invoices.isEmpty() ? "MISMATCH" : "MATCHED");
        resp.setTaxMatch(resp.getTaxMatchStatus());
        resp.setInvoiceBaseAmount(totalInvoiceAmount);

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
