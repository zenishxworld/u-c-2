package com.uniflow.student.dto.document;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Student Document DTOs - AD-02-04 Implementation
 *
 * <p>Data Transfer Objects for student-facing document management operations.
 * Provides structured responses for document overview, uploads, and status tracking.
 *
 * <p>Key Features:
 * - Student document overview DTOs
 * - Document upload and status DTOs
 * - Pending/uploaded/reupload document categories
 * - Integration with existing document workflow system
 *
 * @author AI Agent - AD-02-04 Implementation
 * @since 1.0.0
 */
public class StudentDocumentDTO {

    /**
     * Response DTO for student document overview
     * Shows comprehensive document status across all categories
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentOverviewResponse {

        @JsonProperty("success")
        private Boolean success;

        @JsonProperty("message")
        private String message;

        @JsonProperty("student_id")
        private Long studentId;

        @JsonProperty("overview_summary")
        private DocumentOverviewSummary overviewSummary;

        @JsonProperty("pending_documents")
        private List<PendingDocumentItem> pendingDocuments;

        @JsonProperty("uploaded_documents")
        private List<UploadedDocumentItem> uploadedDocuments;

        @JsonProperty("reupload_required")
        private List<ReuploadDocumentItem> reuploadRequired;

        @JsonProperty("completion_percentage")
        private Integer completionPercentage;

        @JsonProperty("next_deadline")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime nextDeadline;
    }

    /**
     * Summary statistics for document overview
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentOverviewSummary {

        @JsonProperty("total_required")
        private Integer totalRequired;

        @JsonProperty("uploaded_count")
        private Integer uploadedCount;

        @JsonProperty("verified_count")
        private Integer verifiedCount;

        @JsonProperty("pending_review_count")
        private Integer pendingReviewCount;

        @JsonProperty("rejected_count")
        private Integer rejectedCount;

        @JsonProperty("overall_status")
        private String overallStatus;
    }

    /**
     * Response DTO for pending documents list
     * Documents that student needs to upload
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PendingDocumentsResponse {

        @JsonProperty("success")
        private Boolean success;

        @JsonProperty("message")
        private String message;

        @JsonProperty("pending_documents")
        private List<PendingDocumentItem> pendingDocuments;

        @JsonProperty("total_pending")
        private Integer totalPending;
    }

    /**
     * Individual pending document item
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PendingDocumentItem {

        @JsonProperty("document_type")
        private String documentType;

        @JsonProperty("display_name")
        private String displayName;

        @JsonProperty("description")
        private String description;

        @JsonProperty("is_required")
        private Boolean isRequired;

        /** Category: ACADEMIC | LANGUAGE | PERSONAL | CERTIFICATE | OTHER */
        @JsonProperty("document_category")
        private String documentCategory;

        /** Custom name supplied by student for OTHER_DOC uploads */
        @JsonProperty("custom_name")
        private String customName;

        @JsonProperty("submission_deadline")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime submissionDeadline;

        @JsonProperty("days_until_deadline")
        private Long daysUntilDeadline;

        @JsonProperty("priority_level")
        private String priorityLevel;

        @JsonProperty("accepted_formats")
        private List<String> acceptedFormats;

        @JsonProperty("max_file_size")
        private String maxFileSize;
    }

    /**
     * Response DTO for uploaded documents list
     * Documents that student has uploaded and their status
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UploadedDocumentsResponse {

        @JsonProperty("success")
        private Boolean success;

        @JsonProperty("message")
        private String message;

        @JsonProperty("uploaded_documents")
        private List<UploadedDocumentItem> uploadedDocuments;

        @JsonProperty("total_uploaded")
        private Integer totalUploaded;
    }

    /**
     * Individual uploaded document item
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UploadedDocumentItem {

        @JsonProperty("workflow_id")
        private UUID workflowId;

        @JsonProperty("upload_id")
        private UUID uploadId;

        @JsonProperty("document_type")
        private String documentType;

        @JsonProperty("display_name")
        private String displayName;

        /** Category: ACADEMIC | LANGUAGE | PERSONAL | CERTIFICATE | OTHER */
        @JsonProperty("document_category")
        private String documentCategory;

        @JsonProperty("file_name")
        private String fileName;

        @JsonProperty("file_size")
        private Long fileSize;

        @JsonProperty("verification_status")
        private String verificationStatus;

        @JsonProperty("review_status")
        private String reviewStatus;

        @JsonProperty("status_display")
        private String statusDisplay;

        @JsonProperty("uploaded_at")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime uploadedAt;

        @JsonProperty("reviewed_at")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime reviewedAt;

        @JsonProperty("view_url_available")
        private Boolean viewUrlAvailable;

        @JsonProperty("can_delete")
        private Boolean canDelete;

        @JsonProperty("review_notes")
        private String reviewNotes;
    }

    /**
     * Response DTO for documents requiring reupload
     * Documents that were rejected and need to be uploaded again
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReuploadDocumentsResponse {

        @JsonProperty("success")
        private Boolean success;

        @JsonProperty("message")
        private String message;

        @JsonProperty("reupload_documents")
        private List<ReuploadDocumentItem> reuploadDocuments;

        @JsonProperty("total_reupload_required")
        private Integer totalReuploadRequired;
    }

    /**
     * Individual document requiring reupload
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReuploadDocumentItem {

        @JsonProperty("workflow_id")
        private UUID workflowId;

        @JsonProperty("document_type")
        private String documentType;

        @JsonProperty("display_name")
        private String displayName;

        /** Category: ACADEMIC | LANGUAGE | PERSONAL | CERTIFICATE | OTHER */
        @JsonProperty("document_category")
        private String documentCategory;

        @JsonProperty("previous_file_name")
        private String previousFileName;

        @JsonProperty("rejection_reason")
        private String rejectionReason;

        @JsonProperty("review_notes")
        private String reviewNotes;

        @JsonProperty("rejected_at")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime rejectedAt;

        @JsonProperty("resubmission_deadline")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime resubmissionDeadline;

        @JsonProperty("days_until_deadline")
        private Long daysUntilDeadline;

        @JsonProperty("accepted_formats")
        private List<String> acceptedFormats;

        @JsonProperty("max_file_size")
        private String maxFileSize;

        @JsonProperty("requirements")
        private String requirements;
    }

    /**
     * Request DTO for student document upload
     * Used when student uploads documents through their portal
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentUploadRequest {

        @JsonProperty("document_type")
        private String documentType;

        @JsonProperty("application_id")
        private UUID applicationId;

        @JsonProperty("workflow_stage")
        private String workflowStage;

        @JsonProperty("notes")
        private String notes;
    }

    /**
     * Response DTO for student document upload
     * Confirms upload and provides workflow information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentUploadResponse {

        @JsonProperty("success")
        private Boolean success;

        @JsonProperty("message")
        private String message;

        @JsonProperty("upload_id")
        private UUID uploadId;

        @JsonProperty("workflow_id")
        private UUID workflowId;

        @JsonProperty("document_type")
        private String documentType;

        /**
         * Human-readable name supplied by the student when document_type is OTHER_DOC.
         * Null for all standard document types.
         */
        @JsonProperty("custom_name")
        private String customName;

        @JsonProperty("file_name")
        private String fileName;

        @JsonProperty("file_size")
        private Long fileSize;

        @JsonProperty("verification_status")
        private String verificationStatus;

        @JsonProperty("review_status")
        private String reviewStatus;

        @JsonProperty("upload_timestamp")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime uploadTimestamp;

        @JsonProperty("estimated_review_time")
        private String estimatedReviewTime;
    }

    /**
     * Request DTO for bulk document upload
     * Used when student uploads multiple documents at once
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkUploadRequest {

        @JsonProperty("application_id")
        private UUID applicationId;

        @JsonProperty("workflow_stage")
        private String workflowStage;

        @JsonProperty("document_uploads")
        private List<DocumentUploadItem> documentUploads;

        @JsonProperty("notes")
        private String notes;
    }

    /**
     * Individual document item for bulk upload
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentUploadItem {

        @JsonProperty("document_type")
        private String documentType;

        @JsonProperty("notes")
        private String notes;
    }

    /**
     * Response DTO for bulk document upload
     * Shows results of multiple document uploads
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkUploadResponse {

        @JsonProperty("success")
        private Boolean success;

        @JsonProperty("message")
        private String message;

        @JsonProperty("total_uploaded")
        private Integer totalUploaded;

        @JsonProperty("successful_uploads")
        private List<StudentUploadResponse> successfulUploads;

        @JsonProperty("failed_uploads")
        private List<FailedUploadItem> failedUploads;

        @JsonProperty("upload_summary")
        private BulkUploadSummary uploadSummary;
    }

    /**
     * Failed upload item for bulk operations
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FailedUploadItem {

        @JsonProperty("document_type")
        private String documentType;

        @JsonProperty("error_message")
        private String errorMessage;

        @JsonProperty("error_code")
        private String errorCode;
    }

    /**
     * Summary for bulk upload operations
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkUploadSummary {

        @JsonProperty("total_attempted")
        private Integer totalAttempted;

        @JsonProperty("successful_count")
        private Integer successfulCount;

        @JsonProperty("failed_count")
        private Integer failedCount;

        @JsonProperty("completion_percentage")
        private Integer completionPercentage;

        @JsonProperty("next_steps")
        private String nextSteps;
    }
}
