package com.exceptionpro.dto;

import java.util.List;

public class PostRequest {

    private String postDescription;
    private List<String> attachedMedia;
    private List<String> mediaThumbnails;
    private String visibility;

    // Getters and Setters
    public String getPostDescription() { return postDescription; }
    public void setPostDescription(String postDescription) { this.postDescription = postDescription; }

    public List<String> getAttachedMedia() { return attachedMedia; }
    public void setAttachedMedia(List<String> attachedMedia) { this.attachedMedia = attachedMedia; }

    public List<String> getMediaThumbnails() { return mediaThumbnails; }
    public void setMediaThumbnails(List<String> mediaThumbnails) { this.mediaThumbnails = mediaThumbnails; }

    public String getVisibility() { return visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }
}
