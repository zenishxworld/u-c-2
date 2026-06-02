package com.uniflow.admin.dto.superadmin.application;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * ApplicationOverviewDTO - Comprehensive application oversight for Super Master Admin
 *
 * <p>This DTO provides a complete overview of all applications in the system with advanced
 * filtering, monitoring, and analytics capabilities for application oversight operations.
 *
 * <p>Features:
 * - Complete application listing with pagination
 * - Advanced filtering by status, workflow stage, university, admin
 * - Real-time application metrics and performance indicators
 * - Workflow bottleneck identification
 * - Admin workload distribution analytics
 * - Application processing time analysis
 *
 * <p>Used by endpoints:
 * - GET /api/v1/superadmin/dashboard/applications
 * - GET /api/v1/superadmin/dashboard/applications/overview
 * - Super Master Admin application monitoring dashboard
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-12
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApplicationOverviewDTO {

    // ===============================
    // APPLICATION LISTING & PAGINATION
    // ===============================

    @JsonProperty("applications")
    private List<ApplicationSummary> applications;

    @JsonProperty("pagination")
    private PaginationInfo pagination;

    @JsonProperty("filters")
    private FilterOptions filters;

    @JsonProperty("summary")
    private ApplicationSummaryStats summary;

    @JsonProperty("workflowAnalysis")
    private WorkflowAnalysis workflowAnalysis;

    // Metadata
    @JsonProperty("lastUpdated")
    private LocalDateTime lastUpdated;

    @JsonProperty("totalCount")
    private Long totalCount;

    @JsonProperty("filteredCount")
    private Long filteredCount;

    // ===============================
    // APPLICATION SUMMARY CLASS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ApplicationSummary {

        @JsonProperty("id")
        private UUID id;

        @JsonProperty("referenceNumber")
        private String referenceNumber;

        @JsonProperty("studentId")
        private Long studentId;

        @JsonProperty("studentName")
        private String studentName;

        @JsonProperty("studentEmail")
        private String studentEmail;

        @JsonProperty("studentPhone")
        private String studentPhone;


        @JsonProperty("universityId")
        private UUID universityId;

        @JsonProperty("universityName")
        private String universityName;

        @JsonProperty("courseId")
        private UUID courseId;

        @JsonProperty("courseName")
        private String courseName;

        @JsonProperty("status")
        private String status; // DRAFT, SUBMITTED, UNDER_REVIEW, COMPLETED, REJECTED

        @JsonProperty("workflowStage")
        private String workflowStage; // INITIAL, DOCUMENTS, REVIEW, FINAL

        @JsonProperty("assignedAdminId")
        private Long assignedAdminId;

        @JsonProperty("assignedAdminName")
        private String assignedAdminName;

        @JsonProperty("assignedAdminEmail")
        private String assignedAdminEmail;

        @JsonProperty("priority")
        private String priority; // LOW, NORMAL, HIGH, URGENT

        @JsonProperty("isUrgent")
        private Boolean isUrgent;

        @JsonProperty("deadline")
        private LocalDateTime deadline;

        @JsonProperty("createdAt")
        private LocalDateTime createdAt;

        @JsonProperty("submittedAt")
        private LocalDateTime submittedAt;

        @JsonProperty("lastUpdatedAt")
        private LocalDateTime lastUpdatedAt;

        @JsonProperty("processingTimeHours")
        private Long processingTimeHours;

        @JsonProperty("stageCompletionPercentage")
        private Integer stageCompletionPercentage; // 0-100

        @JsonProperty("documentsUploaded")
        private Integer documentsUploaded;

        @JsonProperty("documentsRequired")
        private Integer documentsRequired;

        @JsonProperty("paymentCompleted")
        private Boolean paymentCompleted;

        @JsonProperty("documentsVerified")
        private Boolean documentsVerified;

        @JsonProperty("isOverdue")
        private Boolean isOverdue;

        @JsonProperty("daysInCurrentStage")
        private Long daysInCurrentStage;

        @JsonProperty("estimatedCompletionDate")
        private LocalDateTime estimatedCompletionDate;

        @JsonProperty("riskLevel")
        private String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL

        @JsonProperty("flags")
        private List<String> flags; // DELAYED, INCOMPLETE_DOCS, PAYMENT_PENDING, etc.

        @JsonProperty("notes")
        private String notes;
    }

    // ===============================
    // PAGINATION INFO
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PaginationInfo {

        @JsonProperty("currentPage")
        private Integer currentPage;

        @JsonProperty("pageSize")
        private Integer pageSize;

        @JsonProperty("totalPages")
        private Integer totalPages;

        @JsonProperty("totalElements")
        private Long totalElements;

        @JsonProperty("hasNext")
        private Boolean hasNext;

        @JsonProperty("hasPrevious")
        private Boolean hasPrevious;

        @JsonProperty("isFirst")
        private Boolean isFirst;

        @JsonProperty("isLast")
        private Boolean isLast;
    }

    // ===============================
    // FILTER OPTIONS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class FilterOptions {

        @JsonProperty("availableStatuses")
        private List<String> availableStatuses;

        @JsonProperty("availableWorkflowStages")
        private List<String> availableWorkflowStages;

        @JsonProperty("availablePriorities")
        private List<String> availablePriorities;

        @JsonProperty("availableRiskLevels")
        private List<String> availableRiskLevels;

        @JsonProperty("availableUniversities")
        private List<UniversityOption> availableUniversities;

        @JsonProperty("availableAdmins")
        private List<AdminOption> availableAdmins;

        @JsonProperty("availableFlags")
        private List<String> availableFlags;

        @JsonProperty("dateRangeOptions")
        private List<DateRangeOption> dateRangeOptions;

        @JsonProperty("sortingOptions")
        private List<SortingOption> sortingOptions;
    }

    // ===============================
    // APPLICATION SUMMARY STATISTICS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ApplicationSummaryStats {

        @JsonProperty("totalApplications")
        private Long totalApplications;

        @JsonProperty("draftApplications")
        private Long draftApplications;

        @JsonProperty("submittedApplications")
        private Long submittedApplications;

        @JsonProperty("underReviewApplications")
        private Long underReviewApplications;

        @JsonProperty("completedApplications")
        private Long completedApplications;

        @JsonProperty("rejectedApplications")
        private Long rejectedApplications;

        @JsonProperty("urgentApplications")
        private Long urgentApplications;

        @JsonProperty("overdueApplications")
        private Long overdueApplications;

        @JsonProperty("unassignedApplications")
        private Long unassignedApplications;

        @JsonProperty("applicationsCreatedToday")
        private Long applicationsCreatedToday;

        @JsonProperty("applicationsCreatedThisWeek")
        private Long applicationsCreatedThisWeek;

        @JsonProperty("applicationsCreatedThisMonth")
        private Long applicationsCreatedThisMonth;

        @JsonProperty("averageProcessingTimeHours")
        private Double averageProcessingTimeHours;

        @JsonProperty("successRate")
        private Double successRate; // percentage of completed vs total

        @JsonProperty("applicationsByUniversity")
        private Map<String, Long> applicationsByUniversity;

        @JsonProperty("applicationsByWorkflowStage")
        private Map<String, Long> applicationsByWorkflowStage;

        @JsonProperty("applicationsByRiskLevel")
        private Map<String, Long> applicationsByRiskLevel;

        @JsonProperty("adminWorkloadDistribution")
        private Map<String, Long> adminWorkloadDistribution;

        @JsonProperty("processingTrend")
        private List<TrendDataPoint> processingTrend;
    }

    // ===============================
    // WORKFLOW ANALYSIS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class WorkflowAnalysis {

        @JsonProperty("bottlenecks")
        private List<BottleneckInfo> bottlenecks;

        @JsonProperty("stagePerformance")
        private List<StagePerformance> stagePerformance;

        @JsonProperty("workflowEfficiency")
        private WorkflowEfficiency workflowEfficiency;

        @JsonProperty("resourceUtilization")
        private ResourceUtilization resourceUtilization;
    }

    // ===============================
    // SUPPORTING CLASSES
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UniversityOption {

        @JsonProperty("id")
        private UUID id;

        @JsonProperty("name")
        private String name;

        @JsonProperty("country")
        private String country;

        @JsonProperty("applicationCount")
        private Long applicationCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AdminOption {

        @JsonProperty("id")
        private UUID id;

        @JsonProperty("name")
        private String name;

        @JsonProperty("email")
        private String email;

        @JsonProperty("assignedApplications")
        private Long assignedApplications;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DateRangeOption {

        @JsonProperty("label")
        private String label;

        @JsonProperty("value")
        private String value;

        @JsonProperty("startDate")
        private LocalDateTime startDate;

        @JsonProperty("endDate")
        private LocalDateTime endDate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SortingOption {

        @JsonProperty("label")
        private String label;

        @JsonProperty("field")
        private String field;

        @JsonProperty("direction")
        private String direction; // ASC, DESC

        @JsonProperty("isDefault")
        private Boolean isDefault;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TrendDataPoint {

        @JsonProperty("date")
        private String date;

        @JsonProperty("value")
        private Long value;

        @JsonProperty("label")
        private String label;

        @JsonProperty("changeFromPrevious")
        private Long changeFromPrevious;

        @JsonProperty("percentageChange")
        private Double percentageChange;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class BottleneckInfo {

        @JsonProperty("stage")
        private String stage;

        @JsonProperty("averageTimeHours")
        private Double averageTimeHours;

        @JsonProperty("applicationsStuck")
        private Long applicationsStuck;

        @JsonProperty("severity")
        private String severity; // LOW, MEDIUM, HIGH, CRITICAL

        @JsonProperty("recommendedAction")
        private String recommendedAction;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StagePerformance {

        @JsonProperty("stage")
        private String stage;

        @JsonProperty("totalApplications")
        private Long totalApplications;

        @JsonProperty("averageCompletionTimeHours")
        private Double averageCompletionTimeHours;

        @JsonProperty("successRate")
        private Double successRate;

        @JsonProperty("throughput")
        private Double throughput; // applications per day

        @JsonProperty("efficiency")
        private String efficiency; // EXCELLENT, GOOD, AVERAGE, POOR
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class WorkflowEfficiency {

        @JsonProperty("overallEfficiency")
        private Double overallEfficiency; // 0-100

        @JsonProperty("averageApplicationLifecycle")
        private Double averageApplicationLifecycle; // days

        @JsonProperty("automationRate")
        private Double automationRate; // percentage

        @JsonProperty("manualInterventionRate")
        private Double manualInterventionRate; // percentage

        @JsonProperty("errorRate")
        private Double errorRate; // percentage

        @JsonProperty("retryRate")
        private Double retryRate; // percentage
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ResourceUtilization {

        @JsonProperty("adminUtilization")
        private Map<String, Double> adminUtilization; // admin -> utilization percentage

        @JsonProperty("averageWorkload")
        private Double averageWorkload;

        @JsonProperty("overloadedAdmins")
        private List<String> overloadedAdmins;

        @JsonProperty("underutilizedAdmins")
        private List<String> underutilizedAdmins;

        @JsonProperty("recommendedRebalancing")
        private List<String> recommendedRebalancing;
    }
}
