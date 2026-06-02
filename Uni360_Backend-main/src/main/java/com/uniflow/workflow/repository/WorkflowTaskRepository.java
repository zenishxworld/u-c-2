package com.uniflow.workflow.repository;

import com.uniflow.workflow.entity.Task;
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

/**
 * Enhanced Repository for Workflow Task operations
 *
 * <p>This repository provides comprehensive task management operations including:
 * - Task claiming and assignment
 * - Country and admin-specific queries
 * - Task status and workflow management
 * - Performance and analytics queries
 */
@Repository
public interface WorkflowTaskRepository extends ReactiveCrudRepository<Task, Long> {

    /**
     * Find task by unique task ID
     */
    @Query("SELECT * FROM tasks WHERE task_id = :taskId AND deleted = false")
    Mono<Task> findByTaskId(String taskId);

    /**
     * Find claimable tasks for a specific admin based on permissions and country
     * Used for Phase 19.7 - Admin Task Management APIs
     */
    @Query("""
        SELECT t.* FROM tasks t
        INNER JOIN workflow_instances wi ON t.workflow_instance_id = wi.instance_id
        WHERE t.task_status = 'CLAIMABLE'
          AND t.is_active = true
          AND t.deleted = false
          AND (t.assignee_id IS NULL OR t.assignee_id = :adminId)
          AND (:countryCode IS NULL OR t.data->>'country_code' = :countryCode)
          AND t.created_at >= :sinceDate
        ORDER BY t.priority DESC, t.created_at ASC
        """)
    Flux<Task> findClaimableTasksForAdmin(
        Long adminId,
        String countryCode,
        LocalDateTime sinceDate,
        Pageable pageable
    );

    /**
     * Find tasks claimed by specific admin with given status
     * Used for getting admin's active tasks
     */
    @Query("""
        SELECT * FROM tasks
        WHERE assignee_id = :adminId
          AND task_status = :status
          AND is_active = true
          AND deleted = false
        ORDER BY due_date ASC, priority DESC
        """)
    Flux<Task> findByClaimedByAndStatus(Long adminId, String status, Pageable pageable);

    /**
     * Find tasks by workflow instance, task type and status
     * Used for workflow progression validation
     */
    @Query("""
        SELECT * FROM tasks
        WHERE workflow_instance_id = :workflowInstanceId
          AND task_definition_key = :taskType
          AND task_status = :status
          AND deleted = false
        ORDER BY created_at DESC
        """)
    Flux<Task> findByWorkflowInstanceIdAndTaskTypeAndStatus(
        String workflowInstanceId,
        String taskType,
        String status
    );

    /**
     * Find all tasks for an application ordered by creation date
     * Used for task history and workflow tracking
     */
    @Query("""
        SELECT * FROM tasks
        WHERE application_id = :applicationId
          AND deleted = false
        ORDER BY created_at ASC
        """)
    Flux<Task> findByApplicationIdOrderByCreatedAt(Long applicationId);

    /**
     * Count active tasks assigned to a specific admin
     * Used for workload management
     */
    @Query("""
        SELECT COUNT(*) FROM tasks
        WHERE assignee_id = :adminId
          AND task_status IN ('CLAIMED', 'IN_PROGRESS')
          AND is_active = true
          AND deleted = false
        """)
    Mono<Long> countActiveTasksByAdmin(Long adminId);

    /**
     * Find tasks by application ID
     */
    @Query("SELECT * FROM tasks WHERE application_id = :applicationId AND deleted = false")
    Flux<Task> findByApplicationId(Long applicationId);

    /**
     * Find overdue tasks for SLA monitoring
     */
    @Query("""
        SELECT * FROM tasks
        WHERE due_date < :currentTime
          AND task_status IN ('CLAIMABLE', 'CLAIMED', 'IN_PROGRESS')
          AND is_active = true
          AND deleted = false
        ORDER BY due_date ASC
        """)
    Flux<Task> findOverdueTasks(LocalDateTime currentTime);

    /**
     * Find tasks nearing SLA deadline
     */
    @Query("""
        SELECT * FROM tasks
        WHERE due_date BETWEEN :currentTime AND :slaWarningTime
          AND task_status IN ('CLAIMABLE', 'CLAIMED', 'IN_PROGRESS')
          AND is_active = true
          AND deleted = false
        ORDER BY due_date ASC
        """)
    Flux<Task> findTasksNearingSLA(LocalDateTime currentTime, LocalDateTime slaWarningTime);

    /**
     * Find tasks by country code for geographic routing
     */
    @Query("""
        SELECT * FROM tasks
        WHERE data->>'country_code' = :countryCode
          AND task_status = 'CLAIMABLE'
          AND is_active = true
          AND deleted = false
        ORDER BY priority DESC, created_at ASC
        """)
    Flux<Task> findClaimableTasksByCountry(String countryCode, Pageable pageable);

    /**
     * Find tasks by priority level
     */
    @Query("""
        SELECT * FROM tasks
        WHERE priority >= :minPriority
          AND task_status IN ('CLAIMABLE', 'CLAIMED', 'IN_PROGRESS')
          AND is_active = true
          AND deleted = false
        ORDER BY priority DESC, created_at ASC
        """)
    Flux<Task> findTasksByPriority(Integer minPriority, Pageable pageable);

    /**
     * Count tasks by status for dashboard metrics
     */
    @Query("""
        SELECT COUNT(*) FROM tasks
        WHERE task_status = :status
          AND is_active = true
          AND deleted = false
          AND (:adminId IS NULL OR assignee_id = :adminId)
        """)
    Mono<Long> countTasksByStatus(String status, Long adminId);

    /**
     * Count tasks by country for geographic analytics
     */
    @Query("""
        SELECT COUNT(*) FROM tasks
        WHERE data->>'country_code' = :countryCode
          AND task_status = 'CLAIMABLE'
          AND is_active = true
          AND deleted = false
        """)
    Mono<Long> countClaimableTasksByCountry(String countryCode);

    /**
     * Find completed tasks for a specific admin within date range
     */
    @Query("""
        SELECT * FROM tasks
        WHERE assignee_id = :adminId
          AND task_status = 'COMPLETED'
          AND completed_at BETWEEN :startDate AND :endDate
          AND deleted = false
        ORDER BY completed_at DESC
        """)
    Flux<Task> findCompletedTasksByAdminAndDateRange(
        Long adminId,
        LocalDateTime startDate,
        LocalDateTime endDate
    );

    /**
     * Find tasks requiring specialist skills
     */
    @Query("""
        SELECT * FROM tasks
        WHERE data->>'requires_specialist' = 'true'
          AND task_status = 'CLAIMABLE'
          AND is_active = true
          AND deleted = false
        ORDER BY priority DESC, created_at ASC
        """)
    Flux<Task> findSpecialistTasks(Pageable pageable);

    /**
     * Update task status
     */
    @Query("""
        UPDATE tasks
        SET task_status = :status,
            updated_at = CURRENT_TIMESTAMP
        WHERE task_id = :taskId
        """)
    Mono<Integer> updateTaskStatus(String taskId, String status);

    /**
     * Assign task to admin
     */
    @Query("""
        UPDATE tasks
        SET assignee_id = :adminId,
            task_status = 'CLAIMED',
            started_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE task_id = :taskId
          AND task_status = 'CLAIMABLE'
        """)
    Mono<Integer> assignTask(String taskId, Long adminId);

    /**
     * Complete task
     */
    @Query("""
        UPDATE tasks
        SET task_status = 'COMPLETED',
            completed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP,
            data = data || :completionData::jsonb
        WHERE task_id = :taskId
          AND assignee_id = :adminId
        """)
    Mono<Integer> completeTask(String taskId, Long adminId, String completionData);

    /**
     * Cancel task with reason
     */
    @Query("""
        UPDATE tasks
        SET task_status = 'CANCELLED',
            is_active = false,
            updated_at = CURRENT_TIMESTAMP,
            data = data || jsonb_build_object('cancellation_reason', :reason)
        WHERE task_id = :taskId
        """)
    Mono<Integer> cancelTask(String taskId, String reason);

    /**
     * Find tasks by workflow definition key for workflow analytics
     */
    @Query("""
        SELECT * FROM tasks
        WHERE workflow_definition_key = :workflowKey
          AND deleted = false
        ORDER BY created_at DESC
        """)
    Flux<Task> findByWorkflowDefinitionKey(String workflowKey, Pageable pageable);

    /**
     * Get task performance metrics for admin
     */
    @Query("""
        SELECT
            COUNT(*) as total_tasks,
            COUNT(*) FILTER (WHERE task_status = 'COMPLETED') as completed_tasks,
            COUNT(*) FILTER (WHERE due_date < completed_at) as overdue_completed,
            AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/3600) as avg_completion_hours
        FROM tasks
        WHERE assignee_id = :adminId
          AND started_at >= :sinceDate
          AND deleted = false
        """)
    Mono<Object> getTaskPerformanceMetrics(Long adminId, LocalDateTime sinceDate);

    /**
     * Find tasks with specific form key for form-based workflows
     */
    @Query("""
        SELECT * FROM tasks
        WHERE data->>'form_key' = :formKey
          AND task_status IN ('CLAIMABLE', 'CLAIMED')
          AND is_active = true
          AND deleted = false
        """)
    Flux<Task> findTasksByFormKey(String formKey);

    /**
     * Update task priority
     */
    @Query("""
        UPDATE tasks
        SET priority = :priority,
            updated_at = CURRENT_TIMESTAMP
        WHERE task_id = :taskId
        """)
    Mono<Integer> updateTaskPriority(String taskId, Integer priority);

    /**
     * Find tasks by tenant for multi-tenancy support
     */
    @Query("""
        SELECT * FROM tasks
        WHERE data->>'tenant_id' = :tenantId
          AND is_active = true
          AND deleted = false
        ORDER BY created_at DESC
        """)
    Flux<Task> findByTenantId(String tenantId, Pageable pageable);

    /**
     * Escalate overdue tasks
     */
    @Query("""
        UPDATE tasks
        SET priority = LEAST(priority + 1, 5),
            data = data || jsonb_build_object('escalated', true, 'escalated_at', CURRENT_TIMESTAMP),
            updated_at = CURRENT_TIMESTAMP
        WHERE due_date < :currentTime
          AND task_status IN ('CLAIMABLE', 'CLAIMED', 'IN_PROGRESS')
          AND is_active = true
          AND (data->>'escalated')::boolean IS NOT TRUE
        """)
    Mono<Integer> escalateOverdueTasks(LocalDateTime currentTime);
}
