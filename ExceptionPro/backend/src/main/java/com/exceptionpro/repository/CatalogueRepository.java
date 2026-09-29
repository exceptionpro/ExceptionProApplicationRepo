package com.exceptionpro.repository;

import com.exceptionpro.entity.Catalogue;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CatalogueRepository extends JpaRepository<Catalogue, UUID> {
    List<Catalogue> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
