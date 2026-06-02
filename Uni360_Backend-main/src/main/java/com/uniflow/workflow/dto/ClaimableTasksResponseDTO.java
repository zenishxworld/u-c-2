package com.uniflow.workflow.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ClaimableTasksResponseDTO - Response for getting claimable tasks
 *
 * <p>This DTO provides a comprehensive view of tasks available for claiming
 * by admins, including summary statistics and pagination information.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClaimableTasksResponseDTO {

    private List<TaskDTO> tasks;
    private TaskSummary summary;
    private PaginationInfo pagination;
    private FilterInfo filters;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime retrievedAt;

    private String adminId;
    private List<String> availableCountries;
    private List<String> availableTaskTypes;

    /**
     * Summary information about claimable tasks
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskSummary {
        private Integer totalClaimable;
        private Integer myActiveTasks;
        private Integer completedToday;
        private Integer germanyApplications;
        private Integer usaApplications;
        private Integer ukApplications;
        private Integer canadaApplications;
        private Integer australiaApplications;

        // Priority breakdown
        private Integer urgentTasks;
        private Integer highPriorityTasks;
        private Integer normalPriorityTasks;
        private Integer lowPriorityTasks;

        // Task type breakdown
        private Integer claimTasks;
        private Integer academicVerificationTasks;
        private Integer languageVerificationTasks;
        private Integer paymentTasks;
        private Integer apsVerificationTasks;
        private Integer universitySubmissionTasks;

        // SLA status
        private Integer tasksNearingSla;
        private Integer tasksBreachedSla;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime lastUpdated;

        // Performance metrics
        private Double averageCompletionTimeHours;
        private Integer taskCompletionRate;
    }

    /**
     * Pagination information
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaginationInfo {
        private Integer currentPage;
        private Integer pageSize;
        private Long totalElements;
        private Integer totalPages;
        private Boolean hasNext;
        private Boolean hasPrevious;
        private Integer numberOfElements;
        private Boolean first;
        private Boolean last;
    }

    /**
     * Current filter information
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FilterInfo {
        private String countryFilter;
        private String priorityFilter;
        private String taskTypeFilter;
        private String statusFilter;
        private String searchQuery;
        private String sortBy;
        private String sortDirection;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime dueDateFrom;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime dueDateTo;

        private Boolean showOverdueOnly;
        private Boolean showUrgentOnly;
    }

    /**
     * Factory method for successful response
     */
    public static ClaimableTasksResponseDTO success(
        List<TaskDTO> tasks,
        TaskSummary summary,
        PaginationInfo pagination,
        String adminId
    ) {
        return ClaimableTasksResponseDTO.builder()
            .tasks(tasks)
            .summary(summary)
            .pagination(pagination)
            .adminId(adminId)
            .retrievedAt(LocalDateTime.now())
            .build();
    }

    /**
     * Factory method for empty response
     */
    public static ClaimableTasksResponseDTO empty(String adminId) {
        return ClaimableTasksResponseDTO.builder()
            .tasks(List.of())
            .summary(TaskSummary.builder()
                .totalClaimable(0)
                .myActiveTasks(0)
                .completedToday(0)
                .germanyApplications(0)
                .usaApplications(0)
                .ukApplications(0)
                .lastUpdated(LocalDateTime.now())
                .build())
            .pagination(PaginationInfo.builder()
                .currentPage(0)
                .pageSize(10)
                .totalElements(0L)
                .totalPages(0)
                .hasNext(false)
                .hasPrevious(false)
                .numberOfElements(0)
                .first(true)
                .last(true)
                .build())
            .adminId(adminId)
            .retrievedAt(LocalDateTime.now())
            .build();
    }

    /**
     * Helper method to check if there are tasks available
     */
    public boolean hasTasks() {
        return tasks != null && !tasks.isEmpty();
    }

    /**
     * Helper method to get total claimable count
     */
    public Integer getTotalClaimableCount() {
        return summary != null ? summary.getTotalClaimable() : 0;
    }

    /**
     * Helper method to check if admin has active tasks
     */
    public boolean hasActiveTasks() {
        return summary != null && summary.getMyActiveTasks() > 0;
    }
}
