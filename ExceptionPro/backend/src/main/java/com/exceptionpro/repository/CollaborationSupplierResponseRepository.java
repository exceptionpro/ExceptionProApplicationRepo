package com.exceptionpro.repository;

import com.exceptionpro.entity.CollaborationSupplierResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CollaborationSupplierResponseRepository extends JpaRepository<CollaborationSupplierResponse, UUID> {
    List<CollaborationSupplierResponse> findByCollaborationRequisitionId(UUID collaborationRequisitionId);
    List<CollaborationSupplierResponse> findByCollaborationRequisitionIdAndStatus(UUID collaborationRequisitionId, String status);
    Optional<CollaborationSupplierResponse> findByCollaborationRequisitionIdAndSupplierId(UUID collaborationRequisitionId, UUID supplierId);
}
