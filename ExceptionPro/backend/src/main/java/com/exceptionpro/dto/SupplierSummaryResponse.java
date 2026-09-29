package com.exceptionpro.dto;

import java.util.UUID;

public class SupplierSummaryResponse {
    private UUID id;
    private String email;
    private String name;
    private String accountType;

    public SupplierSummaryResponse() {}

    public SupplierSummaryResponse(UUID id, String email, String name, String accountType) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.accountType = accountType;
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
}
