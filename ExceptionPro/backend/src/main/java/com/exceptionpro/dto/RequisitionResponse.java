package com.exceptionpro.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class RequisitionResponse {
    private UUID id;
    private String requisitionId;
    private Integer reqNumber;
    private String title;
    private String shipTo;
    private String deliverTo;
    private LocalDate needByDate;
    private String comments;
    private String supplierComment;
    private String status;
    private LocalDateTime createdAt;
    private UUID buyerId;
    private String buyerEmail;
    private String buyerName;
    private UUID supplierId;
    private String supplierEmail;
    private String supplierName;
    private List<RequisitionItemDto> items = new ArrayList<>();

    public RequisitionResponse() {}

    public RequisitionResponse(UUID id, String requisitionId, Integer reqNumber, String title, String shipTo, String deliverTo, LocalDate needByDate,
                               String comments, String supplierComment, String status, LocalDateTime createdAt, UUID buyerId,
                               String buyerEmail, String buyerName, UUID supplierId, String supplierEmail,
                               String supplierName, List<RequisitionItemDto> items) {
        this.id = id;
        this.requisitionId = requisitionId;
        this.reqNumber = reqNumber;
        this.title = title;
        this.shipTo = shipTo;
        this.deliverTo = deliverTo;
        this.needByDate = needByDate;
        this.comments = comments;
        this.supplierComment = supplierComment;
        this.status = status;
        this.createdAt = createdAt;
        this.buyerId = buyerId;
        this.buyerEmail = buyerEmail;
        this.buyerName = buyerName;
        this.supplierId = supplierId;
        this.supplierEmail = supplierEmail;
        this.supplierName = supplierName;
        this.items = items;
    }

    public RequisitionResponse(UUID id, String title, String shipTo, String deliverTo, LocalDate needByDate,
                               String comments, String supplierComment, String status, LocalDateTime createdAt, UUID buyerId,
                               String buyerEmail, String buyerName, UUID supplierId, String supplierEmail,
                               String supplierName, List<RequisitionItemDto> items) {
        this(id, null, null, title, shipTo, deliverTo, needByDate, comments, supplierComment, status, createdAt, buyerId, buyerEmail, buyerName, supplierId, supplierEmail, supplierName, items);
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getRequisitionId() {
        return requisitionId;
    }

    public void setRequisitionId(String requisitionId) {
        this.requisitionId = requisitionId;
    }

    public Integer getReqNumber() {
        return reqNumber;
    }

    public void setReqNumber(Integer reqNumber) {
        this.reqNumber = reqNumber;
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

    public String getSupplierComment() {
        return supplierComment;
    }

    public void setSupplierComment(String supplierComment) {
        this.supplierComment = supplierComment;
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

    public List<RequisitionItemDto> getItems() {
        return items;
    }

    public void setItems(List<RequisitionItemDto> items) {
        this.items = items;
    }
}
