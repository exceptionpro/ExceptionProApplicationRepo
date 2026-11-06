package com.exceptionpro.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.exceptionpro.entity.ReplacementRequest;

@Repository
public interface ReplacementRequestRepository extends JpaRepository<ReplacementRequest, UUID> {

    List<ReplacementRequest> findByBuyerIdOrderByCreatedAtDesc(UUID buyerId);

    List<ReplacementRequest> findByReceivedFromSupplierIdOrderByCreatedAtDesc(UUID supplierId);

    List<ReplacementRequest> findByBuyerIdOrReceivedFromSupplierIdOrderByCreatedAtDesc(UUID buyerId, UUID supplierId);

    List<ReplacementRequest> findByPurchaseOrderId(UUID purchaseOrderId);
}
