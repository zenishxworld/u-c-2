package com.uniflow.workflow.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * TaskCompletionResponseDTO - Response for task completion operations
 *
 * <p>This DTO provides comprehensive feedback when a task is completed,
 * including workflow progression information and next steps.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskCompletionResponseDTO {

    private String taskId;
    private String status;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime completedAt;

    private String message;
    private List<TaskDTO> nextTasks;
    private StageAdvancement stageAdvancement;
    private WorkflowProgress workflowProgress;
    private ValidationResult validationResult;

    /**
     * Represents workflow stage advancement information
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StageAdvancement {
        private String currentStage;
        private String nextStage;
        private Boolean stageCompleted;
        private Integer remainingTasks;
        private Integer completionPercentage;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime stageCompletedAt;

        private List<String> stageRequirements;
        private Boolean workflowCompleted;
    }

    /**
     * Represents overall workflow progress
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WorkflowProgress {
        private String workflowInstanceId;
        private String applicationId;
        private String currentStage;
        private Integer totalStages;
        private Integer completedStages;
        private Integer overallCompletionPercentage;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime estimatedCompletion;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime workflowStartedAt;

        private Long elapsedTimeHours;
        private Boolean isOnTrack;
        private String slaStatus; // ON_TRACK, AT_RISK, BREACHED
    }

    /**
     * Represents task completion validation result
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ValidationResult {
        private Boolean isValid;
        private String validationStatus; // PASSED, FAILED, WARNING
        private List<String> validationMessages;
        private List<String> warnings;
        private List<String> errors;
        private Boolean requiresManagerApproval;
        private String recommendedAction;
    }

    /**
     * Factory method for successful task completion
     */
    public static TaskCompletionResponseDTO success(
        String taskId,
        String message,
        List<TaskDTO> nextTasks,
        StageAdvancement stageAdvancement
    ) {
        return TaskCompletionResponseDTO.builder()
            .taskId(taskId)
            .status("COMPLETED")
            .completedAt(LocalDateTime.now())
            .message(message)
            .nextTasks(nextTasks)
            .stageAdvancement(stageAdvancement)
            .build();
    }

    /**
     * Factory method for failed task completion
     */
    public static TaskCompletionResponseDTO failure(
        String taskId,
        String errorMessage,
        ValidationResult validationResult
    ) {
        return TaskCompletionResponseDTO.builder()
            .taskId(taskId)
            .status("FAILED")
            .completedAt(LocalDateTime.now())
            .message(errorMessage)
            .validationResult(validationResult)
            .build();
    }

    /**
     * Factory method for task completion with warnings
     */
    public static TaskCompletionResponseDTO warning(
        String taskId,
        String message,
        List<TaskDTO> nextTasks,
        StageAdvancement stageAdvancement,
        ValidationResult validationResult
    ) {
        return TaskCompletionResponseDTO.builder()
            .taskId(taskId)
            .status("COMPLETED_WITH_WARNINGS")
            .completedAt(LocalDateTime.now())
            .message(message)
            .nextTasks(nextTasks)
            .stageAdvancement(stageAdvancement)
            .validationResult(validationResult)
            .build();
    }
}
