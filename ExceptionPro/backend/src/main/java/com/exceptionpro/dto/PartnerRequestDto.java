package com.exceptionpro.dto;

import java.util.UUID;

public class PartnerRequestDto {
    private UUID receiverId;

    public UUID getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(UUID receiverId) {
        this.receiverId = receiverId;
    }
}
