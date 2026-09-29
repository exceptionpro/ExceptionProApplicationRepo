package com.exceptionpro.dto;

public class ProposalRequest {
    private String proposalText;

    public ProposalRequest() {}

    public ProposalRequest(String proposalText) {
        this.proposalText = proposalText;
    }

    public String getProposalText() {
        return proposalText;
    }

    public void setProposalText(String proposalText) {
        this.proposalText = proposalText;
    }
}
