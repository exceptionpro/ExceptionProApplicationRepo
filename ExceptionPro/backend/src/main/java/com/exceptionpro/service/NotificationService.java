package com.exceptionpro.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.exceptionpro.dto.NotificationResponse;
import com.exceptionpro.entity.BusinessPartnerRequest;
import com.exceptionpro.entity.Notification;
import com.exceptionpro.entity.Post;
import com.exceptionpro.entity.Requisition;
import com.exceptionpro.entity.User;
import com.exceptionpro.repository.BusinessPartnerRequestRepository;
import com.exceptionpro.repository.NotificationRepository;
import com.exceptionpro.repository.PostRepository;
import com.exceptionpro.repository.RequisitionRepository;
import com.exceptionpro.repository.UserRepository;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final BusinessPartnerRequestRepository partnerRequestRepository;
    private final PostRepository postRepository;
    private final RequisitionRepository requisitionRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               BusinessPartnerRequestRepository partnerRequestRepository,
                               PostRepository postRepository,
                               RequisitionRepository requisitionRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.partnerRequestRepository = partnerRequestRepository;
        this.postRepository = postRepository;
        this.requisitionRepository = requisitionRepository;
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
        boolean isRequisitions = (category != null && (category.equalsIgnoreCase("REQUISITIONS") || category.equalsIgnoreCase("REQUISITION")));

        // If checking REQUISITIONS or ALL: ensure supplier gets notified of buyer's submitted requisitions and buyer gets notified of supplier's accept/decline actions
        if (isRequisitions || isAll) {
            syncSupplierRequisitionNotifications(user);
            syncBuyerPurchaseOrderNotifications(user);
        }

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
            String cat = category != null ? category.toUpperCase() : "";
            list = notificationRepository.findByRecipientIdAndCategoryOrderByCreatedAtDesc(user.getId(), cat);
        }

        return list.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public Notification sendOrUpdateBuyerPurchaseOrderNotification(Requisition saved, User supplier, String status) {
        if (saved == null || saved.getBuyer() == null) {
            return null;
        }

        User buyer = saved.getBuyer();
        String supplierName = getUserDisplayName(supplier);
        String buyerName = getUserDisplayName(buyer);

        int reqNum = saved.getReqNumber() != null ? saved.getReqNumber().intValue() : 1;
        String poCode = String.format("PO%02d", reqNum);

        String productNames = (saved.getItems() != null && !saved.getItems().isEmpty())
                ? saved.getItems().stream()
                        .map(i -> i != null ? i.getProductName() : null)
                        .filter(p -> p != null && !p.isBlank())
                        .distinct()
                        .collect(Collectors.joining(", "))
                : (saved.getTitle() != null ? saved.getTitle() : "Product");

        String itemDescriptions = (saved.getItems() != null && !saved.getItems().isEmpty())
                ? saved.getItems().stream()
                        .map(i -> i != null ? i.getFullDescription() : null)
                        .filter(d -> d != null && !d.isBlank())
                        .distinct()
                        .collect(Collectors.joining("; "))
                : null;

        String description = (itemDescriptions != null && !itemDescriptions.isBlank())
                ? itemDescriptions
                : (saved.getTitle() != null && !saved.getTitle().isBlank() ? saved.getTitle() : "-");

        String expectedTitle = "Purchase Order " + status + " (" + poCode + ")";
        String expectedMsg = "Supplier " + supplierName + " has " + status.toUpperCase() + " Purchase Order " + poCode + ".\n"
                + "• Purchase Order ID: " + poCode + "\n"
                + "• Buyer Name: " + buyerName + "\n"
                + "• Product Name: " + productNames + "\n"
                + "• Description: " + description + "\n"
                + "• Status: " + status;

        List<Notification> existingList = notificationRepository.findByRecipientIdAndReferenceIdAndCategory(
                buyer.getId(), saved.getId(), "REQUISITIONS"
        );

        Notification notification;
        if (!existingList.isEmpty()) {
            notification = existingList.get(0);
        } else {
            notification = new Notification();
            notification.setId(UUID.randomUUID());
            notification.setRecipient(buyer);
            notification.setCategory("REQUISITIONS");
            notification.setReferenceId(saved.getId());
            notification.setReferenceType("REQUISITION");
        }

        notification.setSender(supplier);
        notification.setTitle(expectedTitle);
        notification.setMessage(expectedMsg);
        notification.setSupplierComment(saved.getSupplierComment());
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        return notificationRepository.save(notification);
    }

    private void syncBuyerPurchaseOrderNotifications(User buyer) {
        try {
            List<String> poStatuses = List.of("Accepted", "Declined");
            List<Requisition> buyerPOs = requisitionRepository.findByBuyerIdAndStatusInOrderByCreatedAtDesc(buyer.getId(), poStatuses);
            if (buyerPOs == null || buyerPOs.isEmpty()) {
                return;
            }

            for (Requisition r : buyerPOs) {
                User supplier = r.getSupplier();
                String supplierName = supplier != null ? getUserDisplayName(supplier) : "Supplier";
                String buyerName = getUserDisplayName(buyer);

                int reqNum = r.getReqNumber() != null ? r.getReqNumber().intValue() : 1;
                String poCode = String.format("PO%02d", reqNum);
                String status = r.getStatus();

                String productNames = (r.getItems() != null && !r.getItems().isEmpty())
                        ? r.getItems().stream()
                                .map(i -> i != null ? i.getProductName() : null)
                                .filter(p -> p != null && !p.isBlank())
                                .distinct()
                                .collect(Collectors.joining(", "))
                        : (r.getTitle() != null ? r.getTitle() : "Product");

                String itemDescriptions = (r.getItems() != null && !r.getItems().isEmpty())
                        ? r.getItems().stream()
                                .map(i -> i != null ? i.getFullDescription() : null)
                                .filter(d -> d != null && !d.isBlank())
                                .distinct()
                                .collect(Collectors.joining("; "))
                        : null;

                String description = (itemDescriptions != null && !itemDescriptions.isBlank())
                        ? itemDescriptions
                        : (r.getTitle() != null && !r.getTitle().isBlank() ? r.getTitle() : "-");

                String expectedTitle = "Purchase Order " + status + " (" + poCode + ")";
                String expectedMsg = "Supplier " + supplierName + " has " + status.toUpperCase() + " Purchase Order " + poCode + ".\n"
                        + "• Purchase Order ID: " + poCode + "\n"
                        + "• Buyer Name: " + buyerName + "\n"
                        + "• Product Name: " + productNames + "\n"
                        + "• Description: " + description + "\n"
                        + "• Status: " + status;

                List<Notification> existingList = notificationRepository.findByRecipientIdAndReferenceIdAndCategory(
                        buyer.getId(), r.getId(), "REQUISITIONS"
                );

                boolean exists = existingList.stream()
                        .anyMatch(n -> n.getTitle() != null && (n.getTitle().contains("Accepted") || n.getTitle().contains("Declined")));

                if (!exists) {
                    Notification notification = new Notification();
                    notification.setId(UUID.randomUUID());
                    notification.setRecipient(buyer);
                    notification.setSender(supplier);
                    notification.setCategory("REQUISITIONS");
                    notification.setTitle(expectedTitle);
                    notification.setMessage(expectedMsg);
                    notification.setSupplierComment(r.getSupplierComment());
                    notification.setReferenceId(r.getId());
                    notification.setReferenceType("REQUISITION");
                    notification.setRead(false);
                    notification.setCreatedAt(r.getCreatedAt() != null ? r.getCreatedAt() : LocalDateTime.now());
                    notificationRepository.save(notification);
                } else {
                    for (Notification n : existingList) {
                        if (n.getTitle() != null && (n.getTitle().contains("Accepted") || n.getTitle().contains("Declined"))) {
                            if (n.getMessage() == null || !n.getMessage().contains("Purchase Order ID:") || !n.getMessage().contains("Buyer Name:")) {
                                n.setTitle(expectedTitle);
                                n.setMessage(expectedMsg);
                                n.setSupplierComment(r.getSupplierComment());
                                notificationRepository.save(n);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            // Ignore to avoid interrupting user notification retrieval
        }
    }

    private void syncSupplierRequisitionNotifications(User user) {
        try {
            // Clean up any un-converted PR notifications so supplier only sees converted Purchase Orders
            List<Notification> reqNotifications = notificationRepository.findByRecipientIdAndCategoryOrderByCreatedAtDesc(user.getId(), "REQUISITIONS");
            for (Notification n : reqNotifications) {
                if (n.getTitle() != null && n.getTitle().startsWith("New Requisition Submitted")) {
                    notificationRepository.delete(n);
                }
            }

            // Sync Purchase Orders (requisitions converted to PO, Accepted, or Declined)
            List<String> poStatuses = List.of("PO", "Accepted", "Declined");
            List<Requisition> supplierPOs = requisitionRepository.findAllBySupplierIdAndStatusInOrderByCreatedAtDesc(user.getId(), poStatuses);
            if (supplierPOs == null || supplierPOs.isEmpty()) {
                return;
            }

            for (Requisition r : supplierPOs) {
                User buyer = r.getBuyer();
                String buyerName = getUserDisplayName(buyer);

                String productNames = (r.getItems() != null && !r.getItems().isEmpty())
                        ? r.getItems().stream()
                                .filter(i -> i.getSupplier() == null
                                        || (i.getSupplier() != null && i.getSupplier().getId().equals(user.getId()))
                                        || (r.getSupplier() != null && r.getSupplier().getId().equals(user.getId())))
                                .map(i -> i != null ? i.getProductName() : null)
                                .filter(p -> p != null && !p.isBlank())
                                .distinct()
                                .collect(Collectors.joining(", "))
                        : r.getTitle();

                if (productNames == null || productNames.isBlank()) {
                    productNames = r.getTitle() != null ? r.getTitle() : "Product";
                }

                int reqNum = r.getReqNumber() != null ? r.getReqNumber().intValue() : 1;
                String poCode = String.format("PO%02d", reqNum);
                String expectedTitle = "New Purchase Order Submitted (" + poCode + ")";
                String expectedMsg = "Buyer " + buyerName + " submitted a Purchase Order " + poCode + " for Product: " + productNames + ".";

                List<Notification> existingList = notificationRepository.findByRecipientIdAndReferenceIdAndCategory(
                        user.getId(), r.getId(), "REQUISITIONS"
                );

                boolean hasPoNotification = existingList.stream()
                        .anyMatch(n -> n.getTitle() != null && n.getTitle().startsWith("New Purchase Order Submitted"));

                if (!hasPoNotification) {
                    Notification notification = new Notification();
                    notification.setId(UUID.randomUUID());
                    notification.setRecipient(user);
                    notification.setSender(buyer);
                    notification.setCategory("REQUISITIONS");
                    notification.setTitle(expectedTitle);
                    notification.setMessage(expectedMsg);
                    notification.setSupplierComment(r.getComments());
                    notification.setReferenceId(r.getId());
                    notification.setReferenceType("REQUISITION");
                    notification.setRead(false);
                    notification.setCreatedAt(r.getCreatedAt() != null ? r.getCreatedAt() : LocalDateTime.now());
                    notificationRepository.save(notification);
                } else {
                    for (Notification n : existingList) {
                        if (n.getTitle() != null && n.getTitle().startsWith("New Purchase Order Submitted")) {
                            if (n.getMessage() == null || !n.getMessage().contains(buyerName) || !n.getMessage().contains(productNames)) {
                                n.setMessage(expectedMsg);
                                notificationRepository.save(n);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            // Ignore to avoid interrupting user notification retrieval
        }
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

        Notification notification = notificationRepository.findById(Objects.requireNonNull(id))
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
        notificationRepository.saveAll(Objects.requireNonNull(list));
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
