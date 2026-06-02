package com.uniflow.workflow.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * TaskDashboardDTO for dashboard API responses
 *
 * <p>This DTO represents dashboard information including task counts, metrics, and summary data for
 * users and administrators.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskDashboardDTO {

    // Summary counts
    private Long totalTasks;
    private Long assignedToMe;
    private Long availableTasks;
    private Long overdueTasks;
    private Long completedToday;
    private Long completedThisWeek;
    private Long completedThisMonth;

    // Priority breakdown
    private Long highPriorityTasks;
    private Long normalPriorityTasks;
    private Long lowPriorityTasks;

    // Status breakdown
    private Map<String, Long> tasksByStatus;
    private Map<String, Long> tasksByType;
    private Map<String, Long> tasksByTerritory;

    // Recent activity
    private List<TaskDTO> recentTasks;
    private List<TaskDTO> upcomingDeadlines;
    private List<TaskDTO> overdueItems;

    // Performance metrics
    private Double averageCompletionTimeHours;
    private Double completionRateThisWeek;
    private Integer tasksCompletedYesterday;
    private Integer tasksCreatedYesterday;

    // Workload distribution
    private Map<String, Long> tasksByAssignee;
    private Map<String, Double> averageTimeByTaskType;

    // SLA metrics
    private Long slaBreachedTasks;
    private Double slaComplianceRate;
    private List<TaskDTO> approachingSlaDeadline;

    // User-specific data
    private String currentUser;
    private String currentUserRole;
    private List<String> availableActions;
    private Map<String, Object> userPreferences;

    // Time-based data
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime lastUpdated;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime dataAsOf;

    // Trend data (last 7 days)
    private List<DailyTaskMetric> weeklyTrend;

    // Filters and search state
    private Map<String, Object> activeFilters;
    private String searchQuery;
    private Integer pageSize;
    private Integer currentPage;
    private Long totalPages;

    /** Inner class for daily task metrics */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailyTaskMetric {

        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDateTime date;

        private Long created;
        private Long completed;
        private Long overdue;
        private Double avgCompletionTime;
    }

    // Quick actions data
    private List<QuickAction> quickActions;

    /** Inner class for quick actions */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuickAction {

        private String actionId;
        private String actionName;
        private String actionType;
        private String description;
        private String icon;
        private String url;
        private Boolean enabled;
        private Long count; // e.g., number of items this action applies to
    }

    // Alerts and notifications
    private List<DashboardAlert> alerts;

    /** Inner class for dashboard alerts */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DashboardAlert {

        private String alertId;
        private String alertType; // INFO, WARNING, ERROR, SUCCESS
        private String title;
        private String message;
        private String actionText;
        private String actionUrl;
        private Boolean dismissible;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime createdAt;
    }

    // Additional getter methods for workflow orchestration compatibility
    public Long getMyTasksCount() {
        return this.assignedToMe;
    }

    public Long getInProgressTasks() {
        return this.assignedToMe;
    }
}
