package com.exceptionpro.repository;

import com.exceptionpro.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {
    List<Post> findByStatusOrderByDateCreatedDesc(String status);
    List<Post> findByUserIdOrderByDateCreatedDesc(UUID userId);
    List<Post> findByUserIdInAndStatusOrderByDateCreatedDesc(Collection<UUID> userIds, String status);
}
