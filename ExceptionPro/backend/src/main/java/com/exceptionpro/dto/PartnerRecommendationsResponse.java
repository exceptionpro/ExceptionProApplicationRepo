package com.exceptionpro.dto;

import java.util.List;

public class PartnerRecommendationsResponse {
    private String title;
    private List<PartnerSearchResponse> users;

    public PartnerRecommendationsResponse() {}

    public PartnerRecommendationsResponse(String title, List<PartnerSearchResponse> users) {
        this.title = title;
        this.users = users;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public List<PartnerSearchResponse> getUsers() {
        return users;
    }

    public void setUsers(List<PartnerSearchResponse> users) {
        this.users = users;
    }
}
