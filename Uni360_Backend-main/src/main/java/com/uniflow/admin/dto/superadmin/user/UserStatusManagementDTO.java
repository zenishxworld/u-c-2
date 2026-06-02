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
 * UserStatusManagementDTO - User status management operations for Super Master Admin
 *
 * <p>This DTO handles all user status management operations including individual user
 * status updates, bulk operations, user suspension/activation, and administrative actions.
 *
 * <p>Features:
 * - Individual user status management
 * - Bulk user operations (suspend, activate, delete)
 * - Administrative actions with audit trails
 * - Status change validation and confirmation
 * - Risk assessment for status changes
 * - Automated notifications and workflows
 *
 * <p>Used by endpoints:
 * - PUT /api/v1/superadmin/dashboard/users/{userId}/status
 * - POST /api/v1/superadmin/dashboard/users/bulk-actions
 * - GET /api/v1/superadmin/dashboard/users/{userId}/status-history
 * - Super Master Admin user management operations
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
public class UserStatusManagementDTO {

    // ===============================
    // STATUS MANAGEMENT REQUEST
    // ===============================

    @JsonProperty("userId")
    private Long userId;

    @JsonProperty("currentStatus")
    private String currentStatus;

    @JsonProperty("newStatus")
    private String newStatus;

    @JsonProperty("reason")
    private String reason;

    @JsonProperty("adminNotes")
    private String adminNotes;

    @JsonProperty("effectiveDate")
    private LocalDateTime effectiveDate;

    @JsonProperty("expiryDate")
    private LocalDateTime expiryDate;

    @JsonProperty("notifyUser")
    private Boolean notifyUser;

    @JsonProperty("sendEmail")
    private Boolean sendEmail;

    @JsonProperty("sendSms")
    private Boolean sendSms;

    // ===============================
    // BULK OPERATIONS
    // ===============================

    @JsonProperty("bulkOperation")
    private BulkOperation bulkOperation;

    @JsonProperty("statusChangeResult")
    private StatusChangeResult statusChangeResult;

    @JsonProperty("validationErrors")
    private List<ValidationError> validationErrors;

    @JsonProperty("confirmationRequired")
    private Boolean confirmationRequired;

    @JsonProperty("riskAssessment")
    private RiskAssessment riskAssessment;

    // ===============================
    // BULK OPERATION CLASS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class BulkOperation {

        @JsonProperty("operationType")
        private String operationType; // ACTIVATE, SUSPEND, DELETE, UPDATE_STATUS, RESET_PASSWORD

        @JsonProperty("userIds")
        private List<Long> userIds;

        @JsonProperty("targetStatus")
        private String targetStatus;

        @JsonProperty("reason")
        private String reason;

        @JsonProperty("adminNotes")
        private String adminNotes;

        @JsonProperty("batchSize")
        private Integer batchSize;

        @JsonProperty("notificationSettings")
        private NotificationSettings notificationSettings;

        @JsonProperty("scheduleOperation")
        private Boolean scheduleOperation;

        @JsonProperty("scheduledDate")
        private LocalDateTime scheduledDate;

        @JsonProperty("dryRun")
        private Boolean dryRun; // Preview mode without actual changes

        @JsonProperty("confirmBulkOperation")
        private Boolean confirmBulkOperation;
    }

    // ===============================
    // STATUS CHANGE RESULT
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StatusChangeResult {

        @JsonProperty("success")
        private Boolean success;

        @JsonProperty("message")
        private String message;

        @JsonProperty("operationId")
        private String operationId;

        @JsonProperty("processedUsers")
        private Integer processedUsers;

        @JsonProperty("successfulOperations")
        private Integer successfulOperations;

        @JsonProperty("failedOperations")
        private Integer failedOperations;

        @JsonProperty("skippedOperations")
        private Integer skippedOperations;

        @JsonProperty("operationSummary")
        private OperationSummary operationSummary;

        @JsonProperty("individualResults")
        private List<IndividualResult> individualResults;

        @JsonProperty("completedAt")
        private LocalDateTime completedAt;

        @JsonProperty("processingTimeMs")
        private Long processingTimeMs;

        @JsonProperty("notificationsSent")
        private Integer notificationsSent;

        @JsonProperty("auditTrailId")
        private String auditTrailId;
    }

    // ===============================
    // RISK ASSESSMENT
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RiskAssessment {

        @JsonProperty("riskLevel")
        private String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL

        @JsonProperty("riskScore")
        private Integer riskScore; // 0-100

        @JsonProperty("riskFactors")
        private List<RiskFactor> riskFactors;

        @JsonProperty("impactAssessment")
        private ImpactAssessment impactAssessment;

        @JsonProperty("recommendedAction")
        private String recommendedAction;

        @JsonProperty("requiresApproval")
        private Boolean requiresApproval;

        @JsonProperty("approvalLevel")
        private String approvalLevel; // ADMIN, SUPER_ADMIN, SYSTEM

        @JsonProperty("warnings")
        private List<String> warnings;

        @JsonProperty("preventiveActions")
        private List<String> preventiveActions;
    }

    // ===============================
    // NOTIFICATION SETTINGS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class NotificationSettings {

        @JsonProperty("notifyUsers")
        private Boolean notifyUsers;

        @JsonProperty("notifyAdmins")
        private Boolean notifyAdmins;

        @JsonProperty("emailNotification")
        private Boolean emailNotification;

        @JsonProperty("smsNotification")
        private Boolean smsNotification;

        @JsonProperty("pushNotification")
        private Boolean pushNotification;

        @JsonProperty("customMessage")
        private String customMessage;

        @JsonProperty("templateId")
        private String templateId;

        @JsonProperty("priority")
        private String priority; // LOW, NORMAL, HIGH, URGENT

        @JsonProperty("deliveryOptions")
        private Map<String, Object> deliveryOptions;
    }

    // ===============================
    // OPERATION SUMMARY
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class OperationSummary {

        @JsonProperty("totalUsers")
        private Integer totalUsers;

        @JsonProperty("statusDistribution")
        private Map<String, Integer> statusDistribution;

        @JsonProperty("operationBreakdown")
        private Map<String, Integer> operationBreakdown;

        @JsonProperty("errorBreakdown")
        private Map<String, Integer> errorBreakdown;

        @JsonProperty("timeMetrics")
        private TimeMetrics timeMetrics;

        @JsonProperty("systemImpact")
        private SystemImpact systemImpact;
    }

    // ===============================
    // INDIVIDUAL RESULT
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class IndividualResult {

        @JsonProperty("userId")
        private Long userId;

        @JsonProperty("username")
        private String username;

        @JsonProperty("email")
        private String email;

        @JsonProperty("fullName")
        private String fullName;

        @JsonProperty("success")
        private Boolean success;

        @JsonProperty("previousStatus")
        private String previousStatus;

        @JsonProperty("newStatus")
        private String newStatus;

        @JsonProperty("errorMessage")
        private String errorMessage;

        @JsonProperty("errorCode")
        private String errorCode;

        @JsonProperty("warnings")
        private List<String> warnings;

        @JsonProperty("processedAt")
        private LocalDateTime processedAt;

        @JsonProperty("notificationSent")
        private Boolean notificationSent;

        @JsonProperty("auditLogId")
        private String auditLogId;
    }

    // ===============================
    // VALIDATION ERROR
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ValidationError {

        @JsonProperty("field")
        private String field;

        @JsonProperty("code")
        private String code;

        @JsonProperty("message")
        private String message;

        @JsonProperty("userId")
        private Long userId;

        @JsonProperty("severity")
        private String severity; // ERROR, WARNING, INFO

        @JsonProperty("suggested")
        private String suggestion;

        @JsonProperty("canProceed")
        private Boolean canProceed;
    }

    // ===============================
    // RISK FACTOR
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RiskFactor {

        @JsonProperty("category")
        private String category;

        @JsonProperty("description")
        private String description;

        @JsonProperty("severity")
        private String severity; // LOW, MEDIUM, HIGH, CRITICAL

        @JsonProperty("impact")
        private String impact;

        @JsonProperty("mitigation")
        private String mitigation;

        @JsonProperty("weight")
        private Integer weight; // 1-10
    }

    // ===============================
    // IMPACT ASSESSMENT
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ImpactAssessment {

        @JsonProperty("affectedUsers")
        private Integer affectedUsers;

        @JsonProperty("affectedApplications")
        private Integer affectedApplications;

        @JsonProperty("systemLoad")
        private String systemLoad; // LOW, MEDIUM, HIGH

        @JsonProperty("dataIntegrity")
        private String dataIntegrity; // SAFE, CAUTION, RISK

        @JsonProperty("businessImpact")
        private String businessImpact; // MINIMAL, MODERATE, SIGNIFICANT, CRITICAL

        @JsonProperty("estimatedDowntime")
        private String estimatedDowntime;

        @JsonProperty("rollbackComplexity")
        private String rollbackComplexity; // SIMPLE, MODERATE, COMPLEX

        @JsonProperty("dependencies")
        private List<String> dependencies;
    }

    // ===============================
    // TIME METRICS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TimeMetrics {

        @JsonProperty("startTime")
        private LocalDateTime startTime;

        @JsonProperty("endTime")
        private LocalDateTime endTime;

        @JsonProperty("totalDurationMs")
        private Long totalDurationMs;

        @JsonProperty("averageTimePerUserMs")
        private Long averageTimePerUserMs;

        @JsonProperty("validationTimeMs")
        private Long validationTimeMs;

        @JsonProperty("executionTimeMs")
        private Long executionTimeMs;

        @JsonProperty("notificationTimeMs")
        private Long notificationTimeMs;
    }

    // ===============================
    // SYSTEM IMPACT
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SystemImpact {

        @JsonProperty("cpuUsage")
        private Double cpuUsage;

        @JsonProperty("memoryUsage")
        private Double memoryUsage;

        @JsonProperty("databaseConnections")
        private Integer databaseConnections;

        @JsonProperty("cacheHitRate")
        private Double cacheHitRate;

        @JsonProperty("apiResponseTime")
        private Long apiResponseTime;

        @JsonProperty("systemHealth")
        private String systemHealth; // OPTIMAL, GOOD, DEGRADED, CRITICAL
    }

    // ===============================
    // STATIC FACTORY METHODS
    // ===============================

    /**
     * Create a single user status change request
     */
    public static UserStatusManagementDTO createSingleUserRequest(
        Long userId,
        String currentStatus,
        String newStatus,
        String reason,
        String adminNotes
    ) {
        return UserStatusManagementDTO.builder()
            .userId(userId)
            .currentStatus(currentStatus)
            .newStatus(newStatus)
            .reason(reason)
            .adminNotes(adminNotes)
            .notifyUser(true)
            .sendEmail(true)
            .confirmationRequired(false)
            .build();
    }

    /**
     * Create a bulk operation request
     */
    public static UserStatusManagementDTO createBulkOperationRequest(
        String operationType,
        List<Long> userIds,
        String targetStatus,
        String reason,
        Boolean dryRun
    ) {
        BulkOperation bulkOp = BulkOperation.builder()
            .operationType(operationType)
            .userIds(userIds)
            .targetStatus(targetStatus)
            .reason(reason)
            .dryRun(dryRun)
            .confirmBulkOperation(false)
            .notificationSettings(NotificationSettings.builder()
                .notifyUsers(true)
                .emailNotification(true)
                .priority("NORMAL")
                .build())
            .build();

        return UserStatusManagementDTO.builder()
            .bulkOperation(bulkOp)
            .confirmationRequired(true)
            .build();
    }

    /**
     * Create a successful operation result
     */
    public static StatusChangeResult createSuccessResult(
        String operationId,
        Integer processedUsers,
        Integer successfulOps,
        Long processingTime
    ) {
        return StatusChangeResult.builder()
            .success(true)
            .message("Operation completed successfully")
            .operationId(operationId)
            .processedUsers(processedUsers)
            .successfulOperations(successfulOps)
            .failedOperations(0)
            .completedAt(LocalDateTime.now())
            .processingTimeMs(processingTime)
            .build();
    }
}
