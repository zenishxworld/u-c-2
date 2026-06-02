package com.uniflow.workflow.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * TaskClaimResponseDTO - Response for task claim operations
 *
 * <p>This DTO provides comprehensive feedback when a task is claimed,
 * including task status information and next steps.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskClaimResponseDTO {

    private String taskId;
    private String status;
    private String claimedBy;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime claimedAt;

    private String message;
    private TaskDetails taskDetails;
    private ClaimImpact claimImpact;

    /**
     * Detailed information about the claimed task
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskDetails {

        private String applicationId;
        private String workflowInstanceId;
        private String taskType;
        private String stage;
        private String validationRule;
        private Integer priority;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private Long dueDate;

        private String description;
        private Boolean active;
    }

    /**
     * Information about the impact of claiming this task
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClaimImpact {

        private Integer deactivatedTasks;
        private List<String> deactivatedTaskIds;
        private Boolean otherAdminsNotified;
        private String nextStepRequired;
        private List<String> availableActions;
        private Boolean requiresImmediateAction;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime estimatedCompletionTime;

        private String workloadImpact; // LOW, MEDIUM, HIGH
    }

    /**
     * Factory method for successful task claim
     */
    public static TaskClaimResponseDTO success(
        String taskId,
        String claimedBy,
        String message,
        TaskDetails taskDetails,
        ClaimImpact claimImpact
    ) {
        return TaskClaimResponseDTO.builder()
            .taskId(taskId)
            .status("CLAIMED")
            .claimedBy(claimedBy)
            .claimedAt(LocalDateTime.now())
            .message(message)
            .taskDetails(taskDetails)
            .claimImpact(claimImpact)
            .build();
    }

    /**
     * Factory method for failed task claim
     */
    public static TaskClaimResponseDTO failure(
        String taskId,
        String errorMessage
    ) {
        return TaskClaimResponseDTO.builder()
            .taskId(taskId)
            .status("CLAIM_FAILED")
            .claimedAt(LocalDateTime.now())
            .message(errorMessage)
            .build();
    }

    /**
     * Simple success factory method
     */
    public static TaskClaimResponseDTO simpleSuccess(
        String taskId,
        String claimedBy,
        String message
    ) {
        return TaskClaimResponseDTO.builder()
            .taskId(taskId)
            .status("CLAIMED")
            .claimedBy(claimedBy)
            .claimedAt(LocalDateTime.now())
            .message(message)
            .build();
    }
}
