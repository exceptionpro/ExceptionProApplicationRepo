package com.exceptionpro.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class PurchaseReceiptItemDto {

    private UUID id;
    private String productName;
    private String fullDescription;
    private Integer quantity;
    private String unitMeasure;
    private BigDecimal price;
    private String currencyType;

    public PurchaseReceiptItemDto() {
    }

    public PurchaseReceiptItemDto(UUID id, String productName, String fullDescription, Integer quantity,
                                  String unitMeasure, BigDecimal price, String currencyType) {
        this.id = id;
        this.productName = productName;
        this.fullDescription = fullDescription;
        this.quantity = quantity;
        this.unitMeasure = unitMeasure;
        this.price = price;
        this.currencyType = currencyType;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getFullDescription() {
        return fullDescription;
    }

    public void setFullDescription(String fullDescription) {
        this.fullDescription = fullDescription;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public String getUnitMeasure() {
        return unitMeasure;
    }

    public void setUnitMeasure(String unitMeasure) {
        this.unitMeasure = unitMeasure;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getCurrencyType() {
        return currencyType;
    }

    public void setCurrencyType(String currencyType) {
        this.currencyType = currencyType;
    }
}
