package com.uniflow.workflow.repository;

import com.uniflow.workflow.entity.WorkflowInstance;
import java.time.LocalDateTime;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * WorkflowInstanceRepository for workflow instance data access operations
 *
 * <p>This repository provides reactive data access methods for WorkflowInstance entities, including
 * queries for instance management, monitoring, and performance tracking.
 */
@Repository
public interface WorkflowInstanceRepository
    extends R2dbcRepository<WorkflowInstance, Long> {
    // Basic finders
    Mono<WorkflowInstance> findByInstanceId(String instanceId);

    Mono<WorkflowInstance> findByWorkflowInstanceId(String workflowInstanceId);

    Flux<WorkflowInstance> findByApplicationId(String applicationId);

    Flux<WorkflowInstance> findByApplicationIdAndDeleted(
        String applicationId,
        Boolean deleted
    );

    Flux<WorkflowInstance> findByWorkflowDefinitionKey(
        String workflowDefinitionKey
    );

    Flux<WorkflowInstance> findByWorkflowDefinitionKeyAndDeleted(
        String workflowDefinitionKey,
        Boolean deleted
    );

    // Business key queries
    Mono<WorkflowInstance> findByBusinessKey(String businessKey);

    Flux<WorkflowInstance> findByBusinessKeyAndDeleted(
        String businessKey,
        Boolean deleted
    );

    // Status queries
    Flux<WorkflowInstance> findByInstanceStatus(String instanceStatus);

    Flux<WorkflowInstance> findByInstanceStatusAndDeleted(
        String instanceStatus,
        Boolean deleted
    );

    @Query(
        "SELECT * FROM workflow_instances WHERE instance_status IN (:statuses) AND deleted = false"
    )
    Flux<WorkflowInstance> findByInstanceStatusIn(
        @Param("statuses") String[] statuses
    );

    // Active instances
    @Query(
        "SELECT * FROM workflow_instances WHERE instance_status = 'ACTIVE' AND deleted = false"
    )
    Flux<WorkflowInstance> findActiveInstances();

    // Completed instances
    @Query(
        "SELECT * FROM workflow_instances WHERE instance_status = 'COMPLETED' AND deleted = false"
    )
    Flux<WorkflowInstance> findCompletedInstances();

    // Suspended instances
    @Query(
        "SELECT * FROM workflow_instances WHERE is_suspended = true AND deleted = false"
    )
    Flux<WorkflowInstance> findSuspendedInstances();

    // Started by user
    Flux<WorkflowInstance> findByStartedBy(String startedBy);

    Flux<WorkflowInstance> findByStartedByAndDeleted(
        String startedBy,
        Boolean deleted
    );

    // Territory and client queries
    Flux<WorkflowInstance> findByTerritoryIdentifier(
        String territoryIdentifier
    );

    Flux<WorkflowInstance> findByClientType(String clientType);

    @Query(
        "SELECT * FROM workflow_instances WHERE client_type = :clientType AND territory_identifier = :territoryId AND deleted = false"
    )
    Flux<WorkflowInstance> findByClientTypeAndTerritory(
        @Param("clientType") String clientType,
        @Param("territoryId") String territoryId
    );

    // Priority queries
    Flux<WorkflowInstance> findByPriority(Integer priority);

    @Query(
        "SELECT * FROM workflow_instances WHERE priority <= :maxPriority AND instance_status = 'ACTIVE' AND deleted = false"
    )
    Flux<WorkflowInstance> findHighPriorityActiveInstances(
        @Param("maxPriority") Integer maxPriority
    );

    // Fast tracked instances
    @Query(
        "SELECT * FROM workflow_instances WHERE fast_tracked = true AND deleted = false"
    )
    Flux<WorkflowInstance> findFastTrackedInstances();

    // Escalated instances
    @Query(
        "SELECT * FROM workflow_instances WHERE escalated = true AND deleted = false"
    )
    Flux<WorkflowInstance> findEscalatedInstances();

    @Query(
        "SELECT * FROM workflow_instances WHERE escalation_level > :level AND deleted = false"
    )
    Flux<WorkflowInstance> findInstancesWithEscalationLevel(
        @Param("level") Integer level
    );

    // SLA related queries
    @Query(
        "SELECT * FROM workflow_instances WHERE sla_due_date <= :currentTime AND instance_status = 'ACTIVE' AND deleted = false"
    )
    Flux<WorkflowInstance> findInstancesApproachingSlaDeadline(
        @Param("currentTime") LocalDateTime currentTime
    );

    @Query(
        "SELECT * FROM workflow_instances WHERE sla_breached = true AND deleted = false"
    )
    Flux<WorkflowInstance> findSlaBreachedInstances();

    // Date range queries
    @Query(
        "SELECT * FROM workflow_instances WHERE started_at BETWEEN :startDate AND :endDate AND deleted = false"
    )
    Flux<WorkflowInstance> findInstancesStartedBetween(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    @Query(
        "SELECT * FROM workflow_instances WHERE completed_at BETWEEN :startDate AND :endDate AND deleted = false"
    )
    Flux<WorkflowInstance> findInstancesCompletedBetween(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    // Parent-child relationships
    Flux<WorkflowInstance> findByParentInstanceId(String parentInstanceId);

    Flux<WorkflowInstance> findBySuperInstanceId(String superInstanceId);

    @Query(
        "SELECT COUNT(*) FROM workflow_instances WHERE parent_instance_id = :parentId AND deleted = false"
    )
    Mono<Long> countChildInstances(@Param("parentId") String parentId);

    // Tenant queries
    Flux<WorkflowInstance> findByTenantId(String tenantId);

    Flux<WorkflowInstance> findByTenantIdAndDeleted(
        String tenantId,
        Boolean deleted
    );

    // Search queries
    @Query(
        "SELECT * FROM workflow_instances WHERE " +
            "(LOWER(application_id) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(business_key) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(instance_id) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "AND deleted = false"
    )
    Flux<WorkflowInstance> searchInstances(
        @Param("searchTerm") String searchTerm
    );

    // Count queries for dashboard
    @Query("SELECT COUNT(*) FROM workflow_instances WHERE deleted = false")
    Mono<Long> countAllInstances();

    @Query(
        "SELECT COUNT(*) FROM workflow_instances WHERE instance_status = :status AND deleted = false"
    )
    Mono<Long> countInstancesByStatus(@Param("status") String status);

    @Query(
        "SELECT COUNT(*) FROM workflow_instances WHERE started_by = :startedBy AND deleted = false"
    )
    Mono<Long> countInstancesByUser(@Param("startedBy") String startedBy);

    @Query(
        "SELECT COUNT(*) FROM workflow_instances WHERE workflow_definition_key = :definitionKey AND deleted = false"
    )
    Mono<Long> countInstancesByDefinition(
        @Param("definitionKey") String definitionKey
    );

    @Query(
        "SELECT COUNT(*) FROM workflow_instances WHERE started_at BETWEEN :startDate AND :endDate AND deleted = false"
    )
    Mono<Long> countInstancesStartedBetween(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    @Query(
        "SELECT COUNT(*) FROM workflow_instances WHERE completed_at BETWEEN :startDate AND :endDate AND deleted = false"
    )
    Mono<Long> countInstancesCompletedBetween(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    @Query(
        "SELECT COUNT(*) FROM workflow_instances WHERE sla_breached = true AND deleted = false"
    )
    Mono<Long> countSlaBreachedInstances();

    @Query(
        "SELECT COUNT(*) FROM workflow_instances WHERE escalated = true AND deleted = false"
    )
    Mono<Long> countEscalatedInstances();

    // Group by queries for statistics
    @Query(
        "SELECT instance_status, COUNT(*) as count FROM workflow_instances WHERE deleted = false GROUP BY instance_status"
    )
    Flux<InstanceStatusCount> countInstancesByStatus();

    @Query(
        "SELECT workflow_definition_key, COUNT(*) as count FROM workflow_instances WHERE deleted = false GROUP BY workflow_definition_key"
    )
    Flux<DefinitionCount> countInstancesByDefinition();

    @Query(
        "SELECT territory_identifier, COUNT(*) as count FROM workflow_instances WHERE territory_identifier IS NOT NULL AND deleted = false GROUP BY territory_identifier"
    )
    Flux<TerritoryCount> countInstancesByTerritory();

    @Query(
        "SELECT priority, COUNT(*) as count FROM workflow_instances WHERE deleted = false GROUP BY priority"
    )
    Flux<PriorityCount> countInstancesByPriority();

    @Query(
        "SELECT client_type, COUNT(*) as count FROM workflow_instances WHERE client_type IS NOT NULL AND deleted = false GROUP BY client_type"
    )
    Flux<ClientTypeCount> countInstancesByClientType();

    // Performance metrics
    @Query(
        "SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/3600.0) FROM workflow_instances WHERE completed_at IS NOT NULL AND started_at IS NOT NULL AND deleted = false"
    )
    Mono<Double> getAverageCompletionTimeHours();

    @Query(
        "SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/3600.0) FROM workflow_instances WHERE workflow_definition_key = :definitionKey AND completed_at IS NOT NULL AND started_at IS NOT NULL AND deleted = false"
    )
    Mono<Double> getAverageCompletionTimeHoursByDefinition(
        @Param("definitionKey") String definitionKey
    );

    @Query(
        "SELECT AVG(completion_percentage) FROM workflow_instances WHERE completion_percentage > 0 AND deleted = false"
    )
    Mono<Double> getAverageCompletionPercentage();

    // Update queries
    @Query(
        "UPDATE workflow_instances SET instance_status = :status, updated_at = CURRENT_TIMESTAMP WHERE instance_id = :instanceId"
    )
    Mono<Integer> updateInstanceStatus(
        @Param("instanceId") String instanceId,
        @Param("status") String status
    );

    @Query(
        "UPDATE workflow_instances SET is_suspended = :suspended, suspension_reason = :reason, suspended_at = CASE WHEN :suspended THEN CURRENT_TIMESTAMP ELSE NULL END, updated_at = CURRENT_TIMESTAMP WHERE instance_id = :instanceId"
    )
    Mono<Integer> updateSuspendedStatus(
        @Param("instanceId") String instanceId,
        @Param("suspended") Boolean suspended,
        @Param("reason") String reason
    );

    @Query(
        "UPDATE workflow_instances SET completion_percentage = :percentage, updated_at = CURRENT_TIMESTAMP WHERE instance_id = :instanceId"
    )
    Mono<Integer> updateCompletionPercentage(
        @Param("instanceId") String instanceId,
        @Param("percentage") Integer percentage
    );

    @Query(
        "UPDATE workflow_instances SET escalated = :escalated, escalation_level = :level, last_escalation_date = CASE WHEN :escalated THEN CURRENT_TIMESTAMP ELSE last_escalation_date END, updated_at = CURRENT_TIMESTAMP WHERE instance_id = :instanceId"
    )
    Mono<Integer> updateEscalationStatus(
        @Param("instanceId") String instanceId,
        @Param("escalated") Boolean escalated,
        @Param("level") Integer level
    );

    @Query(
        "UPDATE workflow_instances SET sla_breached = :breached, updated_at = CURRENT_TIMESTAMP WHERE instance_id = :instanceId"
    )
    Mono<Integer> updateSlaBreachedStatus(
        @Param("instanceId") String instanceId,
        @Param("breached") Boolean breached
    );

    @Query(
        "UPDATE workflow_instances SET priority = :priority, updated_at = CURRENT_TIMESTAMP WHERE instance_id = :instanceId"
    )
    Mono<Integer> updatePriority(
        @Param("instanceId") String instanceId,
        @Param("priority") Integer priority
    );

    @Query(
        "UPDATE workflow_instances SET current_activity_id = :activityId, updated_at = CURRENT_TIMESTAMP WHERE instance_id = :instanceId"
    )
    Mono<Integer> updateCurrentActivity(
        @Param("instanceId") String instanceId,
        @Param("activityId") String activityId
    );

    // Complete instance
    @Query(
        "UPDATE workflow_instances SET instance_status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP, completion_percentage = 100, updated_at = CURRENT_TIMESTAMP WHERE instance_id = :instanceId"
    )
    Mono<Integer> completeInstance(@Param("instanceId") String instanceId);

    // Terminate instance
    @Query(
        "UPDATE workflow_instances SET instance_status = 'TERMINATED', terminated_at = CURRENT_TIMESTAMP, delete_reason = :reason, updated_at = CURRENT_TIMESTAMP WHERE instance_id = :instanceId"
    )
    Mono<Integer> terminateInstance(
        @Param("instanceId") String instanceId,
        @Param("reason") String reason
    );

    // Soft delete
    @Query(
        "UPDATE workflow_instances SET deleted = true, updated_at = CURRENT_TIMESTAMP WHERE instance_id = :instanceId"
    )
    Mono<Integer> softDeleteInstance(@Param("instanceId") String instanceId);

    // Version-specific queries
    @Query(
        "SELECT * FROM workflow_instances WHERE workflow_definition_key = :definitionKey AND workflow_definition_version = :version AND deleted = false"
    )
    Flux<WorkflowInstance> findByDefinitionKeyAndVersion(
        @Param("definitionKey") String definitionKey,
        @Param("version") Integer version
    );

    @Query(
        "SELECT COUNT(*) FROM workflow_instances WHERE workflow_definition_key = :definitionKey AND workflow_definition_version = :version AND deleted = false"
    )
    Mono<Long> countInstancesByDefinitionAndVersion(
        @Param("definitionKey") String definitionKey,
        @Param("version") Integer version
    );

    // Validation queries
    @Query(
        "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM workflow_instances WHERE instance_id = :instanceId AND deleted = false"
    )
    Mono<Boolean> existsByInstanceId(@Param("instanceId") String instanceId);

    @Query(
        "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM workflow_instances WHERE business_key = :businessKey AND deleted = false"
    )
    Mono<Boolean> existsByBusinessKey(@Param("businessKey") String businessKey);

    // Cleanup queries
    @Query(
        "SELECT * FROM workflow_instances WHERE instance_status = 'COMPLETED' AND completed_at < :beforeDate AND deleted = false"
    )
    Flux<WorkflowInstance> findCompletedInstancesOlderThan(
        @Param("beforeDate") LocalDateTime beforeDate
    );

    @Query(
        "SELECT * FROM workflow_instances WHERE instance_status = 'TERMINATED' AND terminated_at < :beforeDate AND deleted = false"
    )
    Flux<WorkflowInstance> findTerminatedInstancesOlderThan(
        @Param("beforeDate") LocalDateTime beforeDate
    );

    // Projection interfaces for group by queries
    interface InstanceStatusCount {
        String getInstanceStatus();

        Long getCount();
    }

    interface DefinitionCount {
        String getWorkflowDefinitionKey();

        Long getCount();
    }

    interface TerritoryCount {
        String getTerritoryIdentifier();

        Long getCount();
    }

    interface PriorityCount {
        Integer getPriority();

        Long getCount();
    }

    interface ClientTypeCount {
        String getClientType();

        Long getCount();
    }
}
