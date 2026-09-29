package com.exceptionpro.repository;

import com.exceptionpro.entity.Reconciliation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReconciliationRepository extends JpaRepository<Reconciliation, UUID> {
    List<Reconciliation> findByBuyerIdOrderByCreatedAtDesc(UUID buyerId);
    Optional<Reconciliation> findByReconciliationNumber(String reconciliationNumber);
    Optional<Reconciliation> findByRequisitionId(UUID requisitionId);
    boolean existsByReconciliationNumber(String reconciliationNumber);
}
