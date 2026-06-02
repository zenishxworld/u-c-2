package com.uniflow.document.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Document Workflow DTOs - AD-02-03 Implementation
 *
 * <p>Data Transfer Objects for document workflow management operations.
 * Provides structured responses for workflow status, reviews, and management.
 *
 * <p>Key Features:
 * - Workflow status tracking DTOs
 * - Admin review management DTOs
 * - Student document status DTOs
 * - Pending review management DTOs
 *
 * @author AI Agent - AD-02-03 Implementation
 * @since 1.0.0
 */
public class DocumentWorkflowDTO {

    /**
     * Response DTO for workflow document management
     * Used by admin to view and manage document workflows
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkflowDocumentResponse {

        @JsonProperty("workflow_id")
        private UUID workflowId;

        @JsonProperty("upload_id")
        private UUID uploadId;

        @JsonProperty("student_id")
        private Long studentId;

        @JsonProperty("document_type")
        private String documentType;

        @JsonProperty("file_name")
        private String fileName;

        @JsonProperty("file_size")
        private Long fileSize;

        @JsonProperty("verification_status")
        private String verificationStatus;

        @JsonProperty("review_status")
        private String reviewStatus;

        @JsonProperty("is_required")
        private Boolean isRequired;

        @JsonProperty("submission_deadline")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime submissionDeadline;

        @JsonProperty("reviewed_by")
        private Long reviewedBy;

        @JsonProperty("reviewed_at")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime reviewedAt;

        @JsonProperty("created_at")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime createdAt;
    }

    /**
     * Response DTO for student document workflows
     * Used by student portal to show document status
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentDocumentResponse {

        @JsonProperty("workflow_id")
        private UUID workflowId;

        @JsonProperty("document_type")
        private String documentType;

        @JsonProperty("file_name")
        private String fileName;

        @JsonProperty("verification_status")
        private String verificationStatus;

        @JsonProperty("review_status")
        private String reviewStatus;

        @JsonProperty("is_required")
        private Boolean isRequired;

        @JsonProperty("submission_deadline")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime submissionDeadline;

        @JsonProperty("review_notes")
        private String reviewNotes;

        @JsonProperty("uploaded_at")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime uploadedAt;
    }

    /**
     * Response DTO for documents pending admin review
     * Used by admin dashboard to show review queue
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PendingReviewResponse {

        @JsonProperty("workflow_id")
        private UUID workflowId;

        @JsonProperty("student_id")
        private Long studentId;

        @JsonProperty("document_type")
        private String documentType;

        @JsonProperty("file_name")
        private String fileName;

        @JsonProperty("file_size")
        private Long fileSize;

        @JsonProperty("uploaded_at")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime uploadedAt;

        @JsonProperty("submission_deadline")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime submissionDeadline;

        @JsonProperty("is_required")
        private Boolean isRequired;

        @JsonProperty("workflow_stage")
        private String workflowStage;
    }

    /**
     * Request DTO for creating document workflow
     * Used when linking uploads to workflow management
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateWorkflowRequest {

        @JsonProperty("upload_id")
        private UUID uploadId;

        @JsonProperty("student_id")
        private Long studentId;

        @JsonProperty("application_id")
        private UUID applicationId;

        @JsonProperty("document_type")
        private String documentType;

        @JsonProperty("workflow_stage")
        private String workflowStage;

        @JsonProperty("is_required")
        private Boolean isRequired;

        @JsonProperty("submission_deadline")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime submissionDeadline;
    }

    /**
     * Request DTO for updating workflow status
     * Used by admin to approve/reject documents
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateWorkflowStatusRequest {

        @JsonProperty("verification_status")
        private String verificationStatus;

        @JsonProperty("review_status")
        private String reviewStatus;

        @JsonProperty("review_notes")
        private String reviewNotes;
    }

    /**
     * Response DTO for workflow status updates
     * Used to confirm status changes
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkflowStatusResponse {

        @JsonProperty("success")
        private Boolean success;

        @JsonProperty("message")
        private String message;

        @JsonProperty("workflow_id")
        private UUID workflowId;

        @JsonProperty("verification_status")
        private String verificationStatus;

        @JsonProperty("review_status")
        private String reviewStatus;

        @JsonProperty("reviewed_by")
        private Long reviewedBy;

        @JsonProperty("reviewed_at")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime reviewedAt;
    }

    /**
     * Response DTO for workflow creation
     * Used to confirm workflow was created successfully
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateWorkflowResponse {

        @JsonProperty("success")
        private Boolean success;

        @JsonProperty("message")
        private String message;

        @JsonProperty("workflow_id")
        private UUID workflowId;

        @JsonProperty("upload_id")
        private UUID uploadId;

        @JsonProperty("document_type")
        private String documentType;

        @JsonProperty("verification_status")
        private String verificationStatus;

        @JsonProperty("review_status")
        private String reviewStatus;

        @JsonProperty("created_at")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private LocalDateTime createdAt;
    }

    /**
     * Response DTO for document view URL generation.
     * Fixes admin document view bug — admin gets a 1-hour presigned S3 URL.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ViewUrlResponse {

        @JsonProperty("success")
        private Boolean success;

        @JsonProperty("message")
        private String message;

        @JsonProperty("workflow_id")
        private UUID workflowId;

        @JsonProperty("view_url")
        private String viewUrl;

        @JsonProperty("expires_in")
        private Long expiresIn;

        @JsonProperty("generated_at")
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
        private java.time.LocalDateTime generatedAt;
    }
}
