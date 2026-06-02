package com.uniflow.admin.dto.superadmin.user;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * UserActivityLogsDTO - Comprehensive user activity tracking and audit trails for Super Master Admin
 *
 * <p>This DTO provides detailed activity logs, audit trails, and behavioral analytics
 * for comprehensive user monitoring and security oversight.
 *
 * <p>Features:
 * - Complete activity log tracking with pagination
 * - Security event monitoring and alerts
 * - User behavior pattern analysis
 * - System access and permission audits
 * - Session management and tracking
 * - Suspicious activity detection
 *
 * <p>Used by endpoints:
 * - GET /api/v1/superadmin/dashboard/users/{userId}/activity-logs
 * - GET /api/v1/superadmin/dashboard/users/activity-overview
 * - GET /api/v1/superadmin/dashboard/users/security-events
 * - Super Master Admin user monitoring dashboard
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
public class UserActivityLogsDTO {

    // ===============================
    // ACTIVITY LOGS & PAGINATION
    // ===============================

    @JsonProperty("activityLogs")
    private List<ActivityLog> activityLogs;

    @JsonProperty("pagination")
    private PaginationInfo pagination;

    @JsonProperty("filters")
    private ActivityFilters filters;

    @JsonProperty("summary")
    private ActivitySummary summary;

    @JsonProperty("securityAlerts")
    private List<SecurityAlert> securityAlerts;

    // Metadata
    @JsonProperty("userId")
    private Long userId;

    @JsonProperty("userInfo")
    private UserInfo userInfo;

    @JsonProperty("lastUpdated")
    private LocalDateTime lastUpdated;

    @JsonProperty("reportingPeriod")
    private String reportingPeriod;

    @JsonProperty("totalLogs")
    private Long totalLogs;

    // ===============================
    // ACTIVITY LOG CLASS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ActivityLog {

        @JsonProperty("id")
        private String id;

        @JsonProperty("userId")
        private Long userId;

        @JsonProperty("username")
        private String username;

        @JsonProperty("activityType")
        private String activityType; // LOGIN, LOGOUT, PROFILE_UPDATE, APPLICATION_SUBMIT, etc.

        @JsonProperty("action")
        private String action;

        @JsonProperty("description")
        private String description;

        @JsonProperty("timestamp")
        private LocalDateTime timestamp;

        @JsonProperty("ipAddress")
        private String ipAddress;

        @JsonProperty("userAgent")
        private String userAgent;

        @JsonProperty("sessionId")
        private String sessionId;

        @JsonProperty("deviceInfo")
        private DeviceInfo deviceInfo;

        @JsonProperty("location")
        private LocationInfo location;

        @JsonProperty("resource")
        private String resource; // API endpoint or page accessed

        @JsonProperty("method")
        private String method; // GET, POST, PUT, DELETE

        @JsonProperty("statusCode")
        private Integer statusCode;

        @JsonProperty("responseTime")
        private Long responseTime; // in milliseconds

        @JsonProperty("dataChanges")
        private Map<String, Object> dataChanges; // before/after values

        @JsonProperty("riskLevel")
        private String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL

        @JsonProperty("severity")
        private String severity; // INFO, WARNING, ERROR, CRITICAL

        @JsonProperty("tags")
        private List<String> tags;

        @JsonProperty("metadata")
        private Map<String, Object> metadata;

        @JsonProperty("relatedLogs")
        private List<String> relatedLogs; // IDs of related activity logs

        @JsonProperty("auditTrail")
        private AuditTrail auditTrail;
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
    // ACTIVITY FILTERS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ActivityFilters {

        @JsonProperty("availableActivityTypes")
        private List<String> availableActivityTypes;

        @JsonProperty("availableSeverityLevels")
        private List<String> availableSeverityLevels;

        @JsonProperty("availableRiskLevels")
        private List<String> availableRiskLevels;

        @JsonProperty("dateRangeOptions")
        private List<DateRangeOption> dateRangeOptions;

        @JsonProperty("deviceTypes")
        private List<String> deviceTypes;

        @JsonProperty("locations")
        private List<String> locations;

        @JsonProperty("resources")
        private List<String> resources;

        @JsonProperty("sortingOptions")
        private List<SortingOption> sortingOptions;
    }

    // ===============================
    // ACTIVITY SUMMARY
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ActivitySummary {

        @JsonProperty("totalActivities")
        private Long totalActivities;

        @JsonProperty("uniqueSessions")
        private Long uniqueSessions;

        @JsonProperty("totalLogins")
        private Long totalLogins;

        @JsonProperty("failedLogins")
        private Long failedLogins;

        @JsonProperty("suspiciousActivities")
        private Long suspiciousActivities;

        @JsonProperty("highRiskActivities")
        private Long highRiskActivities;

        @JsonProperty("activitiesByType")
        private Map<String, Long> activitiesByType;

        @JsonProperty("activitiesBySeverity")
        private Map<String, Long> activitiesBySeverity;

        @JsonProperty("activitiesByRiskLevel")
        private Map<String, Long> activitiesByRiskLevel;

        @JsonProperty("activitiesByDevice")
        private Map<String, Long> activitiesByDevice;

        @JsonProperty("activitiesByLocation")
        private Map<String, Long> activitiesByLocation;

        @JsonProperty("activityTrend")
        private List<TrendDataPoint> activityTrend;

        @JsonProperty("peakActivityHours")
        private Map<String, Long> peakActivityHours;

        @JsonProperty("averageSessionDuration")
        private String averageSessionDuration;

        @JsonProperty("mostAccessedResources")
        private List<ResourceAccess> mostAccessedResources;

        @JsonProperty("securityScore")
        private Integer securityScore; // 0-100

        @JsonProperty("behaviorScore")
        private Integer behaviorScore; // 0-100

        @JsonProperty("complianceScore")
        private Integer complianceScore; // 0-100
    }

    // ===============================
    // SECURITY ALERT
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SecurityAlert {

        @JsonProperty("id")
        private String id;

        @JsonProperty("alertType")
        private String alertType; // SUSPICIOUS_LOGIN, MULTIPLE_FAILED_LOGINS, UNUSUAL_ACTIVITY, etc.

        @JsonProperty("severity")
        private String severity; // LOW, MEDIUM, HIGH, CRITICAL

        @JsonProperty("title")
        private String title;

        @JsonProperty("description")
        private String description;

        @JsonProperty("detectedAt")
        private LocalDateTime detectedAt;

        @JsonProperty("userId")
        private Long userId;

        @JsonProperty("relatedActivityIds")
        private List<String> relatedActivityIds;

        @JsonProperty("riskScore")
        private Integer riskScore; // 0-100

        @JsonProperty("status")
        private String status; // OPEN, INVESTIGATING, RESOLVED, FALSE_POSITIVE

        @JsonProperty("assignedTo")
        private String assignedTo;

        @JsonProperty("resolution")
        private String resolution;

        @JsonProperty("resolvedAt")
        private LocalDateTime resolvedAt;

        @JsonProperty("actionsTaken")
        private List<String> actionsTaken;

        @JsonProperty("preventionMeasures")
        private List<String> preventionMeasures;

        @JsonProperty("evidence")
        private Map<String, Object> evidence;
    }

    // ===============================
    // USER INFO
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserInfo {

        @JsonProperty("id")
        private Long id;

        @JsonProperty("username")
        private String username;

        @JsonProperty("email")
        private String email;

        @JsonProperty("fullName")
        private String fullName;

        @JsonProperty("userType")
        private String userType;

        @JsonProperty("status")
        private String status;

        @JsonProperty("createdAt")
        private LocalDateTime createdAt;

        @JsonProperty("lastLoginAt")
        private LocalDateTime lastLoginAt;

        @JsonProperty("emailVerified")
        private Boolean emailVerified;

        @JsonProperty("phoneVerified")
        private Boolean phoneVerified;

        @JsonProperty("twoFactorEnabled")
        private Boolean twoFactorEnabled;
    }

    // ===============================
    // DEVICE INFO
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DeviceInfo {

        @JsonProperty("deviceType")
        private String deviceType; // DESKTOP, MOBILE, TABLET

        @JsonProperty("browser")
        private String browser;

        @JsonProperty("browserVersion")
        private String browserVersion;

        @JsonProperty("operatingSystem")
        private String operatingSystem;

        @JsonProperty("osVersion")
        private String osVersion;

        @JsonProperty("screenResolution")
        private String screenResolution;

        @JsonProperty("deviceFingerprint")
        private String deviceFingerprint;

        @JsonProperty("isTrustedDevice")
        private Boolean isTrustedDevice;

        @JsonProperty("isNewDevice")
        private Boolean isNewDevice;

        @JsonProperty("lastSeenAt")
        private LocalDateTime lastSeenAt;
    }

    // ===============================
    // LOCATION INFO
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class LocationInfo {

        @JsonProperty("country")
        private String country;

        @JsonProperty("countryCode")
        private String countryCode;

        @JsonProperty("region")
        private String region;

        @JsonProperty("city")
        private String city;

        @JsonProperty("timezone")
        private String timezone;

        @JsonProperty("isp")
        private String isp;

        @JsonProperty("organization")
        private String organization;

        @JsonProperty("latitude")
        private Double latitude;

        @JsonProperty("longitude")
        private Double longitude;

        @JsonProperty("isVpn")
        private Boolean isVpn;

        @JsonProperty("isProxy")
        private Boolean isProxy;

        @JsonProperty("isTor")
        private Boolean isTor;

        @JsonProperty("riskLevel")
        private String riskLevel; // LOW, MEDIUM, HIGH

        @JsonProperty("isKnownLocation")
        private Boolean isKnownLocation;
    }

    // ===============================
    // AUDIT TRAIL
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AuditTrail {

        @JsonProperty("createdBy")
        private String createdBy;

        @JsonProperty("createdAt")
        private LocalDateTime createdAt;

        @JsonProperty("source")
        private String source; // SYSTEM, USER, ADMIN, API

        @JsonProperty("correlationId")
        private String correlationId;

        @JsonProperty("traceId")
        private String traceId;

        @JsonProperty("parentActivityId")
        private String parentActivityId;

        @JsonProperty("childActivities")
        private List<String> childActivities;

        @JsonProperty("retentionPeriod")
        private String retentionPeriod;

        @JsonProperty("complianceFlags")
        private List<String> complianceFlags; // GDPR, HIPAA, SOX, etc.
    }

    // ===============================
    // SUPPORTING CLASSES
    // ===============================

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
    public static class ResourceAccess {

        @JsonProperty("resource")
        private String resource;

        @JsonProperty("path")
        private String path;

        @JsonProperty("method")
        private String method;

        @JsonProperty("accessCount")
        private Long accessCount;

        @JsonProperty("uniqueUsers")
        private Long uniqueUsers;

        @JsonProperty("averageResponseTime")
        private Long averageResponseTime;

        @JsonProperty("errorRate")
        private Double errorRate;

        @JsonProperty("lastAccessed")
        private LocalDateTime lastAccessed;
    }

    // ===============================
    // STATIC FACTORY METHODS
    // ===============================

    /**
     * Create activity logs response for a specific user
     */
    public static UserActivityLogsDTO createUserActivityResponse(
        Long userId,
        List<ActivityLog> logs,
        PaginationInfo pagination,
        ActivitySummary summary
    ) {
        return UserActivityLogsDTO.builder()
            .userId(userId)
            .activityLogs(logs)
            .pagination(pagination)
            .summary(summary)
            .lastUpdated(LocalDateTime.now())
            .totalLogs((long) logs.size())
            .build();
    }

    /**
     * Create security alert for suspicious activity
     */
    public static SecurityAlert createSecurityAlert(
        String alertType,
        String severity,
        String title,
        String description,
        Long userId
    ) {
        return SecurityAlert.builder()
            .alertType(alertType)
            .severity(severity)
            .title(title)
            .description(description)
            .userId(userId)
            .detectedAt(LocalDateTime.now())
            .status("OPEN")
            .riskScore(
                severity.equals("CRITICAL") ? 90 :
                severity.equals("HIGH") ? 70 :
                severity.equals("MEDIUM") ? 50 : 30
            )
            .build();
    }

    /**
     * Create activity log entry
     */
    public static ActivityLog createActivityLog(
        Long userId,
        String activityType,
        String action,
        String description,
        String ipAddress,
        String userAgent
    ) {
        return ActivityLog.builder()
            .userId(userId)
            .activityType(activityType)
            .action(action)
            .description(description)
            .timestamp(LocalDateTime.now())
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .riskLevel("LOW")
            .severity("INFO")
            .build();
    }
}
