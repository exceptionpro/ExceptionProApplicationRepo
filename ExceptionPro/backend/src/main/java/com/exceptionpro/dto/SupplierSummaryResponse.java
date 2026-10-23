package com.exceptionpro.dto;

import java.util.UUID;

public class SupplierSummaryResponse {
    private UUID id;
    private String email;
    private String name;
    private String accountType;
    private String status;
    private String poNumber;
    private String comments;

    public SupplierSummaryResponse() {}

    public SupplierSummaryResponse(UUID id, String email, String name, String accountType) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.accountType = accountType;
    }

    public SupplierSummaryResponse(UUID id, String email, String name, String accountType, String status, String poNumber) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.accountType = accountType;
        this.status = status;
        this.poNumber = poNumber;
    }

    public SupplierSummaryResponse(UUID id, String email, String name, String accountType, String status, String poNumber, String comments) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.accountType = accountType;
        this.status = status;
        this.poNumber = poNumber;
        this.comments = comments;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAccountType() {
        return accountType;
    }

    public void setAccountType(String accountType) {
        this.accountType = accountType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPoNumber() {
        return poNumber;
    }

    public void setPoNumber(String poNumber) {
        this.poNumber = poNumber;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }
}
