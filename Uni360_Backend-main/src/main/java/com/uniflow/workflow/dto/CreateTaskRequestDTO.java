package com.uniflow.workflow.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CreateTaskRequestDTO for task creation API requests
 *
 * <p>This DTO represents the request payload for creating new tasks in the workflow system. It
 * includes validation annotations and all necessary fields for task initialization.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTaskRequestDTO {

  @NotBlank(message = "Application ID is required")
  private String applicationId;

  @NotBlank(message = "Workflow definition key is required")
  private String workflowDefinitionKey;

  @NotBlank(message = "Task definition key is required")
  private String taskDefinitionKey;

  @NotBlank(message = "Task name is required")
  private String taskName;

  private String taskDescription;

  private String assignee;

  private String assigneeType; // USER, GROUP, ROLE

  private List<String> candidateUsers;

  private List<String> candidateGroups;

  @Builder.Default
  private String taskStatus = "CREATED"; // CREATED, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED

  @Min(value = 1, message = "Priority must be between 1 (highest) and 5 (lowest)")
  @Max(value = 5, message = "Priority must be between 1 (highest) and 5 (lowest)")
  @Builder.Default
  private Integer priority = 3;

  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime dueDate;

  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime followUpDate;

  private JsonNode variables;

  private String formKey;

  private String tenantId;

  private String parentTaskId;

  private String delegationState; // PENDING, RESOLVED

  private String owner;

  private String category;

  @Builder.Default private Boolean suspended = false;

  private String executionId;

  private String processInstanceId;

  private JsonNode taskLocalVariables;

  // UniFLow specific fields
  @Builder.Default private Boolean fastTracked = false;

  private String territoryIdentifier;

  private List<String> tags;

  private String notes;

  @Min(value = 1, message = "Estimated duration must be at least 1 minute")
  private Integer estimatedDurationMinutes;

  // Auto-assignment configuration
  @Builder.Default private Boolean autoAssign = false;

  private String autoAssignmentStrategy; // ROUND_ROBIN, LEAST_BUSY, SKILL_BASED, TERRITORY_BASED

  private JsonNode autoAssignmentRules;

  // Notification configuration
  @Builder.Default private Boolean sendNotifications = true;

  private List<String> notificationRecipients;

  private String notificationTemplate;

  // SLA configuration
  private Integer slaHours;

  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime slaDeadline;

  // Escalation configuration
  @Builder.Default private Boolean enableEscalation = false;

  private Integer escalationHours;

  private List<String> escalationRecipients;

  // Workflow context
  private String businessKey;

  private String correlationId;

  private JsonNode contextData;

  // Client-specific fields
  private String clientType; // UNIFLOW, UNI360

  private String source; // API, SYSTEM, USER, IMPORT

  private String createdBy;

  // Validation flags
  @Builder.Default private Boolean validateAssignment = true;

  @Builder.Default private Boolean validateWorkflowState = true;

  @Builder.Default private Boolean allowDuplicates = false;

  // Batch processing support
  private String batchId;

  private Integer batchSequence;

  // Integration metadata
  private String externalTaskId;

  private String externalSystemId;

  private JsonNode integrationMetadata;
}
