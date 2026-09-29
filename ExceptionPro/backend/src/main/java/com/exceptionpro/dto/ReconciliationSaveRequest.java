package com.exceptionpro.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class ReconciliationSaveRequest {
    private String reconciliationNumber;
    private LocalDate reconciliationDate;
    private UUID buyerId;
    private UUID supplierId;
    private UUID requisitionId;
    private String poNumber;
    private String receiptGrnNumber;
    private String invoiceNumber;
    private String currency;
    private String status;

    // 1. Quantity
    private Integer poQuantity;
    private Integer receiptQuantity;
    private Integer invoiceQuantity;
    private Integer poVsReceiptQtyVariance;
    private Integer receiptVsInvoiceQtyVariance;
    private Integer poVsInvoiceQtyVariance;
    private String quantityMatchStatus;

    // 2. Price
    private BigDecimal poUnitPrice;
    private BigDecimal invoiceUnitPrice;
    private BigDecimal priceVariance;
    private BigDecimal priceVariancePercentage;
    private String priceMatchStatus;

    // 3. Amount
    private BigDecimal poAmount;
    private BigDecimal receiptAmount;
    private BigDecimal invoiceAmount;
    private BigDecimal poVsReceiptAmtVariance;
    private BigDecimal receiptVsInvoiceAmtVariance;
    private BigDecimal poVsInvoiceAmtVariance;
    private String amountMatchStatus;

    // 4. Result
    private String overallResult;
    private String remarks;

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

    public UUID getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(UUID buyerId) {
        this.buyerId = buyerId;
    }

    public UUID getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(UUID supplierId) {
        this.supplierId = supplierId;
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
}
