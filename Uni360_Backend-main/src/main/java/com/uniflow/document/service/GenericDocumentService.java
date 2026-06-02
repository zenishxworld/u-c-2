package com.uniflow.document.service;

import com.uniflow.application.repository.ApplicationRepository;
import com.uniflow.document.entity.DocumentsUpload;
import com.uniflow.document.repository.DocumentsUploadRepository;
import com.uniflow.document.service.DocumentWorkflowService;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Generic Document Service - JWT-based Universal Document Operations
 *
 * <p>Provides reactive business logic for universal document upload and management.
 * Extracts user context from JWT tokens automatically and supports all user types.
 *
 * <p>Key Features:
 * - JWT-based user context extraction
 * - Universal document upload for all user types
 * - S3 integration with presigned URLs
 * - User-specific document queries
 * - Reactive programming with Mono/Flux
 * - No hardcoded data or assumptions
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GenericDocumentService {

    private final DocumentsUploadRepository documentsUploadRepository;
    private final ApplicationRepository applicationRepository;
    private final DocumentWorkflowService documentWorkflowService;
    private final S3Service s3Service;

    /**
     * Upload document with JWT-based user context
     */
    @Transactional
    public Mono<DocumentsUpload> uploadDocument(
        FilePart filePart,
        Long uploadedBy,
        String userType,
        String uploadPurpose,
        String documentType,
        String applicationId,
        String description
    ) {
        log.info(
            "Processing generic document upload for user: {}, type: {}, purpose: {}, docType: {}",
            uploadedBy,
            userType,
            uploadPurpose,
            documentType
        );

        return s3Service
            .uploadFile(
                filePart,
                uploadedBy.toString(),
                documentType != null ? documentType : "GENERAL"
            )
            .flatMap(fileUrl -> {
                String fileExtension = getFileExtension(filePart.filename());

                DocumentsUpload upload = DocumentsUpload.builder()
                    .uploadedBy(uploadedBy)
                    .userType(userType)
                    .originalFilename(filePart.filename())
                    .fileUrl(fileUrl)
                    .fileSize(null)
                    .fileType(fileExtension.toUpperCase())
                    .uploadPurpose(
                        uploadPurpose != null ? uploadPurpose : "APPLICATION"
                    )
                    .documentType(documentType != null ? documentType.trim() : null)
                    .description(description)
                    .isActive(true)
                    .build();

                return documentsUploadRepository.save(upload);
            })
            .flatMap(savedUpload -> {
                // Auto-create workflow if applicationId is provided
                if (applicationId != null && !applicationId.trim().isEmpty()) {
                    return createWorkflowForUpload(
                        savedUpload,
                        UUID.fromString(applicationId.trim()),
                        documentType
                    ).then(Mono.just(savedUpload));
                }
                return Mono.just(savedUpload);
            })
            .doOnSuccess(savedUpload ->
                log.info(
                    "Document uploaded successfully: {} with ID: {}",
                    savedUpload.getOriginalFilename(),
                    savedUpload.getId()
                )
            )
            .doOnError(error ->
                log.error(
                    "Failed to upload document: {}",
                    error.getMessage(),
                    error
                )
            );
    }

    /**
     * Get user's own documents
     */
    public Flux<DocumentsUpload> getMyDocuments(Long userId) {
        log.info("Retrieving documents for user: {}", userId);

        return documentsUploadRepository
            .findByUploadedByAndIsActiveTrue(userId)
            .doOnNext(upload ->
                log.debug(
                    "Found document: {} for user: {}",
                    upload.getOriginalFilename(),
                    userId
                )
            );
    }

    /**
     * Get user's documents by purpose
     */
    public Flux<DocumentsUpload> getMyDocumentsByPurpose(
        Long userId,
        String uploadPurpose
    ) {
        log.info("Retrieving {} documents for user: {}", uploadPurpose, userId);

        return documentsUploadRepository.findByUploadedByAndUploadPurposeAndIsActiveTrue(
            userId,
            uploadPurpose
        );
    }

    /**
     * Get document by ID (only if owned by user)
     */
    public Mono<DocumentsUpload> getMyDocumentById(
        UUID documentId,
        Long userId
    ) {
        log.info("Retrieving document: {} for user: {}", documentId, userId);

        return documentsUploadRepository
            .findById(documentId)
            .filter(
                upload ->
                    upload.getUploadedBy().equals(userId) &&
                    upload.getIsActive()
            )
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException("Document not found or access denied")
                )
            );
    }

    /**
     * Generate presigned view URL for user's document (student - ownership enforced)
     */
    public Mono<String> generateViewUrl(UUID documentId, Long userId) {
        log.info(
            "Generating view URL for document: {} by user: {}",
            documentId,
            userId
        );

        return getMyDocumentById(documentId, userId).flatMap(upload -> {
            if (upload.isS3File()) {
                return s3Service.generatePresignedViewUrl(upload.getFileUrl());
            } else {
                return Mono.just(upload.getFileUrl());
            }
        });
    }

    /**
     * Generate presigned view URL for any document — admin/superadmin only.
     * Bypasses ownership check; caller must ensure the requester is an admin.
     */
    public Mono<String> generateViewUrlForAdmin(UUID documentId) {
        log.info("Generating admin view URL for document: {}", documentId);

        return documentsUploadRepository
            .findById(documentId)
            .filter(DocumentsUpload::getIsActive)
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException("Document not found or access denied")
                )
            )
            .flatMap(upload -> {
                if (upload.isS3File()) {
                    return s3Service.generatePresignedViewUrl(upload.getFileUrl());
                } else {
                    return Mono.just(upload.getFileUrl());
                }
            });
    }

    /**
     * Soft delete user's document
     */
    @Transactional
    public Mono<Boolean> deleteMyDocument(UUID documentId, Long userId) {
        log.info("Soft deleting document: {} by user: {}", documentId, userId);

        return getMyDocumentById(documentId, userId)
            .flatMap(upload -> {
                upload.softDelete();
                return documentsUploadRepository.save(upload);
            })
            .map(saved -> true)
            .onErrorReturn(false);
    }

    /**
     * Update document description
     */
    @Transactional
    public Mono<DocumentsUpload> updateDocumentDescription(
        UUID documentId,
        Long userId,
        String newDescription
    ) {
        log.info(
            "Updating description for document: {} by user: {}",
            documentId,
            userId
        );

        return getMyDocumentById(documentId, userId).flatMap(upload -> {
            upload.setDescription(newDescription);
            return documentsUploadRepository.save(upload);
        });
    }

    /**
     * Get upload statistics for user
     */
    public Mono<UploadStatistics> getMyUploadStatistics(Long userId) {
        log.info("Getting upload statistics for user: {}", userId);

        return Mono.zip(
            documentsUploadRepository.countByUploadedByAndIsActiveTrue(userId),
            documentsUploadRepository.getTotalFileSizeByUser(userId),
            documentsUploadRepository.countByUploadedByAndUploadPurposeAndIsActiveTrue(
                userId,
                "APPLICATION"
            ),
            documentsUploadRepository.countByUploadedByAndUploadPurposeAndIsActiveTrue(
                userId,
                "PROFILE"
            )
        ).map(tuple ->
            UploadStatistics.builder()
                .totalUploads(tuple.getT1())
                .totalFileSize(tuple.getT2())
                .applicationDocuments(tuple.getT3())
                .profileDocuments(tuple.getT4())
                .build()
        );
    }

    /**
     * Search user's documents
     */
    public Flux<DocumentsUpload> searchMyDocuments(
        Long userId,
        String fileType,
        String uploadPurpose,
        String searchTerm
    ) {
        log.info(
            "Searching documents for user: {} with criteria: type={}, purpose={}, term={}",
            userId,
            fileType,
            uploadPurpose,
            searchTerm
        );

        Flux<DocumentsUpload> baseQuery =
            documentsUploadRepository.findByUploadedByAndIsActiveTrue(userId);

        // Apply filters
        if (fileType != null && !fileType.isEmpty()) {
            baseQuery = baseQuery.filter(upload ->
                fileType.equalsIgnoreCase(upload.getFileType())
            );
        }

        if (uploadPurpose != null && !uploadPurpose.isEmpty()) {
            baseQuery = baseQuery.filter(upload ->
                uploadPurpose.equals(upload.getUploadPurpose())
            );
        }

        if (searchTerm != null && !searchTerm.isEmpty()) {
            String lowerSearchTerm = searchTerm.toLowerCase();
            baseQuery = baseQuery.filter(
                upload ->
                    upload
                        .getOriginalFilename()
                        .toLowerCase()
                        .contains(lowerSearchTerm) ||
                    (upload.getDescription() != null &&
                        upload
                            .getDescription()
                            .toLowerCase()
                            .contains(lowerSearchTerm))
            );
        }

        return baseQuery;
    }

    /**
     * Check S3 service health
     */
    public Mono<Boolean> checkS3Health() {
        log.info("Checking S3 service health");
        return s3Service.checkBucketAccess();
    }

    /**
     * Extract file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    /**
     * Upload statistics DTO
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class UploadStatistics {

        private Long totalUploads;
        private Long totalFileSize;
        private Long applicationDocuments;
        private Long profileDocuments;

        public String getFormattedTotalFileSize() {
            if (totalFileSize == null || totalFileSize == 0) return "0 B";

            if (totalFileSize < 1024) {
                return totalFileSize + " B";
            } else if (totalFileSize < 1024 * 1024) {
                return String.format("%.1f KB", totalFileSize / 1024.0);
            } else {
                return String.format(
                    "%.1f MB",
                    totalFileSize / (1024.0 * 1024.0)
                );
            }
        }
    }

    /**
     * Auto-create workflow for uploaded document
     * Called when student uploads document with application_id
     */
    private Mono<Void> createWorkflowForUpload(
        DocumentsUpload upload,
        UUID applicationId,
        String documentType
    ) {
        log.info(
            "Auto-creating workflow for upload: {} application: {} docType: {}",
            upload.getId(),
            applicationId,
            documentType
        );

        return applicationRepository
            .findById(applicationId)
            .switchIfEmpty(
                Mono.error(
                    new IllegalArgumentException(
                        "Application not found: " + applicationId
                    )
                )
            )
            .flatMap(application -> {
                log.debug(
                    "Found application: {} assigned to admin: {} at stage: {}",
                    application.getId(),
                    application.getAssignedAdminId(),
                    application.getWorkflowStage()
                );

                // Determine workflow stage based on document type
                String workflowStage = determineWorkflowStage(
                    documentType,
                    application.getWorkflowStage()
                );

                // Create workflow record
                return documentWorkflowService.createDocumentWorkflow(
                    upload.getId(),
                    upload.getUploadedBy(),
                    applicationId,
                    documentType != null ? documentType : "GENERAL",
                    workflowStage
                );
            })
            .then()
            .doOnSuccess(unused ->
                log.info("Auto-created workflow for upload: {}", upload.getId())
            )
            .doOnError(error ->
                log.error(
                    "Failed to auto-create workflow for upload: {}",
                    upload.getId(),
                    error
                )
            );
    }

    /**
     * Determine appropriate workflow stage based on document type
     * Maps document types to workflow stages from uni360.yml
     */
    private String determineWorkflowStage(
        String documentType,
        String currentStage
    ) {
        if (documentType == null) {
            return currentStage != null ? currentStage : "APPLICATION_REVIEW";
        }

        // Map document types to workflow stages based on uni360.yml
        switch (documentType.toUpperCase()) {
            case "PASSPORT":
            case "TRANSCRIPT":
            case "DIPLOMA":
                return "ACADEMIC_EVALUATION";
            case "APS_CERTIFICATE":
                return "CERTIFICATION_PROCESS";
            case "PAYMENT_RECEIPT":
                return "CERTIFICATION_PROCESS";
            case "LANGUAGE_TEST":
            case "IELTS":
            case "TOEFL":
                return "ACADEMIC_EVALUATION";
            default:
                return currentStage != null
                    ? currentStage
                    : "APPLICATION_REVIEW";
        }
    }
}
