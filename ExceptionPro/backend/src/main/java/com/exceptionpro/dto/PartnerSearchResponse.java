package com.exceptionpro.dto;

import java.util.UUID;

public class PartnerSearchResponse {
    private UserProfileResponse profile;
    private String relationshipStatus; // NONE, PENDING_SENT, PENDING_RECEIVED, ACCEPTED, DECLINED
    private UUID requestId;

    public PartnerSearchResponse() {}

    public PartnerSearchResponse(UserProfileResponse profile, String relationshipStatus, UUID requestId) {
        this.profile = profile;
        this.relationshipStatus = relationshipStatus;
        this.requestId = requestId;
    }

    public UserProfileResponse getProfile() {
        return profile;
    }

    public void setProfile(UserProfileResponse profile) {
        this.profile = profile;
    }

    public String getRelationshipStatus() {
        return relationshipStatus;
    }

    public void setRelationshipStatus(String relationshipStatus) {
        this.relationshipStatus = relationshipStatus;
    }

    public UUID getRequestId() {
        return requestId;
    }

    public void setRequestId(UUID requestId) {
        this.requestId = requestId;
    }
}
