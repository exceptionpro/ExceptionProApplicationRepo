package com.exceptionpro.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class ReconciliationItemDto {
    private UUID itemId;
    private String productName;
    private String description;
    private String unitMeasure;
    
    // Purchase Order Values
    private Integer poQuantity;
    private BigDecimal poUnitPrice;
    private BigDecimal poAmount;

    // Receipt Values
    private Integer receiptQuantity;
    private BigDecimal receiptAmount;

    // Invoice Values
    private Integer invoiceQuantity;
    private BigDecimal invoiceUnitPrice;
    private BigDecimal invoiceAmount;

    // Comparison Statuses
    private String quantityStatus; // MATCHED, VARIANCE, MISSING
    private String unitPriceStatus; // MATCHED, VARIANCE, MISSING
    private String amountStatus; // MATCHED, VARIANCE, MISSING

    public ReconciliationItemDto() {}

    public ReconciliationItemDto(UUID itemId, String productName, String description, String unitMeasure,
                                 Integer poQuantity, BigDecimal poUnitPrice, BigDecimal poAmount,
                                 Integer receiptQuantity, BigDecimal receiptAmount,
                                 Integer invoiceQuantity, BigDecimal invoiceUnitPrice, BigDecimal invoiceAmount,
                                 String quantityStatus, String unitPriceStatus, String amountStatus) {
        this.itemId = itemId;
        this.productName = productName;
        this.description = description;
        this.unitMeasure = unitMeasure;
        this.poQuantity = poQuantity;
        this.poUnitPrice = poUnitPrice;
        this.poAmount = poAmount;
        this.receiptQuantity = receiptQuantity;
        this.receiptAmount = receiptAmount;
        this.invoiceQuantity = invoiceQuantity;
        this.invoiceUnitPrice = invoiceUnitPrice;
        this.invoiceAmount = invoiceAmount;
        this.quantityStatus = quantityStatus;
        this.unitPriceStatus = unitPriceStatus;
        this.amountStatus = amountStatus;
    }

    public UUID getItemId() {
        return itemId;
    }

    public void setItemId(UUID itemId) {
        this.itemId = itemId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getUnitMeasure() {
        return unitMeasure;
    }

    public void setUnitMeasure(String unitMeasure) {
        this.unitMeasure = unitMeasure;
    }

    public Integer getPoQuantity() {
        return poQuantity;
    }

    public void setPoQuantity(Integer poQuantity) {
        this.poQuantity = poQuantity;
    }

    public BigDecimal getPoUnitPrice() {
        return poUnitPrice;
    }

    public void setPoUnitPrice(BigDecimal poUnitPrice) {
        this.poUnitPrice = poUnitPrice;
    }

    public BigDecimal getPoAmount() {
        return poAmount;
    }

    public void setPoAmount(BigDecimal poAmount) {
        this.poAmount = poAmount;
    }

    public Integer getReceiptQuantity() {
        return receiptQuantity;
    }

    public void setReceiptQuantity(Integer receiptQuantity) {
        this.receiptQuantity = receiptQuantity;
    }

    public BigDecimal getReceiptAmount() {
        return receiptAmount;
    }

    public void setReceiptAmount(BigDecimal receiptAmount) {
        this.receiptAmount = receiptAmount;
    }

    public Integer getInvoiceQuantity() {
        return invoiceQuantity;
    }

    public void setInvoiceQuantity(Integer invoiceQuantity) {
        this.invoiceQuantity = invoiceQuantity;
    }

    public BigDecimal getInvoiceUnitPrice() {
        return invoiceUnitPrice;
    }

    public void setInvoiceUnitPrice(BigDecimal invoiceUnitPrice) {
        this.invoiceUnitPrice = invoiceUnitPrice;
    }

    public BigDecimal getInvoiceAmount() {
        return invoiceAmount;
    }

    public void setInvoiceAmount(BigDecimal invoiceAmount) {
        this.invoiceAmount = invoiceAmount;
    }

    public String getQuantityStatus() {
        return quantityStatus;
    }

    public void setQuantityStatus(String quantityStatus) {
        this.quantityStatus = quantityStatus;
    }

    public String getUnitPriceStatus() {
        return unitPriceStatus;
    }

    public void setUnitPriceStatus(String unitPriceStatus) {
        this.unitPriceStatus = unitPriceStatus;
    }

    public String getAmountStatus() {
        return amountStatus;
    }

    public void setAmountStatus(String amountStatus) {
        this.amountStatus = amountStatus;
    }
}
