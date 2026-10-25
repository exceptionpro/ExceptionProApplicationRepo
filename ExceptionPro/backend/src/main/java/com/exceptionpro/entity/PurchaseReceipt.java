package com.exceptionpro.entity;

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
@Table(name = "purchase_receipts")
public class PurchaseReceipt {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @Column(name = "receipt_no", nullable = false, length = 100)
    private String receiptNo;

    @Column(name = "receipt_date", nullable = false)
    private LocalDate receiptDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id")
    private Requisition purchaseOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "received_from_supplier_id", nullable = false)
    private User receivedFromSupplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "po_quantity")
    private Integer poQuantity;

    @Column(name = "received_quantity")
    private Integer receivedQuantity;

    @Column(name = "pending_quantity")
    private Integer pendingQuantity;

    @Column(name = "received_status", nullable = false, length = 50)
    private String receivedStatus; // "Partial Received" or "Fully Received"

    @Column(name = "supplier_approval_status", length = 50)
    private String supplierApprovalStatus = "Pending Approval";

    @Column(name = "supplier_confirmation_message", columnDefinition = "TEXT")
    private String supplierConfirmationMessage;

    @Column(name = "supplier_approved_pending_quantity")
    private Integer supplierApprovedPendingQuantity;

    @Column(name = "supplier_approved_at")
    private LocalDateTime supplierApprovedAt;

    @Column(name = "supplier_comments", columnDefinition = "TEXT")
    private String supplierComments;

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

    public LocalDateTime getSupplierApprovedAt() {
        return supplierApprovedAt;
    }

    public void setSupplierApprovedAt(LocalDateTime supplierApprovedAt) {
        this.supplierApprovedAt = supplierApprovedAt;
    }

    public String getSupplierComments() {
        return supplierComments;
    }

    public void setSupplierComments(String supplierComments) {
        this.supplierComments = supplierComments;
    }
}
