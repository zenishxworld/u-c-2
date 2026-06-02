package com.uniflow.workflow.entity;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
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
 * Client-Based Workflow Definition Entity
 *
 * <p>Simplified workflow definition entity designed for client-based workflow configuration system.
 * Stores workflow configurations as JSONB and supports multi-client, multi-country, multi-degree workflows.
 *
 * <p>Key Features:
 * - Client-based workflow isolation (uni360, uniflow, etc.)
 * - Country-specific workflows (DE, US, UK, DEFAULT)
 * - Degree-level workflows (BACHELOR, MASTERS, DOCTORATE, DEFAULT)
 * - Complete workflow configuration stored as JSONB
 * - Version management and deployment tracking
 * - Backward compatibility with legacy fields
 *
 * @author UniFLow Development Team
 * @version 2.0 (Client-Based Configuration System)
 * @since 2024-01-01
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("workflow_definitions")
public class WorkflowDefinition {

    @Id
    private Long id;

    // ===================================
    // Core Definition Fields
    // ===================================

    @NotNull
    @Column("definition_key")
    private String definitionKey;

    @NotNull
    @Column("definition_name")
    private String definitionName;

    @Column("definition_description")
    private String definitionDescription;

    @NotNull
    @Builder.Default
    @Column("version")
    private Integer version = 1;

    // ===================================
    // Client-Based Workflow Configuration Fields
    // ===================================

    /**
     * Client identifier (uni360, uniflow, DEFAULT)
     * Used for multi-tenant workflow configuration
     */
    @NotNull
    @Column("client_id")
    private String clientId;

    /**
     * ISO country code (DE, US, UK, DEFAULT)
     * Supports country-specific workflow variations
     */
    @NotNull
    @Column("country_code")
    private String countryCode;

    /**
     * Academic degree level (BACHELOR, MASTERS, DOCTORATE, DEFAULT)
     * Enables degree-specific workflow processes
     */
    @NotNull
    @Column("degree_level")
    private String degreeLevel;

    /**
     * Complete workflow configuration as JSONB
     * Contains stages, tasks, validation rules, assignment rules, notifications
     */
    @NotNull
    @Column("workflow_config")
    private JsonNode workflowConfig;

    // ===================================
    // Deployment and Version Management
    // ===================================

    /**
     * Unique deployment identifier for tracking and rollback
     */
    @Column("deployment_id")
    private String deploymentId;

    // ===================================
    // Status and Control Fields
    // ===================================

    @Builder.Default
    @Column("is_active")
    private Boolean isActive = false;

    @Builder.Default
    @Column("is_suspended")
    private Boolean isSuspended = false;

    @Builder.Default
    @Column("deleted")
    private Boolean deleted = false;

    // ===================================
    // Audit Fields
    // ===================================

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;

    @Column("created_by")
    private String createdBy;

    @Column("updated_by")
    private String updatedBy;

    // ===================================
    // Legacy Compatibility Fields
    // ===================================

    /**
     * Legacy category field for backward compatibility
     */
    @Column("category")
    private String category;

    /**
     * Legacy tenant ID field for backward compatibility
     */
    @Column("tenant_id")
    private String tenantId;

    // ===================================
    // Business Logic Methods
    // ===================================

    /**
     * Checks if this workflow definition is active and ready for use
     *
     * @return true if active and not deleted or suspended
     */
    public boolean isAvailable() {
        return (
            Boolean.TRUE.equals(isActive) &&
            !Boolean.TRUE.equals(deleted) &&
            !Boolean.TRUE.equals(isSuspended)
        );
    }

    /**
     * Generates a unique workflow definition key based on client, country, and degree
     *
     * @return formatted workflow definition key
     */
    public String generateDefinitionKey() {
        return String.format(
            "%s_%s_%s_WORKFLOW",
            clientId != null ? clientId.toUpperCase() : "DEFAULT",
            countryCode != null ? countryCode.toUpperCase() : "DEFAULT",
            degreeLevel != null ? degreeLevel.toUpperCase() : "DEFAULT"
        );
    }

    /**
     * Checks if this workflow definition matches the given client criteria
     *
     * @param clientId the client ID to match
     * @param countryCode the country code to match
     * @param degreeLevel the degree level to match
     * @return true if this definition matches all criteria
     */
    public boolean matches(
        String clientId,
        String countryCode,
        String degreeLevel
    ) {
        return (
            (this.clientId == null ||
                this.clientId.equals(clientId) ||
                "DEFAULT".equals(this.clientId)) &&
            (this.countryCode == null ||
                this.countryCode.equals(countryCode) ||
                "DEFAULT".equals(this.countryCode)) &&
            (this.degreeLevel == null ||
                this.degreeLevel.equals(degreeLevel) ||
                "DEFAULT".equals(this.degreeLevel))
        );
    }

    /**
     * Activates this workflow definition and sets update metadata
     *
     * @param activatedBy the user activating this definition
     */
    public void activate(String activatedBy) {
        this.isActive = true;
        this.isSuspended = false;
        this.updatedBy = activatedBy;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Deactivates this workflow definition and sets update metadata
     *
     * @param deactivatedBy the user deactivating this definition
     */
    public void deactivate(String deactivatedBy) {
        this.isActive = false;
        this.updatedBy = deactivatedBy;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Suspends this workflow definition and sets update metadata
     *
     * @param suspendedBy the user suspending this definition
     * @param reason the reason for suspension
     */
    public void suspend(String suspendedBy, String reason) {
        this.isSuspended = true;
        this.updatedBy = suspendedBy;
        this.updatedAt = LocalDateTime.now();
        // Note: reason could be stored in a separate suspension_reason field if needed
    }

    /**
     * Soft deletes this workflow definition
     *
     * @param deletedBy the user deleting this definition
     */
    public void softDelete(String deletedBy) {
        this.deleted = true;
        this.isActive = false;
        this.updatedBy = deletedBy;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Creates a copy of this workflow definition with a new version
     *
     * @param newVersion the new version number
     * @param copiedBy the user creating the copy
     * @return a new WorkflowDefinition instance
     */
    public WorkflowDefinition copyToNewVersion(
        Integer newVersion,
        String copiedBy
    ) {
        return WorkflowDefinition.builder()
            .definitionKey(this.definitionKey)
            .definitionName(this.definitionName)
            .definitionDescription(this.definitionDescription)
            .version(newVersion)
            .clientId(this.clientId)
            .countryCode(this.countryCode)
            .degreeLevel(this.degreeLevel)
            .workflowConfig(this.workflowConfig)
            .isActive(false) // New versions start inactive
            .isSuspended(false)
            .deleted(false)
            .createdBy(copiedBy)
            .updatedBy(copiedBy)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .category(this.category)
            .tenantId(this.tenantId)
            .build();
    }

    // ===================================
    // Backward Compatibility Methods
    // ===================================

    /**
     * Compatibility method for builder pattern - returns current builder
     */
    public static class WorkflowDefinitionBuilder {

        public WorkflowDefinitionBuilder resourceName(String resourceName) {
            // No-op for backward compatibility, just return this
            return this;
        }

        public WorkflowDefinitionBuilder diagramResourceName(
            String diagramResourceName
        ) {
            // No-op for backward compatibility
            return this;
        }

        public WorkflowDefinitionBuilder processDefinition(
            JsonNode processDefinition
        ) {
            // No-op for backward compatibility
            return this;
        }

        public WorkflowDefinitionBuilder startFormKey(String startFormKey) {
            // No-op for backward compatibility
            return this;
        }

        public WorkflowDefinitionBuilder hasStartFormKey(
            Boolean hasStartFormKey
        ) {
            // No-op for backward compatibility
            return this;
        }

        public WorkflowDefinitionBuilder hasGraphicalNotation(
            Boolean hasGraphicalNotation
        ) {
            // No-op for backward compatibility
            return this;
        }

        public WorkflowDefinitionBuilder revision(Integer revision) {
            // Map to version for compatibility
            return this.version(revision);
        }

        public WorkflowDefinitionBuilder variables(JsonNode variables) {
            // No-op for backward compatibility
            return this;
        }

        public WorkflowDefinitionBuilder configuration(JsonNode configuration) {
            // Map to workflowConfig for compatibility
            return this.workflowConfig(configuration);
        }

        public WorkflowDefinitionBuilder clientType(String clientType) {
            // Map to clientId for compatibility
            return this.clientId(clientType);
        }

        public WorkflowDefinitionBuilder territoryIdentifier(
            String territoryIdentifier
        ) {
            // Map to countryCode for compatibility
            return this.countryCode(territoryIdentifier);
        }

        public WorkflowDefinitionBuilder workflowType(String workflowType) {
            // No-op for backward compatibility
            return this;
        }

        public WorkflowDefinitionBuilder autoAssignmentRules(
            JsonNode autoAssignmentRules
        ) {
            // No-op for backward compatibility
            return this;
        }

        public WorkflowDefinitionBuilder escalationRules(
            JsonNode escalationRules
        ) {
            // No-op for backward compatibility
            return this;
        }

        public WorkflowDefinitionBuilder notificationRules(
            JsonNode notificationRules
        ) {
            // No-op for backward compatibility
            return this;
        }

        public WorkflowDefinitionBuilder approvalHierarchy(
            JsonNode approvalHierarchy
        ) {
            // No-op for backward compatibility
            return this;
        }

        public WorkflowDefinitionBuilder requiredDocuments(
            JsonNode requiredDocuments
        ) {
            // No-op for backward compatibility
            return this;
        }

        public WorkflowDefinitionBuilder slaHours(Integer slaHours) {
            // No-op for backward compatibility
            return this;
        }
    }

    /**
     * Legacy compatibility method - maps to workflowConfig
     */
    public JsonNode getConfiguration() {
        return this.workflowConfig;
    }

    /**
     * Legacy compatibility method - maps to workflowConfig
     */
    public void setConfiguration(JsonNode configuration) {
        this.workflowConfig = configuration;
    }

    /**
     * Legacy compatibility method - maps to clientId
     */
    public String getClientType() {
        return this.clientId;
    }

    /**
     * Legacy compatibility method - maps to clientId
     */
    public void setClientType(String clientType) {
        this.clientId = clientType;
    }

    /**
     * Legacy compatibility method - maps to countryCode
     */
    public String getTerritoryIdentifier() {
        return this.countryCode;
    }

    /**
     * Legacy compatibility method - maps to countryCode
     */
    public void setTerritoryIdentifier(String territoryIdentifier) {
        this.countryCode = territoryIdentifier;
    }

    /**
     * Legacy compatibility method - returns null for removed fields
     */
    public String getResourceName() {
        return null;
    }

    /**
     * Legacy compatibility method - returns null for removed fields
     */
    public String getDiagramResourceName() {
        return null;
    }

    /**
     * Legacy compatibility method - returns null for removed fields
     */
    public JsonNode getProcessDefinition() {
        return null;
    }

    /**
     * Legacy compatibility method - returns null for removed fields
     */
    public String getStartFormKey() {
        return null;
    }

    /**
     * Legacy compatibility method - returns false for removed fields
     */
    public Boolean getHasStartFormKey() {
        return false;
    }

    /**
     * Legacy compatibility method - returns false for removed fields
     */
    public Boolean getHasGraphicalNotation() {
        return false;
    }

    /**
     * Legacy compatibility method - returns version for revision
     */
    public Integer getRevision() {
        return this.version;
    }

    /**
     * Legacy compatibility method - returns null for removed fields
     */
    public JsonNode getVariables() {
        return null;
    }

    /**
     * Legacy compatibility method - returns clientId as workflowType
     */
    public String getWorkflowType() {
        return this.clientId != null
            ? this.clientId.toUpperCase() + "_WORKFLOW"
            : null;
    }

    /**
     * Legacy compatibility method - returns null for removed fields
     */
    public JsonNode getAutoAssignmentRules() {
        return null;
    }

    /**
     * Legacy compatibility method - returns null for removed fields
     */
    public JsonNode getEscalationRules() {
        return null;
    }

    /**
     * Legacy compatibility method - returns null for removed fields
     */
    public JsonNode getNotificationRules() {
        return null;
    }

    /**
     * Legacy compatibility method - returns null for removed fields
     */
    public JsonNode getApprovalHierarchy() {
        return null;
    }

    /**
     * Legacy compatibility method - returns null for removed fields
     */
    public JsonNode getRequiredDocuments() {
        return null;
    }

    /**
     * Legacy compatibility method - returns default 24 hours
     */
    public Integer getSlaHours() {
        return 24;
    }

    /**
     * Legacy compatibility setters - no-op implementations
     */
    public void setProcessDefinition(JsonNode processDefinition) {
        // No-op for backward compatibility
    }

    public void setStartFormKey(String startFormKey) {
        // No-op for backward compatibility
    }

    public void setHasStartFormKey(Boolean hasStartFormKey) {
        // No-op for backward compatibility
    }

    public void setHasGraphicalNotation(Boolean hasGraphicalNotation) {
        // No-op for backward compatibility
    }

    public void setVariables(JsonNode variables) {
        // No-op for backward compatibility
    }

    public void setWorkflowType(String workflowType) {
        // No-op for backward compatibility
    }

    public void setAutoAssignmentRules(JsonNode autoAssignmentRules) {
        // No-op for backward compatibility
    }

    public void setEscalationRules(JsonNode escalationRules) {
        // No-op for backward compatibility
    }

    public void setNotificationRules(JsonNode notificationRules) {
        // No-op for backward compatibility
    }

    public void setApprovalHierarchy(JsonNode approvalHierarchy) {
        // No-op for backward compatibility
    }

    public void setRequiredDocuments(JsonNode requiredDocuments) {
        // No-op for backward compatibility
    }

    public void setSlaHours(Integer slaHours) {
        // No-op for backward compatibility
    }

    /**
     * Compatibility method for workflow orchestration
     */
    public String getKey() {
        return this.definitionKey;
    }

    @Override
    public String toString() {
        return String.format(
            "WorkflowDefinition{id=%d, key='%s', client='%s', country='%s', degree='%s', version=%d, active=%s}",
            id,
            definitionKey,
            clientId,
            countryCode,
            degreeLevel,
            version,
            isActive
        );
    }
}
