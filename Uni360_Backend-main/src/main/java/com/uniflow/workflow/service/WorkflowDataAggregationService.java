package com.uniflow.workflow.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.application.repository.ApplicationRepository;
import com.uniflow.workflow.entity.Task;
import com.uniflow.workflow.entity.WorkflowDefinition;
import com.uniflow.workflow.entity.WorkflowInstance;
import com.uniflow.workflow.repository.TaskRepository;
import com.uniflow.workflow.repository.WorkflowDefinitionRepository;
import com.uniflow.workflow.repository.WorkflowInstanceRepository;
import java.util.*;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * WorkflowDataAggregationService - Centralized service for workflow data aggregation
 *
 * <p>This service aggregates data from workflow_definitions, workflow_instances, and tasks tables
 * to provide accurate progress tracking and stage information for both student and admin APIs.
 *
 * <p>Key Features:
 * - Load workflow definition from database by application ID
 * - Calculate progress metrics from actual task completion
 * - Map task stages to workflow definition stages
 * - Extract stage and task information from workflow configuration JSONB
 * - Fully reactive with Mono.zip() for parallel queries
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2025-01-14
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowDataAggregationService {

    private final WorkflowDefinitionRepository workflowDefinitionRepository;
    private final WorkflowInstanceRepository workflowInstanceRepository;
    private final TaskRepository taskRepository;
    private final ApplicationRepository applicationRepository;
    private final ObjectMapper objectMapper;

    /**
     * Get workflow definition by application ID
     * Follows the chain: Application -> WorkflowInstance -> WorkflowDefinition
     *
     * @param applicationId Application UUID as string
     * @return Mono of WorkflowDefinition
     */
    public Mono<WorkflowDefinition> getWorkflowDefinitionByApplicationId(
        String applicationId
    ) {
        log.debug(
            "Loading workflow definition for application: {}",
            applicationId
        );

        return workflowInstanceRepository
            .findByApplicationId(applicationId)
            .next()
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "No workflow instance found for application: " +
                            applicationId
                    )
                )
            )
            .flatMap(instance ->
                workflowDefinitionRepository.findByDefinitionKey(
                    instance.getWorkflowDefinitionKey()
                )
            )
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "No workflow definition found for application: " +
                            applicationId
                    )
                )
            )
            .doOnSuccess(def ->
                log.debug(
                    "Loaded workflow definition: {} for application: {}",
                    def.getDefinitionKey(),
                    applicationId
                )
            );
    }

    /**
     * Get workflow instance by application ID
     *
     * @param applicationId Application UUID as string
     * @return Mono of WorkflowInstance
     */
    public Mono<WorkflowInstance> getWorkflowInstanceByApplicationId(
        String applicationId
    ) {
        log.debug(
            "Loading workflow instance for application: {}",
            applicationId
        );

        return workflowInstanceRepository
            .findByApplicationId(applicationId)
            .next()
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "No workflow instance found for application: " +
                            applicationId
                    )
                )
            )
            .doOnSuccess(instance ->
                log.debug(
                    "Loaded workflow instance: {} for application: {}",
                    instance.getInstanceId(),
                    applicationId
                )
            );
    }

    /**
     * Get all tasks for application
     *
     * @param applicationId Application UUID as string
     * @return Flux of Tasks
     */
    public Flux<Task> getTasksByApplicationId(String applicationId) {
        log.debug("Loading tasks for application: {}", applicationId);

        return taskRepository
            .findByApplicationIdOrderByCreatedAtAsc(applicationId)
            .doOnComplete(() ->
                log.debug("Loaded tasks for application: {}", applicationId)
            );
    }

    /**
     * Calculate progress metrics from tasks and workflow definition
     *
     * @param workflowDef Workflow definition with configuration
     * @param tasks List of all tasks for the application
     * @return Mono of ProgressMetrics
     */
    public Mono<ProgressMetrics> calculateProgressMetrics(
        WorkflowDefinition workflowDef,
        List<Task> tasks
    ) {
        return Mono.fromCallable(() -> {
            log.debug(
                "Calculating progress metrics for workflow: {}",
                workflowDef.getDefinitionKey()
            );

            if (tasks == null || tasks.isEmpty()) {
                log.warn("No tasks found, returning zero progress");
                return ProgressMetrics.builder()
                    .completedTasks(0)
                    .totalTasks(
                        getTotalTasksCount(workflowDef.getWorkflowConfig())
                    )
                    .completionPercentage(0)
                    .currentStage("NOT_STARTED")
                    .currentStageName("Not Started")
                    .currentTaskType(null)
                    .completedTaskTypes(Collections.emptyList())
                    .remainingTaskTypes(
                        getAllTaskTypes(workflowDef.getWorkflowConfig())
                    )
                    .build();
            }

            // Get counts
            int completedTasks = getCompletedTasksCount(tasks);
            int totalTasks = getTotalTasksCount(
                workflowDef.getWorkflowConfig()
            );
            int completionPercentage = totalTasks > 0
                ? (completedTasks * 100) / totalTasks
                : 0;

            // Get current active task
            Task currentTask = getCurrentActiveTask(tasks);

            // Get current stage - prioritize active task, fallback to last active/completed stage
            String currentStage;
            if (currentTask != null) {
                currentStage = currentTask.getStage();
                log.debug("Current stage from active task: {}", currentStage);
            } else {
                // If no active task, get the stage of the most recent task (active or completed)
                currentStage = tasks
                    .stream()
                    .sorted((t1, t2) ->
                        Long.compare(t2.getCreatedAt(), t1.getCreatedAt())
                    )
                    .map(Task::getStage)
                    .findFirst()
                    .orElse("NOT_STARTED");
                log.debug("Current stage from latest task: {}", currentStage);
            }

            String currentStageName = getStagDisplayName(
                currentStage,
                workflowDef.getWorkflowConfig()
            );

            String currentTaskType = currentTask != null
                ? currentTask.getTaskType()
                : null;

            // Get completed and remaining task types
            List<String> completedTaskTypes = tasks
                .stream()
                .filter(t -> {
                    boolean isCompleted =
                        "COMPLETED".equals(t.getTaskStatus()) ||
                        (Boolean.FALSE.equals(t.getActive()) &&
                            t.getCompletedAt() != null) ||
                        // APPLICATION_CLAIM tasks are considered completed when claimed
                        ("CLAIMED".equals(t.getTaskStatus()) &&
                            "APPLICATION_CLAIM".equals(t.getTaskType()));
                    if (isCompleted) {
                        log.trace(
                            "Task {} ({}) marked as completed",
                            t.getTaskType(),
                            t.getTaskStatus()
                        );
                    }
                    return isCompleted;
                })
                .map(Task::getTaskType)
                .distinct()
                .collect(Collectors.toList());

            log.debug("Completed task types: {}", completedTaskTypes);

            List<String> allTaskTypes = getAllTaskTypes(
                workflowDef.getWorkflowConfig()
            );
            List<String> remainingTaskTypes = allTaskTypes
                .stream()
                .filter(tt -> !completedTaskTypes.contains(tt))
                .collect(Collectors.toList());

            ProgressMetrics metrics = ProgressMetrics.builder()
                .completedTasks(completedTasks)
                .totalTasks(totalTasks)
                .completionPercentage(completionPercentage)
                .currentStage(currentStage)
                .currentStageName(currentStageName)
                .currentTaskType(currentTaskType)
                .completedTaskTypes(completedTaskTypes)
                .remainingTaskTypes(remainingTaskTypes)
                .build();

            log.debug(
                "Progress metrics calculated: {}% ({}/{} tasks)",
                completionPercentage,
                completedTasks,
                totalTasks
            );

            return metrics;
        });
    }

    /**
     * Get current active task from task list
     *
     * @param tasks List of tasks
     * @return Current active task or null
     */
    public Task getCurrentActiveTask(List<Task> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return null;
        }

        return tasks
            .stream()
            .filter(
                t ->
                    Boolean.TRUE.equals(t.getActive()) &&
                    ("CREATED".equals(t.getTaskStatus()) ||
                        "CLAIMED".equals(t.getTaskStatus()))
            )
            .findFirst()
            .orElse(null);
    }

    /**
     * Get completed tasks count
     *
     * @param tasks List of tasks
     * @return Count of completed tasks
     */
    public Integer getCompletedTasksCount(List<Task> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return 0;
        }

        int completedCount = (int) tasks
            .stream()
            .filter(
                t ->
                    "COMPLETED".equals(t.getTaskStatus()) ||
                    (Boolean.FALSE.equals(t.getActive()) &&
                        t.getCompletedAt() != null) ||
                    // APPLICATION_CLAIM tasks are considered completed when claimed
                    ("CLAIMED".equals(t.getTaskStatus()) &&
                        "APPLICATION_CLAIM".equals(t.getTaskType()))
            )
            .count();

        log.debug(
            "Completed tasks count: {} out of {}",
            completedCount,
            tasks.size()
        );
        return completedCount;
    }

    /**
     * Get total tasks count from workflow definition configuration
     *
     * @param workflowConfig Workflow configuration JSONB
     * @return Total tasks count
     */
    public Integer getTotalTasksCount(JsonNode workflowConfig) {
        if (workflowConfig == null || !workflowConfig.has("stages")) {
            log.warn("No stages found in workflow config");
            return 0;
        }

        int totalTasks = 0;
        JsonNode stages = workflowConfig.get("stages");

        if (stages.isArray()) {
            for (JsonNode stage : stages) {
                if (stage.has("tasks") && stage.get("tasks").isArray()) {
                    totalTasks += stage.get("tasks").size();
                }
            }
        }

        log.debug("Total tasks count from workflow config: {}", totalTasks);
        return totalTasks;
    }

    /**
     * Get all stages from workflow definition
     *
     * @param workflowConfig Workflow configuration JSONB
     * @return List of StageInfo
     */
    public List<StageInfo> getAllStages(JsonNode workflowConfig) {
        List<StageInfo> stageInfoList = new ArrayList<>();

        if (workflowConfig == null || !workflowConfig.has("stages")) {
            log.warn("No stages found in workflow config");
            return stageInfoList;
        }

        JsonNode stages = workflowConfig.get("stages");

        if (stages.isArray()) {
            for (JsonNode stage : stages) {
                String stageName = stage.has("name")
                    ? stage.get("name").asText()
                    : "UNKNOWN";
                String displayName = stage.has("displayName")
                    ? stage.get("displayName").asText()
                    : stageName;
                Integer order = stage.has("order")
                    ? stage.get("order").asInt()
                    : 0;
                String description = stage.has("description")
                    ? stage.get("description").asText()
                    : "";

                // Get tasks for this stage
                List<TaskInfo> taskInfoList = new ArrayList<>();
                if (stage.has("tasks") && stage.get("tasks").isArray()) {
                    JsonNode tasks = stage.get("tasks");
                    for (JsonNode task : tasks) {
                        String taskType = task.has("type")
                            ? task.get("type").asText()
                            : "UNKNOWN";
                        String taskDisplayName = task.has("displayName")
                            ? task.get("displayName").asText()
                            : taskType;
                        String taskDescription = task.has("description")
                            ? task.get("description").asText()
                            : "";

                        taskInfoList.add(
                            TaskInfo.builder()
                                .taskType(taskType)
                                .displayName(taskDisplayName)
                                .description(taskDescription)
                                .build()
                        );
                    }
                }

                stageInfoList.add(
                    StageInfo.builder()
                        .stageName(stageName)
                        .displayName(displayName)
                        .order(order)
                        .description(description)
                        .tasks(taskInfoList)
                        .build()
                );
            }
        }

        log.debug(
            "Extracted {} stages from workflow config",
            stageInfoList.size()
        );
        return stageInfoList;
    }

    /**
     * Get stage display name from workflow config
     *
     * @param stageName Stage name to look up
     * @param workflowConfig Workflow configuration JSONB
     * @return Display name or stage name if not found
     */
    public String getStagDisplayName(
        String stageName,
        JsonNode workflowConfig
    ) {
        if (stageName == null || workflowConfig == null) {
            return stageName;
        }

        if (!workflowConfig.has("stages")) {
            return stageName;
        }

        JsonNode stages = workflowConfig.get("stages");

        if (stages.isArray()) {
            for (JsonNode stage : stages) {
                if (
                    stage.has("name") &&
                    stage.get("name").asText().equals(stageName)
                ) {
                    if (stage.has("displayName")) {
                        return stage.get("displayName").asText();
                    }
                }
            }
        }

        return stageName;
    }

    /**
     * Get all task types from workflow configuration
     *
     * @param workflowConfig Workflow configuration JSONB
     * @return List of all task types
     */
    private List<String> getAllTaskTypes(JsonNode workflowConfig) {
        List<String> taskTypes = new ArrayList<>();

        if (workflowConfig == null || !workflowConfig.has("stages")) {
            return taskTypes;
        }

        JsonNode stages = workflowConfig.get("stages");

        if (stages.isArray()) {
            for (JsonNode stage : stages) {
                if (stage.has("tasks") && stage.get("tasks").isArray()) {
                    JsonNode tasks = stage.get("tasks");
                    for (JsonNode task : tasks) {
                        if (task.has("type")) {
                            taskTypes.add(task.get("type").asText());
                        }
                    }
                }
            }
        }

        return taskTypes;
    }

    /**
     * Get the last completed stage from tasks
     *
     * @param tasks List of tasks
     * @return Last completed stage name
     */
    private String getLastCompletedStage(List<Task> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return "NOT_STARTED";
        }

        String lastStage = tasks
            .stream()
            .filter(
                t ->
                    "COMPLETED".equals(t.getTaskStatus()) ||
                    (Boolean.FALSE.equals(t.getActive()) &&
                        t.getCompletedAt() != null) ||
                    // APPLICATION_CLAIM tasks are considered completed when claimed
                    ("CLAIMED".equals(t.getTaskStatus()) &&
                        "APPLICATION_CLAIM".equals(t.getTaskType()))
            )
            .sorted((t1, t2) -> {
                Long c1 = t1.getCompletedAt() != null
                    ? t1.getCompletedAt()
                    : t1.getCreatedAt();
                Long c2 = t2.getCompletedAt() != null
                    ? t2.getCompletedAt()
                    : t2.getCreatedAt();
                return Long.compare(c2, c1); // Most recent first
            })
            .map(Task::getStage)
            .findFirst()
            .orElse("NOT_STARTED");

        log.debug("Last completed stage: {}", lastStage);
        return lastStage;
    }

    /**
     * Progress Metrics DTO
     * Contains calculated progress information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProgressMetrics {

        private Integer completedTasks;
        private Integer totalTasks;
        private Integer completionPercentage;
        private String currentStage;
        private String currentStageName;
        private String currentTaskType;
        private List<String> completedTaskTypes;
        private List<String> remainingTaskTypes;
    }

    /**
     * Stage Information DTO
     * Contains stage metadata and tasks
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StageInfo {

        private String stageName;
        private String displayName;
        private Integer order;
        private String description;
        private List<TaskInfo> tasks;
    }

    /**
     * Task Information DTO
     * Contains task metadata
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskInfo {

        private String taskType;
        private String displayName;
        private String description;
    }
}
