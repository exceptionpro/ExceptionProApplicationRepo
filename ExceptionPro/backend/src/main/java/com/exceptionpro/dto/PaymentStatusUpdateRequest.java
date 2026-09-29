package com.exceptionpro.dto;

public class PaymentStatusUpdateRequest {

    private String paymentStatus; // Pending, Payment Due, Paid, On Hold, Cancelled
    private String notes;

    public PaymentStatusUpdateRequest() {
    }

    public PaymentStatusUpdateRequest(String paymentStatus, String notes) {
        this.paymentStatus = paymentStatus;
        this.notes = notes;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
