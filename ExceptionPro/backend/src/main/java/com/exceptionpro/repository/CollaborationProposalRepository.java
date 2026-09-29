package com.exceptionpro.repository;

import com.exceptionpro.entity.CollaborationProposal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CollaborationProposalRepository extends JpaRepository<CollaborationProposal, UUID> {
    List<CollaborationProposal> findByCollaborationRequisitionIdOrderByCreatedAtDesc(UUID collaborationRequisitionId);
    List<CollaborationProposal> findByCollaborationRequisitionIdAndSupplierId(UUID collaborationRequisitionId, UUID supplierId);
}
