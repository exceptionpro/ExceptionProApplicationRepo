package com.exceptionpro.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class CreateCollabPoRequest {
    private List<UUID> supplierIds = new ArrayList<>();
    private UUID supplierId;
    private String title;
    private String shipTo;
    private String deliverTo;
    private LocalDate needByDate;
    private String comments;
    private List<CollaborationItemDto> items = new ArrayList<>();

    public CreateCollabPoRequest() {}

    public List<UUID> getSupplierIds() {
        if ((supplierIds == null || supplierIds.isEmpty()) && supplierId != null) {
            List<UUID> list = new ArrayList<>();
            list.add(supplierId);
            return list;
        }
        return supplierIds != null ? supplierIds : new ArrayList<>();
    }

    public void setSupplierIds(List<UUID> supplierIds) {
        this.supplierIds = supplierIds;
    }

    public UUID getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(UUID supplierId) {
        this.supplierId = supplierId;
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

    public List<CollaborationItemDto> getItems() {
        return items;
    }

    public void setItems(List<CollaborationItemDto> items) {
        this.items = items;
    }
}
