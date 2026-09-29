package com.exceptionpro.repository;

import com.exceptionpro.entity.Comment;
import com.exceptionpro.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {
    List<Comment> findByPostAndParentIsNullOrderByDateCreatedAsc(Post post);
}
