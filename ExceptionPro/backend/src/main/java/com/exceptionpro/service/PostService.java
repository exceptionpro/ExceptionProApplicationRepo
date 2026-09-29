package com.exceptionpro.service;

import com.exceptionpro.dto.PostRequest;
import com.exceptionpro.dto.PostResponse;
import com.exceptionpro.entity.*;
import com.exceptionpro.entity.Comment;
import com.exceptionpro.repository.BusinessPartnerRequestRepository;
import com.exceptionpro.repository.CommentRepository;
import com.exceptionpro.repository.PostRepository;
import com.exceptionpro.repository.UserRepository;
import com.exceptionpro.repository.PostReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final PostReportRepository postReportRepository;
    private final NotificationService notificationService;
    private final BusinessPartnerRequestRepository partnerRequestRepository;

    public PostService(PostRepository postRepository, CommentRepository commentRepository,
            UserRepository userRepository, PostReportRepository postReportRepository,
            NotificationService notificationService, BusinessPartnerRequestRepository partnerRequestRepository) {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.postReportRepository = postReportRepository;
        this.notificationService = notificationService;
        this.partnerRequestRepository = partnerRequestRepository;
    }

    public PostResponse createPost(PostRequest request, String userEmail) {
        User user = userRepository.findByEmailFetchProfiles(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String name = resolveDisplayName(user);
        String avatar = null;
        if ("Individual".equalsIgnoreCase(user.getAccountType()) && user.getIndividualProfile() != null) {
            avatar = user.getIndividualProfile().getProfilePicture();
        } else if (user.getCorporateProfile() != null) {
            avatar = user.getCorporateProfile().getProfilePicture();
        }
        if (avatar == null || avatar.isBlank()) {
            avatar = "https://ui-avatars.com/api/?name=" + name.replace(" ", "+") + "&background=random";
        }

        Post post = new Post();
        post.setId(UUID.randomUUID());
        post.setUser(user);
        post.setUserName(name);
        post.setProfilePicture(avatar);
        post.setAccountType(user.getAccountType() != null ? user.getAccountType() : "Unknown");
        post.setPostDescription(request.getPostDescription());

        if (request.getAttachedMedia() != null && !request.getAttachedMedia().isEmpty()) {
            if (request.getAttachedMedia().size() > 10) {
                throw new IllegalArgumentException("Maximum of 10 attachments are allowed per post.");
            }
            post.setAttachedMedia(String.join(",", request.getAttachedMedia()));
        } else {
            post.setAttachedMedia("");
        }

        if (request.getMediaThumbnails() != null && !request.getMediaThumbnails().isEmpty()) {
            post.setMediaThumbnails(String.join(",", request.getMediaThumbnails()));
        } else {
            post.setMediaThumbnails("");
        }

        post.setVisibility(request.getVisibility() != null ? request.getVisibility() : "PUBLIC");
        post.setDateCreated(LocalDateTime.now());
        post.setLastUpdated(LocalDateTime.now());
        post.setStatus("ACTIVE");

        Post saved = postRepository.save(post);

        // Notify all accepted Business Partners about the new Post
        List<BusinessPartnerRequest> acceptedPartnerships = partnerRequestRepository.findAcceptedPartnerships(user.getId());
        for (BusinessPartnerRequest pr : acceptedPartnerships) {
            User partnerUser = pr.getSender().getId().equals(user.getId()) ? pr.getReceiver() : pr.getSender();
            String postDesc = saved.getPostDescription() != null ? saved.getPostDescription().trim() : "";
            String snippet = postDesc.length() > 80 ? postDesc.substring(0, 80) + "..." : postDesc;
            String msg = name + " published a new post: \"" + snippet + "\"";

            notificationService.createNotification(
                    partnerUser,
                    user,
                    "POSTS",
                    "New Post from Business Partner",
                    msg,
                    null,
                    saved.getId(),
                    "POST"
            );
        }

        return mapToResponse(saved, user);
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getFeed(String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail).orElse(null);
        return postRepository.findByStatusOrderByDateCreatedDesc("ACTIVE").stream()
                .map(post -> mapToResponse(post, currentUser))
                .collect(Collectors.toList());
    }

    public void likePost(UUID postId, String userEmail) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        User user = userRepository.findByEmailFetchProfiles(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean newlyLiked = false;
        if (post.getLikedByUsers().contains(user)) {
            post.getLikedByUsers().remove(user);
            post.setNumLikes(Math.max(0, post.getNumLikes() - 1));
        } else {
            post.getLikedByUsers().add(user);
            post.setNumLikes(post.getNumLikes() + 1);
            newlyLiked = true;
        }
        postRepository.save(post);

        // Notify post author under MY_POST category if liked by another user
        if (newlyLiked) {
            User postAuthor = post.getUser();
            if (postAuthor != null && !postAuthor.getId().equals(user.getId())) {
                String likerName = resolveDisplayName(user);
                String postDesc = post.getPostDescription() != null ? post.getPostDescription().trim() : "";
                String snippet = postDesc.length() > 80 ? postDesc.substring(0, 80) + "..." : postDesc;
                String msg = likerName + " liked your post: \"" + snippet + "\"";

                notificationService.createNotification(
                        postAuthor,
                        user,
                        "MY_POST",
                        "Post Liked",
                        msg,
                        null,
                        post.getId(),
                        "POST"
                );
            }
        }
    }

    public void addComment(UUID postId, String commentText, UUID parentId, String userEmail) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        User user = userRepository.findByEmailFetchProfiles(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Comment comment = new Comment();
        comment.setId(UUID.randomUUID());
        comment.setPost(post);
        comment.setUser(user);
        comment.setUserName(resolveDisplayName(user));
        comment.setCommentText(commentText);
        comment.setDateCreated(LocalDateTime.now());

        if (parentId != null) {
            Comment parent = commentRepository.findById(parentId)
                    .orElseThrow(() -> new IllegalArgumentException("Parent comment not found"));
            comment.setParent(parent);
        }

        commentRepository.save(comment);

        post.setNumComments(post.getNumComments() + 1);
        postRepository.save(post);

        // Notify post author under MY_POST category if commented on by another user
        User postAuthor = post.getUser();
        if (postAuthor != null && !postAuthor.getId().equals(user.getId())) {
            String commenterName = resolveDisplayName(user);
            String commentSnippet = commentText != null && commentText.length() > 80 ? commentText.substring(0, 80) + "..." : commentText;
            String msg = commenterName + " commented on your post: \"" + commentSnippet + "\"";

            notificationService.createNotification(
                    postAuthor,
                    user,
                    "MY_POST",
                    "New Comment on Your Post",
                    msg,
                    commentText,
                    post.getId(),
                    "POST"
            );
        }
    }

    public void deletePost(UUID postId, String userEmail) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Only author can delete
        if (!post.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Unauthorized to delete this post");
        }

        post.setStatus("DELETED");
        postRepository.save(post);
    }

    public void recordView(UUID postId) {
        Post post = postRepository.findById(postId).orElse(null);
        if (post != null) {
            post.setNumViews(post.getNumViews() + 1);
            postRepository.save(post);
        }
    }

    public void recordShare(UUID postId) {
        Post post = postRepository.findById(postId).orElse(null);
        if (post != null) {
            post.setNumShares(post.getNumShares() + 1);
            postRepository.save(post);
        }
    }

    public boolean savePost(UUID postId, String userEmail) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean saved;
        if (post.getSavedByUsers().contains(user)) {
            post.getSavedByUsers().remove(user);
            saved = false;
        } else {
            post.getSavedByUsers().add(user);
            saved = true;
        }
        postRepository.save(post);
        return saved;
    }

    public void reportPost(UUID postId, String reason, String comments, String userEmail) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (postReportRepository.existsByPostIdAndUserEmail(postId, userEmail)) {
            throw new IllegalArgumentException("You have already reported this post");
        }

        PostReport report = new PostReport();
        report.setId(UUID.randomUUID());
        report.setPost(post);
        report.setUser(user);
        report.setReason(reason);
        report.setComments(comments);
        report.setDateCreated(LocalDateTime.now());

        postReportRepository.save(report);
    }

    private String resolveDisplayName(User user) {
        if ("Individual".equalsIgnoreCase(user.getAccountType()) && user.getIndividualProfile() != null) {
            return user.getIndividualProfile().getFirstName() + " " + user.getIndividualProfile().getLastName();
        } else if (user.getCorporateProfile() != null) {
            CorporateProfile cp = user.getCorporateProfile();
            if (cp.getOrganizationName() != null && !cp.getOrganizationName().isBlank()) {
                return cp.getOrganizationName();
            }
            return cp.getLegalName();
        }
        return user.getEmail();
    }

    private PostResponse mapToResponse(Post post, User currentUser) {
        PostResponse res = new PostResponse();
        res.setId(post.getId());
        res.setUserId(post.getUser().getId());
        res.setUserEmail(post.getUser().getEmail());
        res.setUserName(post.getUserName());
        
        String avatar = null;
        User author = post.getUser();
        if (author != null) {
            if ("Individual".equalsIgnoreCase(author.getAccountType()) && author.getIndividualProfile() != null) {
                avatar = author.getIndividualProfile().getProfilePicture();
            } else if (author.getCorporateProfile() != null) {
                avatar = author.getCorporateProfile().getProfilePicture();
            }
        }
        if (avatar == null || avatar.isBlank()) {
            avatar = post.getProfilePicture();
        }
        res.setProfilePicture(avatar);
        res.setAccountType(post.getAccountType());
        res.setPostDescription(post.getPostDescription());

        if (post.getAttachedMedia() != null && !post.getAttachedMedia().isBlank()) {
            res.setAttachedMedia(Arrays.asList(post.getAttachedMedia().split(",")));
        } else {
            res.setAttachedMedia(new ArrayList<>());
        }

        if (post.getMediaThumbnails() != null && !post.getMediaThumbnails().isBlank()) {
            res.setMediaThumbnails(Arrays.asList(post.getMediaThumbnails().split(",")));
        } else {
            res.setMediaThumbnails(new ArrayList<>());
        }

        res.setDateCreated(post.getDateCreated());
        res.setLastUpdated(post.getLastUpdated());
        res.setVisibility(post.getVisibility());
        res.setNumLikes(post.getNumLikes());
        res.setNumComments(post.getNumComments());
        res.setNumShares(post.getNumShares());
        res.setNumViews(post.getNumViews());
        res.setStatus(post.getStatus());

        res.setLikedByCurrentUser(currentUser != null && post.getLikedByUsers().contains(currentUser));
        res.setSavedByCurrentUser(currentUser != null && post.getSavedByUsers().contains(currentUser));
        res.setReportedByCurrentUser(currentUser != null
                && postReportRepository.existsByPostIdAndUserEmail(post.getId(), currentUser.getEmail()));
        res.setLikedByUserNames(post.getLikedByUsers().stream()
                .map(this::resolveDisplayName)
                .collect(Collectors.toList()));

        List<Comment> comments = commentRepository.findByPostAndParentIsNullOrderByDateCreatedAsc(post);
        res.setComments(comments.stream()
                .map(c -> mapCommentToResponse(c, currentUser))
                .collect(Collectors.toList()));

        return res;
    }

    public void editComment(UUID commentId, String commentText, String userEmail) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!comment.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new IllegalArgumentException("You are not authorized to edit this comment");
        }

        comment.setCommentText(commentText);
        commentRepository.save(comment);
    }

    public void deleteComment(UUID commentId, String userEmail) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!comment.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new IllegalArgumentException("You are not authorized to delete this comment");
        }

        Post post = comment.getPost();
        commentRepository.delete(comment);

        if (post.getNumComments() > 0) {
            post.setNumComments(post.getNumComments() - 1);
            postRepository.save(post);
        }
    }

    private PostResponse.CommentResponse mapCommentToResponse(Comment c, User currentUser) {
        PostResponse.CommentResponse cr = new PostResponse.CommentResponse();
        cr.setId(c.getId());
        cr.setUserId(c.getUser().getId());
        cr.setUserEmail(c.getUser().getEmail());
        cr.setUserName(c.getUserName());
        cr.setCommentText(c.getCommentText());
        cr.setDateCreated(c.getDateCreated());
        cr.setNumLikes(c.getNumLikes());
        cr.setLikedByCurrentUser(currentUser != null && c.getLikedByUsers().contains(currentUser));

        List<Comment> sortedReplies = new ArrayList<>(c.getReplies());
        sortedReplies.sort(Comparator.comparing(Comment::getDateCreated));
        cr.setReplies(sortedReplies.stream()
                .map(reply -> mapCommentToResponse(reply, currentUser))
                .collect(Collectors.toList()));

        return cr;
    }

    public void likeComment(UUID commentId, String userEmail) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (comment.getLikedByUsers().contains(user)) {
            comment.getLikedByUsers().remove(user);
            comment.setNumLikes(Math.max(0, comment.getNumLikes() - 1));
        } else {
            comment.getLikedByUsers().add(user);
            comment.setNumLikes(comment.getNumLikes() + 1);
        }
        commentRepository.save(comment);
    }

    public PostResponse editPost(UUID postId, PostRequest request, String userEmail) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        User user = userRepository.findByEmailFetchProfiles(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Only author can edit
        if (!post.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Unauthorized to edit this post");
        }

        post.setPostDescription(request.getPostDescription());

        if (request.getAttachedMedia() != null) {
            if (request.getAttachedMedia().size() > 10) {
                throw new IllegalArgumentException("Maximum of 10 attachments are allowed per post.");
            }
            post.setAttachedMedia(String.join(",", request.getAttachedMedia()));
        } else {
            post.setAttachedMedia("");
        }

        if (request.getMediaThumbnails() != null) {
            post.setMediaThumbnails(String.join(",", request.getMediaThumbnails()));
        } else {
            post.setMediaThumbnails("");
        }

        if (request.getVisibility() != null) {
            post.setVisibility(request.getVisibility());
        }

        post.setLastUpdated(LocalDateTime.now());

        Post saved = postRepository.save(post);
        return mapToResponse(saved, user);
    }
}
