package com.uniflow.student.dto.application;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for application progress endpoint
 * Used for GET /api/v1/students/applications/{id}/progress API
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationProgressResponseDTO {

    private UUID applicationId;
    private String referenceNumber;
    private ApplicationWorkflowStage currentStage;
    private String currentStageName;
    private ApplicationStatus status;
    private Integer completionPercentage;
    private Integer stepsCompleted;
    private Integer totalSteps;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime submittedAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime lastUpdated;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime nextDeadline;

    private Boolean requiresStudentAction;
    private String nextActionRequired;
    private AssignedAdminProgressDTO assignedAdmin;
    private DocumentProgressDTO documentProgress;
    private PaymentProgressDTO paymentProgress;
    private UniversitySubmissionDTO universitySubmission;
    private List<StageProgressDTO> stageProgress;
    private List<StudentTaskDTO> studentTasks;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime estimatedCompletion;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignedAdminProgressDTO {

        private Long id;
        private String name;
        private String email;
        private String specialization;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime assignedAt;

        private String contactInstructions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentProgressDTO {

        private Boolean allDocumentsVerified;
        private Integer totalDocuments;
        private Integer verifiedDocuments;
        private AcademicDocumentStatus academicDocuments;
        private EnglishProficiencyStatus englishProficiency;

        @com.fasterxml.jackson.annotation.JsonProperty("Certificates")
        private CertificateDocumentStatus certificates;

        private PersonalDocumentStatus personalDocuments;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime lastVerificationDate;

        private List<String> pendingDocuments;
        private List<String> rejectedDocuments;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentProgressDTO {

        private Boolean paymentCompleted;
        private PaymentStatus status;
        private String applicationFeeAmount;
        private String applicationFeeCurrency;
        private String serviceFeeAmount;
        private String serviceFeeCurrency;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime paymentCompletedAt;

        private String paymentMethod;
        private String paymentReference;
        private String paymentInstructions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UniversitySubmissionDTO {

        private Boolean submitted;
        private String universityReferenceNumber;
        private String universityPortalId;
        private UniversityApplicationStatus universityStatus;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime submittedToUniversityAt;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime universityDeadline;

        private String universityContactInfo;
        private String trackingInstructions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StageProgressDTO {

        private ApplicationWorkflowStage stage;
        private String stageName;
        private StageStatus status;
        private Integer completedTasks;
        private Integer totalTasks;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime startedAt;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime completedAt;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime estimatedCompletion;

        private List<TaskProgressDTO> tasks;
        private String stageInstructions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskProgressDTO {

        private String taskId;
        private String taskName;
        private String taskDescription;
        private TaskStatus status;
        private TaskPriority priority;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime dueDate;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime completedAt;

        private String assignedTo;
        private Boolean requiresStudentAction;
        private String studentInstructions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentTaskDTO {

        private String taskType;
        private String taskDescription;
        private TaskPriority priority;
        private TaskStatus status;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime dueDate;

        private String actionRequired;
        private String instructions;
        private List<String> requiredDocuments;
        private String contactForHelp;
    }

    // Enums for type safety

    public enum ApplicationStatus {
        DRAFT,
        SUBMITTED,
        UNDER_REVIEW,
        DOCUMENTS_REQUESTED,
        DOCUMENTS_VERIFIED,
        PAYMENT_PENDING,
        PAYMENT_COMPLETED,
        UNIVERSITY_SUBMITTED,
        ACCEPTED,
        REJECTED,
        ENROLLED,
        WITHDRAWN,
        EXPIRED,
    }

    public enum ApplicationWorkflowStage {
        DRAFT,
        SUBMISSION,
        DOCUMENT_VERIFICATION,
        APS_CERTIFICATE,
        PAYMENT_PROCESSING,
        // UK Workflow Specific Stages
        CONDITIONAL_OFFER,
        CAS_INTERVIEW,
        FEES_PAYMENT,
        UNCONDITIONAL_OFFER,
        VISA_APPLICATION,
        // Shared Final Stages
        UNIVERSITY_SUBMISSION,
        UNIVERSITY_REVIEW,
        DECISION,
        ENROLLMENT,
        COMPLETED,
        CLOSED,
    }

    public enum AcademicDocumentStatus {
        NOT_SUBMITTED,
        SUBMITTED,
        UNDER_REVIEW,
        VERIFIED,
        REJECTED,
        NEEDS_TRANSLATION,
    }

    public enum EnglishProficiencyStatus {
        NOT_REQUIRED,
        NOT_SUBMITTED,
        SUBMITTED,
        UNDER_REVIEW,
        VERIFIED,
        REJECTED,
        EXPIRED,
    }

    /**
     * @deprecated Use {@link CertificateDocumentStatus} instead.
     */
    @Deprecated
    public enum FinancialDocumentStatus {
        NOT_SUBMITTED,
        SUBMITTED,
        UNDER_REVIEW,
        VERIFIED,
        REJECTED,
        INSUFFICIENT_FUNDS,
    }

    /** Status for the Certificates document group (replaces FinancialDocumentStatus). */
    public enum CertificateDocumentStatus {
        NOT_SUBMITTED,
        SUBMITTED,
        UNDER_REVIEW,
        VERIFIED,
        REJECTED,
        INCOMPLETE,
    }

    public enum PersonalDocumentStatus {
        NOT_SUBMITTED,
        SUBMITTED,
        UNDER_REVIEW,
        VERIFIED,
        REJECTED,
        NEEDS_APOSTILLE,
    }

    public enum PaymentStatus {
        NOT_REQUIRED,
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        FAILED,
        REFUNDED,
        CANCELLED,
    }

    public enum UniversityApplicationStatus {
        NOT_SUBMITTED,
        SUBMITTED,
        UNDER_REVIEW,
        ACCEPTED,
        REJECTED,
        WAITLISTED,
        DEFERRED,
    }

    public enum StageStatus {
        NOT_STARTED,
        IN_PROGRESS,
        COMPLETED,
        BLOCKED,
        SKIPPED,
        FAILED,
    }

    public enum TaskStatus {
        NOT_STARTED,
        IN_PROGRESS,
        COMPLETED,
        BLOCKED,
        CANCELLED,
        FAILED,
        OVERDUE,
    }

    public enum TaskPriority {
        LOW,
        NORMAL,
        HIGH,
        URGENT,
        CRITICAL,
    }
}
