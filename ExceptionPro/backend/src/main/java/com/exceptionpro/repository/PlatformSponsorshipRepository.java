package com.exceptionpro.repository;

import com.exceptionpro.entity.PlatformSponsorship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PlatformSponsorshipRepository extends JpaRepository<PlatformSponsorship, UUID> {

    List<PlatformSponsorship> findAllByOrderByCreatedAtDesc();

    List<PlatformSponsorship> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
