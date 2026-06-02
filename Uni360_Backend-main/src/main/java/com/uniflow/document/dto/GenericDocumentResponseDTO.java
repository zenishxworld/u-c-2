package com.uniflow.document.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * GenericDocumentResponseDTO - Response DTOs for Generic Document Operations
 *
 * <p>This DTO handles outgoing responses for universal document operations.
 * It provides structured responses for upload, retrieval, and management operations.
 *
 * <p>Key Features:
 * - Universal document operation responses
 * - Upload success/failure responses
 * - Document listing and search results
 * - User statistics and analytics
 * - Multi-user type support
 *
 * @author UniFLow Development Team
 */
public class GenericDocumentResponseDTO {

    /**
     * DTO for document upload response
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Response for document upload operation")
    public static class UploadDocumentResponse {

        @Schema(description = "Operation success status", example = "true")
        private Boolean success;

        @Schema(description = "Operation message", example = "Document uploaded successfully")
        private String message;

        @Schema(description = "Uploaded document ID", example = "550e8400-e29b-41d4-a716-446655440000")
        @JsonProperty("upload_id")
        private UUID uploadId;

        @Schema(description = "S3 file URL", example = "https://uniflow-documents-dev.s3.us-east-1.amazonaws.com/documents/1_APPLICATION_1704067200_abcd1234.pdf")
        @JsonProperty("file_url")
        private String fileUrl;

        @Schema(description = "Original filename", example = "passport.pdf")
        @JsonProperty("file_name")
        private String fileName;

        @Schema(description = "File size in bytes", example = "1048576")
        @JsonProperty("file_size")
        private Long fileSize;

        @Schema(description = "File type", example = "PDF")
        @JsonProperty("file_type")
        private String fileType;

        @Schema(description = "Upload purpose", example = "APPLICATION")
        @JsonProperty("upload_purpose")
        private String uploadPurpose;

        @Schema(description = "User ID who uploaded", example = "3")
        @JsonProperty("uploaded_by")
        private Long uploadedBy;

        @Schema(description = "User type", example = "ADMIN")
        @JsonProperty("user_type")
        private String userType;

        @Schema(description = "Presigned view URL", example = "https://uniflow-documents-dev.s3.us-east-1.amazonaws.com/...?X-Amz-Algorithm=...")
        @JsonProperty("view_url")
        private String viewUrl;

        @Schema(description = "View URL expiration in seconds", example = "3600")
        @JsonProperty("expires_in")
        private Long expiresIn;

        @Schema(description = "Upload timestamp", example = "2025-01-12T12:04:53")
        @JsonProperty("uploaded_at")
        private LocalDateTime uploadedAt;

        @Schema(description = "Error details (if any)")
        private List<String> errors;
    }

    /**
     * DTO for document details response
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Document details response")
    public static class DocumentDetailsResponse {

        @Schema(description = "Document upload ID", example = "550e8400-e29b-41d4-a716-446655440000")
        private UUID id;

        @Schema(description = "User ID who uploaded", example = "3")
        @JsonProperty("uploaded_by")
        private Long uploadedBy;

        @Schema(description = "User type", example = "STUDENT")
        @JsonProperty("user_type")
        private String userType;

        @Schema(description = "Original filename", example = "transcript.pdf")
        @JsonProperty("original_filename")
        private String originalFilename;

        @Schema(description = "S3 file URL", example = "https://uniflow-documents-dev.s3.us-east-1.amazonaws.com/documents/1_APPLICATION_1704067200_abcd1234.pdf")
        @JsonProperty("file_url")
        private String fileUrl;

        @Schema(description = "File size in bytes", example = "2097152")
        @JsonProperty("file_size")
        private Long fileSize;

        @Schema(description = "Formatted file size", example = "2.0 MB")
        @JsonProperty("formatted_file_size")
        private String formattedFileSize;

        @Schema(description = "File type", example = "PDF")
        @JsonProperty("file_type")
        private String fileType;

        @Schema(description = "Upload purpose", example = "APPLICATION")
        @JsonProperty("upload_purpose")
        private String uploadPurpose;

        @Schema(description = "Document description", example = "Academic transcript for university application")
        private String description;

        @Schema(description = "Is document active", example = "true")
        @JsonProperty("is_active")
        private Boolean isActive;

        @Schema(description = "Upload timestamp", example = "2025-01-12T12:04:53")
        @JsonProperty("created_at")
        private LocalDateTime createdAt;

        @Schema(description = "Last update timestamp", example = "2025-01-12T12:04:53")
        @JsonProperty("updated_at")
        private LocalDateTime updatedAt;

        @Schema(description = "Document type flags")
        @JsonProperty("type_flags")
        private DocumentTypeFlags typeFlags;

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        @Schema(description = "Document type flags")
        public static class DocumentTypeFlags {

            @Schema(description = "Is image file", example = "false")
            @JsonProperty("is_image")
            private Boolean isImage;

            @Schema(description = "Is PDF file", example = "true")
            @JsonProperty("is_pdf")
            private Boolean isPdf;

            @Schema(description = "Is S3 file", example = "true")
            @JsonProperty("is_s3_file")
            private Boolean isS3File;
        }
    }

    /**
     * DTO for user documents list response
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "User documents list response")
    public static class MyDocumentsResponse {

        @Schema(description = "Operation success status", example = "true")
        private Boolean success;

        @Schema(description = "List of user documents")
        private List<DocumentDetailsResponse> documents;

        @Schema(description = "Upload statistics")
        private UploadStatistics statistics;

        @Schema(description = "Total count of documents", example = "15")
        private Integer count;

        @Schema(description = "Applied filters")
        private SearchFilters filters;

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        @Schema(description = "Search filters applied")
        public static class SearchFilters {

            @Schema(description = "File type filter", example = "PDF")
            @JsonProperty("file_type")
            private String fileType;

            @Schema(description = "Upload purpose filter", example = "APPLICATION")
            @JsonProperty("upload_purpose")
            private String uploadPurpose;

            @Schema(description = "Search term", example = "passport")
            @JsonProperty("search_term")
            private String searchTerm;
        }
    }

    /**
     * DTO for upload statistics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "User upload statistics")
    public static class UploadStatistics {

        @Schema(description = "Total number of uploads", example = "25")
        @JsonProperty("total_uploads")
        private Long totalUploads;

        @Schema(description = "Total file size in bytes", example = "52428800")
        @JsonProperty("total_file_size")
        private Long totalFileSize;

        @Schema(description = "Formatted total file size", example = "50.0 MB")
        @JsonProperty("formatted_total_file_size")
        private String formattedTotalFileSize;

        @Schema(description = "Number of application documents", example = "18")
        @JsonProperty("application_documents")
        private Long applicationDocuments;

        @Schema(description = "Number of profile documents", example = "5")
        @JsonProperty("profile_documents")
        private Long profileDocuments;

        @Schema(description = "Number of general documents", example = "2")
        @JsonProperty("general_documents")
        private Long generalDocuments;
    }

    /**
     * DTO for view URL response
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Document view URL response")
    public static class ViewUrlResponse {

        @Schema(description = "Operation success status", example = "true")
        private Boolean success;

        @Schema(description = "Operation message", example = "View URL generated successfully")
        private String message;

        @Schema(description = "Presigned view URL", example = "https://uniflow-documents-dev.s3.us-east-1.amazonaws.com/...?X-Amz-Algorithm=...")
        @JsonProperty("view_url")
        private String viewUrl;

        @Schema(description = "URL expiration in seconds", example = "3600")
        @JsonProperty("expires_in")
        private Long expiresIn;

        @Schema(description = "URL generation timestamp", example = "2025-01-12T12:04:53")
        @JsonProperty("generated_at")
        private LocalDateTime generatedAt;
    }

    /**
     * DTO for delete operation response
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Document delete operation response")
    public static class DeleteDocumentResponse {

        @Schema(description = "Operation success status", example = "true")
        private Boolean success;

        @Schema(description = "Operation message", example = "Document deleted successfully")
        private String message;

        @Schema(description = "Deleted document ID", example = "550e8400-e29b-41d4-a716-446655440000")
        @JsonProperty("document_id")
        private UUID documentId;

        @Schema(description = "Deletion timestamp", example = "2025-01-12T12:04:53")
        @JsonProperty("deleted_at")
        private LocalDateTime deletedAt;
    }

    /**
     * DTO for S3 health check response
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "S3 health check response")
    public static class S3HealthResponse {

        @Schema(description = "Operation success status", example = "true")
        private Boolean success;

        @Schema(description = "S3 health status", example = "true")
        @JsonProperty("s3_health")
        private Boolean s3Health;

        @Schema(description = "Health check message", example = "S3 is accessible")
        private String message;

        @Schema(description = "Health check timestamp", example = "2025-01-12T12:04:53")
        private String timestamp;
    }

    /**
     * DTO for error response
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Error response")
    public static class ErrorResponse {

        @Schema(description = "Operation success status", example = "false")
        private Boolean success;

        @Schema(description = "Error message", example = "Failed to upload document")
        private String message;

        @Schema(description = "Detailed error information", example = "File size exceeds maximum allowed")
        private String error;

        @Schema(description = "Error code", example = "FILE_TOO_LARGE")
        @JsonProperty("error_code")
        private String errorCode;

        @Schema(description = "Error timestamp", example = "2025-01-12T12:04:53")
        private String timestamp;
    }
}
