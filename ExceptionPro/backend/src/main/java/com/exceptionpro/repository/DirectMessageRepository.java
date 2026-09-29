package com.exceptionpro.repository;

import com.exceptionpro.entity.DirectMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, UUID> {

    @Query("SELECT m FROM DirectMessage m " +
            "LEFT JOIN FETCH m.sender s " +
            "LEFT JOIN FETCH s.individualProfile " +
            "LEFT JOIN FETCH s.corporateProfile " +
            "LEFT JOIN FETCH m.receiver r " +
            "LEFT JOIN FETCH r.individualProfile " +
            "LEFT JOIN FETCH r.corporateProfile " +
            "WHERE ((m.sender.id = :user1Id AND m.receiver.id = :user2Id) " +
            "   OR (m.sender.id = :user2Id AND m.receiver.id = :user1Id)) " +
            "AND m.createdAt >= :cutoffDate " +
            "ORDER BY m.createdAt ASC")
    List<DirectMessage> findConversationBetweenUsers(
            @Param("user1Id") UUID user1Id,
            @Param("user2Id") UUID user2Id,
            @Param("cutoffDate") LocalDateTime cutoffDate);

    @Query("SELECT m FROM DirectMessage m " +
            "LEFT JOIN FETCH m.sender s " +
            "LEFT JOIN FETCH s.individualProfile " +
            "LEFT JOIN FETCH s.corporateProfile " +
            "LEFT JOIN FETCH m.receiver r " +
            "LEFT JOIN FETCH r.individualProfile " +
            "LEFT JOIN FETCH r.corporateProfile " +
            "WHERE (m.sender.id = :userId OR m.receiver.id = :userId) " +
            "AND m.createdAt >= :cutoffDate " +
            "ORDER BY m.createdAt DESC")
    List<DirectMessage> findRecentMessagesForUser(
            @Param("userId") UUID userId,
            @Param("cutoffDate") LocalDateTime cutoffDate);
}
