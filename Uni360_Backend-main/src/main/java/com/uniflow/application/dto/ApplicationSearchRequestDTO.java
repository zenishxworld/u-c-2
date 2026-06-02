package com.uniflow.application.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ApplicationSearchRequestDTO - Data Transfer Object for Advanced Application Search
 *
 * <p>This DTO handles complex search requests for applications with multiple filter criteria,
 * sorting options, and pagination support. It provides comprehensive search capabilities for the
 * applications service.
 *
 * <p>Key Features: - Multiple filter criteria with validation - Date range filtering - Status and
 * priority filtering - Assignment and ownership filtering - Document and payment status filtering -
 * Multi-client and territory filtering - Sorting and pagination support - Text search capabilities
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-01
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationSearchRequestDTO {

    // Basic Search Criteria
    @JsonProperty("search_term")
    private String searchTerm;

    @JsonProperty("reference_number")
    private String referenceNumber;

    // Status and Workflow Filters
    @JsonProperty("status")
    @Pattern(
            regexp =
                    "^(draft|submitted|under_review|documents_requested|evaluated|accepted|rejected|enrolled|withdrawn|expired)$",
            message = "Invalid status")
    private String status;

    @JsonProperty("statuses")
    private List<String> statuses;

    @JsonProperty("workflow_stage")
    private String workflowStage;

    @JsonProperty("workflow_stages")
    private List<String> workflowStages;

    @JsonProperty("previous_status")
    private String previousStatus;

    // Priority and Urgency Filters
    @JsonProperty("priority")
    @Pattern(regexp = "^(low|normal|high|urgent|critical)$", message = "Invalid priority")
    private String priority;

    @JsonProperty("priorities")
    private List<String> priorities;

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

    @JsonProperty("is_overdue")
    private Boolean isOverdue;

    @JsonProperty("sla_breached")
    private Boolean slaBreached;

    // Application Type and Classification
    @JsonProperty("application_type")
    @Pattern(
            regexp = "^(undergraduate|graduate|postgraduate|phd|mba|executive)$",
            message = "Invalid application type")
    private String applicationType;

    @JsonProperty("application_types")
    private List<String> applicationTypes;

    @JsonProperty("program_level")
    @Pattern(regexp = "^(bachelor|master|doctorate)$", message = "Invalid program level")
    private String programLevel;

    @JsonProperty("study_mode")
    @Pattern(regexp = "^(full-time|part-time|online|hybrid)$", message = "Invalid study mode")
    private String studyMode;

    @JsonProperty("intake_season")
    @Pattern(regexp = "^(fall|spring|summer|winter)$", message = "Invalid intake season")
    private String intakeSeason;

    // Assignment and Ownership Filters
    @JsonProperty("assigned_admin_id")
    private UUID assignedAdminId;

    @JsonProperty("assigned_admin_ids")
    private List<UUID> assignedAdminIds;

    @JsonProperty("assigned_counselor_id")
    private UUID assignedCounselorId;

    @JsonProperty("unassigned_only")
    private Boolean unassignedOnly;

    @JsonProperty("assigned_by")
    private UUID assignedBy;

    // Student and University Filters
    @JsonProperty("student_id")
    private long studentId;

    @JsonProperty("student_ids")
    private List<Long> studentIds;

    @JsonProperty("target_university_id")
    private UUID targetUniversityId;

    @JsonProperty("target_university_ids")
    private List<UUID> targetUniversityIds;

    @JsonProperty("target_course_id")
    private UUID targetCourseId;

    @JsonProperty("target_course_ids")
    private List<UUID> targetCourseIds;

    @JsonProperty("target_semester")
    private String targetSemester;

    @JsonProperty("target_year")
    @Min(value = 2024, message = "Target year must be 2024 or later")
    @Max(value = 2030, message = "Target year cannot be more than 2030")
    private Integer targetYear;

    // Date Range Filters
    @JsonProperty("submitted_from")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime submittedFrom;

    @JsonProperty("submitted_to")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime submittedTo;

    @JsonProperty("created_from")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdFrom;

    @JsonProperty("created_to")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdTo;

    @JsonProperty("updated_from")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedFrom;

    @JsonProperty("updated_to")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedTo;

    @JsonProperty("deadline_from")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime deadlineFrom;

    @JsonProperty("deadline_to")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime deadlineTo;

    @JsonProperty("decision_date_from")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime decisionDateFrom;

    @JsonProperty("decision_date_to")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime decisionDateTo;

    // Document and Payment Status Filters
    @JsonProperty("documents_verified")
    private Boolean documentsVerified;

    @JsonProperty("academic_documents_verified")
    private Boolean academicDocumentsVerified;

    @JsonProperty("english_proficiency_verified")
    private Boolean englishProficiencyVerified;

    @JsonProperty("certificates_verified")
    private Boolean certificatesVerified;

    @JsonProperty("personal_documents_verified")
    private Boolean personalDocumentsVerified;

    @JsonProperty("payment_completed")
    private Boolean paymentCompleted;

    @JsonProperty("submitted_to_university")
    private Boolean submittedToUniversity;

    // University Integration Filters
    @JsonProperty("university_status")
    private String universityStatus;

    @JsonProperty("university_reference_number")
    private String universityReferenceNumber;

    // Performance and Quality Filters
    @JsonProperty("completion_percentage_min")
    @Min(value = 0, message = "Completion percentage minimum cannot be negative")
    @Max(value = 100, message = "Completion percentage minimum cannot exceed 100")
    private Integer completionPercentageMin;

    @JsonProperty("completion_percentage_max")
    @Min(value = 0, message = "Completion percentage maximum cannot be negative")
    @Max(value = 100, message = "Completion percentage maximum cannot exceed 100")
    private Integer completionPercentageMax;

    @JsonProperty("processing_time_hours_max")
    @Min(value = 0, message = "Processing time maximum cannot be negative")
    private Integer processingTimeHoursMax;

    @JsonProperty("quality_score_min")
    @Min(value = 0, message = "Quality score minimum cannot be negative")
    @Max(value = 100, message = "Quality score minimum cannot exceed 100")
    private Double qualityScoreMin;

    @JsonProperty("student_satisfaction_rating_min")
    @Min(value = 1, message = "Student satisfaction rating minimum must be at least 1")
    @Max(value = 5, message = "Student satisfaction rating minimum cannot exceed 5")
    private Integer studentSatisfactionRatingMin;

    @JsonProperty("processing_complexity")
    @Pattern(
            regexp = "^(simple|medium|complex|very_complex)$",
            message = "Invalid processing complexity")
    private String processingComplexity;

    @JsonProperty("risk_level")
    @Pattern(regexp = "^(low|medium|high|critical)$", message = "Invalid risk level")
    private String riskLevel;

    // Multi-client and Regional Filters
    @JsonProperty("client_id")
    @Pattern(regexp = "^(uniflow|uni360)$", message = "Invalid client ID")
    private String clientId;

    @JsonProperty("client_ids")
    private List<String> clientIds;

    @JsonProperty("tenant_id")
    private String tenantId;

    @JsonProperty("territory")
    private String territory;

    @JsonProperty("territories")
    private List<String> territories;

    @JsonProperty("region")
    private String region;

    @JsonProperty("regions")
    private List<String> regions;

    @JsonProperty("country_code")
    @Pattern(regexp = "^[A-Z]{2}$", message = "Invalid country code format")
    private String countryCode;

    @JsonProperty("country_codes")
    private List<String> countryCodes;

    // Administrative Filters
    @JsonProperty("is_archived")
    private Boolean isArchived;

    @JsonProperty("archived_from")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime archivedFrom;

    @JsonProperty("archived_to")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime archivedTo;

    @JsonProperty("archived_by")
    private UUID archivedBy;

    @JsonProperty("is_locked")
    private Boolean isLocked;

    @JsonProperty("locked_by")
    private UUID lockedBy;

    @JsonProperty("created_by")
    private UUID createdBy;

    @JsonProperty("updated_by")
    private UUID updatedBy;

    // Escalation and SLA Filters
    @JsonProperty("escalation_level_min")
    @Min(value = 0, message = "Escalation level minimum cannot be negative")
    @Max(value = 5, message = "Escalation level minimum cannot exceed 5")
    private Integer escalationLevelMin;

    @JsonProperty("escalation_level_max")
    @Min(value = 0, message = "Escalation level maximum cannot be negative")
    @Max(value = 5, message = "Escalation level maximum cannot exceed 5")
    private Integer escalationLevelMax;

    @JsonProperty("escalated_to")
    private UUID escalatedTo;

    // External Integration Filters
    @JsonProperty("external_reference_id")
    private String externalReferenceId;

    @JsonProperty("source_system")
    private String sourceSystem;

    @JsonProperty("sync_required")
    private Boolean syncRequired;

    // Sorting Options
    @JsonProperty("sort_by")
    @Pattern(
            regexp =
                    "^(created|updated|submitted|deadline|priority|status|completion|university|student|reference)$",
            message = "Invalid sort field")
    private String sortBy;

    @JsonProperty("sort_direction")
    @Pattern(regexp = "^(asc|desc)$", message = "Invalid sort direction")
    private String sortDirection;

    @JsonProperty("secondary_sort_by")
    private String secondarySortBy;

    @JsonProperty("secondary_sort_direction")
    @Pattern(regexp = "^(asc|desc)$", message = "Invalid secondary sort direction")
    private String secondarySortDirection;

    // Pagination
    @JsonProperty("page")
    @Min(value = 0, message = "Page number cannot be negative")
    private Integer page;

    @JsonProperty("size")
    @Min(value = 1, message = "Page size must be at least 1")
    @Max(value = 1000, message = "Page size cannot exceed 1000")
    private Integer size;

    @JsonProperty("offset")
    @Min(value = 0, message = "Offset cannot be negative")
    private Integer offset;

    @JsonProperty("limit")
    @Min(value = 1, message = "Limit must be at least 1")
    @Max(value = 1000, message = "Limit cannot exceed 1000")
    private Integer limit;

    // Result Options
    @JsonProperty("include_archived")
    private Boolean includeArchived;

    @JsonProperty("include_locked")
    private Boolean includeLocked;

    @JsonProperty("count_only")
    private Boolean countOnly;

    @JsonProperty("distinct_field")
    private String distinctField;

    // Aggregation Options
    @JsonProperty("group_by")
    private String groupBy;

    @JsonProperty("aggregate_function")
    @Pattern(regexp = "^(count|sum|avg|min|max)$", message = "Invalid aggregate function")
    private String aggregateFunction;

    @JsonProperty("aggregate_field")
    private String aggregateField;

    // Custom Field Filters (JSONB)
    @JsonProperty("custom_field_filters")
    private java.util.Map<String, Object> customFieldFilters;

    @JsonProperty("application_data_filters")
    private java.util.Map<String, Object> applicationDataFilters;

    @JsonProperty("preferences_filters")
    private java.util.Map<String, Object> preferencesFilters;

    // Validation Methods

    /**
     * Validates that date ranges are logically correct
     */
    public boolean hasValidDateRanges() {
        if (submittedFrom != null && submittedTo != null && submittedFrom.isAfter(submittedTo)) {
            return false;
        }
        if (createdFrom != null && createdTo != null && createdFrom.isAfter(createdTo)) {
            return false;
        }
        if (updatedFrom != null && updatedTo != null && updatedFrom.isAfter(updatedTo)) {
            return false;
        }
        if (deadlineFrom != null && deadlineTo != null && deadlineFrom.isAfter(deadlineTo)) {
            return false;
        }
        if (decisionDateFrom != null
                && decisionDateTo != null
                && decisionDateFrom.isAfter(decisionDateTo)) {
            return false;
        }
        return true;
    }

    /**
     * Validates that completion percentage range is valid
     */
    public boolean hasValidCompletionPercentageRange() {
        if (completionPercentageMin != null && completionPercentageMax != null) {
            return completionPercentageMin <= completionPercentageMax;
        }
        return true;
    }

    /**
     * Validates that escalation level range is valid
     */
    public boolean hasValidEscalationLevelRange() {
        if (escalationLevelMin != null && escalationLevelMax != null) {
            return escalationLevelMin <= escalationLevelMax;
        }
        return true;
    }

    /**
     * Validates pagination parameters
     */
    public boolean hasValidPagination() {
        if (page != null && size != null) {
            return page >= 0 && size > 0 && size <= 1000;
        }
        if (offset != null && limit != null) {
            return offset >= 0 && limit > 0 && limit <= 1000;
        }
        return true;
    }

    /**
     * Sets default values for common parameters
     */
    public void setDefaults() {
        if (page == null) {
            page = 0;
        }
        if (size == null) {
            size = 20;
        }
        if (sortBy == null) {
            sortBy = "updated";
        }
        if (sortDirection == null) {
            sortDirection = "desc";
        }
        if (includeArchived == null) {
            includeArchived = false;
        }
        if (includeLocked == null) {
            includeLocked = true;
        }
        if (countOnly == null) {
            countOnly = false;
        }
    }


    /**
     * Checks if any date range filters are specified
     */
    public boolean hasDateRangeFilters() {
        return (submittedFrom != null
                || submittedTo != null
                || createdFrom != null
                || createdTo != null
                || updatedFrom != null
                || updatedTo != null
                || deadlineFrom != null
                || deadlineTo != null
                || decisionDateFrom != null
                || decisionDateTo != null);
    }

    /**
     * Checks if any multi-value filters are specified
     */
    public boolean hasMultiValueFilters() {
        return ((statuses != null && !statuses.isEmpty())
                || (priorities != null && !priorities.isEmpty())
                || (applicationTypes != null && !applicationTypes.isEmpty())
                || (assignedAdminIds != null && !assignedAdminIds.isEmpty())
                || (studentIds != null && !studentIds.isEmpty())
                || (targetUniversityIds != null && !targetUniversityIds.isEmpty()));
    }

    /**
     * Validates all business rules for the search request
     */
    public boolean isValid() {
        return (hasValidDateRanges()
                && hasValidCompletionPercentageRange()
                && hasValidEscalationLevelRange()
                && hasValidPagination());
    }

    /**
     * Gets the effective page size for the request
     */
    public int getEffectivePageSize() {
        if (size != null) {
            return Math.min(size, 1000);
        }
        if (limit != null) {
            return Math.min(limit, 1000);
        }
        return 20; // default
    }

    /**
     * Gets the effective page number for the request
     */
    public int getEffectivePageNumber() {
        if (page != null) {
            return Math.max(page, 0);
        }
        if (offset != null && getEffectivePageSize() > 0) {
            return offset / getEffectivePageSize();
        }
        return 0; // default
    }


}
