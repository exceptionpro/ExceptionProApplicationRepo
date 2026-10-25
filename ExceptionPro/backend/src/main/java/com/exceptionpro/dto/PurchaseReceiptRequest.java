package com.exceptionpro.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class PurchaseReceiptRequest {

    private String receiptNo;
    private LocalDate receiptDate;
    private UUID purchaseOrderId;
    private UUID receivedFromSupplierId;
    private UUID invoiceId;
    private String invoiceNumber;
    private BigDecimal invoiceAmount;
    private String currencyType;
    private Integer quantity;
    private Integer poQuantity;
    private Integer receivedQuantity;
    private Integer pendingQuantity;
    private String receivedStatus; // "Partial Received" or "Fully Received"

    public String getReceiptNo() {
        return receiptNo;
    }

    public void setReceiptNo(String receiptNo) {
        this.receiptNo = receiptNo;
    }

    public LocalDate getReceiptDate() {
        return receiptDate;
    }

    public void setReceiptDate(LocalDate receiptDate) {
        this.receiptDate = receiptDate;
    }

    public UUID getPurchaseOrderId() {
        return purchaseOrderId;
    }

    public void setPurchaseOrderId(UUID purchaseOrderId) {
        this.purchaseOrderId = purchaseOrderId;
    }

    public UUID getReceivedFromSupplierId() {
        return receivedFromSupplierId;
    }

    public void setReceivedFromSupplierId(UUID receivedFromSupplierId) {
        this.receivedFromSupplierId = receivedFromSupplierId;
    }

    public UUID getInvoiceId() {
        return invoiceId;
    }

    public void setInvoiceId(UUID invoiceId) {
        this.invoiceId = invoiceId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getPoQuantity() {
        return poQuantity;
    }

    public void setPoQuantity(Integer poQuantity) {
        this.poQuantity = poQuantity;
    }

    public Integer getReceivedQuantity() {
        return receivedQuantity;
    }

    public void setReceivedQuantity(Integer receivedQuantity) {
        this.receivedQuantity = receivedQuantity;
    }

    public Integer getPendingQuantity() {
        return pendingQuantity;
    }

    public void setPendingQuantity(Integer pendingQuantity) {
        this.pendingQuantity = pendingQuantity;
    }

    public String getReceivedStatus() {
        return receivedStatus;
    }

    public void setReceivedStatus(String receivedStatus) {
        this.receivedStatus = receivedStatus;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public BigDecimal getInvoiceAmount() {
        return invoiceAmount;
    }

    public void setInvoiceAmount(BigDecimal invoiceAmount) {
        this.invoiceAmount = invoiceAmount;
    }

    public String getCurrencyType() {
        return currencyType;
    }

    public void setCurrencyType(String currencyType) {
        this.currencyType = currencyType;
    }
}
