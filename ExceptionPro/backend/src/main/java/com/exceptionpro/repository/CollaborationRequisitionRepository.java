package com.exceptionpro.repository;

import com.exceptionpro.entity.CollaborationRequisition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CollaborationRequisitionRepository extends JpaRepository<CollaborationRequisition, UUID> {
    List<CollaborationRequisition> findByBuyerIdOrderByCreatedAtDesc(UUID buyerId);
    List<CollaborationRequisition> findDistinctBySuppliersIdOrderByCreatedAtDesc(UUID supplierId);
}
