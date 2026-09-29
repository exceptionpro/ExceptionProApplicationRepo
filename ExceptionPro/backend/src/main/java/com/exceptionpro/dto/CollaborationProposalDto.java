package com.exceptionpro.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class CollaborationProposalDto {
    private UUID id;
    private UUID supplierId;
    private String supplierEmail;
    private String supplierName;
    private String proposalText;
    private String evaluationStatus;
    private LocalDateTime createdAt;

    public CollaborationProposalDto() {}

    public CollaborationProposalDto(UUID id, UUID supplierId, String supplierEmail, String supplierName,
                                   String proposalText, String evaluationStatus, LocalDateTime createdAt) {
        this.id = id;
        this.supplierId = supplierId;
        this.supplierEmail = supplierEmail;
        this.supplierName = supplierName;
        this.proposalText = proposalText;
        this.evaluationStatus = evaluationStatus;
        this.createdAt = createdAt;
    }

    public String getEvaluationStatus() {
        return evaluationStatus;
    }

    public void setEvaluationStatus(String evaluationStatus) {
        this.evaluationStatus = evaluationStatus;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(UUID supplierId) {
        this.supplierId = supplierId;
    }

    public String getSupplierEmail() {
        return supplierEmail;
    }

    public void setSupplierEmail(String supplierEmail) {
        this.supplierEmail = supplierEmail;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public String getProposalText() {
        return proposalText;
    }

    public void setProposalText(String proposalText) {
        this.proposalText = proposalText;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
