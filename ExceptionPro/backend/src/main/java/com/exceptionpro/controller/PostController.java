package com.exceptionpro.controller;

import com.exceptionpro.dto.PostRequest;
import com.exceptionpro.dto.PostResponse;
import com.exceptionpro.service.PostService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public ResponseEntity<List<PostResponse>> getFeed(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(postService.getFeed(principal.getName()));
    }

    @PostMapping
    public ResponseEntity<?> createPost(Principal principal, @RequestBody PostRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            return ResponseEntity.ok(postService.createPost(request, principal.getName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(Principal principal, @PathVariable UUID id) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            postService.deletePost(id, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Post deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editPost(Principal principal, @PathVariable UUID id, @RequestBody PostRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            return ResponseEntity.ok(postService.editPost(id, request, principal.getName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> likePost(Principal principal, @PathVariable UUID id) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            postService.likePost(id, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Post like toggled"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/comment")
    public ResponseEntity<?> addComment(Principal principal, @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        String text = request.get("commentText");
        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Comment text cannot be empty"));
        }
        UUID parentId = null;
        if (request.get("parentId") != null && !request.get("parentId").isBlank()) {
            try {
                parentId = UUID.fromString(request.get("parentId"));
            } catch (IllegalArgumentException e) {
                // Ignore invalid UUID format
            }
        }
        try {
            postService.addComment(id, text, parentId, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Comment added successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<?> recordView(@PathVariable UUID id) {
        postService.recordView(id);
        return ResponseEntity.ok(Map.of("message", "View recorded"));
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<?> recordShare(@PathVariable UUID id) {
        postService.recordShare(id);
        return ResponseEntity.ok(Map.of("message", "Share recorded"));
    }

    @PostMapping("/{id}/save")
    public ResponseEntity<?> savePost(Principal principal, @PathVariable UUID id) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            boolean saved = postService.savePost(id, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Post save status updated", "saved", saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/report")
    public ResponseEntity<?> reportPost(Principal principal, @PathVariable UUID id,
            @RequestBody Map<String, String> request) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        String reason = request.get("reason");
        String comments = request.get("comments");
        if (reason == null || reason.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Report reason cannot be empty"));
        }
        try {
            postService.reportPost(id, reason, comments, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Post reported successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<?> editComment(Principal principal, @PathVariable UUID commentId,
            @RequestBody Map<String, String> request) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        String text = request.get("commentText");
        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Comment text cannot be empty"));
        }
        try {
            postService.editComment(commentId, text, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Comment edited successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(Principal principal, @PathVariable UUID commentId) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            postService.deleteComment(commentId, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Comment deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<?> likeComment(Principal principal, @PathVariable UUID commentId) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            postService.likeComment(commentId, principal.getName());
            return ResponseEntity.ok(Map.of("message", "Comment like toggled"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
