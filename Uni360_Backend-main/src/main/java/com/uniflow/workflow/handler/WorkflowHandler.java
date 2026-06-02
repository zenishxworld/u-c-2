package com.uniflow.workflow.handler;

import com.uniflow.auth.util.CommonHelperUtils;
import com.uniflow.workflow.dto.*;
import com.uniflow.workflow.service.WorkflowService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * WorkflowHandler handles workflow-related HTTP requests using functional routing pattern
 *
 * <p>This handler provides endpoint logic for workflow definitions, tasks, instances, and dashboard
 * operations using Spring WebFlux ServerRequest/ServerResponse pattern.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WorkflowHandler {

    private final WorkflowService workflowService;
    private final CommonHelperUtils commonHelperUtils;

    // ===========================================
    // Workflow Definition Endpoints
    // ===========================================

    /** GET /api/v1/workflow/definitions Get all active workflow definitions */
    public Mono<ServerResponse> getAllDefinitions(ServerRequest request) {
        log.debug("Getting all workflow definitions");

        return workflowService
            .getAllActiveDefinitions()
            .collectList()
            .flatMap(definitions ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            true,
                            "message",
                            "Workflow definitions retrieved successfully",
                            "data",
                            definitions,
                            "count",
                            definitions.size()
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Error getting workflow definitions: {}",
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "message",
                            "Failed to retrieve workflow definitions: " +
                                error.getMessage()
                        )
                    );
            });
    }

    /** GET /api/v1/workflow/definitions/{key} Get workflow definition by key */
    public Mono<ServerResponse> getDefinitionByKey(ServerRequest request) {
        String definitionKey = request.pathVariable("key");
        log.debug("Getting workflow definition by key: {}", definitionKey);

        return workflowService
            .getDefinitionByKey(definitionKey)
            .flatMap(definition ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            true,
                            "message",
                            "Workflow definition retrieved successfully",
                            "data",
                            definition
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Error getting workflow definition {}: {}",
                    definitionKey,
                    error.getMessage()
                );
                return ServerResponse.notFound().build();
            });
    }

    /** POST /api/v1/workflow/definitions Create new workflow definition */
    public Mono<ServerResponse> createDefinition(ServerRequest request) {
        log.debug("Creating workflow definition");

        return request
            .bodyToMono(WorkflowDefinitionDTO.class)
            .flatMap(workflowService::createDefinition)
            .flatMap(definition ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            true,
                            "message",
                            "Workflow definition created successfully",
                            "data",
                            definition
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Error creating workflow definition: {}",
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "message",
                            "Failed to create workflow definition: " +
                                error.getMessage()
                        )
                    );
            });
    }

    /** PUT /api/v1/workflow/definitions/{id} Update workflow definition */
    public Mono<ServerResponse> updateDefinition(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        log.debug("Updating workflow definition with id: {}", id);

        return request
            .bodyToMono(WorkflowDefinitionDTO.class)
            .flatMap(dto -> workflowService.updateDefinition(id, dto))
            .flatMap(definition ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            true,
                            "message",
                            "Workflow definition updated successfully",
                            "data",
                            definition
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Error updating workflow definition {}: {}",
                    id,
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "message",
                            "Failed to update workflow definition: " +
                                error.getMessage()
                        )
                    );
            });
    }

    /** DELETE /api/v1/workflow/definitions/{id} Delete workflow definition (soft delete) */
    public Mono<ServerResponse> deleteDefinition(ServerRequest request) {
        Long id = Long.valueOf(request.pathVariable("id"));
        log.debug("Deleting workflow definition with id: {}", id);

        return workflowService
            .deleteDefinition(id)
            .then(
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            true,
                            "message",
                            "Workflow definition deleted successfully"
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Error deleting workflow definition {}: {}",
                    id,
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "message",
                            "Failed to delete workflow definition: " +
                                error.getMessage()
                        )
                    );
            });
    }

    // ===========================================
    // Task Management Endpoints
    // ===========================================

    /** GET /api/v1/workflow/tasks/dashboard Get task dashboard for current user */
    public Mono<ServerResponse> getTaskDashboard(ServerRequest request) {
        String userId = request.queryParam("userId").orElse("current-user");
        log.debug("Getting task dashboard for user: {}", userId);

        return workflowService
            .getTaskDashboard(userId)
            .flatMap(dashboard ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            true,
                            "message",
                            "Dashboard data retrieved successfully",
                            "data",
                            dashboard
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Error getting task dashboard for user {}: {}",
                    userId,
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "message",
                            "Failed to retrieve dashboard data: " +
                                error.getMessage()
                        )
                    );
            });
    }

    /** POST /api/v1/workflow/tasks/search Search tasks with filters */
    public Mono<ServerResponse> searchTasks(ServerRequest request) {
        log.debug("Searching tasks");

        return request
            .bodyToMono(TaskSearchRequestDTO.class)
            .flatMap(workflowService::searchTasks)
            .flatMap(results ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            true,
                            "message",
                            "Tasks retrieved successfully",
                            "data",
                            results
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error("Error searching tasks: {}", error.getMessage());
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "message",
                            "Failed to search tasks: " + error.getMessage()
                        )
                    );
            });
    }

    /** GET /api/v1/workflow/tasks/{taskId} Get task by ID */
    public Mono<ServerResponse> getTaskById(ServerRequest request) {
        String taskId = request.pathVariable("taskId");
        log.debug("Getting task by ID: {}", taskId);

        return workflowService
            .getTaskById(taskId)
            .flatMap(task ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            true,
                            "message",
                            "Task retrieved successfully",
                            "data",
                            task
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Error getting task {}: {}",
                    taskId,
                    error.getMessage()
                );
                return ServerResponse.notFound().build();
            });
    }

    /** POST /api/v1/workflow/tasks Create new task */
    public Mono<ServerResponse> createTask(ServerRequest request) {
        log.debug("Creating task");

        return request
            .bodyToMono(CreateTaskRequestDTO.class)
            .flatMap(workflowService::createTask)
            .flatMap(task ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            true,
                            "message",
                            "Task created successfully",
                            "data",
                            task
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error("Error creating task: {}", error.getMessage());
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "message",
                            "Failed to create task: " + error.getMessage()
                        )
                    );
            });
    }

    /** PUT /api/v1/workflow/tasks/{taskId}/status Update task status */
    public Mono<ServerResponse> updateTaskStatus(ServerRequest request) {
        String taskId = request.pathVariable("taskId");
        log.debug("Updating task status for: {}", taskId);

        return request
            .bodyToMono(Map.class)
            .cast(Map.class)
            .map(body -> (String) body.get("status"))
            .flatMap(status -> workflowService.updateTaskStatus(taskId, status))
            .flatMap(task ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            true,
                            "message",
                            "Task status updated successfully",
                            "data",
                            task
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Error updating task status {}: {}",
                    taskId,
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "message",
                            "Failed to update task status: " +
                                error.getMessage()
                        )
                    );
            });
    }

    /** PUT /api/v1/workflow/tasks/{taskId}/assign Assign task to user */
    public Mono<ServerResponse> assignTask(ServerRequest request) {
        String taskId = request.pathVariable("taskId");
        log.debug("Assigning task: {}", taskId);

        return request
            .bodyToMono(Map.class)
            .cast(Map.class)
            .map(body -> (String) body.get("assignee"))
            .flatMap(assignee -> workflowService.assignTask(taskId, assignee))
            .flatMap(task ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            true,
                            "message",
                            "Task assigned successfully",
                            "data",
                            task
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Error assigning task {}: {}",
                    taskId,
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "message",
                            "Failed to assign task: " + error.getMessage()
                        )
                    );
            });
    }

    /** PUT /api/v1/workflow/tasks/{taskId}/read Mark task as read */
    public Mono<ServerResponse> markTaskAsRead(ServerRequest request) {
        String taskId = request.pathVariable("taskId");
        log.debug("Marking task as read: {}", taskId);

        return workflowService
            .markTaskAsRead(taskId)
            .then(
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            true,
                            "message",
                            "Task marked as read successfully"
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Error marking task as read {}: {}",
                    taskId,
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "message",
                            "Failed to mark task as read: " + error.getMessage()
                        )
                    );
            });
    }

    /** PUT /api/v1/workflow/tasks/{taskId}/bookmark Toggle task bookmark */
    public Mono<ServerResponse> toggleTaskBookmark(ServerRequest request) {
        String taskId = request.pathVariable("taskId");
        log.debug("Toggling task bookmark: {}", taskId);

        return request
            .bodyToMono(Map.class)
            .cast(Map.class)
            .map(body -> (Boolean) body.get("bookmarked"))
            .flatMap(bookmarked ->
                workflowService.toggleTaskBookmark(taskId, bookmarked)
            )
            .then(
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            true,
                            "message",
                            "Task bookmark updated successfully"
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Error toggling task bookmark {}: {}",
                    taskId,
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "message",
                            "Failed to update task bookmark: " +
                                error.getMessage()
                        )
                    );
            });
    }

    // ===========================================
    // Workflow Instance Endpoints
    // ===========================================

    /**
     * GET /api/v1/workflow/instances/application/{applicationId} Get workflow instances for
     * application
     */
    public Mono<ServerResponse> getInstancesForApplication(
        ServerRequest request
    ) {
        String applicationId = request.pathVariable("applicationId");
        log.debug(
            "Getting workflow instances for application: {}",
            applicationId
        );

        return workflowService
            .getInstancesForApplication(applicationId)
            .collectList()
            .flatMap(instances ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            true,
                            "message",
                            "Workflow instances retrieved successfully",
                            "data",
                            instances,
                            "count",
                            instances.size()
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Error getting workflow instances for application {}: {}",
                    applicationId,
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "message",
                            "Failed to retrieve workflow instances: " +
                                error.getMessage()
                        )
                    );
            });
    }

    /** GET /api/v1/workflow/instances/active Get active workflow instances */
    public Mono<ServerResponse> getActiveInstances(ServerRequest request) {
        log.debug("Getting active workflow instances");

        return workflowService
            .getActiveInstances()
            .collectList()
            .flatMap(instances ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            true,
                            "message",
                            "Active workflow instances retrieved successfully",
                            "data",
                            instances,
                            "count",
                            instances.size()
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Error getting active workflow instances: {}",
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "message",
                            "Failed to retrieve active workflow instances: " +
                                error.getMessage()
                        )
                    );
            });
    }

    // ===========================================
    // Health and Utility Endpoints
    // ===========================================

    /** GET /api/v1/workflow/health Health check endpoint */
    public Mono<ServerResponse> getHealthStatus(ServerRequest request) {
        log.debug("Getting workflow service health status");

        return workflowService
            .getHealthStatus()
            .flatMap(health ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(health)
            )
            .onErrorResume(error -> {
                log.error(
                    "Error getting workflow service health: {}",
                    error.getMessage()
                );
                return ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of("status", "DOWN", "error", error.getMessage())
                    );
            });
    }

    /** GET /api/v1/workflow/info Service information endpoint */
    public Mono<ServerResponse> getServiceInfo(ServerRequest request) {
        log.debug("Getting workflow service information");

        return ServerResponse.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(
                Map.of(
                    "service",
                    "workflow-service",
                    "version",
                    "1.0.0",
                    "description",
                    "Workflow orchestration and task management service",
                    "features",
                    java.util.List.of(
                        "Workflow definitions management",
                        "Task creation and assignment",
                        "Workflow instance tracking",
                        "Dashboard and analytics",
                        "Search and filtering"
                    )
                )
            );
    }

    // ===========================================
    // Additional Handler Methods for RouterConfig
    // ===========================================

    /** GET /api/v1/workflow/tasks/dashboard Get tasks dashboard (alias for getTaskDashboard) */
    public Mono<ServerResponse> getTasksDashboard(ServerRequest request) {
        return getTaskDashboard(request);
    }

    /** GET /api/v1/workflow/tasks List tasks with optional filters */
    public Mono<ServerResponse> listTasks(ServerRequest request) {
        return commonHelperUtils
            .getUserFromServerRequest(request)
            .flatMap(userContext -> {
                // Only show tasks claimed/assigned to this specific admin
                String currentUserId = String.valueOf(userContext.getUserId());
                String status = request.queryParam("status").orElse(null);

                TaskSearchRequestDTO searchRequest =
                    TaskSearchRequestDTO.builder()
                        .assignees(java.util.List.of(currentUserId))
                        .taskStatuses(
                            status != null
                                ? java.util.List.of(status)
                                : java.util.List.of(
                                    "CLAIMED",
                                    "IN_PROGRESS",
                                    "ASSIGNED"
                                )
                        )
                        .build();

                return workflowService
                    .searchTasks(searchRequest)
                    .flatMap(results ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(
                                Map.of(
                                    "success",
                                    true,
                                    "message",
                                    "Tasks retrieved successfully",
                                    "data",
                                    results
                                )
                            )
                    );
            })
            .onErrorResume(error -> {
                log.error("Error listing tasks: {}", error.getMessage());
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "message",
                            "Failed to list tasks: " + error.getMessage()
                        )
                    );
            });
    }

    /** POST /api/v1/workflow/tasks/{taskId}/bookmark Toggle task bookmark */
    public Mono<ServerResponse> bookmarkTask(ServerRequest request) {
        return toggleTaskBookmark(request);
    }

    /** GET /api/v1/workflow/tasks/application/{applicationId} Get tasks for specific application */
    public Mono<ServerResponse> getTasksForApplication(ServerRequest request) {
        String applicationId = request.pathVariable("applicationId");
        log.debug("Getting tasks for application: {}", applicationId);

        TaskSearchRequestDTO searchRequest = TaskSearchRequestDTO.builder()
            .applicationIds(java.util.List.of(applicationId))
            .build();

        return workflowService
            .searchTasks(searchRequest)
            .flatMap(results ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            true,
                            "message",
                            "Tasks for application retrieved successfully",
                            "data",
                            results
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Error getting tasks for application {}: {}",
                    applicationId,
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "message",
                            "Failed to retrieve tasks: " + error.getMessage()
                        )
                    );
            });
    }

    /** GET /api/v1/workflow/definitions Get all workflow definitions (alias for getAllDefinitions) */
    public Mono<ServerResponse> getAllWorkflowDefinitions(
        ServerRequest request
    ) {
        return getAllDefinitions(request);
    }

    /**
     * GET /api/v1/workflow/definitions/{definitionKey} Get workflow definition by key (alias for
     * getDefinitionByKey)
     */
    public Mono<ServerResponse> getWorkflowDefinitionByKey(
        ServerRequest request
    ) {
        return getDefinitionByKey(request);
    }

    /**
     * GET /api/v1/workflow/definitions/{definitionKey}/versions/{version} Get specific version of
     * workflow definition
     */
    public Mono<ServerResponse> getWorkflowDefinitionByKeyAndVersion(
        ServerRequest request
    ) {
        String definitionKey = request.pathVariable("definitionKey");
        String version = request.pathVariable("version");
        log.debug(
            "Getting workflow definition {} version {}",
            definitionKey,
            version
        );

        return ServerResponse.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(
                Map.of(
                    "success",
                    false,
                    "message",
                    "Version-specific workflow definition retrieval not yet implemented",
                    "definitionKey",
                    definitionKey,
                    "version",
                    version
                )
            );
    }

    /**
     * GET /api/v1/workflow/definitions/{definitionKey}/versions Get all versions of a workflow
     * definition
     */
    public Mono<ServerResponse> getAllVersionsOfDefinition(
        ServerRequest request
    ) {
        String definitionKey = request.pathVariable("definitionKey");
        log.debug(
            "Getting all versions of workflow definition: {}",
            definitionKey
        );

        return ServerResponse.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(
                Map.of(
                    "success",
                    false,
                    "message",
                    "Multiple versions retrieval not yet implemented",
                    "definitionKey",
                    definitionKey
                )
            );
    }

    /** POST /api/v1/workflow/definitions Create workflow definition (alias for createDefinition) */
    public Mono<ServerResponse> createWorkflowDefinition(
        ServerRequest request
    ) {
        return createDefinition(request);
    }

    /** PUT /api/v1/workflow/definitions/{definitionKey} Update workflow definition by key */
    public Mono<ServerResponse> updateWorkflowDefinition(
        ServerRequest request
    ) {
        String definitionKey = request.pathVariable("definitionKey");
        log.debug("Updating workflow definition by key: {}", definitionKey);

        return ServerResponse.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(
                Map.of(
                    "success",
                    false,
                    "message",
                    "Update by definition key not yet implemented",
                    "definitionKey",
                    definitionKey
                )
            );
    }

    /** POST /api/v1/workflow/definitions/{definitionKey}/activate Activate workflow definition */
    public Mono<ServerResponse> activateWorkflowDefinition(
        ServerRequest request
    ) {
        String definitionKey = request.pathVariable("definitionKey");
        log.debug("Activating workflow definition: {}", definitionKey);

        return ServerResponse.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(
                Map.of(
                    "success",
                    false,
                    "message",
                    "Workflow definition activation not yet implemented",
                    "definitionKey",
                    definitionKey
                )
            );
    }

    /** POST /api/v1/workflow/definitions/{definitionKey}/deactivate Deactivate workflow definition */
    public Mono<ServerResponse> deactivateWorkflowDefinition(
        ServerRequest request
    ) {
        String definitionKey = request.pathVariable("definitionKey");
        log.debug("Deactivating workflow definition: {}", definitionKey);

        return ServerResponse.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(
                Map.of(
                    "success",
                    false,
                    "message",
                    "Workflow definition deactivation not yet implemented",
                    "definitionKey",
                    definitionKey
                )
            );
    }

    /** POST /api/v1/workflow/definitions/{definitionKey}/suspend Suspend workflow definition */
    public Mono<ServerResponse> suspendWorkflowDefinition(
        ServerRequest request
    ) {
        String definitionKey = request.pathVariable("definitionKey");
        log.debug("Suspending workflow definition: {}", definitionKey);

        return ServerResponse.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(
                Map.of(
                    "success",
                    false,
                    "message",
                    "Workflow definition suspension not yet implemented",
                    "definitionKey",
                    definitionKey
                )
            );
    }

    /** POST /api/v1/workflow/definitions/{definitionKey}/resume Resume workflow definition */
    public Mono<ServerResponse> resumeWorkflowDefinition(
        ServerRequest request
    ) {
        String definitionKey = request.pathVariable("definitionKey");
        log.debug("Resuming workflow definition: {}", definitionKey);

        return ServerResponse.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(
                Map.of(
                    "success",
                    false,
                    "message",
                    "Workflow definition resume not yet implemented",
                    "definitionKey",
                    definitionKey
                )
            );
    }

    /** DELETE /api/v1/workflow/definitions/{definitionKey} Delete workflow definition by key */
    public Mono<ServerResponse> deleteWorkflowDefinition(
        ServerRequest request
    ) {
        String definitionKey = request.pathVariable("definitionKey");
        log.debug("Deleting workflow definition by key: {}", definitionKey);

        return ServerResponse.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(
                Map.of(
                    "success",
                    false,
                    "message",
                    "Delete by definition key not yet implemented",
                    "definitionKey",
                    definitionKey
                )
            );
    }

    /** GET /api/v1/workflow/definitions/search Search workflow definitions */
    public Mono<ServerResponse> searchWorkflowDefinitions(
        ServerRequest request
    ) {
        String searchTerm = request.queryParam("q").orElse("");
        log.debug("Searching workflow definitions with term: {}", searchTerm);

        return ServerResponse.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(
                Map.of(
                    "success",
                    false,
                    "message",
                    "Workflow definition search not yet implemented",
                    "searchTerm",
                    searchTerm
                )
            );
    }

    /**
     * GET /api/v1/workflow/instances/application/{applicationId} Get workflow instances by
     * application (alias for getInstancesForApplication)
     */
    public Mono<ServerResponse> getWorkflowInstancesByApplication(
        ServerRequest request
    ) {
        return getInstancesForApplication(request);
    }

    /**
     * GET /api/v1/workflow/instances/active Get active workflow instances (alias for
     * getActiveInstances)
     */
    public Mono<ServerResponse> getActiveWorkflowInstances(
        ServerRequest request
    ) {
        return getActiveInstances(request);
    }

    /** GET /api/v1/workflow/health Health check (alias for getHealthStatus) */
    public Mono<ServerResponse> healthCheck(ServerRequest request) {
        return getHealthStatus(request);
    }
}
