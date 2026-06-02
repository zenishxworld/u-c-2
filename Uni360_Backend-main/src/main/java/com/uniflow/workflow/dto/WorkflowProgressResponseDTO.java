package com.uniflow.workflow.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * WorkflowProgressResponseDTO - Response for workflow progress tracking
 *
 * <p>This DTO provides comprehensive workflow progress information similar to ProfileBuilderService,
 * including current stage, completed stages, pending tasks, and overall completion status.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WorkflowProgressResponseDTO {

    private boolean success;
    private String message;
    private ProgressOverview overview;
    private List<StageStatus> stagesStatus;
    private List<TaskStatus> pendingTasks;
    private List<TaskStatus> completedTasks;
    private WorkflowMetadata metadata;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    /**
     * Overall workflow progress overview
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ProgressOverview {

        private String applicationId;
        private String workflowInstanceId;
        private String workflowType;
        private String currentStage;
        private String currentStageDisplayName;
        private Integer totalStages;
        private Integer completedStages;
        private Integer totalTasks;
        private Integer completedTasks;
        private Integer overallCompletionPercentage;
        private Integer currentStageCompletionPercentage;
        private String workflowStatus; // INITIATED, IN_PROGRESS, COMPLETED, ON_HOLD, REJECTED
        private String assignedTo; // Current admin handling the workflow
        private Long estimatedCompletionHours;
        private NextTaskInfo nextTask; // Next task to be executed in workflow order

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime workflowStartedAt;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime estimatedCompletionDate;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime lastActivityAt;

        private String slaStatus; // ON_TRACK, AT_RISK, BREACHED
        private Boolean requiresAttention;
        private String nextAction;
        private List<String> blockers;
    }

    /**
     * Information about the next task to be executed
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class NextTaskInfo {

        private String taskId;
        private String taskType;
        private String taskDisplayName;
        private String taskDescription;
        private String status; // CREATED, CLAIMED
        private String stage;
        private String stageDisplayName;
        private Integer priority;
        private String validationRule;
        private Boolean isClaimable;
        private Boolean canExecute;
        private List<String> availableActions;
        private List<String> requiredFields;
        private List<String> completionCriteria;
        private Integer estimatedDurationHours;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime dueDate;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime createdAt;

        private String executionOrder; // FIRST, SECOND, PARALLEL, etc.
        private Boolean requiresPreviousTaskCompletion;
        private List<String> dependencies; // Task IDs that must be completed first
        private Map<String, Object> taskFormData; // Form structure for task execution
    }

    /**
     * Individual stage status information
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StageStatus {

        private String stageName;
        private String stageDisplayName;
        private Integer stageOrder;
        private String status; // NOT_STARTED, IN_PROGRESS, COMPLETED, SKIPPED, BLOCKED
        private Integer completionPercentage;
        private Integer totalTasks;
        private Integer completedTasks;
        private Integer pendingTasks;
        private String assignedAdmin;
        private Long estimatedDurationHours;
        private Long actualDurationHours;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime stageStartedAt;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime stageCompletedAt;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime stageDueDate;

        private Boolean isCurrentStage;
        private Boolean canEdit;
        private List<String> requirements;
        private List<String> completedRequirements;
        private String stageDescription;
    }

    /**
     * Individual task status information
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TaskStatus {

        private String taskId;
        private String taskType;
        private String taskDisplayName;
        private String taskDescription;
        private String status; // CREATED, CLAIMED, IN_PROGRESS, COMPLETED, ABANDONED
        private String stage;
        private String stageDisplayName;
        private Integer priority;
        private String assignedTo;
        private String assignedToName;
        private String validationRule;
        private Boolean isClaimable;
        private Boolean isCompletable;
        private Boolean requiresImmediateAction;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime createdAt;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime claimedAt;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime completedAt;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime dueDate;

        private Long estimatedDurationHours;
        private Long actualDurationHours;
        private Integer ageInHours;
        private Boolean overdue;
        private List<String> availableActions; // CLAIM, COMPLETE, REASSIGN, CANCEL
        private List<String> requiredDocuments;
        private List<String> completionCriteria;
    }

    /**
     * Workflow metadata and configuration
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class WorkflowMetadata {

        private String countryCode;
        private String degreeLevel;
        private String applicationTitle;
        private String applicantName;
        private String applicantEmail;
        private Map<String, Object> customFields;
        private List<String> tags;
        private String clientType;
        private String territoryIdentifier;
        private Boolean fastTracked;
        private String workflowVersion;
        private Integer totalSlaHours;
        private Integer remainingSlaHours;
        private String escalationLevel; // NORMAL, ESCALATED, CRITICAL
        private List<String> notifications;
        private Map<String, Object> businessData;
    }

    /**
     * Factory method for successful workflow progress response
     */
    public static WorkflowProgressResponseDTO success(
        ProgressOverview overview,
        List<StageStatus> stagesStatus,
        List<TaskStatus> pendingTasks,
        List<TaskStatus> completedTasks,
        WorkflowMetadata metadata
    ) {
        return WorkflowProgressResponseDTO.builder()
            .success(true)
            .message("Workflow progress retrieved successfully")
            .overview(overview)
            .stagesStatus(stagesStatus)
            .pendingTasks(pendingTasks)
            .completedTasks(completedTasks)
            .metadata(metadata)
            .timestamp(LocalDateTime.now())
            .build();
    }

    /**
     * Factory method for workflow progress with warnings
     */
    public static WorkflowProgressResponseDTO withWarnings(
        ProgressOverview overview,
        List<StageStatus> stagesStatus,
        List<TaskStatus> pendingTasks,
        String warningMessage
    ) {
        return WorkflowProgressResponseDTO.builder()
            .success(true)
            .message(warningMessage)
            .overview(overview)
            .stagesStatus(stagesStatus)
            .pendingTasks(pendingTasks)
            .timestamp(LocalDateTime.now())
            .build();
    }

    /**
     * Factory method for error response
     */
    public static WorkflowProgressResponseDTO error(String errorMessage) {
        return WorkflowProgressResponseDTO.builder()
            .success(false)
            .message(errorMessage)
            .timestamp(LocalDateTime.now())
            .build();
    }

    /**
     * Convenience method to check if workflow is complete
     */
    public boolean isWorkflowComplete() {
        return (
            overview != null &&
            "COMPLETED".equals(overview.getWorkflowStatus()) &&
            overview.getOverallCompletionPercentage() != null &&
            overview.getOverallCompletionPercentage() >= 100
        );
    }

    /**
     * Convenience method to check if workflow needs attention
     */
    public boolean needsAttention() {
        return (
            overview != null &&
            Boolean.TRUE.equals(overview.getRequiresAttention())
        );
    }

    /**
     * Convenience method to get current stage name
     */
    public String getCurrentStageName() {
        return overview != null ? overview.getCurrentStage() : null;
    }

    /**
     * Convenience method to count pending tasks
     */
    public int getPendingTasksCount() {
        return pendingTasks != null ? pendingTasks.size() : 0;
    }

    /**
     * Convenience method to count completed tasks
     */
    public int getCompletedTasksCount() {
        return completedTasks != null ? completedTasks.size() : 0;
    }
}
