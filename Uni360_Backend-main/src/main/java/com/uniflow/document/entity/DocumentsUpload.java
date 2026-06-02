package com.uniflow.document.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * DocumentsUpload Entity - Simple Universal Upload Tracking
 *
 * <p>This entity tracks all file uploads across the system regardless of user type
 * or purpose. It provides a simple, unified way to track who uploaded what, when,
 * and where it's stored.
 *
 * <p>Key Features:
 * - Universal upload tracking for all user types
 * - S3 file URL storage
 * - Upload purpose categorization
 * - Soft delete support
 * - Reactive R2DBC compatible
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("documents_upload")
public class DocumentsUpload {

    @Id
    @Column("id")
    private UUID id;

    /** User ID from JWT token - who uploaded this file */
    @Column("uploaded_by")
    @JsonProperty("uploaded_by")
    private Long uploadedBy;

    /** User type auto-detected from JWT token */
    @Column("user_type")
    @JsonProperty("user_type")
    private String userType; // STUDENT, ADMIN, SUPER_ADMIN

    /** Original filename as uploaded by user */
    @Column("original_filename")
    @JsonProperty("original_filename")
    private String originalFilename;

    /** S3 URL where file is stored */
    @Column("file_url")
    @JsonProperty("file_url")
    private String fileUrl;

    /** File size in bytes */
    @Column("file_size")
    @JsonProperty("file_size")
    private Long fileSize;

    /** File type/extension */
    @Column("file_type")
    @JsonProperty("file_type")
    private String fileType; // PDF, JPG, PNG, etc.

    /** Upload purpose for categorization */
    @Column("upload_purpose")
    @JsonProperty("upload_purpose")
    private String uploadPurpose; // PROFILE, APPLICATION, GENERAL, RECEIPT, etc.

    /** Document type for categorization — PASSPORT, TRANSCRIPT, CV, SOP, etc. */
    @Column("document_type")
    @JsonProperty("document_type")
    private String documentType;

    /** Optional description provided by user */
    @Column("description")
    private String description;

    /** Soft delete flag */
    @Column("is_active")
    @JsonProperty("is_active")
    @Builder.Default
    private Boolean isActive = true;

    /** When the upload was created */
    @CreatedDate
    @Column("created_at")
    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    /** When the upload was last modified */
    @LastModifiedDate
    @Column("updated_at")
    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;

    /**
     * Check if this is an S3 file
     */
    public boolean isS3File() {
        return fileUrl != null && fileUrl.contains("amazonaws.com");
    }

    /**
     * Get formatted file size
     */
    public String getFormattedFileSize() {
        if (fileSize == null) return "Unknown";

        if (fileSize < 1024) {
            return fileSize + " B";
        } else if (fileSize < 1024 * 1024) {
            return String.format("%.1f KB", fileSize / 1024.0);
        } else {
            return String.format("%.1f MB", fileSize / (1024.0 * 1024.0));
        }
    }

    /**
     * Check if file type is image
     */
    public boolean isImage() {
        if (fileType == null) return false;
        String type = fileType.toLowerCase();
        return type.equals("jpg") || type.equals("jpeg") || type.equals("png") || type.equals("gif");
    }

    /**
     * Check if file type is PDF
     */
    public boolean isPdf() {
        return "pdf".equalsIgnoreCase(fileType);
    }

    /**
     * Soft delete this upload
     */
    public void softDelete() {
        this.isActive = false;
    }

    /**
     * Restore soft deleted upload
     */
    public void restore() {
        this.isActive = true;
    }
}
