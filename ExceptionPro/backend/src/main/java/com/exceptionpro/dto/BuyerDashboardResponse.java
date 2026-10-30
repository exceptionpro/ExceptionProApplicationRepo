package com.exceptionpro.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class BuyerDashboardResponse {

    private DashboardKpiSummary summary = new DashboardKpiSummary();
    private PurchaseOrderSection purchaseOrders = new PurchaseOrderSection();
    private InvoiceReconciliationSection invoiceAndReconciliation = new InvoiceReconciliationSection();
    private PaymentsSection payments = new PaymentsSection();

    public DashboardKpiSummary getSummary() {
        return summary;
    }

    public void setSummary(DashboardKpiSummary summary) {
        this.summary = summary;
    }

    public PurchaseOrderSection getPurchaseOrders() {
        return purchaseOrders;
    }

    public void setPurchaseOrders(PurchaseOrderSection purchaseOrders) {
        this.purchaseOrders = purchaseOrders;
    }

    public InvoiceReconciliationSection getInvoiceAndReconciliation() {
        return invoiceAndReconciliation;
    }

    public void setInvoiceAndReconciliation(InvoiceReconciliationSection invoiceAndReconciliation) {
        this.invoiceAndReconciliation = invoiceAndReconciliation;
    }

    public PaymentsSection getPayments() {
        return payments;
    }

    public void setPayments(PaymentsSection payments) {
        this.payments = payments;
    }

    // ------------------------------------------------------------------------
    // Nested Classes
    // ------------------------------------------------------------------------

    public static class DashboardKpiSummary {
        private int totalPurchaseOrders;
        private int acceptedPurchaseOrders;
        private double overallAcceptanceRate;
        private int totalInvoices;
        private int totalReceipts;
        private int reconciledMatchedCount;
        private int reconciledExceptionCount;
        private BigDecimal totalPaymentAmountDisbursed = BigDecimal.ZERO;
        private BigDecimal totalPaymentAmountDue = BigDecimal.ZERO;

        public int getTotalPurchaseOrders() {
            return totalPurchaseOrders;
        }

        public void setTotalPurchaseOrders(int totalPurchaseOrders) {
            this.totalPurchaseOrders = totalPurchaseOrders;
        }

        public int getAcceptedPurchaseOrders() {
            return acceptedPurchaseOrders;
        }

        public void setAcceptedPurchaseOrders(int acceptedPurchaseOrders) {
            this.acceptedPurchaseOrders = acceptedPurchaseOrders;
        }

        public double getOverallAcceptanceRate() {
            return overallAcceptanceRate;
        }

        public void setOverallAcceptanceRate(double overallAcceptanceRate) {
            this.overallAcceptanceRate = overallAcceptanceRate;
        }

        public int getTotalInvoices() {
            return totalInvoices;
        }

        public void setTotalInvoices(int totalInvoices) {
            this.totalInvoices = totalInvoices;
        }

        public int getTotalReceipts() {
            return totalReceipts;
        }

        public void setTotalReceipts(int totalReceipts) {
            this.totalReceipts = totalReceipts;
        }

        public int getReconciledMatchedCount() {
            return reconciledMatchedCount;
        }

        public void setReconciledMatchedCount(int reconciledMatchedCount) {
            this.reconciledMatchedCount = reconciledMatchedCount;
        }

        public int getReconciledExceptionCount() {
            return reconciledExceptionCount;
        }

        public void setReconciledExceptionCount(int reconciledExceptionCount) {
            this.reconciledExceptionCount = reconciledExceptionCount;
        }

        public BigDecimal getTotalPaymentAmountDisbursed() {
            return totalPaymentAmountDisbursed;
        }

        public void setTotalPaymentAmountDisbursed(BigDecimal totalPaymentAmountDisbursed) {
            this.totalPaymentAmountDisbursed = totalPaymentAmountDisbursed;
        }

        public BigDecimal getTotalPaymentAmountDue() {
            return totalPaymentAmountDue;
        }

        public void setTotalPaymentAmountDue(BigDecimal totalPaymentAmountDue) {
            this.totalPaymentAmountDue = totalPaymentAmountDue;
        }
    }

    public static class PurchaseOrderSection {
        private PeriodData weekly = new PeriodData();
        private PeriodData monthly = new PeriodData();
        private PeriodData quarterly = new PeriodData();

        public PeriodData getWeekly() {
            return weekly;
        }

        public void setWeekly(PeriodData weekly) {
            this.weekly = weekly;
        }

        public PeriodData getMonthly() {
            return monthly;
        }

        public void setMonthly(PeriodData monthly) {
            this.monthly = monthly;
        }

        public PeriodData getQuarterly() {
            return quarterly;
        }

        public void setQuarterly(PeriodData quarterly) {
            this.quarterly = quarterly;
        }
    }

    public static class PeriodData {
        private List<SupplierPoItem> supplierPoCreated = new ArrayList<>();
        private List<SupplierAcceptanceItem> supplierAcceptanceRate = new ArrayList<>();

        public List<SupplierPoItem> getSupplierPoCreated() {
            return supplierPoCreated;
        }

        public void setSupplierPoCreated(List<SupplierPoItem> supplierPoCreated) {
            this.supplierPoCreated = supplierPoCreated;
        }

        public List<SupplierAcceptanceItem> getSupplierAcceptanceRate() {
            return supplierAcceptanceRate;
        }

        public void setSupplierAcceptanceRate(List<SupplierAcceptanceItem> supplierAcceptanceRate) {
            this.supplierAcceptanceRate = supplierAcceptanceRate;
        }
    }

    public static class SupplierPoItem {
        private UUID supplierId;
        private String supplierName;
        private int poCount;
        private BigDecimal totalAmount = BigDecimal.ZERO;

        public SupplierPoItem() {}

        public SupplierPoItem(UUID supplierId, String supplierName, int poCount, BigDecimal totalAmount) {
            this.supplierId = supplierId;
            this.supplierName = supplierName;
            this.poCount = poCount;
            this.totalAmount = totalAmount;
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

        public int getPoCount() {
            return poCount;
        }

        public void setPoCount(int poCount) {
            this.poCount = poCount;
        }

        public BigDecimal getTotalAmount() {
            return totalAmount;
        }

        public void setTotalAmount(BigDecimal totalAmount) {
            this.totalAmount = totalAmount;
        }
    }

    public static class SupplierAcceptanceItem {
        private UUID supplierId;
        private String supplierName;
        private int totalAssigned;
        private int acceptedCount;
        private int declinedCount;
        private int pendingCount;
        private double acceptanceRatePercent;

        public SupplierAcceptanceItem() {}

        public SupplierAcceptanceItem(UUID supplierId, String supplierName, int totalAssigned,
                                      int acceptedCount, int declinedCount, int pendingCount,
                                      double acceptanceRatePercent) {
            this.supplierId = supplierId;
            this.supplierName = supplierName;
            this.totalAssigned = totalAssigned;
            this.acceptedCount = acceptedCount;
            this.declinedCount = declinedCount;
            this.pendingCount = pendingCount;
            this.acceptanceRatePercent = acceptanceRatePercent;
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

        public int getTotalAssigned() {
            return totalAssigned;
        }

        public void setTotalAssigned(int totalAssigned) {
            this.totalAssigned = totalAssigned;
        }

        public int getAcceptedCount() {
            return acceptedCount;
        }

        public void setAcceptedCount(int acceptedCount) {
            this.acceptedCount = acceptedCount;
        }

        public int getDeclinedCount() {
            return declinedCount;
        }

        public void setDeclinedCount(int declinedCount) {
            this.declinedCount = declinedCount;
        }

        public int getPendingCount() {
            return pendingCount;
        }

        public void setPendingCount(int pendingCount) {
            this.pendingCount = pendingCount;
        }

        public double getAcceptanceRatePercent() {
            return acceptanceRatePercent;
        }

        public void setAcceptanceRatePercent(double acceptanceRatePercent) {
            this.acceptanceRatePercent = acceptanceRatePercent;
        }
    }

    public static class InvoiceReconciliationSection {
        private List<SupplierPoVsInvoiceItem> supplierPoVsInvoices = new ArrayList<>();
        private List<PoReceiptInvoiceReconItem> poReceiptsInvoicesVsRecon = new ArrayList<>();

        public List<SupplierPoVsInvoiceItem> getSupplierPoVsInvoices() {
            return supplierPoVsInvoices;
        }

        public void setSupplierPoVsInvoices(List<SupplierPoVsInvoiceItem> supplierPoVsInvoices) {
            this.supplierPoVsInvoices = supplierPoVsInvoices;
        }

        public List<PoReceiptInvoiceReconItem> getPoReceiptsInvoicesVsRecon() {
            return poReceiptsInvoicesVsRecon;
        }

        public void setPoReceiptsInvoicesVsRecon(List<PoReceiptInvoiceReconItem> poReceiptsInvoicesVsRecon) {
            this.poReceiptsInvoicesVsRecon = poReceiptsInvoicesVsRecon;
        }
    }

    public static class SupplierPoVsInvoiceItem {
        private UUID supplierId;
        private String supplierName;
        private int poCount;
        private int invoiceCount;
        private BigDecimal poTotalAmount = BigDecimal.ZERO;
        private BigDecimal invoiceTotalAmount = BigDecimal.ZERO;

        public SupplierPoVsInvoiceItem() {}

        public SupplierPoVsInvoiceItem(UUID supplierId, String supplierName, int poCount, int invoiceCount,
                                       BigDecimal poTotalAmount, BigDecimal invoiceTotalAmount) {
            this.supplierId = supplierId;
            this.supplierName = supplierName;
            this.poCount = poCount;
            this.invoiceCount = invoiceCount;
            this.poTotalAmount = poTotalAmount;
            this.invoiceTotalAmount = invoiceTotalAmount;
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

        public int getPoCount() {
            return poCount;
        }

        public void setPoCount(int poCount) {
            this.poCount = poCount;
        }

        public int getInvoiceCount() {
            return invoiceCount;
        }

        public void setInvoiceCount(int invoiceCount) {
            this.invoiceCount = invoiceCount;
        }

        public BigDecimal getPoTotalAmount() {
            return poTotalAmount;
        }

        public void setPoTotalAmount(BigDecimal poTotalAmount) {
            this.poTotalAmount = poTotalAmount;
        }

        public BigDecimal getInvoiceTotalAmount() {
            return invoiceTotalAmount;
        }

        public void setInvoiceTotalAmount(BigDecimal invoiceTotalAmount) {
            this.invoiceTotalAmount = invoiceTotalAmount;
        }
    }

    public static class PoReceiptInvoiceReconItem {
        private UUID poId;
        private String poNumber;
        private String poTitle;
        private String supplierName;
        private int poQuantity;
        private BigDecimal poAmount = BigDecimal.ZERO;
        private int receivedQuantity;
        private BigDecimal receivedAmount = BigDecimal.ZERO;
        private int invoiceQuantity;
        private BigDecimal invoiceAmount = BigDecimal.ZERO;
        private String receiptGrnNumber;
        private String invoiceNumber;
        private String reconciliationStatus; // MATCHED, EXCEPTION, PENDING
        private boolean isReconciled;

        public UUID getPoId() {
            return poId;
        }

        public void setPoId(UUID poId) {
            this.poId = poId;
        }

        public String getPoNumber() {
            return poNumber;
        }

        public void setPoNumber(String poNumber) {
            this.poNumber = poNumber;
        }

        public String getPoTitle() {
            return poTitle;
        }

        public void setPoTitle(String poTitle) {
            this.poTitle = poTitle;
        }

        public String getSupplierName() {
            return supplierName;
        }

        public void setSupplierName(String supplierName) {
            this.supplierName = supplierName;
        }

        public int getPoQuantity() {
            return poQuantity;
        }

        public void setPoQuantity(int poQuantity) {
            this.poQuantity = poQuantity;
        }

        public BigDecimal getPoAmount() {
            return poAmount;
        }

        public void setPoAmount(BigDecimal poAmount) {
            this.poAmount = poAmount;
        }

        public int getReceivedQuantity() {
            return receivedQuantity;
        }

        public void setReceivedQuantity(int receivedQuantity) {
            this.receivedQuantity = receivedQuantity;
        }

        public BigDecimal getReceivedAmount() {
            return receivedAmount;
        }

        public void setReceivedAmount(BigDecimal receivedAmount) {
            this.receivedAmount = receivedAmount;
        }

        public int getInvoiceQuantity() {
            return invoiceQuantity;
        }

        public void setInvoiceQuantity(int invoiceQuantity) {
            this.invoiceQuantity = invoiceQuantity;
        }

        public BigDecimal getInvoiceAmount() {
            return invoiceAmount;
        }

        public void setInvoiceAmount(BigDecimal invoiceAmount) {
            this.invoiceAmount = invoiceAmount;
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

        public String getReconciliationStatus() {
            return reconciliationStatus;
        }

        public void setReconciliationStatus(String reconciliationStatus) {
            this.reconciliationStatus = reconciliationStatus;
        }

        public boolean isReconciled() {
            return isReconciled;
        }

        public void setReconciled(boolean reconciled) {
            isReconciled = reconciled;
        }
    }

    public static class PaymentsSection {
        private List<PoReconVsPaymentItem> poReconVsPayments = new ArrayList<>();
        private PaymentDistribution distribution = new PaymentDistribution();

        public List<PoReconVsPaymentItem> getPoReconVsPayments() {
            return poReconVsPayments;
        }

        public void setPoReconVsPayments(List<PoReconVsPaymentItem> poReconVsPayments) {
            this.poReconVsPayments = poReconVsPayments;
        }

        public PaymentDistribution getDistribution() {
            return distribution;
        }

        public void setDistribution(PaymentDistribution distribution) {
            this.distribution = distribution;
        }
    }

    public static class PoReconVsPaymentItem {
        private UUID poId;
        private String poNumber;
        private String poTitle;
        private String supplierName;
        private String reconciliationStatus;
        private boolean isReconciled;
        private boolean hasPaymentId;
        private String paymentId;
        private String paymentStatus;
        private BigDecimal reconciledAmount = BigDecimal.ZERO;
        private BigDecimal paidAmount = BigDecimal.ZERO;
        private BigDecimal paymentDueAmount = BigDecimal.ZERO;

        public UUID getPoId() {
            return poId;
        }

        public void setPoId(UUID poId) {
            this.poId = poId;
        }

        public String getPoNumber() {
            return poNumber;
        }

        public void setPoNumber(String poNumber) {
            this.poNumber = poNumber;
        }

        public String getPoTitle() {
            return poTitle;
        }

        public void setPoTitle(String poTitle) {
            this.poTitle = poTitle;
        }

        public String getSupplierName() {
            return supplierName;
        }

        public void setSupplierName(String supplierName) {
            this.supplierName = supplierName;
        }

        public String getReconciliationStatus() {
            return reconciliationStatus;
        }

        public void setReconciliationStatus(String reconciliationStatus) {
            this.reconciliationStatus = reconciliationStatus;
        }

        public boolean isReconciled() {
            return isReconciled;
        }

        public void setReconciled(boolean reconciled) {
            isReconciled = reconciled;
        }

        public boolean isHasPaymentId() {
            return hasPaymentId;
        }

        public void setHasPaymentId(boolean hasPaymentId) {
            this.hasPaymentId = hasPaymentId;
        }

        public String getPaymentId() {
            return paymentId;
        }

        public void setPaymentId(String paymentId) {
            this.paymentId = paymentId;
        }

        public String getPaymentStatus() {
            return paymentStatus;
        }

        public void setPaymentStatus(String paymentStatus) {
            this.paymentStatus = paymentStatus;
        }

        public BigDecimal getReconciledAmount() {
            return reconciledAmount;
        }

        public void setReconciledAmount(BigDecimal reconciledAmount) {
            this.reconciledAmount = reconciledAmount;
        }

        public BigDecimal getPaidAmount() {
            return paidAmount;
        }

        public void setPaidAmount(BigDecimal paidAmount) {
            this.paidAmount = paidAmount;
        }

        public BigDecimal getPaymentDueAmount() {
            return paymentDueAmount;
        }

        public void setPaymentDueAmount(BigDecimal paymentDueAmount) {
            this.paymentDueAmount = paymentDueAmount;
        }
    }

    public static class PaymentDistribution {
        private int paidCount;
        private int paymentDueCount;
        private int onHoldCount;
        private int unreconciledCount;
        private BigDecimal totalPaidAmount = BigDecimal.ZERO;
        private BigDecimal totalDueAmount = BigDecimal.ZERO;

        public int getPaidCount() {
            return paidCount;
        }

        public void setPaidCount(int paidCount) {
            this.paidCount = paidCount;
        }

        public int getPaymentDueCount() {
            return paymentDueCount;
        }

        public void setPaymentDueCount(int paymentDueCount) {
            this.paymentDueCount = paymentDueCount;
        }

        public int getOnHoldCount() {
            return onHoldCount;
        }

        public void setOnHoldCount(int onHoldCount) {
            this.onHoldCount = onHoldCount;
        }

        public int getUnreconciledCount() {
            return unreconciledCount;
        }

        public void setUnreconciledCount(int unreconciledCount) {
            this.unreconciledCount = unreconciledCount;
        }

        public BigDecimal getTotalPaidAmount() {
            return totalPaidAmount;
        }

        public void setTotalPaidAmount(BigDecimal totalPaidAmount) {
            this.totalPaidAmount = totalPaidAmount;
        }

        public BigDecimal getTotalDueAmount() {
            return totalDueAmount;
        }

        public void setTotalDueAmount(BigDecimal totalDueAmount) {
            this.totalDueAmount = totalDueAmount;
        }
    }
}
