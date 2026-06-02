package com.uniflow.application.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.r2dbc.postgresql.codec.Json;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Simplified Application Entity with JSONB data storage (Phase 18)
 * This entity follows the pattern established in User and University entities
 * by storing complex data in JSONB fields for better maintainability.
 */
@Table("applications")
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Application {

    @Id
    @Column("id")
    private UUID id;

    @Column("reference_number")
    private String referenceNumber;

    @Column("student_id")
    private Long studentId;

    @Column("university_id")
    private UUID universityId;

    @Column("course_id")
    private UUID courseId;

    @Column("status")
    private String status = "DRAFT";

    @Column("workflow_stage")
    private String workflowStage = "INITIAL";

    @Column("priority")
    private String priority = "NORMAL";

    @Column("submitted_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime submittedAt;

    @Column("deadline")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime deadline;

    @Column("assigned_admin_id")
    private Long assignedAdminId;

    @Column("completion_percentage")
    private Integer completionPercentage = 0;

    @Column("is_urgent")
    private Boolean isUrgent = false;

    @Column("is_active")
    private Boolean isActive = true;

    /**
     * JSONB field containing all complex application data:
     * - academic: program info, degree level, intake details
     * - alternates: alternate university/course selections
     * - workflow: sub-status, workflow steps, progress
     * - documents: document verification status
     * - payment: payment completion and details
     * - university: university submission status
     * - tracking: contact dates, follow-ups, SLA info
     * - metadata: client info, territory, preferences
     */
    @Column("data")
    private Json data;

    @CreatedDate
    @Column("created_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    @Column("created_by")
    private String createdBy;

    @Column("updated_by")
    private String updatedBy;

    // Helper methods to extract data from JSONB
    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Get program name from JSONB data
     */
    public String getProgramName() {
        return extractJsonValue("academic", "program_name", String.class);
    }

    /**
     * Get degree level from JSONB data
     */
    public String getDegreeLevel() {
        return extractJsonValue("academic", "degree_level", String.class);
    }

    /**
     * Get field of study from JSONB data
     */
    public String getFieldOfStudy() {
        return extractJsonValue("academic", "field_of_study", String.class);
    }

    /**
     * Get intake term from JSONB data
     */
    public String getIntakeTerm() {
        return extractJsonValue("academic", "intake_term", String.class);
    }

    /**
     * Check if documents are verified
     */
    public Boolean isDocumentsVerified() {
        return extractJsonValue(
            "documents",
            "documents_verified",
            Boolean.class
        );
    }

    /**
     * Check if payment is completed
     */
    public Boolean isPaymentCompleted() {
        return extractJsonValue("payment", "payment_completed", Boolean.class);
    }

    /**
     * Get application fee amount
     */
    public BigDecimal getApplicationFeeAmount() {
        Number amount = extractJsonValue(
            "payment",
            "application_fee_amount",
            Number.class
        );
        return amount != null ? new BigDecimal(amount.toString()) : null;
    }

    /**
     * Get application fee currency
     */
    public String getApplicationFeeCurrency() {
        return extractJsonValue(
            "payment",
            "application_fee_currency",
            String.class
        );
    }

    /**
     * Check if submitted to university
     */
    public Boolean isSubmittedToUniversity() {
        return extractJsonValue(
            "university",
            "submitted_to_university",
            Boolean.class
        );
    }

    /**
     * Get university reference number
     */
    public String getUniversityReferenceNumber() {
        return extractJsonValue(
            "university",
            "university_reference_number",
            String.class
        );
    }

    /**
     * Get sub status from workflow
     */
    public String getSubStatus() {
        return extractJsonValue("workflow", "sub_status", String.class);
    }

    /**
     * Get workflow step
     */
    public String getWorkflowStep() {
        return extractJsonValue("workflow", "workflow_step", String.class);
    }

    /**
     * Get steps completed
     */
    public Integer getStepsCompleted() {
        return extractJsonValue("workflow", "steps_completed", Integer.class);
    }

    /**
     * Get total steps
     */
    public Integer getTotalSteps() {
        return extractJsonValue("workflow", "total_steps", Integer.class);
    }

    // Status check methods
    public Boolean isDraft() {
        return "DRAFT".equals(status);
    }

    public Boolean isSubmitted() {
        return submittedAt != null && !"DRAFT".equals(status);
    }

    public Boolean isInProgress() {
        return (
            isSubmitted() &&
            !"COMPLETED".equals(status) &&
            !"REJECTED".equals(status)
        );
    }

    public Boolean isCompleted() {
        return "COMPLETED".equals(status) || "APPROVED".equals(status);
    }

    public Boolean needsAttention() {
        return isUrgent || "ATTENTION_REQUIRED".equals(status);
    }

    // Helper method to extract values from JSONB
    private <T> T extractJsonValue(
        String section,
        String field,
        Class<T> type
    ) {
        if (data == null) return null;

        try {
            JsonNode rootNode = objectMapper.readTree(data.asString());
            JsonNode sectionNode = rootNode.get(section);
            if (sectionNode != null && sectionNode.has(field)) {
                JsonNode fieldNode = sectionNode.get(field);
                if (fieldNode.isNull()) return null;

                if (type == String.class) {
                    return type.cast(fieldNode.asText());
                } else if (type == Boolean.class) {
                    return type.cast(fieldNode.asBoolean());
                } else if (type == Integer.class) {
                    return type.cast(fieldNode.asInt());
                } else if (type == Number.class) {
                    return type.cast(fieldNode.numberValue());
                }
            }
        } catch (JsonProcessingException e) {
            // Log error and return null
            System.err.println("Error parsing JSONB data: " + e.getMessage());
        }
        return null;
    }

    // Constructors
    public Application() {}

    public Application(
        String referenceNumber,
        Long studentId,
        UUID universityId,
        UUID courseId
    ) {
        this.referenceNumber = referenceNumber;
        this.studentId = studentId;
        this.universityId = universityId;
        this.courseId = courseId;
        this.status = "DRAFT";
        this.workflowStage = "INITIAL";
        this.priority = "NORMAL";
        this.completionPercentage = 0;
        this.isUrgent = false;
        this.isActive = true;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getReferenceNumber() {
        return referenceNumber;
    }

    public void setReferenceNumber(String referenceNumber) {
        this.referenceNumber = referenceNumber;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public UUID getUniversityId() {
        return universityId;
    }

    public void setUniversityId(UUID universityId) {
        this.universityId = universityId;
    }

    public UUID getCourseId() {
        return courseId;
    }

    public void setCourseId(UUID courseId) {
        this.courseId = courseId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getWorkflowStage() {
        return workflowStage;
    }

    public void setWorkflowStage(String workflowStage) {
        this.workflowStage = workflowStage;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDateTime getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDateTime deadline) {
        this.deadline = deadline;
    }

    public Long getAssignedAdminId() {
        return assignedAdminId;
    }

    public void setAssignedAdminId(Long assignedAdminId) {
        this.assignedAdminId = assignedAdminId;
    }

    public Integer getCompletionPercentage() {
        return completionPercentage;
    }

    public void setCompletionPercentage(Integer completionPercentage) {
        this.completionPercentage = completionPercentage;
    }

    public Boolean getIsUrgent() {
        return isUrgent;
    }

    public void setIsUrgent(Boolean isUrgent) {
        this.isUrgent = isUrgent;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Json getData() {
        return data;
    }

    public void setData(Json data) {
        this.data = data;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    // Compatibility methods for existing ApplicationService

    /**
     * Legacy compatibility - check if archived (now uses isActive)
     */
    public Boolean getIsArchived() {
        return !Boolean.TRUE.equals(isActive);
    }

    /**
     * Legacy compatibility - check if locked (not supported in simplified version)
     */
    public Boolean getIsLocked() {
        return false; // Simplified version doesn't support locking
    }

    /**
     * Legacy compatibility - update completion status
     */
    public void updateCompletionStatus() {
        // Calculate completion based on available data
        int factors = 0;
        int completed = 0;

        if (isSubmitted()) {
            factors++;
            completed++;
        }
        if (Boolean.TRUE.equals(isDocumentsVerified())) {
            factors++;
            completed++;
        }
        if (Boolean.TRUE.equals(isPaymentCompleted())) {
            factors++;
            completed++;
        }
        if (Boolean.TRUE.equals(isSubmittedToUniversity())) {
            factors++;
            completed++;
        }
        if (isCompleted()) {
            factors++;
            completed++;
        }

        if (factors > 0) {
            this.completionPercentage = (completed * 100) / factors;
        }
    }

    /**
     * Legacy compatibility - archive application
     */
    public void archive(UUID archivedBy, String reason) {
        this.isActive = false;
        this.updatedBy = archivedBy != null ? archivedBy.toString() : null;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Legacy compatibility - check if can be assigned
     */
    public boolean canBeAssigned() {
        return (
            Boolean.TRUE.equals(isActive) &&
            assignedAdminId == null &&
            ("SUBMITTED".equals(status) || "UNDER_REVIEW".equals(status))
        );
    }

    /**
     * Legacy compatibility - assign to admin
     */
    public void assignToAdmin(Long adminId, Long assignedBy) {
        this.assignedAdminId = adminId;
        this.updatedBy = assignedBy != null ? assignedBy.toString() : null;
        this.updatedAt = LocalDateTime.now();

        if ("SUBMITTED".equals(this.status)) {
            this.status = "UNDER_REVIEW";
        }
    }

    /**
     * Legacy compatibility - get target university ID
     */
    public UUID getTargetUniversityId() {
        return this.universityId;
    }

    /**
     * Legacy compatibility - set target university ID
     */
    public void setTargetUniversityId(UUID universityId) {
        this.universityId = universityId;
    }

    /**
     * Legacy compatibility - get target course ID
     */
    public UUID getTargetCourseId() {
        return this.courseId;
    }

    /**
     * Legacy compatibility - set target course ID
     */
    public void setTargetCourseId(UUID courseId) {
        this.courseId = courseId;
    }

    /**
     * Legacy compatibility - get/set previous status (from JSONB)
     */
    public String getPreviousStatus() {
        return extractJsonValue("workflow", "previous_status", String.class);
    }

    public void setPreviousStatus(String previousStatus) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - get/set status reason (from JSONB)
     */
    public String getStatusReason() {
        return extractJsonValue("workflow", "status_reason", String.class);
    }

    public void setStatusReason(String statusReason) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - get/set previous admin ID
     */
    public Long getPreviousAdminId() {
        String id = extractJsonValue(
            "workflow",
            "previous_admin_id",
            String.class
        );
        return id != null ? Long.parseLong(id) : null;
    }

    public void setPreviousAdminId(Long previousAdminId) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - get/set assigned by
     */
    public UUID getAssignedBy() {
        String id = extractJsonValue("workflow", "assigned_by", String.class);
        return id != null ? UUID.fromString(id) : null;
    }

    public void setAssignedBy(UUID assignedBy) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - get/set assigned at
     */
    public LocalDateTime getAssignedAt() {
        String dateStr = extractJsonValue(
            "workflow",
            "assigned_at",
            String.class
        );
        return dateStr != null ? LocalDateTime.parse(dateStr) : null;
    }

    public void setAssignedAt(LocalDateTime assignedAt) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - document verification methods
     */
    public Boolean getAcademicDocumentsVerified() {
        return extractJsonValue(
            "documents",
            "academic_documents_verified",
            Boolean.class
        );
    }

    public void setAcademicDocumentsVerified(boolean verified) {
        // Would need to update JSONB - simplified for now
    }

    public Boolean getEnglishProficiencyVerified() {
        return extractJsonValue(
            "documents",
            "english_proficiency_verified",
            Boolean.class
        );
    }

    public void setEnglishProficiencyVerified(boolean verified) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * @deprecated Use {@link #getCertificatesVerified()} instead.
     */
    @Deprecated
    public Boolean getFinancialDocumentsVerified() {
        return getCertificatesVerified();
    }

    /**
     * @deprecated Use {@link #setCertificatesVerified(boolean)} instead.
     */
    @Deprecated
    public void setFinancialDocumentsVerified(boolean verified) {
        setCertificatesVerified(verified);
    }

    /** Certificates verified flag (replaces financialDocumentsVerified). */
    public Boolean getCertificatesVerified() {
        // Try new key first, fall back to old financial key for backward compat
        Boolean result = extractJsonValue(
            "documents",
            "certificates_verified",
            Boolean.class
        );
        if (result == null) {
            result = extractJsonValue(
                "documents",
                "financial_documents_verified",
                Boolean.class
            );
        }
        return result;
    }

    public void setCertificatesVerified(boolean verified) {
        // Would need to update JSONB - simplified for now
    }

    public Boolean getPersonalDocumentsVerified() {
        return extractJsonValue(
            "documents",
            "personal_documents_verified",
            Boolean.class
        );
    }

    public void setPersonalDocumentsVerified(boolean verified) {
        // Would need to update JSONB - simplified for now
    }

    public Boolean getDocumentsVerified() {
        return isDocumentsVerified();
    }

    public void setDocumentsVerified(boolean verified) {
        // Would need to update JSONB - simplified for now
    }

    public LocalDateTime getDocumentsVerifiedAt() {
        String dateStr = extractJsonValue(
            "documents",
            "documents_verified_at",
            String.class
        );
        return dateStr != null ? LocalDateTime.parse(dateStr) : null;
    }

    public void setDocumentsVerifiedAt(LocalDateTime date) {
        // Would need to update JSONB - simplified for now
    }

    public UUID getDocumentsVerifiedBy() {
        String id = extractJsonValue(
            "documents",
            "documents_verified_by",
            String.class
        );
        return id != null ? UUID.fromString(id) : null;
    }

    public void setDocumentsVerifiedBy(UUID verifiedBy) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - payment methods
     */
    public Boolean getPaymentCompleted() {
        return isPaymentCompleted();
    }

    public void setPaymentCompleted(boolean completed) {
        // Would need to update JSONB - simplified for now
    }

    public LocalDateTime getPaymentCompletedAt() {
        String dateStr = extractJsonValue(
            "payment",
            "payment_completed_at",
            String.class
        );
        return dateStr != null ? LocalDateTime.parse(dateStr) : null;
    }

    public void setPaymentCompletedAt(LocalDateTime date) {
        // Would need to update JSONB - simplified for now
    }

    public String getPaymentReference() {
        return extractJsonValue("payment", "payment_reference", String.class);
    }

    public void setPaymentReference(String reference) {
        // Would need to update JSONB - simplified for now
    }

    public String getPaymentMethod() {
        return extractJsonValue("payment", "payment_method", String.class);
    }

    public void setPaymentMethod(String method) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - flag for attention
     */
    public void flagForAttention(String reason) {
        this.isUrgent = true;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Legacy compatibility - get target semester (from JSONB)
     */
    public String getTargetSemester() {
        return extractJsonValue("academic", "target_semester", String.class);
    }

    /**
     * Legacy compatibility - set target semester
     */
    public void setTargetSemester(String targetSemester) {
        // Initialize JSONB if needed
        if (data == null) {
            data = io.r2dbc.postgresql.codec.Json.of(
                "{\"academic\":{\"target_semester\":\"" +
                    targetSemester +
                    "\"}}"
            );
        } else {
            // Simple replacement for now - full JSONB handling would be more complex
            String jsonStr = data
                .asString()
                .replace(
                    "\"academic\":{",
                    "\"academic\":{\"target_semester\":\"" +
                        targetSemester +
                        "\","
                );
            if (!jsonStr.contains("target_semester")) {
                jsonStr = jsonStr.replace(
                    "}",
                    ",\"academic\":{\"target_semester\":\"" +
                        targetSemester +
                        "\"}}"
                );
            }
            data = io.r2dbc.postgresql.codec.Json.of(jsonStr);
        }
    }

    /**
     * Legacy compatibility - get target year (from JSONB)
     */
    public Integer getTargetYear() {
        return extractJsonValue("academic", "target_year", Integer.class);
    }

    /**
     * Legacy compatibility - set target year
     */
    public void setTargetYear(Integer targetYear) {
        // Initialize JSONB if needed
        if (data == null) {
            data = io.r2dbc.postgresql.codec.Json.of(
                "{\"academic\":{\"target_year\":" + targetYear + "}}"
            );
        } else {
            // Simple replacement for now - full JSONB handling would be more complex
            String jsonStr = data
                .asString()
                .replace(
                    "\"academic\":{",
                    "\"academic\":{\"target_year\":" + targetYear + ","
                );
            if (!jsonStr.contains("target_year")) {
                jsonStr = jsonStr.replace(
                    "}",
                    ",\"academic\":{\"target_year\":" + targetYear + "}}"
                );
            }
            data = io.r2dbc.postgresql.codec.Json.of(jsonStr);
        }
    }

    /**
     * Legacy compatibility - get alternate course ID (from JSONB)
     */
    public UUID getAlternateCourseId() {
        String id = extractJsonValue(
            "alternates",
            "alternate_course_id",
            String.class
        );
        return id != null ? UUID.fromString(id) : null;
    }

    /**
     * Legacy compatibility - set alternate course ID
     */
    public void setAlternateCourseId(UUID alternateCourseId) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - get alternate university ID (from JSONB)
     */
    public UUID getAlternateUniversityId() {
        String id = extractJsonValue(
            "alternates",
            "alternate_university_id",
            String.class
        );
        return id != null ? UUID.fromString(id) : null;
    }

    /**
     * Legacy compatibility - set alternate university ID
     */
    public void setAlternateUniversityId(UUID alternateUniversityId) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - get application type (from JSONB)
     */
    public String getApplicationType() {
        return extractJsonValue("academic", "application_type", String.class);
    }

    /**
     * Legacy compatibility - get program level (uses getProgramName)
     */
    public String getProgramLevel() {
        return getDegreeLevel();
    }

    /**
     * Legacy compatibility - get study mode (from JSONB)
     */
    public String getStudyMode() {
        return extractJsonValue("academic", "study_mode", String.class);
    }

    /**
     * Legacy compatibility - get intake season
     */
    public String getIntakeSeason() {
        return getIntakeTerm();
    }

    /**
     * Legacy compatibility - get status description
     */
    public String getStatusDescription() {
        return switch (status != null ? status : "UNKNOWN") {
            case "DRAFT" -> "Application Draft";
            case "SUBMITTED" -> "Submitted for Review";
            case "UNDER_REVIEW" -> "Under Review";
            case "DOCUMENTS_REQUESTED" -> "Documents Requested";
            case "COMPLETED" -> "Application Completed";
            case "APPROVED" -> "Approved by University";
            case "REJECTED" -> "Rejected by University";
            case "WITHDRAWN" -> "Withdrawn by Student";
            default -> "Unknown Status";
        };
    }

    /**
     * Legacy compatibility - get priority level as integer
     */
    public int getPriorityLevel() {
        return switch (priority != null ? priority : "NORMAL") {
            case "URGENT" -> 4;
            case "HIGH" -> 3;
            case "NORMAL" -> 2;
            case "LOW" -> 1;
            default -> 2;
        };
    }

    /**
     * Legacy compatibility - get is expedited
     */
    public Boolean getIsExpedited() {
        return extractJsonValue("workflow", "is_expedited", Boolean.class);
    }

    /**
     * Legacy compatibility - set is expedited
     */
    public void setIsExpedited(Boolean isExpedited) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - get is fast tracked
     */
    public Boolean getIsFastTracked() {
        return extractJsonValue("workflow", "is_fast_tracked", Boolean.class);
    }

    /**
     * Legacy compatibility - set is fast tracked
     */
    public void setIsFastTracked(Boolean isFastTracked) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - get requires attention
     */
    public Boolean getRequiresAttention() {
        return isUrgent || "ATTENTION_REQUIRED".equals(status);
    }

    /**
     * Legacy compatibility - get has issues
     */
    public Boolean getHasIssues() {
        return extractJsonValue("workflow", "has_issues", Boolean.class);
    }

    /**
     * Legacy compatibility - get assigned counselor ID
     */
    public UUID getAssignedCounselorId() {
        String id = extractJsonValue(
            "workflow",
            "assigned_counselor_id",
            String.class
        );
        return id != null ? UUID.fromString(id) : null;
    }

    /**
     * Legacy compatibility - get university deadline
     */
    public LocalDateTime getUniversityDeadline() {
        String dateStr = extractJsonValue(
            "university",
            "university_deadline",
            String.class
        );
        return dateStr != null ? LocalDateTime.parse(dateStr) : null;
    }

    /**
     * Legacy compatibility - set university deadline
     */
    public void setUniversityDeadline(LocalDateTime universityDeadline) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - get internal deadline
     */
    public LocalDateTime getInternalDeadline() {
        String dateStr = extractJsonValue(
            "university",
            "internal_deadline",
            String.class
        );
        return dateStr != null ? LocalDateTime.parse(dateStr) : null;
    }

    /**
     * Legacy compatibility - set internal deadline
     */
    public void setInternalDeadline(LocalDateTime internalDeadline) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - get SLA deadline
     */
    public LocalDateTime getSlaDeadline() {
        String dateStr = extractJsonValue(
            "tracking",
            "sla_deadline",
            String.class
        );
        return dateStr != null ? LocalDateTime.parse(dateStr) : null;
    }

    /**
     * Legacy compatibility - get next critical deadline
     */
    public LocalDateTime getNextCriticalDeadline() {
        return deadline; // Simplified - use main deadline
    }

    /**
     * Legacy compatibility - get reviewed at
     */
    public LocalDateTime getReviewedAt() {
        String dateStr = extractJsonValue(
            "workflow",
            "reviewed_at",
            String.class
        );
        return dateStr != null ? LocalDateTime.parse(dateStr) : null;
    }

    /**
     * Legacy compatibility - get decision date
     */
    public LocalDateTime getDecisionDate() {
        String dateStr = extractJsonValue(
            "workflow",
            "decision_date",
            String.class
        );
        return dateStr != null ? LocalDateTime.parse(dateStr) : null;
    }

    /**
     * Legacy compatibility - get enrollment deadline
     */
    public LocalDateTime getEnrollmentDeadline() {
        String dateStr = extractJsonValue(
            "workflow",
            "enrollment_deadline",
            String.class
        );
        return dateStr != null ? LocalDateTime.parse(dateStr) : null;
    }

    /**
     * Legacy compatibility - set application fee amount
     */
    public void setApplicationFeeAmount(Double amount) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - set application fee currency
     */
    public void setApplicationFeeCurrency(String currency) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - set service fee amount
     */
    public void setServiceFeeAmount(Double amount) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - set service fee currency
     */
    public void setServiceFeeCurrency(String currency) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - set application data
     */
    public void setApplicationData(
        java.util.Map<String, Object> applicationData
    ) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - set custom fields
     */
    public void setCustomFields(java.util.Map<String, Object> customFields) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - set preferences
     */
    public void setPreferences(java.util.Map<String, Object> preferences) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - set requirements
     */
    public void setRequirements(java.util.Map<String, Object> requirements) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - set reviewed at
     */
    public void setReviewedAt(LocalDateTime reviewedAt) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - set decision date
     */
    public void setDecisionDate(LocalDateTime decisionDate) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - set SLA deadline
     */
    public void setSlaDeadline(LocalDateTime slaDeadline) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - set territory
     */
    public void setTerritory(String territory) {
        // Would need to update JSONB - simplified for now
    }

    /**
     * Legacy compatibility - get missing methods
     */
    public LocalDateTime getVisaDeadline() {
        String dateStr = extractJsonValue(
            "workflow",
            "visa_deadline",
            String.class
        );
        return dateStr != null ? LocalDateTime.parse(dateStr) : null;
    }

    public Integer getDocumentsUploaded() {
        return extractJsonValue(
            "documents",
            "documents_uploaded",
            Integer.class
        );
    }

    public Integer getDocumentsRequired() {
        return extractJsonValue(
            "documents",
            "documents_required",
            Integer.class
        );
    }

    public Boolean hasCompleteDocuments() {
        return Boolean.TRUE.equals(isDocumentsVerified());
    }

    public Boolean getSubmittedToUniversity() {
        return isSubmittedToUniversity();
    }

    public LocalDateTime getSubmittedToUniversityAt() {
        String dateStr = extractJsonValue(
            "university",
            "submitted_to_university_at",
            String.class
        );
        return dateStr != null ? LocalDateTime.parse(dateStr) : null;
    }

    public String getUniversityPortalId() {
        return extractJsonValue(
            "university",
            "university_portal_id",
            String.class
        );
    }

    public String getUniversityStatus() {
        return extractJsonValue(
            "university",
            "university_status",
            String.class
        );
    }

    public String getUniversityNotes() {
        return extractJsonValue("university", "university_notes", String.class);
    }

    public Boolean isReadyForUniversitySubmission() {
        return (
            isCompleted() &&
            Boolean.TRUE.equals(isDocumentsVerified()) &&
            Boolean.TRUE.equals(isPaymentCompleted())
        );
    }

    public Double getServiceFeeAmount() {
        Number amount = extractJsonValue(
            "payment",
            "service_fee_amount",
            Number.class
        );
        return amount != null ? amount.doubleValue() : null;
    }

    public String getServiceFeeCurrency() {
        return extractJsonValue(
            "payment",
            "service_fee_currency",
            String.class
        );
    }

    public Boolean getRefundRequested() {
        return extractJsonValue("payment", "refund_requested", Boolean.class);
    }

    public Double getRefundAmount() {
        Number amount = extractJsonValue(
            "payment",
            "refund_amount",
            Number.class
        );
        return amount != null ? amount.doubleValue() : null;
    }

    public String getRefundReason() {
        return extractJsonValue("payment", "refund_reason", String.class);
    }

    public Boolean hasCompletedPayment() {
        return isPaymentCompleted();
    }

    public LocalDateTime getLastContactDate() {
        String dateStr = extractJsonValue(
            "tracking",
            "last_contact_date",
            String.class
        );
        return dateStr != null ? LocalDateTime.parse(dateStr) : null;
    }

    public String getLastContactType() {
        return extractJsonValue("tracking", "last_contact_type", String.class);
    }

    public String getLastContactNotes() {
        return extractJsonValue("tracking", "last_contact_notes", String.class);
    }

    public LocalDateTime getNextFollowupDate() {
        String dateStr = extractJsonValue(
            "tracking",
            "next_followup_date",
            String.class
        );
        return dateStr != null ? LocalDateTime.parse(dateStr) : null;
    }

    public String getFollowupReason() {
        return extractJsonValue("tracking", "followup_reason", String.class);
    }

    public Boolean getStudentContacted() {
        return extractJsonValue("tracking", "student_contacted", Boolean.class);
    }

    public LocalDateTime getStudentLastResponse() {
        String dateStr = extractJsonValue(
            "tracking",
            "student_last_response",
            String.class
        );
        return dateStr != null ? LocalDateTime.parse(dateStr) : null;
    }

    public Integer getNotesCount() {
        return extractJsonValue("metadata", "notes_count", Integer.class);
    }

    public Integer getMessagesCount() {
        return extractJsonValue("metadata", "messages_count", Integer.class);
    }

    public Integer getDocumentsCount() {
        return extractJsonValue("metadata", "documents_count", Integer.class);
    }

    public Integer getAttachmentsCount() {
        return extractJsonValue("metadata", "attachments_count", Integer.class);
    }

    public Integer getRevisionsCount() {
        return extractJsonValue("metadata", "revisions_count", Integer.class);
    }

    public Integer getExtensionsCount() {
        return extractJsonValue("metadata", "extensions_count", Integer.class);
    }

    public Integer getProcessingTimeHours() {
        return extractJsonValue(
            "tracking",
            "processing_time_hours",
            Integer.class
        );
    }

    public Integer getResponseTimeHours() {
        return extractJsonValue(
            "tracking",
            "response_time_hours",
            Integer.class
        );
    }

    public Integer getFirstResponseTimeHours() {
        return extractJsonValue(
            "tracking",
            "first_response_time_hours",
            Integer.class
        );
    }

    public Boolean getIsOverdue() {
        return extractJsonValue("tracking", "is_overdue", Boolean.class);
    }

    public Boolean getSlaBreached() {
        return extractJsonValue("tracking", "sla_breached", Boolean.class);
    }

    public String getSlaBreachReason() {
        return extractJsonValue("tracking", "sla_breach_reason", String.class);
    }

    public Integer getEscalationLevel() {
        return extractJsonValue("tracking", "escalation_level", Integer.class);
    }

    public LocalDateTime getEscalatedAt() {
        String dateStr = extractJsonValue(
            "tracking",
            "escalated_at",
            String.class
        );
        return dateStr != null ? LocalDateTime.parse(dateStr) : null;
    }

    public UUID getEscalatedTo() {
        String id = extractJsonValue("tracking", "escalated_to", String.class);
        return id != null ? UUID.fromString(id) : null;
    }

    public Boolean isDeadlineApproaching() {
        return (
            deadline != null &&
            deadline.isBefore(LocalDateTime.now().plusDays(7))
        );
    }

    public Boolean isPastDeadline() {
        return deadline != null && deadline.isBefore(LocalDateTime.now());
    }

    public Double getQualityScore() {
        Number score = extractJsonValue(
            "tracking",
            "quality_score",
            Number.class
        );
        return score != null ? score.doubleValue() : null;
    }

    public Integer getStudentSatisfactionRating() {
        return extractJsonValue(
            "tracking",
            "student_satisfaction_rating",
            Integer.class
        );
    }

    public String getProcessingComplexity() {
        return extractJsonValue(
            "tracking",
            "processing_complexity",
            String.class
        );
    }

    public String getRiskLevel() {
        return extractJsonValue("tracking", "risk_level", String.class);
    }

    public LocalDateTime getArchivedAt() {
        String dateStr = extractJsonValue(
            "metadata",
            "archived_at",
            String.class
        );
        return dateStr != null ? LocalDateTime.parse(dateStr) : null;
    }

    public UUID getArchivedBy() {
        String id = extractJsonValue("metadata", "archived_by", String.class);
        return id != null ? UUID.fromString(id) : null;
    }

    public String getArchiveReason() {
        return extractJsonValue("metadata", "archive_reason", String.class);
    }

    public UUID getLockedBy() {
        String id = extractJsonValue("metadata", "locked_by", String.class);
        return id != null ? UUID.fromString(id) : null;
    }

    public LocalDateTime getLockedAt() {
        String dateStr = extractJsonValue(
            "metadata",
            "locked_at",
            String.class
        );
        return dateStr != null ? LocalDateTime.parse(dateStr) : null;
    }

    public String getLockReason() {
        return extractJsonValue("metadata", "lock_reason", String.class);
    }

    public String getClientId() {
        return extractJsonValue("metadata", "client_id", String.class);
    }

    public String getTenantId() {
        return extractJsonValue("metadata", "tenant_id", String.class);
    }

    public String getTerritory() {
        return extractJsonValue("metadata", "territory", String.class);
    }

    public String getRegion() {
        return extractJsonValue("metadata", "region", String.class);
    }

    public String getCountryCode() {
        return extractJsonValue("metadata", "country_code", String.class);
    }

    public String getLanguagePreference() {
        return extractJsonValue(
            "metadata",
            "language_preference",
            String.class
        );
    }

    public String getTimezone() {
        return extractJsonValue("metadata", "timezone", String.class);
    }

    public String getExternalReferenceId() {
        return extractJsonValue(
            "metadata",
            "external_reference_id",
            String.class
        );
    }

    public String getSourceSystem() {
        return extractJsonValue("metadata", "source_system", String.class);
    }

    public String getMigrationId() {
        return extractJsonValue("metadata", "migration_id", String.class);
    }

    public Boolean getSyncRequired() {
        return extractJsonValue("metadata", "sync_required", Boolean.class);
    }

    public LocalDateTime getLastSyncAt() {
        String dateStr = extractJsonValue(
            "metadata",
            "last_sync_at",
            String.class
        );
        return dateStr != null ? LocalDateTime.parse(dateStr) : null;
    }

    public java.util.Map<String, Object> getApplicationData() {
        // Return empty map for now - would need JSON parsing
        return new java.util.HashMap<>();
    }

    public java.util.Map<String, Object> getCustomFields() {
        // Return empty map for now - would need JSON parsing
        return new java.util.HashMap<>();
    }

    public java.util.Map<String, Object> getPreferences() {
        // Return empty map for now - would need JSON parsing
        return new java.util.HashMap<>();
    }

    public java.util.Map<String, Object> getRequirements() {
        // Return empty map for now - would need JSON parsing
        return new java.util.HashMap<>();
    }

    public java.util.Map<String, Object> getEvaluationCriteria() {
        // Return empty map for now - would need JSON parsing
        return new java.util.HashMap<>();
    }

    public java.util.Map<String, Object> getAnalyticsData() {
        // Return empty map for now - would need JSON parsing
        return new java.util.HashMap<>();
    }

    public java.util.Map<String, Object> getIntegrationData() {
        // Return empty map for now - would need JSON parsing
        return new java.util.HashMap<>();
    }

    public Long getVersion() {
        return 1L; // Default version
    }

    /**
     * Legacy compatibility - Application builder pattern
     */
    public static ApplicationBuilder builder() {
        return new ApplicationBuilder();
    }

    public static class ApplicationBuilder {

        private Application application;

        public ApplicationBuilder() {
            this.application = new Application();
        }

        public ApplicationBuilder id(UUID id) {
            application.setId(id);
            return this;
        }

        public ApplicationBuilder referenceNumber(String referenceNumber) {
            application.setReferenceNumber(referenceNumber);
            return this;
        }

        public ApplicationBuilder studentId(Long studentId) {
            application.setStudentId(studentId);
            return this;
        }

        public ApplicationBuilder targetUniversityId(UUID universityId) {
            application.setUniversityId(universityId);
            return this;
        }

        public ApplicationBuilder targetCourseId(UUID courseId) {
            application.setCourseId(courseId);
            return this;
        }

        public ApplicationBuilder status(String status) {
            application.setStatus(status);
            return this;
        }

        public ApplicationBuilder workflowStage(String workflowStage) {
            application.setWorkflowStage(workflowStage);
            return this;
        }

        public ApplicationBuilder priority(String priority) {
            application.setPriority(priority);
            return this;
        }

        public ApplicationBuilder submittedAt(LocalDateTime submittedAt) {
            application.setSubmittedAt(submittedAt);
            return this;
        }

        public ApplicationBuilder deadline(LocalDateTime deadline) {
            application.setDeadline(deadline);
            return this;
        }

        public ApplicationBuilder assignedAdminId(Long assignedAdminId) {
            application.setAssignedAdminId(assignedAdminId);
            return this;
        }

        public ApplicationBuilder completionPercentage(
            Integer completionPercentage
        ) {
            application.setCompletionPercentage(completionPercentage);
            return this;
        }

        public ApplicationBuilder isUrgent(Boolean isUrgent) {
            application.setIsUrgent(isUrgent);
            return this;
        }

        public ApplicationBuilder isActive(Boolean isActive) {
            application.setIsActive(isActive);
            return this;
        }

        public ApplicationBuilder data(Json data) {
            application.setData(data);
            return this;
        }

        public ApplicationBuilder createdAt(LocalDateTime createdAt) {
            application.setCreatedAt(createdAt);
            return this;
        }

        public ApplicationBuilder updatedAt(LocalDateTime updatedAt) {
            application.setUpdatedAt(updatedAt);
            return this;
        }

        public ApplicationBuilder createdBy(String createdBy) {
            application.setCreatedBy(createdBy);
            return this;
        }

        public ApplicationBuilder updatedBy(String updatedBy) {
            application.setUpdatedBy(updatedBy);
            return this;
        }

        // Legacy compatibility builder methods
        public ApplicationBuilder targetSemester(String targetSemester) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder targetYear(Integer targetYear) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder alternateCourseId(UUID alternateCourseId) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder alternateUniversityId(
            UUID alternateUniversityId
        ) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder applicationType(String applicationType) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder programLevel(String programLevel) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder studyMode(String studyMode) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder intakeSeason(String intakeSeason) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder isExpedited(Boolean isExpedited) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder universityDeadline(
            LocalDateTime universityDeadline
        ) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder internalDeadline(
            LocalDateTime internalDeadline
        ) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder applicationFeeAmount(
            Double applicationFeeAmount
        ) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder applicationFeeCurrency(
            String applicationFeeCurrency
        ) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder serviceFeeAmount(Double serviceFeeAmount) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder serviceFeeCurrency(
            String serviceFeeCurrency
        ) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder clientId(String clientId) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder tenantId(String tenantId) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder countryCode(String countryCode) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder territory(String territory) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder region(String region) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder languagePreference(
            String languagePreference
        ) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder timezone(String timezone) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder applicationData(
            java.util.Map<String, Object> applicationData
        ) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder customFields(
            java.util.Map<String, Object> customFields
        ) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder preferences(
            java.util.Map<String, Object> preferences
        ) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder requirements(
            java.util.Map<String, Object> requirements
        ) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public ApplicationBuilder isFastTracked(Boolean isFastTracked) {
            // Store in JSONB data - simplified for now
            return this;
        }

        public Application build() {
            return application;
        }
    }

    @Override
    public String toString() {
        return (
            "Application{" +
            "id=" +
            id +
            ", referenceNumber='" +
            referenceNumber +
            '\'' +
            ", studentId=" +
            studentId +
            ", universityId=" +
            universityId +
            ", courseId=" +
            courseId +
            ", status='" +
            status +
            '\'' +
            ", workflowStage='" +
            workflowStage +
            '\'' +
            ", completionPercentage=" +
            completionPercentage +
            ", isUrgent=" +
            isUrgent +
            ", submittedAt=" +
            submittedAt +
            '}'
        );
    }
}
