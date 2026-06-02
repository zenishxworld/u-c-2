package com.uniflow.application.repository;

import com.uniflow.application.entity.Application;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Simplified ApplicationRepository with JSONB query support (Phase 18)
 * This repository provides efficient queries for the simplified Application entity
 * using JSONB data extraction for complex filtering.
 */
@Repository
public interface ApplicationRepository
    extends R2dbcRepository<Application, UUID> {
    /**
     * Find applications by student ID
     */
    @Query(
        "SELECT * FROM applications WHERE student_id = :studentId AND is_active = true ORDER BY created_at DESC"
    )
    Flux<Application> findByStudentId(@Param("studentId") Long studentId);

    /**
     * Find applications by assigned admin ID
     */
    @Query(
        "SELECT * FROM applications WHERE assigned_admin_id = :adminId AND is_active = true ORDER BY submitted_at DESC"
    )
    Flux<Application> findByAssignedAdminId(@Param("adminId") UUID adminId);

    /**
     * Find applications by status
     */
    @Query(
        "SELECT * FROM applications WHERE status = :status AND is_active = true ORDER BY created_at DESC"
    )
    Flux<Application> findByStatus(@Param("status") String status);

    /**
     * Find urgent applications
     */
    @Query(
        "SELECT * FROM applications WHERE is_urgent = true AND is_active = true ORDER BY created_at DESC"
    )
    Flux<Application> findUrgentApplications();

    /**
     * Find applications by university ID
     */
    @Query(
        "SELECT * FROM applications WHERE university_id = :universityId AND is_active = true ORDER BY created_at DESC"
    )
    Flux<Application> findByUniversityId(
        @Param("universityId") UUID universityId
    );

    /**
     * Find applications by course ID
     */
    @Query(
        "SELECT * FROM applications WHERE course_id = :courseId AND is_active = true ORDER BY created_at DESC"
    )
    Flux<Application> findByCourseId(@Param("courseId") UUID courseId);

    /**
     * Find applications by degree level (from JSONB data)
     */
    @Query(
        "SELECT * FROM applications WHERE data->'academic'->>'degree_level' = :degreeLevel AND is_active = true ORDER BY created_at DESC"
    )
    Flux<Application> findByDegreeLevel(
        @Param("degreeLevel") String degreeLevel
    );

    /**
     * Find applications with verified documents (from JSONB data)
     */
    @Query(
        "SELECT * FROM applications WHERE (data->'documents'->>'documents_verified')::boolean = true AND is_active = true ORDER BY created_at DESC"
    )
    Flux<Application> findWithVerifiedDocuments();

    /**
     * Find applications with pending payments (from JSONB data)
     */
    @Query(
        "SELECT * FROM applications WHERE (data->'payment'->>'payment_completed')::boolean = false AND status != 'DRAFT' AND is_active = true ORDER BY created_at DESC"
    )
    Flux<Application> findPendingPayments();

    /**
     * Find applications submitted to university (from JSONB data)
     */
    @Query(
        "SELECT * FROM applications WHERE (data->'university'->>'submitted_to_university')::boolean = true AND is_active = true ORDER BY created_at DESC"
    )
    Flux<Application> findSubmittedToUniversity();

    /**
     * Find applications by workflow stage
     */
    @Query(
        "SELECT * FROM applications WHERE workflow_stage = :workflowStage AND is_active = true ORDER BY created_at DESC"
    )
    Flux<Application> findByWorkflowStage(
        @Param("workflowStage") String workflowStage
    );

    /**
     * Find applications with deadlines approaching (within specified days)
     */
    @Query(
        "SELECT * FROM applications WHERE deadline IS NOT NULL AND deadline BETWEEN NOW() AND NOW() + INTERVAL ':days days' AND is_active = true ORDER BY deadline ASC"
    )
    Flux<Application> findWithApproachingDeadlines(@Param("days") int days);

    /**
     * Find overdue applications
     */
    @Query(
        "SELECT * FROM applications WHERE deadline IS NOT NULL AND deadline < NOW() AND status NOT IN ('COMPLETED', 'REJECTED', 'WITHDRAWN') AND is_active = true ORDER BY deadline ASC"
    )
    Flux<Application> findOverdueApplications();

    /**
     * Find applications by priority
     */
    @Query(
        "SELECT * FROM applications WHERE priority = :priority AND is_active = true ORDER BY created_at DESC"
    )
    Flux<Application> findByPriority(@Param("priority") String priority);

    /**
     * Find applications requiring attention
     */
    @Query(
        "SELECT * FROM applications WHERE (is_urgent = true OR priority = 'HIGH' OR priority = 'URGENT') AND status IN ('SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_REQUESTED') AND is_active = true ORDER BY priority DESC, created_at ASC"
    )
    Flux<Application> findRequiringAttention();

    /**
     * Find applications by reference number
     */
    @Query(
        "SELECT * FROM applications WHERE reference_number = :referenceNumber"
    )
    Mono<Application> findByReferenceNumber(
        @Param("referenceNumber") String referenceNumber
    );

    /**
     * Find applications by student and status
     */
    @Query(
        "SELECT * FROM applications WHERE student_id = :studentId AND status = :status AND is_active = true ORDER BY created_at DESC"
    )
    Flux<Application> findByStudentIdAndStatus(
        @Param("studentId") Long studentId,
        @Param("status") String status
    );

    /**
     * Count applications by student ID
     */
    @Query(
        "SELECT COUNT(*) FROM applications WHERE student_id = :studentId AND is_active = true"
    )
    Mono<Long> countByStudentId(@Param("studentId") Long studentId);

    /**
     * Count applications by status
     */
    @Query(
        "SELECT COUNT(*) FROM applications WHERE status = :status AND is_active = true"
    )
    Mono<Long> countByStatus(@Param("status") String status);

    /**
     * Count applications by assigned admin
     */
    @Query(
        "SELECT COUNT(*) FROM applications WHERE assigned_admin_id = :adminId AND is_active = true"
    )
    Mono<Long> countByAssignedAdminId(@Param("adminId") UUID adminId);

    /**
     * Update application status
     */
    @Query(
        "UPDATE applications SET status = :status, updated_at = NOW() WHERE id = :id"
    )
    Mono<Void> updateStatus(
        @Param("id") UUID id,
        @Param("status") String status
    );

    /**
     * Update completion percentage
     */
    @Query(
        "UPDATE applications SET completion_percentage = :percentage, updated_at = NOW() WHERE id = :id"
    )
    Mono<Void> updateCompletionPercentage(
        @Param("id") UUID id,
        @Param("percentage") Integer percentage
    );

    /**
     * Assign application to admin
     */
    @Query(
        "UPDATE applications SET assigned_admin_id = :adminId, updated_at = NOW() WHERE id = :id"
    )
    Mono<Void> assignToAdmin(
        @Param("id") UUID id,
        @Param("adminId") UUID adminId
    );

    /**
     * Update workflow stage
     */
    @Query(
        "UPDATE applications SET workflow_stage = :workflowStage, updated_at = NOW() WHERE id = :id"
    )
    Mono<Void> updateWorkflowStage(
        @Param("id") UUID id,
        @Param("workflowStage") String workflowStage
    );

    /**
     * Mark application as urgent
     */
    @Query(
        "UPDATE applications SET is_urgent = :isUrgent, updated_at = NOW() WHERE id = :id"
    )
    Mono<Void> markAsUrgent(
        @Param("id") UUID id,
        @Param("isUrgent") Boolean isUrgent
    );

    /**
     * Set application deadline
     */
    @Query(
        "UPDATE applications SET deadline = :deadline, updated_at = NOW() WHERE id = :id"
    )
    Mono<Void> updateDeadline(
        @Param("id") UUID id,
        @Param("deadline") LocalDateTime deadline
    );

    /**
     * Soft delete application (mark as inactive)
     */
    @Query(
        "UPDATE applications SET is_active = false, updated_at = NOW() WHERE id = :id"
    )
    Mono<Void> softDelete(@Param("id") UUID id);

    /**
     * Find applications with complex JSONB filtering
     * This method allows for advanced filtering using JSONB queries
     */
    @Query(
        """
        SELECT * FROM applications
        WHERE is_active = true
        AND (:status IS NULL OR status = :status)
        AND (:workflowStage IS NULL OR workflow_stage = :workflowStage)
        AND (:isUrgent IS NULL OR is_urgent = :isUrgent)
        AND (:degreeLevel IS NULL OR data->'academic'->>'degree_level' = :degreeLevel)
        AND (:paymentCompleted IS NULL OR (data->'payment'->>'payment_completed')::boolean = :paymentCompleted)
        AND (:documentsVerified IS NULL OR (data->'documents'->>'documents_verified')::boolean = :documentsVerified)
        ORDER BY
            CASE WHEN :sortBy = 'created_at' THEN created_at END DESC,
            CASE WHEN :sortBy = 'deadline' THEN deadline END ASC,
            CASE WHEN :sortBy = 'priority' THEN
                CASE priority
                    WHEN 'URGENT' THEN 4
                    WHEN 'HIGH' THEN 3
                    WHEN 'NORMAL' THEN 2
                    WHEN 'LOW' THEN 1
                    ELSE 0
                END
            END DESC
        LIMIT :limit OFFSET :offset
        """
    )
    Flux<Application> findWithFilters(
        @Param("status") String status,
        @Param("workflowStage") String workflowStage,
        @Param("isUrgent") Boolean isUrgent,
        @Param("degreeLevel") String degreeLevel,
        @Param("paymentCompleted") Boolean paymentCompleted,
        @Param("documentsVerified") Boolean documentsVerified,
        @Param("sortBy") String sortBy,
        @Param("limit") int limit,
        @Param("offset") int offset
    );

    /**
     * Count applications with filters (for pagination)
     */
    @Query(
        """
        SELECT COUNT(*) FROM applications
        WHERE is_active = true
        AND (:status IS NULL OR status = :status)
        AND (:workflowStage IS NULL OR workflow_stage = :workflowStage)
        AND (:isUrgent IS NULL OR is_urgent = :isUrgent)
        AND (:degreeLevel IS NULL OR data->'academic'->>'degree_level' = :degreeLevel)
        AND (:paymentCompleted IS NULL OR (data->'payment'->>'payment_completed')::boolean = :paymentCompleted)
        AND (:documentsVerified IS NULL OR (data->'documents'->>'documents_verified')::boolean = :documentsVerified)
        """
    )
    Mono<Long> countWithFilters(
        @Param("status") String status,
        @Param("workflowStage") String workflowStage,
        @Param("isUrgent") Boolean isUrgent,
        @Param("degreeLevel") String degreeLevel,
        @Param("paymentCompleted") Boolean paymentCompleted,
        @Param("documentsVerified") Boolean documentsVerified
    );

    /**
     * Get application statistics for dashboard
     */
    @Query(
        """
        SELECT
            COUNT(*) as total_applications,
            COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_count,
            COUNT(CASE WHEN status = 'SUBMITTED' THEN 1 END) as submitted_count,
            COUNT(CASE WHEN status = 'UNDER_REVIEW' THEN 1 END) as under_review_count,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_count,
            COUNT(CASE WHEN is_urgent = true THEN 1 END) as urgent_count,
            COUNT(CASE WHEN deadline < NOW() AND status NOT IN ('COMPLETED', 'REJECTED') THEN 1 END) as overdue_count
        FROM applications
        WHERE is_active = true
        AND (:studentId IS NULL OR student_id = :studentId)
        AND (:adminId IS NULL OR assigned_admin_id = :adminId)
        """
    )
    Mono<Object> getApplicationStatistics(
        @Param("studentId") Long studentId,
        @Param("adminId") UUID adminId
    );

    // Legacy compatibility methods for existing ApplicationService

    /**
     * Legacy compatibility - find by target university ID
     */
    @Query(
        "SELECT * FROM applications WHERE university_id = :universityId AND is_active = true ORDER BY created_at DESC"
    )
    Flux<Application> findByTargetUniversityId(
        @Param("universityId") UUID universityId
    );

    /**
     * Legacy compatibility - find unassigned applications
     */
    @Query(
        "SELECT * FROM applications WHERE assigned_admin_id IS NULL AND status IN ('SUBMITTED', 'UNDER_REVIEW') AND is_active = true ORDER BY created_at ASC"
    )
    Flux<Application> findUnassigned();

    /**
     * Legacy compatibility - search by text
     */
    @Query(
        "SELECT * FROM applications WHERE (reference_number ILIKE CONCAT('%', :searchTerm, '%') OR data->'academic'->>'program_name' ILIKE CONCAT('%', :searchTerm, '%')) AND is_active = true ORDER BY created_at DESC"
    )
    Flux<Application> searchByText(@Param("searchTerm") String searchTerm);

    /**
     * Legacy compatibility - get dashboard overview
     */
    @Query(
        """
        SELECT
            COUNT(*) as total_applications,
            COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_count,
            COUNT(CASE WHEN status IN ('SUBMITTED', 'UNDER_REVIEW') THEN 1 END) as active_count,
            COUNT(CASE WHEN status IN ('COMPLETED', 'APPROVED') THEN 1 END) as completed_count,
            COUNT(CASE WHEN is_urgent = true THEN 1 END) as urgent_count,
            COUNT(CASE WHEN deadline < NOW() AND status NOT IN ('COMPLETED', 'REJECTED') THEN 1 END) as overdue_count,
            COUNT(CASE WHEN assigned_admin_id IS NULL AND status IN ('SUBMITTED', 'UNDER_REVIEW') THEN 1 END) as unassigned_count
        FROM applications
        WHERE is_active = true
        """
    )
    Mono<Object[]> getDashboardOverview();

    /**
     * Legacy compatibility - find overdue applications
     */
    @Query(
        "SELECT * FROM applications WHERE deadline < NOW() AND status NOT IN ('COMPLETED', 'REJECTED', 'WITHDRAWN') AND is_active = true ORDER BY deadline ASC"
    )
    Flux<Application> findOverdue();

    /**
     * Legacy compatibility - get recent activity
     */
    @Query(
        "SELECT * FROM applications WHERE updated_at >= NOW() - INTERVAL '24 hours' AND is_active = true ORDER BY updated_at DESC LIMIT 20"
    )
    Flux<Application> getRecentActivity();

    /**
     * Legacy compatibility - get next reference number
     */
    @Query(
        "SELECT COALESCE(MAX(CAST(SUBSTRING(reference_number FROM 8 FOR 6) AS INTEGER)), 0) + 1 " +
            "FROM applications " +
            "WHERE LENGTH(reference_number) = 13 " +
            "AND reference_number ~ '^APP[0-9]+$'"
    )
    Mono<Long> getNextReferenceNumber();

    /**
     * Find applications by student and course to check for duplicates
     */
    @Query(
        "SELECT * FROM applications WHERE student_id = :studentId AND course_id = :courseId AND is_active = true"
    )
    Flux<Application> findByStudentIdAndCourseId(
        @Param("studentId") Long studentId,
        @Param("courseId") UUID courseId
    );

    /**
     * Get distinct student IDs whose applications are assigned to a given admin (by Long userId).
     * Used to scope notification student lists to only the admin's own students.
     */
    @Query(
        "SELECT DISTINCT student_id FROM applications WHERE assigned_admin_id = :adminId AND is_active = true"
    )
    Flux<Long> findDistinctStudentIdsByAssignedAdminId(@Param("adminId") Long adminId);

    /**
     * Find the most recently claimed application for a student,
     * EXCLUDING the current application (to avoid self-referencing).
     * Returns the full Application so getAssignedAdminId() can be extracted safely.
     */
    @Query(
        "SELECT * FROM applications " +
        "WHERE student_id = :studentId " +
        "AND id != CAST(:excludeApplicationId AS uuid) " +
        "AND assigned_admin_id IS NOT NULL AND is_active = true " +
        "ORDER BY updated_at DESC LIMIT 1"
    )
    Mono<Application> findLatestAssignedApplicationForStudent(
        @Param("studentId") Long studentId,
        @Param("excludeApplicationId") String excludeApplicationId
    );

    /**
     * When an admin claims one application, lock ALL other unclaimed active apps
     * from the same student to that same admin.
     * This prevents the race condition where multiple apps are submitted before
     * anyone claims, and different admins end up owning different apps from the same student.
     */
    @Query(
        "UPDATE applications SET assigned_admin_id = :adminId, updated_at = NOW() " +
        "WHERE student_id = :studentId " +
        "AND assigned_admin_id IS NULL " +
        "AND is_active = true"
    )
    Mono<Integer> updateAssignedAdminForUnclaimedStudentApplications(
        @Param("studentId") Long studentId,
        @Param("adminId") Long adminId
    );

    /**
     * Legacy compatibility - findWithFilters with original signature
     */
    @Query(
        """
        SELECT * FROM applications
        WHERE is_active = true
        AND (:status IS NULL OR status = :status)
        AND (:priority IS NULL OR priority = :priority)
        AND (:applicationType IS NULL OR data->'academic'->>'application_type' = :applicationType)
        AND (:assignedAdminId IS NULL OR assigned_admin_id = :assignedAdminId)
        AND (:studentId IS NULL OR student_id = :studentId)
        AND (:targetUniversityId IS NULL OR university_id = :targetUniversityId)
        AND (:workflowStage IS NULL OR workflow_stage = :workflowStage)
        AND (:requiresAttention IS NULL OR (is_urgent = :requiresAttention OR priority = 'URGENT'))
        AND (:isUrgent IS NULL OR is_urgent = :isUrgent)
        AND (:isOverdue IS NULL OR (deadline < NOW() AND status NOT IN ('COMPLETED', 'REJECTED')) = :isOverdue)
        ORDER BY
            CASE WHEN :sortBy = 'priority' THEN
                CASE priority
                    WHEN 'URGENT' THEN 4
                    WHEN 'HIGH' THEN 3
                    WHEN 'NORMAL' THEN 2
                    WHEN 'LOW' THEN 1
                    ELSE 0
                END
            END DESC,
            CASE WHEN :sortBy = 'deadline' THEN deadline END ASC,
            CASE WHEN :sortBy = 'created' THEN created_at END DESC,
            CASE WHEN :sortBy = 'updated' THEN updated_at END DESC,
            updated_at DESC
        """
    )
    Flux<Application> findWithFilters(
        @Param("status") String status,
        @Param("priority") String priority,
        @Param("applicationType") String applicationType,
        @Param("assignedAdminId") UUID assignedAdminId,
        @Param("studentId") Long studentId,
        @Param("targetUniversityId") UUID targetUniversityId,
        @Param("workflowStage") String workflowStage,
        @Param("requiresAttention") Boolean requiresAttention,
        @Param("isUrgent") Boolean isUrgent,
        @Param("isOverdue") Boolean isOverdue,
        @Param("sortBy") String sortBy,
        org.springframework.data.domain.Pageable pageable
    );
}
