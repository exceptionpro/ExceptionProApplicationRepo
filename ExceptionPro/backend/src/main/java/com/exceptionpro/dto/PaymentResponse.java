package com.exceptionpro.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class PaymentResponse {

    private UUID id;
    private String paymentId;
    private LocalDate paymentDate;
    private String paymentStatus; // Pending, Payment Due, Paid, On Hold, Cancelled
    private String currency = "INR";

    // Supplier & Buyer details
    private UUID supplierId;
    private String supplierName;
    private String supplierEmail;
    private UUID buyerId;
    private String buyerName;
    private String buyerEmail;

    // 1. PO Details
    private UUID requisitionId;
    private String poNumber;
    private Integer poQuantity;
    private BigDecimal poUnitPrice;
    private BigDecimal poAmount;
    private LocalDate poDate;

    // 2. Purchase Receipt Details
    private UUID purchaseReceiptId;
    private String receiptNumber;
    private LocalDate receiptDate;
    private Integer receivedQuantity;
    private BigDecimal receivedAmount;
    private BigDecimal receiptAmount;

    // 3. Invoice Details
    private UUID invoiceId;
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private Integer invoiceQuantity;
    private BigDecimal invoiceUnitPrice;
    private BigDecimal invoiceAmount;
    private BigDecimal taxPercentage;
    private BigDecimal taxAmount;

    // 4. Reconciliation
    private UUID reconciliationId;
    private String reconciliationNumber;
    private String reconciliationStatus; // Matched, Exception, Partial
    private String exceptionReason;
    private String quantityMatchStatus;  // MATCHED, MISMATCH, PARTIAL
    private String priceMatchStatus;     // MATCHED, MISMATCH
    private String amountMatchStatus;    // MATCHED, MISMATCH, PARTIAL
    private String taxMatchStatus;       // MATCHED, MISMATCH
    private String overallResult;        // MATCHED, EXCEPTION, PARTIAL
    private BigDecimal invoiceBaseAmount;
    private BigDecimal calculatedTaxAmount;
    private BigDecimal taxVariance;
    private Integer poVsReceiptQtyVariance;
    private Integer receiptVsInvoiceQtyVariance;
    private Integer poVsInvoiceQtyVariance;
    private BigDecimal priceVariance;
    private BigDecimal amountVariance;

    // 5. Payment Amount
    private BigDecimal amountToPay;

    private String paymentMethod;
    private String paymentReference;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PaymentResponse() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public UUID getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(UUID supplierId) {
        this.supplierId = supplierId;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public String getSupplierEmail() {
        return supplierEmail;
    }

    public void setSupplierEmail(String supplierEmail) {
        this.supplierEmail = supplierEmail;
    }

    public UUID getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(UUID buyerId) {
        this.buyerId = buyerId;
    }

    public String getBuyerName() {
        return buyerName;
    }

    public void setBuyerName(String buyerName) {
        this.buyerName = buyerName;
    }

    public String getBuyerEmail() {
        return buyerEmail;
    }

    public void setBuyerEmail(String buyerEmail) {
        this.buyerEmail = buyerEmail;
    }

    public UUID getRequisitionId() {
        return requisitionId;
    }

    public void setRequisitionId(UUID requisitionId) {
        this.requisitionId = requisitionId;
    }

    public String getPoNumber() {
        return poNumber;
    }

    public void setPoNumber(String poNumber) {
        this.poNumber = poNumber;
    }

    public Integer getPoQuantity() {
        return poQuantity;
    }

    public void setPoQuantity(Integer poQuantity) {
        this.poQuantity = poQuantity;
    }

    public BigDecimal getPoUnitPrice() {
        return poUnitPrice;
    }

    public void setPoUnitPrice(BigDecimal poUnitPrice) {
        this.poUnitPrice = poUnitPrice;
    }

    public BigDecimal getPoAmount() {
        return poAmount;
    }

    public void setPoAmount(BigDecimal poAmount) {
        this.poAmount = poAmount;
    }

    public LocalDate getPoDate() {
        return poDate;
    }

    public void setPoDate(LocalDate poDate) {
        this.poDate = poDate;
    }

    public UUID getPurchaseReceiptId() {
        return purchaseReceiptId;
    }

    public void setPurchaseReceiptId(UUID purchaseReceiptId) {
        this.purchaseReceiptId = purchaseReceiptId;
    }

    public String getReceiptNumber() {
        return receiptNumber;
    }

    public void setReceiptNumber(String receiptNumber) {
        this.receiptNumber = receiptNumber;
    }

    public LocalDate getReceiptDate() {
        return receiptDate;
    }

    public void setReceiptDate(LocalDate receiptDate) {
        this.receiptDate = receiptDate;
    }

    public Integer getReceivedQuantity() {
        return receivedQuantity;
    }

    public void setReceivedQuantity(Integer receivedQuantity) {
        this.receivedQuantity = receivedQuantity;
    }

    public BigDecimal getReceivedAmount() {
        return receivedAmount != null ? receivedAmount : receiptAmount;
    }

    public void setReceivedAmount(BigDecimal receivedAmount) {
        this.receivedAmount = receivedAmount;
        if (this.receiptAmount == null) {
            this.receiptAmount = receivedAmount;
        }
    }

    public BigDecimal getReceiptAmount() {
        return receiptAmount != null ? receiptAmount : receivedAmount;
    }

    public void setReceiptAmount(BigDecimal receiptAmount) {
        this.receiptAmount = receiptAmount;
        if (this.receivedAmount == null) {
            this.receivedAmount = receiptAmount;
        }
    }

    public UUID getInvoiceId() {
        return invoiceId;
    }

    public void setInvoiceId(UUID invoiceId) {
        this.invoiceId = invoiceId;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public LocalDate getInvoiceDate() {
        return invoiceDate;
    }

    public void setInvoiceDate(LocalDate invoiceDate) {
        this.invoiceDate = invoiceDate;
    }

    public Integer getInvoiceQuantity() {
        return invoiceQuantity;
    }

    public void setInvoiceQuantity(Integer invoiceQuantity) {
        this.invoiceQuantity = invoiceQuantity;
    }

    public BigDecimal getInvoiceUnitPrice() {
        return invoiceUnitPrice;
    }

    public void setInvoiceUnitPrice(BigDecimal invoiceUnitPrice) {
        this.invoiceUnitPrice = invoiceUnitPrice;
    }

    public BigDecimal getInvoiceAmount() {
        return invoiceAmount;
    }

    public void setInvoiceAmount(BigDecimal invoiceAmount) {
        this.invoiceAmount = invoiceAmount;
    }

    public BigDecimal getTaxPercentage() {
        return taxPercentage;
    }

    public void setTaxPercentage(BigDecimal taxPercentage) {
        this.taxPercentage = taxPercentage;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public UUID getReconciliationId() {
        return reconciliationId;
    }

    public void setReconciliationId(UUID reconciliationId) {
        this.reconciliationId = reconciliationId;
    }

    public String getReconciliationNumber() {
        return reconciliationNumber;
    }

    public void setReconciliationNumber(String reconciliationNumber) {
        this.reconciliationNumber = reconciliationNumber;
    }

    public String getReconciliationStatus() {
        return reconciliationStatus;
    }

    public void setReconciliationStatus(String reconciliationStatus) {
        this.reconciliationStatus = reconciliationStatus;
    }

    public String getExceptionReason() {
        return exceptionReason;
    }

    public void setExceptionReason(String exceptionReason) {
        this.exceptionReason = exceptionReason;
    }

    public String getQuantityMatchStatus() {
        return quantityMatchStatus;
    }

    public void setQuantityMatchStatus(String quantityMatchStatus) {
        this.quantityMatchStatus = quantityMatchStatus;
    }

    public String getPriceMatchStatus() {
        return priceMatchStatus;
    }

    public void setPriceMatchStatus(String priceMatchStatus) {
        this.priceMatchStatus = priceMatchStatus;
    }

    public String getAmountMatchStatus() {
        return amountMatchStatus;
    }

    public void setAmountMatchStatus(String amountMatchStatus) {
        this.amountMatchStatus = amountMatchStatus;
    }

    public String getTaxMatchStatus() {
        return taxMatchStatus;
    }

    public void setTaxMatchStatus(String taxMatchStatus) {
        this.taxMatchStatus = taxMatchStatus;
    }

    public String getOverallResult() {
        return overallResult;
    }

    public void setOverallResult(String overallResult) {
        this.overallResult = overallResult;
    }

    public BigDecimal getInvoiceBaseAmount() {
        return invoiceBaseAmount;
    }

    public void setInvoiceBaseAmount(BigDecimal invoiceBaseAmount) {
        this.invoiceBaseAmount = invoiceBaseAmount;
    }

    public BigDecimal getCalculatedTaxAmount() {
        return calculatedTaxAmount;
    }

    public void setCalculatedTaxAmount(BigDecimal calculatedTaxAmount) {
        this.calculatedTaxAmount = calculatedTaxAmount;
    }

    public BigDecimal getTaxVariance() {
        return taxVariance;
    }

    public void setTaxVariance(BigDecimal taxVariance) {
        this.taxVariance = taxVariance;
    }

    public Integer getPoVsReceiptQtyVariance() {
        return poVsReceiptQtyVariance;
    }

    public void setPoVsReceiptQtyVariance(Integer poVsReceiptQtyVariance) {
        this.poVsReceiptQtyVariance = poVsReceiptQtyVariance;
    }

    public Integer getReceiptVsInvoiceQtyVariance() {
        return receiptVsInvoiceQtyVariance;
    }

    public void setReceiptVsInvoiceQtyVariance(Integer receiptVsInvoiceQtyVariance) {
        this.receiptVsInvoiceQtyVariance = receiptVsInvoiceQtyVariance;
    }

    public Integer getPoVsInvoiceQtyVariance() {
        return poVsInvoiceQtyVariance;
    }

    public void setPoVsInvoiceQtyVariance(Integer poVsInvoiceQtyVariance) {
        this.poVsInvoiceQtyVariance = poVsInvoiceQtyVariance;
    }

    public BigDecimal getPriceVariance() {
        return priceVariance;
    }

    public void setPriceVariance(BigDecimal priceVariance) {
        this.priceVariance = priceVariance;
    }

    public BigDecimal getAmountVariance() {
        return amountVariance;
    }

    public void setAmountVariance(BigDecimal amountVariance) {
        this.amountVariance = amountVariance;
    }

    public BigDecimal getAmountToPay() {
        return amountToPay;
    }

    public void setAmountToPay(BigDecimal amountToPay) {
        this.amountToPay = amountToPay;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentReference() {
        return paymentReference;
    }

    public void setPaymentReference(String paymentReference) {
        this.paymentReference = paymentReference;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
