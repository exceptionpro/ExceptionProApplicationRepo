package com.exceptionpro.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class SupplierDashboardResponse {

    private DashboardSummary summary = new DashboardSummary();
    private PurchaseAndCollaborationSection purchaseAndCollaboration = new PurchaseAndCollaborationSection();
    private ReceiptsSection receipts = new ReceiptsSection();
    private InvoiceAndPaymentsSection invoiceAndPayments = new InvoiceAndPaymentsSection();

    public DashboardSummary getSummary() {
        return summary;
    }

    public void setSummary(DashboardSummary summary) {
        this.summary = summary;
    }

    public PurchaseAndCollaborationSection getPurchaseAndCollaboration() {
        return purchaseAndCollaboration;
    }

    public void setPurchaseAndCollaboration(PurchaseAndCollaborationSection purchaseAndCollaboration) {
        this.purchaseAndCollaboration = purchaseAndCollaboration;
    }

    public ReceiptsSection getReceipts() {
        return receipts;
    }

    public void setReceipts(ReceiptsSection receipts) {
        this.receipts = receipts;
    }

    public InvoiceAndPaymentsSection getInvoiceAndPayments() {
        return invoiceAndPayments;
    }

    public void setInvoiceAndPayments(InvoiceAndPaymentsSection invoiceAndPayments) {
        this.invoiceAndPayments = invoiceAndPayments;
    }

    // ------------------------------------------------------------------------
    // Common Chart Item
    // ------------------------------------------------------------------------
    public static class ChartDistributionItem {
        private String label;
        private double value;
        private double percentage;
        private String color;

        public ChartDistributionItem() {}

        public ChartDistributionItem(String label, double value, double percentage, String color) {
            this.label = label;
            this.value = value;
            this.percentage = percentage;
            this.color = color;
        }

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }

        public double getValue() { return value; }
        public void setValue(double value) { this.value = value; }

        public double getPercentage() { return percentage; }
        public void setPercentage(double percentage) { this.percentage = percentage; }

        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }
    }

    // ------------------------------------------------------------------------
    // Dashboard Summary
    // ------------------------------------------------------------------------
    public static class DashboardSummary {
        private int totalPurchaseRequests;
        private int approvedPurchaseRequests;
        private int declinedPurchaseRequests;
        private double prApprovalRate;

        private int totalCollaborationRequests;
        private int approvedCollaborationRequests;
        private int declinedCollaborationRequests;
        private int proposalsSubmitted;
        private int convertedToPoCount;
        private double collabConversionRate;

        private int totalReceipts;
        private int pendingZeroReceipts;
        private double pendingZeroApprovedRate;
        private int pendingGreaterThanZeroReceipts;
        private double pendingGreaterThanZeroApprovedRate;

        private int totalPos;
        private int totalInvoices;
        private BigDecimal totalPoAmount = BigDecimal.ZERO;
        private BigDecimal totalInvoicedAmount = BigDecimal.ZERO;
        private int totalPaymentsReceived;
        private BigDecimal totalPaidAmount = BigDecimal.ZERO;

        public int getTotalPurchaseRequests() { return totalPurchaseRequests; }
        public void setTotalPurchaseRequests(int totalPurchaseRequests) { this.totalPurchaseRequests = totalPurchaseRequests; }

        public int getApprovedPurchaseRequests() { return approvedPurchaseRequests; }
        public void setApprovedPurchaseRequests(int approvedPurchaseRequests) { this.approvedPurchaseRequests = approvedPurchaseRequests; }

        public int getDeclinedPurchaseRequests() { return declinedPurchaseRequests; }
        public void setDeclinedPurchaseRequests(int declinedPurchaseRequests) { this.declinedPurchaseRequests = declinedPurchaseRequests; }

        public double getPrApprovalRate() { return prApprovalRate; }
        public void setPrApprovalRate(double prApprovalRate) { this.prApprovalRate = prApprovalRate; }

        public int getTotalCollaborationRequests() { return totalCollaborationRequests; }
        public void setTotalCollaborationRequests(int totalCollaborationRequests) { this.totalCollaborationRequests = totalCollaborationRequests; }

        public int getApprovedCollaborationRequests() { return approvedCollaborationRequests; }
        public void setApprovedCollaborationRequests(int approvedCollaborationRequests) { this.approvedCollaborationRequests = approvedCollaborationRequests; }

        public int getDeclinedCollaborationRequests() { return declinedCollaborationRequests; }
        public void setDeclinedCollaborationRequests(int declinedCollaborationRequests) { this.declinedCollaborationRequests = declinedCollaborationRequests; }

        public int getProposalsSubmitted() { return proposalsSubmitted; }
        public void setProposalsSubmitted(int proposalsSubmitted) { this.proposalsSubmitted = proposalsSubmitted; }

        public int getConvertedToPoCount() { return convertedToPoCount; }
        public void setConvertedToPoCount(int convertedToPoCount) { this.convertedToPoCount = convertedToPoCount; }

        public double getCollabConversionRate() { return collabConversionRate; }
        public void setCollabConversionRate(double collabConversionRate) { this.collabConversionRate = collabConversionRate; }

        public int getTotalReceipts() { return totalReceipts; }
        public void setTotalReceipts(int totalReceipts) { this.totalReceipts = totalReceipts; }

        public int getPendingZeroReceipts() { return pendingZeroReceipts; }
        public void setPendingZeroReceipts(int pendingZeroReceipts) { this.pendingZeroReceipts = pendingZeroReceipts; }

        public double getPendingZeroApprovedRate() { return pendingZeroApprovedRate; }
        public void setPendingZeroApprovedRate(double pendingZeroApprovedRate) { this.pendingZeroApprovedRate = pendingZeroApprovedRate; }

        public int getPendingGreaterThanZeroReceipts() { return pendingGreaterThanZeroReceipts; }
        public void setPendingGreaterThanZeroReceipts(int pendingGreaterThanZeroReceipts) { this.pendingGreaterThanZeroReceipts = pendingGreaterThanZeroReceipts; }

        public double getPendingGreaterThanZeroApprovedRate() { return pendingGreaterThanZeroApprovedRate; }
        public void setPendingGreaterThanZeroApprovedRate(double pendingGreaterThanZeroApprovedRate) { this.pendingGreaterThanZeroApprovedRate = pendingGreaterThanZeroApprovedRate; }

        public int getTotalPos() { return totalPos; }
        public void setTotalPos(int totalPos) { this.totalPos = totalPos; }

        public int getTotalInvoices() { return totalInvoices; }
        public void setTotalInvoices(int totalInvoices) { this.totalInvoices = totalInvoices; }

        public BigDecimal getTotalPoAmount() { return totalPoAmount; }
        public void setTotalPoAmount(BigDecimal totalPoAmount) { this.totalPoAmount = totalPoAmount; }

        public BigDecimal getTotalInvoicedAmount() { return totalInvoicedAmount; }
        public void setTotalInvoicedAmount(BigDecimal totalInvoicedAmount) { this.totalInvoicedAmount = totalInvoicedAmount; }

        public int getTotalPaymentsReceived() { return totalPaymentsReceived; }
        public void setTotalPaymentsReceived(int totalPaymentsReceived) { this.totalPaymentsReceived = totalPaymentsReceived; }

        public BigDecimal getTotalPaidAmount() { return totalPaidAmount; }
        public void setTotalPaidAmount(BigDecimal totalPaidAmount) { this.totalPaidAmount = totalPaidAmount; }
    }

    // ------------------------------------------------------------------------
    // Section 1: Purchase & Collaboration Requests
    // ------------------------------------------------------------------------
    public static class PurchaseAndCollaborationSection {
        private PeriodSupplierData weekly = new PeriodSupplierData();
        private PeriodSupplierData monthly = new PeriodSupplierData();
        private PeriodSupplierData quarterly = new PeriodSupplierData();

        public PeriodSupplierData getWeekly() { return weekly; }
        public void setWeekly(PeriodSupplierData weekly) { this.weekly = weekly; }

        public PeriodSupplierData getMonthly() { return monthly; }
        public void setMonthly(PeriodSupplierData monthly) { this.monthly = monthly; }

        public PeriodSupplierData getQuarterly() { return quarterly; }
        public void setQuarterly(PeriodSupplierData quarterly) { this.quarterly = quarterly; }
    }

    public static class PeriodSupplierData {
        private List<BuyerPrItem> buyerPurchaseRequests = new ArrayList<>();
        private List<BuyerCollaborationItem> buyerCollaborationRequests = new ArrayList<>();
        private List<ChartDistributionItem> prStatusDistribution = new ArrayList<>();
        private List<ChartDistributionItem> collabStatusDistribution = new ArrayList<>();

        public List<BuyerPrItem> getBuyerPurchaseRequests() { return buyerPurchaseRequests; }
        public void setBuyerPurchaseRequests(List<BuyerPrItem> buyerPurchaseRequests) { this.buyerPurchaseRequests = buyerPurchaseRequests; }

        public List<BuyerCollaborationItem> getBuyerCollaborationRequests() { return buyerCollaborationRequests; }
        public void setBuyerCollaborationRequests(List<BuyerCollaborationItem> buyerCollaborationRequests) { this.buyerCollaborationRequests = buyerCollaborationRequests; }

        public List<ChartDistributionItem> getPrStatusDistribution() { return prStatusDistribution; }
        public void setPrStatusDistribution(List<ChartDistributionItem> prStatusDistribution) { this.prStatusDistribution = prStatusDistribution; }

        public List<ChartDistributionItem> getCollabStatusDistribution() { return collabStatusDistribution; }
        public void setCollabStatusDistribution(List<ChartDistributionItem> collabStatusDistribution) { this.collabStatusDistribution = collabStatusDistribution; }
    }

    public static class BuyerPrItem {
        private UUID buyerId;
        private String buyerName;
        private String buyerEmail;
        private int totalRequested;
        private int approvedCount;
        private int declinedCount;
        private int pendingCount;
        private double approvalRatePercent;

        public UUID getBuyerId() { return buyerId; }
        public void setBuyerId(UUID buyerId) { this.buyerId = buyerId; }

        public String getBuyerName() { return buyerName; }
        public void setBuyerName(String buyerName) { this.buyerName = buyerName; }

        public String getBuyerEmail() { return buyerEmail; }
        public void setBuyerEmail(String buyerEmail) { this.buyerEmail = buyerEmail; }

        public int getTotalRequested() { return totalRequested; }
        public void setTotalRequested(int totalRequested) { this.totalRequested = totalRequested; }

        public int getApprovedCount() { return approvedCount; }
        public void setApprovedCount(int approvedCount) { this.approvedCount = approvedCount; }

        public int getDeclinedCount() { return declinedCount; }
        public void setDeclinedCount(int declinedCount) { this.declinedCount = declinedCount; }

        public int getPendingCount() { return pendingCount; }
        public void setPendingCount(int pendingCount) { this.pendingCount = pendingCount; }

        public double getApprovalRatePercent() { return approvalRatePercent; }
        public void setApprovalRatePercent(double approvalRatePercent) { this.approvalRatePercent = approvalRatePercent; }
    }

    public static class BuyerCollaborationItem {
        private UUID buyerId;
        private String buyerName;
        private String buyerEmail;
        private int totalRequests;
        private int approvedCount;
        private int declinedCount;
        private int proposalsCount;
        private int convertedToPoCount;
        private double conversionRatePercent;

        public UUID getBuyerId() { return buyerId; }
        public void setBuyerId(UUID buyerId) { this.buyerId = buyerId; }

        public String getBuyerName() { return buyerName; }
        public void setBuyerName(String buyerName) { this.buyerName = buyerName; }

        public String getBuyerEmail() { return buyerEmail; }
        public void setBuyerEmail(String buyerEmail) { this.buyerEmail = buyerEmail; }

        public int getTotalRequests() { return totalRequests; }
        public void setTotalRequests(int totalRequests) { this.totalRequests = totalRequests; }

        public int getApprovedCount() { return approvedCount; }
        public void setApprovedCount(int approvedCount) { this.approvedCount = approvedCount; }

        public int getDeclinedCount() { return declinedCount; }
        public void setDeclinedCount(int declinedCount) { this.declinedCount = declinedCount; }

        public int getProposalsCount() { return proposalsCount; }
        public void setProposalsCount(int proposalsCount) { this.proposalsCount = proposalsCount; }

        public int getConvertedToPoCount() { return convertedToPoCount; }
        public void setConvertedToPoCount(int convertedToPoCount) { this.convertedToPoCount = convertedToPoCount; }

        public double getConversionRatePercent() { return conversionRatePercent; }
        public void setConversionRatePercent(double conversionRatePercent) { this.conversionRatePercent = conversionRatePercent; }
    }

    // ------------------------------------------------------------------------
    // Section 2: Receipts
    // ------------------------------------------------------------------------
    public static class ReceiptsSection {
        private ReceiptSubGroup allDeliveredReceipts = new ReceiptSubGroup();
        private ReceiptSubGroup pendingQuantityReceipts = new ReceiptSubGroup();
        private List<ChartDistributionItem> receiptDistribution = new ArrayList<>();

        public ReceiptSubGroup getAllDeliveredReceipts() { return allDeliveredReceipts; }
        public void setAllDeliveredReceipts(ReceiptSubGroup allDeliveredReceipts) { this.allDeliveredReceipts = allDeliveredReceipts; }

        public ReceiptSubGroup getPendingQuantityReceipts() { return pendingQuantityReceipts; }
        public void setPendingQuantityReceipts(ReceiptSubGroup pendingQuantityReceipts) { this.pendingQuantityReceipts = pendingQuantityReceipts; }

        public List<ChartDistributionItem> getReceiptDistribution() { return receiptDistribution; }
        public void setReceiptDistribution(List<ChartDistributionItem> receiptDistribution) { this.receiptDistribution = receiptDistribution; }
    }

    public static class ReceiptSubGroup {
        private int totalReceipts;
        private int approvedCount;
        private int pendingApprovalCount;
        private int totalPendingQuantity;
        private double approvalRatePercent;
        private List<BuyerReceiptItem> buyerStats = new ArrayList<>();
        private List<ChartDistributionItem> approvalDistribution = new ArrayList<>();

        public int getTotalReceipts() { return totalReceipts; }
        public void setTotalReceipts(int totalReceipts) { this.totalReceipts = totalReceipts; }

        public int getApprovedCount() { return approvedCount; }
        public void setApprovedCount(int approvedCount) { this.approvedCount = approvedCount; }

        public int getPendingApprovalCount() { return pendingApprovalCount; }
        public void setPendingApprovalCount(int pendingApprovalCount) { this.pendingApprovalCount = pendingApprovalCount; }

        public int getTotalPendingQuantity() { return totalPendingQuantity; }
        public void setTotalPendingQuantity(int totalPendingQuantity) { this.totalPendingQuantity = totalPendingQuantity; }

        public double getApprovalRatePercent() { return approvalRatePercent; }
        public void setApprovalRatePercent(double approvalRatePercent) { this.approvalRatePercent = approvalRatePercent; }

        public List<BuyerReceiptItem> getBuyerStats() { return buyerStats; }
        public void setBuyerStats(List<BuyerReceiptItem> buyerStats) { this.buyerStats = buyerStats; }

        public List<ChartDistributionItem> getApprovalDistribution() { return approvalDistribution; }
        public void setApprovalDistribution(List<ChartDistributionItem> approvalDistribution) { this.approvalDistribution = approvalDistribution; }
    }

    public static class BuyerReceiptItem {
        private UUID buyerId;
        private String buyerName;
        private String buyerEmail;
        private int totalReceipts;
        private int approvedCount;
        private int pendingApprovalCount;
        private int pendingQuantity;
        private double approvalRatePercent;

        public UUID getBuyerId() { return buyerId; }
        public void setBuyerId(UUID buyerId) { this.buyerId = buyerId; }

        public String getBuyerName() { return buyerName; }
        public void setBuyerName(String buyerName) { this.buyerName = buyerName; }

        public String getBuyerEmail() { return buyerEmail; }
        public void setBuyerEmail(String buyerEmail) { this.buyerEmail = buyerEmail; }

        public int getTotalReceipts() { return totalReceipts; }
        public void setTotalReceipts(int totalReceipts) { this.totalReceipts = totalReceipts; }

        public int getApprovedCount() { return approvedCount; }
        public void setApprovedCount(int approvedCount) { this.approvedCount = approvedCount; }

        public int getPendingApprovalCount() { return pendingApprovalCount; }
        public void setPendingApprovalCount(int pendingApprovalCount) { this.pendingApprovalCount = pendingApprovalCount; }

        public int getPendingQuantity() { return pendingQuantity; }
        public void setPendingQuantity(int pendingQuantity) { this.pendingQuantity = pendingQuantity; }

        public double getApprovalRatePercent() { return approvalRatePercent; }
        public void setApprovalRatePercent(double approvalRatePercent) { this.approvalRatePercent = approvalRatePercent; }
    }

    // ------------------------------------------------------------------------
    // Section 3: Invoice & Payments
    // ------------------------------------------------------------------------
    public static class InvoiceAndPaymentsSection {
        private List<BuyerPoVsInvoiceItem> buyerPoVsInvoices = new ArrayList<>();
        private List<BuyerInvoiceVsPaymentItem> buyerInvoiceVsPayments = new ArrayList<>();
        private List<ChartDistributionItem> poInvoicingDistribution = new ArrayList<>();
        private List<ChartDistributionItem> paymentStatusDistribution = new ArrayList<>();

        public List<BuyerPoVsInvoiceItem> getBuyerPoVsInvoices() { return buyerPoVsInvoices; }
        public void setBuyerPoVsInvoices(List<BuyerPoVsInvoiceItem> buyerPoVsInvoices) { this.buyerPoVsInvoices = buyerPoVsInvoices; }

        public List<BuyerInvoiceVsPaymentItem> getBuyerInvoiceVsPayments() { return buyerInvoiceVsPayments; }
        public void setBuyerInvoiceVsPayments(List<BuyerInvoiceVsPaymentItem> buyerInvoiceVsPayments) { this.buyerInvoiceVsPayments = buyerInvoiceVsPayments; }

        public List<ChartDistributionItem> getPoInvoicingDistribution() { return poInvoicingDistribution; }
        public void setPoInvoicingDistribution(List<ChartDistributionItem> poInvoicingDistribution) { this.poInvoicingDistribution = poInvoicingDistribution; }

        public List<ChartDistributionItem> getPaymentStatusDistribution() { return paymentStatusDistribution; }
        public void setPaymentStatusDistribution(List<ChartDistributionItem> paymentStatusDistribution) { this.paymentStatusDistribution = paymentStatusDistribution; }
    }

    public static class BuyerPoVsInvoiceItem {
        private UUID buyerId;
        private String buyerName;
        private String buyerEmail;
        private int poCount;
        private BigDecimal poTotalAmount = BigDecimal.ZERO;
        private int invoicesCreatedCount;
        private BigDecimal invoicesTotalAmount = BigDecimal.ZERO;
        private double invoicingRatePercent;

        public UUID getBuyerId() { return buyerId; }
        public void setBuyerId(UUID buyerId) { this.buyerId = buyerId; }

        public String getBuyerName() { return buyerName; }
        public void setBuyerName(String buyerName) { this.buyerName = buyerName; }

        public String getBuyerEmail() { return buyerEmail; }
        public void setBuyerEmail(String buyerEmail) { this.buyerEmail = buyerEmail; }

        public int getPoCount() { return poCount; }
        public void setPoCount(int poCount) { this.poCount = poCount; }

        public BigDecimal getPoTotalAmount() { return poTotalAmount; }
        public void setPoTotalAmount(BigDecimal poTotalAmount) { this.poTotalAmount = poTotalAmount; }

        public int getInvoicesCreatedCount() { return invoicesCreatedCount; }
        public void setInvoicesCreatedCount(int invoicesCreatedCount) { this.invoicesCreatedCount = invoicesCreatedCount; }

        public BigDecimal getInvoicesTotalAmount() { return invoicesTotalAmount; }
        public void setInvoicesTotalAmount(BigDecimal invoicesTotalAmount) { this.invoicesTotalAmount = invoicesTotalAmount; }

        public double getInvoicingRatePercent() { return invoicingRatePercent; }
        public void setInvoicingRatePercent(double invoicingRatePercent) { this.invoicingRatePercent = invoicingRatePercent; }
    }

    public static class BuyerInvoiceVsPaymentItem {
        private UUID buyerId;
        private String buyerName;
        private String buyerEmail;
        private int invoicesCount;
        private BigDecimal invoicesTotalAmount = BigDecimal.ZERO;
        private int paymentsReceivedCount;
        private BigDecimal paymentsReceivedAmount = BigDecimal.ZERO;
        private BigDecimal dueAmount = BigDecimal.ZERO;
        private double paymentSettlementRatePercent;

        public UUID getBuyerId() { return buyerId; }
        public void setBuyerId(UUID buyerId) { this.buyerId = buyerId; }

        public String getBuyerName() { return buyerName; }
        public void setBuyerName(String buyerName) { this.buyerName = buyerName; }

        public String getBuyerEmail() { return buyerEmail; }
        public void setBuyerEmail(String buyerEmail) { this.buyerEmail = buyerEmail; }

        public int getInvoicesCount() { return invoicesCount; }
        public void setInvoicesCount(int invoicesCount) { this.invoicesCount = invoicesCount; }

        public BigDecimal getInvoicesTotalAmount() { return invoicesTotalAmount; }
        public void setInvoicesTotalAmount(BigDecimal invoicesTotalAmount) { this.invoicesTotalAmount = invoicesTotalAmount; }

        public int getPaymentsReceivedCount() { return paymentsReceivedCount; }
        public void setPaymentsReceivedCount(int paymentsReceivedCount) { this.paymentsReceivedCount = paymentsReceivedCount; }

        public BigDecimal getPaymentsReceivedAmount() { return paymentsReceivedAmount; }
        public void setPaymentsReceivedAmount(BigDecimal paymentsReceivedAmount) { this.paymentsReceivedAmount = paymentsReceivedAmount; }

        public BigDecimal getDueAmount() { return dueAmount; }
        public void setDueAmount(BigDecimal dueAmount) { this.dueAmount = dueAmount; }

        public double getPaymentSettlementRatePercent() { return paymentSettlementRatePercent; }
        public void setPaymentSettlementRatePercent(double paymentSettlementRatePercent) { this.paymentSettlementRatePercent = paymentSettlementRatePercent; }
    }
}
