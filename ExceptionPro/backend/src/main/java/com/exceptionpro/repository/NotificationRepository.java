package com.exceptionpro.repository;

import com.exceptionpro.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId);
    List<Notification> findByRecipientIdAndCategoryOrderByCreatedAtDesc(UUID recipientId, String category);
    List<Notification> findByRecipientIdAndCategoryInOrderByCreatedAtDesc(UUID recipientId, Collection<String> categories);
    boolean existsByRecipientIdAndReferenceIdAndCategoryInAndTitle(UUID recipientId, UUID referenceId, Collection<String> categories, String title);
    boolean existsByRecipientIdAndReferenceIdAndCategory(UUID recipientId, UUID referenceId, String category);
    long countByRecipientIdAndIsReadFalse(UUID recipientId);
}
