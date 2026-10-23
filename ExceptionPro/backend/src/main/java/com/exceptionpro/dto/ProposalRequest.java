package com.exceptionpro.dto;

public class ProposalRequest {
    private String proposalText;
    private String fileUrl;
    private String fileName;

    public ProposalRequest() {}

    public ProposalRequest(String proposalText) {
        this.proposalText = proposalText;
    }

    public ProposalRequest(String proposalText, String fileUrl, String fileName) {
        this.proposalText = proposalText;
        this.fileUrl = fileUrl;
        this.fileName = fileName;
    }

    public String getProposalText() {
        return proposalText;
    }

    public void setProposalText(String proposalText) {
        this.proposalText = proposalText;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
}
