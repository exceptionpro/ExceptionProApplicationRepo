package com.exceptionpro.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "replacement_requests")
public class ReplacementRequest {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @Column(name = "request_number", nullable = false, length = 100)
    private String requestNumber;

    @Column(name = "request_date", nullable = false)
    private LocalDate requestDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id")
    private Requisition purchaseOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "received_from_supplier_id", nullable = false)
    private User receivedFromSupplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    @Column(name = "invoice_number", length = 100)
    private String invoiceNumber;

    @Column(name = "invoice_amount", precision = 19, scale = 2)
    private BigDecimal invoiceAmount;

    @Column(name = "currency_type", length = 20)
    private String currencyType;

    @Column(name = "damaged_quantity", nullable = false)
    private Integer damagedQuantity;

    @Column(name = "replacement_quantity", nullable = false)
    private Integer replacementQuantity;

    @Column(name = "received_status", nullable = false, length = 50)
    private String receivedStatus; // "Initiated", "Fully Received", "Partial Received"

    @Column(name = "supplier_approval_status", length = 50)
    private String supplierApprovalStatus = "Pending Approval"; // "Pending Approval", "Accept Request", "Partially Accept", "Reject Request"

    @Column(name = "supplier_confirmation_message", columnDefinition = "TEXT")
    private String supplierConfirmationMessage;

    @Column(name = "supplier_approved_replacement_quantity")
    private Integer supplierApprovedReplacementQuantity;

    @Column(name = "supplier_approved_at")
    private LocalDateTime supplierApprovedAt;

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

    public User getBuyer() {
        return buyer;
    }

    public void setBuyer(User buyer) {
        this.buyer = buyer;
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

    public Requisition getPurchaseOrder() {
        return purchaseOrder;
    }

    public void setPurchaseOrder(Requisition purchaseOrder) {
        this.purchaseOrder = purchaseOrder;
    }

    public User getReceivedFromSupplier() {
        return receivedFromSupplier;
    }

    public void setReceivedFromSupplier(User receivedFromSupplier) {
        this.receivedFromSupplier = receivedFromSupplier;
    }

    public Invoice getInvoice() {
        return invoice;
    }

    public void setInvoice(Invoice invoice) {
        this.invoice = invoice;
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
