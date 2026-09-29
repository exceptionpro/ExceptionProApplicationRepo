package com.exceptionpro.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reconciliations")
public class Reconciliation {

    @Id
    private UUID id;

    @Column(name = "reconciliation_number", nullable = false, unique = true, length = 100)
    private String reconciliationNumber;

    @Column(name = "reconciliation_date", nullable = false)
    private LocalDate reconciliationDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private User supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requisition_id")
    private Requisition requisition;

    @Column(name = "po_number", length = 100)
    private String poNumber;

    @Column(name = "receipt_grn_number", length = 100)
    private String receiptGrnNumber;

    @Column(name = "invoice_number", length = 100)
    private String invoiceNumber;

    @Column(length = 20)
    private String currency = "INR"; // INR (₹), USD ($), etc.

    @Column(length = 50)
    private String status = "EXCEPTION"; // MATCHED, EXCEPTION, PARTIAL, RESOLVED

    // 1. Quantity Reconciliation
    @Column(name = "po_quantity")
    private Integer poQuantity = 0;

    @Column(name = "receipt_quantity")
    private Integer receiptQuantity = 0;

    @Column(name = "invoice_quantity")
    private Integer invoiceQuantity = 0;

    @Column(name = "po_vs_receipt_qty_variance")
    private Integer poVsReceiptQtyVariance = 0;

    @Column(name = "receipt_vs_invoice_qty_variance")
    private Integer receiptVsInvoiceQtyVariance = 0;

    @Column(name = "po_vs_invoice_qty_variance")
    private Integer poVsInvoiceQtyVariance = 0;

    @Column(name = "quantity_match_status", length = 50)
    private String quantityMatchStatus = "PARTIAL";

    // 2. Price Reconciliation
    @Column(name = "po_unit_price", precision = 12, scale = 2)
    private BigDecimal poUnitPrice = BigDecimal.ZERO;

    @Column(name = "invoice_unit_price", precision = 12, scale = 2)
    private BigDecimal invoiceUnitPrice = BigDecimal.ZERO;

    @Column(name = "price_variance", precision = 12, scale = 2)
    private BigDecimal priceVariance = BigDecimal.ZERO;

    @Column(name = "price_variance_percentage", precision = 8, scale = 2)
    private BigDecimal priceVariancePercentage = BigDecimal.ZERO;

    @Column(name = "price_match_status", length = 50)
    private String priceMatchStatus = "MISMATCH";

    // 3. Amount Reconciliation
    @Column(name = "po_amount", precision = 14, scale = 2)
    private BigDecimal poAmount = BigDecimal.ZERO;

    @Column(name = "receipt_amount", precision = 14, scale = 2)
    private BigDecimal receiptAmount = BigDecimal.ZERO;

    @Column(name = "invoice_amount", precision = 14, scale = 2)
    private BigDecimal invoiceAmount = BigDecimal.ZERO;

    @Column(name = "po_vs_receipt_amt_variance", precision = 14, scale = 2)
    private BigDecimal poVsReceiptAmtVariance = BigDecimal.ZERO;

    @Column(name = "receipt_vs_invoice_amt_variance", precision = 14, scale = 2)
    private BigDecimal receiptVsInvoiceAmtVariance = BigDecimal.ZERO;

    @Column(name = "po_vs_invoice_amt_variance", precision = 14, scale = 2)
    private BigDecimal poVsInvoiceAmtVariance = BigDecimal.ZERO;

    @Column(name = "amount_match_status", length = 50)
    private String amountMatchStatus = "PARTIAL";

    // 4. Result & Remarks
    @Column(name = "overall_result", length = 50)
    private String overallResult = "EXCEPTION";

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getReconciliationNumber() {
        return reconciliationNumber;
    }

    public void setReconciliationNumber(String reconciliationNumber) {
        this.reconciliationNumber = reconciliationNumber;
    }

    public LocalDate getReconciliationDate() {
        return reconciliationDate;
    }

    public void setReconciliationDate(LocalDate reconciliationDate) {
        this.reconciliationDate = reconciliationDate;
    }

    public User getBuyer() {
        return buyer;
    }

    public void setBuyer(User buyer) {
        this.buyer = buyer;
    }

    public User getSupplier() {
        return supplier;
    }

    public void setSupplier(User supplier) {
        this.supplier = supplier;
    }

    public Requisition getRequisition() {
        return requisition;
    }

    public void setRequisition(Requisition requisition) {
        this.requisition = requisition;
    }

    public String getPoNumber() {
        return poNumber;
    }

    public void setPoNumber(String poNumber) {
        this.poNumber = poNumber;
    }

    public String getReceiptGrnNumber() {
        return receiptGrnNumber;
    }

    public void setReceiptGrnNumber(String receiptGrnNumber) {
        this.receiptGrnNumber = receiptGrnNumber;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getPoQuantity() {
        return poQuantity;
    }

    public void setPoQuantity(Integer poQuantity) {
        this.poQuantity = poQuantity;
    }

    public Integer getReceiptQuantity() {
        return receiptQuantity;
    }

    public void setReceiptQuantity(Integer receiptQuantity) {
        this.receiptQuantity = receiptQuantity;
    }

    public Integer getInvoiceQuantity() {
        return invoiceQuantity;
    }

    public void setInvoiceQuantity(Integer invoiceQuantity) {
        this.invoiceQuantity = invoiceQuantity;
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

    public String getQuantityMatchStatus() {
        return quantityMatchStatus;
    }

    public void setQuantityMatchStatus(String quantityMatchStatus) {
        this.quantityMatchStatus = quantityMatchStatus;
    }

    public BigDecimal getPoUnitPrice() {
        return poUnitPrice;
    }

    public void setPoUnitPrice(BigDecimal poUnitPrice) {
        this.poUnitPrice = poUnitPrice;
    }

    public BigDecimal getInvoiceUnitPrice() {
        return invoiceUnitPrice;
    }

    public void setInvoiceUnitPrice(BigDecimal invoiceUnitPrice) {
        this.invoiceUnitPrice = invoiceUnitPrice;
    }

    public BigDecimal getPriceVariance() {
        return priceVariance;
    }

    public void setPriceVariance(BigDecimal priceVariance) {
        this.priceVariance = priceVariance;
    }

    public BigDecimal getPriceVariancePercentage() {
        return priceVariancePercentage;
    }

    public void setPriceVariancePercentage(BigDecimal priceVariancePercentage) {
        this.priceVariancePercentage = priceVariancePercentage;
    }

    public String getPriceMatchStatus() {
        return priceMatchStatus;
    }

    public void setPriceMatchStatus(String priceMatchStatus) {
        this.priceMatchStatus = priceMatchStatus;
    }

    public BigDecimal getPoAmount() {
        return poAmount;
    }

    public void setPoAmount(BigDecimal poAmount) {
        this.poAmount = poAmount;
    }

    public BigDecimal getReceiptAmount() {
        return receiptAmount;
    }

    public void setReceiptAmount(BigDecimal receiptAmount) {
        this.receiptAmount = receiptAmount;
    }

    public BigDecimal getInvoiceAmount() {
        return invoiceAmount;
    }

    public void setInvoiceAmount(BigDecimal invoiceAmount) {
        this.invoiceAmount = invoiceAmount;
    }

    public BigDecimal getPoVsReceiptAmtVariance() {
        return poVsReceiptAmtVariance;
    }

    public void setPoVsReceiptAmtVariance(BigDecimal poVsReceiptAmtVariance) {
        this.poVsReceiptAmtVariance = poVsReceiptAmtVariance;
    }

    public BigDecimal getReceiptVsInvoiceAmtVariance() {
        return receiptVsInvoiceAmtVariance;
    }

    public void setReceiptVsInvoiceAmtVariance(BigDecimal receiptVsInvoiceAmtVariance) {
        this.receiptVsInvoiceAmtVariance = receiptVsInvoiceAmtVariance;
    }

    public BigDecimal getPoVsInvoiceAmtVariance() {
        return poVsInvoiceAmtVariance;
    }

    public void setPoVsInvoiceAmtVariance(BigDecimal poVsInvoiceAmtVariance) {
        this.poVsInvoiceAmtVariance = poVsInvoiceAmtVariance;
    }

    public String getAmountMatchStatus() {
        return amountMatchStatus;
    }

    public void setAmountMatchStatus(String amountMatchStatus) {
        this.amountMatchStatus = amountMatchStatus;
    }

    public String getOverallResult() {
        return overallResult;
    }

    public void setOverallResult(String overallResult) {
        this.overallResult = overallResult;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
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
