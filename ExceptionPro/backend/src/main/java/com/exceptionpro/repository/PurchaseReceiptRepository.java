package com.exceptionpro.repository;

import com.exceptionpro.entity.PurchaseReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PurchaseReceiptRepository extends JpaRepository<PurchaseReceipt, UUID> {

    List<PurchaseReceipt> findByBuyerIdOrderByCreatedAtDesc(UUID buyerId);

    boolean existsByReceiptNoAndBuyerId(String receiptNo, UUID buyerId);
}
