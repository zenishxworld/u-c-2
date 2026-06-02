package com.uniflow.client.handler;

import com.uniflow.client.dto.WorkflowDefinitionUploadDTO;
import com.uniflow.client.service.ClientWorkflowConfigService;
import com.uniflow.client.service.WorkflowValidationService;
import com.uniflow.common.dto.ApiResponse;
import com.uniflow.workflow.entity.WorkflowDefinition;
import com.uniflow.workflow.repository.WorkflowDefinitionRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * REST API Handler for Client Workflow Definition Management
 *
 * <p>This handler provides HTTP endpoints for managing workflow definitions through the REST API.
 * It supports uploading new workflow definitions, listing existing ones, and retrieving specific
 * workflow configurations for client-based workflow management.
 *
 * <p>Key Features:
 * - Upload new workflow definitions via JSON API
 * - List workflow definitions by client
 * - Retrieve specific workflow definition details
 * - Comprehensive validation and error handling
 * - Multi-client support with proper isolation
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-01
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ClientWorkflowHandler {

    private final ClientWorkflowConfigService clientWorkflowConfigService;
    private final WorkflowDefinitionRepository workflowDefinitionRepository;
    private final WorkflowValidationService workflowValidationService;

    /**
     * Upload a new workflow definition
     *
     * POST /api/v1/admin/client-workflows/upload
     *
     * @param request The server request containing workflow definition data
     * @return Mono containing the server response with upload result
     */
    public Mono<ServerResponse> uploadWorkflowDefinition(
        ServerRequest request
    ) {
        log.info("Received workflow definition upload request");

        return request
            .bodyToMono(WorkflowDefinitionUploadDTO.class)
            .doOnNext(dto ->
                log.info(
                    "Processing workflow definition upload for client: {}, country: {}, degree: {}",
                    dto.getClientId(),
                    dto.getCountryCode(),
                    dto.getDegreeLevel()
                )
            )
            .flatMap(this::validateUploadRequest)
            .flatMap(dto ->
                // Validate workflow configuration using the same service as YAML imports
                workflowValidationService
                    .validateWorkflowConfig(
                        dto.getWorkflowConfig(),
                        dto.getClientId()
                    )
                    .then(Mono.just(dto))
            )
            .flatMap(dto ->
                clientWorkflowConfigService.uploadWorkflowDefinition(
                    dto.getClientId(),
                    dto.getCountryCode(),
                    dto.getDegreeLevel(),
                    dto.getDeploymentId(),
                    dto.getWorkflowConfig(),
                    dto.getUploadedBy(),
                    dto.getForceUpload()
                )
            )
            .flatMap(workflowDefinition ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            createUploadResponse(workflowDefinition),
                            "Workflow definition uploaded successfully"
                        )
                    )
            )
            .onErrorResume(this::handleUploadError);
    }

    /**
     * List workflow definitions for a specific client
     *
     * GET /api/v1/admin/client-workflows?client_id=uni360
     *
     * @param request The server request containing query parameters
     * @return Mono containing the server response with workflow definitions list
     */
    public Mono<ServerResponse> listWorkflowDefinitions(ServerRequest request) {
        String clientId = request.queryParam("client_id").orElse("uni360"); // Default to uni360

        String countryCode = request.queryParam("country_code").orElse(null);
        String degreeLevel = request.queryParam("degree_level").orElse(null);
        boolean activeOnly = request
            .queryParam("active_only")
            .map(Boolean::parseBoolean)
            .orElse(false);

        log.info("Listing workflow definitions for client: {}", clientId);

        return workflowDefinitionRepository
            .findByClientId(clientId)
            .filter(
                definition ->
                    countryCode == null ||
                    countryCode.equals(definition.getCountryCode())
            )
            .filter(
                definition ->
                    degreeLevel == null ||
                    degreeLevel.equals(definition.getDegreeLevel())
            )
            .filter(definition -> !activeOnly || definition.getIsActive())
            .collectList()
            .flatMap(definitions ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            definitions
                                .stream()
                                .map(this::createWorkflowSummary)
                                .toList(),
                            String.format(
                                "Found %d workflow definitions",
                                definitions.size()
                            )
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Error listing workflow definitions: {}",
                    error.getMessage(),
                    error
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "Failed to list workflow definitions: " +
                                error.getMessage()
                        )
                    );
            });
    }

    /**
     * Get a specific workflow definition by ID
     *
     * GET /api/v1/admin/client-workflows/{id}
     *
     * @param request The server request containing the workflow definition ID
     * @return Mono containing the server response with workflow definition details
     */
    public Mono<ServerResponse> getWorkflowDefinition(ServerRequest request) {
        String workflowIdStr = request.pathVariable("id");

        try {
            Long workflowId = Long.parseLong(workflowIdStr);
            log.info("Retrieving workflow definition with ID: {}", workflowId);

            return workflowDefinitionRepository
                .findById(workflowId)
                .switchIfEmpty(
                    Mono.error(
                        new RuntimeException(
                            "Workflow definition not found with ID: " +
                                workflowId
                        )
                    )
                )
                .flatMap(definition ->
                    ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.success(
                                createWorkflowDetailResponse(definition),
                                "Workflow definition retrieved successfully"
                            )
                        )
                )
                .onErrorResume(error -> {
                    log.error(
                        "Error retrieving workflow definition {}: {}",
                        workflowId,
                        error.getMessage()
                    );
                    return ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.error(
                                "Failed to retrieve workflow definition: " +
                                    error.getMessage()
                            )
                        );
                });
        } catch (NumberFormatException e) {
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    ApiResponse.error(
                        "Invalid workflow definition ID: " + workflowIdStr
                    )
                );
        }
    }

    /**
     * Delete/deactivate a workflow definition
     *
     * DELETE /api/v1/admin/client-workflows/{id}
     *
     * @param request The server request containing the workflow definition ID
     * @return Mono containing the server response with deletion result
     */
    public Mono<ServerResponse> deactivateWorkflowDefinition(
        ServerRequest request
    ) {
        String workflowIdStr = request.pathVariable("id");

        try {
            Long workflowId = Long.parseLong(workflowIdStr);
            log.info(
                "Deactivating workflow definition with ID: {}",
                workflowId
            );

            return workflowDefinitionRepository
                .findById(workflowId)
                .switchIfEmpty(
                    Mono.error(
                        new RuntimeException(
                            "Workflow definition not found with ID: " +
                                workflowId
                        )
                    )
                )
                .flatMap(definition -> {
                    definition.setIsActive(false);
                    return workflowDefinitionRepository.save(definition);
                })
                .flatMap(definition ->
                    ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.success(
                                createWorkflowSummary(definition),
                                "Workflow definition deactivated successfully"
                            )
                        )
                )
                .onErrorResume(error -> {
                    log.error(
                        "Error deactivating workflow definition {}: {}",
                        workflowId,
                        error.getMessage()
                    );
                    return ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.error(
                                "Failed to deactivate workflow definition: " +
                                    error.getMessage()
                            )
                        );
                });
        } catch (NumberFormatException e) {
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    ApiResponse.error(
                        "Invalid workflow definition ID: " + workflowIdStr
                    )
                );
        }
    }

    // Helper methods

    /**
     * Validates the workflow definition upload request
     */
    private Mono<WorkflowDefinitionUploadDTO> validateUploadRequest(
        WorkflowDefinitionUploadDTO dto
    ) {
        if (!dto.isValid()) {
            return Mono.error(
                new IllegalArgumentException(
                    "Invalid upload request: missing required fields"
                )
            );
        }

        if (!dto.hasValidWorkflowConfig()) {
            return Mono.error(
                new IllegalArgumentException(
                    "Invalid workflow configuration: must be valid JSON"
                )
            );
        }

        return Mono.just(dto);
    }

    /**
     * Handles upload errors and returns appropriate error response
     */
    private Mono<ServerResponse> handleUploadError(Throwable error) {
        log.error(
            "Error uploading workflow definition: {}",
            error.getMessage(),
            error
        );

        String errorMessage = error.getMessage();
        if (error instanceof IllegalArgumentException) {
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    ApiResponse.error("Validation error: " + errorMessage)
                );
        } else if (errorMessage.contains("already exists")) {
            return ServerResponse.status(409) // Conflict
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    ApiResponse.error(
                        "Workflow definition already exists: " + errorMessage
                    )
                );
        } else {
            return ServerResponse.status(500)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    ApiResponse.error("Internal server error: " + errorMessage)
                );
        }
    }

    /**
     * Creates upload response object
     */
    private Object createUploadResponse(WorkflowDefinition workflowDefinition) {
        return new Object() {
            public final Long id = workflowDefinition.getId();
            public final String definitionKey =
                workflowDefinition.getDefinitionKey();
            public final String clientId = workflowDefinition.getClientId();
            public final String countryCode =
                workflowDefinition.getCountryCode();
            public final String degreeLevel =
                workflowDefinition.getDegreeLevel();
            public final Integer version = workflowDefinition.getVersion();
            public final String deploymentId =
                workflowDefinition.getDeploymentId();
            public final Boolean isActive = workflowDefinition.getIsActive();
        };
    }

    /**
     * Creates workflow summary object for list responses
     */
    private Object createWorkflowSummary(WorkflowDefinition definition) {
        return new Object() {
            public final Long id = definition.getId();
            public final String definitionKey = definition.getDefinitionKey();
            public final String definitionName = definition.getDefinitionName();
            public final String clientId = definition.getClientId();
            public final String countryCode = definition.getCountryCode();
            public final String degreeLevel = definition.getDegreeLevel();
            public final Integer version = definition.getVersion();
            public final Boolean isActive = definition.getIsActive();
            public final String deploymentId = definition.getDeploymentId();
            public final String createdAt = definition.getCreatedAt() != null
                ? definition.getCreatedAt().toString()
                : null;
        };
    }

    /**
     * Creates detailed workflow response object
     */
    private Object createWorkflowDetailResponse(WorkflowDefinition definition) {
        return new Object() {
            public final Long id = definition.getId();
            public final String definitionKey = definition.getDefinitionKey();
            public final String definitionName = definition.getDefinitionName();
            public final String definitionDescription =
                definition.getDefinitionDescription();
            public final String clientId = definition.getClientId();
            public final String countryCode = definition.getCountryCode();
            public final String degreeLevel = definition.getDegreeLevel();
            public final Integer version = definition.getVersion();
            public final Boolean isActive = definition.getIsActive();
            public final String deploymentId = definition.getDeploymentId();
            public final Object workflowConfig = definition.getWorkflowConfig();
            public final String createdAt = definition.getCreatedAt() != null
                ? definition.getCreatedAt().toString()
                : null;
            public final String updatedAt = definition.getUpdatedAt() != null
                ? definition.getUpdatedAt().toString()
                : null;
            public final String createdBy = definition.getCreatedBy();
            public final String updatedBy = definition.getUpdatedBy();
        };
    }
}
