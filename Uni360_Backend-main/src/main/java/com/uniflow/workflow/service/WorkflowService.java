package com.uniflow.workflow.service;

import com.uniflow.workflow.dto.*;
import com.uniflow.workflow.entity.Task;
import com.uniflow.workflow.entity.WorkflowDefinition;
import com.uniflow.workflow.entity.WorkflowInstance;
import com.uniflow.workflow.repository.TaskRepository;
import com.uniflow.workflow.repository.WorkflowDefinitionRepository;
import com.uniflow.workflow.repository.WorkflowInstanceRepository;
import java.time.LocalDateTime;
import java.util.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * WorkflowService provides comprehensive business logic for workflow orchestration
 *
 * <p>This service handles workflow definitions, instances, tasks, and dashboard operations. It
 * consolidates functionality from the original workflow service components.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class WorkflowService {

    private final WorkflowDefinitionRepository workflowDefinitionRepository;
    private final WorkflowInstanceRepository workflowInstanceRepository;
    private final TaskRepository taskRepository;

    // ===========================================
    // Workflow Definition Operations
    // ===========================================

    /** Get all active workflow definitions */
    public Flux<WorkflowDefinitionDTO> getAllActiveDefinitions() {
        log.debug("Fetching all active workflow definitions");
        return workflowDefinitionRepository
            .findAllActiveDefinitions()
            .map(this::convertDefinitionToDTO);
    }

    /** Get workflow definition by key */
    public Mono<WorkflowDefinitionDTO> getDefinitionByKey(
        String definitionKey
    ) {
        log.debug("Fetching workflow definition by key: {}", definitionKey);
        return workflowDefinitionRepository
            .findLatestByDefinitionKey(definitionKey)
            .map(this::convertDefinitionToDTO)
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Workflow definition not found: " + definitionKey
                    )
                )
            );
    }

    /** Create new workflow definition */
    public Mono<WorkflowDefinitionDTO> createDefinition(
        WorkflowDefinitionDTO definitionDTO
    ) {
        log.debug(
            "Creating workflow definition: {}",
            definitionDTO.getDefinitionKey()
        );

        return workflowDefinitionRepository
            .getMaxVersionForDefinitionKey(definitionDTO.getDefinitionKey())
            .defaultIfEmpty(0)
            .map(maxVersion -> maxVersion + 1)
            .flatMap(nextVersion -> {
                WorkflowDefinition definition = convertDTOToDefinition(
                    definitionDTO
                );
                definition.setVersion(nextVersion);
                definition.setCreatedAt(LocalDateTime.now());
                definition.setUpdatedAt(LocalDateTime.now());
                return workflowDefinitionRepository.save(definition);
            })
            .map(this::convertDefinitionToDTO);
    }

    /** Update workflow definition */
    public Mono<WorkflowDefinitionDTO> updateDefinition(
        Long id,
        WorkflowDefinitionDTO definitionDTO
    ) {
        log.debug("Updating workflow definition with id: {}", id);

        return workflowDefinitionRepository
            .findById(id)
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException("Workflow definition not found")
                )
            )
            .flatMap(existing -> {
                updateDefinitionFromDTO(existing, definitionDTO);
                existing.setUpdatedAt(LocalDateTime.now());
                return workflowDefinitionRepository.save(existing);
            })
            .map(this::convertDefinitionToDTO);
    }

    /** Delete workflow definition (soft delete) */
    public Mono<Void> deleteDefinition(Long id) {
        log.debug("Deleting workflow definition with id: {}", id);

        return workflowDefinitionRepository.softDeleteDefinition(id).then();
    }

    // ===========================================
    // Task Operations
    // ===========================================

    /** Get task dashboard for user */
    public Mono<TaskDashboardDTO> getTaskDashboard(String userId) {
        log.debug("Getting task dashboard for user: {}", userId);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
        LocalDateTime startOfWeek = now.minusDays(7);
        LocalDateTime startOfMonth = now.minusDays(30);

        return Mono.zip(
            // Basic counts
            taskRepository.countActiveTasksByOwner(Long.parseLong(userId)),
            taskRepository.countTasksByOwnerAndStatus(
                Long.parseLong(userId),
                "CLAIMED"
            ),
            taskRepository.findOverdueTasks(System.currentTimeMillis()).count(),
            taskRepository
                .findTasksCompletedBetween(
                    startOfDay
                        .atZone(java.time.ZoneOffset.UTC)
                        .toInstant()
                        .toEpochMilli(),
                    now
                        .atZone(java.time.ZoneOffset.UTC)
                        .toInstant()
                        .toEpochMilli()
                )
                .count(),
            taskRepository
                .findTasksCompletedBetween(
                    startOfWeek
                        .atZone(java.time.ZoneOffset.UTC)
                        .toInstant()
                        .toEpochMilli(),
                    now
                        .atZone(java.time.ZoneOffset.UTC)
                        .toInstant()
                        .toEpochMilli()
                )
                .count(),
            taskRepository
                .findTasksCompletedBetween(
                    startOfMonth
                        .atZone(java.time.ZoneOffset.UTC)
                        .toInstant()
                        .toEpochMilli(),
                    now
                        .atZone(java.time.ZoneOffset.UTC)
                        .toInstant()
                        .toEpochMilli()
                )
                .count(),
            // Recent tasks
            taskRepository
                .findActiveTasksByOwner(Long.parseLong(userId))
                .take(10)
                .map(this::convertTaskToDTO)
                .collectList(),
            // Overdue tasks
            taskRepository
                .findOverdueTasks(System.currentTimeMillis())
                .filter(task -> userId.equals(task.getAssignee()))
                .take(5)
                .map(this::convertTaskToDTO)
                .collectList()
        ).map(tuple -> {
            TaskDashboardDTO dashboard = TaskDashboardDTO.builder()
                .totalTasks(tuple.getT1())
                .assignedToMe(tuple.getT2())
                .overdueTasks(tuple.getT3())
                .completedToday(tuple.getT4())
                .completedThisWeek(tuple.getT5())
                .completedThisMonth(tuple.getT6())
                .recentTasks(tuple.getT7())
                .overdueItems(tuple.getT8())
                .currentUser(userId)
                .lastUpdated(now)
                .dataAsOf(now)
                .build();

            return dashboard;
        });
    }

    /** Search tasks with filters */
    public Mono<TaskListResponseDTO> searchTasks(
        TaskSearchRequestDTO searchRequest
    ) {
        log.debug(
            "Searching tasks with request: {}",
            searchRequest.getSearchQuery()
        );

        // For simplicity, implement basic search - full implementation would be more complex
        Flux<Task> tasksFlux;

        if (
            searchRequest.getSearchQuery() != null &&
            !searchRequest.getSearchQuery().trim().isEmpty()
        ) {
            // Use basic filtering for search since searchTasks method doesn't exist in simplified repo
            tasksFlux = taskRepository
                .findByDeleted(false)
                .filter(
                    task ->
                        task
                            .getApplicationId()
                            .toLowerCase()
                            .contains(
                                searchRequest.getSearchQuery().toLowerCase()
                            ) ||
                        task
                            .getTaskType()
                            .toLowerCase()
                            .contains(
                                searchRequest.getSearchQuery().toLowerCase()
                            )
                );
        } else {
            tasksFlux = taskRepository.findByDeleted(false);
        }

        // Apply filters
        if (
            searchRequest.getTaskStatuses() != null &&
            !searchRequest.getTaskStatuses().isEmpty()
        ) {
            tasksFlux = tasksFlux.filter(task ->
                searchRequest.getTaskStatuses().contains(task.getTaskStatus())
            );
        }

        if (
            searchRequest.getAssignees() != null &&
            !searchRequest.getAssignees().isEmpty()
        ) {
            tasksFlux = tasksFlux.filter(task ->
                searchRequest.getAssignees().contains(task.getAssignee())
            );
        }

        // Apply pagination
        int page = searchRequest.getPage() != null
            ? searchRequest.getPage()
            : 0;
        int size = searchRequest.getSize() != null
            ? searchRequest.getSize()
            : 20;

        return tasksFlux
            .skip((long) page * size)
            .take(size)
            .map(this::convertTaskToDTO)
            .collectList()
            .zipWith(tasksFlux.count())
            .map(tuple -> {
                List<TaskDTO> tasks = tuple.getT1();
                Long totalElements = tuple.getT2();
                int totalPages = (int) Math.ceil((double) totalElements / size);

                return TaskListResponseDTO.builder()
                    .tasks(tasks)
                    .totalElements(totalElements)
                    .totalPages(totalPages)
                    .currentPage(page)
                    .pageSize(size)
                    .hasNext(page < totalPages - 1)
                    .hasPrevious(page > 0)
                    .isFirst(page == 0)
                    .isLast(page >= totalPages - 1)
                    .lastUpdated(LocalDateTime.now())
                    .build();
            });
    }

    /** Get task by ID */
    public Mono<TaskDTO> getTaskById(String taskId) {
        log.debug("Getting task by ID: {}", taskId);

        return taskRepository
            .findByTaskId(taskId)
            .map(this::convertTaskToDTO)
            .switchIfEmpty(
                Mono.error(new RuntimeException("Task not found: " + taskId))
            );
    }

    /** Create new task */
    public Mono<TaskDTO> createTask(CreateTaskRequestDTO request) {
        log.debug(
            "Creating task for application: {}",
            request.getApplicationId()
        );

        long now = System.currentTimeMillis();
        Task task = Task.builder()
            .taskId(UUID.randomUUID().toString())
            .applicationId(request.getApplicationId())
            .taskType(request.getTaskDefinitionKey())
            .taskStatus(request.getTaskStatus())
            .priority(request.getPriority())
            .dueDate(
                request.getDueDate() != null
                    ? request
                        .getDueDate()
                        .atZone(java.time.ZoneOffset.UTC)
                        .toInstant()
                        .toEpochMilli()
                    : now + (24 * 60 * 60 * 1000L)
            )
            .ownerId(
                request.getAssignee() != null
                    ? tryParseLong(request.getAssignee())
                    : null
            )
            .stage("DEFAULT")
            .validationRule("ADMIN_CONFIRMATION")
            .active(true)
            .createdAt(now)
            .updatedAt(now)
            .deleted(false)
            .build();

        // Set candidate users and groups as comma-separated strings
        if (request.getCandidateUsers() != null) {
            task.setCandidateUsers(
                String.join(",", request.getCandidateUsers())
            );
        }
        if (request.getCandidateGroups() != null) {
            task.setCandidateGroups(
                String.join(",", request.getCandidateGroups())
            );
        }
        if (request.getTags() != null) {
            task.setTags(String.join(",", request.getTags()));
        }

        return taskRepository.save(task).map(this::convertTaskToDTO);
    }

    /** Update task status */
    public Mono<TaskDTO> updateTaskStatus(String taskId, String status) {
        log.debug("Updating task status: {} to {}", taskId, status);

        return taskRepository
            .updateTaskStatus(taskId, status, System.currentTimeMillis())
            .then(taskRepository.findByTaskId(taskId))
            .map(this::convertTaskToDTO);
    }

    /** Assign task to user */
    public Mono<TaskDTO> assignTask(String taskId, String assignee) {
        log.debug("Assigning task {} to {}", taskId, assignee);

        return taskRepository
            // Use basic save operation since reassignTask doesn't exist in simplified repo
            .findByTaskId(taskId)
            .flatMap(task -> {
                // Set owner to assignee ID if it's a valid number, otherwise keep current owner
                try {
                    task.setOwnerId(Long.parseLong(assignee));
                } catch (NumberFormatException e) {
                    // Keep current owner if assignee is not a valid ID
                }
                task.setUpdatedAt(java.time.LocalDateTime.now());
                return taskRepository.save(task);
            })
            .then(taskRepository.findByTaskId(taskId))
            .map(this::convertTaskToDTO);
    }

    /** Mark task as read */
    public Mono<Void> markTaskAsRead(String taskId) {
        log.debug("Marking task as read: {}", taskId);

        // Read status not supported in simplified schema - use basic update
        return taskRepository
            .findByTaskId(taskId)
            .flatMap(task -> {
                task.setUpdatedAt(java.time.LocalDateTime.now());
                return taskRepository.save(task);
            })
            .then();
    }

    /** Toggle task bookmark */
    public Mono<Void> toggleTaskBookmark(String taskId, boolean bookmarked) {
        log.debug("Setting task bookmark status: {} to {}", taskId, bookmarked);

        // Bookmark status not supported in simplified schema - use basic update
        return taskRepository
            .findByTaskId(taskId)
            .flatMap(task -> {
                task.setUpdatedAt(java.time.LocalDateTime.now());
                return taskRepository.save(task);
            })
            .then();
    }

    // ===========================================
    // Workflow Instance Operations
    // ===========================================

    /** Get workflow instances for application */
    public Flux<WorkflowInstance> getInstancesForApplication(
        String applicationId
    ) {
        log.debug(
            "Getting workflow instances for application: {}",
            applicationId
        );

        return workflowInstanceRepository.findByApplicationIdAndDeleted(
            applicationId,
            false
        );
    }

    /** Get active workflow instances */
    public Flux<WorkflowInstance> getActiveInstances() {
        log.debug("Getting active workflow instances");

        return workflowInstanceRepository.findActiveInstances();
    }

    // ===========================================
    // Health Check
    // ===========================================

    /** Health check for workflow service */
    public Mono<Map<String, Object>> getHealthStatus() {
        log.debug("Checking workflow service health");

        return Mono.zip(
            workflowDefinitionRepository.countActiveDefinitions(),
            workflowInstanceRepository.countAllInstances(),
            taskRepository.count()
        ).map(tuple -> {
            Map<String, Object> health = new HashMap<>();
            health.put("status", "UP");
            health.put("timestamp", LocalDateTime.now());
            health.put("workflowDefinitions", tuple.getT1());
            health.put("workflowInstances", tuple.getT2());
            health.put("tasks", tuple.getT3());
            return health;
        });
    }

    // ===========================================
    // Conversion Methods
    // ===========================================

    private WorkflowDefinitionDTO convertDefinitionToDTO(
        WorkflowDefinition definition
    ) {
        return WorkflowDefinitionDTO.builder()
            .id(definition.getId())
            .definitionKey(definition.getDefinitionKey())
            .definitionName(definition.getDefinitionName())
            .definitionDescription(definition.getDefinitionDescription())
            .version(definition.getVersion())
            .category(definition.getCategory())
            .tenantId(definition.getTenantId())
            .deploymentId(definition.getDeploymentId())
            .resourceName(definition.getResourceName())
            .diagramResourceName(definition.getDiagramResourceName())
            .processDefinition(definition.getProcessDefinition())
            .startFormKey(definition.getStartFormKey())
            .hasStartFormKey(definition.getHasStartFormKey())
            .hasGraphicalNotation(definition.getHasGraphicalNotation())
            .isSuspended(definition.getIsSuspended())
            .isActive(definition.getIsActive())
            .revision(definition.getRevision())
            .variables(definition.getVariables())
            .configuration(definition.getConfiguration())
            .clientType(definition.getClientType())
            .territoryIdentifier(definition.getTerritoryIdentifier())
            .workflowType(definition.getWorkflowType())
            .autoAssignmentRules(definition.getAutoAssignmentRules())
            .escalationRules(definition.getEscalationRules())
            .notificationRules(definition.getNotificationRules())
            .approvalHierarchy(definition.getApprovalHierarchy())
            .requiredDocuments(definition.getRequiredDocuments())
            .slaHours(definition.getSlaHours())
            .createdAt(definition.getCreatedAt())
            .updatedAt(definition.getUpdatedAt())
            .createdBy(definition.getCreatedBy())
            .updatedBy(definition.getUpdatedBy())
            .build();
    }

    private WorkflowDefinition convertDTOToDefinition(
        WorkflowDefinitionDTO dto
    ) {
        return WorkflowDefinition.builder()
            .definitionKey(dto.getDefinitionKey())
            .definitionName(dto.getDefinitionName())
            .definitionDescription(dto.getDefinitionDescription())
            .category(dto.getCategory())
            .tenantId(dto.getTenantId())
            .deploymentId(dto.getDeploymentId())
            .resourceName(dto.getResourceName())
            .diagramResourceName(dto.getDiagramResourceName())
            .processDefinition(dto.getProcessDefinition())
            .startFormKey(dto.getStartFormKey())
            .hasStartFormKey(dto.getHasStartFormKey())
            .hasGraphicalNotation(dto.getHasGraphicalNotation())
            .isSuspended(dto.getIsSuspended())
            .isActive(dto.getIsActive())
            .revision(dto.getRevision())
            .variables(dto.getVariables())
            .configuration(dto.getConfiguration())
            .clientType(dto.getClientType())
            .territoryIdentifier(dto.getTerritoryIdentifier())
            .workflowType(dto.getWorkflowType())
            .autoAssignmentRules(dto.getAutoAssignmentRules())
            .escalationRules(dto.getEscalationRules())
            .notificationRules(dto.getNotificationRules())
            .approvalHierarchy(dto.getApprovalHierarchy())
            .requiredDocuments(dto.getRequiredDocuments())
            .slaHours(dto.getSlaHours())
            .createdBy(dto.getCreatedBy())
            .updatedBy(dto.getUpdatedBy())
            .deleted(false)
            .build();
    }

    private void updateDefinitionFromDTO(
        WorkflowDefinition definition,
        WorkflowDefinitionDTO dto
    ) {
        if (dto.getDefinitionName() != null) definition.setDefinitionName(
            dto.getDefinitionName()
        );
        if (
            dto.getDefinitionDescription() != null
        ) definition.setDefinitionDescription(dto.getDefinitionDescription());
        if (dto.getCategory() != null) definition.setCategory(
            dto.getCategory()
        );
        if (dto.getProcessDefinition() != null) definition.setProcessDefinition(
            dto.getProcessDefinition()
        );
        if (dto.getStartFormKey() != null) definition.setStartFormKey(
            dto.getStartFormKey()
        );
        if (dto.getHasStartFormKey() != null) definition.setHasStartFormKey(
            dto.getHasStartFormKey()
        );
        if (
            dto.getHasGraphicalNotation() != null
        ) definition.setHasGraphicalNotation(dto.getHasGraphicalNotation());
        if (dto.getIsSuspended() != null) definition.setIsSuspended(
            dto.getIsSuspended()
        );
        if (dto.getIsActive() != null) definition.setIsActive(
            dto.getIsActive()
        );
        if (dto.getVariables() != null) definition.setVariables(
            dto.getVariables()
        );
        if (dto.getConfiguration() != null) definition.setConfiguration(
            dto.getConfiguration()
        );
        if (dto.getClientType() != null) definition.setClientType(
            dto.getClientType()
        );
        if (
            dto.getTerritoryIdentifier() != null
        ) definition.setTerritoryIdentifier(dto.getTerritoryIdentifier());
        if (dto.getWorkflowType() != null) definition.setWorkflowType(
            dto.getWorkflowType()
        );
        if (
            dto.getAutoAssignmentRules() != null
        ) definition.setAutoAssignmentRules(dto.getAutoAssignmentRules());
        if (dto.getEscalationRules() != null) definition.setEscalationRules(
            dto.getEscalationRules()
        );
        if (dto.getNotificationRules() != null) definition.setNotificationRules(
            dto.getNotificationRules()
        );
        if (dto.getApprovalHierarchy() != null) definition.setApprovalHierarchy(
            dto.getApprovalHierarchy()
        );
        if (dto.getRequiredDocuments() != null) definition.setRequiredDocuments(
            dto.getRequiredDocuments()
        );
        if (dto.getSlaHours() != null) definition.setSlaHours(
            dto.getSlaHours()
        );
        if (dto.getUpdatedBy() != null) definition.setUpdatedBy(
            dto.getUpdatedBy()
        );
    }

    private TaskDTO convertTaskToDTO(Task task) {
        return TaskDTO.builder()
            .id(task.getId())
            .taskId(task.getTaskId())
            .applicationId(task.getApplicationId())
            .taskStatus(task.getTaskStatus())
            .priority(task.getPriority())
            .dueDate(task.getDueDateAsDateTime())
            .createdAt(task.getCreatedAtAsDateTime())
            .updatedAt(task.getUpdatedAtAsDateTime())
            .completedAt(task.getCompletedAtAsDateTime())
            .assignee(task.getAssignee())
            .build();
    }

    // Helper method for parsing Long values safely
    private Long tryParseLong(String value) {
        try {
            return value != null ? Long.parseLong(value) : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
