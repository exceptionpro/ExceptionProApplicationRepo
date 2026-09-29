package com.exceptionpro.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class EligibleRequestResponse {

    private UUID id;
    private String requestType; // "STANDARD" or "COLLABORATION"
    private String code; // e.g., "PO01" or "CR01"
    private String title;
    private UUID buyerId;
    private String buyerName;
    private String buyerEmail;
    private BigDecimal totalAmount;
    private int itemCount;
    private LocalDate needByDate;

    public EligibleRequestResponse() {}

    public EligibleRequestResponse(UUID id, String requestType, String code, String title, UUID buyerId,
                                   String buyerName, String buyerEmail, BigDecimal totalAmount, int itemCount, LocalDate needByDate) {
        this.id = id;
        this.requestType = requestType;
        this.code = code;
        this.title = title;
        this.buyerId = buyerId;
        this.buyerName = buyerName;
        this.buyerEmail = buyerEmail;
        this.totalAmount = totalAmount;
        this.itemCount = itemCount;
        this.needByDate = needByDate;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public int getItemCount() {
        return itemCount;
    }

    public void setItemCount(int itemCount) {
        this.itemCount = itemCount;
    }

    public LocalDate getNeedByDate() {
        return needByDate;
    }

    public void setNeedByDate(LocalDate needByDate) {
        this.needByDate = needByDate;
    }
}
