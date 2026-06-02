package com.uniflow.workflow.repository;

import com.uniflow.workflow.entity.WorkflowDefinition;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * WorkflowDefinitionRepository for workflow definition data access operations
 *
 * <p>This repository provides reactive data access methods for WorkflowDefinition entities,
 * including queries for workflow management, versioning, and deployment operations.
 */
@Repository
public interface WorkflowDefinitionRepository
    extends R2dbcRepository<WorkflowDefinition, Long> {
    // Basic finders
    Mono<WorkflowDefinition> findByDefinitionKey(String definitionKey);

    Mono<WorkflowDefinition> findByDefinitionKeyAndIsActive(String definitionKey, Boolean isActive);

    Flux<WorkflowDefinition> findByDefinitionKeyOrderByVersionDesc(
        String definitionKey
    );

    Flux<WorkflowDefinition> findByDeleted(Boolean deleted);

    // Latest version queries
    @Query(
        "SELECT * FROM workflow_definitions WHERE definition_key = :definitionKey ORDER BY version DESC LIMIT 1"
    )
    Mono<WorkflowDefinition> findLatestByDefinitionKey(
        @Param("definitionKey") String definitionKey
    );

    @Query(
        "SELECT DISTINCT ON (definition_key) * FROM workflow_definitions WHERE deleted = false ORDER BY definition_key, version DESC"
    )
    Flux<WorkflowDefinition> findAllLatestVersions();

    // Active/Inactive queries
    Flux<WorkflowDefinition> findByIsActiveAndDeleted(
        Boolean isActive,
        Boolean deleted
    );

    Flux<WorkflowDefinition> findByIsSuspendedAndDeleted(
        Boolean isSuspended,
        Boolean deleted
    );

    @Query(
        "SELECT * FROM workflow_definitions WHERE is_active = true AND is_suspended = false AND deleted = false"
    )
    Flux<WorkflowDefinition> findAllActiveDefinitions();

    // Category and type queries
    Flux<WorkflowDefinition> findByCategory(String category);

    Flux<WorkflowDefinition> findByCategoryAndDeleted(
        String category,
        Boolean deleted
    );

    Flux<WorkflowDefinition> findByWorkflowType(String workflowType);

    Flux<WorkflowDefinition> findByWorkflowTypeAndDeleted(
        String workflowType,
        Boolean deleted
    );

    // Client and territory queries
    Flux<WorkflowDefinition> findByClientType(String clientType);

    Flux<WorkflowDefinition> findByClientTypeAndDeleted(
        String clientType,
        Boolean deleted
    );

    Flux<WorkflowDefinition> findByTerritoryIdentifier(
        String territoryIdentifier
    );

    @Query(
        "SELECT * FROM workflow_definitions WHERE client_type = :clientType AND territory_identifier = :territoryId AND deleted = false"
    )
    Flux<WorkflowDefinition> findByClientTypeAndTerritory(
        @Param("clientType") String clientType,
        @Param("territoryId") String territoryId
    );

    // Search queries
    @Query(
        "SELECT * FROM workflow_definitions WHERE " +
            "(LOWER(definition_name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(definition_description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(definition_key) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
            "AND deleted = false"
    )
    Flux<WorkflowDefinition> searchDefinitions(
        @Param("searchTerm") String searchTerm
    );

    // Tag-based search
    @Query(
        "SELECT * FROM workflow_definitions WHERE tags LIKE CONCAT('%', :tag, '%') AND deleted = false"
    )
    Flux<WorkflowDefinition> findByTag(@Param("tag") String tag);

    // Deployment queries
    Flux<WorkflowDefinition> findByDeploymentId(String deploymentId);

    Flux<WorkflowDefinition> findByTenantId(String tenantId);

    Flux<WorkflowDefinition> findByTenantIdAndDeleted(
        String tenantId,
        Boolean deleted
    );

    // Form key queries
    Flux<WorkflowDefinition> findByHasStartFormKey(Boolean hasStartFormKey);

    Flux<WorkflowDefinition> findByStartFormKey(String startFormKey);

    // Count queries
    @Query("SELECT COUNT(*) FROM workflow_definitions WHERE deleted = false")
    Mono<Long> countActiveDefinitions();

    @Query(
        "SELECT COUNT(*) FROM workflow_definitions WHERE is_active = true AND deleted = false"
    )
    Mono<Long> countActiveEnabledDefinitions();

    @Query(
        "SELECT COUNT(*) FROM workflow_definitions WHERE is_suspended = true AND deleted = false"
    )
    Mono<Long> countSuspendedDefinitions();

    @Query(
        "SELECT COUNT(*) FROM workflow_definitions WHERE client_type = :clientType AND deleted = false"
    )
    Mono<Long> countByClientType(@Param("clientType") String clientType);

    @Query(
        "SELECT COUNT(*) FROM workflow_definitions WHERE category = :category AND deleted = false"
    )
    Mono<Long> countByCategory(@Param("category") String category);

    // Version management
    @Query(
        "SELECT MAX(version) FROM workflow_definitions WHERE definition_key = :definitionKey"
    )
    Mono<Integer> getMaxVersionForDefinitionKey(
        @Param("definitionKey") String definitionKey
    );

    @Query(
        "SELECT COUNT(*) FROM workflow_definitions WHERE definition_key = :definitionKey AND deleted = false"
    )
    Mono<Long> countVersionsForDefinitionKey(
        @Param("definitionKey") String definitionKey
    );

    // Update queries
    @Query(
        "UPDATE workflow_definitions SET is_active = :isActive, updated_at = CURRENT_TIMESTAMP WHERE definition_key = :definitionKey"
    )
    Mono<Integer> updateActiveStatus(
        @Param("definitionKey") String definitionKey,
        @Param("isActive") Boolean isActive
    );

    @Query(
        "UPDATE workflow_definitions SET is_suspended = :isSuspended, updated_at = CURRENT_TIMESTAMP WHERE definition_key = :definitionKey"
    )
    Mono<Integer> updateSuspendedStatus(
        @Param("definitionKey") String definitionKey,
        @Param("isSuspended") Boolean isSuspended
    );

    @Query(
        "UPDATE workflow_definitions SET is_active = :isActive, updated_at = CURRENT_TIMESTAMP WHERE id = :id"
    )
    Mono<Integer> updateActiveStatusById(
        @Param("id") Long id,
        @Param("isActive") Boolean isActive
    );

    @Query(
        "UPDATE workflow_definitions SET is_suspended = :isSuspended, updated_at = CURRENT_TIMESTAMP WHERE id = :id"
    )
    Mono<Integer> updateSuspendedStatusById(
        @Param("id") Long id,
        @Param("isSuspended") Boolean isSuspended
    );

    // Soft delete
    @Query(
        "UPDATE workflow_definitions SET deleted = true, updated_at = CURRENT_TIMESTAMP WHERE id = :id"
    )
    Mono<Integer> softDeleteDefinition(@Param("id") Long id);

    @Query(
        "UPDATE workflow_definitions SET deleted = true, updated_at = CURRENT_TIMESTAMP WHERE definition_key = :definitionKey"
    )
    Mono<Integer> softDeleteAllVersionsOfDefinition(
        @Param("definitionKey") String definitionKey
    );

    // Complex queries for statistics
    @Query(
        "SELECT category, COUNT(*) as count FROM workflow_definitions WHERE deleted = false GROUP BY category"
    )
    Flux<CategoryCount> countDefinitionsByCategory();

    @Query(
        "SELECT client_type, COUNT(*) as count FROM workflow_definitions WHERE deleted = false GROUP BY client_type"
    )
    Flux<ClientTypeCount> countDefinitionsByClientType();

    @Query(
        "SELECT workflow_type, COUNT(*) as count FROM workflow_definitions WHERE deleted = false GROUP BY workflow_type"
    )
    Flux<WorkflowTypeCount> countDefinitionsByWorkflowType();

    @Query(
        "SELECT territory_identifier, COUNT(*) as count FROM workflow_definitions WHERE territory_identifier IS NOT NULL AND deleted = false GROUP BY territory_identifier"
    )
    Flux<TerritoryCount> countDefinitionsByTerritory();

    // SLA related queries
    @Query(
        "SELECT * FROM workflow_definitions WHERE sla_hours IS NOT NULL AND sla_hours > 0 AND deleted = false"
    )
    Flux<WorkflowDefinition> findDefinitionsWithSla();

    @Query(
        "SELECT AVG(sla_hours) FROM workflow_definitions WHERE sla_hours IS NOT NULL AND sla_hours > 0 AND deleted = false"
    )
    Mono<Double> getAverageSlaHours();

    // Creator and updater queries
    Flux<WorkflowDefinition> findByCreatedBy(String createdBy);

    Flux<WorkflowDefinition> findByUpdatedBy(String updatedBy);

    @Query(
        "SELECT * FROM workflow_definitions WHERE created_by = :createdBy AND deleted = false ORDER BY created_at DESC"
    )
    Flux<WorkflowDefinition> findRecentDefinitionsByCreator(
        @Param("createdBy") String createdBy
    );

    // Validation queries
    @Query(
        "SELECT COUNT(*) FROM workflow_definitions WHERE definition_key = :definitionKey AND version = :version AND deleted = false"
    )
    Mono<Long> existsByDefinitionKeyAndVersion(
        @Param("definitionKey") String definitionKey,
        @Param("version") Integer version
    );

    @Query(
        "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM workflow_definitions WHERE definition_key = :definitionKey AND is_active = true AND deleted = false"
    )
    Mono<Boolean> hasActiveVersion(
        @Param("definitionKey") String definitionKey
    );

    // Projection interfaces for group by queries
    interface CategoryCount {
        String getCategory();

        Long getCount();
    }

    interface ClientTypeCount {
        String getClientType();

        Long getCount();
    }

    interface WorkflowTypeCount {
        String getWorkflowType();

        Long getCount();
    }

    interface TerritoryCount {
        String getTerritoryIdentifier();

        Long getCount();
    }

    // ===========================================
    // Client-Based Workflow Query Methods
    // ===========================================

    /**
     * Find active workflow definition by client, country, and degree level
     * Used for workflow selection during application processing
     */
    Mono<
        WorkflowDefinition
    > findByClientIdAndCountryCodeAndDegreeLevelAndIsActiveTrue(
        String clientId,
        String countryCode,
        String degreeLevel
    );

    /**
     * Find all workflow definitions by client, country, and degree level ordered by version
     * Used for version management and history
     */
    Flux<
        WorkflowDefinition
    > findByClientIdAndCountryCodeAndDegreeLevelOrderByVersionDesc(
        String clientId,
        String countryCode,
        String degreeLevel
    );

    /**
     * Find first workflow definition by deployment ID
     * Used for tracking specific deployments
     */
    Mono<WorkflowDefinition> findFirstByDeploymentId(String deploymentId);

    /**
     * Find all workflow definitions for a specific client
     * Used for client management and overview
     */
    Flux<WorkflowDefinition> findByClientIdAndIsActiveTrue(String clientId);

    /**
     * Find all workflow definitions by client ID (including inactive ones)
     * Used for admin listing and management
     */
    Flux<WorkflowDefinition> findByClientId(String clientId);

    /**
     * Deactivate previous versions when deploying a new version
     */
    @Query(
        "UPDATE workflow_definitions SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE client_id = :clientId AND country_code = :countryCode AND degree_level = :degreeLevel AND is_active = true"
    )
    Mono<Integer> deactivatePreviousVersions(
        @Param("clientId") String clientId,
        @Param("countryCode") String countryCode,
        @Param("degreeLevel") String degreeLevel
    );

    /**
     * Get the latest version number for a specific client workflow combination
     */
    @Query(
        "SELECT COALESCE(MAX(version), 0) FROM workflow_definitions WHERE client_id = :clientId AND country_code = :countryCode AND degree_level = :degreeLevel"
    )
    Mono<Integer> findLatestVersion(
        @Param("clientId") String clientId,
        @Param("countryCode") String countryCode,
        @Param("degreeLevel") String degreeLevel
    );

    /**
     * Check if a deployment ID already exists
     */
    @Query(
        "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM workflow_definitions WHERE deployment_id = :deploymentId"
    )
    Mono<Boolean> existsByDeploymentId(
        @Param("deploymentId") String deploymentId
    );

    /**
     * Check if workflow definition exists by unique constraint fields
     */
    @Query(
        "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM workflow_definitions WHERE client_id = :clientId AND country_code = :countryCode AND degree_level = :degreeLevel AND version = :version"
    )
    Mono<Boolean> existsByClientIdAndCountryCodeAndDegreeLevelAndVersion(
        @Param("clientId") String clientId,
        @Param("countryCode") String countryCode,
        @Param("degreeLevel") String degreeLevel,
        @Param("version") Integer version
    );

    /**
     * Count active workflows for a specific client
     */
    @Query(
        "SELECT COUNT(*) FROM workflow_definitions WHERE client_id = :clientId AND is_active = true AND deleted = false"
    )
    Mono<Long> countActiveWorkflowsByClient(@Param("clientId") String clientId);

    /**
     * Find latest active workflow definition by client, country, and degree level
     * Used for client-based workflow selection with fallback support
     */
    @Query(
        "SELECT * FROM workflow_definitions WHERE client_id = :clientId AND country_code = :countryCode AND degree_level = :degreeLevel AND is_active = true AND deleted = false ORDER BY version DESC LIMIT 1"
    )
    Mono<WorkflowDefinition> findLatestByClientAndCountryAndDegree(
        @Param("clientId") String clientId,
        @Param("countryCode") String countryCode,
        @Param("degreeLevel") String degreeLevel
    );

    // Additional methods needed by TaskOrchestrationEngine
    default Mono<WorkflowDefinition> findByKey(String key) {
        return findByDefinitionKey(key);
    }

    Flux<WorkflowDefinition> findByWorkflowTypeAndIsActive(
        String workflowType,
        Boolean isActive
    );
}
