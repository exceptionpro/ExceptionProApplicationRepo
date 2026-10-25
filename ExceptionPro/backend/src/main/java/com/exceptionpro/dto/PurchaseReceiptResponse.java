package com.exceptionpro.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class PurchaseReceiptResponse {

    private UUID id;
    private String receiptNo;
    private LocalDate receiptDate;
    private UUID buyerId;
    private String buyerName;
    private String buyerEmail;
    private UUID purchaseOrderId;
    private String purchaseOrderCode;
    private String purchaseOrderTitle;
    private UUID receivedFromSupplierId;
    private String receivedFromSupplierName;
    private String receivedFromSupplierEmail;
    private UUID invoiceId;
    private String invoiceNumber;
    private BigDecimal invoiceAmount;
    private String currencyType;
    private Integer quantity;
    private Integer poQuantity;
    private Integer receivedQuantity;
    private Integer pendingQuantity;
    private String receivedStatus;
    private String supplierApprovalStatus;
    private String supplierConfirmationMessage;
    private Integer supplierApprovedPendingQuantity;
    private java.time.LocalDateTime supplierApprovedAt;
    private String supplierComments;
    private java.util.List<PurchaseReceiptItemDto> items = new java.util.ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PurchaseReceiptResponse() {
    }

    public PurchaseReceiptResponse(UUID id, String receiptNo, LocalDate receiptDate, UUID purchaseOrderId,
                                   String purchaseOrderCode, String purchaseOrderTitle, UUID receivedFromSupplierId,
                                   String receivedFromSupplierName, String receivedFromSupplierEmail, UUID invoiceId,
                                   String invoiceNumber, Integer quantity, Integer poQuantity, Integer receivedQuantity,
                                   Integer pendingQuantity, String receivedStatus,
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
        this.poQuantity = poQuantity;
        this.receivedQuantity = receivedQuantity;
        this.pendingQuantity = pendingQuantity;
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

    public String getSupplierApprovalStatus() {
        return supplierApprovalStatus;
    }

    public void setSupplierApprovalStatus(String supplierApprovalStatus) {
        this.supplierApprovalStatus = supplierApprovalStatus;
    }

    public String getSupplierConfirmationMessage() {
        return supplierConfirmationMessage;
    }

    public void setSupplierConfirmationMessage(String supplierConfirmationMessage) {
        this.supplierConfirmationMessage = supplierConfirmationMessage;
    }

    public Integer getSupplierApprovedPendingQuantity() {
        return supplierApprovedPendingQuantity;
    }

    public void setSupplierApprovedPendingQuantity(Integer supplierApprovedPendingQuantity) {
        this.supplierApprovedPendingQuantity = supplierApprovedPendingQuantity;
    }

    public java.time.LocalDateTime getSupplierApprovedAt() {
        return supplierApprovedAt;
    }

    public void setSupplierApprovedAt(java.time.LocalDateTime supplierApprovedAt) {
        this.supplierApprovedAt = supplierApprovedAt;
    }

    public java.util.List<PurchaseReceiptItemDto> getItems() {
        return items;
    }

    public void setItems(java.util.List<PurchaseReceiptItemDto> items) {
        this.items = items;
    }

    public String getSupplierComments() {
        return supplierComments;
    }

    public void setSupplierComments(String supplierComments) {
        this.supplierComments = supplierComments;
    }
}
