package com.uniflow.workflow.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * TaskDTO for API responses
 *
 * <p>This DTO represents task information returned by the workflow service APIs. It includes all
 * relevant task details for frontend consumption.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskDTO {

    private Long id;
    private String taskId;
    private String applicationId;
    private String workflowInstanceId;
    private String workflowDefinitionKey;
    private String taskDefinitionKey;
    private String taskName;
    private String taskDescription;
    private String assignee;
    private String assigneeType;
    private List<String> candidateUsers;
    private List<String> candidateGroups;
    private String taskStatus;
    private Integer priority;
    private String taskType;

    // Task schema fields
    private Long ownerId;
    private String stage;
    private String validationRule;
    private Boolean active;
    private Long claimedBy;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime claimedAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime dueDate;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime followUpDate;

    private JsonNode variables;
    private String formKey;
    private String tenantId;
    private String parentTaskId;
    private String delegationState;
    private String owner;
    private String category;
    private Boolean suspended;
    private Boolean deleted;
    private String executionId;
    private String processInstanceId;
    private JsonNode taskLocalVariables;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime completedAt;

    // UniFLow specific fields
    private Boolean isRead;
    private Boolean isBookmarked;
    private Boolean fastTracked;
    private String territoryIdentifier;
    private List<String> tags;
    private String notes;
    private Integer estimatedDurationMinutes;
    private Integer actualDurationMinutes;

    // Additional computed fields for UI
    private String statusDisplay;
    private String priorityDisplay;
    private String assigneeDisplay;
    private Long ageInHours;
    private Boolean overdue;
    private String applicationTitle;
    private String applicantName;
}
