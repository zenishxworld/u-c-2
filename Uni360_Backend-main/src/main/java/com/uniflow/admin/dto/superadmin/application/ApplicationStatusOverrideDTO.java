package com.uniflow.admin.dto.superadmin.application;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ApplicationStatusOverrideDTO - Application status override management for Super Master Admin
 *
 * <p>This DTO handles all application status override operations including emergency status
 * changes, workflow bypasses, and administrative interventions in the application process.
 *
 * <p>Features:
 * - Emergency application status overrides
 * - Workflow stage bypassing with audit trails
 * - Bulk application status changes
 * - Override validation and authorization
 * - Administrative intervention tracking
 * - Rollback capabilities for status changes
 *
 * <p>Used by endpoints:
 * - PUT /api/v1/superadmin/dashboard/applications/{applicationId}/override
 * - POST /api/v1/superadmin/dashboard/applications/bulk-override
 * - GET /api/v1/superadmin/dashboard/applications/override-history
 * - Super Master Admin application status override operations
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
public class ApplicationStatusOverrideDTO {

    // ===============================
    // OVERRIDE REQUEST DETAILS
    // ===============================

    @JsonProperty("applicationId")
    private UUID applicationId;

    @JsonProperty("currentStatus")
    private String currentStatus;

    @JsonProperty("targetStatus")
    private String targetStatus;

    @JsonProperty("currentWorkflowStage")
    private String currentWorkflowStage;

    @JsonProperty("targetWorkflowStage")
    private String targetWorkflowStage;

    @JsonProperty("overrideType")
    private String overrideType; // STATUS_CHANGE, STAGE_BYPASS, WORKFLOW_RESET, EMERGENCY_APPROVAL

    @JsonProperty("overrideReason")
    private String overrideReason;

    @JsonProperty("justification")
    private String justification;

    @JsonProperty("adminNotes")
    private String adminNotes;

    @JsonProperty("emergencyFlag")
    private Boolean emergencyFlag;

    @JsonProperty("bypassWorkflowValidation")
    private Boolean bypassWorkflowValidation;

    @JsonProperty("notifyStakeholders")
    private Boolean notifyStakeholders;

    @JsonProperty("effectiveDate")
    private LocalDateTime effectiveDate;

    @JsonProperty("expiryDate")
    private LocalDateTime expiryDate;

    // ===============================
    // BULK OVERRIDE OPERATIONS
    // ===============================

    @JsonProperty("bulkOverride")
    private BulkOverrideOperation bulkOverride;

    @JsonProperty("overrideResult")
    private OverrideResult overrideResult;

    @JsonProperty("validationErrors")
    private List<ValidationError> validationErrors;

    @JsonProperty("authorizationRequired")
    private Boolean authorizationRequired;

    @JsonProperty("riskAssessment")
    private OverrideRiskAssessment riskAssessment;

    // ===============================
    // BULK OVERRIDE OPERATION CLASS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class BulkOverrideOperation {

        @JsonProperty("operationType")
        private String operationType; // BULK_STATUS_CHANGE, BULK_STAGE_ADVANCE, BULK_APPROVAL

        @JsonProperty("applicationIds")
        private List<UUID> applicationIds;

        @JsonProperty("targetStatus")
        private String targetStatus;

        @JsonProperty("targetWorkflowStage")
        private String targetWorkflowStage;

        @JsonProperty("selectionCriteria")
        private SelectionCriteria selectionCriteria;

        @JsonProperty("overrideReason")
        private String overrideReason;

        @JsonProperty("batchSize")
        private Integer batchSize;

        @JsonProperty("processingMode")
        private String processingMode; // SEQUENTIAL, PARALLEL, BATCH

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

        @JsonProperty("rollbackPlan")
        private RollbackPlan rollbackPlan;
    }

    // ===============================
    // OVERRIDE RESULT
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class OverrideResult {

        @JsonProperty("success")
        private Boolean success;

        @JsonProperty("message")
        private String message;

        @JsonProperty("operationId")
        private String operationId;

        @JsonProperty("processedApplications")
        private Integer processedApplications;

        @JsonProperty("successfulOverrides")
        private Integer successfulOverrides;

        @JsonProperty("failedOverrides")
        private Integer failedOverrides;

        @JsonProperty("skippedOverrides")
        private Integer skippedOverrides;

        @JsonProperty("overrideSummary")
        private OverrideSummary overrideSummary;

        @JsonProperty("individualResults")
        private List<IndividualOverrideResult> individualResults;

        @JsonProperty("completedAt")
        private LocalDateTime completedAt;

        @JsonProperty("processingTimeMs")
        private Long processingTimeMs;

        @JsonProperty("notificationsSent")
        private Integer notificationsSent;

        @JsonProperty("auditTrailId")
        private String auditTrailId;

        @JsonProperty("rollbackAvailable")
        private Boolean rollbackAvailable;

        @JsonProperty("rollbackInstructions")
        private String rollbackInstructions;
    }

    // ===============================
    // RISK ASSESSMENT
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class OverrideRiskAssessment {

        @JsonProperty("riskLevel")
        private String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL

        @JsonProperty("riskScore")
        private Integer riskScore; // 0-100

        @JsonProperty("riskFactors")
        private List<RiskFactor> riskFactors;

        @JsonProperty("impactAssessment")
        private ImpactAssessment impactAssessment;

        @JsonProperty("complianceCheck")
        private ComplianceCheck complianceCheck;

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

        @JsonProperty("rollbackComplexity")
        private String rollbackComplexity; // SIMPLE, MODERATE, COMPLEX

        @JsonProperty("systemStabilityRisk")
        private String systemStabilityRisk; // LOW, MEDIUM, HIGH
    }

    // ===============================
    // SUPPORTING CLASSES
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SelectionCriteria {

        @JsonProperty("statusFilter")
        private List<String> statusFilter;

        @JsonProperty("workflowStageFilter")
        private List<String> workflowStageFilter;

        @JsonProperty("universityFilter")
        private List<UUID> universityFilter;

        @JsonProperty("assignedAdminFilter")
        private List<UUID> assignedAdminFilter;

        @JsonProperty("priorityFilter")
        private List<String> priorityFilter;

        @JsonProperty("dateRangeFilter")
        private DateRangeFilter dateRangeFilter;

        @JsonProperty("customFilters")
        private Map<String, Object> customFilters;

        @JsonProperty("maxApplications")
        private Integer maxApplications;

        @JsonProperty("excludeApplications")
        private List<UUID> excludeApplications;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class NotificationSettings {

        @JsonProperty("notifyStudents")
        private Boolean notifyStudents;

        @JsonProperty("notifyAdmins")
        private Boolean notifyAdmins;

        @JsonProperty("notifyUniversities")
        private Boolean notifyUniversities;

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

        @JsonProperty("suppressNotifications")
        private Boolean suppressNotifications;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RollbackPlan {

        @JsonProperty("rollbackStrategy")
        private String rollbackStrategy; // AUTOMATIC, MANUAL, CONDITIONAL

        @JsonProperty("rollbackTriggers")
        private List<String> rollbackTriggers;

        @JsonProperty("rollbackTimeout")
        private Integer rollbackTimeout; // minutes

        @JsonProperty("preserveAuditTrail")
        private Boolean preserveAuditTrail;

        @JsonProperty("rollbackApprovalRequired")
        private Boolean rollbackApprovalRequired;

        @JsonProperty("automaticRollbackConditions")
        private List<String> automaticRollbackConditions;

        @JsonProperty("rollbackNotifications")
        private Boolean rollbackNotifications;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class OverrideSummary {

        @JsonProperty("totalApplications")
        private Integer totalApplications;

        @JsonProperty("statusDistribution")
        private Map<String, Integer> statusDistribution;

        @JsonProperty("stageDistribution")
        private Map<String, Integer> stageDistribution;

        @JsonProperty("overrideBreakdown")
        private Map<String, Integer> overrideBreakdown;

        @JsonProperty("errorBreakdown")
        private Map<String, Integer> errorBreakdown;

        @JsonProperty("timeMetrics")
        private TimeMetrics timeMetrics;

        @JsonProperty("systemImpact")
        private SystemImpact systemImpact;

        @JsonProperty("businessImpact")
        private BusinessImpact businessImpact;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class IndividualOverrideResult {

        @JsonProperty("applicationId")
        private UUID applicationId;

        @JsonProperty("referenceNumber")
        private String referenceNumber;

        @JsonProperty("studentName")
        private String studentName;

        @JsonProperty("success")
        private Boolean success;

        @JsonProperty("previousStatus")
        private String previousStatus;

        @JsonProperty("newStatus")
        private String newStatus;

        @JsonProperty("previousStage")
        private String previousStage;

        @JsonProperty("newStage")
        private String newStage;

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

        @JsonProperty("rollbackInfo")
        private RollbackInfo rollbackInfo;
    }

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

        @JsonProperty("applicationId")
        private UUID applicationId;

        @JsonProperty("severity")
        private String severity; // ERROR, WARNING, INFO

        @JsonProperty("suggestion")
        private String suggestion;

        @JsonProperty("canProceed")
        private Boolean canProceed;

        @JsonProperty("requiresManualReview")
        private Boolean requiresManualReview;
    }

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

        @JsonProperty("likelihood")
        private BigDecimal likelihood; // 0-100

        @JsonProperty("impact")
        private String impact;

        @JsonProperty("mitigation")
        private String mitigation;

        @JsonProperty("weight")
        private Integer weight; // 1-10
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ImpactAssessment {

        @JsonProperty("affectedApplications")
        private Integer affectedApplications;

        @JsonProperty("affectedStudents")
        private Integer affectedStudents;

        @JsonProperty("affectedUniversities")
        private Integer affectedUniversities;

        @JsonProperty("systemLoad")
        private String systemLoad; // LOW, MEDIUM, HIGH

        @JsonProperty("dataIntegrity")
        private String dataIntegrity; // SAFE, CAUTION, RISK

        @JsonProperty("businessImpact")
        private String businessImpact; // MINIMAL, MODERATE, SIGNIFICANT, CRITICAL

        @JsonProperty("workflowDisruption")
        private String workflowDisruption; // NONE, MINOR, MODERATE, MAJOR

        @JsonProperty("estimatedDowntime")
        private String estimatedDowntime;

        @JsonProperty("dependencies")
        private List<String> dependencies;

        @JsonProperty("cascadingEffects")
        private List<String> cascadingEffects;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ComplianceCheck {

        @JsonProperty("complianceStatus")
        private String complianceStatus; // COMPLIANT, NON_COMPLIANT, REQUIRES_REVIEW

        @JsonProperty("regulations")
        private List<String> regulations;

        @JsonProperty("violations")
        private List<String> violations;

        @JsonProperty("waivers")
        private List<String> waivers;

        @JsonProperty("documentationRequired")
        private Boolean documentationRequired;

        @JsonProperty("approvalRequired")
        private Boolean approvalRequired;

        @JsonProperty("auditTrailRequired")
        private Boolean auditTrailRequired;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DateRangeFilter {

        @JsonProperty("startDate")
        private LocalDateTime startDate;

        @JsonProperty("endDate")
        private LocalDateTime endDate;

        @JsonProperty("dateField")
        private String dateField; // CREATED_AT, SUBMITTED_AT, DEADLINE, LAST_UPDATED

        @JsonProperty("relativePeriod")
        private String relativePeriod; // LAST_7_DAYS, LAST_30_DAYS, THIS_MONTH, etc.
    }

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

        @JsonProperty("averageTimePerApplicationMs")
        private Long averageTimePerApplicationMs;

        @JsonProperty("validationTimeMs")
        private Long validationTimeMs;

        @JsonProperty("executionTimeMs")
        private Long executionTimeMs;

        @JsonProperty("notificationTimeMs")
        private Long notificationTimeMs;

        @JsonProperty("rollbackTimeMs")
        private Long rollbackTimeMs;
    }

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

        @JsonProperty("errorRate")
        private Double errorRate;

        @JsonProperty("throughputImpact")
        private Double throughputImpact;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class BusinessImpact {

        @JsonProperty("revenueImpact")
        private java.math.BigDecimal revenueImpact;

        @JsonProperty("customerSatisfactionImpact")
        private String customerSatisfactionImpact;

        @JsonProperty("operationalEfficiencyImpact")
        private String operationalEfficiencyImpact;

        @JsonProperty("complianceImpact")
        private String complianceImpact;

        @JsonProperty("reputationImpact")
        private String reputationImpact;

        @JsonProperty("partnershipImpact")
        private String partnershipImpact;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RollbackInfo {

        @JsonProperty("rollbackAvailable")
        private Boolean rollbackAvailable;

        @JsonProperty("rollbackId")
        private String rollbackId;

        @JsonProperty("rollbackInstructions")
        private String rollbackInstructions;

        @JsonProperty("rollbackDeadline")
        private LocalDateTime rollbackDeadline;

        @JsonProperty("automaticRollback")
        private Boolean automaticRollback;

        @JsonProperty("rollbackComplexity")
        private String rollbackComplexity;
    }

    // ===============================
    // STATIC FACTORY METHODS
    // ===============================

    /**
     * Create a single application status override request
     */
    public static ApplicationStatusOverrideDTO createSingleOverrideRequest(
        UUID applicationId,
        String currentStatus,
        String targetStatus,
        String overrideReason,
        String justification
    ) {
        return ApplicationStatusOverrideDTO.builder()
            .applicationId(applicationId)
            .currentStatus(currentStatus)
            .targetStatus(targetStatus)
            .overrideType("STATUS_CHANGE")
            .overrideReason(overrideReason)
            .justification(justification)
            .emergencyFlag(false)
            .bypassWorkflowValidation(false)
            .notifyStakeholders(true)
            .authorizationRequired(false)
            .build();
    }

    /**
     * Create a bulk override operation request
     */
    public static ApplicationStatusOverrideDTO createBulkOverrideRequest(
        String operationType,
        List<UUID> applicationIds,
        String targetStatus,
        String overrideReason,
        Boolean dryRun
    ) {
        BulkOverrideOperation bulkOp = BulkOverrideOperation.builder()
            .operationType(operationType)
            .applicationIds(applicationIds)
            .targetStatus(targetStatus)
            .overrideReason(overrideReason)
            .dryRun(dryRun)
            .confirmBulkOperation(false)
            .processingMode("SEQUENTIAL")
            .notificationSettings(
                NotificationSettings.builder()
                    .notifyStudents(true)
                    .emailNotification(true)
                    .priority("NORMAL")
                    .build()
            )
            .build();

        return ApplicationStatusOverrideDTO.builder()
            .bulkOverride(bulkOp)
            .authorizationRequired(true)
            .build();
    }

    /**
     * Create a successful override result
     */
    public static OverrideResult createSuccessResult(
        String operationId,
        Integer processedApplications,
        Integer successfulOverrides,
        Long processingTime
    ) {
        return OverrideResult.builder()
            .success(true)
            .message("Override operation completed successfully")
            .operationId(operationId)
            .processedApplications(processedApplications)
            .successfulOverrides(successfulOverrides)
            .failedOverrides(0)
            .completedAt(LocalDateTime.now())
            .processingTimeMs(processingTime)
            .rollbackAvailable(true)
            .build();
    }
}
