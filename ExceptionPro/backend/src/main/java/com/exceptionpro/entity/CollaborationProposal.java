package com.exceptionpro.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "collaboration_proposals")
public class CollaborationProposal {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collaboration_requisition_id", nullable = false)
    private CollaborationRequisition collaborationRequisition;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private User supplier;

    @Column(name = "proposal_text", columnDefinition = "TEXT", nullable = false)
    private String proposalText;

    @Column(name = "evaluation_status", nullable = false)
    private String evaluationStatus = "Need to Evaluate";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

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

    public CollaborationRequisition getCollaborationRequisition() {
        return collaborationRequisition;
    }

    public void setCollaborationRequisition(CollaborationRequisition collaborationRequisition) {
        this.collaborationRequisition = collaborationRequisition;
    }

    public User getSupplier() {
        return supplier;
    }

    public void setSupplier(User supplier) {
        this.supplier = supplier;
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
