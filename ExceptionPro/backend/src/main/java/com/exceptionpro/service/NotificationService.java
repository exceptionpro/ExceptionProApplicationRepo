package com.exceptionpro.service;

import com.exceptionpro.dto.NotificationResponse;
import com.exceptionpro.entity.BusinessPartnerRequest;
import com.exceptionpro.entity.Notification;
import com.exceptionpro.entity.User;
import com.exceptionpro.repository.BusinessPartnerRequestRepository;
import com.exceptionpro.repository.NotificationRepository;
import com.exceptionpro.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               BusinessPartnerRequestRepository partnerRequestRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.partnerRequestRepository = partnerRequestRepository;
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

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(String userEmail, String category) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<Notification> list;
        if (category == null || category.isBlank() || category.equalsIgnoreCase("ALL")) {
            list = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId());
        } else {
            list = notificationRepository.findByRecipientIdAndCategoryOrderByCreatedAtDesc(user.getId(), category.toUpperCase());
        }

        // If filtering POSTS notifications, display only posts created by accepted Business Partners of the logged-in user
        if (category != null && category.equalsIgnoreCase("POSTS")) {
            List<BusinessPartnerRequest> acceptedRequests = partnerRequestRepository.findAcceptedPartnerships(user.getId());
            Set<UUID> partnerUserIds = acceptedRequests.stream()
                    .map(r -> r.getSender().getId().equals(user.getId()) ? r.getReceiver().getId() : r.getSender().getId())
                    .collect(Collectors.toSet());

            list = list.stream()
                    .filter(n -> n.getSender() != null && partnerUserIds.contains(n.getSender().getId()))
                    .collect(Collectors.toList());
        }

        return list.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
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
