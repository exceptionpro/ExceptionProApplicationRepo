package com.exceptionpro.dto;

import java.time.LocalDate;
import java.util.UUID;

public class PurchaseReceiptRequest {

    private String receiptNo;
    private LocalDate receiptDate;
    private UUID purchaseOrderId;
    private UUID receivedFromSupplierId;
    private UUID invoiceId;
    private Integer quantity;
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

    public String getReceivedStatus() {
        return receivedStatus;
    }

    public void setReceivedStatus(String receivedStatus) {
        this.receivedStatus = receivedStatus;
    }
}
