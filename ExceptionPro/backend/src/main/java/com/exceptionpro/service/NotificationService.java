package com.exceptionpro.service;

import com.exceptionpro.dto.NotificationResponse;
import com.exceptionpro.entity.BusinessPartnerRequest;
import com.exceptionpro.entity.Notification;
import com.exceptionpro.entity.User;
import com.exceptionpro.repository.BusinessPartnerRequestRepository;
import com.exceptionpro.repository.NotificationRepository;
import com.exceptionpro.repository.UserRepository;
import com.exceptionpro.entity.Post;
import com.exceptionpro.repository.PostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final BusinessPartnerRequestRepository partnerRequestRepository;
    private final PostRepository postRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               BusinessPartnerRequestRepository partnerRequestRepository,
                               PostRepository postRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.partnerRequestRepository = partnerRequestRepository;
        this.postRepository = postRepository;
    }

    public Notification createNotification(User recipient, User sender, String category, String title,
                                           String message, String supplierComment, UUID referenceId,
                                           String referenceType) {
        if (recipient == null) {
            return null;
        }

        Notification notification = new Notification();
        notification.setId(UUID.randomUUID());
        notification.setRecipient(recipient);
        notification.setSender(sender);
        notification.setCategory(category != null ? category.toUpperCase() : "REQUISITIONS");
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setSupplierComment(supplierComment);
        notification.setReferenceId(referenceId);
        notification.setReferenceType(referenceType);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        return notificationRepository.save(notification);
    }

    public List<NotificationResponse> getUserNotifications(String userEmail, String category) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean isAll = (category == null || category.isBlank() || category.equalsIgnoreCase("ALL"));
        boolean isPosts = (category != null && (category.equalsIgnoreCase("POSTS") || category.equalsIgnoreCase("POST")));
        boolean isMyPost = (category != null && (category.equalsIgnoreCase("MY_POST") || category.equalsIgnoreCase("MY_POSTS")));

        // If checking MY_POST or ALL: ensure user's own posts have published notifications
        if (isMyPost || isAll) {
            syncMyPostNotifications(user);
        }

        // If checking POSTS or ALL: ensure accepted business partners' posts have notifications
        Set<UUID> partnerUserIds = Set.of();
        if (isPosts || isAll) {
            partnerUserIds = syncPartnerPostNotifications(user);
        }

        List<Notification> list;
        if (isAll) {
            list = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId());
            final Set<UUID> finalPartnerIds = partnerUserIds;
            list = list.stream()
                    .filter(n -> !"POSTS".equalsIgnoreCase(n.getCategory()) || (n.getSender() != null && finalPartnerIds.contains(n.getSender().getId())))
                    .collect(Collectors.toList());
        } else if (isPosts) {
            list = notificationRepository.findByRecipientIdAndCategoryInOrderByCreatedAtDesc(user.getId(), List.of("POSTS", "POST"));
            final Set<UUID> finalPartnerIds = partnerUserIds;
            list = list.stream()
                    .filter(n -> n.getSender() != null && finalPartnerIds.contains(n.getSender().getId()))
                    .collect(Collectors.toList());
        } else if (isMyPost) {
            list = notificationRepository.findByRecipientIdAndCategoryInOrderByCreatedAtDesc(user.getId(), List.of("MY_POST", "MY_POSTS"));
        } else {
            list = notificationRepository.findByRecipientIdAndCategoryOrderByCreatedAtDesc(user.getId(), category.toUpperCase());
        }

        return list.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private void syncMyPostNotifications(User user) {
        List<Post> myPosts = postRepository.findByUserIdOrderByDateCreatedDesc(user.getId());
        for (Post p : myPosts) {
            if ("DELETED".equalsIgnoreCase(p.getStatus())) {
                continue;
            }
            boolean exists = notificationRepository.existsByRecipientIdAndReferenceIdAndCategoryInAndTitle(
                    user.getId(), p.getId(), List.of("MY_POST", "MY_POSTS"), "Post Published"
            );
            if (!exists) {
                Notification notification = new Notification();
                notification.setId(UUID.randomUUID());
                notification.setRecipient(user);
                notification.setSender(user);
                notification.setCategory("MY_POST");
                notification.setTitle("Post Published");
                String postDesc = p.getPostDescription() != null ? p.getPostDescription().trim() : "";
                String snippet = postDesc.length() > 80 ? postDesc.substring(0, 80) + "..." : postDesc;
                notification.setMessage("You published a new post: \"" + snippet + "\"");
                notification.setReferenceId(p.getId());
                notification.setReferenceType("POST");
                notification.setRead(false);
                notification.setCreatedAt(p.getDateCreated() != null ? p.getDateCreated() : LocalDateTime.now());
                notificationRepository.save(notification);
            }
        }
    }

    private Set<UUID> syncPartnerPostNotifications(User user) {
        List<BusinessPartnerRequest> acceptedRequests = partnerRequestRepository.findAcceptedPartnerships(user.getId());
        Set<UUID> partnerUserIds = acceptedRequests.stream()
                .map(r -> r.getSender().getId().equals(user.getId()) ? r.getReceiver().getId() : r.getSender().getId())
                .collect(Collectors.toSet());

        if (!partnerUserIds.isEmpty()) {
            List<Post> partnerPosts = postRepository.findByUserIdInAndStatusOrderByDateCreatedDesc(partnerUserIds, "ACTIVE");
            for (Post pp : partnerPosts) {
                boolean exists = notificationRepository.existsByRecipientIdAndReferenceIdAndCategory(
                        user.getId(), pp.getId(), "POSTS"
                );
                if (!exists) {
                    Notification notification = new Notification();
                    notification.setId(UUID.randomUUID());
                    notification.setRecipient(user);
                    notification.setSender(pp.getUser());
                    notification.setCategory("POSTS");
                    notification.setTitle("New Post from Business Partner");
                    String postDesc = pp.getPostDescription() != null ? pp.getPostDescription().trim() : "";
                    String snippet = postDesc.length() > 80 ? postDesc.substring(0, 80) + "..." : postDesc;
                    String authorName = getUserDisplayName(pp.getUser());
                    notification.setMessage(authorName + " published a new post: \"" + snippet + "\"");
                    notification.setReferenceId(pp.getId());
                    notification.setReferenceType("POST");
                    notification.setRead(false);
                    notification.setCreatedAt(pp.getDateCreated() != null ? pp.getDateCreated() : LocalDateTime.now());
                    notificationRepository.save(notification);
                }
            }
        }
        return partnerUserIds;
    }

    public void markAsRead(UUID id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Unauthorized action on notification");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    public void markAllAsRead(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Notification> list = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId());
        for (Notification n : list) {
            if (!n.isRead()) {
                n.setRead(true);
            }
        }
        notificationRepository.saveAll(list);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return notificationRepository.countByRecipientIdAndIsReadFalse(user.getId());
    }

    private NotificationResponse mapToResponse(Notification n) {
        String senderEmail = n.getSender() != null ? n.getSender().getEmail() : null;
        String senderName = n.getSender() != null ? getUserDisplayName(n.getSender()) : "System";

        return new NotificationResponse(
                n.getId(),
                n.getRecipient().getId(),
                n.getRecipient().getEmail(),
                n.getSender() != null ? n.getSender().getId() : null,
                senderEmail,
                senderName,
                n.getCategory(),
                n.getTitle(),
                n.getMessage(),
                n.getSupplierComment(),
                n.getReferenceId(),
                n.getReferenceType(),
                n.isRead(),
                n.getCreatedAt()
        );
    }

    private String getUserDisplayName(User u) {
        if (u == null) return "System";
        try {
            if (u.getCorporateProfile() != null && u.getCorporateProfile().getOrganizationName() != null && !u.getCorporateProfile().getOrganizationName().isBlank()) {
                return u.getCorporateProfile().getOrganizationName();
            }
            if (u.getIndividualProfile() != null && u.getIndividualProfile().getFirstName() != null) {
                String last = u.getIndividualProfile().getLastName() != null ? " " + u.getIndividualProfile().getLastName() : "";
                return u.getIndividualProfile().getFirstName() + last;
            }
        } catch (Exception e) {
            // Ignore lazy loading exception
        }
        return u.getEmail() != null ? u.getEmail() : "User";
    }
}
