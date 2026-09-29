package com.exceptionpro.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class CollaborationItemDto {
    private UUID id;
    private String itemType;
    private String productName;
    private String fullDescription;
    private Integer quantity;
    private String unitMeasure;
    private BigDecimal price;

    public CollaborationItemDto() {}

    public CollaborationItemDto(UUID id, String itemType, String productName, String fullDescription,
                                Integer quantity, String unitMeasure, BigDecimal price) {
        this.id = id;
        this.itemType = itemType;
        this.productName = productName;
        this.fullDescription = fullDescription;
        this.quantity = quantity;
        this.unitMeasure = unitMeasure;
        this.price = price;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getItemType() {
        return itemType;
    }

    public void setItemType(String itemType) {
        this.itemType = itemType;
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
}
