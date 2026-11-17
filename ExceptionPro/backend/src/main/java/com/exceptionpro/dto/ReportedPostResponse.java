package com.exceptionpro.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class ReportedPostResponse {

    private UUID reportId;
    private UUID postId;
    private String postAuthorName;
    private String postAuthorEmail;
    private String postAccountType;
    private String postDescription;
    private List<String> attachedMedia;
    private List<String> mediaThumbnails;
    private String postStatus;
    private LocalDateTime postDateCreated;

    private UUID reportedByUserId;
    private String reportedByUserName;
    private String reportedByUserEmail;
    private String reportedByAccountType;
    private String reason;
    private String comments;
    private LocalDateTime reportDateCreated;

    public ReportedPostResponse() {
    }

    public UUID getReportId() {
        return reportId;
    }

    public void setReportId(UUID reportId) {
        this.reportId = reportId;
    }

    public UUID getPostId() {
        return postId;
    }

    public void setPostId(UUID postId) {
        this.postId = postId;
    }

    public String getPostAuthorName() {
        return postAuthorName;
    }

    public void setPostAuthorName(String postAuthorName) {
        this.postAuthorName = postAuthorName;
    }

    public String getPostAuthorEmail() {
        return postAuthorEmail;
    }

    public void setPostAuthorEmail(String postAuthorEmail) {
        this.postAuthorEmail = postAuthorEmail;
    }

    public String getPostAccountType() {
        return postAccountType;
    }

    public void setPostAccountType(String postAccountType) {
        this.postAccountType = postAccountType;
    }

    public String getPostDescription() {
        return postDescription;
    }

    public void setPostDescription(String postDescription) {
        this.postDescription = postDescription;
    }

    public List<String> getAttachedMedia() {
        return attachedMedia;
    }

    public void setAttachedMedia(List<String> attachedMedia) {
        this.attachedMedia = attachedMedia;
    }

    public List<String> getMediaThumbnails() {
        return mediaThumbnails;
    }

    public void setMediaThumbnails(List<String> mediaThumbnails) {
        this.mediaThumbnails = mediaThumbnails;
    }

    public String getPostStatus() {
        return postStatus;
    }

    public void setPostStatus(String postStatus) {
        this.postStatus = postStatus;
    }

    public LocalDateTime getPostDateCreated() {
        return postDateCreated;
    }

    public void setPostDateCreated(LocalDateTime postDateCreated) {
        this.postDateCreated = postDateCreated;
    }

    public UUID getReportedByUserId() {
        return reportedByUserId;
    }

    public void setReportedByUserId(UUID reportedByUserId) {
        this.reportedByUserId = reportedByUserId;
    }

    public String getReportedByUserName() {
        return reportedByUserName;
    }

    public void setReportedByUserName(String reportedByUserName) {
        this.reportedByUserName = reportedByUserName;
    }

    public String getReportedByUserEmail() {
        return reportedByUserEmail;
    }

    public void setReportedByUserEmail(String reportedByUserEmail) {
        this.reportedByUserEmail = reportedByUserEmail;
    }

    public String getReportedByAccountType() {
        return reportedByAccountType;
    }

    public void setReportedByAccountType(String reportedByAccountType) {
        this.reportedByAccountType = reportedByAccountType;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public LocalDateTime getReportDateCreated() {
        return reportDateCreated;
    }

    public void setReportDateCreated(LocalDateTime reportDateCreated) {
        this.reportDateCreated = reportDateCreated;
    }
}
