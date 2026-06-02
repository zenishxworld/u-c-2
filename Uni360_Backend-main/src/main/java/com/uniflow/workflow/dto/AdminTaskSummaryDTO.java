package com.uniflow.workflow.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * AdminTaskSummaryDTO for admin task dashboard summary
 *
 * <p>This DTO provides a comprehensive summary of an admin's task workload
 * and performance metrics for dashboard display.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminTaskSummaryDTO {

    private String adminId;
    private String adminName;
    private String adminEmail;

    // Task Counts
    private Integer myTasks;
    private Integer claimableTasks;
    private Integer inProgressTasks;
    private Integer completedToday;
    private Integer overdueTasks;
    private Integer applicationsOwned;

    // Workload Information
    private Integer currentWorkload;
    private Integer maxCapacity;
    private Double utilizationPercentage;

    // Performance Metrics
    private Integer totalApplicationsProcessed;
    private Double averageProcessingTimeHours;
    private Double qualityScore;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime lastActivity;

    // Recent Activity
    private List<TaskActivity> recentActivities;

    // Priority Breakdown
    private TaskPriorityBreakdown priorityBreakdown;

    // Country/Territory Breakdown
    private List<TerritoryTaskCount> territoryBreakdown;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskActivity {
        private String taskId;
        private String applicationId;
        private String action;
        private String description;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime timestamp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskPriorityBreakdown {
        private Integer highPriority;
        private Integer normalPriority;
        private Integer lowPriority;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TerritoryTaskCount {
        private String territoryCode;
        private String territoryName;
        private Integer taskCount;
    }
}
