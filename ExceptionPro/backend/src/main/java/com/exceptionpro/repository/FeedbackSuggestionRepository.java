package com.exceptionpro.repository;

import com.exceptionpro.entity.FeedbackSuggestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FeedbackSuggestionRepository extends JpaRepository<FeedbackSuggestion, UUID> {

    List<FeedbackSuggestion> findAllByOrderByCreatedAtDesc();

    List<FeedbackSuggestion> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
