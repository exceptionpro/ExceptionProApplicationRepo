package com.exceptionpro.dto;

import java.math.BigDecimal;

public class ReconciliationSummaryDto {
    private int totalRecords;
    private int fullyMatchedCount;
    private int quantityMismatchCount;
    private int priceMismatchCount;
    private int amountMismatchCount;
    private int missingReceiptCount;
    private int missingInvoiceCount;

    private BigDecimal totalPoAmount;
    private BigDecimal totalReceiptAmount;
    private BigDecimal totalInvoiceAmount;

    public ReconciliationSummaryDto() {}

    public ReconciliationSummaryDto(int totalRecords, int fullyMatchedCount, int quantityMismatchCount,
                                    int priceMismatchCount, int amountMismatchCount, int missingReceiptCount,
                                    int missingInvoiceCount, BigDecimal totalPoAmount, BigDecimal totalReceiptAmount,
                                    BigDecimal totalInvoiceAmount) {
        this.totalRecords = totalRecords;
        this.fullyMatchedCount = fullyMatchedCount;
        this.quantityMismatchCount = quantityMismatchCount;
        this.priceMismatchCount = priceMismatchCount;
        this.amountMismatchCount = amountMismatchCount;
        this.missingReceiptCount = missingReceiptCount;
        this.missingInvoiceCount = missingInvoiceCount;
        this.totalPoAmount = totalPoAmount;
        this.totalReceiptAmount = totalReceiptAmount;
        this.totalInvoiceAmount = totalInvoiceAmount;
    }

    public int getTotalRecords() {
        return totalRecords;
    }

    public void setTotalRecords(int totalRecords) {
        this.totalRecords = totalRecords;
    }

    public int getFullyMatchedCount() {
        return fullyMatchedCount;
    }

    public void setFullyMatchedCount(int fullyMatchedCount) {
        this.fullyMatchedCount = fullyMatchedCount;
    }

    public int getQuantityMismatchCount() {
        return quantityMismatchCount;
    }

    public void setQuantityMismatchCount(int quantityMismatchCount) {
        this.quantityMismatchCount = quantityMismatchCount;
    }

    public int getPriceMismatchCount() {
        return priceMismatchCount;
    }

    public void setPriceMismatchCount(int priceMismatchCount) {
        this.priceMismatchCount = priceMismatchCount;
    }

    public int getAmountMismatchCount() {
        return amountMismatchCount;
    }

    public void setAmountMismatchCount(int amountMismatchCount) {
        this.amountMismatchCount = amountMismatchCount;
    }

    public int getMissingReceiptCount() {
        return missingReceiptCount;
    }

    public void setMissingReceiptCount(int missingReceiptCount) {
        this.missingReceiptCount = missingReceiptCount;
    }

    public int getMissingInvoiceCount() {
        return missingInvoiceCount;
    }

    public void setMissingInvoiceCount(int missingInvoiceCount) {
        this.missingInvoiceCount = missingInvoiceCount;
    }

    public BigDecimal getTotalPoAmount() {
        return totalPoAmount;
    }

    public void setTotalPoAmount(BigDecimal totalPoAmount) {
        this.totalPoAmount = totalPoAmount;
    }

    public BigDecimal getTotalReceiptAmount() {
        return totalReceiptAmount;
    }

    public void setTotalReceiptAmount(BigDecimal totalReceiptAmount) {
        this.totalReceiptAmount = totalReceiptAmount;
    }

    public BigDecimal getTotalInvoiceAmount() {
        return totalInvoiceAmount;
    }

    public void setTotalInvoiceAmount(BigDecimal totalInvoiceAmount) {
        this.totalInvoiceAmount = totalInvoiceAmount;
    }
}
