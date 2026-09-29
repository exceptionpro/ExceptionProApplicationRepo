package com.exceptionpro.dto;

public class SupplierActionRequest {
    private String comments;
    private String reason;

    public SupplierActionRequest() {}

    public SupplierActionRequest(String comments) {
        this.comments = comments;
    }

    public String getComments() {
        if (comments != null && !comments.isBlank()) {
            return comments;
        }
        return reason;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
