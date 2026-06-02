package com.uniflow.workflow.repository;

import com.uniflow.workflow.entity.Task;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Simplified TaskRepository for PHASE 21-22 minimalist workflow system
 *
 * This repository provides reactive data access methods for the simplified Task entity,
 * focusing on essential multi-owner workflow operations.
 */
@Repository
public interface TaskRepository extends R2dbcRepository<Task, Long> {
    // ===========================
    // BASIC FINDERS
    // ===========================

    Mono<Task> findByTaskId(String taskId);

    Flux<Task> findByApplicationId(String applicationId);

    Flux<Task> findByApplicationIdAndDeleted(
        String applicationId,
        Boolean deleted
    );

    Flux<Task> findByTaskStatus(String taskStatus);

    Flux<Task> findByDeleted(Boolean deleted);

    // ===========================
    // PHASE 21-22 MULTI-OWNER QUERIES
    // ===========================

    /**
     * Find all active tasks assigned to a specific owner
     */
    @Query(
        "SELECT * FROM tasks WHERE owner_id = :ownerId AND active = true AND deleted = false"
    )
    Flux<Task> findActiveTasksByOwner(@Param("ownerId") Long ownerId);

    /**
     * Find active tasks by application and stage
     */
    @Query(
        "SELECT * FROM tasks WHERE application_id = :applicationId AND stage = :stage AND active = true AND deleted = false"
    )
    Flux<Task> findActiveTasksByApplicationAndStage(
        @Param("applicationId") String applicationId,
        @Param("stage") String stage
    );

    /**
     * Find active tasks by workflow and task type
     */
    @Query(
        "SELECT * FROM tasks WHERE workflow_instance_id = :workflowInstanceId AND task_type = :taskType AND active = true AND deleted = false"
    )
    Flux<Task> findActiveTasksByWorkflowAndType(
        @Param("workflowInstanceId") String workflowInstanceId,
        @Param("taskType") String taskType
    );

    /**
     * Deactivate other tasks of the same type when one is claimed
     */
    @Query(
        "UPDATE tasks SET active = false, updated_at = :timestamp WHERE application_id = :applicationId AND task_type = :taskType AND task_id != :excludeTaskId"
    )
    Mono<Integer> deactivateTasksByApplicationAndType(
        @Param("applicationId") String applicationId,
        @Param("taskType") String taskType,
        @Param("excludeTaskId") String excludeTaskId,
        @Param("timestamp") Long timestamp
    );

    /**
     * Find tasks by owner, stage and statuses
     */
    @Query(
        "SELECT * FROM tasks WHERE owner_id = :ownerId AND stage = :stage AND task_status = ANY(ARRAY[:statuses]) AND active = true AND deleted = false"
    )
    Flux<Task> findTasksByOwnerStageAndStatuses(
        @Param("ownerId") Long ownerId,
        @Param("stage") String stage,
        @Param("statuses") String[] statuses
    );

    /**
     * Count completed tasks in a specific stage
     */
    @Query(
        "SELECT COUNT(*) FROM tasks WHERE application_id = :applicationId AND stage = :stage AND task_status = 'COMPLETED' AND active = true AND deleted = false"
    )
    Mono<Long> countCompletedTasksInStage(
        @Param("applicationId") String applicationId,
        @Param("stage") String stage
    );

    /**
     * Count total tasks in a specific stage
     */
    @Query(
        "SELECT COUNT(*) FROM tasks WHERE application_id = :applicationId AND stage = :stage AND active = true AND deleted = false"
    )
    Mono<Long> countTotalTasksInStage(
        @Param("applicationId") String applicationId,
        @Param("stage") String stage
    );

    // ===========================
    // TASK LIFECYCLE OPERATIONS
    // ===========================

    /**
     * Find claimable tasks for an admin (tasks they own that are in CREATED status)
     */
    @Query(
        "SELECT * FROM tasks WHERE owner_id = :ownerId AND task_status = 'CREATED' AND active = true AND deleted = false"
    )
    Flux<Task> findClaimableTasksForAdmin(@Param("ownerId") Long ownerId);

    /**
     * Find tasks claimed by a specific admin
     */
    @Query(
        "SELECT * FROM tasks WHERE claimed_by = :adminId AND task_status = 'CLAIMED' AND active = true AND deleted = false"
    )
    Flux<Task> findClaimedTasksByAdmin(@Param("adminId") Long adminId);

    /**
     * Find all active tasks for an application
     */
    @Query(
        "SELECT * FROM tasks WHERE application_id = :applicationId AND active = true AND deleted = false"
    )
    Flux<Task> findActiveTasksByApplicationId(
        @Param("applicationId") String applicationId
    );

    // ===========================
    // WORKFLOW PROGRESS TRACKING
    // ===========================

    /**
     * Find tasks by application and task type
     */
    @Query(
        "SELECT * FROM tasks WHERE application_id = :applicationId AND task_type = :taskType AND deleted = false"
    )
    Flux<Task> findByApplicationIdAndTaskType(
        @Param("applicationId") String applicationId,
        @Param("taskType") String taskType
    );

    /**
     * Find tasks in a specific stage
     */
    @Query(
        "SELECT * FROM tasks WHERE stage = :stage AND active = true AND deleted = false"
    )
    Flux<Task> findTasksByStage(@Param("stage") String stage);

    /**
     * Find overdue tasks (due date passed and not completed)
     */
    @Query(
        "SELECT * FROM tasks WHERE due_date < :currentTime AND task_status != 'COMPLETED' AND active = true AND deleted = false"
    )
    Flux<Task> findOverdueTasks(@Param("currentTime") Long currentTime);

    // ===========================
    // DASHBOARD AND STATISTICS
    // ===========================

    /**
     * Count tasks by status for an owner
     */
    @Query(
        "SELECT COUNT(*) FROM tasks WHERE owner_id = :ownerId AND task_status = :status AND active = true AND deleted = false"
    )
    Mono<Long> countTasksByOwnerAndStatus(
        @Param("ownerId") Long ownerId,
        @Param("status") String status
    );

    /**
     * Count total active tasks for an owner
     */
    @Query(
        "SELECT COUNT(*) FROM tasks WHERE owner_id = :ownerId AND active = true AND deleted = false"
    )
    Mono<Long> countActiveTasksByOwner(@Param("ownerId") Long ownerId);

    /**
     * Find tasks created in a time range
     */
    @Query(
        "SELECT * FROM tasks WHERE created_at BETWEEN :startTime AND :endTime AND deleted = false"
    )
    Flux<Task> findTasksCreatedBetween(
        @Param("startTime") Long startTime,
        @Param("endTime") Long endTime
    );

    /**
     * Find tasks completed in a time range
     */
    @Query(
        "SELECT * FROM tasks WHERE completed_at BETWEEN :startTime AND :endTime AND deleted = false"
    )
    Flux<Task> findTasksCompletedBetween(
        @Param("startTime") Long startTime,
        @Param("endTime") Long endTime
    );

    // ===========================
    // UPDATE OPERATIONS
    // ===========================

    /**
     * Update task status and timestamp
     */
    @Query(
        "UPDATE tasks SET task_status = :status, updated_at = :timestamp WHERE task_id = :taskId"
    )
    Mono<Integer> updateTaskStatus(
        @Param("taskId") String taskId,
        @Param("status") String status,
        @Param("timestamp") Long timestamp
    );

    /**
     * Mark task as claimed
     */
    @Query(
        "UPDATE tasks SET task_status = 'CLAIMED', claimed_by = :adminId, claimed_at = :timestamp, updated_at = :timestamp WHERE task_id = :taskId"
    )
    Mono<Integer> claimTask(
        @Param("taskId") String taskId,
        @Param("adminId") Long adminId,
        @Param("timestamp") Long timestamp
    );

    /**
     * Mark task as completed
     */
    @Query(
        "UPDATE tasks SET task_status = 'COMPLETED', completed_at = :timestamp, updated_at = :timestamp WHERE task_id = :taskId"
    )
    Mono<Integer> completeTask(
        @Param("taskId") String taskId,
        @Param("timestamp") Long timestamp
    );

    /**
     * Soft delete task
     */
    @Query(
        "UPDATE tasks SET deleted = true, updated_at = :timestamp WHERE task_id = :taskId"
    )
    Mono<Integer> softDeleteTask(
        @Param("taskId") String taskId,
        @Param("timestamp") Long timestamp
    );

    /**
     * Deactivate task
     */
    @Query(
        "UPDATE tasks SET active = false, updated_at = :timestamp WHERE task_id = :taskId"
    )
    Mono<Integer> deactivateTask(
        @Param("taskId") String taskId,
        @Param("timestamp") Long timestamp
    );

    // ===========================
    // SEARCH AND FILTERING
    // ===========================

    /**
     * Find tasks by priority level
     */
    @Query(
        "SELECT * FROM tasks WHERE priority <= :maxPriority AND active = true AND deleted = false ORDER BY priority ASC"
    )
    Flux<Task> findTasksByPriority(@Param("maxPriority") Integer maxPriority);

    /**
     * Find tasks by validation rule
     */
    @Query(
        "SELECT * FROM tasks WHERE validation_rule = :validationRule AND active = true AND deleted = false"
    )
    Flux<Task> findTasksByValidationRule(
        @Param("validationRule") String validationRule
    );

    /**
     * Find tasks by workflow instance
     */
    @Query(
        "SELECT * FROM tasks WHERE workflow_instance_id = :workflowInstanceId AND deleted = false"
    )
    Flux<Task> findByWorkflowInstanceId(
        @Param("workflowInstanceId") String workflowInstanceId
    );

    /**
     * Find tasks by application ID ordered by creation date
     */
    @Query(
        "SELECT * FROM tasks WHERE application_id = :applicationId AND deleted = false ORDER BY created_at ASC"
    )
    Flux<Task> findByApplicationIdOrderByCreatedAtAsc(
        @Param("applicationId") String applicationId
    );

    /**
     * Find tasks by workflow instance ID ordered by creation date
     */
    @Query(
        "SELECT * FROM tasks WHERE workflow_instance_id = :workflowInstanceId AND deleted = false ORDER BY created_at ASC"
    )
    Flux<Task> findByWorkflowInstanceIdOrderByCreatedAtAsc(
        @Param("workflowInstanceId") String workflowInstanceId
    );

    /**
     * Find unique application IDs that have a COMPLETED commission-trigger task
     * (UNIVERSITY_SUBMISSION or TUITION_FEES_PAYMENT).
     * Used by commission service to find chargeable applications regardless of app status.
     */
    @Query(
        "SELECT DISTINCT application_id FROM tasks " +
        "WHERE task_type IN ('UNIVERSITY_SUBMISSION', 'TUITION_FEES_PAYMENT') " +
        "AND task_status = 'COMPLETED' " +
        "AND deleted = false"
    )
    Flux<String> findCompletedCommissionTriggerApplicationIds();
}
