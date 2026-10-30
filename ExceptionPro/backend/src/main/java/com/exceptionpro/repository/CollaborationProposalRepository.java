package com.exceptionpro.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.exceptionpro.entity.CollaborationProposal;

@Repository
public interface CollaborationProposalRepository extends JpaRepository<CollaborationProposal, UUID> {
    List<CollaborationProposal> findByCollaborationRequisitionIdOrderByCreatedAtDesc(UUID collaborationRequisitionId);
    List<CollaborationProposal> findByCollaborationRequisitionIdAndSupplierId(UUID collaborationRequisitionId, UUID supplierId);
    List<CollaborationProposal> findBySupplierIdOrderByCreatedAtDesc(UUID supplierId);
}
