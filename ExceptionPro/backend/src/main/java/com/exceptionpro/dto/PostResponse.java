package com.exceptionpro.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class PostResponse {

    private UUID id;
    private UUID userId;
    private String userName;
    private String profilePicture;
    private String accountType;
    private String postDescription;
    private List<String> attachedMedia;
    private List<String> mediaThumbnails;
    private LocalDateTime dateCreated;
    private LocalDateTime lastUpdated;
    private String visibility;
    private int numLikes;
    private int numComments;
    private int numShares;
    private int numViews;
    private String status;
    private List<CommentResponse> comments;
    private boolean likedByCurrentUser;
    private boolean savedByCurrentUser;
    private boolean reportedByCurrentUser;


    public static class CommentResponse {
        private UUID id;
        private UUID userId;
        private String userEmail;
        private String userName;
        private String commentText;
        private LocalDateTime dateCreated;
        private int numLikes;
        private boolean likedByCurrentUser;
        private List<CommentResponse> replies;

        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }

        public UUID getUserId() { return userId; }
        public void setUserId(UUID userId) { this.userId = userId; }

        public String getUserEmail() { return userEmail; }
        public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

        public String getUserName() { return userName; }
        public void setUserName(String userName) { this.userName = userName; }

        public String getCommentText() { return commentText; }
        public void setCommentText(String commentText) { this.commentText = commentText; }

        public LocalDateTime getDateCreated() { return dateCreated; }
        public void setDateCreated(LocalDateTime dateCreated) { this.dateCreated = dateCreated; }

        public int getNumLikes() { return numLikes; }
        public void setNumLikes(int numLikes) { this.numLikes = numLikes; }

        public boolean isLikedByCurrentUser() { return likedByCurrentUser; }
        public void setLikedByCurrentUser(boolean likedByCurrentUser) { this.likedByCurrentUser = likedByCurrentUser; }

        public List<CommentResponse> getReplies() { return replies; }
        public void setReplies(List<CommentResponse> replies) { this.replies = replies; }
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }

    public String getAccountType() { return accountType; }
    public void setAccountType(String accountType) { this.accountType = accountType; }

    public String getPostDescription() { return postDescription; }
    public void setPostDescription(String postDescription) { this.postDescription = postDescription; }

    public List<String> getAttachedMedia() { return attachedMedia; }
    public void setAttachedMedia(List<String> attachedMedia) { this.attachedMedia = attachedMedia; }

    public List<String> getMediaThumbnails() { return mediaThumbnails; }
    public void setMediaThumbnails(List<String> mediaThumbnails) { this.mediaThumbnails = mediaThumbnails; }

    public LocalDateTime getDateCreated() { return dateCreated; }
    public void setDateCreated(LocalDateTime dateCreated) { this.dateCreated = dateCreated; }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }

    public String getVisibility() { return visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }

    public int getNumLikes() { return numLikes; }
    public void setNumLikes(int numLikes) { this.numLikes = numLikes; }

    public int getNumComments() { return numComments; }
    public void setNumComments(int numComments) { this.numComments = numComments; }

    public int getNumShares() { return numShares; }
    public void setNumShares(int numShares) { this.numShares = numShares; }

    public int getNumViews() { return numViews; }
    public void setNumViews(int numViews) { this.numViews = numViews; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<CommentResponse> getComments() { return comments; }
    public void setComments(List<CommentResponse> comments) { this.comments = comments; }

    public boolean isLikedByCurrentUser() { return likedByCurrentUser; }
    public void setLikedByCurrentUser(boolean likedByCurrentUser) { this.likedByCurrentUser = likedByCurrentUser; }

    public boolean isSavedByCurrentUser() { return savedByCurrentUser; }
    public void setSavedByCurrentUser(boolean savedByCurrentUser) { this.savedByCurrentUser = savedByCurrentUser; }

    public boolean isReportedByCurrentUser() { return reportedByCurrentUser; }
    public void setReportedByCurrentUser(boolean reportedByCurrentUser) { this.reportedByCurrentUser = reportedByCurrentUser; }

    private List<String> likedByUserNames;
    public List<String> getLikedByUserNames() { return likedByUserNames; }
    public void setLikedByUserNames(List<String> likedByUserNames) { this.likedByUserNames = likedByUserNames; }

    private String userEmail;
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
}
