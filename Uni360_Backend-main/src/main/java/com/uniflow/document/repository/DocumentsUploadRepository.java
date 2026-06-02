package com.uniflow.document.repository;

import com.uniflow.document.entity.DocumentsUpload;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Reactive repository for DocumentsUpload entity
 *
 * <p>Provides reactive database operations for universal document upload tracking.
 * Supports all user types and upload purposes with efficient querying.
 *
 * <p>Key Features:
 * - Reactive R2DBC operations
 * - User-specific document queries
 * - Upload purpose filtering
 * - Soft delete support
 * - Performance optimized queries
 */
@Repository
public interface DocumentsUploadRepository extends R2dbcRepository<DocumentsUpload, UUID> {

    /**
     * Find all active uploads by user
     */
    @Query("SELECT * FROM documents_upload WHERE uploaded_by = :uploadedBy AND is_active = true ORDER BY created_at DESC")
    Flux<DocumentsUpload> findByUploadedByAndIsActiveTrue(@Param("uploadedBy") Long uploadedBy);

    /**
     * Find all uploads by user (including inactive)
     */
    @Query("SELECT * FROM documents_upload WHERE uploaded_by = :uploadedBy ORDER BY created_at DESC")
    Flux<DocumentsUpload> findByUploadedBy(@Param("uploadedBy") Long uploadedBy);

    /**
     * Find uploads by user and purpose
     */
    @Query("SELECT * FROM documents_upload WHERE uploaded_by = :uploadedBy AND upload_purpose = :purpose AND is_active = true ORDER BY created_at DESC")
    Flux<DocumentsUpload> findByUploadedByAndUploadPurposeAndIsActiveTrue(
        @Param("uploadedBy") Long uploadedBy,
        @Param("purpose") String uploadPurpose
    );

    /**
     * Find uploads by user type
     */
    @Query("SELECT * FROM documents_upload WHERE user_type = :userType AND is_active = true ORDER BY created_at DESC")
    Flux<DocumentsUpload> findByUserTypeAndIsActiveTrue(@Param("userType") String userType);

    /**
     * Find uploads by upload purpose
     */
    @Query("SELECT * FROM documents_upload WHERE upload_purpose = :purpose AND is_active = true ORDER BY created_at DESC")
    Flux<DocumentsUpload> findByUploadPurposeAndIsActiveTrue(@Param("purpose") String uploadPurpose);

    /**
     * Count uploads by user
     */
    @Query("SELECT COUNT(*) FROM documents_upload WHERE uploaded_by = :uploadedBy AND is_active = true")
    Mono<Long> countByUploadedByAndIsActiveTrue(@Param("uploadedBy") Long uploadedBy);

    /**
     * Count uploads by user and purpose
     */
    @Query("SELECT COUNT(*) FROM documents_upload WHERE uploaded_by = :uploadedBy AND upload_purpose = :purpose AND is_active = true")
    Mono<Long> countByUploadedByAndUploadPurposeAndIsActiveTrue(
        @Param("uploadedBy") Long uploadedBy,
        @Param("purpose") String uploadPurpose
    );

    /**
     * Find recent uploads by user (last N days)
     */
    @Query("SELECT * FROM documents_upload WHERE uploaded_by = :uploadedBy AND is_active = true AND created_at >= NOW() - INTERVAL ':days days' ORDER BY created_at DESC")
    Flux<DocumentsUpload> findRecentUploadsByUser(
        @Param("uploadedBy") Long uploadedBy,
        @Param("days") int days
    );

    /**
     * Find uploads by file type
     */
    @Query("SELECT * FROM documents_upload WHERE uploaded_by = :uploadedBy AND file_type = :fileType AND is_active = true ORDER BY created_at DESC")
    Flux<DocumentsUpload> findByUploadedByAndFileTypeAndIsActiveTrue(
        @Param("uploadedBy") Long uploadedBy,
        @Param("fileType") String fileType
    );

    /**
     * Find large files above size threshold
     */
    @Query("SELECT * FROM documents_upload WHERE uploaded_by = :uploadedBy AND file_size > :sizeThreshold AND is_active = true ORDER BY file_size DESC")
    Flux<DocumentsUpload> findLargeFilesByUser(
        @Param("uploadedBy") Long uploadedBy,
        @Param("sizeThreshold") Long sizeThreshold
    );

    /**
     * Soft delete upload
     */
    @Query("UPDATE documents_upload SET is_active = false, updated_at = NOW() WHERE id = :id")
    Mono<Integer> softDeleteById(@Param("id") UUID id);

    /**
     * Restore soft deleted upload
     */
    @Query("UPDATE documents_upload SET is_active = true, updated_at = NOW() WHERE id = :id")
    Mono<Integer> restoreById(@Param("id") UUID id);

    /**
     * Find all active uploads
     */
    @Query("SELECT * FROM documents_upload WHERE is_active = true ORDER BY created_at DESC")
    Flux<DocumentsUpload> findAllActive();

    /**
     * Find uploads by file URL pattern (for S3 files)
     */
    @Query("SELECT * FROM documents_upload WHERE file_url LIKE :urlPattern AND is_active = true ORDER BY created_at DESC")
    Flux<DocumentsUpload> findByFileUrlContaining(@Param("urlPattern") String urlPattern);

    /**
     * Get total file size by user
     */
    @Query("SELECT COALESCE(SUM(file_size), 0) FROM documents_upload WHERE uploaded_by = :uploadedBy AND is_active = true")
    Mono<Long> getTotalFileSizeByUser(@Param("uploadedBy") Long uploadedBy);

    /**
     * Check if user has uploads
     */
    @Query("SELECT EXISTS(SELECT 1 FROM documents_upload WHERE uploaded_by = :uploadedBy AND is_active = true)")
    Mono<Boolean> existsByUploadedByAndIsActiveTrue(@Param("uploadedBy") Long uploadedBy);
}
