package com.exceptionpro.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    private final Path uploadDir = Paths.get("uploads");

    public FileUploadController() {
        try {
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize upload folder!", e);
        }
    }

    @PostMapping
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "File is empty"));
        }

        try {
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            }

            boolean isImage = extension.equals(".jpg") || extension.equals(".jpeg") || 
                              extension.equals(".png") || extension.equals(".webp");
            boolean isVideo = extension.equals(".mp4") || extension.equals(".mov") || 
                              extension.equals(".avi") || extension.equals(".webm");
            boolean isDocument = extension.equals(".pdf") || extension.equals(".doc") || 
                                 extension.equals(".docx") || extension.equals(".xls") || 
                                 extension.equals(".xlsx") || extension.equals(".ppt") || 
                                 extension.equals(".pptx");

            if (!isImage && !isVideo && !isDocument) {
                return ResponseEntity.badRequest().body(Map.of("message", "Unsupported file format. Only JPG, JPEG, PNG, WEBP images, MP4, MOV, AVI, WEBM videos, and PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX documents are supported."));
            }

            if (isImage) {
                long maxSizeInBytes = 20L * 1024 * 1024;
                if (file.getSize() > maxSizeInBytes) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Image size exceeds the maximum limit of 20 MB."));
                }
            } else if (isVideo) {
                long maxSizeInBytes = 200L * 1024 * 1024;
                if (file.getSize() > maxSizeInBytes) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Video size exceeds the maximum limit of 200 MB."));
                }
            } else {
                long maxSizeInBytes = 25L * 1024 * 1024;
                if (file.getSize() > maxSizeInBytes) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Document size exceeds the maximum limit of 25 MB."));
                }
            }

            String filename = UUID.randomUUID().toString() + extension;
            Path filePath = uploadDir.resolve(filename);
            
            // Write file
            Files.copy(file.getInputStream(), filePath);

            // Construct file URL
            String fileUrl = "/uploads/" + filename;
            return ResponseEntity.ok(Map.of("fileUrl", fileUrl, "filename", originalFilename));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Failed to upload file: " + e.getMessage()));
        }
    }
}
