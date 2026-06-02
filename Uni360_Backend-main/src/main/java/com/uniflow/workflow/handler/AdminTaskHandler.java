package com.uniflow.workflow.handler;

import com.uniflow.auth.util.CommonHelperUtils;
import com.uniflow.common.dto.ApiResponse;
import com.uniflow.commission.service.SuperAdminCommissionService;
import com.uniflow.workflow.dto.AdminTaskSummaryDTO;
import com.uniflow.workflow.dto.SimpleWorkflowProgressResponseDTO;
import com.uniflow.workflow.dto.TaskClaimRequestDTO;
import com.uniflow.workflow.dto.TaskClaimResponseDTO;
import com.uniflow.workflow.dto.TaskCompletionRequestDTO;
import com.uniflow.workflow.dto.TaskCompletionResponseDTO;
import com.uniflow.workflow.dto.TaskDTO;
import com.uniflow.workflow.dto.TaskResponse;
import com.uniflow.workflow.dto.WorkflowProgressResponseDTO;
import com.uniflow.workflow.entity.Task;
import com.uniflow.workflow.exception.TaskValidationException;
import com.uniflow.workflow.repository.TaskCriteriaRepository;
import com.uniflow.workflow.repository.TaskRepository;
import com.uniflow.workflow.service.TaskCompletionValidationService;
import com.uniflow.workflow.service.TaskOrchestrationEngine;
import com.uniflow.workflow.service.TaskTypeConfigurationService;
import com.uniflow.workflow.service.WorkflowProgressService;
import com.uniflow.workflow.service.WorkflowService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * AdminTaskHandler - Handler for admin task management APIs
 *
 * <p>This handler provides reactive endpoints for admin task management including:
 * - Task claiming and assignment
 * - Task completion with results
 * - Task dashboard and summary
 * - Available tasks for claiming
 * - Task progress tracking
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminTaskHandler {

    private final TaskOrchestrationEngine orchestrationEngine;
    private final TaskRepository taskRepository;
    private final WorkflowService workflowService;
    private final TaskTypeConfigurationService taskTypeConfigurationService;
    private final WorkflowProgressService workflowProgressService;
    private final CommonHelperUtils commonHelperUtils;
    private final com.uniflow.workflow.repository.TaskCriteriaRepository taskCriteriaRepository;
    private final com.uniflow.workflow.repository.WorkflowInstanceRepository workflowInstanceRepository;
    private final TaskCompletionValidationService taskCompletionValidationService;
    private final com.uniflow.workflow.repository.WorkflowDefinitionRepository workflowDefinitionRepository;
    private final SuperAdminCommissionService commissionService;

    /** Task types that trigger commission calculation on completion */
    private static final java.util.Set<String> COMMISSION_TRIGGER_TASK_TYPES = java.util.Set.of(
        "TUITION_FEES_PAYMENT",
        "UNIVERSITY_SUBMISSION"
    );

    /**
     * GET /api/v1/admin/tasks
     * Get admin's assigned and claimable tasks with comprehensive filter support
     *
     * Supported Query Parameters:
     * - taskTypes: Comma-separated list (e.g., "APPLICATION_CLAIM,DOCUMENT_REVIEW")
     * - taskStatuses: Comma-separated list (e.g., "CREATED,IN_PROGRESS")
     * - priorities: Comma-separated integers (e.g., "1,2,3")
     * - stages: Comma-separated list (e.g., "APPLICATION_REVIEW,VERIFICATION")
     * - applicationIds: Comma-separated UUIDs
     * - active: Boolean (true/false)
     * - fromDate: Long timestamp
     * - toDate: Long timestamp
     * - page: Integer (default: 0)
     * - size: Integer (default: 10)
     * - sortOrder: ASC or DESC (default: DESC)
     */
    public Mono<ServerResponse> getMyTasks(ServerRequest request) {
        return commonHelperUtils
            .getUserFromServerRequest(request)
            .flatMap(userContext -> {
                log.info(
                    "Getting tasks for admin: {} with filters",
                    userContext.getUserId()
                );

                // Use TaskCriteriaRepository for database-level filtering
                return Mono.zip(
                    taskCriteriaRepository
                        .findTasksWithFilters(request)
                        .collectList(),
                    taskCriteriaRepository.getTotalCountWithFilters(request)
                ).flatMap(tuple -> {
                    List<Task> tasks = tuple.getT1();
                    Long totalCount = tuple.getT2();

                    // Convert tasks to DTOs
                    List<TaskDTO> taskDTOs = tasks
                        .stream()
                        .map(this::convertTaskToDTO)
                        .toList();

                    // Build response
                    TaskResponse response = TaskResponse.builder()
                        .totalCount(totalCount.intValue())
                        .data(taskDTOs)
                        .build();

                    return ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(response);
                });
            })
            .onErrorResume(error -> {
                log.error("Error getting tasks with filters", error);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "error",
                            error.getMessage(),
                            "timestamp",
                            LocalDateTime.now()
                        )
                    );
            });
    }

    /**
     * GET /api/v1/workflow/admin/tasks/claimable
     * Get available tasks for claiming by admin
     */
    public Mono<ServerResponse> getClaimableTasks(ServerRequest request) {
        return commonHelperUtils
            .getUserFromServerRequest(request)
            .flatMap(userContext -> {
                String adminId = String.valueOf(userContext.getUserId());

                // Extract query parameters
                String countryCode = request.queryParam("country").orElse(null);
                String degreeLevel = request
                    .queryParam("degreeLevel")
                    .orElse(null);
                String priority = request.queryParam("priority").orElse(null);
                boolean urgentOnly = Boolean.parseBoolean(
                    request.queryParam("urgentOnly").orElse("false")
                );

                log.info(
                    "Getting claimable tasks for admin: {} with filters - country: {}, degreeLevel: {}, priority: {}, urgentOnly: {}",
                    adminId,
                    countryCode,
                    degreeLevel,
                    priority,
                    urgentOnly
                );

                // Use real TaskOrchestrationEngine service
                return orchestrationEngine
                    .getClaimableTasksForAdmin(userContext.getUserId(), "DE")
                    .collectList()
                    .flatMap(tasksList ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(
                                Map.of(
                                    "success",
                                    true,
                                    "data",
                                    Map.of(
                                        "tasks",
                                        tasksList,
                                        "summary",
                                        Map.of(
                                            "totalAvailable",
                                            tasksList.size(),
                                            "germanApplications",
                                            tasksList
                                                .stream()
                                                .mapToInt(task ->
                                                    "DE".equals(
                                                            task.getCountryCode()
                                                        )
                                                        ? 1
                                                        : 0
                                                )
                                                .sum(),
                                            "eligibleForMe",
                                            tasksList.size()
                                        )
                                    ),
                                    "timestamp",
                                    LocalDateTime.now()
                                )
                            )
                    );
            })
            .onErrorResume(error -> {
                log.error("Error getting my tasks", error);
                return ServerResponse.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "message",
                            "Failed to get tasks: " + error.getMessage(),
                            "timestamp",
                            LocalDateTime.now()
                        )
                    );
            });
    }

    /**
     * Convert Task entity to TaskDTO with all available fields from tasks table
     * Maps all fields: id, task_id, application_id, workflow_instance_id, task_type,
     * task_status, priority, due_date, owner_id, stage, validation_rule, active,
     * claimed_by, claimed_at, completed_at, created_at, updated_at, deleted
     */
    private TaskDTO convertTaskToDTO(Task task) {
        return TaskDTO.builder()
            // Core task identification
            .id(task.getId())
            .taskId(task.getTaskId())
            .applicationId(task.getApplicationId())
            .workflowInstanceId(task.getWorkflowInstanceId())
            // Task type and status
            .taskType(task.getTaskType())
            .taskStatus(task.getTaskStatus())
            .stage(task.getStage())
            // Priority and validation
            .priority(task.getPriority())
            .validationRule(task.getValidationRule())
            // Ownership and assignment
            .ownerId(task.getOwnerId())
            .owner(
                task.getOwnerId() != null ? task.getOwnerId().toString() : null
            )
            .assignee(task.getAssignee())
            .claimedBy(task.getClaimedBy())
            .claimedAt(task.getClaimedAtAsDateTime())
            // Status flags
            .active(task.getActive())
            .deleted(task.getDeleted())
            .suspended(!task.isActive())
            // Timestamps
            .dueDate(task.getDueDateAsDateTime())
            .createdAt(task.getCreatedAtAsDateTime())
            .updatedAt(task.getUpdatedAtAsDateTime())
            .completedAt(task.getCompletedAtAsDateTime())
            .build();
    }

    /**
     * GET /api/v1/admin/tasks/filters
     * Get task filter options with counts for analytics
     *
     * This endpoint returns aggregated counts for various task filter parameters
     * including taskTypes, taskStatuses, priorities, stages, and active status.
     * Used by frontend to populate filter dropdowns with counts.
     *
     * Query Parameters (optional):
     * - ownerId: Filter counts by specific owner (defaults to authenticated user)
     * - active: Filter counts by active status (true/false)
     *
     * @return JSON response with filter analytics
     * Response format:
     * {
     *   "success": true,
     *   "data": [
     *     {"filterParam": "taskTypes", "filterId": "DOCUMENT_REVIEW", "count": 25},
     *     {"filterParam": "taskStatuses", "filterId": "CREATED", "count": 18}
     *   ]
     * }
     */
    public Mono<ServerResponse> getTaskFilters(ServerRequest request) {
        return commonHelperUtils
            .getUserFromServerRequest(request)
            .flatMap(userContext -> {
                log.info(
                    "Getting task filters for user: {}",
                    userContext.getUserId()
                );

                // Define fields to group by for filter analytics
                List<String> groupByFields = Arrays.asList(
                    "task_type",
                    "task_status",
                    "priority",
                    "stage",
                    "active"
                );

                return taskCriteriaRepository
                    .findTaskCountsByFields(request, groupByFields)
                    .collectList()
                    .flatMap(filterCounts -> {
                        log.info(
                            "Found {} filter options with counts",
                            filterCounts.size()
                        );

                        Map<String, Object> response = new HashMap<>();
                        response.put("success", true);
                        response.put("data", filterCounts);
                        response.put(
                            "timestamp",
                            java.time.LocalDateTime.now()
                        );

                        return ServerResponse.ok()
                            .contentType(
                                org.springframework.http.MediaType.APPLICATION_JSON
                            )
                            .bodyValue(response);
                    });
            })
            .onErrorResume(error -> {
                log.error("Error getting task filters", error);
                return ServerResponse.badRequest()
                    .contentType(
                        org.springframework.http.MediaType.APPLICATION_JSON
                    )
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "error",
                            error.getMessage(),
                            "timestamp",
                            java.time.LocalDateTime.now()
                        )
                    );
            });
    }

    /**
     * GET /api/v1/workflow/admin/tasks/summary
     * Get task summary statistics
     */
    public Mono<ServerResponse> getTaskSummary(ServerRequest request) {
        return commonHelperUtils
            .getUserFromServerRequest(request)
            .flatMap(userContext -> {
                String adminId = String.valueOf(userContext.getUserId());

                log.info("Getting task summary for admin: {}", adminId);

                // For now, return mock data - this will be replaced with actual service call
                return Mono.just(
                    createMockTaskSummaryResponse(adminId)
                ).flatMap(response ->
                    ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(response)
                );
            })
            .onErrorResume(error -> {
                log.error("Error getting task summary", error);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "error",
                            error.getMessage(),
                            "timestamp",
                            LocalDateTime.now()
                        )
                    );
            });
    }

    /**
     * POST /api/v1/workflow/admin/tasks/{taskId}/claim
     * Claim a specific task for processing
     */
    public Mono<ServerResponse> claimTask(ServerRequest request) {
        return commonHelperUtils
            .getUserFromServerRequest(request)
            .flatMap(userContext -> {
                Long adminId = userContext.getUserId();
                String taskId = request.pathVariable("taskId");

                return request
                    .bodyToMono(TaskClaimRequestDTO.class)
                    .defaultIfEmpty(new TaskClaimRequestDTO())
                    .flatMap(claimRequest -> {
                        log.info(
                            "Admin {} claiming task: {} with reason: {}",
                            adminId,
                            taskId,
                            claimRequest.getClaimReason()
                        );

                        // Use actual orchestration engine to claim task
                        return orchestrationEngine
                            .claimTask(taskId, adminId)
                            .map(claimedTask -> {
                                // Create task details
                                TaskClaimResponseDTO.TaskDetails taskDetails =
                                    TaskClaimResponseDTO.TaskDetails.builder()
                                        .applicationId(
                                            claimedTask.getApplicationId()
                                        )
                                        .workflowInstanceId(
                                            claimedTask.getWorkflowInstanceId()
                                        )
                                        .taskType(claimedTask.getTaskType())
                                        .stage(claimedTask.getStage())
                                        .validationRule(
                                            claimedTask.getValidationRule()
                                        )
                                        .priority(claimedTask.getPriority())
                                        .dueDate(claimedTask.getDueDate())
                                        .active(claimedTask.getActive())
                                        .build();

                                // Create claim impact info
                                TaskClaimResponseDTO.ClaimImpact claimImpact =
                                    TaskClaimResponseDTO.ClaimImpact.builder()
                                        .nextStepRequired(
                                            "Complete task validation"
                                        )
                                        .availableActions(
                                            List.of(
                                                "COMPLETE",
                                                "REASSIGN",
                                                "ADD_COMMENT"
                                            )
                                        )
                                        .requiresImmediateAction(
                                            claimedTask.getPriority() > 7
                                        )
                                        .workloadImpact(
                                            claimedTask.getPriority() > 7
                                                ? "HIGH"
                                                : "MEDIUM"
                                        )
                                        .build();

                                // Create response DTO
                                TaskClaimResponseDTO responseData =
                                    TaskClaimResponseDTO.success(
                                        claimedTask.getTaskId(),
                                        String.valueOf(
                                            claimedTask.getOwnerId()
                                        ),
                                        "Task successfully claimed",
                                        taskDetails,
                                        claimImpact
                                    );

                                return ApiResponse.success(
                                    responseData,
                                    "Task successfully claimed"
                                );
                            })
                            .flatMap(apiResponse ->
                                ServerResponse.ok()
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .bodyValue(apiResponse)
                            );
                    });
            })
            .onErrorResume(error -> {
                log.error("Error claiming task", error);
                ApiResponse<TaskClaimResponseDTO> errorResponse =
                    ApiResponse.error(
                        "Failed to claim task: " + error.getMessage()
                    );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            });
    }

    /**
     * Complete a claimed task with results
     */
    public Mono<ServerResponse> completeTask(ServerRequest request) {
        return commonHelperUtils
            .getUserFromServerRequest(request)
            .flatMap(userContext -> {
                Long adminId = userContext.getUserId();
                String taskId = request.pathVariable("taskId");

                // First, get task details to check required fields
                return taskRepository
                    .findByTaskId(taskId)
                    .switchIfEmpty(
                        Mono.error(
                            new RuntimeException("Task not found: " + taskId)
                        )
                    )
                    .flatMap(task ->
                        request
                            .bodyToMono(TaskCompletionRequestDTO.class)
                            .onErrorResume(error -> {
                                log.error(
                                    "Error parsing request body for task completion: {}",
                                    error.getMessage()
                                );

                                // Return proper validation error response similar to ProfileBuilderService
                                Map<String, String> fieldErrors =
                                    new HashMap<>();
                                fieldErrors.put(
                                    "expectedFormat",
                                    "Expected fields: completionNotes (string)"
                                );

                                ApiResponse.ErrorDetails errorDetails =
                                    new ApiResponse.ErrorDetails();
                                errorDetails.setCode("VALIDATION_ERROR");
                                errorDetails.setStatus(400);
                                errorDetails.setFieldErrors(fieldErrors);

                                ApiResponse<Object> errorResponse =
                                    ApiResponse.<Object>builder()
                                        .success(false)
                                        .message(
                                            "Invalid request format. Please check your JSON structure."
                                        )
                                        .error(errorDetails)
                                        .build();

                                return Mono.error(
                                    new ValidationException(
                                        "Request body validation failed",
                                        errorResponse
                                    )
                                );
                            })
                            .flatMap(completionRequest -> {
                                // Validate required fields
                                Map<String, String> fieldErrors =
                                    new HashMap<>();

                                if (
                                    completionRequest.getCompletionNotes() ==
                                        null ||
                                    completionRequest
                                        .getCompletionNotes()
                                        .trim()
                                        .isEmpty()
                                ) {
                                    fieldErrors.put(
                                        "completionNotes",
                                        "Completion notes are required and cannot be empty"
                                    );
                                }

                                // Validate task-specific required fields from configuration
                                TaskTypeConfigurationService.TaskTypeConfig taskConfig =
                                    taskTypeConfigurationService.getTaskType(
                                        task.getTaskType()
                                    );

                                if (taskConfig != null) {
                                    Map<String, Object> validationRules =
                                        taskConfig.getValidationRules();
                                    if (
                                        validationRules != null &&
                                        validationRules.containsKey(
                                            "requiredFields"
                                        )
                                    ) {
                                        @SuppressWarnings("unchecked")
                                        List<String> requiredFields = (List<
                                            String
                                        >) validationRules.get(
                                            "requiredFields"
                                        );

                                        if (
                                            requiredFields != null &&
                                            !requiredFields.isEmpty()
                                        ) {
                                            List<String> missingFields =
                                                new ArrayList<>();
                                            Map<String, Object> taskResults =
                                                completionRequest.getTaskResults();

                                            if (!missingFields.isEmpty()) {
                                                // Build expected request template
                                                Map<
                                                    String,
                                                    String
                                                > expectedTemplate =
                                                    new HashMap<>();
                                                for (String field : requiredFields) {
                                                    expectedTemplate.put(
                                                        field,
                                                        "<value>"
                                                    );
                                                }

                                                fieldErrors.put(
                                                    "missingRequiredFields",
                                                    String.join(
                                                        ", ",
                                                        missingFields
                                                    )
                                                );
                                                fieldErrors.put(
                                                    "requiredFields",
                                                    String.join(
                                                        ", ",
                                                        requiredFields
                                                    )
                                                );
                                                fieldErrors.put(
                                                    "providedFields",
                                                    String.join(
                                                        ", ",
                                                        taskResults.keySet()
                                                    )
                                                );
                                                fieldErrors.put(
                                                    "expectedTemplate",
                                                    "{\n  \"completionNotes\": \"Task completed\",\n  \"taskResults\": " +
                                                        expectedTemplate
                                                            .toString()
                                                            .replace(
                                                                "=",
                                                                ": \""
                                                            )
                                                            .replace(
                                                                ", ",
                                                                "\",\n    \""
                                                            ) +
                                                        "\"\n  }\n}"
                                                );
                                                fieldErrors.put(
                                                    "taskType",
                                                    task.getTaskType()
                                                );
                                                fieldErrors.put(
                                                    "taskDisplayName",
                                                    taskConfig.getDisplayName()
                                                );
                                            }
                                        }
                                    }
                                }

                                if (!fieldErrors.isEmpty()) {
                                    ApiResponse.ErrorDetails errorDetails =
                                        new ApiResponse.ErrorDetails();
                                    errorDetails.setCode("VALIDATION_ERROR");
                                    errorDetails.setStatus(400);
                                    errorDetails.setFieldErrors(fieldErrors);

                                    ApiResponse<Object> errorResponse =
                                        ApiResponse.<Object>builder()
                                            .success(false)
                                            .message(
                                                "Task completion validation failed: missing required fields"
                                            )
                                            .error(errorDetails)
                                            .build();

                                    return ServerResponse.badRequest()
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .bodyValue(errorResponse);
                                }

                                log.info(
                                    "Admin {} completing task: {} with notes: {}",
                                    adminId,
                                    taskId,
                                    completionRequest.getCompletionNotes()
                                );

                                // Use actual orchestration engine to complete task
                                return orchestrationEngine
                                    .completeTask(
                                        taskId,
                                        adminId,
                                        completionRequest.getTaskResults()
                                    )
                                    .flatMap(completedTask -> {
                                        TaskCompletionResponseDTO responseData =
                                            TaskCompletionResponseDTO.success(
                                                completedTask.getTaskId(),
                                                "Task completed successfully",
                                                List.of(),
                                                null
                                            );

                                        // Trigger commission calculation for relevant task types
                                        String completedTaskType = completedTask.getTaskType();
                                        if (completedTaskType != null &&
                                            COMMISSION_TRIGGER_TASK_TYPES.contains(completedTaskType.toUpperCase()) &&
                                            completedTask.getApplicationId() != null) {

                                            java.util.UUID appId = java.util.UUID.fromString(
                                                completedTask.getApplicationId());

                                            commissionService
                                                .calculateAndSaveCommissionForVisaStage(appId)
                                                .subscribe(
                                                    result -> log.info(
                                                        "Commission auto-calculated for application {} task {}: applicable={}, amount={}",
                                                        appId, completedTaskType,
                                                        result.getCommissionApplicable(),
                                                        result.getCommissionAmount()),
                                                    error -> log.warn(
                                                        "Commission calculation failed for application {} (non-blocking): {}",
                                                        appId, error.getMessage())
                                                );
                                        }

                                        return ServerResponse.ok()
                                            .contentType(MediaType.APPLICATION_JSON)
                                            .bodyValue(ApiResponse.success(
                                                responseData,
                                                "Task completed successfully"
                                            ));
                                    });
                            })
                    );
            })
            .onErrorResume(ValidationException.class, validationEx -> {
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(validationEx.getApiResponse());
            })
            .onErrorResume(TaskValidationException.class, taskValidationEx -> {
                log.warn(
                    "Task validation failed: {} [{}]",
                    taskValidationEx.getMessage(),
                    taskValidationEx.getErrorCode()
                );

                Map<String, String> fieldErrors = new HashMap<>();
                fieldErrors.put("errorCode", taskValidationEx.getErrorCode());
                fieldErrors.put("errorType", taskValidationEx.getErrorType());
                fieldErrors.put("taskId", taskValidationEx.getTaskId());
                fieldErrors.put(
                    "applicationId",
                    taskValidationEx.getApplicationId()
                );

                if (
                    taskValidationEx.isMissingFlags() &&
                    !taskValidationEx.getMissingFlags().isEmpty()
                ) {
                    List<String> missingFlags =
                        taskValidationEx.getMissingFlags();
                    fieldErrors.put(
                        "missingFlags",
                        String.join(", ", missingFlags)
                    );
                    fieldErrors.put(
                        "missingFlagsList",
                        missingFlags.toString()
                    );
                    fieldErrors.put(
                        "flagsCount",
                        String.valueOf(missingFlags.size())
                    );
                    fieldErrors.put(
                        "recommendation",
                        String.format(
                            "The student profile is missing %d required flag(s): %s. Please ensure these profile fields are completed before attempting to complete this task. The student should update their profile with the required documents/verifications.",
                            missingFlags.size(),
                            String.join(", ", missingFlags)
                        )
                    );
                    fieldErrors.put("action", "UPDATE_STUDENT_PROFILE");
                    fieldErrors.put(
                        "profileSection",
                        determineProfileSection(missingFlags)
                    );
                } else if (taskValidationEx.isProfileNotFound()) {
                    fieldErrors.put(
                        "recommendation",
                        "Student profile must be created and completed before task completion"
                    );
                } else if (taskValidationEx.isSystemError()) {
                    fieldErrors.put(
                        "recommendation",
                        "Please contact system administrator if this issue persists"
                    );
                }

                ApiResponse.ErrorDetails errorDetails =
                    new ApiResponse.ErrorDetails();
                errorDetails.setCode(taskValidationEx.getErrorCode());
                errorDetails.setStatus(422); // Unprocessable Entity for validation failures
                errorDetails.setFieldErrors(fieldErrors);

                String message;
                if (taskValidationEx.isMissingFlags()) {
                    message = String.format(
                        "Task cannot be completed. Student profile is missing %d required flag(s). Please ensure the student completes their profile with the required documents/verifications: %s",
                        taskValidationEx.getMissingFlags().size(),
                        String.join(", ", taskValidationEx.getMissingFlags())
                    );
                } else if (taskValidationEx.isProfileNotFound()) {
                    message = "Student profile not found for this application";
                } else {
                    message = "Task completion validation failed";
                }

                ApiResponse<Object> errorResponse = ApiResponse.<
                        Object
                    >builder()
                    .success(false)
                    .message(message)
                    .error(errorDetails)
                    .build();

                return ServerResponse.unprocessableEntity()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            })
            .onErrorResume(error -> {
                log.error("Error completing task", error);

                Map<String, String> fieldErrors = new HashMap<>();
                fieldErrors.put(
                    "details",
                    "Please verify your request format and ensure all required fields are provided"
                );
                fieldErrors.put("originalError", error.getMessage());

                ApiResponse.ErrorDetails errorDetails =
                    new ApiResponse.ErrorDetails();
                errorDetails.setCode("COMPLETION_ERROR");
                errorDetails.setStatus(400);
                errorDetails.setFieldErrors(fieldErrors);

                ApiResponse<Object> errorResponse = ApiResponse.<
                        Object
                    >builder()
                    .success(false)
                    .message(
                        "Task completion failed. Please check your request format and try again."
                    )
                    .error(errorDetails)
                    .build();

                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            });
    }

    /**
     * Custom exception for validation errors
     */
    private static class ValidationException extends RuntimeException {

        private final ApiResponse<Object> apiResponse;

        public ValidationException(
            String message,
            ApiResponse<Object> apiResponse
        ) {
            super(message);
            this.apiResponse = apiResponse;
        }

        public ApiResponse<Object> getApiResponse() {
            return apiResponse;
        }
    }

    /**
     * GET /api/v1/admin/actions/{taskId}/details
     * Get detailed information about a specific task
     */
    public Mono<ServerResponse> getTaskDetails(ServerRequest request) {
        return commonHelperUtils
            .getUserFromServerRequest(request)
            .flatMap(userContext -> {
                String adminId = String.valueOf(userContext.getUserId());
                String taskId = request.pathVariable("taskId");

                log.info(
                    "Getting task details for admin: {} and task: {}",
                    adminId,
                    taskId
                );

                return taskRepository
                    .findByTaskId(taskId)
                    .flatMap(task -> {
                        // Check if user owns this task
                        if (
                            !task.getOwnerId().equals(userContext.getUserId())
                        ) {
                            return ServerResponse.status(403)
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(
                                    Map.of(
                                        "success",
                                        false,
                                        "message",
                                        "Access denied to this task",
                                        "timestamp",
                                        LocalDateTime.now()
                                    )
                                );
                        }

                        TaskResponse response = TaskResponse.builder()
                            .totalCount(1)
                            .data(List.of(convertTaskToDTO(task)))
                            .build();

                        return ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(response);
                    })
                    .switchIfEmpty(
                        ServerResponse.status(404)
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(
                                Map.of(
                                    "success",
                                    false,
                                    "message",
                                    "Task not found",
                                    "timestamp",
                                    LocalDateTime.now()
                                )
                            )
                    );
            })
            .onErrorResume(error -> {
                log.error("Error getting task details", error);
                return ServerResponse.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "message",
                            "Failed to get task details: " + error.getMessage(),
                            "timestamp",
                            LocalDateTime.now()
                        )
                    );
            });
    }

    /**
     * GET /api/v1/workflow/admin/tasks/task-types
     * Get available task types and their configuration
     */
    public Mono<ServerResponse> getTaskTypes(ServerRequest request) {
        return commonHelperUtils
            .getUserFromServerRequest(request)
            .flatMap(userContext -> {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);

                Map<String, Object> data = new HashMap<>();
                data.put(
                    "taskTypes",
                    taskTypeConfigurationService.getAllTaskTypes()
                );
                data.put(
                    "categories",
                    taskTypeConfigurationService.getCategories()
                );
                data.put(
                    "automationLevels",
                    taskTypeConfigurationService.getAutomationLevels()
                );
                data.put(
                    "countrySpecificTasks",
                    taskTypeConfigurationService.getCountrySpecificTasks()
                );

                response.put("data", data);
                response.put("timestamp", LocalDateTime.now());

                return ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(response);
            })
            .onErrorResume(error -> {
                log.error("Error getting task types", error);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        Map.of(
                            "success",
                            false,
                            "error",
                            error.getMessage(),
                            "timestamp",
                            LocalDateTime.now()
                        )
                    );
            });
    }

    // Helper methods for mock data (to be replaced with actual service calls)

    private Map<String, Object> createMockClaimableTasksResponse(
        String countryCode,
        String degreeLevel,
        String priority,
        boolean urgentOnly
    ) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);

        // Mock task 1
        Map<String, Object> task1 = new HashMap<>();
        task1.put("taskId", "task_001");
        task1.put("applicationId", "APP_2024_001");
        task1.put("taskType", "APPLICATION_CLAIM");
        task1.put("workflowDefinitionKey", "DE_UNIVERSITY_BACHELOR");
        task1.put("countryCode", "DE");
        task1.put("priority", 1);
        task1.put("dueDate", LocalDateTime.now().plusHours(72));
        task1.put(
            "applicationDetails",
            Map.of(
                "applicationId",
                "APP_2024_001",
                "studentName",
                "Test Student",
                "degreeLevel",
                "BACHELOR",
                "targetCountry",
                "Germany",
                "submissionDate",
                LocalDateTime.now().minusHours(2)
            )
        );
        task1.put("requiredPermissions", List.of("can_process_applications"));
        task1.put("canClaim", true);

        // Mock task 2
        Map<String, Object> task2 = new HashMap<>();
        task2.put("taskId", "task_002");
        task2.put("applicationId", "APP_2024_002");
        task2.put("taskType", "APPLICATION_CLAIM");
        task2.put("workflowDefinitionKey", "DE_UNIVERSITY_MASTER");
        task2.put("countryCode", "DE");
        task2.put("priority", 2);
        task2.put("dueDate", LocalDateTime.now().plusHours(48));
        task2.put(
            "applicationDetails",
            Map.of(
                "applicationId",
                "APP_2024_002",
                "studentName",
                "Another Student",
                "degreeLevel",
                "MASTER",
                "targetCountry",
                "Germany",
                "submissionDate",
                LocalDateTime.now().minusHours(1)
            )
        );
        task2.put("requiredPermissions", List.of("can_process_applications"));
        task2.put("canClaim", true);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalAvailable", 2);
        summary.put("germanApplications", 2);
        summary.put("usaApplications", 0);
        summary.put("ukApplications", 0);
        summary.put("eligibleForMe", 2);

        Map<String, Object> data = new HashMap<>();
        data.put("availableTasks", List.of(task1, task2));
        data.put("summary", summary);

        response.put("data", data);
        response.put("timestamp", LocalDateTime.now());
        return response;
    }

    private Map<String, Object> createMockTaskSummaryResponse(String adminId) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);

        Map<String, Object> summary = new HashMap<>();
        summary.put("myTasks", 5);
        summary.put("claimableTasks", 8);
        summary.put("inProgressTasks", 3);
        summary.put("completedToday", 2);
        summary.put("overdueTasks", 1);
        summary.put("applicationsOwned", 12);

        Map<String, Object> workload = new HashMap<>();
        workload.put("currentWorkload", 5);
        workload.put("maxCapacity", 15);
        workload.put("utilizationPercentage", 33.3);

        Map<String, Object> performance = new HashMap<>();
        performance.put("totalApplicationsProcessed", 45);
        performance.put("averageProcessingTimeHours", 18.5);
        performance.put("qualityScore", 8.7);

        Map<String, Object> activity1 = new HashMap<>();
        activity1.put("taskId", "task_001");
        activity1.put("applicationId", "APP_2024_001");
        activity1.put("action", "COMPLETED");
        activity1.put("description", "Document verification completed");
        activity1.put("timestamp", LocalDateTime.now().minusHours(1));

        Map<String, Object> activity2 = new HashMap<>();
        activity2.put("taskId", "task_002");
        activity2.put("applicationId", "APP_2024_002");
        activity2.put("action", "CLAIMED");
        activity2.put("description", "Application claimed for processing");
        activity2.put("timestamp", LocalDateTime.now().minusHours(2));

        Map<String, Object> data = new HashMap<>();
        data.put("adminId", adminId);
        data.put("summary", summary);
        data.put("workload", workload);
        data.put("performance", performance);
        data.put("recentActivities", List.of(activity1, activity2));

        response.put("data", data);
        response.put("timestamp", LocalDateTime.now());
        return response;
    }

    /**
     * Get workflow progress for specific application
     */
    public Mono<ServerResponse> getWorkflowProgress(ServerRequest request) {
        return commonHelperUtils
            .getUserFromServerRequest(request)
            .flatMap(userContext -> {
                String applicationId = request.pathVariable("applicationId");
                Long adminId = userContext.getUserId();

                log.info(
                    "Getting workflow progress for application: {}, admin: {}",
                    applicationId,
                    adminId
                );

                return workflowProgressService
                    .getWorkflowProgress(applicationId, adminId)
                    .flatMap(progressResponse ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(progressResponse)
                    );
            })
            .onErrorResume(error -> {
                log.error("Error getting workflow progress", error);
                SimpleWorkflowProgressResponseDTO errorResponse =
                    SimpleWorkflowProgressResponseDTO.error(
                        "Failed to get workflow progress: " + error.getMessage()
                    );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            });
    }

    /**
     * Get admin's current workload and progress summary
     */
    public Mono<ServerResponse> getAdminWorkloadSummary(ServerRequest request) {
        return commonHelperUtils
            .getUserFromServerRequest(request)
            .flatMap(userContext -> {
                Long adminId = userContext.getUserId();

                log.info("Getting workload summary for admin: {}", adminId);

                return workflowProgressService
                    .getAdminWorkflowSummary(adminId)
                    .flatMap(summaryResponse ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(summaryResponse)
                    );
            })
            .onErrorResume(error -> {
                log.error("Error getting admin workload summary", error);
                SimpleWorkflowProgressResponseDTO errorResponse =
                    SimpleWorkflowProgressResponseDTO.error(
                        "Failed to get workload summary: " + error.getMessage()
                    );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            });
    }

    /**
     * Get workflow progress by workflow instance ID
     */
    public Mono<ServerResponse> getWorkflowProgressByInstance(
        ServerRequest request
    ) {
        return commonHelperUtils
            .getUserFromServerRequest(request)
            .flatMap(userContext -> {
                String workflowInstanceId = request.pathVariable(
                    "workflowInstanceId"
                );
                Long adminId = userContext.getUserId();

                log.info(
                    "Getting workflow progress for instance: {}, admin: {}",
                    workflowInstanceId,
                    adminId
                );

                return workflowProgressService
                    .getWorkflowProgressByInstance(workflowInstanceId, adminId)
                    .flatMap(progressResponse ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(progressResponse)
                    );
            })
            .onErrorResume(error -> {
                log.error("Error getting workflow progress by instance", error);
                SimpleWorkflowProgressResponseDTO errorResponse =
                    SimpleWorkflowProgressResponseDTO.error(
                        "Failed to get workflow progress: " + error.getMessage()
                    );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            });
    }

    /**
     * GET /api/v1/admin/tasks/{taskId}/requirements
     * Get task completion requirements including required fields, profile flags, and sample request
     */
    public Mono<ServerResponse> getTaskRequirements(ServerRequest request) {
        String taskId = request.pathVariable("taskId");

        return taskRepository
            .findByTaskId(taskId)
            .switchIfEmpty(
                Mono.error(new RuntimeException("Task not found: " + taskId))
            )
            .flatMap(task -> {
                // Get task type configuration
                TaskTypeConfigurationService.TaskTypeConfig taskConfig =
                    taskTypeConfigurationService.getTaskType(
                        task.getTaskType()
                    );

                Map<String, Object> requirements = new HashMap<>();
                requirements.put("taskId", taskId);
                requirements.put("taskType", task.getTaskType());
                requirements.put(
                    "taskDisplayName",
                    taskConfig != null
                        ? taskConfig.getDisplayName()
                        : task.getTaskType()
                );
                requirements.put(
                    "taskDescription",
                    taskConfig != null
                        ? taskConfig.getDescription()
                        : "Complete task"
                );

                // Get required form fields from configuration
                final List<String> requiredFields = new ArrayList<>();
                final Map<String, String> fieldDescriptions = new HashMap<>();
                if (
                    taskConfig != null &&
                    taskConfig.getValidationRules() != null
                ) {
                    Map<String, Object> validationRules =
                        taskConfig.getValidationRules();
                    if (validationRules.containsKey("requiredFields")) {
                        @SuppressWarnings("unchecked")
                        List<String> fields = (List<
                            String
                        >) validationRules.get("requiredFields");
                        if (fields != null) {
                            requiredFields.addAll(fields);
                        }

                        // Add descriptions for common fields
                        for (String field : requiredFields) {
                            switch (field) {
                                case "verificationStatus":
                                    fieldDescriptions.put(
                                        field,
                                        "Verification status (APPROVED, REJECTED, NEEDS_REVIEW)"
                                    );
                                    break;
                                case "verificationNotes":
                                    fieldDescriptions.put(
                                        field,
                                        "Detailed notes about the verification"
                                    );
                                    break;
                                case "completionNotes":
                                    fieldDescriptions.put(
                                        field,
                                        "Notes about task completion"
                                    );
                                    break;
                                default:
                                    fieldDescriptions.put(
                                        field,
                                        "Required field for " +
                                            task.getTaskType()
                                    );
                            }
                        }
                    }
                }

                requirements.put("requiredFormFields", requiredFields);
                requirements.put("fieldDescriptions", fieldDescriptions);

                // Get application flags to show current values
                return taskCompletionValidationService
                    .getProfileFlags(task.getApplicationId())
                    .flatMap(applicationFlags -> {
                        // Add current flag values for required form fields
                        Map<String, Boolean> requiredFieldValues =
                            new HashMap<>();
                        for (String field : requiredFields) {
                            requiredFieldValues.put(
                                field,
                                applicationFlags.getOrDefault(field, false)
                            );
                        }
                        requirements.put(
                            "requiredFieldValues",
                            requiredFieldValues
                        );

                        // Get required profile flags from workflow definition
                        return workflowInstanceRepository
                            .findByInstanceId(task.getWorkflowInstanceId())
                            .flatMap(workflowInstance ->
                                workflowDefinitionRepository.findByDefinitionKeyAndIsActive(
                                    workflowInstance.getWorkflowDefinitionKey(),
                                    true
                                )
                            )
                            .map(workflowDef -> {
                                List<String> requiredFlags =
                                    extractRequiredFlagsFromWorkflow(
                                        workflowDef,
                                        task
                                    );
                                requirements.put(
                                    "requiredFlags",
                                    requiredFlags
                                );
                                requirements.put(
                                    "requiredCount",
                                    requiredFlags.size()
                                );

                                // Add current values of required profile flags
                                Map<String, Boolean> requiredFlagValues =
                                    new HashMap<>();
                                for (String flag : requiredFlags) {
                                    requiredFlagValues.put(
                                        flag,
                                        applicationFlags.getOrDefault(
                                            flag,
                                            false
                                        )
                                    );
                                }
                                requirements.put(
                                    "requiredFlagValues",
                                    requiredFlagValues
                                );

                                // Build sample request body
                                Map<String, Object> sampleRequest =
                                    new HashMap<>();
                                sampleRequest.put(
                                    "completionNotes",
                                    "Task completed successfully"
                                );

                                Map<String, String> sampleTaskResults =
                                    new HashMap<>();
                                for (String field : requiredFields) {
                                    switch (field) {
                                        case "verificationStatus":
                                            sampleTaskResults.put(
                                                field,
                                                "APPROVED"
                                            );
                                            break;
                                        case "verificationNotes":
                                            sampleTaskResults.put(
                                                field,
                                                "All documents verified and approved"
                                            );
                                            break;
                                        default:
                                            sampleTaskResults.put(
                                                field,
                                                "<value>"
                                            );
                                    }
                                }
                                sampleRequest.put(
                                    "taskResults",
                                    sampleTaskResults
                                );
                                requirements.put(
                                    "sampleRequestBody",
                                    sampleRequest
                                );

                                // Add usage instructions
                                Map<String, String> instructions =
                                    new HashMap<>();
                                instructions.put(
                                    "endpoint",
                                    "/api/v1/admin/tasks/" +
                                        taskId +
                                        "/complete"
                                );
                                instructions.put("method", "POST");
                                instructions.put(
                                    "contentType",
                                    "application/json"
                                );
                                instructions.put(
                                    "prerequisite",
                                    requiredFlags.isEmpty()
                                        ? "No profile flags required"
                                        : "Student profile must have these flags: " +
                                          String.join(", ", requiredFlags)
                                );
                                requirements.put("instructions", instructions);

                                return requirements;
                            })
                            .switchIfEmpty(
                                Mono.fromCallable(() -> {
                                    requirements.put(
                                        "requiredFlags",
                                        new ArrayList<>()
                                    );
                                    requirements.put("requiredFlagsCount", 0);

                                    // Build sample request even without workflow def
                                    Map<String, Object> sampleRequest =
                                        new HashMap<>();
                                    sampleRequest.put(
                                        "completionNotes",
                                        "Task completed successfully"
                                    );

                                    Map<String, String> sampleTaskResults =
                                        new HashMap<>();
                                    for (String field : requiredFields) {
                                        sampleTaskResults.put(field, "<value>");
                                    }
                                    sampleRequest.put(
                                        "taskResults",
                                        sampleTaskResults
                                    );
                                    requirements.put(
                                        "sampleRequestBody",
                                        sampleRequest
                                    );

                                    return requirements;
                                })
                            );
                    })
                    .onErrorResume(flagError -> {
                        log.warn(
                            "Could not fetch application flags for task {}: {}",
                            taskId,
                            flagError.getMessage()
                        );
                        // Continue without flag values if fetch fails
                        return workflowInstanceRepository
                            .findByInstanceId(task.getWorkflowInstanceId())
                            .flatMap(workflowInstance ->
                                workflowDefinitionRepository.findByDefinitionKeyAndIsActive(
                                    workflowInstance.getWorkflowDefinitionKey(),
                                    true
                                )
                            )
                            .map(workflowDef -> {
                                List<String> requiredFlags =
                                    extractRequiredFlagsFromWorkflow(
                                        workflowDef,
                                        task
                                    );
                                requirements.put(
                                    "requiredFlags",
                                    requiredFlags
                                );
                                requirements.put(
                                    "requiredFlagsCount",
                                    requiredFlags.size()
                                );

                                // Build sample request body without flag values
                                Map<String, Object> sampleRequest =
                                    new HashMap<>();
                                sampleRequest.put(
                                    "completionNotes",
                                    "Task completed successfully"
                                );

                                Map<String, String> sampleTaskResults =
                                    new HashMap<>();
                                for (String field : requiredFields) {
                                    sampleTaskResults.put(field, "<value>");
                                }
                                sampleRequest.put(
                                    "taskResults",
                                    sampleTaskResults
                                );
                                requirements.put(
                                    "sampleRequestBody",
                                    sampleRequest
                                );

                                return requirements;
                            })
                            .switchIfEmpty(
                                Mono.fromCallable(() -> {
                                    requirements.put(
                                        "requiredFlags",
                                        new ArrayList<>()
                                    );
                                    requirements.put("requiredFlagsCount", 0);

                                    Map<String, Object> sampleRequest =
                                        new HashMap<>();
                                    sampleRequest.put(
                                        "completionNotes",
                                        "Task completed successfully"
                                    );

                                    Map<String, String> sampleTaskResults =
                                        new HashMap<>();
                                    for (String field : requiredFields) {
                                        sampleTaskResults.put(field, "<value>");
                                    }
                                    sampleRequest.put(
                                        "taskResults",
                                        sampleTaskResults
                                    );
                                    requirements.put(
                                        "sampleRequestBody",
                                        sampleRequest
                                    );

                                    return requirements;
                                })
                            );
                    });
            })
            .flatMap(requirements ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(requirements))
            )
            .onErrorResume(error -> {
                log.error("Error getting task requirements: {}", taskId, error);
                return ServerResponse.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "Failed to retrieve task requirements: " +
                                error.getMessage()
                        )
                    );
            });
    }

    /**
     * Extract required flags from workflow definition for a specific task
     */
    private List<String> extractRequiredFlagsFromWorkflow(
        com.uniflow.workflow.entity.WorkflowDefinition workflowDef,
        Task task
    ) {
        try {
            com.fasterxml.jackson.databind.JsonNode config =
                workflowDef.getConfiguration();
            com.fasterxml.jackson.databind.JsonNode stages = config.get(
                "stages"
            );

            if (stages != null && stages.isArray()) {
                for (com.fasterxml.jackson.databind.JsonNode stage : stages) {
                    if (task.getStage().equals(stage.get("name").asText())) {
                        com.fasterxml.jackson.databind.JsonNode tasks =
                            stage.get("tasks");
                        if (tasks != null && tasks.isArray()) {
                            for (com.fasterxml.jackson.databind.JsonNode taskNode : tasks) {
                                if (
                                    task
                                        .getTaskType()
                                        .equals(taskNode.get("type").asText())
                                ) {
                                    com.fasterxml.jackson.databind.JsonNode flagsNode =
                                        taskNode.get("requiredFlags");
                                    if (
                                        flagsNode != null && flagsNode.isArray()
                                    ) {
                                        List<String> flags = new ArrayList<>();
                                        flagsNode.forEach(flag ->
                                            flags.add(flag.asText())
                                        );
                                        return flags;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn(
                "Failed to parse workflow config for required flags: {}",
                e.getMessage()
            );
        }
        return new ArrayList<>();
    }

    /**
     * Helper method to determine which profile section contains the missing flags
     */
    private String determineProfileSection(List<String> missingFlags) {
        // Map common flag patterns to profile sections
        for (String flag : missingFlags) {
            String lowerFlag = flag.toLowerCase();
            if (
                lowerFlag.contains("document") || lowerFlag.contains("upload")
            ) {
                return "DOCUMENTS";
            } else if (
                lowerFlag.contains("transcript") ||
                lowerFlag.contains("diploma") ||
                lowerFlag.contains("certificate")
            ) {
                return "ACADEMIC_DOCUMENTS";
            } else if (
                lowerFlag.contains("language") ||
                lowerFlag.contains("ielts") ||
                lowerFlag.contains("toefl")
            ) {
                return "LANGUAGE_PROFICIENCY";
            } else if (
                lowerFlag.contains("payment") || lowerFlag.contains("financial")
            ) {
                return "FINANCIAL";
            } else if (
                lowerFlag.contains("personal") || lowerFlag.contains("identity")
            ) {
                return "PERSONAL_INFORMATION";
            }
        }
        return "PROFILE_COMPLETION";
    }
}
