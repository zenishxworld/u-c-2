package com.uniflow.workflow.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.application.entity.Application;
import com.uniflow.application.repository.ApplicationRepository;
import com.uniflow.student.entity.StudentProfile;
import com.uniflow.student.repository.StudentProfileRepository;
import com.uniflow.workflow.dto.TaskCompletionRequestDTO;
import com.uniflow.workflow.entity.Task;
import com.uniflow.workflow.entity.WorkflowInstance;
import com.uniflow.workflow.repository.WorkflowInstanceRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * Task Validation Service - State Machine Pattern Implementation
 *
 * <p>This service implements a state machine pattern for validating task completion
 * based on task type, workflow stage, and business rules. Each task type has specific
 * validation requirements that must be met before the task can be completed.
 *
 * <p>Key responsibilities:
 * - Validate task completion based on task type
 * - Enforce business rules and constraints
 * - Verify required data and documents
 * - Provide detailed validation results
 * - Support country-specific validation rules
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TaskValidationService {

    private final StudentProfileRepository studentProfileRepository;
    private final ApplicationRepository applicationRepository;
    private final WorkflowInstanceRepository workflowInstanceRepository;
    private final ObjectMapper objectMapper;

    /**
     * Main validation entry point - delegates to specific validators based on task type
     */
    public Mono<ValidationResult> validateTaskCompletion(
        Task task,
        TaskCompletionRequestDTO completionRequest
    ) {
        log.debug(
            "Validating task completion for task: {} of type: {}",
            task.getTaskId(),
            task.getTaskType()
        );

        return switch (task.getTaskType()) {
            case "CLAIM" -> validateClaimTask(task, completionRequest);
            case "ACADEMIC_DOCUMENTS" -> validateAcademicDocuments(
                task,
                completionRequest
            );
            case "LANGUAGE_PROFICIENCY" -> validateLanguageProficiency(
                task,
                completionRequest
            );
            case "PAYMENT" -> validatePayment(task, completionRequest);
            case "APS_CERTIFICATE" -> validateAPSCertificate(
                task,
                completionRequest
            );
            case "RESEARCH_PROPOSAL" -> validateResearchProposal(
                task,
                completionRequest
            );
            case "UNIVERSITY_SUBMISSION" -> validateUniversitySubmission(
                task,
                completionRequest
            );
            case "ENGLISH_PROFICIENCY" -> validateEnglishProficiency(
                task,
                completionRequest
            );
            case "UCAS_SUBMISSION" -> validateUCASSubmission(
                task,
                completionRequest
            );
            default -> validateGenericTask(task, completionRequest);
        };
    }

    /**
     * Validate claim task completion
     */
    private Mono<ValidationResult> validateClaimTask(
        Task task,
        TaskCompletionRequestDTO completionRequest
    ) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        // Basic validation for claim tasks
        if (
            completionRequest.getCompletedBy() == null ||
            completionRequest.getCompletedBy().trim().isEmpty()
        ) {
            errors.add("Admin ID is required for claiming tasks");
        }

        if (!"CLAIMABLE".equals(task.getStatus())) {
            errors.add("Task is not in claimable status");
        }

        // Check if admin has required permissions
        return validateAdminPermissions(
            completionRequest.getCompletedBy(),
            task
        ).map(hasPermissions -> {
            if (!hasPermissions) {
                errors.add(
                    "Admin does not have required permissions to claim this task"
                );
            }

            if (!errors.isEmpty()) {
                return ValidationResult.failure(
                    "Claim validation failed",
                    errors,
                    warnings
                );
            }

            return ValidationResult.success(
                "Task claimed successfully",
                Map.of(
                    "claimed_by",
                    completionRequest.getCompletedBy(),
                    "claimed_at",
                    LocalDateTime.now().toString(),
                    "next_stage",
                    "ACADEMIC_VERIFICATION"
                )
            );
        });
    }

    /**
     * Validate academic documents verification
     */
    private Mono<ValidationResult> validateAcademicDocuments(
        Task task,
        TaskCompletionRequestDTO completionRequest
    ) {
        return applicationRepository
            .findById(UUID.fromString(task.getApplicationId()))
            .flatMap(application ->
                studentProfileRepository
                    .findByUserId(application.getStudentId())
                    .map(student -> {
                        List<String> errors = new ArrayList<>();
                        List<String> warnings = new ArrayList<>();

                        // Validate document data
                        if (
                            completionRequest.getDocumentData() == null ||
                            completionRequest.getDocumentData().isEmpty()
                        ) {
                            errors.add(
                                "Document verification data is required"
                            );
                        } else {
                            for (TaskCompletionRequestDTO.DocumentData doc : completionRequest.getDocumentData()) {
                                if (
                                    !"VERIFIED".equals(
                                        doc.getVerificationStatus()
                                    )
                                ) {
                                    if (
                                        "ACADEMIC_TRANSCRIPT".equals(
                                            doc.getDocumentType()
                                        ) ||
                                        "DIPLOMA".equals(doc.getDocumentType())
                                    ) {
                                        errors.add(
                                            "Academic documents must be verified before completion"
                                        );
                                    }
                                }

                                // Validate GPA if provided
                                if (
                                    "ACADEMIC_TRANSCRIPT".equals(
                                        doc.getDocumentType()
                                    ) &&
                                    doc.getGpaValue() != null
                                ) {
                                    if (
                                        doc
                                            .getGpaValue()
                                            .compareTo(
                                                BigDecimal.valueOf(2.0)
                                            ) <
                                        0
                                    ) {
                                        warnings.add(
                                            "GPA below minimum threshold (2.0)"
                                        );
                                    }
                                }
                            }
                        }

                        // Country-specific validation
                        String countryCode = task.getCountryCode();
                        if ("DE".equals(countryCode)) {
                            // German-specific academic validation
                            if (
                                application.getDegreeLevel() != null &&
                                "MASTER".equals(application.getDegreeLevel())
                            ) {
                                boolean hasBachelorDegree = completionRequest
                                    .getDocumentData()
                                    .stream()
                                    .anyMatch(
                                        doc ->
                                            "BACHELOR_DIPLOMA".equals(
                                                doc.getDocumentType()
                                            ) &&
                                            "VERIFIED".equals(
                                                doc.getVerificationStatus()
                                            )
                                    );
                                if (!hasBachelorDegree) {
                                    errors.add(
                                        "Bachelor degree verification required for Master's program"
                                    );
                                }
                            }
                        }

                        if (!errors.isEmpty()) {
                            return ValidationResult.failure(
                                "Academic document validation failed",
                                errors,
                                warnings
                            );
                        }

                        return ValidationResult.success(
                            "Academic documents validated successfully",
                            Map.of(
                                "documents_verified",
                                completionRequest.getDocumentData().size(),
                                "gpa_verified",
                                true,
                                "next_stage",
                                "LANGUAGE_VERIFICATION"
                            )
                        );
                    })
            )
            .switchIfEmpty(
                Mono.just(
                    ValidationResult.failure(
                        "Application or student not found",
                        List.of("Invalid application or student reference"),
                        List.of()
                    )
                )
            );
    }

    /**
     * Validate language proficiency verification
     */
    private Mono<ValidationResult> validateLanguageProficiency(
        Task task,
        TaskCompletionRequestDTO completionRequest
    ) {
        return applicationRepository
            .findById(UUID.fromString(task.getApplicationId()))
            .map(application -> {
                List<String> errors = new ArrayList<>();
                List<String> warnings = new ArrayList<>();

                if (completionRequest.getLanguageProficiencyData() == null) {
                    errors.add("Language proficiency data is required");
                    return ValidationResult.failure(
                        "Language proficiency validation failed",
                        errors,
                        warnings
                    );
                }

                var langData = completionRequest.getLanguageProficiencyData();
                String countryCode = task.getCountryCode();

                // Country-specific language requirements
                switch (countryCode) {
                    case "DE" -> {
                        // German university requirements
                        if ("MASTER".equals(application.getDegreeLevel())) {
                            if (
                                langData.getIeltsScore() != null &&
                                langData
                                    .getIeltsScore()
                                    .compareTo(BigDecimal.valueOf(7.0)) <
                                0
                            ) {
                                errors.add(
                                    "IELTS score must be at least 7.0 for Master's programs in Germany"
                                );
                            }
                            if (
                                langData.getToeflScore() != null &&
                                langData.getToeflScore().intValue() < 100
                            ) {
                                errors.add(
                                    "TOEFL score must be at least 100 for Master's programs in Germany"
                                );
                            }
                        } else {
                            if (
                                langData.getIeltsScore() != null &&
                                langData
                                    .getIeltsScore()
                                    .compareTo(BigDecimal.valueOf(6.5)) <
                                0
                            ) {
                                errors.add(
                                    "IELTS score must be at least 6.5 for Bachelor's programs in Germany"
                                );
                            }
                            if (
                                langData.getToeflScore() != null &&
                                langData.getToeflScore().intValue() < 90
                            ) {
                                errors.add(
                                    "TOEFL score must be at least 90 for Bachelor's programs in Germany"
                                );
                            }
                        }
                    }
                    case "US" -> {
                        // US university requirements
                        if (
                            langData.getIeltsScore() != null &&
                            langData
                                .getIeltsScore()
                                .compareTo(BigDecimal.valueOf(6.0)) <
                            0
                        ) {
                            errors.add(
                                "IELTS score must be at least 6.0 for US universities"
                            );
                        }
                        if (
                            langData.getToeflScore() != null &&
                            langData.getToeflScore().intValue() < 80
                        ) {
                            errors.add(
                                "TOEFL score must be at least 80 for US universities"
                            );
                        }
                    }
                    case "UK" -> {
                        // UK university requirements
                        if (
                            langData.getIeltsScore() != null &&
                            langData
                                .getIeltsScore()
                                .compareTo(BigDecimal.valueOf(6.0)) <
                            0
                        ) {
                            errors.add(
                                "IELTS score must be at least 6.0 for UK universities"
                            );
                        }
                        if (
                            langData.getToeflScore() != null &&
                            langData.getToeflScore().intValue() < 85
                        ) {
                            errors.add(
                                "TOEFL score must be at least 85 for UK universities"
                            );
                        }
                    }
                }

                // Validate certificate expiry
                if (
                    langData.getCertificateExpiryDate() != null &&
                    langData
                        .getCertificateExpiryDate()
                        .isBefore(LocalDate.now().plusMonths(6))
                ) {
                    warnings.add(
                        "Language certificate expires within 6 months"
                    );
                }

                if (!errors.isEmpty()) {
                    return ValidationResult.failure(
                        "Language proficiency validation failed",
                        errors,
                        warnings
                    );
                }

                return ValidationResult.success(
                    "Language proficiency validated successfully",
                    Map.of(
                        "certificate_type",
                        langData.getCertificateType(),
                        "score_verified",
                        true,
                        "next_stage",
                        "PAYMENT_PROCESSING"
                    )
                );
            })
            .switchIfEmpty(
                Mono.just(
                    ValidationResult.failure(
                        "Application not found",
                        List.of("Invalid application reference"),
                        List.of()
                    )
                )
            );
    }

    /**
     * Validate payment processing
     */
    private Mono<ValidationResult> validatePayment(
        Task task,
        TaskCompletionRequestDTO completionRequest
    ) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (completionRequest.getPaymentDetails() == null) {
            errors.add("Payment details are required");
            return Mono.just(
                ValidationResult.failure(
                    "Payment validation failed",
                    errors,
                    warnings
                )
            );
        }

        var paymentData = completionRequest.getPaymentDetails();

        // Validate required payment fields
        if (
            paymentData.getAmount() == null ||
            paymentData.getAmount().compareTo(BigDecimal.ZERO) <= 0
        ) {
            errors.add("Valid payment amount is required");
        }

        if (
            paymentData.getTransactionId() == null ||
            paymentData.getTransactionId().trim().isEmpty()
        ) {
            errors.add("Transaction ID is required");
        }

        if (
            paymentData.getPaymentMethod() == null ||
            paymentData.getPaymentMethod().trim().isEmpty()
        ) {
            errors.add("Payment method is required");
        }

        if (paymentData.getPaymentDate() == null) {
            errors.add("Payment date is required");
        } else if (paymentData.getPaymentDate().isAfter(LocalDateTime.now())) {
            errors.add("Payment date cannot be in the future");
        }

        // Currency validation based on country
        String countryCode = task.getCountryCode();
        String expectedCurrency = switch (countryCode) {
            case "DE" -> "EUR";
            case "US" -> "USD";
            case "UK" -> "GBP";
            case "CA" -> "CAD";
            case "AU" -> "AUD";
            default -> "USD";
        };

        if (!expectedCurrency.equals(paymentData.getCurrency())) {
            warnings.add(
                "Payment currency " +
                    paymentData.getCurrency() +
                    " does not match expected currency " +
                    expectedCurrency
            );
        }

        if (!errors.isEmpty()) {
            return Mono.just(
                ValidationResult.failure(
                    "Payment validation failed",
                    errors,
                    warnings
                )
            );
        }

        return Mono.just(
            ValidationResult.success(
                "Payment validated successfully",
                Map.of(
                    "amount",
                    paymentData.getAmount().toString(),
                    "currency",
                    paymentData.getCurrency(),
                    "transaction_id",
                    paymentData.getTransactionId(),
                    "next_stage",
                    "DE".equals(countryCode)
                        ? "APS_CERTIFICATE"
                        : "UNIVERSITY_SUBMISSION"
                )
            )
        );
    }

    /**
     * Validate APS certificate (Germany-specific)
     */
    private Mono<ValidationResult> validateAPSCertificate(
        Task task,
        TaskCompletionRequestDTO completionRequest
    ) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (!"DE".equals(task.getCountryCode())) {
            errors.add(
                "APS certificate verification is only required for German applications"
            );
            return Mono.just(
                ValidationResult.failure(
                    "APS certificate validation failed",
                    errors,
                    warnings
                )
            );
        }

        if (completionRequest.getApsCertificateData() == null) {
            errors.add(
                "APS certificate data is required for German applications"
            );
            return Mono.just(
                ValidationResult.failure(
                    "APS certificate validation failed",
                    errors,
                    warnings
                )
            );
        }

        var apsData = completionRequest.getApsCertificateData();

        // Validate required APS fields
        if (
            apsData.getCertificateNumber() == null ||
            apsData.getCertificateNumber().trim().isEmpty()
        ) {
            errors.add("APS certificate number is required");
        }

        if (apsData.getIssueDate() == null) {
            errors.add("APS certificate issue date is required");
        }

        if (apsData.getExpiryDate() == null) {
            errors.add("APS certificate expiry date is required");
        } else {
            if (apsData.getExpiryDate().isBefore(LocalDate.now())) {
                errors.add("APS certificate has expired");
            } else if (
                apsData.getExpiryDate().isBefore(LocalDate.now().plusMonths(3))
            ) {
                warnings.add("APS certificate expires within 3 months");
            }
        }

        if (!"VERIFIED".equals(apsData.getVerificationStatus())) {
            errors.add("APS certificate must be verified");
        }

        if (!errors.isEmpty()) {
            return Mono.just(
                ValidationResult.failure(
                    "APS certificate validation failed",
                    errors,
                    warnings
                )
            );
        }

        return Mono.just(
            ValidationResult.success(
                "APS certificate validated successfully",
                Map.of(
                    "certificate_number",
                    apsData.getCertificateNumber(),
                    "verification_status",
                    apsData.getVerificationStatus(),
                    "next_stage",
                    "UNIVERSITY_SUBMISSION"
                )
            )
        );
    }

    /**
     * Validate research proposal (Master's programs)
     */
    private Mono<ValidationResult> validateResearchProposal(
        Task task,
        TaskCompletionRequestDTO completionRequest
    ) {
        return applicationRepository
            .findById(UUID.fromString(task.getApplicationId()))
            .map(application -> {
                List<String> errors = new ArrayList<>();
                List<String> warnings = new ArrayList<>();

                if (!"MASTER".equals(application.getDegreeLevel())) {
                    errors.add(
                        "Research proposal review is only required for Master's programs"
                    );
                    return ValidationResult.failure(
                        "Research proposal validation failed",
                        errors,
                        warnings
                    );
                }

                if (completionRequest.getResearchProposalData() == null) {
                    errors.add(
                        "Research proposal data is required for Master's programs"
                    );
                    return ValidationResult.failure(
                        "Research proposal validation failed",
                        errors,
                        warnings
                    );
                }

                var researchData = completionRequest.getResearchProposalData();

                // Validate research proposal fields
                if (
                    researchData.getProposalTitle() == null ||
                    researchData.getProposalTitle().trim().isEmpty()
                ) {
                    errors.add("Research proposal title is required");
                }

                if (
                    researchData.getResearchArea() == null ||
                    researchData.getResearchArea().trim().isEmpty()
                ) {
                    errors.add("Research area is required");
                }

                if (
                    researchData.getMethodology() == null ||
                    researchData.getMethodology().trim().isEmpty()
                ) {
                    errors.add("Research methodology is required");
                }

                if (!"APPROVED".equals(researchData.getReviewStatus())) {
                    errors.add("Research proposal must be approved");
                }

                if (
                    researchData.getAcademicFitScore() != null &&
                    researchData.getAcademicFitScore() < 70
                ) {
                    warnings.add(
                        "Academic fit score is below recommended threshold (70)"
                    );
                }

                if (!errors.isEmpty()) {
                    return ValidationResult.failure(
                        "Research proposal validation failed",
                        errors,
                        warnings
                    );
                }

                return ValidationResult.success(
                    "Research proposal validated successfully",
                    Map.of(
                        "proposal_title",
                        researchData.getProposalTitle(),
                        "research_area",
                        researchData.getResearchArea(),
                        "review_status",
                        researchData.getReviewStatus(),
                        "next_stage",
                        "LANGUAGE_VERIFICATION"
                    )
                );
            })
            .switchIfEmpty(
                Mono.just(
                    ValidationResult.failure(
                        "Application not found",
                        List.of("Invalid application reference"),
                        List.of()
                    )
                )
            );
    }

    /**
     * Validate English proficiency (US-specific)
     */
    private Mono<ValidationResult> validateEnglishProficiency(
        Task task,
        TaskCompletionRequestDTO completionRequest
    ) {
        return validateLanguageProficiency(task, completionRequest).map(
            result -> {
                // Additional US-specific validation can be added here
                return result;
            }
        );
    }

    /**
     * Validate university submission
     */
    private Mono<ValidationResult> validateUniversitySubmission(
        Task task,
        TaskCompletionRequestDTO completionRequest
    ) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        if (completionRequest.getUniversitySubmissionData() == null) {
            errors.add("University submission data is required");
            return Mono.just(
                ValidationResult.failure(
                    "University submission validation failed",
                    errors,
                    warnings
                )
            );
        }

        var submissionData = completionRequest.getUniversitySubmissionData();

        // Validate submission fields
        if (
            submissionData.getSubmissionReference() == null ||
            submissionData.getSubmissionReference().trim().isEmpty()
        ) {
            errors.add("University submission reference is required");
        }

        if (submissionData.getSubmissionDate() == null) {
            errors.add("Submission date is required");
        }

        if (!"SUBMITTED".equals(submissionData.getSubmissionStatus())) {
            errors.add(
                "Application must be successfully submitted to university"
            );
        }

        if (!errors.isEmpty()) {
            return Mono.just(
                ValidationResult.failure(
                    "University submission validation failed",
                    errors,
                    warnings
                )
            );
        }

        return Mono.just(
            ValidationResult.success(
                "University submission validated successfully",
                Map.of(
                    "submission_reference",
                    submissionData.getSubmissionReference(),
                    "submission_status",
                    submissionData.getSubmissionStatus(),
                    "next_stage",
                    "COMPLETED"
                )
            )
        );
    }

    /**
     * Validate UCAS submission (UK-specific)
     */
    private Mono<ValidationResult> validateUCASSubmission(
        Task task,
        TaskCompletionRequestDTO completionRequest
    ) {
        if (!"UK".equals(task.getCountryCode())) {
            return Mono.just(
                ValidationResult.failure(
                    "UCAS submission validation failed",
                    List.of("UCAS submission is only for UK applications"),
                    List.of()
                )
            );
        }

        return validateUniversitySubmission(task, completionRequest);
    }

    /**
     * Generic task validation
     */
    private Mono<ValidationResult> validateGenericTask(
        Task task,
        TaskCompletionRequestDTO completionRequest
    ) {
        List<String> errors = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        // Basic validation
        if (
            completionRequest.getCompletedBy() == null ||
            completionRequest.getCompletedBy().trim().isEmpty()
        ) {
            errors.add("Completed by admin ID is required");
        }

        if (!errors.isEmpty()) {
            return Mono.just(
                ValidationResult.failure(
                    "Generic task validation failed",
                    errors,
                    warnings
                )
            );
        }

        return Mono.just(
            ValidationResult.success(
                "Task validated successfully",
                Map.of(
                    "task_type",
                    task.getTaskType(),
                    "completed_by",
                    completionRequest.getCompletedBy()
                )
            )
        );
    }

    /**
     * Validate admin permissions for task
     */
    private Mono<Boolean> validateAdminPermissions(String adminId, Task task) {
        // This would typically check against admin permissions/roles
        // For now, return true as a placeholder
        return Mono.just(true);
    }

    /**
     * Validation Result class
     */
    public static class ValidationResult {

        private final boolean valid;
        private final String message;
        private final List<String> errors;
        private final List<String> warnings;
        private final Map<String, Object> validationData;

        private ValidationResult(
            boolean valid,
            String message,
            List<String> errors,
            List<String> warnings,
            Map<String, Object> validationData
        ) {
            this.valid = valid;
            this.message = message;
            this.errors = errors != null ? errors : new ArrayList<>();
            this.warnings = warnings != null ? warnings : new ArrayList<>();
            this.validationData = validationData != null
                ? validationData
                : Map.of();
        }

        public static ValidationResult success(
            String message,
            Map<String, Object> validationData
        ) {
            return new ValidationResult(
                true,
                message,
                null,
                null,
                validationData
            );
        }

        public static ValidationResult failure(
            String message,
            List<String> errors,
            List<String> warnings
        ) {
            return new ValidationResult(false, message, errors, warnings, null);
        }

        public boolean isValid() {
            return valid;
        }

        public String getMessage() {
            return message;
        }

        public List<String> getErrors() {
            return errors;
        }

        public List<String> getWarnings() {
            return warnings;
        }

        public Map<String, Object> getValidationData() {
            return validationData;
        }

        public boolean hasErrors() {
            return errors != null && !errors.isEmpty();
        }

        public boolean hasWarnings() {
            return warnings != null && !warnings.isEmpty();
        }
    }
}
