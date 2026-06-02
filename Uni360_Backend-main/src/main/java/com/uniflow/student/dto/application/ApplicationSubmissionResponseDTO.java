package com.uniflow.student.dto.application;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for application submission endpoint
 * Used for POST /api/v1/students/applications/{id}/submit API
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationSubmissionResponseDTO {

    private UUID applicationId;
    private String referenceNumber;
    private ApplicationSubmissionStatus status;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime submittedAt;

    private Boolean workflowInitiated;
    private String estimatedProcessingTime;
    private List<String> nextSteps;
    private List<String> importantReminders;
    private WorkflowDetailsDTO workflowDetails;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkflowDetailsDTO {
        private String workflowType;
        private String countryCode;
        private Integer estimatedSteps;
        private String currentStage;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime expectedCompletion;

        private List<UpcomingTaskDTO> upcomingTasks;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpcomingTaskDTO {
        private String taskType;
        private String taskDescription;
        private TaskPriority priority;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime dueDate;

        private Boolean requiresStudentAction;
        private String actionRequired;
    }

    // Application Submission Status Enum
    public enum ApplicationSubmissionStatus {
        SUBMISSION_SUCCESSFUL("submission_successful"),
        WORKFLOW_INITIATED("workflow_initiated"),
        PENDING_VALIDATION("pending_validation"),
        SUBMISSION_FAILED("submission_failed");

        private final String value;

        ApplicationSubmissionStatus(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public static ApplicationSubmissionStatus fromValue(String value) {
            for (ApplicationSubmissionStatus status : values()) {
                if (status.value.equals(value)) {
                    return status;
                }
            }
            return SUBMISSION_SUCCESSFUL; // default
        }
    }

    // Task Priority Enum
    public enum TaskPriority {
        LOW("low"),
        NORMAL("normal"),
        HIGH("high"),
        URGENT("urgent"),
        CRITICAL("critical");

        private final String value;

        TaskPriority(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public static TaskPriority fromValue(String value) {
            for (TaskPriority priority : values()) {
                if (priority.value.equals(value)) {
                    return priority;
                }
            }
            return NORMAL; // default
        }
    }
}
