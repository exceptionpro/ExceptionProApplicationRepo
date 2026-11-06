package com.exceptionpro.dto;

public class SupplierReplacementApprovalRequest {

    private String status; // "Accept Request", "Partially Accept", "Reject Request"
    private String confirmationMessage;
    private Integer approvedReplacementQuantity;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getConfirmationMessage() {
        return confirmationMessage;
    }

    public void setConfirmationMessage(String confirmationMessage) {
        this.confirmationMessage = confirmationMessage;
    }

    public Integer getApprovedReplacementQuantity() {
        return approvedReplacementQuantity;
    }

    public void setApprovedReplacementQuantity(Integer approvedReplacementQuantity) {
        this.approvedReplacementQuantity = approvedReplacementQuantity;
    }
}

