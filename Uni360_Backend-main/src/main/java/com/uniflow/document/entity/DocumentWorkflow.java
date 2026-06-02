package com.uniflow.document.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * DocumentWorkflow Entity - Journey-Specific Workflow Management
 *
 * <p>This entity manages the workflow aspects of document processing including
 * verification, review, approval processes. It links to DocumentsUpload for
 * the actual file tracking while focusing on business workflow logic.
 *
 * <p>Key Features:
 * - Links to uploaded files via upload_id
 * - Document verification and review workflow
 * - Admin assignment and approval tracking
 * - Application-specific document requirements
 * - Version control and deadline management
 * - Reactive R2DBC compatible
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("document_workflow")
public class DocumentWorkflow {

    @Id
    @Column("id")
    private UUID id;

    /** Reference to the actual uploaded file */
    @Column("upload_id")
    @JsonProperty("upload_id")
    private UUID uploadId;

    /** Reference to the main workflow instance */
    @Column("workflow_instance_id")
    @JsonProperty("workflow_instance_id")
    private String workflowInstanceId;

    /** Student this document workflow belongs to */
    @Column("student_id")
    @JsonProperty("student_id")
    private Long studentId;

    /** Application this document is related to */
    @Column("application_id")
    @JsonProperty("application_id")
    private UUID applicationId;

    /** Type of document for workflow purposes */
    @Column("document_type")
    @JsonProperty("document_type")
    private String documentType; // PASSPORT, TRANSCRIPTS, CV_RESUME, etc.

    /** Category for grouping documents */
    @Column("document_category")
    @JsonProperty("document_category")
    private String documentCategory; // IDENTITY, ACADEMIC, FINANCIAL, etc.

    /** Display name for the document */
    @Column("document_name")
    @JsonProperty("document_name")
    private String documentName;

    /** Current verification status */
    @Column("verification_status")
    @JsonProperty("verification_status")
    @Builder.Default
    private String verificationStatus = "PENDING"; // PENDING, VERIFIED, REJECTED, REUPLOAD_REQUIRED

    /** Current review status */
    @Column("review_status")
    @JsonProperty("review_status")
    @Builder.Default
    private String reviewStatus = "AWAITING_REVIEW"; // AWAITING_REVIEW, IN_REVIEW, REVIEWED

    /** Admin who reviewed this document */
    @Column("reviewed_by")
    @JsonProperty("reviewed_by")
    private Long reviewedBy;

    /** When the document was reviewed */
    @Column("reviewed_at")
    @JsonProperty("reviewed_at")
    private LocalDateTime reviewedAt;

    /** Notes from verification/review process */
    @Column("verification_notes")
    @JsonProperty("verification_notes")
    private String verificationNotes;

    /** Reason for rejection if applicable */
    @Column("rejection_reason")
    @JsonProperty("rejection_reason")
    private String rejectionReason;

    /** Current workflow stage */
    @Column("workflow_stage")
    @JsonProperty("workflow_stage")
    private String workflowStage;

    /** Related task ID for workflow tracking */
    @Column("task_id")
    @JsonProperty("task_id")
    private String taskId;

    /** Whether this document is required */
    @Column("is_required")
    @JsonProperty("is_required")
    @Builder.Default
    private Boolean isRequired = false;

    /** Workflow stage this document is required for */
    @Column("required_for_stage")
    @JsonProperty("required_for_stage")
    private String requiredForStage;

    /** Submission deadline for this document */
    @Column("submission_deadline")
    @JsonProperty("submission_deadline")
    private LocalDateTime submissionDeadline;

    /** Document version number */
    @Column("version")
    @Builder.Default
    private Integer version = 1;

    /** Whether this is the current version */
    @Column("is_current_version")
    @JsonProperty("is_current_version")
    @Builder.Default
    private Boolean isCurrentVersion = true;

    /** When the workflow record was created */
    @CreatedDate
    @Column("created_at")
    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    /** When the workflow record was last modified */
    @LastModifiedDate
    @Column("updated_at")
    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;

    /**
     * Verify the document
     */
    public void verify(Long reviewerId, String notes) {
        this.verificationStatus = "VERIFIED";
        this.reviewStatus = "REVIEWED";
        this.reviewedBy = reviewerId;
        this.reviewedAt = LocalDateTime.now();
        this.verificationNotes = notes;
    }

    /**
     * Reject the document
     */
    public void reject(Long reviewerId, String reason, String notes) {
        this.verificationStatus = "REJECTED";
        this.reviewStatus = "REVIEWED";
        this.reviewedBy = reviewerId;
        this.reviewedAt = LocalDateTime.now();
        this.rejectionReason = reason;
        this.verificationNotes = notes;
    }

    /**
     * Request reupload
     */
    public void requestReupload(Long reviewerId, String reason, String notes) {
        this.verificationStatus = "REUPLOAD_REQUIRED";
        this.reviewStatus = "REVIEWED";
        this.reviewedBy = reviewerId;
        this.reviewedAt = LocalDateTime.now();
        this.rejectionReason = reason;
        this.verificationNotes = notes;
    }

    /**
     * Update verification status with reviewer info
     */
    public void updateVerificationStatus(
        String status,
        Long reviewerId,
        String notes
    ) {
        this.verificationStatus = status;
        this.reviewStatus = "REVIEWED";
        this.reviewedBy = reviewerId;
        this.reviewedAt = LocalDateTime.now();
        this.verificationNotes = notes;
    }

    /**
     * Check if document is pending review
     */
    public boolean isPendingReview() {
        return (
            "PENDING".equals(verificationStatus) &&
            "AWAITING_REVIEW".equals(reviewStatus)
        );
    }

    /**
     * Check if document is verified
     */
    public boolean isVerified() {
        return "VERIFIED".equals(verificationStatus);
    }

    /**
     * Check if document is rejected
     */
    public boolean isRejected() {
        return "REJECTED".equals(verificationStatus);
    }

    /**
     * Check if document needs reupload
     */
    public boolean needsReupload() {
        return "REUPLOAD_REQUIRED".equals(verificationStatus);
    }

    /**
     * Check if document is in review
     */
    public boolean isInReview() {
        return "IN_REVIEW".equals(reviewStatus);
    }

    /**
     * Check if document has been reviewed
     */
    public boolean isReviewed() {
        return "REVIEWED".equals(reviewStatus);
    }

    /**
     * Check if document is overdue
     */
    public boolean isOverdue() {
        return (
            submissionDeadline != null &&
            LocalDateTime.now().isAfter(submissionDeadline) &&
            !isVerified()
        );
    }

    /**
     * Mark old versions as not current
     */
    public void markAsOldVersion() {
        this.isCurrentVersion = false;
    }

    /**
     * Mark as current version
     */
    public void markAsCurrentVersion() {
        this.isCurrentVersion = true;
    }
}
