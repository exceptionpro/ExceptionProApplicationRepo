package com.exceptionpro.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class ReconciliationResponse {
    private UUID id;
    private String reconciliationNumber;
    private LocalDate reconciliationDate;
    private String requestType; // STANDARD, COLLABORATION
    private String poNumber; // PO01, PO02, etc.
    private String orderTitle;
    private UUID supplierId;
    private String supplierName;
    private String supplierEmail;
    private UUID buyerId;
    private String buyerName;
    private String receiptGrnNumber;
    private String invoiceNumber;
    private String currency = "INR";
    private String status = "EXCEPTION";

    // 1) Quantity: PurchaseOrder Quantity <-> Receipt Quantity <-> Invoice Quantity
    private Integer poQuantity;
    private Integer receiptQuantity;
    private Integer invoiceQuantity;
    private Integer poVsReceiptQtyVariance;
    private Integer receiptVsInvoiceQtyVariance;
    private Integer poVsInvoiceQtyVariance;
    private String quantityMatchStatus; // MATCHED, PARTIAL, MISMATCH

    // 2) Unit Price: PurchaseOrder Unit Price <-> Invoice Unit Price
    private BigDecimal poUnitPrice;
    private BigDecimal invoiceUnitPrice;
    private BigDecimal priceVariance;
    private BigDecimal priceVariancePercentage;
    private String priceMatchStatus; // MATCHED, MISMATCH

    // 3) Amount: PurchaseOrder Amount <-> Receipt Amount <-> Invoice Amount
    private BigDecimal poAmount;
    private BigDecimal receiptAmount;
    private BigDecimal invoiceAmount;
    private BigDecimal poVsReceiptAmtVariance;
    private BigDecimal receiptVsInvoiceAmtVariance;
    private BigDecimal poVsInvoiceAmtVariance;
    private String amountMatchStatus; // MATCHED, PARTIAL, MISMATCH

    // 4) Result & Remarks
    private String quantityMatch; // MATCHED, PARTIAL, MISMATCH
    private String priceMatch;    // MATCHED, MISMATCH
    private String amountMatch;   // MATCHED, PARTIAL, MISMATCH
    private String overallResult; // EXCEPTION, MATCHED, PARTIAL
    private String remarks;

    // Metadata
    private List<String> receiptNumbers = new ArrayList<>();
    private List<LocalDate> receiptDates = new ArrayList<>();
    private List<String> receiptStatuses = new ArrayList<>();

    private List<String> invoiceNumbers = new ArrayList<>();
    private List<LocalDate> invoiceDates = new ArrayList<>();
    private List<String> invoiceStatuses = new ArrayList<>();

    // Line items detail
    private List<ReconciliationItemDto> items = new ArrayList<>();

    public ReconciliationResponse() {}

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getReconciliationNumber() {
        return reconciliationNumber;
    }

    public void setReconciliationNumber(String reconciliationNumber) {
        this.reconciliationNumber = reconciliationNumber;
    }

    public LocalDate getReconciliationDate() {
        return reconciliationDate;
    }

    public void setReconciliationDate(LocalDate reconciliationDate) {
        this.reconciliationDate = reconciliationDate;
    }

    public String getRequestType() {
        return requestType;
    }

    public void setRequestType(String requestType) {
        this.requestType = requestType;
    }

    public String getPoNumber() {
        return poNumber;
    }

    public void setPoNumber(String poNumber) {
        this.poNumber = poNumber;
    }

    public String getOrderTitle() {
        return orderTitle;
    }

    public void setOrderTitle(String orderTitle) {
        this.orderTitle = orderTitle;
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

    public String getSupplierEmail() {
        return supplierEmail;
    }

    public void setSupplierEmail(String supplierEmail) {
        this.supplierEmail = supplierEmail;
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

    public String getReceiptGrnNumber() {
        return receiptGrnNumber;
    }

    public void setReceiptGrnNumber(String receiptGrnNumber) {
        this.receiptGrnNumber = receiptGrnNumber;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getPoQuantity() {
        return poQuantity;
    }

    public void setPoQuantity(Integer poQuantity) {
        this.poQuantity = poQuantity;
    }

    public Integer getReceiptQuantity() {
        return receiptQuantity;
    }

    public void setReceiptQuantity(Integer receiptQuantity) {
        this.receiptQuantity = receiptQuantity;
    }

    public Integer getInvoiceQuantity() {
        return invoiceQuantity;
    }

    public void setInvoiceQuantity(Integer invoiceQuantity) {
        this.invoiceQuantity = invoiceQuantity;
    }

    public Integer getPoVsReceiptQtyVariance() {
        return poVsReceiptQtyVariance;
    }

    public void setPoVsReceiptQtyVariance(Integer poVsReceiptQtyVariance) {
        this.poVsReceiptQtyVariance = poVsReceiptQtyVariance;
    }

    public Integer getReceiptVsInvoiceQtyVariance() {
        return receiptVsInvoiceQtyVariance;
    }

    public void setReceiptVsInvoiceQtyVariance(Integer receiptVsInvoiceQtyVariance) {
        this.receiptVsInvoiceQtyVariance = receiptVsInvoiceQtyVariance;
    }

    public Integer getPoVsInvoiceQtyVariance() {
        return poVsInvoiceQtyVariance;
    }

    public void setPoVsInvoiceQtyVariance(Integer poVsInvoiceQtyVariance) {
        this.poVsInvoiceQtyVariance = poVsInvoiceQtyVariance;
    }

    public String getQuantityMatchStatus() {
        return quantityMatchStatus;
    }

    public void setQuantityMatchStatus(String quantityMatchStatus) {
        this.quantityMatchStatus = quantityMatchStatus;
    }

    public BigDecimal getPoUnitPrice() {
        return poUnitPrice;
    }

    public void setPoUnitPrice(BigDecimal poUnitPrice) {
        this.poUnitPrice = poUnitPrice;
    }

    public BigDecimal getInvoiceUnitPrice() {
        return invoiceUnitPrice;
    }

    public void setInvoiceUnitPrice(BigDecimal invoiceUnitPrice) {
        this.invoiceUnitPrice = invoiceUnitPrice;
    }

    public BigDecimal getPriceVariance() {
        return priceVariance;
    }

    public void setPriceVariance(BigDecimal priceVariance) {
        this.priceVariance = priceVariance;
    }

    public BigDecimal getPriceVariancePercentage() {
        return priceVariancePercentage;
    }

    public void setPriceVariancePercentage(BigDecimal priceVariancePercentage) {
        this.priceVariancePercentage = priceVariancePercentage;
    }

    public String getPriceMatchStatus() {
        return priceMatchStatus;
    }

    public void setPriceMatchStatus(String priceMatchStatus) {
        this.priceMatchStatus = priceMatchStatus;
    }

    public BigDecimal getPoAmount() {
        return poAmount;
    }

    public void setPoAmount(BigDecimal poAmount) {
        this.poAmount = poAmount;
    }

    public BigDecimal getReceiptAmount() {
        return receiptAmount;
    }

    public void setReceiptAmount(BigDecimal receiptAmount) {
        this.receiptAmount = receiptAmount;
    }

    public BigDecimal getInvoiceAmount() {
        return invoiceAmount;
    }

    public void setInvoiceAmount(BigDecimal invoiceAmount) {
        this.invoiceAmount = invoiceAmount;
    }

    public BigDecimal getPoVsReceiptAmtVariance() {
        return poVsReceiptAmtVariance;
    }

    public void setPoVsReceiptAmtVariance(BigDecimal poVsReceiptAmtVariance) {
        this.poVsReceiptAmtVariance = poVsReceiptAmtVariance;
    }

    public BigDecimal getReceiptVsInvoiceAmtVariance() {
        return receiptVsInvoiceAmtVariance;
    }

    public void setReceiptVsInvoiceAmtVariance(BigDecimal receiptVsInvoiceAmtVariance) {
        this.receiptVsInvoiceAmtVariance = receiptVsInvoiceAmtVariance;
    }

    public BigDecimal getPoVsInvoiceAmtVariance() {
        return poVsInvoiceAmtVariance;
    }

    public void setPoVsInvoiceAmtVariance(BigDecimal poVsInvoiceAmtVariance) {
        this.poVsInvoiceAmtVariance = poVsInvoiceAmtVariance;
    }

    public String getAmountMatchStatus() {
        return amountMatchStatus;
    }

    public void setAmountMatchStatus(String amountMatchStatus) {
        this.amountMatchStatus = amountMatchStatus;
    }

    public String getQuantityMatch() {
        return quantityMatch;
    }

    public void setQuantityMatch(String quantityMatch) {
        this.quantityMatch = quantityMatch;
    }

    public String getPriceMatch() {
        return priceMatch;
    }

    public void setPriceMatch(String priceMatch) {
        this.priceMatch = priceMatch;
    }

    public String getAmountMatch() {
        return amountMatch;
    }

    public void setAmountMatch(String amountMatch) {
        this.amountMatch = amountMatch;
    }

    public String getOverallResult() {
        return overallResult;
    }

    public void setOverallResult(String overallResult) {
        this.overallResult = overallResult;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public List<String> getReceiptNumbers() {
        return receiptNumbers;
    }

    public void setReceiptNumbers(List<String> receiptNumbers) {
        this.receiptNumbers = receiptNumbers;
    }

    public List<LocalDate> getReceiptDates() {
        return receiptDates;
    }

    public void setReceiptDates(List<LocalDate> receiptDates) {
        this.receiptDates = receiptDates;
    }

    public List<String> getReceiptStatuses() {
        return receiptStatuses;
    }

    public void setReceiptStatuses(List<String> receiptStatuses) {
        this.receiptStatuses = receiptStatuses;
    }

    public List<String> getInvoiceNumbers() {
        return invoiceNumbers;
    }

    public void setInvoiceNumbers(List<String> invoiceNumbers) {
        this.invoiceNumbers = invoiceNumbers;
    }

    public List<LocalDate> getInvoiceDates() {
        return invoiceDates;
    }

    public void setInvoiceDates(List<LocalDate> invoiceDates) {
        this.invoiceDates = invoiceDates;
    }

    public List<String> getInvoiceStatuses() {
        return invoiceStatuses;
    }

    public void setInvoiceStatuses(List<String> invoiceStatuses) {
        this.invoiceStatuses = invoiceStatuses;
    }

    public List<ReconciliationItemDto> getItems() {
        return items;
    }

    public void setItems(List<ReconciliationItemDto> items) {
        this.items = items;
    }
}
