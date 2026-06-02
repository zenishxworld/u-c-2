package com.uniflow.application.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ApplicationResponseDTO - Data Transfer Object for Application API Responses
 *
 * <p>This DTO handles outgoing responses for university applications. It provides a comprehensive
 * view of application data for frontend consumption and external API integrations.
 *
 * <p>Key Features: - Complete application information for display - Calculated fields and business
 * logic results - Multi-client support with client-specific data - Performance metrics and
 * analytics data - Document and payment status information - Communication and timeline tracking
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-01
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationResponseDTO {

    // Primary Identifiers
    @JsonProperty("id")
    private UUID id;

    @JsonProperty("reference_number")
    private String referenceNumber;

    @JsonProperty("student_id")
    private long studentId;

    // University and Course Information
    @JsonProperty("target_university_id")
    private UUID targetUniversityId;

    @JsonProperty("target_course_id")
    private UUID targetCourseId;

    @JsonProperty("target_semester")
    private String targetSemester;

    @JsonProperty("target_year")
    private Integer targetYear;

    @JsonProperty("alternate_course_id")
    private UUID alternateCourseId;

    @JsonProperty("alternate_university_id")
    private UUID alternateUniversityId;

    // Application Classification
    @JsonProperty("application_type")
    private String applicationType;

    @JsonProperty("program_level")
    private String programLevel;

    @JsonProperty("study_mode")
    private String studyMode;

    @JsonProperty("intake_season")
    private String intakeSeason;

    // Status and Workflow Management
    @JsonProperty("status")
    private String status;

    @JsonProperty("status_description")
    private String statusDescription;

    @JsonProperty("sub_status")
    private String subStatus;

    @JsonProperty("workflow_stage")
    private String workflowStage;

    @JsonProperty("workflow_step")
    private String workflowStep;

    @JsonProperty("previous_status")
    private String previousStatus;

    @JsonProperty("status_reason")
    private String statusReason;

    // Priority and Classification
    @JsonProperty("priority")
    private String priority;

    @JsonProperty("priority_level")
    private Integer priorityLevel;

    @JsonProperty("is_urgent")
    private Boolean isUrgent;

    @JsonProperty("is_expedited")
    private Boolean isExpedited;

    @JsonProperty("is_fast_tracked")
    private Boolean isFastTracked;

    @JsonProperty("requires_attention")
    private Boolean requiresAttention;

    @JsonProperty("has_issues")
    private Boolean hasIssues;

    // Assignment and Ownership
    @JsonProperty("assigned_admin_id")
    private Long assignedAdminId;

    @JsonProperty("assigned_admin_name")
    private String assignedAdminName;

    @JsonProperty("assigned_admin_email")
    private String assignedAdminEmail;

    @JsonProperty("assigned_counselor_id")
    private UUID assignedCounselorId;

    @JsonProperty("assigned_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime assignedAt;

    @JsonProperty("assigned_by")
    private UUID assignedBy;

    @JsonProperty("previous_admin_id")
    private Long previousAdminId;

    // Dates and Deadlines
    @JsonProperty("submitted_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime submittedAt;

    @JsonProperty("deadline")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime deadline;

    @JsonProperty("university_deadline")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime universityDeadline;

    @JsonProperty("internal_deadline")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime internalDeadline;

    @JsonProperty("sla_deadline")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime slaDeadline;

    @JsonProperty("next_critical_deadline")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime nextCriticalDeadline;

    @JsonProperty("reviewed_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime reviewedAt;

    @JsonProperty("decision_date")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime decisionDate;

    @JsonProperty("enrollment_deadline")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime enrollmentDeadline;

    @JsonProperty("visa_deadline")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime visaDeadline;

    // Progress and Completion Tracking
    @JsonProperty("completion_percentage")
    private Integer completionPercentage;

    @JsonProperty("steps_completed")
    private Integer stepsCompleted;

    @JsonProperty("total_steps")
    private Integer totalSteps;

    @JsonProperty("documents_uploaded")
    private Integer documentsUploaded;

    @JsonProperty("documents_required")
    private Integer documentsRequired;

    // Document and Verification Status
    @JsonProperty("documents_verified")
    private Boolean documentsVerified;

    @JsonProperty("documents_verified_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime documentsVerifiedAt;

    @JsonProperty("documents_verified_by")
    private UUID documentsVerifiedBy;

    @JsonProperty("academic_documents_verified")
    private Boolean academicDocumentsVerified;

    @JsonProperty("english_proficiency_verified")
    private Boolean englishProficiencyVerified;

    @JsonProperty("certificates_verified")
    private Boolean certificatesVerified;

    @JsonProperty("personal_documents_verified")
    private Boolean personalDocumentsVerified;

    @JsonProperty("has_complete_documents")
    private Boolean hasCompleteDocuments;

    // University Interaction
    @JsonProperty("submitted_to_university")
    private Boolean submittedToUniversity;

    @JsonProperty("submitted_to_university_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime submittedToUniversityAt;

    @JsonProperty("university_reference_number")
    private String universityReferenceNumber;

    @JsonProperty("university_portal_id")
    private String universityPortalId;

    @JsonProperty("university_status")
    private String universityStatus;

    @JsonProperty("university_notes")
    private String universityNotes;

    @JsonProperty("ready_for_university_submission")
    private Boolean readyForUniversitySubmission;

    // Payment and Financial Information
    @JsonProperty("payment_completed")
    private Boolean paymentCompleted;

    @JsonProperty("payment_completed_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime paymentCompletedAt;

    @JsonProperty("application_fee_amount")
    private Double applicationFeeAmount;

    @JsonProperty("application_fee_currency")
    private String applicationFeeCurrency;

    @JsonProperty("service_fee_amount")
    private Double serviceFeeAmount;

    @JsonProperty("service_fee_currency")
    private String serviceFeeCurrency;

    @JsonProperty("payment_method")
    private String paymentMethod;

    @JsonProperty("payment_reference")
    private String paymentReference;

    @JsonProperty("refund_requested")
    private Boolean refundRequested;

    @JsonProperty("refund_amount")
    private Double refundAmount;

    @JsonProperty("refund_reason")
    private String refundReason;

    @JsonProperty("has_completed_payment")
    private Boolean hasCompletedPayment;

    // Communication and Contact History
    @JsonProperty("last_contact_date")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime lastContactDate;

    @JsonProperty("last_contact_type")
    private String lastContactType;

    @JsonProperty("last_contact_notes")
    private String lastContactNotes;

    @JsonProperty("next_followup_date")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime nextFollowupDate;

    @JsonProperty("followup_reason")
    private String followupReason;

    @JsonProperty("student_contacted")
    private Boolean studentContacted;

    @JsonProperty("student_last_response")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime studentLastResponse;

    // Counters and Statistics
    @JsonProperty("notes_count")
    private Integer notesCount;

    @JsonProperty("messages_count")
    private Integer messagesCount;

    @JsonProperty("documents_count")
    private Integer documentsCount;

    @JsonProperty("attachments_count")
    private Integer attachmentsCount;

    @JsonProperty("revisions_count")
    private Integer revisionsCount;

    @JsonProperty("extensions_count")
    private Integer extensionsCount;

    // Performance and SLA Metrics
    @JsonProperty("processing_time_hours")
    private Integer processingTimeHours;

    @JsonProperty("response_time_hours")
    private Integer responseTimeHours;

    @JsonProperty("first_response_time_hours")
    private Integer firstResponseTimeHours;

    @JsonProperty("is_overdue")
    private Boolean isOverdue;

    @JsonProperty("sla_breached")
    private Boolean slaBreached;

    @JsonProperty("sla_breach_reason")
    private String slaBreachReason;

    @JsonProperty("escalation_level")
    private Integer escalationLevel;

    @JsonProperty("escalated_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime escalatedAt;

    @JsonProperty("escalated_to")
    private UUID escalatedTo;

    @JsonProperty("deadline_approaching")
    private Boolean deadlineApproaching;

    @JsonProperty("past_deadline")
    private Boolean pastDeadline;

    // Quality and Rating
    @JsonProperty("quality_score")
    private Double qualityScore;

    @JsonProperty("student_satisfaction_rating")
    private Integer studentSatisfactionRating;

    @JsonProperty("processing_complexity")
    private String processingComplexity;

    @JsonProperty("risk_level")
    private String riskLevel;

    // Administrative and System Fields
    @JsonProperty("is_archived")
    private Boolean isArchived;

    @JsonProperty("archived_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime archivedAt;

    @JsonProperty("archived_by")
    private UUID archivedBy;

    @JsonProperty("archive_reason")
    private String archiveReason;

    @JsonProperty("is_locked")
    private Boolean isLocked;

    @JsonProperty("locked_by")
    private UUID lockedBy;

    @JsonProperty("locked_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime lockedAt;

    @JsonProperty("lock_reason")
    private String lockReason;

    // Multi-client and Tenant Support
    @JsonProperty("client_id")
    private String clientId;

    @JsonProperty("tenant_id")
    private String tenantId;

    @JsonProperty("territory")
    private String territory;

    @JsonProperty("region")
    private String region;

    @JsonProperty("country_code")
    private String countryCode;

    @JsonProperty("language_preference")
    private String languagePreference;

    @JsonProperty("timezone")
    private String timezone;

    // Integration and External References
    @JsonProperty("external_reference_id")
    private String externalReferenceId;

    @JsonProperty("source_system")
    private String sourceSystem;

    @JsonProperty("migration_id")
    private String migrationId;

    @JsonProperty("sync_required")
    private Boolean syncRequired;

    @JsonProperty("last_sync_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime lastSyncAt;

    // JSONB Fields for Flexible Data Storage
    @JsonProperty("application_data")
    private Map<String, Object> applicationData;

    @JsonProperty("custom_fields")
    private Map<String, Object> customFields;

    @JsonProperty("preferences")
    private Map<String, Object> preferences;

    @JsonProperty("requirements")
    private Map<String, Object> requirements;

    @JsonProperty("evaluation_criteria")
    private Map<String, Object> evaluationCriteria;

    @JsonProperty("analytics_data")
    private Map<String, Object> analyticsData;

    @JsonProperty("integration_data")
    private Map<String, Object> integrationData;

    // Audit Trail
    @JsonProperty("created_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    @JsonProperty("created_by")
    private UUID createdBy;

    @JsonProperty("updated_by")
    private UUID updatedBy;

    @JsonProperty("version")
    private Long version;

    // Calculated Helper Fields
    @JsonProperty("can_be_assigned")
    private Boolean canBeAssigned;

    @JsonProperty("is_in_progress")
    private Boolean isInProgress;

    @JsonProperty("is_completed")
    private Boolean isCompleted;

    @JsonProperty("is_draft")
    private Boolean isDraft;

    @JsonProperty("is_submitted")
    private Boolean isSubmitted;

    @JsonProperty("needs_attention")
    private Boolean needsAttention;

    // Display Helper Methods (for frontend convenience)

    /** Gets a color code for status display */
    @JsonProperty("status_color")
    public String getStatusColor() {
        return switch (status != null ? status : "unknown") {
            case "draft" -> "#6B7280"; // gray
            case "submitted" -> "#3B82F6"; // blue
            case "under_review" -> "#F59E0B"; // amber
            case "documents_requested" -> "#EF4444"; // red
            case "evaluated" -> "#8B5CF6"; // purple
            case "accepted" -> "#10B981"; // green
            case "rejected" -> "#EF4444"; // red
            case "enrolled" -> "#059669"; // emerald
            case "withdrawn" -> "#6B7280"; // gray
            case "expired" -> "#9CA3AF"; // gray
            default -> "#6B7280"; // gray
        };
    }

    /** Gets an icon for status display */
    @JsonProperty("status_icon")
    public String getStatusIcon() {
        return switch (status != null ? status : "unknown") {
            case "draft" -> "edit";
            case "submitted" -> "send";
            case "under_review" -> "search";
            case "documents_requested" -> "file-text";
            case "evaluated" -> "check-circle";
            case "accepted" -> "thumbs-up";
            case "rejected" -> "thumbs-down";
            case "enrolled" -> "graduation-cap";
            case "withdrawn" -> "x-circle";
            case "expired" -> "clock";
            default -> "help-circle";
        };
    }

    /** Gets priority color for display */
    @JsonProperty("priority_color")
    public String getPriorityColor() {
        return switch (priority != null ? priority : "normal") {
            case "critical" -> "#DC2626"; // red-600
            case "urgent" -> "#EA580C"; // orange-600
            case "high" -> "#F59E0B"; // amber-500
            case "normal" -> "#6B7280"; // gray-500
            case "low" -> "#9CA3AF"; // gray-400
            default -> "#6B7280"; // gray-500
        };
    }

    /** Gets completion status description */
    @JsonProperty("completion_status")
    public String getCompletionStatus() {
        if (completionPercentage == null) return "Unknown";
        if (completionPercentage >= 100) return "Complete";
        if (completionPercentage >= 75) return "Nearly Complete";
        if (completionPercentage >= 50) return "In Progress";
        if (completionPercentage >= 25) return "Getting Started";
        return "Just Started";
    }

    /** Gets time remaining until deadline (human readable) */
    @JsonProperty("deadline_status")
    public String getDeadlineStatus() {
        if (nextCriticalDeadline == null) return "No deadline set";

        LocalDateTime now = LocalDateTime.now();
        if (nextCriticalDeadline.isBefore(now)) {
            return "Overdue";
        }

        long hours = java.time.Duration.between(
            now,
            nextCriticalDeadline
        ).toHours();
        if (hours < 24) {
            return "Due in " + hours + " hours";
        }

        long days = hours / 24;
        if (days == 1) {
            return "Due tomorrow";
        } else if (days <= 7) {
            return "Due in " + days + " days";
        } else if (days <= 30) {
            long weeks = days / 7;
            return "Due in " + weeks + " week" + (weeks > 1 ? "s" : "");
        } else {
            long months = days / 30;
            return "Due in " + months + " month" + (months > 1 ? "s" : "");
        }
    }

    /** Gets overall application health score */
    @JsonProperty("health_score")
    public String getHealthScore() {
        int score = 0;
        int factors = 0;

        // Document completeness (25%)
        if (Boolean.TRUE.equals(hasCompleteDocuments)) score += 25;
        factors++;

        // Payment completion (20%)
        if (Boolean.TRUE.equals(hasCompletedPayment)) score += 20;
        factors++;

        // On-time performance (20%)
        if (
            !Boolean.TRUE.equals(isOverdue) && !Boolean.TRUE.equals(slaBreached)
        ) score += 20;
        factors++;

        // Communication responsiveness (15%)
        if (
            Boolean.TRUE.equals(studentContacted) && studentLastResponse != null
        ) score += 15;
        factors++;

        // Quality score (20%)
        if (qualityScore != null && qualityScore >= 80) score += 20;
        factors++;

        if (score >= 85) return "Excellent";
        if (score >= 70) return "Good";
        if (score >= 50) return "Fair";
        if (score >= 30) return "Poor";
        return "Critical";
    }
}
