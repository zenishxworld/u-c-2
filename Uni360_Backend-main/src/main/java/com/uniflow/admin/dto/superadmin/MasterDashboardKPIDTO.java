package com.uniflow.admin.dto.superadmin;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * MasterDashboardKPIDTO - Comprehensive system-wide KPI metrics for Super Master Admin
 *
 * <p>This DTO provides a complete overview of system performance, user activity,
 * application progress, financial metrics, and operational efficiency across all portals.
 *
 * <p>Features:
 * - Real-time system overview metrics
 * - User activity and engagement statistics
 * - Application flow and conversion analytics
 * - Financial performance indicators
 * - Operational efficiency metrics
 * - Trend analysis and forecasting
 *
 * <p>Used by endpoints:
 * - GET /api/v1/superadmin/dashboard/kpis
 * - Super Master Admin dashboard overview
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
public class MasterDashboardKPIDTO {

    // ===============================
    // SYSTEM OVERVIEW METRICS
    // ===============================

    @JsonProperty("systemOverview")
    private SystemOverviewMetrics systemOverview;

    @JsonProperty("userMetrics")
    private UserMetrics userMetrics;

    @JsonProperty("applicationMetrics")
    private ApplicationMetrics applicationMetrics;

    @JsonProperty("financialMetrics")
    private FinancialMetrics financialMetrics;

    @JsonProperty("operationalMetrics")
    private OperationalMetrics operationalMetrics;

    @JsonProperty("performanceMetrics")
    private PerformanceMetrics performanceMetrics;

    // Metadata
    @JsonProperty("lastUpdated")
    private LocalDateTime lastUpdated;

    @JsonProperty("reportingPeriod")
    private String reportingPeriod;

    @JsonProperty("dataFreshness")
    private String dataFreshness;

    // ===============================
    // NESTED METRIC CLASSES
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SystemOverviewMetrics {

        @JsonProperty("totalUsers")
        private Long totalUsers;

        @JsonProperty("totalStudents")
        private Long totalStudents;

        @JsonProperty("totalAdmins")
        private Long totalAdmins;

        @JsonProperty("totalApplications")
        private Long totalApplications;

        @JsonProperty("totalUniversities")
        private Long totalUniversities;

        @JsonProperty("systemUptime")
        private String systemUptime;

        @JsonProperty("systemHealth")
        private String systemHealth; // EXCELLENT, GOOD, FAIR, POOR

        @JsonProperty("activeUsersSessions")
        private Long activeUsersSessions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserMetrics {

        @JsonProperty("newUsersToday")
        private Long newUsersToday;

        @JsonProperty("newUsersThisWeek")
        private Long newUsersThisWeek;

        @JsonProperty("newUsersThisMonth")
        private Long newUsersThisMonth;

        @JsonProperty("activeUsersToday")
        private Long activeUsersToday;

        @JsonProperty("activeUsersThisWeek")
        private Long activeUsersThisWeek;

        @JsonProperty("userGrowthRate")
        private BigDecimal userGrowthRate;

        @JsonProperty("userRetentionRate")
        private BigDecimal userRetentionRate;

        @JsonProperty("userEngagementScore")
        private BigDecimal userEngagementScore;

        @JsonProperty("usersByCountry")
        private Map<String, Long> usersByCountry;

        @JsonProperty("userGrowthTrend")
        private List<TrendDataPoint> userGrowthTrend;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ApplicationMetrics {

        @JsonProperty("totalApplicationsInProgress")
        private Long totalApplicationsInProgress;

        @JsonProperty("applicationsSubmittedToday")
        private Long applicationsSubmittedToday;

        @JsonProperty("applicationsSubmittedThisWeek")
        private Long applicationsSubmittedThisWeek;

        @JsonProperty("applicationsSubmittedThisMonth")
        private Long applicationsSubmittedThisMonth;

        @JsonProperty("applicationsCompleted")
        private Long applicationsCompleted;

        @JsonProperty("applicationSuccessRate")
        private BigDecimal applicationSuccessRate;

        @JsonProperty("averageApplicationTime")
        private String averageApplicationTime; // in days

        @JsonProperty("applicationsByStatus")
        private Map<String, Long> applicationsByStatus;

        @JsonProperty("applicationsByCountry")
        private Map<String, Long> applicationsByCountry;

        @JsonProperty("conversionFunnelData")
        private ConversionFunnelData conversionFunnelData;

        @JsonProperty("applicationTrend")
        private List<TrendDataPoint> applicationTrend;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class FinancialMetrics {

        @JsonProperty("totalRevenue")
        private BigDecimal totalRevenue;

        @JsonProperty("revenueToday")
        private BigDecimal revenueToday;

        @JsonProperty("revenueThisWeek")
        private BigDecimal revenueThisWeek;

        @JsonProperty("revenueThisMonth")
        private BigDecimal revenueThisMonth;

        @JsonProperty("revenueGrowthRate")
        private BigDecimal revenueGrowthRate;

        @JsonProperty("averageRevenuePerUser")
        private BigDecimal averageRevenuePerUser;

        @JsonProperty("pendingPayments")
        private BigDecimal pendingPayments;

        @JsonProperty("totalCommissions")
        private BigDecimal totalCommissions;

        @JsonProperty("revenueByCountry")
        private Map<String, BigDecimal> revenueByCountry;

        @JsonProperty("revenueForecast")
        private RevenueForecast revenueForecast;

        @JsonProperty("revenueTrend")
        private List<TrendDataPoint> revenueTrend;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class OperationalMetrics {

        @JsonProperty("activeAdmins")
        private Long activeAdmins;

        @JsonProperty("averageResponseTime")
        private String averageResponseTime; // in hours

        @JsonProperty("taskCompletionRate")
        private BigDecimal taskCompletionRate;

        @JsonProperty("documentApprovalRate")
        private BigDecimal documentApprovalRate;

        @JsonProperty("customerSatisfactionScore")
        private BigDecimal customerSatisfactionScore;

        @JsonProperty("supportTicketsOpen")
        private Long supportTicketsOpen;

        @JsonProperty("supportTicketsResolved")
        private Long supportTicketsResolved;

        @JsonProperty("systemErrorRate")
        private BigDecimal systemErrorRate;

        @JsonProperty("workloadDistribution")
        private Map<String, Long> workloadDistribution;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PerformanceMetrics {

        @JsonProperty("averagePageLoadTime")
        private String averagePageLoadTime; // in milliseconds

        @JsonProperty("apiResponseTime")
        private String apiResponseTime; // in milliseconds

        @JsonProperty("databaseQueryTime")
        private String databaseQueryTime; // in milliseconds

        @JsonProperty("systemResourceUsage")
        private SystemResourceUsage systemResourceUsage;

        @JsonProperty("errorRates")
        private Map<String, BigDecimal> errorRates;

        @JsonProperty("throughputMetrics")
        private ThroughputMetrics throughputMetrics;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ConversionFunnelData {

        @JsonProperty("registrations")
        private Long registrations;

        @JsonProperty("profileCompletions")
        private Long profileCompletions;

        @JsonProperty("firstApplications")
        private Long firstApplications;

        @JsonProperty("documentsUploaded")
        private Long documentsUploaded;

        @JsonProperty("applicationsSubmitted")
        private Long applicationsSubmitted;

        @JsonProperty("applicationsApproved")
        private Long applicationsApproved;

        @JsonProperty("conversionRates")
        private Map<String, BigDecimal> conversionRates;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RevenueForecast {

        @JsonProperty("nextMonthForecast")
        private BigDecimal nextMonthForecast;

        @JsonProperty("nextQuarterForecast")
        private BigDecimal nextQuarterForecast;

        @JsonProperty("nextYearForecast")
        private BigDecimal nextYearForecast;

        @JsonProperty("confidenceLevel")
        private BigDecimal confidenceLevel;

        @JsonProperty("forecastAccuracy")
        private BigDecimal forecastAccuracy;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SystemResourceUsage {

        @JsonProperty("cpuUsage")
        private BigDecimal cpuUsage;

        @JsonProperty("memoryUsage")
        private BigDecimal memoryUsage;

        @JsonProperty("diskUsage")
        private BigDecimal diskUsage;

        @JsonProperty("networkUsage")
        private BigDecimal networkUsage;

        @JsonProperty("databaseConnections")
        private Long databaseConnections;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ThroughputMetrics {

        @JsonProperty("requestsPerSecond")
        private BigDecimal requestsPerSecond;

        @JsonProperty("transactionsPerSecond")
        private BigDecimal transactionsPerSecond;

        @JsonProperty("concurrentUsers")
        private Long concurrentUsers;

        @JsonProperty("peakThroughput")
        private BigDecimal peakThroughput;
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
        private BigDecimal value;

        @JsonProperty("label")
        private String label;

        @JsonProperty("percentage")
        private BigDecimal percentage;
    }
}
