package com.exceptionpro.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class CollaborationRequisitionRequest {
    private String title;
    private String shipTo;
    private String deliverTo;
    private LocalDate needByDate;
    private String comments;
    private List<UUID> supplierIds = new ArrayList<>();
    private List<CollaborationItemDto> items = new ArrayList<>();

    public CollaborationRequisitionRequest() {}

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

    public List<UUID> getSupplierIds() {
        return supplierIds;
    }

    public void setSupplierIds(List<UUID> supplierIds) {
        this.supplierIds = supplierIds;
    }

    public List<CollaborationItemDto> getItems() {
        return items;
    }

    public void setItems(List<CollaborationItemDto> items) {
        this.items = items;
    }
}
