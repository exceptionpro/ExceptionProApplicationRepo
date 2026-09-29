package com.exceptionpro.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class RequisitionItemDto {
    private UUID id;
    private String itemType; // CATALOG or NON_CATALOG
    private UUID catalogueId;
    private String productName;
    private String fullDescription;
    private Integer quantity;
    private String unitMeasure;
    private BigDecimal price;
    private UUID supplierId;
    private String supplierName;

    public RequisitionItemDto() {}

    public RequisitionItemDto(UUID id, String itemType, UUID catalogueId, String productName,
                              String fullDescription, Integer quantity, String unitMeasure,
                              BigDecimal price, UUID supplierId, String supplierName) {
        this.id = id;
        this.itemType = itemType;
        this.catalogueId = catalogueId;
        this.productName = productName;
        this.fullDescription = fullDescription;
        this.quantity = quantity;
        this.unitMeasure = unitMeasure;
        this.price = price;
        this.supplierId = supplierId;
        this.supplierName = supplierName;
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

    public UUID getCatalogueId() {
        return catalogueId;
    }

    public void setCatalogueId(UUID catalogueId) {
        this.catalogueId = catalogueId;
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

    public UUID getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(UUID supplierId) {
        this.supplierId = supplierId;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }
}
