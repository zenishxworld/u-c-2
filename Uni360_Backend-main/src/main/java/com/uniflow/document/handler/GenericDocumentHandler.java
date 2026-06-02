package com.uniflow.document.handler;

import com.uniflow.auth.util.JwtUtils;
import com.uniflow.document.dto.GenericDocumentResponseDTO;
import com.uniflow.document.service.GenericDocumentService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.http.codec.multipart.FormFieldPart;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * Generic Document Handler - Independent Document Operations
 *
 * <p>Provides reactive web handlers for universal document operations.
 * Extracts user context from JWT tokens automatically and supports all user types.
 *
 * <p>Key Features:
 * - JWT-based authentication and user extraction
 * - Independent document controller (not under admin)
 * - Universal upload for students, admins, any user type
 * - S3 integration with presigned URLs
 * - Reactive programming with ServerRequest/ServerResponse
 * - No hardcoded data or assumptions
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GenericDocumentHandler {

    private final GenericDocumentService genericDocumentService;
    private final JwtUtils jwtUtils;

    /**
     * Generic document upload endpoint
     * POST /api/v1/documents/upload
     */
    public Mono<ServerResponse> uploadDocument(ServerRequest request) {
        log.info("Generic document upload request received");

        return jwtUtils
            .getUserIdFromServerRequest(request)
            .flatMap(userId -> {
                return jwtUtils
                    .getUserTypeFromServerRequest(request)
                    .flatMap(userType -> {
                        return request
                            .multipartData()
                            .flatMap(multipartData -> {
                                // Extract file part
                                FilePart filePart =
                                    (FilePart) multipartData.getFirst("file");
                                if (filePart == null) {
                                    return Mono.error(
                                        new IllegalArgumentException(
                                            "File is required"
                                        )
                                    );
                                }

                                // Extract optional form fields
                                String uploadPurpose = getFormField(
                                    multipartData,
                                    "purpose"
                                );
                                String documentType = getFormField(
                                    multipartData,
                                    "documentType"
                                );
                                String applicationId = getFormField(
                                    multipartData,
                                    "applicationId"
                                );
                                String description = getFormField(
                                    multipartData,
                                    "description"
                                );

                                log.debug(
                                    "User {} ({}) uploading file: {} with purpose: {}",
                                    userId,
                                    userType,
                                    filePart.filename(),
                                    uploadPurpose
                                );

                                return genericDocumentService.uploadDocument(
                                    filePart,
                                    userId,
                                    userType,
                                    uploadPurpose,
                                    documentType,
                                    applicationId,
                                    description
                                );
                            });
                    });
            })
            .flatMap(uploadedDocument ->
                genericDocumentService
                    .generateViewUrl(
                        uploadedDocument.getId(),
                        uploadedDocument.getUploadedBy()
                    )
                    .map(viewUrl ->
                        GenericDocumentResponseDTO.UploadDocumentResponse.builder()
                            .success(true)
                            .message("Document uploaded successfully")
                            .uploadId(uploadedDocument.getId())
                            .fileUrl(uploadedDocument.getFileUrl())
                            .fileName(uploadedDocument.getOriginalFilename())
                            .fileSize(
                                uploadedDocument.getFileSize() != null
                                    ? uploadedDocument.getFileSize()
                                    : 0L
                            )
                            .fileType(uploadedDocument.getFileType())
                            .uploadPurpose(uploadedDocument.getUploadPurpose())
                            .uploadedBy(uploadedDocument.getUploadedBy())
                            .userType(uploadedDocument.getUserType())
                            .viewUrl(viewUrl)
                            .expiresIn(3600L)
                            .uploadedAt(uploadedDocument.getCreatedAt())
                            .build()
                    )
                    .onErrorReturn(
                        GenericDocumentResponseDTO.UploadDocumentResponse.builder()
                            .success(true)
                            .message("Document uploaded successfully")
                            .uploadId(uploadedDocument.getId())
                            .fileUrl(uploadedDocument.getFileUrl())
                            .fileName(uploadedDocument.getOriginalFilename())
                            .fileType(uploadedDocument.getFileType())
                            .uploadedBy(uploadedDocument.getUploadedBy())
                            .userType(uploadedDocument.getUserType())
                            .uploadedAt(uploadedDocument.getCreatedAt())
                            .build()
                    )
            )
            .flatMap(response ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(response)
            )
            .onErrorResume(error -> {
                log.error("Error uploading document: {}", error.getMessage());
                return ServerResponse.badRequest().bodyValue(
                    GenericDocumentResponseDTO.ErrorResponse.builder()
                        .success(false)
                        .message(
                            "Failed to upload document: " + error.getMessage()
                        )
                        .error(error.getMessage())
                        .timestamp(java.time.Instant.now().toString())
                        .build()
                );
            });
    }

    /**
     * Get user's own documents
     * GET /api/v1/documents/my-documents
     */
    public Mono<ServerResponse> getMyDocuments(ServerRequest request) {
        log.info("Request to get user's documents");

        return jwtUtils
            .getUserIdFromServerRequest(request)
            .flatMap(userId -> {
                String uploadPurpose = request
                    .queryParam("uploadPurpose")
                    .orElse(null);
                String fileType = request.queryParam("fileType").orElse(null);
                String searchTerm = request.queryParam("search").orElse(null);

                log.debug(
                    "Getting documents for user: {} with filters: purpose={}, type={}, search={}",
                    userId,
                    uploadPurpose,
                    fileType,
                    searchTerm
                );

                return genericDocumentService
                    .searchMyDocuments(
                        userId,
                        fileType,
                        uploadPurpose,
                        searchTerm
                    )
                    .map(upload ->
                        GenericDocumentResponseDTO.DocumentDetailsResponse.builder()
                            .id(upload.getId())
                            .uploadedBy(upload.getUploadedBy())
                            .userType(upload.getUserType())
                            .originalFilename(upload.getOriginalFilename())
                            .fileUrl(upload.getFileUrl())
                            .fileSize(upload.getFileSize())
                            .formattedFileSize(upload.getFormattedFileSize())
                            .fileType(upload.getFileType())
                            .uploadPurpose(upload.getUploadPurpose())
                            .description(upload.getDescription())
                            .isActive(upload.getIsActive())
                            .createdAt(upload.getCreatedAt())
                            .updatedAt(upload.getUpdatedAt())
                            .typeFlags(
                                GenericDocumentResponseDTO.DocumentDetailsResponse.DocumentTypeFlags.builder()
                                    .isImage(upload.isImage())
                                    .isPdf(upload.isPdf())
                                    .isS3File(upload.isS3File())
                                    .build()
                            )
                            .build()
                    )
                    .collectList()
                    .zipWith(
                        genericDocumentService.getMyUploadStatistics(userId)
                    )
                    .map(tuple -> {
                        var documents = tuple.getT1();
                        var statistics = tuple.getT2();

                        return GenericDocumentResponseDTO.MyDocumentsResponse.builder()
                            .success(true)
                            .documents(documents)
                            .statistics(
                                GenericDocumentResponseDTO.UploadStatistics.builder()
                                    .totalUploads(statistics.getTotalUploads())
                                    .totalFileSize(
                                        statistics.getTotalFileSize()
                                    )
                                    .formattedTotalFileSize(
                                        statistics.getFormattedTotalFileSize()
                                    )
                                    .applicationDocuments(
                                        statistics.getApplicationDocuments()
                                    )
                                    .profileDocuments(
                                        statistics.getProfileDocuments()
                                    )
                                    .build()
                            )
                            .count(documents.size())
                            .filters(
                                GenericDocumentResponseDTO.MyDocumentsResponse.SearchFilters.builder()
                                    .fileType(fileType)
                                    .uploadPurpose(uploadPurpose)
                                    .searchTerm(searchTerm)
                                    .build()
                            )
                            .build();
                    });
            })
            .flatMap(response ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(response)
            )
            .onErrorResume(error -> {
                log.error("Error retrieving documents: {}", error.getMessage());
                return ServerResponse.badRequest().bodyValue(
                    GenericDocumentResponseDTO.ErrorResponse.builder()
                        .success(false)
                        .message(
                            "Failed to retrieve documents: " +
                                error.getMessage()
                        )
                        .error(error.getMessage())
                        .timestamp(java.time.Instant.now().toString())
                        .build()
                );
            });
    }

    /**
     * Generate presigned view URL for document
     * GET /api/v1/documents/{documentId}/view-url
     *
     * Students: ownership enforced — can only view their own documents.
     * Admin / SuperAdmin: bypass ownership check — can view any active document.
     */
    public Mono<ServerResponse> generateViewUrl(ServerRequest request) {
        log.info("Request to generate view URL for document");

        String documentIdStr = request.pathVariable("documentId");
        UUID documentId = UUID.fromString(documentIdStr);

        return jwtUtils
            .getUserTypeFromServerRequest(request)
            .flatMap(userType -> {
                boolean isAdmin = "ADMIN".equalsIgnoreCase(userType)
                    || "SUPER_ADMIN".equalsIgnoreCase(userType);

                if (isAdmin) {
                    log.debug(
                        "Admin/SuperAdmin ({}) requesting view URL for document: {}",
                        userType, documentId
                    );
                    return genericDocumentService.generateViewUrlForAdmin(documentId);
                }

                // Student path — enforce ownership
                return jwtUtils
                    .getUserIdFromServerRequest(request)
                    .flatMap(userId -> {
                        log.debug(
                            "Student {} requesting view URL for document: {}",
                            userId, documentId
                        );
                        return genericDocumentService.generateViewUrl(documentId, userId);
                    });
            })
            .flatMap(viewUrl ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        GenericDocumentResponseDTO.ViewUrlResponse.builder()
                            .success(true)
                            .message("View URL generated successfully")
                            .viewUrl(viewUrl)
                            .expiresIn(3600L)
                            .generatedAt(java.time.LocalDateTime.now())
                            .build()
                    )
            )
            .onErrorResume(error -> {
                log.error("Error generating view URL: {}", error.getMessage());
                return ServerResponse.badRequest().bodyValue(
                    GenericDocumentResponseDTO.ErrorResponse.builder()
                        .success(false)
                        .message(
                            "Failed to generate view URL: " + error.getMessage()
                        )
                        .error(error.getMessage())
                        .timestamp(java.time.Instant.now().toString())
                        .build()
                );
            });
    }

    /**
     * Delete user's document
     * DELETE /api/v1/documents/{documentId}
     */
    public Mono<ServerResponse> deleteDocument(ServerRequest request) {
        log.info("Request to delete document");

        return jwtUtils
            .getUserIdFromServerRequest(request)
            .flatMap(userId -> {
                String documentIdStr = request.pathVariable("documentId");
                UUID documentId = UUID.fromString(documentIdStr);

                log.debug(
                    "Deleting document: {} by user: {}",
                    documentId,
                    userId
                );

                return genericDocumentService.deleteMyDocument(
                    documentId,
                    userId
                );
            })
            .flatMap(deleted -> {
                UUID documentId = UUID.fromString(
                    request.pathVariable("documentId")
                );
                if (deleted) {
                    return ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            GenericDocumentResponseDTO.DeleteDocumentResponse.builder()
                                .success(true)
                                .message("Document deleted successfully")
                                .documentId(documentId)
                                .deletedAt(java.time.LocalDateTime.now())
                                .build()
                        );
                } else {
                    return ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            GenericDocumentResponseDTO.ErrorResponse.builder()
                                .success(false)
                                .message("Failed to delete document")
                                .timestamp(java.time.Instant.now().toString())
                                .build()
                        );
                }
            })
            .onErrorResume(error -> {
                log.error("Error deleting document: {}", error.getMessage());
                return ServerResponse.badRequest().bodyValue(
                    GenericDocumentResponseDTO.ErrorResponse.builder()
                        .success(false)
                        .message(
                            "Failed to delete document: " + error.getMessage()
                        )
                        .error(error.getMessage())
                        .timestamp(java.time.Instant.now().toString())
                        .build()
                );
            });
    }

    /**
     * S3 health check
     * GET /api/v1/documents/s3-health
     */
    public Mono<ServerResponse> checkS3Health(ServerRequest request) {
        log.info("S3 health check request");

        return jwtUtils
            .getUserIdFromServerRequest(request)
            .flatMap(userId -> {
                log.debug("S3 health check by user: {}", userId);
                return genericDocumentService.checkS3Health();
            })
            .flatMap(isHealthy ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        GenericDocumentResponseDTO.S3HealthResponse.builder()
                            .success(true)
                            .s3Health(isHealthy)
                            .message(
                                isHealthy
                                    ? "S3 is accessible"
                                    : "S3 is not accessible"
                            )
                            .timestamp(java.time.Instant.now().toString())
                            .build()
                    )
            )
            .onErrorResume(error -> {
                log.error("Error checking S3 health: {}", error.getMessage());
                return ServerResponse.badRequest().bodyValue(
                    GenericDocumentResponseDTO.S3HealthResponse.builder()
                        .success(false)
                        .s3Health(false)
                        .message(
                            "S3 health check failed: " + error.getMessage()
                        )
                        .timestamp(java.time.Instant.now().toString())
                        .build()
                );
            });
    }

    /**
     * Helper method to extract form field value
     */
    private String getFormField(
        org.springframework.util.MultiValueMap<
            String,
            org.springframework.http.codec.multipart.Part
        > multipartData,
        String fieldName
    ) {
        org.springframework.http.codec.multipart.Part part =
            multipartData.getFirst(fieldName);
        if (part instanceof FormFieldPart) {
            return ((FormFieldPart) part).value();
        }
        return null;
    }
}
