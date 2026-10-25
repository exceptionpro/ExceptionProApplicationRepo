package com.exceptionpro.dto;

import java.math.BigDecimal;

public class InvoiceItemResponse {

    private String productName;
    private Integer quantity;
    private BigDecimal price;
    private String currencyType;
    private String unitMeasure;
    private BigDecimal totalPrice;

    public InvoiceItemResponse() {}

    public InvoiceItemResponse(String productName, Integer quantity, BigDecimal price, String currencyType, String unitMeasure) {
        this.productName = productName;
        this.quantity = quantity != null ? quantity : 1;
        this.price = price != null ? price : BigDecimal.ZERO;
        this.currencyType = currencyType != null && !currencyType.isBlank() ? currencyType : "USD";
        this.unitMeasure = unitMeasure;
        this.totalPrice = this.price.multiply(BigDecimal.valueOf(this.quantity.longValue()));
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
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

    public String getUnitMeasure() {
        return unitMeasure;
    }

    public void setUnitMeasure(String unitMeasure) {
        this.unitMeasure = unitMeasure;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(BigDecimal totalPrice) {
        this.totalPrice = totalPrice;
    }
}
