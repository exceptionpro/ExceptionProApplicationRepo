package com.exceptionpro.repository;

import com.exceptionpro.entity.BusinessPartnerRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BusinessPartnerRequestRepository extends JpaRepository<BusinessPartnerRequest, UUID> {

       @Query("SELECT r FROM BusinessPartnerRequest r WHERE (r.sender.id = :id1 AND r.receiver.id = :id2) OR (r.sender.id = :id2 AND r.receiver.id = :id1)")
       Optional<BusinessPartnerRequest> findBetweenUsers(@Param("id1") UUID id1, @Param("id2") UUID id2);

       List<BusinessPartnerRequest> findBySenderId(UUID senderId);

       List<BusinessPartnerRequest> findByReceiverId(UUID receiverId);

       @Query("SELECT r FROM BusinessPartnerRequest r " +
                     "LEFT JOIN FETCH r.sender s " +
                     "LEFT JOIN FETCH s.individualProfile " +
                     "LEFT JOIN FETCH s.corporateProfile " +
                     "LEFT JOIN FETCH r.receiver rec " +
                     "LEFT JOIN FETCH rec.individualProfile " +
                     "LEFT JOIN FETCH rec.corporateProfile " +
                     "WHERE (r.sender.id = :userId OR r.receiver.id = :userId) AND r.status = 'ACCEPTED'")
       List<BusinessPartnerRequest> findAcceptedPartnerships(@Param("userId") UUID userId);

       @Query("SELECT r FROM BusinessPartnerRequest r " +
                     "LEFT JOIN FETCH r.sender s " +
                     "LEFT JOIN FETCH s.individualProfile " +
                     "LEFT JOIN FETCH s.corporateProfile " +
                     "WHERE r.receiver.id = :userId AND r.status = 'PENDING'")
       List<BusinessPartnerRequest> findIncomingPendingRequests(@Param("userId") UUID userId);

       @Query("SELECT r FROM BusinessPartnerRequest r " +
                     "LEFT JOIN FETCH r.receiver rec " +
                     "LEFT JOIN FETCH rec.individualProfile " +
                     "LEFT JOIN FETCH rec.corporateProfile " +
                     "WHERE r.sender.id = :userId AND r.status = 'PENDING'")
       List<BusinessPartnerRequest> findOutgoingPendingRequests(@Param("userId") UUID userId);
}
