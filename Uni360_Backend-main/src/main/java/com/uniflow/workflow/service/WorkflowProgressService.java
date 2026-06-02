package com.uniflow.workflow.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.workflow.dto.SimpleWorkflowProgressResponseDTO;
import com.uniflow.workflow.dto.WorkflowProgressResponseDTO;
import com.uniflow.workflow.entity.Task;
import com.uniflow.workflow.entity.WorkflowDefinition;
import com.uniflow.workflow.repository.TaskRepository;
import com.uniflow.workflow.repository.WorkflowDefinitionRepository;
import com.uniflow.workflow.repository.WorkflowInstanceRepository;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * WorkflowProgressService - Tracks workflow progress similar to ProfileBuilderService
 *
 * <p>This service provides comprehensive workflow state tracking including:
 * - Current stage and completion percentage
 * - Task status across all stages
 * - Progress timeline and estimates
 * - Next actions and recommendations
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowProgressService {

    private final TaskRepository taskRepository;
    private final WorkflowDefinitionRepository workflowDefinitionRepository;
    private final WorkflowInstanceRepository workflowInstanceRepository;
    private final ObjectMapper objectMapper;

    /**
     * Get workflow progress (Clean ProfileBuilder style)
     */
    public Mono<SimpleWorkflowProgressResponseDTO> getWorkflowProgress(
        String applicationId,
        Long adminId
    ) {
        return taskRepository
            .findByApplicationIdOrderByCreatedAtAsc(applicationId)
            .collectList()
            .map(tasks -> {
                if (tasks.isEmpty()) {
                    return SimpleWorkflowProgressResponseDTO.error(
                        "No tasks found for application: " + applicationId
                    );
                }

                // RBAC: the requesting admin must own at least one task for this application
                boolean adminOwnsTask = adminId != null &&
                    tasks.stream().anyMatch(task -> adminId.equals(task.getOwnerId()));
                if (!adminOwnsTask) {
                    log.warn(
                        "Admin {} attempted to view workflow progress for application {} — not assigned",
                        adminId, applicationId
                    );
                    return SimpleWorkflowProgressResponseDTO.error(
                        "Access denied: application is not assigned to this admin"
                    );
                }

                // Build simplified progress data
                SimpleWorkflowProgressResponseDTO.ProgressData progressData =
                    buildSimpleProgressData(tasks, adminId);
                return SimpleWorkflowProgressResponseDTO.success(progressData);
            })
            .onErrorResume(error -> {
                log.error(
                    "Error getting workflow progress for application: {}",
                    applicationId,
                    error
                );
                return Mono.just(
                    SimpleWorkflowProgressResponseDTO.error(
                        "Failed to retrieve progress: " + error.getMessage()
                    )
                );
            });
    }

    /**
     * Get detailed workflow progress for complex scenarios
     */
    public Mono<WorkflowProgressResponseDTO> getDetailedWorkflowProgress(
        String applicationId,
        Long adminId
    ) {
        return taskRepository
            .findByApplicationIdOrderByCreatedAtAsc(applicationId)
            .collectList()
            .flatMap(tasks -> {
                if (tasks.isEmpty()) {
                    return Mono.just(
                        WorkflowProgressResponseDTO.error(
                            "No tasks found for application: " + applicationId
                        )
                    );
                }

                String workflowInstanceId = tasks
                    .get(0)
                    .getWorkflowInstanceId();
                return buildProgressResponse(
                    applicationId,
                    workflowInstanceId,
                    tasks,
                    adminId
                );
            })
            .onErrorResume(error -> {
                log.error(
                    "Error getting workflow progress for application: {}",
                    applicationId,
                    error
                );
                return Mono.just(
                    WorkflowProgressResponseDTO.error(
                        "Failed to retrieve workflow progress: " +
                            error.getMessage()
                    )
                );
            });
    }

    /**
     * Get workflow progress by workflow instance
     */
    public Mono<
        SimpleWorkflowProgressResponseDTO
    > getWorkflowProgressByInstance(String workflowInstanceId, Long adminId) {
        return taskRepository
            .findByWorkflowInstanceIdOrderByCreatedAtAsc(workflowInstanceId)
            .collectList()
            .map(tasks -> {
                if (tasks.isEmpty()) {
                    return SimpleWorkflowProgressResponseDTO.error(
                        "No tasks found for workflow instance: " +
                            workflowInstanceId
                    );
                }

                SimpleWorkflowProgressResponseDTO.ProgressData progressData =
                    buildSimpleProgressData(tasks, adminId);
                return SimpleWorkflowProgressResponseDTO.success(progressData);
            });
    }

    /**
     * Get admin's current workload and progress
     */
    public Mono<SimpleWorkflowProgressResponseDTO> getAdminWorkflowSummary(
        Long adminId
    ) {
        return taskRepository
            .findActiveTasksByOwner(adminId)
            .collectList()
            .map(tasks -> {
                if (tasks.isEmpty()) {
                    return buildEmptyWorkloadResponse(adminId);
                }

                // Use first application's tasks for summary
                SimpleWorkflowProgressResponseDTO.ProgressData progressData =
                    buildSimpleProgressData(tasks, adminId);
                return SimpleWorkflowProgressResponseDTO.success(progressData);
            });
    }

    /**
     * Build comprehensive progress response
     */
    private Mono<WorkflowProgressResponseDTO> buildProgressResponse(
        String applicationId,
        String workflowInstanceId,
        List<Task> tasks,
        Long adminId
    ) {
        // Get workflow definition dynamically from workflow instance
        return workflowInstanceRepository
            .findByInstanceId(workflowInstanceId)
            .flatMap(workflowInstance ->
                workflowDefinitionRepository.findByDefinitionKey(
                    workflowInstance.getWorkflowDefinitionKey()
                )
            )
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Workflow definition not found for instance: " +
                            workflowInstanceId
                    )
                )
            )
            .map(workflowDef -> {
                try {
                    JsonNode config = workflowDef.getConfiguration();

                    // Build progress overview
                    WorkflowProgressResponseDTO.ProgressOverview overview =
                        buildProgressOverview(
                            applicationId,
                            workflowInstanceId,
                            tasks,
                            config,
                            adminId
                        );

                    // Build stage status list
                    List<WorkflowProgressResponseDTO.StageStatus> stagesStatus =
                        buildStagesStatus(tasks, config);

                    // Build task status lists
                    List<WorkflowProgressResponseDTO.TaskStatus> pendingTasks =
                        buildTaskStatusList(
                            tasks
                                .stream()
                                .filter(
                                    task ->
                                        task.getActive() &&
                                        ("CREATED".equals(
                                                task.getTaskStatus()
                                            ) ||
                                            "CLAIMED".equals(
                                                task.getTaskStatus()
                                            ))
                                )
                                .collect(Collectors.toList()),
                            adminId
                        );

                    List<
                        WorkflowProgressResponseDTO.TaskStatus
                    > completedTasks = buildTaskStatusList(
                        tasks
                            .stream()
                            .filter(
                                task ->
                                    "COMPLETED".equals(task.getTaskStatus()) ||
                                    ("CLAIMED".equals(task.getTaskStatus()) &&
                                        "APPLICATION_CLAIM".equals(
                                            task.getTaskType()
                                        ))
                            )
                            .collect(Collectors.toList()),
                        adminId
                    );

                    // Build metadata
                    WorkflowProgressResponseDTO.WorkflowMetadata metadata =
                        buildWorkflowMetadata(
                            applicationId,
                            workflowDef,
                            tasks
                        );

                    return WorkflowProgressResponseDTO.success(
                        overview,
                        stagesStatus,
                        pendingTasks,
                        completedTasks,
                        metadata
                    );
                } catch (Exception e) {
                    log.error("Error building progress response", e);
                    return WorkflowProgressResponseDTO.error(
                        "Failed to build progress response: " + e.getMessage()
                    );
                }
            });
    }

    /**
     * Build progress overview section
     */
    private WorkflowProgressResponseDTO.ProgressOverview buildProgressOverview(
        String applicationId,
        String workflowInstanceId,
        List<Task> tasks,
        JsonNode config,
        Long adminId
    ) {
        // Determine current stage from active tasks
        String currentStage = tasks
            .stream()
            .filter(Task::getActive)
            .map(Task::getStage)
            .findFirst()
            .orElse("COMPLETED");

        // Calculate completion percentages based on TASKS, not stages
        // This provides more accurate progress tracking as stages can have different numbers of tasks
        // Example: If we have 4 total tasks and 1 is completed, that's 25% completion
        Map<String, List<Task>> tasksByStage = tasks
            .stream()
            .collect(Collectors.groupingBy(Task::getStage));

        int totalTasks = tasks.size();
        int completedTasks = calculateCompletedTasks(tasks);
        int overallCompletion = totalTasks > 0
            ? (completedTasks * 100) / totalTasks
            : 0;

        int totalStages = getStageCount(config);
        int completedStages = calculateCompletedStages(tasksByStage);

        // Calculate current stage completion
        int currentStageCompletion = calculateCurrentStageCompletion(
            tasksByStage.get(currentStage)
        );

        // Determine workflow status
        String workflowStatus = determineWorkflowStatus(tasks, currentStage);

        // Find assigned admin
        Long assignedAdminId = tasks
            .stream()
            .filter(Task::getActive)
            .map(Task::getOwnerId)
            .findFirst()
            .orElse(null);

        // Calculate estimates
        LocalDateTime workflowStarted = tasks
            .stream()
            .map(task ->
                LocalDateTime.ofInstant(
                    java.time.Instant.ofEpochMilli(task.getCreatedAt()),
                    ZoneOffset.UTC
                )
            )
            .min(LocalDateTime::compareTo)
            .orElse(null);

        LocalDateTime lastActivity = tasks
            .stream()
            .map(task ->
                LocalDateTime.ofInstant(
                    java.time.Instant.ofEpochMilli(task.getUpdatedAt()),
                    ZoneOffset.UTC
                )
            )
            .max(LocalDateTime::compareTo)
            .orElse(null);

        return WorkflowProgressResponseDTO.ProgressOverview.builder()
            .applicationId(applicationId)
            .workflowInstanceId(workflowInstanceId)
            .workflowType("GERMANY_MASTERS_APPLICATION")
            .currentStage(currentStage)
            .currentStageDisplayName(getStageDisplayName(currentStage))
            .totalStages(totalStages)
            .completedStages(completedStages)
            .totalTasks(totalTasks)
            .completedTasks(completedTasks)
            .overallCompletionPercentage(overallCompletion)
            .currentStageCompletionPercentage(currentStageCompletion)
            .workflowStatus(workflowStatus)
            .assignedTo(
                assignedAdminId != null ? assignedAdminId.toString() : null
            )
            .estimatedCompletionHours(calculateEstimatedCompletionHours(tasks))
            .workflowStartedAt(workflowStarted)
            .estimatedCompletionDate(calculateEstimatedCompletionDate(tasks))
            .lastActivityAt(lastActivity)
            .slaStatus(calculateSlaStatus(workflowStarted))
            .requiresAttention(determineIfRequiresAttention(tasks))
            .nextAction(determineNextAction(tasks))
            .blockers(identifyBlockers(tasks))
            .nextTask(determineNextTask(tasks, adminId))
            .build();
    }

    /**
     * Build stages status list
     */
    private List<WorkflowProgressResponseDTO.StageStatus> buildStagesStatus(
        List<Task> tasks,
        JsonNode config
    ) {
        List<WorkflowProgressResponseDTO.StageStatus> stagesStatus =
            new ArrayList<>();

        if (config != null && config.has("stages")) {
            JsonNode stages = config.get("stages");
            Map<String, List<Task>> tasksByStage = tasks
                .stream()
                .collect(Collectors.groupingBy(Task::getStage));

            for (JsonNode stage : stages) {
                String stageName = stage.get("name").asText();
                List<Task> stageTasks = tasksByStage.getOrDefault(
                    stageName,
                    new ArrayList<>()
                );

                WorkflowProgressResponseDTO.StageStatus stageStatus =
                    buildStageStatus(stage, stageTasks);
                stagesStatus.add(stageStatus);
            }
        }

        return stagesStatus;
    }

    /**
     * Build individual stage status
     */
    private WorkflowProgressResponseDTO.StageStatus buildStageStatus(
        JsonNode stageConfig,
        List<Task> stageTasks
    ) {
        String stageName = stageConfig.get("name").asText();
        String displayName = stageConfig.has("displayName")
            ? stageConfig.get("displayName").asText()
            : stageName;
        int order = stageConfig.has("order")
            ? stageConfig.get("order").asInt()
            : 0;

        int totalTasks = stageTasks.size();
        int completedTasks = (int) stageTasks
            .stream()
            .filter(
                task ->
                    "COMPLETED".equals(task.getTaskStatus()) ||
                    ("CLAIMED".equals(task.getTaskStatus()) &&
                        "APPLICATION_CLAIM".equals(task.getTaskType()))
            )
            .count();
        int pendingTasks = totalTasks - completedTasks;

        String status = determineStageStatus(stageTasks);
        int completionPercentage = totalTasks > 0
            ? (completedTasks * 100) / totalTasks
            : 0;

        boolean isCurrentStage = stageTasks.stream().anyMatch(Task::getActive);

        LocalDateTime stageStarted = stageTasks
            .stream()
            .map(task ->
                LocalDateTime.ofInstant(
                    java.time.Instant.ofEpochMilli(task.getCreatedAt()),
                    ZoneOffset.UTC
                )
            )
            .min(LocalDateTime::compareTo)
            .orElse(null);

        LocalDateTime stageCompleted = completionPercentage >= 100
            ? stageTasks
                  .stream()
                  .filter(
                      task ->
                          task.getClaimedAt() != null ||
                          task.getCompletedAt() != null
                  )
                  .map(task -> {
                      Long timestamp = task.getCompletedAt() != null
                          ? task.getCompletedAt()
                          : task.getClaimedAt();
                      return LocalDateTime.ofInstant(
                          java.time.Instant.ofEpochMilli(timestamp),
                          ZoneOffset.UTC
                      );
                  })
                  .max(LocalDateTime::compareTo)
                  .orElse(null)
            : null;

        return WorkflowProgressResponseDTO.StageStatus.builder()
            .stageName(stageName)
            .stageDisplayName(displayName)
            .stageOrder(order)
            .status(status)
            .completionPercentage(completionPercentage)
            .totalTasks(totalTasks)
            .completedTasks(completedTasks)
            .pendingTasks(pendingTasks)
            .assignedAdmin(getStageAssignedAdmin(stageTasks))
            .estimatedDurationHours(calculateStageDuration(stageConfig))
            .stageStartedAt(stageStarted)
            .stageCompletedAt(stageCompleted)
            .isCurrentStage(isCurrentStage)
            .canEdit(isCurrentStage)
            .stageDescription(
                stageConfig.has("description")
                    ? stageConfig.get("description").asText()
                    : null
            )
            .build();
    }

    /**
     * Build task status list
     */
    private List<WorkflowProgressResponseDTO.TaskStatus> buildTaskStatusList(
        List<Task> tasks,
        Long adminId
    ) {
        return tasks
            .stream()
            .map(task -> buildTaskStatus(task, adminId))
            .collect(Collectors.toList());
    }

    /**
     * Build individual task status
     */
    private WorkflowProgressResponseDTO.TaskStatus buildTaskStatus(
        Task task,
        Long adminId
    ) {
        LocalDateTime createdAt = LocalDateTime.ofInstant(
            java.time.Instant.ofEpochMilli(task.getCreatedAt()),
            ZoneOffset.UTC
        );

        LocalDateTime claimedAt = task.getClaimedAt() != null
            ? LocalDateTime.ofInstant(
                  java.time.Instant.ofEpochMilli(task.getClaimedAt()),
                  ZoneOffset.UTC
              )
            : null;

        LocalDateTime completedAt = task.getCompletedAt() != null
            ? LocalDateTime.ofInstant(
                  java.time.Instant.ofEpochMilli(task.getCompletedAt()),
                  ZoneOffset.UTC
              )
            : null;

        LocalDateTime dueDate = task.getDueDate() != null
            ? LocalDateTime.ofInstant(
                  java.time.Instant.ofEpochMilli(task.getDueDate()),
                  ZoneOffset.UTC
              )
            : null;

        List<String> availableActions = determineAvailableActions(
            task,
            adminId
        );
        boolean isOverdue = isTaskOverdue(task);

        return WorkflowProgressResponseDTO.TaskStatus.builder()
            .taskId(task.getTaskId())
            .taskType(task.getTaskType())
            .taskDisplayName(getTaskDisplayName(task.getTaskType()))
            .taskDescription(getTaskDescription(task.getTaskType()))
            .status(task.getTaskStatus())
            .stage(task.getStage())
            .stageDisplayName(getStageDisplayName(task.getStage()))
            .priority(task.getPriority())
            .assignedTo(task.getOwnerId().toString())
            .validationRule(task.getValidationRule())
            .isClaimable(task.isClaimableBy(adminId))
            .isCompletable(task.canBeCompletedBy(adminId))
            .requiresImmediateAction(task.getPriority() > 7)
            .createdAt(createdAt)
            .claimedAt(claimedAt)
            .completedAt(completedAt)
            .dueDate(dueDate)
            .estimatedDurationHours(
                getTaskEstimatedDuration(task.getTaskType())
            )
            .ageInHours(Math.toIntExact(calculateTaskAgeInHours(task)))
            .overdue(isOverdue)
            .availableActions(availableActions)
            .build();
    }

    /**
     * Build workflow metadata
     */
    private WorkflowProgressResponseDTO.WorkflowMetadata buildWorkflowMetadata(
        String applicationId,
        WorkflowDefinition workflowDef,
        List<Task> tasks
    ) {
        return WorkflowProgressResponseDTO.WorkflowMetadata.builder()
            .countryCode("DE")
            .degreeLevel("MASTERS")
            .applicationTitle("Germany Masters Application")
            .clientType("UNIFLOW")
            .workflowVersion(
                workflowDef.getVersion() != null
                    ? workflowDef.getVersion().toString()
                    : "1"
            )
            .totalSlaHours(workflowDef.getSlaHours())
            .escalationLevel("NORMAL")
            .build();
    }

    // Helper methods

    private SimpleWorkflowProgressResponseDTO buildEmptyWorkloadResponse(
        Long adminId
    ) {
        return SimpleWorkflowProgressResponseDTO.success(
            SimpleWorkflowProgressResponseDTO.ProgressData.builder()
                .current(0)
                .total(0)
                .percentage(100)
                .stage("NO_ACTIVE_WORKFLOWS")
                .currentStep(null)
                .completedSteps(new ArrayList<>())
                .remainingSteps(new ArrayList<>())
                .build()
        );
    }

    private int getStageCount(JsonNode config) {
        if (
            config != null &&
            config.has("stages") &&
            config.get("stages").isArray()
        ) {
            return config.get("stages").size();
        }
        return 0;
    }

    private int calculateCompletedStages(Map<String, List<Task>> tasksByStage) {
        return (int) tasksByStage
            .values()
            .stream()
            .filter(this::isStageCompleted)
            .count();
    }

    private int calculateCompletedTasks(List<Task> tasks) {
        return (int) tasks
            .stream()
            .filter(
                task ->
                    "COMPLETED".equals(task.getTaskStatus()) ||
                    ("CLAIMED".equals(task.getTaskStatus()) &&
                        "APPLICATION_CLAIM".equals(task.getTaskType()))
            )
            .count();
    }

    private boolean isStageCompleted(List<Task> stageTasks) {
        return stageTasks
            .stream()
            .allMatch(
                task ->
                    "COMPLETED".equals(task.getTaskStatus()) ||
                    ("CLAIMED".equals(task.getTaskStatus()) &&
                        "APPLICATION_CLAIM".equals(task.getTaskType()))
            );
    }

    private int calculateCurrentStageCompletion(List<Task> stageTasks) {
        if (stageTasks == null || stageTasks.isEmpty()) {
            return 100;
        }

        long completedTasks = stageTasks
            .stream()
            .filter(
                task ->
                    "COMPLETED".equals(task.getTaskStatus()) ||
                    ("CLAIMED".equals(task.getTaskStatus()) &&
                        "APPLICATION_CLAIM".equals(task.getTaskType()))
            )
            .count();

        return (int) ((completedTasks * 100) / stageTasks.size());
    }

    private String determineWorkflowStatus(
        List<Task> tasks,
        String currentStage
    ) {
        boolean hasActiveTasks = tasks.stream().anyMatch(Task::getActive);
        boolean allTasksCompleted = tasks
            .stream()
            .allMatch(
                task ->
                    "COMPLETED".equals(task.getTaskStatus()) ||
                    ("CLAIMED".equals(task.getTaskStatus()) &&
                        "APPLICATION_CLAIM".equals(task.getTaskType()))
            );

        if (allTasksCompleted) {
            return "COMPLETED";
        } else if (hasActiveTasks) {
            return "IN_PROGRESS";
        } else {
            return "INITIATED";
        }
    }

    private String getStageDisplayName(String stageName) {
        switch (stageName) {
            case "APPLICATION_REVIEW":
                return "Application Review";
            case "ACADEMIC_EVALUATION":
                return "Academic Evaluation";
            case "DOCUMENT_VERIFICATION":
                return "Document Verification";
            case "FINAL_APPROVAL":
                return "Final Approval";
            default:
                return stageName;
        }
    }

    private Long calculateEstimatedCompletionHours(List<Task> tasks) {
        return tasks
            .stream()
            .filter(Task::getActive)
            .mapToLong(task -> getTaskEstimatedDuration(task.getTaskType()))
            .sum();
    }

    private LocalDateTime calculateEstimatedCompletionDate(List<Task> tasks) {
        Long estimatedHours = calculateEstimatedCompletionHours(tasks);
        return estimatedHours > 0
            ? LocalDateTime.now().plusHours(estimatedHours)
            : null;
    }

    private String calculateSlaStatus(LocalDateTime workflowStarted) {
        if (workflowStarted == null) {
            return "UNKNOWN";
        }

        long hoursElapsed = java.time.Duration.between(
            workflowStarted,
            LocalDateTime.now()
        ).toHours();

        if (hoursElapsed < 24) {
            return "ON_TRACK";
        } else if (hoursElapsed < 48) {
            return "AT_RISK";
        } else {
            return "BREACHED";
        }
    }

    private Boolean determineIfRequiresAttention(List<Task> tasks) {
        return tasks
            .stream()
            .anyMatch(
                task ->
                    task.getActive() &&
                    (task.getPriority() > 7 || isTaskOverdue(task))
            );
    }

    private String determineNextAction(List<Task> tasks) {
        Optional<Task> nextTask = tasks
            .stream()
            .filter(Task::getActive)
            .filter(task -> "CREATED".equals(task.getTaskStatus()))
            .findFirst();

        if (nextTask.isPresent()) {
            return "Claim " + getTaskDisplayName(nextTask.get().getTaskType());
        }

        nextTask = tasks
            .stream()
            .filter(Task::getActive)
            .filter(task -> "CLAIMED".equals(task.getTaskStatus()))
            .findFirst();

        if (nextTask.isPresent()) {
            return (
                "Complete " + getTaskDisplayName(nextTask.get().getTaskType())
            );
        }

        return "No pending actions";
    }

    private List<String> identifyBlockers(List<Task> tasks) {
        List<String> blockers = new ArrayList<>();

        tasks
            .stream()
            .filter(Task::getActive)
            .filter(this::isTaskOverdue)
            .forEach(task ->
                blockers.add(
                    "Overdue: " + getTaskDisplayName(task.getTaskType())
                )
            );

        return blockers;
    }

    private String determineStageStatus(List<Task> stageTasks) {
        if (stageTasks.isEmpty()) {
            return "NOT_STARTED";
        }

        boolean hasActiveTasks = stageTasks.stream().anyMatch(Task::getActive);
        boolean allCompleted = isStageCompleted(stageTasks);

        if (allCompleted) {
            return "COMPLETED";
        } else if (hasActiveTasks) {
            return "IN_PROGRESS";
        } else {
            return "NOT_STARTED";
        }
    }

    private String getStageAssignedAdmin(List<Task> stageTasks) {
        return stageTasks
            .stream()
            .filter(Task::getActive)
            .map(task -> task.getOwnerId().toString())
            .findFirst()
            .orElse(null);
    }

    private Long calculateStageDuration(JsonNode stageConfig) {
        if (stageConfig.has("tasks") && stageConfig.get("tasks").isArray()) {
            return (long) stageConfig.get("tasks").size() * 2; // 2 hours per task average
        }
        return 4L; // Default 4 hours
    }

    private List<String> determineAvailableActions(Task task, Long adminId) {
        List<String> actions = new ArrayList<>();

        // Only APPLICATION_CLAIM tasks can be claimed
        if (
            "APPLICATION_CLAIM".equals(task.getTaskType()) &&
            task.isClaimableBy(adminId)
        ) {
            actions.add("CLAIM");
        }

        // All other tasks can be completed directly if assigned to this admin
        if (
            !("APPLICATION_CLAIM".equals(task.getTaskType())) &&
            task.getOwnerId().equals(adminId)
        ) {
            actions.add("COMPLETE");
        }

        // Admin can always reassign or add comments to their tasks
        if (task.getOwnerId().equals(adminId) && task.getActive()) {
            actions.add("REASSIGN");
            actions.add("ADD_COMMENT");
        }

        return actions;
    }

    private boolean isTaskOverdue(Task task) {
        if (task.getDueDate() == null) {
            return false;
        }

        LocalDateTime dueDate = LocalDateTime.ofInstant(
            java.time.Instant.ofEpochMilli(task.getDueDate()),
            ZoneOffset.UTC
        );

        return LocalDateTime.now().isAfter(dueDate) && task.getActive();
    }

    private String getTaskDisplayName(String taskType) {
        switch (taskType) {
            case "APPLICATION_CLAIM":
                return "Claim Application";
            case "ACADEMIC_VERIFICATION":
                return "Academic Verification";
            case "LANGUAGE_VERIFICATION":
                return "Language Verification";
            case "DOCUMENT_VERIFICATION":
                return "Document Verification";
            default:
                return taskType;
        }
    }

    private String getTaskDescription(String taskType) {
        switch (taskType) {
            case "APPLICATION_CLAIM":
                return "Initial claim and review of application";
            case "ACADEMIC_VERIFICATION":
                return "Verify academic credentials meet requirements";
            case "LANGUAGE_VERIFICATION":
                return "Verify language proficiency requirements";
            case "DOCUMENT_VERIFICATION":
                return "Verify all required documents";
            default:
                return "Task description";
        }
    }

    private Long getTaskEstimatedDuration(String taskType) {
        switch (taskType) {
            case "APPLICATION_CLAIM":
                return 1L;
            case "ACADEMIC_VERIFICATION":
                return 3L;
            case "LANGUAGE_VERIFICATION":
                return 1L;
            case "DOCUMENT_VERIFICATION":
                return 2L;
            default:
                return 2L;
        }
    }

    private Long calculateTaskAgeInHours(Task task) {
        LocalDateTime created = LocalDateTime.ofInstant(
            java.time.Instant.ofEpochMilli(task.getCreatedAt()),
            ZoneOffset.UTC
        );

        return java.time.Duration.between(
            created,
            LocalDateTime.now()
        ).toHours();
    }

    /**
     * Determine the next task to be executed in workflow order
     * Similar to ProfileBuilderService.determineCurrentStep()
     */
    private WorkflowProgressResponseDTO.NextTaskInfo determineNextTask(
        List<Task> tasks,
        Long adminId
    ) {
        // Get tasks that can be executed by this admin
        List<Task> adminTasks = tasks
            .stream()
            .filter(task -> task.getOwnerId().equals(adminId))
            .filter(Task::getActive)
            .collect(Collectors.toList());

        if (adminTasks.isEmpty()) {
            return null;
        }

        // Find the next task based on workflow order
        Task nextTask = findNextTaskInOrder(adminTasks);

        if (nextTask == null) {
            return null;
        }

        return buildNextTaskInfo(nextTask, adminTasks);
    }

    /**
     * Find next task in proper workflow order using YAML configuration
     */
    private Task findNextTaskInOrder(List<Task> tasks) {
        if (tasks.isEmpty()) {
            return null;
        }

        // First, prioritize tasks that can be completed directly (non-APPLICATION_CLAIM)
        Optional<Task> completableTask = tasks
            .stream()
            .filter(
                task ->
                    !("APPLICATION_CLAIM".equals(task.getTaskType())) &&
                    "CREATED".equals(task.getTaskStatus()) &&
                    task.getActive()
            )
            .min((t1, t2) -> {
                // Order by stage first, then by priority
                int stageOrder =
                    getStageOrder(t1.getStage()) - getStageOrder(t2.getStage());
                if (stageOrder != 0) {
                    return stageOrder;
                }
                // Within same stage, order by priority (higher priority first)
                return Integer.compare(t2.getPriority(), t1.getPriority());
            });

        if (completableTask.isPresent()) {
            return completableTask.get();
        }

        // If no completable tasks, look for claimable APPLICATION_CLAIM tasks
        return tasks
            .stream()
            .filter(
                task ->
                    "APPLICATION_CLAIM".equals(task.getTaskType()) &&
                    "CREATED".equals(task.getTaskStatus()) &&
                    task.getActive()
            )
            .min((t1, t2) -> {
                int stageOrder =
                    getStageOrder(t1.getStage()) - getStageOrder(t2.getStage());
                if (stageOrder != 0) {
                    return stageOrder;
                }
                return Integer.compare(t2.getPriority(), t1.getPriority());
            })
            .orElse(null);
    }

    /**
     * Get stage order from configuration (should use YAML)
     */
    private int getStageOrder(String stageName) {
        switch (stageName) {
            case "APPLICATION_REVIEW":
                return 1;
            case "ACADEMIC_EVALUATION":
                return 2;
            case "DOCUMENT_VERIFICATION":
                return 3;
            case "FINAL_APPROVAL":
                return 4;
            default:
                return 999;
        }
    }

    /**
     * Build NextTaskInfo similar to ProfileBuilderService task details
     */
    private WorkflowProgressResponseDTO.NextTaskInfo buildNextTaskInfo(
        Task nextTask,
        List<Task> allTasks
    ) {
        // Determine execution order and dependencies
        String executionOrder = determineTaskExecutionOrder(nextTask, allTasks);
        boolean requiresCompletion = requiresPreviousTaskCompletion(nextTask);
        List<String> dependencies = getTaskDependencies(nextTask, allTasks);
        List<String> availableActions = determineAvailableActions(
            nextTask,
            nextTask.getOwnerId()
        );

        return WorkflowProgressResponseDTO.NextTaskInfo.builder()
            .taskId(nextTask.getTaskId())
            .taskType(nextTask.getTaskType())
            .taskDisplayName(getTaskDisplayName(nextTask.getTaskType()))
            .taskDescription(getTaskDescription(nextTask.getTaskType()))
            .status(nextTask.getTaskStatus())
            .stage(nextTask.getStage())
            .stageDisplayName(getStageDisplayName(nextTask.getStage()))
            .priority(nextTask.getPriority())
            .validationRule(nextTask.getValidationRule())
            .isClaimable("APPLICATION_CLAIM".equals(nextTask.getTaskType())) // Only APPLICATION_CLAIM tasks are claimable
            .canExecute(canExecuteTask(nextTask, allTasks))
            .availableActions(availableActions)
            .requiredFields(getTaskRequiredFields(nextTask.getTaskType()))
            .completionCriteria(
                getTaskCompletionCriteria(nextTask.getTaskType())
            )
            .estimatedDurationHours(
                Math.toIntExact(
                    getTaskEstimatedDuration(nextTask.getTaskType())
                )
            )
            .dueDate(
                nextTask.getDueDate() != null
                    ? LocalDateTime.ofInstant(
                          java.time.Instant.ofEpochMilli(nextTask.getDueDate()),
                          ZoneOffset.UTC
                      )
                    : null
            )
            .createdAt(
                LocalDateTime.ofInstant(
                    java.time.Instant.ofEpochMilli(nextTask.getCreatedAt()),
                    ZoneOffset.UTC
                )
            )
            .executionOrder(executionOrder)
            .requiresPreviousTaskCompletion(requiresCompletion)
            .dependencies(dependencies)
            .taskFormData(getTaskFormData(nextTask.getTaskType()))
            .build();
    }

    /**
     * Determine task execution order from workflow configuration
     */
    private String determineTaskExecutionOrder(Task task, List<Task> allTasks) {
        // Check if this is the first task in stage
        List<Task> stageTasks = allTasks
            .stream()
            .filter(t -> t.getStage().equals(task.getStage()))
            .collect(Collectors.toList());

        if (stageTasks.size() == 1) {
            return "ONLY";
        }

        // This should be determined from YAML configuration
        // For now, using simple logic based on stage characteristics
        return stageTasks.size() > 1 ? "PARALLEL" : "SEQUENTIAL";
    }

    /**
     * Check if previous tasks must be completed
     */
    private boolean requiresPreviousTaskCompletion(Task task) {
        // APPLICATION_CLAIM tasks don't require previous completion
        if ("APPLICATION_CLAIM".equals(task.getTaskType())) {
            return false;
        }

        // Most other tasks require stage progression
        return true;
    }

    /**
     * Get task dependencies
     */
    private List<String> getTaskDependencies(Task task, List<Task> allTasks) {
        List<String> dependencies = new ArrayList<>();

        // If this is not APPLICATION_CLAIM, it depends on APPLICATION_CLAIM completion
        if (!"APPLICATION_CLAIM".equals(task.getTaskType())) {
            allTasks
                .stream()
                .filter(t -> "APPLICATION_CLAIM".equals(t.getTaskType()))
                .filter(t -> "CLAIMED".equals(t.getTaskStatus()))
                .map(Task::getTaskId)
                .forEach(dependencies::add);
        }

        return dependencies;
    }

    /**
     * Check if task can be executed now
     */
    private boolean canExecuteTask(Task task, List<Task> allTasks) {
        // If dependencies exist, check they are completed
        List<String> dependencies = getTaskDependencies(task, allTasks);
        if (!dependencies.isEmpty()) {
            return dependencies
                .stream()
                .allMatch(depId ->
                    allTasks
                        .stream()
                        .anyMatch(
                            t ->
                                t.getTaskId().equals(depId) &&
                                ("COMPLETED".equals(t.getTaskStatus()) ||
                                    ("CLAIMED".equals(t.getTaskStatus()) &&
                                        "APPLICATION_CLAIM".equals(
                                            t.getTaskType()
                                        )))
                        )
                );
        }

        // APPLICATION_CLAIM tasks need to be claimed first
        if ("APPLICATION_CLAIM".equals(task.getTaskType())) {
            return task.getActive() && "CREATED".equals(task.getTaskStatus());
        }

        // Other tasks can be executed directly if assigned to admin and dependencies met
        return (
            task.getActive() &&
            ("CREATED".equals(task.getTaskStatus()) ||
                "CLAIMED".equals(task.getTaskStatus())) &&
            dependencies.isEmpty() // No blocking dependencies
        );
    }

    /**
     * Get required fields for task completion from workflow configuration
     * TODO: Extract from YAML validation rules
     */
    private List<String> getTaskRequiredFields(String taskType) {
        // This should come from the validation_rules section in YAML
        // For now, using basic completion notes
        return List.of("completionNotes", "verificationStatus");
    }

    /**
     * Get task completion criteria from workflow configuration
     * TODO: Extract from YAML task definitions
     */
    private List<String> getTaskCompletionCriteria(String taskType) {
        // This should come from the tasks.description in YAML
        return List.of(
            "Complete task according to validation rule: " + taskType
        );
    }

    /**
     * Get form data structure for task from workflow configuration
     * TODO: Extract from YAML validation rules and task definitions
     */
    private Map<String, Object> getTaskFormData(String taskType) {
        Map<String, Object> formData = new HashMap<>();

        // Basic form structure - should be enhanced to read from YAML
        formData.put(
            "completionNotes",
            Map.of(
                "type",
                "textarea",
                "label",
                "Completion Notes",
                "required",
                true,
                "placeholder",
                "Enter completion notes for " + getTaskDisplayName(taskType)
            )
        );

        formData.put(
            "verificationStatus",
            Map.of(
                "type",
                "select",
                "label",
                "Verification Status",
                "options",
                List.of("APPROVED", "REJECTED", "NEEDS_REVIEW"),
                "required",
                true
            )
        );

        return formData;
    }

    /**
     * Build simplified progress data similar to ProfileBuilderService
     */
    private SimpleWorkflowProgressResponseDTO.ProgressData buildSimpleProgressData(
        List<Task> tasks,
        Long adminId
    ) {
        // Get admin's tasks only
        List<Task> adminTasks = tasks
            .stream()
            .filter(task -> task.getOwnerId().equals(adminId))
            .collect(Collectors.toList());

        int total = adminTasks.size();
        int completed = calculateCompletedTasks(adminTasks);
        int percentage = total > 0 ? (completed * 100) / total : 0;

        // Determine current stage and step
        String currentStage = adminTasks
            .stream()
            .filter(Task::getActive)
            .map(Task::getStage)
            .findFirst()
            .orElse("COMPLETED");

        // Find next task
        Task nextTask = findNextTaskInOrder(
            adminTasks
                .stream()
                .filter(Task::getActive)
                .collect(Collectors.toList())
        );
        String currentStep = nextTask != null ? nextTask.getTaskType() : null;

        // Build completed and remaining steps
        List<String> completedSteps = adminTasks
            .stream()
            .filter(
                task ->
                    "COMPLETED".equals(task.getTaskStatus()) ||
                    ("CLAIMED".equals(task.getTaskStatus()) &&
                        "APPLICATION_CLAIM".equals(task.getTaskType()))
            )
            .map(Task::getTaskType)
            .collect(Collectors.toList());

        List<String> remainingSteps = adminTasks
            .stream()
            .filter(
                task ->
                    task.getActive() &&
                    ("CREATED".equals(task.getTaskStatus()) ||
                        "CLAIMED".equals(task.getTaskStatus()))
            )
            .map(Task::getTaskType)
            .collect(Collectors.toList());

        // Build next task info
        SimpleWorkflowProgressResponseDTO.ProgressData.NextTaskInfo nextTaskInfo =
            null;
        if (nextTask != null) {
            nextTaskInfo = buildSimpleNextTaskInfo(nextTask);
        }

        // Build current task info (for when there's no next task but we have active task)
        SimpleWorkflowProgressResponseDTO.ProgressData.NextTaskInfo currentTaskInfo =
            null;
        Task currentActiveTask = adminTasks
            .stream()
            .filter(Task::getActive)
            .filter(
                task ->
                    "CLAIMED".equals(task.getTaskStatus()) ||
                    "CREATED".equals(task.getTaskStatus())
            )
            .findFirst()
            .orElse(null);

        if (currentActiveTask != null) {
            currentTaskInfo = buildSimpleNextTaskInfo(currentActiveTask);
        }

        // Build complete workflow structure with all stages
        List<
            SimpleWorkflowProgressResponseDTO.ProgressData.StageInfo
        > allStages = buildAllStagesInfo(adminTasks);

        return SimpleWorkflowProgressResponseDTO.ProgressData.builder()
            .current(completed)
            .total(total)
            .percentage(percentage)
            .stage(currentStage)
            .currentStep(currentStep)
            .completedSteps(completedSteps)
            .remainingSteps(remainingSteps)
            .nextTask(nextTaskInfo)
            .currentTask(currentTaskInfo)
            .allStages(allStages)
            .build();
    }

    /**
     * Build simple next task info for execution
     */
    private SimpleWorkflowProgressResponseDTO.ProgressData.NextTaskInfo buildSimpleNextTaskInfo(
        Task task
    ) {
        List<String> actions = determineAvailableActions(
            task,
            task.getOwnerId()
        );

        // Build form fields
        List<
            SimpleWorkflowProgressResponseDTO.ProgressData.NextTaskInfo.FormData.FormField
        > formFields = new ArrayList<>();

        formFields.add(
            SimpleWorkflowProgressResponseDTO.ProgressData.NextTaskInfo.FormData.FormField.builder()
                .name("completionNotes")
                .type("textarea")
                .label("Completion Notes")
                .required(true)
                .placeholder(
                    "Enter completion notes for " +
                        getTaskDisplayName(task.getTaskType())
                )
                .build()
        );

        formFields.add(
            SimpleWorkflowProgressResponseDTO.ProgressData.NextTaskInfo.FormData.FormField.builder()
                .name("verificationStatus")
                .type("select")
                .label("Status")
                .required(true)
                .options(List.of("APPROVED", "REJECTED", "NEEDS_REVIEW"))
                .build()
        );

        SimpleWorkflowProgressResponseDTO.ProgressData.NextTaskInfo.FormData formData =
            SimpleWorkflowProgressResponseDTO.ProgressData.NextTaskInfo.FormData.builder()
                .fields(formFields)
                .build();

        // Get required profile flags for this task from workflow definition
        List<String> requiredFlags = getRequiredFlagsForTask(task);

        return SimpleWorkflowProgressResponseDTO.ProgressData.NextTaskInfo.builder()
            .taskId(task.getTaskId())
            .taskType(task.getTaskType())
            .displayName(getTaskDisplayName(task.getTaskType()))
            .description(getTaskDescription(task.getTaskType()))
            .status(task.getTaskStatus())
            .availableActions(actions)
            .canExecute(canExecuteTask(task, List.of(task)))
            .formData(formData)
            .requiredFlags(requiredFlags)
            .build();
    }

    /**
     * Extract required profile flags for a task from workflow definition
     * TODO: Implement async lookup via workflowInstanceId -> definitionKey -> workflow config
     * For now returning empty list as this requires async flow refactor
     */
    private List<String> getRequiredFlagsForTask(Task task) {
        // Placeholder - will be populated via workflow instance lookup
        // The actual flags are checked in TaskCompletionValidationService
        // This is just for UI display purposes
        return new ArrayList<>();
    }

    /**
     * Build complete workflow structure with all stages and their nested tasks
     */
    private List<
        SimpleWorkflowProgressResponseDTO.ProgressData.StageInfo
    > buildAllStagesInfo(List<Task> adminTasks) {
        if (adminTasks.isEmpty()) {
            return new ArrayList<>();
        }

        // Group admin tasks by stage for lookup
        Map<String, List<Task>> tasksByStage = adminTasks
            .stream()
            .collect(Collectors.groupingBy(Task::getStage));

        List<
            SimpleWorkflowProgressResponseDTO.ProgressData.StageInfo
        > allStages = new ArrayList<>();

        // Stage 1: ACADEMIC_EVALUATION
        List<Task> stage1Tasks = tasksByStage.getOrDefault(
            "ACADEMIC_EVALUATION",
            new ArrayList<>()
        );
        String stage1Status = determineStageStatusFromTasks(stage1Tasks);

        List<
            SimpleWorkflowProgressResponseDTO.ProgressData.TaskInfo
        > stage1TaskInfos = new ArrayList<>();
        stage1TaskInfos.add(
            SimpleWorkflowProgressResponseDTO.ProgressData.TaskInfo.builder()
                .taskType("APPLICATION_CLAIM")
                .displayName("Application Claim")
                .description("Claim application for processing")
                .status(
                    determineTaskStatusFromAdminTasks(
                        stage1Tasks,
                        "APPLICATION_CLAIM"
                    )
                )
                .build()
        );
        stage1TaskInfos.add(
            SimpleWorkflowProgressResponseDTO.ProgressData.TaskInfo.builder()
                .taskType("ACADEMIC_VERIFICATION")
                .displayName("Academic Verification")
                .description("Verify academic credentials meet requirements")
                .status(
                    determineTaskStatusFromAdminTasks(
                        stage1Tasks,
                        "ACADEMIC_VERIFICATION"
                    )
                )
                .build()
        );
        stage1TaskInfos.add(
            SimpleWorkflowProgressResponseDTO.ProgressData.TaskInfo.builder()
                .taskType("LANGUAGE_VERIFICATION")
                .displayName("Language Verification")
                .description("Verify language proficiency requirements")
                .status(
                    determineTaskStatusFromAdminTasks(
                        stage1Tasks,
                        "LANGUAGE_VERIFICATION"
                    )
                )
                .build()
        );

        allStages.add(
            SimpleWorkflowProgressResponseDTO.ProgressData.StageInfo.builder()
                .stageName("ACADEMIC_EVALUATION")
                .displayName("Academic Evaluation")
                .order(1)
                .status(stage1Status)
                .tasks(stage1TaskInfos)
                .build()
        );

        // Stage 2: CERTIFICATION_PROCESS
        List<Task> stage2Tasks = tasksByStage.getOrDefault(
            "CERTIFICATION_PROCESS",
            new ArrayList<>()
        );
        String stage2Status = determineStageStatusFromTasks(stage2Tasks);

        List<
            SimpleWorkflowProgressResponseDTO.ProgressData.TaskInfo
        > stage2TaskInfos = new ArrayList<>();
        stage2TaskInfos.add(
            SimpleWorkflowProgressResponseDTO.ProgressData.TaskInfo.builder()
                .taskType("CERTIFICATION_PROCESSING")
                .displayName("Certification Processing")
                .description(
                    "Process certification requirements and documentation"
                )
                .status(
                    determineTaskStatusFromAdminTasks(
                        stage2Tasks,
                        "CERTIFICATION_PROCESSING"
                    )
                )
                .build()
        );
        stage2TaskInfos.add(
            SimpleWorkflowProgressResponseDTO.ProgressData.TaskInfo.builder()
                .taskType("CERTIFICATE_ISSUANCE")
                .displayName("Certificate Issuance")
                .description("Issue official certificate of completion")
                .status(
                    determineTaskStatusFromAdminTasks(
                        stage2Tasks,
                        "CERTIFICATE_ISSUANCE"
                    )
                )
                .build()
        );

        allStages.add(
            SimpleWorkflowProgressResponseDTO.ProgressData.StageInfo.builder()
                .stageName("CERTIFICATION_PROCESS")
                .displayName("Certification Process")
                .order(2)
                .status(stage2Status)
                .tasks(stage2TaskInfos)
                .build()
        );

        // Stage 3: FINAL_APPROVAL
        List<Task> stage3Tasks = tasksByStage.getOrDefault(
            "FINAL_APPROVAL",
            new ArrayList<>()
        );
        String stage3Status = determineStageStatusFromTasks(stage3Tasks);

        List<
            SimpleWorkflowProgressResponseDTO.ProgressData.TaskInfo
        > stage3TaskInfos = new ArrayList<>();
        stage3TaskInfos.add(
            SimpleWorkflowProgressResponseDTO.ProgressData.TaskInfo.builder()
                .taskType("FINAL_VERIFICATION")
                .displayName("Final Verification")
                .description(
                    "Final verification and approval of all requirements"
                )
                .status(
                    determineTaskStatusFromAdminTasks(
                        stage3Tasks,
                        "FINAL_VERIFICATION"
                    )
                )
                .build()
        );

        allStages.add(
            SimpleWorkflowProgressResponseDTO.ProgressData.StageInfo.builder()
                .stageName("FINAL_APPROVAL")
                .displayName("Final Approval")
                .order(3)
                .status(stage3Status)
                .tasks(stage3TaskInfos)
                .build()
        );

        return allStages;
    }

    /**
     * Determine stage status based on tasks in that stage
     */
    private String determineStageStatusFromTasks(List<Task> stageTasks) {
        if (stageTasks.isEmpty()) {
            return "PENDING";
        }

        boolean hasCompleted = stageTasks
            .stream()
            .anyMatch(task -> "COMPLETED".equals(task.getTaskStatus()));
        boolean hasActive = stageTasks
            .stream()
            .anyMatch(
                task ->
                    task.getActive() &&
                    ("CLAIMED".equals(task.getTaskStatus()) ||
                        "CREATED".equals(task.getTaskStatus()))
            );

        if (hasCompleted && !hasActive) {
            return "COMPLETED";
        } else if (hasActive || hasCompleted) {
            return "IN_PROGRESS";
        } else {
            return "PENDING";
        }
    }

    /**
     * Determine individual task status from admin's tasks
     */
    private String determineTaskStatusFromAdminTasks(
        List<Task> stageTasks,
        String taskType
    ) {
        Optional<Task> matchingTask = stageTasks
            .stream()
            .filter(task -> taskType.equals(task.getTaskType()))
            .findFirst();

        if (matchingTask.isPresent()) {
            Task task = matchingTask.get();
            if ("COMPLETED".equals(task.getTaskStatus())) {
                return "COMPLETED";
            } else if (
                task.getActive() &&
                ("CLAIMED".equals(task.getTaskStatus()) ||
                    "CREATED".equals(task.getTaskStatus()))
            ) {
                return "ACTIVE";
            }
        }

        return "PENDING";
    }
}
