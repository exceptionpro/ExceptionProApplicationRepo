package com.exceptionpro.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class PurchaseReceiptResponse {

    private UUID id;
    private String receiptNo;
    private LocalDate receiptDate;
    private UUID purchaseOrderId;
    private String purchaseOrderCode;
    private String purchaseOrderTitle;
    private UUID receivedFromSupplierId;
    private String receivedFromSupplierName;
    private String receivedFromSupplierEmail;
    private UUID invoiceId;
    private String invoiceNumber;
    private Integer quantity;
    private String receivedStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PurchaseReceiptResponse() {
    }

    public PurchaseReceiptResponse(UUID id, String receiptNo, LocalDate receiptDate, UUID purchaseOrderId,
                                   String purchaseOrderCode, String purchaseOrderTitle, UUID receivedFromSupplierId,
                                   String receivedFromSupplierName, String receivedFromSupplierEmail, UUID invoiceId,
                                   String invoiceNumber, Integer quantity, String receivedStatus,
                                   LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.receiptNo = receiptNo;
        this.receiptDate = receiptDate;
        this.purchaseOrderId = purchaseOrderId;
        this.purchaseOrderCode = purchaseOrderCode;
        this.purchaseOrderTitle = purchaseOrderTitle;
        this.receivedFromSupplierId = receivedFromSupplierId;
        this.receivedFromSupplierName = receivedFromSupplierName;
        this.receivedFromSupplierEmail = receivedFromSupplierEmail;
        this.invoiceId = invoiceId;
        this.invoiceNumber = invoiceNumber;
        this.quantity = quantity;
        this.receivedStatus = receivedStatus;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

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

    public String getPurchaseOrderCode() {
        return purchaseOrderCode;
    }

    public void setPurchaseOrderCode(String purchaseOrderCode) {
        this.purchaseOrderCode = purchaseOrderCode;
    }

    public String getPurchaseOrderTitle() {
        return purchaseOrderTitle;
    }

    public void setPurchaseOrderTitle(String purchaseOrderTitle) {
        this.purchaseOrderTitle = purchaseOrderTitle;
    }

    public UUID getReceivedFromSupplierId() {
        return receivedFromSupplierId;
    }

    public void setReceivedFromSupplierId(UUID receivedFromSupplierId) {
        this.receivedFromSupplierId = receivedFromSupplierId;
    }

    public String getReceivedFromSupplierName() {
        return receivedFromSupplierName;
    }

    public void setReceivedFromSupplierName(String receivedFromSupplierName) {
        this.receivedFromSupplierName = receivedFromSupplierName;
    }

    public String getReceivedFromSupplierEmail() {
        return receivedFromSupplierEmail;
    }

    public void setReceivedFromSupplierEmail(String receivedFromSupplierEmail) {
        this.receivedFromSupplierEmail = receivedFromSupplierEmail;
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
