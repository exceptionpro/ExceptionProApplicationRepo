package com.exceptionpro.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.exceptionpro.entity.PurchaseReceipt;

@Repository
public interface PurchaseReceiptRepository extends JpaRepository<PurchaseReceipt, UUID> {

    List<PurchaseReceipt> findByBuyerIdOrderByCreatedAtDesc(UUID buyerId);

    List<PurchaseReceipt> findByReceivedFromSupplierIdOrderByCreatedAtDesc(UUID supplierId);

    List<PurchaseReceipt> findByBuyerIdOrReceivedFromSupplierIdOrderByCreatedAtDesc(UUID buyerId, UUID supplierId);

    boolean existsByReceiptNoAndBuyerId(String receiptNo, UUID buyerId);
}
