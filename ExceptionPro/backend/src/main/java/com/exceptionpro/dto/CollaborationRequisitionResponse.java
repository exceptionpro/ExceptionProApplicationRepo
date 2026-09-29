package com.exceptionpro.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class CollaborationRequisitionResponse {
    private UUID id;
    private String title;
    private String shipTo;
    private String deliverTo;
    private LocalDate needByDate;
    private String comments;
    private String status;
    private LocalDateTime createdAt;
    private UUID buyerId;
    private String buyerEmail;
    private String buyerName;
    private List<SupplierSummaryResponse> suppliers = new ArrayList<>();
    private List<SupplierSummaryResponse> acceptedSuppliers = new ArrayList<>();
    private int acceptedCount = 0;
    private List<CollaborationItemDto> items = new ArrayList<>();
    private List<CollaborationProposalDto> proposals = new ArrayList<>();

    public CollaborationRequisitionResponse() {}

    public CollaborationRequisitionResponse(UUID id, String title, String shipTo, String deliverTo,
                                            LocalDate needByDate, String comments, String status,
                                            LocalDateTime createdAt, UUID buyerId, String buyerEmail,
                                            String buyerName, List<SupplierSummaryResponse> suppliers,
                                            List<SupplierSummaryResponse> acceptedSuppliers, int acceptedCount,
                                            List<CollaborationItemDto> items,
                                            List<CollaborationProposalDto> proposals) {
        this.id = id;
        this.title = title;
        this.shipTo = shipTo;
        this.deliverTo = deliverTo;
        this.needByDate = needByDate;
        this.comments = comments;
        this.status = status;
        this.createdAt = createdAt;
        this.buyerId = buyerId;
        this.buyerEmail = buyerEmail;
        this.buyerName = buyerName;
        this.suppliers = suppliers;
        this.acceptedSuppliers = acceptedSuppliers;
        this.acceptedCount = acceptedCount;
        this.items = items;
        this.proposals = proposals;
    }

    public List<SupplierSummaryResponse> getAcceptedSuppliers() {
        return acceptedSuppliers;
    }

    public void setAcceptedSuppliers(List<SupplierSummaryResponse> acceptedSuppliers) {
        this.acceptedSuppliers = acceptedSuppliers;
    }

    public int getAcceptedCount() {
        return acceptedCount;
    }

    public void setAcceptedCount(int acceptedCount) {
        this.acceptedCount = acceptedCount;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
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

    public UUID getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(UUID buyerId) {
        this.buyerId = buyerId;
    }

    public String getBuyerEmail() {
        return buyerEmail;
    }

    public void setBuyerEmail(String buyerEmail) {
        this.buyerEmail = buyerEmail;
    }

    public String getBuyerName() {
        return buyerName;
    }

    public void setBuyerName(String buyerName) {
        this.buyerName = buyerName;
    }

    public List<SupplierSummaryResponse> getSuppliers() {
        return suppliers;
    }

    public void setSuppliers(List<SupplierSummaryResponse> suppliers) {
        this.suppliers = suppliers;
    }

    public List<CollaborationItemDto> getItems() {
        return items;
    }

    public void setItems(List<CollaborationItemDto> items) {
        this.items = items;
    }

    public List<CollaborationProposalDto> getProposals() {
        return proposals;
    }

    public void setProposals(List<CollaborationProposalDto> proposals) {
        this.proposals = proposals;
    }
}
