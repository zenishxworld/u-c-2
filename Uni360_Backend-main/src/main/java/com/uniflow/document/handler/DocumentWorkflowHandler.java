package com.uniflow.document.handler;

import com.uniflow.auth.util.JwtUtils;
import com.uniflow.document.dto.DocumentWorkflowDTO;
import com.uniflow.document.service.DocumentWorkflowService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * Document Workflow Handler - AD-02-03 Implementation
 *
 * <p>Reactive web handlers for document workflow management operations.
 * Handles workflow creation, status updates, and admin review processes.
 *
 * <p>Key Features:
 * - JWT-based authentication and authorization
 * - Workflow creation and management
 * - Admin review endpoints
 * - Student document status tracking
 * - Integration with existing document upload system
 *
 * @author AI Agent - AD-02-03 Implementation
 * @since 1.0.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DocumentWorkflowHandler {

    private final DocumentWorkflowService documentWorkflowService;
    private final JwtUtils jwtUtils;

    /**
     * Create document workflow
     * POST /api/v1/admin/documents/workflow
     * Links uploaded documents to workflow management
     */
    public Mono<ServerResponse> createDocumentWorkflow(ServerRequest request) {
        log.info("Create document workflow request received");

        return jwtUtils
            .getUserIdFromServerRequest(request)
            .flatMap(adminId -> {
                log.debug("Admin {} creating document workflow", adminId);

                return request
                    .bodyToMono(DocumentWorkflowDTO.CreateWorkflowRequest.class)
                    .flatMap(workflowRequest -> {
                        log.debug(
                            "Creating workflow for upload: {} document type: {}",
                            workflowRequest.getUploadId(),
                            workflowRequest.getDocumentType()
                        );

                        return documentWorkflowService.createDocumentWorkflow(
                            workflowRequest.getUploadId(),
                            workflowRequest.getStudentId(),
                            workflowRequest.getApplicationId(),
                            workflowRequest.getDocumentType(),
                            workflowRequest.getWorkflowStage()
                        );
                    })
                    .flatMap(workflow ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(
                                DocumentWorkflowDTO.CreateWorkflowResponse.builder()
                                    .success(true)
                                    .message(
                                        "Document workflow created successfully"
                                    )
                                    .workflowId(workflow.getId())
                                    .uploadId(workflow.getUploadId())
                                    .documentType(workflow.getDocumentType())
                                    .verificationStatus(
                                        workflow.getVerificationStatus()
                                    )
                                    .reviewStatus(workflow.getReviewStatus())
                                    .createdAt(workflow.getCreatedAt())
                                    .build()
                            )
                    );
            })
            .doOnSuccess(response ->
                log.info("Document workflow created successfully")
            )
            .onErrorResume(error -> {
                log.error("Error creating document workflow", error);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        DocumentWorkflowDTO.CreateWorkflowResponse.builder()
                            .success(false)
                            .message(
                                "Failed to create workflow: " +
                                    error.getMessage()
                            )
                            .build()
                    );
            });
    }

    /**
     * Get workflow documents for application
     * GET /api/v1/admin/documents/workflow/{applicationId}
     * Returns documents in workflow for specific application
     */
    public Mono<ServerResponse> getWorkflowDocuments(ServerRequest request) {
        String applicationIdStr = request.pathVariable("applicationId");
        UUID applicationId = UUID.fromString(applicationIdStr);

        log.info(
            "Get workflow documents request for application: {}",
            applicationId
        );

        return jwtUtils
            .getUserIdFromServerRequest(request)
            .flatMap(adminId -> {
                log.debug(
                    "Admin {} requesting workflow documents for application: {}",
                    adminId,
                    applicationId
                );

                return documentWorkflowService
                    .getWorkflowDocuments(applicationId)
                    .collectList()
                    .flatMap(documents ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(documents)
                    );
            })
            .doOnSuccess(response ->
                log.info(
                    "Workflow documents retrieved for application: {}",
                    applicationId
                )
            )
            .onErrorResume(error -> {
                log.error(
                    "Error retrieving workflow documents for application: {}",
                    applicationId,
                    error
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        "Failed to retrieve workflow documents: " +
                            error.getMessage()
                    );
            });
    }

    /**
     * Get student document workflows
     * GET /api/v1/documents/workflow/my
     * Returns student's own document workflows (JWT-based)
     */
    public Mono<ServerResponse> getMyDocumentWorkflows(ServerRequest request) {
        log.info("Get my document workflows request received");

        return jwtUtils
            .getUserIdFromServerRequest(request)
            .flatMap(studentId -> {
                log.debug(
                    "Student {} requesting their document workflows",
                    studentId
                );

                return documentWorkflowService
                    .getStudentDocumentWorkflows(studentId)
                    .collectList()
                    .flatMap(workflows ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(workflows)
                    );
            })
            .doOnSuccess(response ->
                log.info("Student document workflows retrieved successfully")
            )
            .onErrorResume(error -> {
                log.error("Error retrieving student document workflows", error);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        "Failed to retrieve document workflows: " +
                            error.getMessage()
                    );
            });
    }

    /**
     * Update workflow status
     * PUT /api/v1/admin/documents/workflow/{workflowId}/status
     * Admin endpoint to approve/reject documents
     */
    public Mono<ServerResponse> updateWorkflowStatus(ServerRequest request) {
        String workflowIdStr = request.pathVariable("workflowId");
        UUID workflowId = UUID.fromString(workflowIdStr);

        log.info("Update workflow status request for workflow: {}", workflowId);

        return jwtUtils
            .getUserIdFromServerRequest(request)
            .flatMap(adminId -> {
                log.debug(
                    "Admin {} updating workflow status for: {}",
                    adminId,
                    workflowId
                );

                return request
                    .bodyToMono(
                        DocumentWorkflowDTO.UpdateWorkflowStatusRequest.class
                    )
                    .flatMap(statusRequest ->
                        documentWorkflowService.updateWorkflowStatus(
                            workflowId,
                            statusRequest.getVerificationStatus(),
                            statusRequest.getReviewStatus(),
                            adminId,
                            statusRequest.getReviewNotes()
                        )
                    )
                    .flatMap(updatedWorkflow ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(
                                DocumentWorkflowDTO.WorkflowStatusResponse.builder()
                                    .success(true)
                                    .message(
                                        "Workflow status updated successfully"
                                    )
                                    .workflowId(updatedWorkflow.getId())
                                    .verificationStatus(
                                        updatedWorkflow.getVerificationStatus()
                                    )
                                    .reviewStatus(
                                        updatedWorkflow.getReviewStatus()
                                    )
                                    .reviewedBy(updatedWorkflow.getReviewedBy())
                                    .reviewedAt(updatedWorkflow.getReviewedAt())
                                    .build()
                            )
                    );
            })
            .doOnSuccess(response ->
                log.info("Workflow status updated for: {}", workflowId)
            )
            .onErrorResume(error -> {
                log.error(
                    "Error updating workflow status for: {}",
                    workflowId,
                    error
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        DocumentWorkflowDTO.WorkflowStatusResponse.builder()
                            .success(false)
                            .message(
                                "Failed to update workflow status: " +
                                    error.getMessage()
                            )
                            .workflowId(workflowId)
                            .build()
                    );
            });
    }

    /**
     * Get documents pending review
     * GET /api/v1/admin/documents/workflow/pending-review
     * Admin dashboard endpoint for review queue
     */
    public Mono<ServerResponse> getDocumentsPendingReview(
        ServerRequest request
    ) {
        log.info("Get documents pending review request received");

        return jwtUtils
            .getUserIdFromServerRequest(request)
            .flatMap(adminId -> {
                log.debug(
                    "Admin {} requesting documents pending review",
                    adminId
                );

                return documentWorkflowService
                    .getDocumentsPendingReview(adminId)
                    .collectList()
                    .flatMap(pendingDocuments ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(pendingDocuments)
                    );
            })
            .doOnSuccess(response ->
                log.info("Documents pending review retrieved successfully")
            )
            .onErrorResume(error -> {
                log.error("Error retrieving documents pending review", error);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        "Failed to retrieve pending documents: " +
                            error.getMessage()
                    );
            });
    }

    /**
     * Get documents reviewed by admin
     * GET /api/v1/admin/documents/workflow/reviewed?studentId={studentId}
     * Admin endpoint for review history, optionally filtered by student
     */
    public Mono<ServerResponse> getReviewedDocuments(ServerRequest request) {
        log.info("Get reviewed documents request received");

        Long studentId = request.queryParam("studentId")
            .map(s -> {
                try { return Long.parseLong(s); }
                catch (NumberFormatException e) { return null; }
            })
            .orElse(null);

        return jwtUtils
            .getUserIdFromServerRequest(request)
            .flatMap(adminId -> {
                log.debug("Admin {} requesting reviewed documents history, studentId filter: {}", adminId, studentId);

                return documentWorkflowService
                    .getReviewedDocuments(adminId, studentId)
                    .collectList()
                    .flatMap(reviewedDocuments ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(reviewedDocuments)
                    );
            })
            .doOnSuccess(response ->
                log.info("Reviewed documents history retrieved successfully")
            )
            .onErrorResume(error -> {
                log.error("Error retrieving reviewed documents history", error);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        "Failed to retrieve reviewed documents: " + error.getMessage()
                    );
            });
    }

    /**
     * Get workflow by upload ID
     * GET /api/v1/documents/workflow/upload/{uploadId}
     * Link uploads to workflows for status tracking
     */
    public Mono<ServerResponse> getWorkflowByUploadId(ServerRequest request) {
        String uploadIdStr = request.pathVariable("uploadId");
        UUID uploadId = UUID.fromString(uploadIdStr);

        log.info("Get workflow by upload ID request for: {}", uploadId);

        return jwtUtils
            .getUserIdFromServerRequest(request)
            .flatMap(userId -> {
                log.debug(
                    "User {} requesting workflow for upload: {}",
                    userId,
                    uploadId
                );

                return documentWorkflowService
                    .getWorkflowByUploadId(uploadId)
                    .flatMap(workflow ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(workflow)
                    )
                    .switchIfEmpty(ServerResponse.notFound().build());
            })
            .doOnSuccess(response ->
                log.info("Workflow retrieved for upload: {}", uploadId)
            )
            .onErrorResume(error -> {
                log.error(
                    "Error retrieving workflow for upload: {}",
                    uploadId,
                    error
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        "Failed to retrieve workflow: " + error.getMessage()
                    );
            });
    }

    /**
     * Generate presigned S3 view URL for a document — fixes admin view bug.
     * GET /api/v1/admin/documents/workflow/{workflowId}/view-url
     *
     * <p>Admin can approve/reject AND now also open the actual uploaded file.
     */
    public Mono<ServerResponse> getDocumentViewUrl(ServerRequest request) {
        String workflowIdStr = request.pathVariable("workflowId");
        UUID workflowId = UUID.fromString(workflowIdStr);

        log.info("Admin requesting view URL for workflow: {}", workflowId);

        return jwtUtils
            .getUserIdFromServerRequest(request)
            .flatMap(adminId -> {
                log.debug("Admin {} requesting view URL for workflow: {}", adminId, workflowId);
                return documentWorkflowService.getDocumentViewUrl(workflowId);
            })
            .flatMap(viewUrl ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        DocumentWorkflowDTO.ViewUrlResponse.builder()
                            .success(true)
                            .message("Document view URL generated successfully")
                            .workflowId(workflowId)
                            .viewUrl(viewUrl)
                            .expiresIn(3600L)
                            .generatedAt(java.time.LocalDateTime.now())
                            .build()
                    )
            )
            .onErrorResume(error -> {
                log.error("Error generating view URL for workflow: {}", workflowId, error);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        DocumentWorkflowDTO.ViewUrlResponse.builder()
                            .success(false)
                            .message("Failed to generate view URL: " + error.getMessage())
                            .workflowId(workflowId)
                            .build()
                    );
            });
    }
}

