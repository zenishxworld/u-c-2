package com.uniflow.student.dto.dashboard;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Application/Task Progress KPI Card
 * Part of ST-02: Enhanced Student Dashboard KPIs
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Application/Task Progress KPI Card data")
public class TaskProgressKPIDTO {

    @Schema(description = "Overall task completion percentage", example = "60")
    private Integer overallCompletionPercentage;

    @Schema(description = "Total number of tasks", example = "15")
    private Integer totalTasks;

    @Schema(description = "Number of completed tasks", example = "9")
    private Integer completedTasks;

    @Schema(description = "Number of pending tasks", example = "6")
    private Integer pendingTasks;

    @Schema(description = "Number of overdue tasks", example = "2")
    private Integer overdueTasks;

    @Schema(description = "Task progress status")
    private String progressStatus; // "ON_TRACK", "BEHIND_SCHEDULE", "CRITICAL", "COMPLETED"

    @Schema(description = "Next urgent task")
    private String nextUrgentTask;

    @Schema(description = "List of active applications")
    private List<ApplicationProgress> activeApplications;

    @Schema(description = "Recent task activity summary")
    private String recentActivity;

    @Schema(description = "Estimated completion date")
    private LocalDateTime estimatedCompletionDate;

    /**
     * Nested class for application progress information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "Individual application progress")
    public static class ApplicationProgress {

        @Schema(description = "Application ID", example = "APP-001")
        private String applicationId;

        @Schema(description = "University name", example = "Harvard University")
        private String universityName;

        @Schema(description = "Program name", example = "Computer Science MS")
        private String programName;

        @Schema(description = "Application status", example = "IN_PROGRESS")
        private String status; // "DRAFT", "IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED"

        @Schema(description = "Task completion percentage for this application", example = "75")
        private Integer completionPercentage;

        @Schema(description = "Number of pending tasks for this application", example = "3")
        private Integer pendingTasks;

        @Schema(description = "Next deadline for this application")
        private LocalDateTime nextDeadline;

        @Schema(description = "Application priority", example = "HIGH")
        private String priority; // "HIGH", "MEDIUM", "LOW"

        @Schema(description = "Current stage", example = "Document Submission")
        private String currentStage;
    }
}
