package com.exceptionpro.repository;

import com.exceptionpro.entity.PostReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface PostReportRepository extends JpaRepository<PostReport, UUID> {
    boolean existsByPostIdAndUserEmail(UUID postId, String email);
}
