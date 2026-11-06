package com.exceptionpro.dto;

import java.util.List;

public class SupplierActionRequest {
    private String comments;
    private String reason;
    private List<RequisitionItemDto> items;

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

    public List<RequisitionItemDto> getItems() {
        return items;
    }

    public void setItems(List<RequisitionItemDto> items) {
        this.items = items;
    }
}
