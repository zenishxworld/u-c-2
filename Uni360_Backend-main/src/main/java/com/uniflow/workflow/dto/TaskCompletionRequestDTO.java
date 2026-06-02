package com.uniflow.workflow.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * TaskCompletionRequestDTO for completing workflow tasks
 *
 * <p>This DTO represents the request payload when an admin completes a task.
 * It includes completion results, notes, and task-specific data.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskCompletionRequestDTO {

    private String taskId;

    private String completedBy;

    @Size(
        max = 2000,
        message = "Completion notes cannot exceed 2000 characters"
    )
    private String completionNotes;

    private Map<String, Object> taskResults;

    // Payment-specific data
    private PaymentDetails paymentDetails;

    // Document verification data
    private List<DocumentData> documentData;

    // Language proficiency data
    private LanguageProficiencyData languageProficiencyData;

    // Research proposal data
    private ResearchProposalData researchProposalData;

    // University submission data
    private UniversitySubmissionData universitySubmissionData;

    // APS Certificate data
    private APSCertificateData apsCertificateData;

    // Interview data
    private InterviewData interviewData;

    @Builder.Default
    private Boolean requiresFollowUp = false;

    private LocalDateTime followUpDate;

    private String followUpReason;

    @Builder.Default
    private Boolean notifyStudent = false;

    private String studentNotificationMessage;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentDetails {

        private BigDecimal amount;
        private String currency;
        private String transactionId;
        private String paymentMethod;
        private LocalDateTime paymentDate;
        private String receiptUrl;
        private String paymentStatus;
        private String paymentGateway;
        private String bankReference;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DocumentData {

        private String documentType;
        private String verificationStatus;
        private String verificationNotes;
        private LocalDateTime verificationDate;
        private String documentUrl;
        private String originalFileName;
        private Boolean requiresResubmission;
        private String resubmissionReason;
        private LocalDate expiryDate;
        private BigDecimal gpaValue;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class APSCertificateData {

        private String certificateNumber;
        private LocalDate issueDate;
        private LocalDate expiryDate;
        private String verificationStatus;
        private String documentUrl;
        private String verificationMethod;
        private String verificationNotes;
        private Boolean isValid;
        private String invalidReason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InterviewData {

        private LocalDateTime interviewDate;
        private String interviewType;
        private String interviewResult;
        private String interviewNotes;
        private Integer scoreOutOf10;
        private String interviewerName;
        private String recordingUrl;
        private Boolean requiresFollowUpInterview;
        private String recommendation;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LanguageProficiencyData {

        private String testType;
        private String certificateType;
        private BigDecimal ieltsScore;
        private BigDecimal toeflScore;
        private BigDecimal gmatScore;
        private BigDecimal greScore;
        private LocalDate testDate;
        private LocalDate certificateExpiryDate;
        private String certificateUrl;
        private String verificationStatus;
        private String verificationNotes;
        private Boolean isValid;
        private String invalidReason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ResearchProposalData {

        private String proposalTitle;
        private String researchArea;
        private String methodology;
        private String reviewStatus;
        private Integer academicFitScore;
        private String reviewerName;
        private String reviewNotes;
        private LocalDateTime reviewDate;
        private String proposalUrl;
        private Boolean requiresRevision;
        private String revisionNotes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UniversitySubmissionData {

        private String submissionReference;
        private LocalDateTime submissionDate;
        private String submissionStatus;
        private String universityName;
        private String courseName;
        private String submissionMethod;
        private String confirmationUrl;
        private String trackingNumber;
        private String submissionNotes;
    }
}
