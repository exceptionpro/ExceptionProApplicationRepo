package com.exceptionpro.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "collaboration_requisitions")
public class CollaborationRequisition {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "collaboration_requisition_suppliers",
        joinColumns = @JoinColumn(name = "collaboration_requisition_id"),
        inverseJoinColumns = @JoinColumn(name = "supplier_id")
    )
    private List<User> suppliers = new ArrayList<>();

    @Column(nullable = false)
    private String title;

    @Column(name = "ship_to", nullable = false)
    private String shipTo;

    @Column(name = "deliver_to", nullable = false)
    private String deliverTo;

    @Column(name = "need_by_date", nullable = false)
    private LocalDate needByDate;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(nullable = false)
    private String status = "Collaborating";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "collaborationRequisition", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CollaborationRequisitionItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "collaborationRequisition", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CollaborationProposal> proposals = new ArrayList<>();

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

    public List<User> getSuppliers() {
        return suppliers;
    }

    public void setSuppliers(List<User> suppliers) {
        this.suppliers = suppliers;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getShipTo() {
        return shipTo;
    }

    public void setShipTo(String shipTo) {
        this.shipTo = shipTo;
    }

    public String getDeliverTo() {
        return deliverTo;
    }

    public void setDeliverTo(String deliverTo) {
        this.deliverTo = deliverTo;
    }

    public LocalDate getNeedByDate() {
        return needByDate;
    }

    public void setNeedByDate(LocalDate needByDate) {
        this.needByDate = needByDate;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<CollaborationRequisitionItem> getItems() {
        return items;
    }

    public void setItems(List<CollaborationRequisitionItem> items) {
        this.items = items;
    }

    public List<CollaborationProposal> getProposals() {
        return proposals;
    }

    public void setProposals(List<CollaborationProposal> proposals) {
        this.proposals = proposals;
    }
}
