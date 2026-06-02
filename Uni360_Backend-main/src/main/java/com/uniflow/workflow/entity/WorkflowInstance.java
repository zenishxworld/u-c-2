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
 * WorkflowInstance entity representing running instances of workflow processes
 *
 * <p>This entity stores information about active, completed, or suspended workflow instances that
 * are executing based on workflow definitions.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("workflow_instances")
public class WorkflowInstance {

    @Id
    private Long id;

    @NotNull
    @Column("instance_id")
    private String instanceId;

    @NotNull
    @Column("workflow_definition_key")
    private String workflowDefinitionKey;

    @Column("workflow_definition_version")
    private Integer workflowDefinitionVersion;

    @NotNull
    @Column("application_id")
    private String applicationId;

    @Column("business_key")
    private String businessKey;

    @NotNull
    @Column("instance_status")
    private String instanceStatus; // ACTIVE, SUSPENDED, COMPLETED, CANCELLED, TERMINATED

    @Column("start_activity_id")
    private String startActivityId;

    @Column("current_activity_id")
    private String currentActivityId;

    @Column("end_activity_id")
    private String endActivity;

    @Column("started_by")
    private String startedBy;

    @Column("tenant_id")
    private String tenantId;

    @Column("super_instance_id")
    private String superInstanceId;

    @Column("parent_instance_id")
    private String parentInstanceId;

    @Column("variables")
    private JsonNode variables;

    @Column("local_variables")
    private JsonNode localVariables;

    @Column("is_suspended")
    @Builder.Default
    private Boolean isSuspended = false;

    @Column("suspension_reason")
    private String suspensionReason;

    @Column("delete_reason")
    private String deleteReason;

    @Column("completion_percentage")
    @Builder.Default
    private Integer completionPercentage = 0;

    // UniFLow specific fields
    @Column("territory_identifier")
    private String territoryIdentifier;

    @Column("client_type")
    private String clientType; // UNIFLOW, UNI360

    @Column("priority")
    @Builder.Default
    private Integer priority = 3; // 1=High, 3=Normal, 5=Low

    @Column("fast_tracked")
    @Builder.Default
    private Boolean fastTracked = false;

    @Column("escalated")
    @Builder.Default
    private Boolean escalated = false;

    @Column("escalation_level")
    @Builder.Default
    private Integer escalationLevel = 0;

    @Column("last_escalation_date")
    private LocalDateTime lastEscalationDate;

    @Column("sla_due_date")
    private LocalDateTime slaDueDate;

    @Column("sla_breached")
    @Builder.Default
    private Boolean slaBreached = false;

    @Column("milestone_data")
    private JsonNode milestoneData; // Track important milestones

    @Column("performance_metrics")
    private JsonNode performanceMetrics; // Duration, efficiency metrics

    @Column("tags")
    private String tags; // Searchable tags

    @Column("notes")
    private String notes;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;

    @Column("started_at")
    private LocalDateTime startedAt;

    @Column("completed_at")
    private LocalDateTime completedAt;

    @Column("suspended_at")
    private LocalDateTime suspendedAt;

    @Column("terminated_at")
    private LocalDateTime terminatedAt;

    @Column("deleted")
    @Builder.Default
    private Boolean deleted = false;

    // Additional workflow-specific fields
    @Column("workflow_instance_id")
    private String workflowInstanceId;

    @Column("current_stage")
    private String currentStage;

    @Column("definition_key")
    private String definitionKey;

    @Column("status")
    private String status;

    // Getter methods for workflow orchestration
    public String getWorkflowInstanceId() {
        return this.instanceId; // Use instanceId as workflowInstanceId
    }

    public void setWorkflowInstanceId(String workflowInstanceId) {
        this.instanceId = workflowInstanceId;
    }

    public String getKey() {
        return this.workflowDefinitionKey;
    }

    // Static factory method for creating workflow instances for applications
    public static WorkflowInstance createForApplication(
        String workflowDefinitionKey,
        java.util.UUID applicationId,
        String businessKey,
        Long studentId,
        java.util.UUID startedBy,
        String countryCode,
        String degreeLevel
    ) {
        String instanceId =
            "WF_" +
            System.currentTimeMillis() +
            "_" +
            applicationId.toString().substring(0, 8);

        return WorkflowInstance.builder()
            .instanceId(instanceId)
            .workflowInstanceId(instanceId)
            .workflowDefinitionKey(workflowDefinitionKey)
            .applicationId(applicationId.toString())
            .businessKey(businessKey)
            .instanceStatus("ACTIVE")
            .startedBy(startedBy.toString())
            .territoryIdentifier(countryCode)
            .currentStage("INITIAL_CLAIM")
            .priority(2)
            .completionPercentage(0)
            .isSuspended(false)
            .escalated(false)
            .escalationLevel(0)
            .slaBreached(false)
            .fastTracked(false)
            .startedAt(LocalDateTime.now())
            .createdAt(LocalDateTime.now())
            .deleted(false)
            .build();
    }

    // Additional methods for workflow orchestration compatibility
    public JsonNode getData() {
        return this.variables;
    }

    public void setData(JsonNode data) {
        this.variables = data;
    }

    public void setEndedAt(LocalDateTime endedAt) {
        this.completedAt = endedAt;
    }

    public void setIsActive(boolean isActive) {
        if (isActive) {
            this.instanceStatus = "ACTIVE";
        } else {
            this.instanceStatus = "COMPLETED";
        }
    }
}
