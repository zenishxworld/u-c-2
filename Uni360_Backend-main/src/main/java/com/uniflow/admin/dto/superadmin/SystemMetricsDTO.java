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
 * SystemMetricsDTO - Focused system performance and health metrics
 *
 * <p>This DTO provides detailed system performance metrics, health indicators,
 * and operational statistics for Super Master Admin monitoring and analysis.
 *
 * <p>Features:
 * - Real-time system health monitoring
 * - Performance benchmarks and thresholds
 * - Resource utilization tracking
 * - Error rates and system stability
 * - Capacity planning metrics
 * - Historical trend analysis
 *
 * <p>Used by endpoints:
 * - GET /api/v1/superadmin/system/metrics
 * - GET /api/v1/superadmin/dashboard/system-overview
 * - System monitoring and alerting
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
public class SystemMetricsDTO {

    // ===============================
    // SYSTEM HEALTH INDICATORS
    // ===============================

    @JsonProperty("systemHealth")
    private SystemHealthStatus systemHealth;

    @JsonProperty("systemUptime")
    private SystemUptimeMetrics systemUptime;

    @JsonProperty("performanceMetrics")
    private PerformanceMetrics performanceMetrics;

    @JsonProperty("resourceUtilization")
    private ResourceUtilization resourceUtilization;

    @JsonProperty("errorMetrics")
    private ErrorMetrics errorMetrics;

    @JsonProperty("capacityMetrics")
    private CapacityMetrics capacityMetrics;

    // Metadata
    @JsonProperty("lastUpdated")
    private LocalDateTime lastUpdated;

    @JsonProperty("monitoringPeriod")
    private String monitoringPeriod;

    @JsonProperty("alertsActive")
    private Integer alertsActive;

    // ===============================
    // NESTED METRIC CLASSES
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SystemHealthStatus {

        @JsonProperty("overallStatus")
        private String overallStatus; // EXCELLENT, GOOD, WARNING, CRITICAL

        @JsonProperty("statusScore")
        private BigDecimal statusScore; // 0-100

        @JsonProperty("availabilityPercentage")
        private BigDecimal availabilityPercentage;

        @JsonProperty("reliabilityScore")
        private BigDecimal reliabilityScore;

        @JsonProperty("healthIndicators")
        private Map<String, String> healthIndicators;

        @JsonProperty("criticalIssues")
        private List<String> criticalIssues;

        @JsonProperty("warnings")
        private List<String> warnings;

        @JsonProperty("lastHealthCheck")
        private LocalDateTime lastHealthCheck;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SystemUptimeMetrics {

        @JsonProperty("currentUptime")
        private String currentUptime; // e.g., "15 days, 8 hours, 32 minutes"

        @JsonProperty("uptimePercentage24h")
        private BigDecimal uptimePercentage24h;

        @JsonProperty("uptimePercentage7d")
        private BigDecimal uptimePercentage7d;

        @JsonProperty("uptimePercentage30d")
        private BigDecimal uptimePercentage30d;

        @JsonProperty("lastDowntime")
        private LocalDateTime lastDowntime;

        @JsonProperty("downtimeDuration")
        private String downtimeDuration;

        @JsonProperty("plannedMaintenanceScheduled")
        private Boolean plannedMaintenanceScheduled;

        @JsonProperty("nextMaintenanceWindow")
        private LocalDateTime nextMaintenanceWindow;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PerformanceMetrics {

        @JsonProperty("averageResponseTime")
        private BigDecimal averageResponseTime; // milliseconds

        @JsonProperty("p95ResponseTime")
        private BigDecimal p95ResponseTime;

        @JsonProperty("p99ResponseTime")
        private BigDecimal p99ResponseTime;

        @JsonProperty("requestsPerSecond")
        private BigDecimal requestsPerSecond;

        @JsonProperty("throughputMbps")
        private BigDecimal throughputMbps;

        @JsonProperty("concurrentUsers")
        private Long concurrentUsers;

        @JsonProperty("peakConcurrentUsers")
        private Long peakConcurrentUsers;

        @JsonProperty("databaseResponseTime")
        private BigDecimal databaseResponseTime;

        @JsonProperty("cacheHitRate")
        private BigDecimal cacheHitRate;

        @JsonProperty("performanceTrend")
        private List<TrendPoint> performanceTrend;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ResourceUtilization {

        @JsonProperty("cpuUsage")
        private ResourceUsageDetail cpuUsage;

        @JsonProperty("memoryUsage")
        private ResourceUsageDetail memoryUsage;

        @JsonProperty("diskUsage")
        private ResourceUsageDetail diskUsage;

        @JsonProperty("networkUsage")
        private ResourceUsageDetail networkUsage;

        @JsonProperty("databaseConnections")
        private ConnectionPoolDetail databaseConnections;

        @JsonProperty("threadPoolUsage")
        private ThreadPoolDetail threadPoolUsage;

        @JsonProperty("jvmMetrics")
        private JvmMetrics jvmMetrics;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorMetrics {

        @JsonProperty("errorRate")
        private BigDecimal errorRate; // percentage

        @JsonProperty("totalErrors24h")
        private Long totalErrors24h;

        @JsonProperty("errorsByType")
        private Map<String, Long> errorsByType;

        @JsonProperty("errorsByEndpoint")
        private Map<String, Long> errorsByEndpoint;

        @JsonProperty("criticalErrors")
        private Long criticalErrors;

        @JsonProperty("warningErrors")
        private Long warningErrors;

        @JsonProperty("httpStatusCodes")
        private Map<String, Long> httpStatusCodes;

        @JsonProperty("errorTrend")
        private List<TrendPoint> errorTrend;

        @JsonProperty("topErrors")
        private List<ErrorDetail> topErrors;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CapacityMetrics {

        @JsonProperty("userCapacity")
        private CapacityDetail userCapacity;

        @JsonProperty("applicationCapacity")
        private CapacityDetail applicationCapacity;

        @JsonProperty("storageCapacity")
        private CapacityDetail storageCapacity;

        @JsonProperty("networkCapacity")
        private CapacityDetail networkCapacity;

        @JsonProperty("scalingRecommendations")
        private List<String> scalingRecommendations;

        @JsonProperty("capacityAlerts")
        private List<String> capacityAlerts;

        @JsonProperty("growthProjections")
        private Map<String, BigDecimal> growthProjections;
    }

    // ===============================
    // SUPPORTING DETAIL CLASSES
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ResourceUsageDetail {

        @JsonProperty("current")
        private BigDecimal current; // percentage

        @JsonProperty("average24h")
        private BigDecimal average24h;

        @JsonProperty("peak24h")
        private BigDecimal peak24h;

        @JsonProperty("threshold")
        private BigDecimal threshold;

        @JsonProperty("status")
        private String status; // NORMAL, WARNING, CRITICAL

        @JsonProperty("trend")
        private String trend; // INCREASING, DECREASING, STABLE
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ConnectionPoolDetail {

        @JsonProperty("activeConnections")
        private Long activeConnections;

        @JsonProperty("maxConnections")
        private Long maxConnections;

        @JsonProperty("idleConnections")
        private Long idleConnections;

        @JsonProperty("waitingRequests")
        private Long waitingRequests;

        @JsonProperty("utilizationPercentage")
        private BigDecimal utilizationPercentage;

        @JsonProperty("averageAcquisitionTime")
        private BigDecimal averageAcquisitionTime;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ThreadPoolDetail {

        @JsonProperty("activeThreads")
        private Long activeThreads;

        @JsonProperty("maxThreads")
        private Long maxThreads;

        @JsonProperty("queuedTasks")
        private Long queuedTasks;

        @JsonProperty("completedTasks")
        private Long completedTasks;

        @JsonProperty("utilizationPercentage")
        private BigDecimal utilizationPercentage;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class JvmMetrics {

        @JsonProperty("heapUsage")
        private ResourceUsageDetail heapUsage;

        @JsonProperty("nonHeapUsage")
        private ResourceUsageDetail nonHeapUsage;

        @JsonProperty("gcCount")
        private Long gcCount;

        @JsonProperty("gcTime")
        private BigDecimal gcTime;

        @JsonProperty("classesLoaded")
        private Long classesLoaded;

        @JsonProperty("threadsActive")
        private Long threadsActive;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CapacityDetail {

        @JsonProperty("current")
        private Long current;

        @JsonProperty("maximum")
        private Long maximum;

        @JsonProperty("utilizationPercentage")
        private BigDecimal utilizationPercentage;

        @JsonProperty("projectedGrowth")
        private BigDecimal projectedGrowth;

        @JsonProperty("timeToCapacity")
        private String timeToCapacity;

        @JsonProperty("recommendedAction")
        private String recommendedAction;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorDetail {

        @JsonProperty("errorType")
        private String errorType;

        @JsonProperty("errorMessage")
        private String errorMessage;

        @JsonProperty("occurrences")
        private Long occurrences;

        @JsonProperty("lastOccurrence")
        private LocalDateTime lastOccurrence;

        @JsonProperty("severity")
        private String severity;

        @JsonProperty("endpoint")
        private String endpoint;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TrendPoint {

        @JsonProperty("timestamp")
        private LocalDateTime timestamp;

        @JsonProperty("value")
        private BigDecimal value;

        @JsonProperty("label")
        private String label;
    }
}
