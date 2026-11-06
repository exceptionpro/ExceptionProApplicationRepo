package com.exceptionpro.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class ReplacementRequestResponse {

    private UUID id;
    private String requestNumber;
    private LocalDate requestDate;
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
    private Integer damagedQuantity;
    private Integer replacementQuantity;
    private String receivedStatus;
    private String supplierApprovalStatus;
    private String supplierConfirmationMessage;
    private Integer supplierApprovedReplacementQuantity;
    private LocalDateTime supplierApprovedAt;
    private List<PurchaseReceiptItemDto> items = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ReplacementRequestResponse() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getRequestNumber() {
        return requestNumber;
    }

    public void setRequestNumber(String requestNumber) {
        this.requestNumber = requestNumber;
    }

    public LocalDate getRequestDate() {
        return requestDate;
    }

    public void setRequestDate(LocalDate requestDate) {
        this.requestDate = requestDate;
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

    public Integer getDamagedQuantity() {
        return damagedQuantity;
    }

    public void setDamagedQuantity(Integer damagedQuantity) {
        this.damagedQuantity = damagedQuantity;
    }

    public Integer getReplacementQuantity() {
        return replacementQuantity;
    }

    public void setReplacementQuantity(Integer replacementQuantity) {
        this.replacementQuantity = replacementQuantity;
    }

    public String getReceivedStatus() {
        return receivedStatus;
    }

    public void setReceivedStatus(String receivedStatus) {
        this.receivedStatus = receivedStatus;
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

    public Integer getSupplierApprovedReplacementQuantity() {
        return supplierApprovedReplacementQuantity;
    }

    public void setSupplierApprovedReplacementQuantity(Integer supplierApprovedReplacementQuantity) {
        this.supplierApprovedReplacementQuantity = supplierApprovedReplacementQuantity;
    }

    public LocalDateTime getSupplierApprovedAt() {
        return supplierApprovedAt;
    }

    public void setSupplierApprovedAt(LocalDateTime supplierApprovedAt) {
        this.supplierApprovedAt = supplierApprovedAt;
    }

    public List<PurchaseReceiptItemDto> getItems() {
        return items;
    }

    public void setItems(List<PurchaseReceiptItemDto> items) {
        this.items = items;
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
