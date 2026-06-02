package com.uniflow.document.repository;

import com.uniflow.document.entity.DocumentWorkflow;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Reactive repository for DocumentWorkflow entity
 *
 * <p>Provides reactive database operations for document workflow management.
 * Handles verification, review, and approval processes with efficient querying.
 *
 * <p>Key Features:
 * - Reactive R2DBC operations
 * - Student and application-specific queries
 * - Workflow status filtering
 * - Version control support
 * - Performance optimized queries
 */
@Repository
public interface DocumentWorkflowRepository extends R2dbcRepository<DocumentWorkflow, UUID> {

    /**
     * Find workflow records by student ID
     */
    @Query("SELECT * FROM document_workflow WHERE student_id = :studentId ORDER BY created_at DESC")
    Flux<DocumentWorkflow> findByStudentId(@Param("studentId") Long studentId);

    /**
     * Find current version workflow records by student ID
     */
    @Query("SELECT * FROM document_workflow WHERE student_id = :studentId AND is_current_version = true ORDER BY created_at DESC")
    Flux<DocumentWorkflow> findByStudentIdAndIsCurrentVersionTrue(@Param("studentId") Long studentId);

    /**
     * Find workflow records by upload ID
     */
    @Query("SELECT * FROM document_workflow WHERE upload_id = :uploadId ORDER BY created_at DESC")
    Flux<DocumentWorkflow> findByUploadId(@Param("uploadId") UUID uploadId);

    /**
     * Find workflow records by application ID
     */
    @Query("SELECT * FROM document_workflow WHERE application_id = :applicationId ORDER BY created_at DESC")
    Flux<DocumentWorkflow> findByApplicationId(@Param("applicationId") UUID applicationId);

    /**
     * Find workflow records by application ID and current version
     */
    @Query("SELECT * FROM document_workflow WHERE application_id = :applicationId AND is_current_version = true ORDER BY created_at DESC")
    Flux<DocumentWorkflow> findByApplicationIdAndIsCurrentVersionTrue(@Param("applicationId") UUID applicationId);

    /**
     * Find workflow records by verification status
     */
    @Query("SELECT * FROM document_workflow WHERE verification_status = :status ORDER BY created_at DESC")
    Flux<DocumentWorkflow> findByVerificationStatus(@Param("status") String verificationStatus);

    /**
     * Find documents pending review (global — for SuperAdmin use only)
     */
    @Query("SELECT * FROM document_workflow WHERE verification_status = 'PENDING' AND review_status = 'AWAITING_REVIEW' ORDER BY created_at ASC")
    Flux<DocumentWorkflow> findDocumentsPendingReview();

    /**
     * Find documents pending review scoped to admin's assigned students.
     * Only returns documents from students who have at least one application assigned to this admin.
     */
    @Query("""
        SELECT dw.* FROM document_workflow dw
        WHERE dw.verification_status = 'PENDING'
          AND dw.review_status = 'AWAITING_REVIEW'
          AND dw.student_id IN (
              SELECT DISTINCT a.student_id
              FROM applications a
              WHERE a.assigned_admin_id = :adminId
                AND a.is_active = true
          )
        ORDER BY dw.created_at ASC
        """)
    Flux<DocumentWorkflow> findDocumentsPendingReviewForAdmin(@Param("adminId") Long adminId);

    /**
     * Find workflow records by reviewer
     */
    @Query("SELECT * FROM document_workflow WHERE reviewed_by = :reviewerId ORDER BY reviewed_at DESC")
    Flux<DocumentWorkflow> findByReviewedBy(@Param("reviewerId") Long reviewedBy);

    /**
     * Find workflow records by reviewer and student
     */
    @Query("SELECT * FROM document_workflow WHERE reviewed_by = :reviewerId AND student_id = :studentId ORDER BY reviewed_at DESC")
    Flux<DocumentWorkflow> findByReviewedByAndStudentId(@Param("reviewerId") Long reviewedBy, @Param("studentId") Long studentId);

    /**
     * Find workflow records by document type
     */
    @Query("SELECT * FROM document_workflow WHERE document_type = :documentType ORDER BY created_at DESC")
    Flux<DocumentWorkflow> findByDocumentType(@Param("documentType") String documentType);

    /**
     * Find workflow records by student and document type
     */
    @Query("SELECT * FROM document_workflow WHERE student_id = :studentId AND document_type = :documentType ORDER BY created_at DESC")
    Flux<DocumentWorkflow> findByStudentIdAndDocumentType(
        @Param("studentId") Long studentId,
        @Param("documentType") String documentType
    );

    /**
     * Find current version by student and document type
     */
    @Query("SELECT * FROM document_workflow WHERE student_id = :studentId AND document_type = :documentType AND is_current_version = true ORDER BY created_at DESC LIMIT 1")
    Mono<DocumentWorkflow> findCurrentVersionByStudentIdAndDocumentType(
        @Param("studentId") Long studentId,
        @Param("documentType") String documentType
    );

    /**
     * Get latest version number for document type
     */
    @Query("SELECT COALESCE(MAX(version), 0) FROM document_workflow WHERE student_id = :studentId AND document_type = :documentType AND application_id = :applicationId")
    Mono<Integer> getLatestVersionNumber(
        @Param("studentId") Long studentId,
        @Param("documentType") String documentType,
        @Param("applicationId") UUID applicationId
    );

    /**
     * Mark old versions as not current
     */
    @Query("UPDATE document_workflow SET is_current_version = false, updated_at = NOW() WHERE student_id = :studentId AND document_type = :documentType AND application_id = :applicationId AND is_current_version = true")
    Mono<Integer> markOldVersionsAsNotCurrent(
        @Param("studentId") Long studentId,
        @Param("documentType") String documentType,
        @Param("applicationId") UUID applicationId
    );

    /**
     * Count workflow records by verification status
     */
    @Query("SELECT COUNT(*) FROM document_workflow WHERE verification_status = :status")
    Mono<Long> countByVerificationStatus(@Param("status") String verificationStatus);

    /**
     * Count workflow records by student and verification status
     */
    @Query("SELECT COUNT(*) FROM document_workflow WHERE student_id = :studentId AND verification_status = :status")
    Mono<Long> countByStudentIdAndVerificationStatus(
        @Param("studentId") Long studentId,
        @Param("status") String verificationStatus
    );

    /**
     * Find required documents for application
     */
    @Query("SELECT * FROM document_workflow WHERE application_id = :applicationId AND is_required = true ORDER BY created_at DESC")
    Flux<DocumentWorkflow> findRequiredDocumentsByApplicationId(@Param("applicationId") UUID applicationId);

    /**
     * Find overdue documents
     */
    @Query("SELECT * FROM document_workflow WHERE submission_deadline < NOW() AND verification_status != 'VERIFIED' ORDER BY submission_deadline ASC")
    Flux<DocumentWorkflow> findOverdueDocuments();

    /**
     * Find workflow records by workflow stage
     */
    @Query("SELECT * FROM document_workflow WHERE workflow_stage = :stage ORDER BY created_at DESC")
    Flux<DocumentWorkflow> findByWorkflowStage(@Param("stage") String workflowStage);

    /**
     * Find workflow records by task ID
     */
    @Query("SELECT * FROM document_workflow WHERE task_id = :taskId ORDER BY created_at DESC")
    Flux<DocumentWorkflow> findByTaskId(@Param("taskId") String taskId);

    /**
     * Check if all required documents are verified for application
     */
    @Query("SELECT NOT EXISTS(SELECT 1 FROM document_workflow WHERE application_id = :applicationId AND is_required = true AND verification_status != 'VERIFIED')")
    Mono<Boolean> areAllRequiredDocumentsVerified(@Param("applicationId") UUID applicationId);

    /**
     * Get document summary by category for student
     */
    @Query("SELECT document_category, COUNT(*) as total, SUM(CASE WHEN verification_status = 'VERIFIED' THEN 1 ELSE 0 END) as verified FROM document_workflow WHERE student_id = :studentId AND is_current_version = true GROUP BY document_category")
    Flux<Object[]> getDocumentSummaryByCategory(@Param("studentId") Long studentId);

    /**
     * Find documents by category
     */
    @Query("SELECT * FROM document_workflow WHERE document_category = :category ORDER BY created_at DESC")
    Flux<DocumentWorkflow> findByDocumentCategory(@Param("category") String documentCategory);

    /**
     * Find workflow records within date range
     */
    @Query("SELECT * FROM document_workflow WHERE created_at >= :startDate AND created_at <= :endDate ORDER BY created_at DESC")
    Flux<DocumentWorkflow> findByCreatedAtBetween(
        @Param("startDate") java.time.LocalDateTime startDate,
        @Param("endDate") java.time.LocalDateTime endDate
    );
}
