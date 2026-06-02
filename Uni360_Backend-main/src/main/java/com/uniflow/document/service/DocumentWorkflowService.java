package com.uniflow.document.service;

import com.uniflow.document.dto.DocumentWorkflowDTO;
import com.uniflow.document.entity.DocumentWorkflow;
import com.uniflow.document.entity.DocumentsUpload;
import com.uniflow.document.repository.DocumentWorkflowRepository;
import com.uniflow.document.repository.DocumentsUploadRepository;
import com.uniflow.document.service.S3Service;
import com.uniflow.workflow.repository.WorkflowInstanceRepository;
import com.uniflow.workflow.service.TaskCompletionValidationService;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Document Workflow Service - AD-02-03 Implementation
 *
 * <p>Manages workflow aspects of document processing including verification,
 * review, and approval processes. Links uploaded documents to workflow management.
 *
 * <p>Key Features:
 * - Reactive workflow management
 * - Document-to-workflow linking
 * - Admin review coordination
 * - Status tracking and updates
 * - Integration with existing TaskOrchestrationEngine
 *
 * @author AI Agent - AD-02-03 Implementation
 * @since 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentWorkflowService {

    private final DocumentWorkflowRepository documentWorkflowRepository;
    private final DocumentsUploadRepository documentsUploadRepository;
    private final TaskCompletionValidationService taskCompletionValidationService;
    private final WorkflowInstanceRepository workflowInstanceRepository;
    private final S3Service s3Service;

    /**
     * Create workflow record for uploaded document
     * Links GenericDocumentService uploads to workflow management
     *
     * @param uploadId ID of the uploaded document
     * @param studentId Student who uploaded the document
     * @param applicationId Related application (optional)
     * @param documentType Type of document (passport, transcript, etc.)
     * @param workflowStage Current workflow stage
     * @return Created workflow record
     */
    public Mono<DocumentWorkflow> createDocumentWorkflow(
        UUID uploadId,
        Long studentId,
        UUID applicationId,
        String documentType,
        String workflowStage
    ) {
        log.debug(
            "Creating document workflow for upload: {} student: {} type: {}",
            uploadId,
            studentId,
            documentType
        );

        return documentsUploadRepository
            .findById(uploadId)
            .switchIfEmpty(
                Mono.error(
                    new IllegalArgumentException(
                        "Upload not found: " + uploadId
                    )
                )
            )
            .flatMap(upload -> {
                // Find workflow instance for this application
                if (applicationId == null) {
                    return Mono.error(
                        new IllegalArgumentException(
                            "Application ID is required to link document to workflow"
                        )
                    );
                }

                return workflowInstanceRepository
                    .findByApplicationId(applicationId.toString())
                    .next()
                    .switchIfEmpty(
                        Mono.error(
                            new IllegalArgumentException(
                                "No workflow instance found for application: " +
                                    applicationId
                            )
                        )
                    )
                    .flatMap(workflowInstance ->
                        // Step 1: mark existing versions as not current, then get next version number
                        documentWorkflowRepository
                            .markOldVersionsAsNotCurrent(studentId, documentType, applicationId)
                            .then(documentWorkflowRepository
                                .getLatestVersionNumber(studentId, documentType, applicationId))
                            .defaultIfEmpty(0)
                            .flatMap(latestVersion -> {
                                int nextVersion = latestVersion + 1;

                                DocumentWorkflow workflow = DocumentWorkflow.builder()
                                    .uploadId(uploadId)
                                    .workflowInstanceId(workflowInstance.getInstanceId())
                                    .studentId(studentId)
                                    .applicationId(applicationId)
                                    .documentType(documentType)
                                    .documentCategory(determineDocumentCategory(documentType))
                                    .workflowStage(workflowStage != null ? workflowStage : "UPLOADED")
                                    .verificationStatus("PENDING")
                                    .reviewStatus("AWAITING_REVIEW")
                                    .isRequired(true)
                                    .isCurrentVersion(true)
                                    .version(nextVersion)
                                    .submissionDeadline(LocalDateTime.now().plusDays(30))
                                    .createdAt(LocalDateTime.now())
                                    .updatedAt(LocalDateTime.now())
                                    .build();

                                return documentWorkflowRepository.save(workflow);
                            })
                    );
            })
            .doOnSuccess(workflow ->
                log.info(
                    "Created document workflow: {} for upload: {}",
                    workflow.getId(),
                    uploadId
                )
            )
            .doOnError(error ->
                log.error(
                    "Failed to create document workflow for upload: {}",
                    uploadId,
                    error
                )
            );
    }

    /**
     * Determine document category based on document type
     * Maps document types to appropriate categories for workflow organization
     *
     * @param documentType Type of document
     * @return Appropriate category for the document
     */
    private String determineDocumentCategory(String documentType) {
        if (documentType == null) {
            return "GENERAL";
        }

        return switch (documentType.toUpperCase()) {
            // ── Identity / Personal ────────────────────────────────────────────
            case "PASSPORT", "VISA", "ID_CARD", "COLOUR_PHOTOS" -> "IDENTITY";

            // ── Academic ──────────────────────────────────────────────────────
            case
                "TRANSCRIPT",
                "TRANSCRIPTS",
                "DIPLOMA",
                "DEGREE_CERTIFICATE",
                "ACADEMIC_RECORDS",
                "MARKSHEET",
                "LEAVING_CERTIFICATE",
                "TWELFTH_MARKSHEET",
                "TENTH_MARKSHEET",
                "BACHELOR_MARKSHEET",
                "BACHELOR_TRANSCRIPT",
                "BACHELOR_SYLLABUS",
                "JEE_EXAM",
                "ENGLISH_MEDIUM_CERTIFICATE" -> "ACADEMIC";

            // ── Language / English Proficiency ────────────────────────────────
            case
                "ENGLISH_TEST",
                "IELTS",
                "TOEFL",
                "GRE",
                "PTE",
                "LANGUAGE_TEST" -> "LANGUAGE";

            // ── Personal Statement ────────────────────────────────────────────
            case
                "SOP",
                "STATEMENT_OF_PURPOSE",
                "PERSONAL_STATEMENT",
                "MOTIVATION_LETTER" -> "PERSONAL_STATEMENT";

            // ── Letters of Recommendation ─────────────────────────────────────
            case
                "LOR",
                "LETTER_OF_RECOMMENDATION",
                "REFERENCE_LETTER" -> "RECOMMENDATION";

            // ── Professional / CV ─────────────────────────────────────────────
            case "CV", "RESUME", "CURRICULUM_VITAE" -> "PROFESSIONAL";

            // ── Certificates (replaces FINANCIAL + CERTIFICATION + EXPERIENCE) ─
            case
                "EXTRA_CURRICULAR",
                "GERMAN_LANGUAGE_CERTIFICATE",
                "WORK_EXPERIENCE",
                "EXPERIENCE_LETTER",
                "EMPLOYMENT_CERTIFICATE",
                "APS_CERTIFICATE",
                "WES_EVALUATION",
                "CREDENTIAL_EVALUATION",
                // Old financial types — no longer used for students, kept for compat
                "FINANCIAL_PROOF",
                "BANK_STATEMENT",
                "SCHOLARSHIP_LETTER",
                "SPONSOR_LETTER" -> "CERTIFICATE";

            // ── Other / custom ────────────────────────────────────────────────
            default -> "OTHER";
        };
    }

    /**
     * Update workflow flags when documents are approved
     * Integrates with TaskOrchestrationEngine to advance workflow
     */
    private Mono<Void> updateWorkflowFlagsOnApproval(
        DocumentWorkflow workflow
    ) {
        log.debug(
            "Updating workflow flags for approved document: {} type: {}",
            workflow.getId(),
            workflow.getDocumentType()
        );

        // Get workflow flag name based on document type
        String flagName = getWorkflowFlagForDocumentType(
            workflow.getDocumentType()
        );

        if (flagName == null || workflow.getApplicationId() == null) {
            log.debug(
                "No flag mapping or application ID found for document type: {}",
                workflow.getDocumentType()
            );
            return Mono.empty();
        }

        log.info(
            "Setting application flag {} = true for application: {}",
            flagName,
            workflow.getApplicationId()
        );

        // Use TaskCompletionValidationService to update application flags
        return taskCompletionValidationService
            .updateStudentProfileFlag(
                workflow.getApplicationId().toString(),
                flagName,
                true
            )
            .doOnSuccess(v ->
                log.info(
                    "Successfully updated application flag for document: {} type: {}",
                    workflow.getId(),
                    workflow.getDocumentType()
                )
            )
            .onErrorResume(error -> {
                log.error(
                    "Failed to update application flag for document: {} type: {}",
                    workflow.getId(),
                    workflow.getDocumentType(),
                    error
                );
                return Mono.empty(); // Don't fail the main workflow
            });
    }

    /**
     * Map document types to workflow flag names based on uni360.yml configuration
     */
    private String getWorkflowFlagForDocumentType(String documentType) {
        if (documentType == null) {
            return null;
        }

        return switch (documentType.toUpperCase()) {
            case "PASSPORT" -> "passport_verified";
            case "TRANSCRIPT", "TRANSCRIPTS" -> "transcript_verified";
            case "DIPLOMA", "DEGREE_CERTIFICATE" -> "diploma_verified";
            case
                "ENGLISH_TEST",
                "IELTS",
                "TOEFL",
                "GRE",
                "PTE" -> "language_test_uploaded";
            case "APS_CERTIFICATE" -> "aps_certificate_uploaded";
            case "SOP", "STATEMENT_OF_PURPOSE" -> "sop_uploaded";
            case "LOR", "LETTER_OF_RECOMMENDATION" -> "lor_uploaded";
            case "CV", "RESUME", "CURRICULUM_VITAE" -> "cv_uploaded";
            case "FINANCIAL_PROOF", "BANK_STATEMENT" -> "financial_proof_uploaded";
            case "LEAVING_CERTIFICATE" -> "leaving_certificate_uploaded";
            case "TWELFTH_MARKSHEET" -> "twelfth_marksheet_uploaded";
            case "TENTH_MARKSHEET" -> "tenth_marksheet_uploaded";
            // New document types
            case "BACHELOR_MARKSHEET" -> "bachelor_marksheet_uploaded";
            case "BACHELOR_TRANSCRIPT" -> "bachelor_transcript_uploaded";
            case "BACHELOR_SYLLABUS" -> "bachelor_syllabus_uploaded";
            case "JEE_EXAM" -> "jee_exam_uploaded";
            case "ENGLISH_MEDIUM_CERTIFICATE" -> "english_medium_cert_uploaded";
            case "COLOUR_PHOTOS" -> "colour_photos_uploaded";
            case "EXTRA_CURRICULAR" -> "extra_curricular_uploaded";
            case "GERMAN_LANGUAGE_CERTIFICATE" -> "german_language_cert_uploaded";
            case "WORK_EXPERIENCE", "EXPERIENCE_LETTER" -> "work_experience_uploaded";
            default -> null;
        };
    }

    /**
     * Get workflow documents for specific workflow/application
     * Used by admin to manage document workflows
     *
     * @param applicationId Application ID to filter workflows
     * @return Flux of workflow records with upload details
     */
    public Flux<
        DocumentWorkflowDTO.WorkflowDocumentResponse
    > getWorkflowDocuments(UUID applicationId) {
        log.debug(
            "Getting workflow documents for application: {}",
            applicationId
        );

        return documentWorkflowRepository
            .findByApplicationIdAndIsCurrentVersionTrue(applicationId)
            .flatMap(workflow ->
                documentsUploadRepository
                    .findById(workflow.getUploadId())
                    .map(upload ->
                        DocumentWorkflowDTO.WorkflowDocumentResponse.builder()
                            .workflowId(workflow.getId())
                            .uploadId(upload.getId())
                            .documentType(workflow.getDocumentType())
                            .fileName(upload.getOriginalFilename())
                            .fileSize(upload.getFileSize())
                            .verificationStatus(
                                workflow.getVerificationStatus()
                            )
                            .reviewStatus(workflow.getReviewStatus())
                            .isRequired(workflow.getIsRequired())
                            .submissionDeadline(
                                workflow.getSubmissionDeadline()
                            )
                            .reviewedBy(workflow.getReviewedBy())
                            .reviewedAt(workflow.getReviewedAt())
                            .createdAt(workflow.getCreatedAt())
                            .build()
                    )
            )
            .doOnComplete(() ->
                log.debug(
                    "Completed workflow documents retrieval for application: {}",
                    applicationId
                )
            );
    }

    /**
     * Get student's document workflows
     * Used by student portal to show document status
     *
     * @param studentId Student ID
     * @return Flux of student's workflow documents
     */
    public Flux<
        DocumentWorkflowDTO.StudentDocumentResponse
    > getStudentDocumentWorkflows(Long studentId) {
        log.debug("Getting document workflows for student: {}", studentId);

        return documentWorkflowRepository
            .findByStudentIdAndIsCurrentVersionTrue(studentId)
            .flatMap(workflow ->
                documentsUploadRepository
                    .findById(workflow.getUploadId())
                    .map(upload ->
                        DocumentWorkflowDTO.StudentDocumentResponse.builder()
                            .workflowId(workflow.getId())
                            .documentType(workflow.getDocumentType())
                            .fileName(upload.getOriginalFilename())
                            .verificationStatus(workflow.getVerificationStatus())
                            .reviewStatus(workflow.getReviewStatus())
                            .reviewNotes(workflow.getVerificationNotes())
                            .isRequired(workflow.getIsRequired())
                            .submissionDeadline(workflow.getSubmissionDeadline())
                            .uploadedAt(upload.getCreatedAt())
                            .build()
                    )
                    // Bug fix: if the upload record is missing, still return the workflow
                    // so the student can see REJECTED status and re-upload
                    .switchIfEmpty(Mono.fromSupplier(() -> {
                        log.warn("Upload record missing for workflow: {} — returning status-only entry",
                            workflow.getId());
                        return DocumentWorkflowDTO.StudentDocumentResponse.builder()
                            .workflowId(workflow.getId())
                            .documentType(workflow.getDocumentType())
                            .fileName(null) // no file — prompt re-upload
                            .verificationStatus(workflow.getVerificationStatus())
                            .reviewStatus(workflow.getReviewStatus())
                            .reviewNotes(workflow.getVerificationNotes())
                            .isRequired(workflow.getIsRequired())
                            .submissionDeadline(workflow.getSubmissionDeadline())
                            .uploadedAt(null)
                            .build();
                    }))
            );
    }

    /**
     * Update workflow status (for admin review)
     * Used by admin to approve/reject documents
     *
     * @param workflowId Workflow ID to update
     * @param verificationStatus New verification status
     * @param reviewStatus New review status
     * @param reviewedBy Admin ID who reviewed
     * @param reviewNotes Optional review notes
     * @return Updated workflow record
     */
    public Mono<DocumentWorkflow> updateWorkflowStatus(
        UUID workflowId,
        String verificationStatus,
        String reviewStatus,
        Long reviewedBy,
        String reviewNotes
    ) {
        log.debug(
            "Updating workflow: {} status: {} by admin: {}",
            workflowId,
            verificationStatus,
            reviewedBy
        );

        return documentWorkflowRepository
            .findById(workflowId)
            .switchIfEmpty(
                Mono.error(
                    new IllegalArgumentException(
                        "Workflow not found: " + workflowId
                    )
                )
            )
            .flatMap(workflow -> {
                workflow.setVerificationStatus(verificationStatus);
                workflow.setReviewStatus(reviewStatus);
                workflow.setReviewedBy(reviewedBy);
                workflow.setVerificationNotes(reviewNotes);
                workflow.setReviewedAt(LocalDateTime.now());
                workflow.setUpdatedAt(LocalDateTime.now());

                return documentWorkflowRepository.save(workflow);
            })
            .flatMap(workflow -> {
                // If document is verified, update workflow flags
                if ("VERIFIED".equals(verificationStatus)) {
                    return updateWorkflowFlagsOnApproval(workflow).thenReturn(
                        workflow
                    );
                }
                return Mono.just(workflow);
            })
            .doOnSuccess(workflow ->
                log.info(
                    "Updated workflow: {} to status: {} by admin: {}",
                    workflowId,
                    verificationStatus,
                    reviewedBy
                )
            );
    }

    /**
     * Get documents pending review for admin dashboard, scoped to admin's assigned students.
     *
     * @param adminId The authenticated admin's user ID
     * @return Flux of documents awaiting admin review (only from students assigned to this admin)
     */
    public Flux<DocumentWorkflowDTO.PendingReviewResponse> getDocumentsPendingReview(Long adminId) {
        log.debug("Getting documents pending review for admin: {}", adminId);

        return documentWorkflowRepository
            .findDocumentsPendingReviewForAdmin(adminId)
            .flatMap(workflow ->
                documentsUploadRepository
                    .findById(workflow.getUploadId())
                    .map(upload ->
                        DocumentWorkflowDTO.PendingReviewResponse.builder()
                            .workflowId(workflow.getId())
                            .studentId(workflow.getStudentId())
                            .documentType(workflow.getDocumentType())
                            .fileName(upload.getOriginalFilename())
                            .fileSize(upload.getFileSize())
                            .uploadedAt(upload.getCreatedAt())
                            .submissionDeadline(
                                workflow.getSubmissionDeadline()
                            )
                            .isRequired(workflow.getIsRequired())
                            .workflowStage(workflow.getWorkflowStage())
                            .build()
                    )
            );
    }

    /**
     * Get documents reviewed by specific admin, optionally filtered by student.
     * Used to show admin review history.
     */
    public Flux<DocumentWorkflowDTO.WorkflowDocumentResponse> getReviewedDocuments(Long adminId, Long studentId) {
        log.debug("Getting documents reviewed by admin: {}, studentId filter: {}", adminId, studentId);

        Flux<com.uniflow.document.entity.DocumentWorkflow> source = (studentId != null)
            ? documentWorkflowRepository.findByReviewedByAndStudentId(adminId, studentId)
            : documentWorkflowRepository.findByReviewedBy(adminId);

        return source
            .flatMap(workflow ->
                documentsUploadRepository.findById(workflow.getUploadId())
                    .map(upload ->
                        DocumentWorkflowDTO.WorkflowDocumentResponse.builder()
                            .workflowId(workflow.getId())
                            .uploadId(upload.getId())
                            .studentId(workflow.getStudentId())
                            .documentType(workflow.getDocumentType())
                            .fileName(upload.getOriginalFilename())
                            .fileSize(upload.getFileSize())
                            .verificationStatus(workflow.getVerificationStatus())
                            .reviewStatus(workflow.getReviewStatus())
                            .isRequired(workflow.getIsRequired())
                            .submissionDeadline(workflow.getSubmissionDeadline())
                            .reviewedBy(workflow.getReviewedBy())
                            .reviewedAt(workflow.getReviewedAt())
                            .createdAt(workflow.getCreatedAt())
                            .build()
                    )
            );
    }

    /**
     * Get workflow by upload ID
     * Used to link uploads to workflows
     *
     * @param uploadId Upload ID
     * @return Workflow record for the upload
     */
    public Mono<DocumentWorkflow> getWorkflowByUploadId(UUID uploadId) {
        log.debug("Getting workflow for upload: {}", uploadId);

        return documentWorkflowRepository
            .findByUploadId(uploadId)
            .next() // Get the most recent workflow for this upload
            .doOnSuccess(workflow -> {
                if (workflow != null) {
                    log.debug(
                        "Found workflow: {} for upload: {}",
                        workflow.getId(),
                        uploadId
                    );
                }
            });
    }

    /**
     * Delete workflow (when document is deleted)
     * Maintains referential integrity
     *
     * @param uploadId Upload ID to remove workflow for
     * @return Completion signal
     */
    public Mono<Void> deleteWorkflowByUploadId(UUID uploadId) {
        log.debug("Deleting workflow for upload: {}", uploadId);

        return documentWorkflowRepository
            .findByUploadId(uploadId)
            .flatMap(documentWorkflowRepository::delete)
            .then()
            .doOnSuccess(unused ->
                log.info("Deleted workflow for upload: {}", uploadId)
            );
    }

    // ── Document View Bug Fix ─────────────────────────────────────────────────

    /**
     * Generate a presigned S3 view URL for a specific workflow's document.
     * Fixes the admin bug: admins could approve/reject but not open the file.
     *
     * <p>Steps:
     * 1. Find DocumentWorkflow by workflowId
     * 2. Find linked DocumentsUpload by uploadId
     * 3. Generate 1-hour presigned URL via S3Service
     *
     * @param workflowId  ID of the document workflow record
     * @return Presigned S3 URL valid for 1 hour
     */
    public Mono<String> getDocumentViewUrl(UUID workflowId) {
        log.debug("Generating view URL for workflow: {}", workflowId);

        return documentWorkflowRepository
            .findById(workflowId)
            .switchIfEmpty(
                Mono.error(new IllegalArgumentException(
                    "Workflow not found: " + workflowId))
            )
            .flatMap(workflow ->
                documentsUploadRepository
                    .findById(workflow.getUploadId())
                    .switchIfEmpty(
                        Mono.error(new IllegalArgumentException(
                            "Upload record not found for workflow: " + workflowId))
                    )
            )
            .flatMap(upload -> {
                // If file is on S3, generate a presigned URL; otherwise return the direct URL
                if (upload.isS3File()) {
                    return s3Service.generatePresignedViewUrl(upload.getFileUrl());
                }
                return Mono.just(upload.getFileUrl());
            })
            .doOnSuccess(url ->
                log.info("Generated view URL for workflow: {}", workflowId)
            )
            .doOnError(error ->
                log.error("Failed to generate view URL for workflow: {}",
                    workflowId, error)
            );
    }
}
