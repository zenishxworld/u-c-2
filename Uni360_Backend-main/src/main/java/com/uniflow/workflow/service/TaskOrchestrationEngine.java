package com.uniflow.workflow.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.admin.repository.AdminProfileRepository;
import com.uniflow.application.repository.ApplicationRepository;
import com.uniflow.notification.service.WorkflowNotificationService;
import com.uniflow.shared.util.CountryCodeUtils;
import com.uniflow.student.repository.StudentProfileRepository;
import com.uniflow.workflow.entity.Task;
import com.uniflow.workflow.entity.WorkflowDefinition;
import com.uniflow.workflow.entity.WorkflowInstance;
import com.uniflow.workflow.exception.TaskValidationException;
import com.uniflow.workflow.repository.TaskRepository;
import com.uniflow.workflow.repository.WorkflowDefinitionRepository;
import com.uniflow.workflow.repository.WorkflowInstanceRepository;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * PHASE 21-22 Task Orchestration Engine
 *
 * Implements multi-owner task creation logic as specified in PHASE 21-22 design:
 * - Create tasks for ALL eligible admins
 * - First admin to claim deactivates other tasks
 * - Uses new enhanced Task entity schema
 * - YAML-driven workflow configuration
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TaskOrchestrationEngine {

    private final TaskRepository taskRepository;
    private final AdminProfileRepository adminProfileRepository;
    private final WorkflowDefinitionRepository workflowDefinitionRepository;
    private final WorkflowInstanceRepository workflowInstanceRepository;
    private final WorkflowNotificationService workflowNotificationService;
    private final StudentProfileRepository studentProfileRepository;
    private final ApplicationRepository applicationRepository;
    private final TaskCompletionValidationService validationService;
    private final ObjectMapper objectMapper;

    /**
     * Initialize workflow for application and create tasks for all eligible admins
     *
     * @param applicationId Application UUID
     * @param countryCode Country code (e.g., "DE")
     * @param degreeLevel Degree level (e.g., "BACHELOR")
     * @return Workflow instance ID
     */
    @Transactional
    public Mono<String> initializeWorkflowForApplication(
        String applicationId,
        String countryCode,
        String degreeLevel
    ) {
        log.info("🚀 Initializing workflow for application: {}", applicationId);

        // Validate country code - no defaults
        if (countryCode == null || countryCode.trim().isEmpty()) {
            log.error(
                "❌ Country code is required but was null or blank for application: {}",
                applicationId
            );
            return Mono.error(
                new IllegalArgumentException(
                    "Country code is required for workflow initialization. Application: " +
                        applicationId
                )
            );
        }

        // Validate degree level - no defaults
        if (degreeLevel == null || degreeLevel.trim().isEmpty()) {
            log.error(
                "❌ Degree level is required but was null or blank for application: {}",
                applicationId
            );
            return Mono.error(
                new IllegalArgumentException(
                    "Degree level is required for workflow initialization. Application: " +
                        applicationId
                )
            );
        }

        String effectiveCountryCode = CountryCodeUtils.validateCountryCode(
            countryCode
        );
        String effectiveDegreeLevel = CountryCodeUtils.validateDegreeLevel(
            degreeLevel
        );

        log.info(
            "Using country code: {}, degree level: {} for application: {}",
            effectiveCountryCode,
            effectiveDegreeLevel,
            applicationId
        );

        String workflowDefinitionKey = determineWorkflowDefinitionKey(
            effectiveCountryCode,
            degreeLevel
        );
        String workflowInstanceId = UUID.randomUUID().toString();

        return createWorkflowInstance(
            applicationId,
            workflowDefinitionKey,
            workflowInstanceId
        )
            .then(
                createInitialTasksForAllEligibleAdmins(
                    applicationId,
                    workflowInstanceId,
                    effectiveCountryCode,
                    effectiveDegreeLevel
                )
            )
            .thenReturn(workflowInstanceId);
    }

    /**
     * Initialize workflow for application using client-based workflow definition
     *
     * @param applicationId The application ID
     * @param workflowDefinitionId The ID of the workflow definition to use
     * @param workflowConfig The workflow configuration from the definition
     * @return Mono containing the workflow instance ID
     */
    @Transactional
    public Mono<String> initializeWorkflowForApplicationWithDefinition(
        String applicationId,
        Long workflowDefinitionId,
        String workflowConfig
    ) {
        log.info(
            "🚀 Initializing client-based workflow for application: {} using definition: {}",
            applicationId,
            workflowDefinitionId
        );

        String workflowInstanceId = UUID.randomUUID().toString();

        return createWorkflowInstanceFromDefinition(
            applicationId,
            workflowDefinitionId,
            workflowInstanceId,
            workflowConfig
        )
            .then(
                createInitialTasksFromWorkflowDefinition(
                    applicationId,
                    workflowInstanceId,
                    workflowConfig
                )
            )
            .thenReturn(workflowInstanceId);
    }

    /**
     * Create initial tasks for eligible admins.
     * If the student already has an assigned admin from a previous application,
     * the new task is routed exclusively to that admin (locked routing).
     * Otherwise, tasks are created for ALL eligible admins so any can claim.
     */
    private Mono<Void> createInitialTasksForAllEligibleAdmins(
        String applicationId,
        String workflowInstanceId,
        String countryCode,
        String degreeLevel
    ) {
        // Look up the student for this application
        return applicationRepository
            .findById(UUID.fromString(applicationId))
            .flatMap(application -> {
                Long studentId = application.getStudentId();
                if (studentId == null) {
                    log.warn("Application {} has no studentId — falling back to eligible admins", applicationId);
                    return createTasksForAllEligibleAdmins(applicationId, workflowInstanceId, countryCode, degreeLevel);
                }

                // Check if this student already has an assigned admin
                // from a DIFFERENT (prior) application — exclude the current one
                return applicationRepository
                    .findLatestAssignedApplicationForStudent(studentId, applicationId)
                    .map(app -> app.getAssignedAdminId())
                    .<Boolean>flatMap(existingAdminId -> {
                        log.info(
                            "Student {} already assigned to admin {} — routing new task exclusively to that admin",
                            studentId, existingAdminId
                        );
                        // Create task only for the admin already assigned to this student.
                        // thenReturn emits a real value so switchIfEmpty below does NOT fire.
                        return createTaskForOwner(
                            "APPLICATION_CLAIM",
                            applicationId,
                            workflowInstanceId,
                            existingAdminId,
                            "APPLICATION_REVIEW",
                            countryCode
                        ).thenReturn(Boolean.TRUE);
                    })
                    .switchIfEmpty(
                        // No prior admin — broadcast to all eligible admins
                        createTasksForAllEligibleAdmins(applicationId, workflowInstanceId, countryCode, degreeLevel)
                            .thenReturn(Boolean.FALSE)
                    )
                    .then(); // Collapse Mono<Boolean> back to Mono<Void>
            })
            .switchIfEmpty(
                Mono.error(new RuntimeException("Application not found: " + applicationId))
            )
            .doOnSuccess(v ->
                log.info("✅ Created initial tasks for application: {}", applicationId)
            );
    }

    /**
     * Broadcast APPLICATION_CLAIM tasks to ALL eligible admins (used when student has no prior assignment).
     */
    private Mono<Void> createTasksForAllEligibleAdmins(
        String applicationId,
        String workflowInstanceId,
        String countryCode,
        String degreeLevel
    ) {
        return getEligibleAdminsForApplication(countryCode, degreeLevel)
            .flatMap(adminId ->
                createTaskForOwner(
                    "APPLICATION_CLAIM",
                    applicationId,
                    workflowInstanceId,
                    adminId,
                    "APPLICATION_REVIEW",
                    countryCode
                )
            )
            .then()
            .doOnSuccess(v ->
                log.info(
                    "✅ Created tasks for all eligible admins for application: {}",
                    applicationId
                )
            );
    }

    /**
     * Get eligible admins for a specific application based on country and degree level
     */
    private Flux<Long> getEligibleAdminsForApplication(
        String countryCode,
        String degreeLevel
    ) {
        log.info(
            "🔍 Searching for eligible admins - Country: {}, Degree: {}",
            countryCode,
            degreeLevel
        );

        return adminProfileRepository
            .findByCountryAndDegreeLevel(countryCode, degreeLevel)
            .doOnNext(adminProfile ->
                log.info(
                    "✅ Found eligible admin - UserID: {}, Username: {}, Countries: {}, Specializations: {}",
                    adminProfile.getUserId(),
                    adminProfile.getUsername(),
                    adminProfile.getSpecializationCountries(),
                    adminProfile.getSpecialization()
                )
            )
            .map(adminProfile -> Long.parseLong(adminProfile.getUserId()))
            .doOnComplete(() ->
                log.info(
                    "✅ Completed admin search for country: {}, degree: {}",
                    countryCode,
                    degreeLevel
                )
            );
    }

    /**
     * Create a task for a specific owner (admin)
     */
    private Mono<Task> createTaskForOwner(
        String taskType,
        String applicationId,
        String workflowInstanceId,
        Long ownerId,
        String stage,
        String countryCode
    ) {
        long now = System.currentTimeMillis();

        // Determine task status based on task type
        // Claim tasks need to be claimed first, assigned tasks are directly actionable
        String taskStatus = isClaimTask(taskType) ? "CREATED" : "CLAIMED";

        Task task = Task.builder()
            .taskId(UUID.randomUUID().toString())
            .applicationId(applicationId)
            .workflowInstanceId(workflowInstanceId)
            .taskType(taskType)
            .taskStatus(taskStatus)
            .priority(2)
            .dueDate(now + (24 * 60 * 60 * 1000L)) // 24 hours from now
            .createdAt(now)
            .updatedAt(now)
            .ownerId(ownerId)
            .stage(stage)
            .validationRule("ADMIN_CONFIRMATION")
            .active(true)
            .claimedBy(isClaimTask(taskType) ? null : ownerId) // Auto-claim assigned tasks
            .claimedAt(isClaimTask(taskType) ? null : now)
            .build();

        return taskRepository
            .save(task)
            .doOnSuccess(savedTask ->
                log.info(
                    "✅ Created {} task: {} for owner: {} in stage: {}",
                    taskStatus,
                    savedTask.getTaskId(),
                    ownerId,
                    stage
                )
            );
    }

    /**
     * Determine if a task type requires claiming (competitive) or is directly assigned
     */
    private boolean isClaimTask(String taskType) {
        return "APPLICATION_CLAIM".equals(taskType);
    }

    /**
     * Claim task (first admin to claim wins, others are deactivated)
     */
    @Transactional
    public Mono<Task> claimTask(String taskId, Long adminId) {
        return taskRepository
            .findByTaskId(taskId)
            .switchIfEmpty(
                Mono.error(new RuntimeException("Task not found: " + taskId))
            )
            .flatMap(task -> {
                if (!task.isClaimableBy(adminId)) {
                    return Mono.error(
                        new RuntimeException(
                            "Task not claimable by admin: " + adminId
                        )
                    );
                }

                // Claim the task
                task.claim(adminId);

                return taskRepository
                    .save(task)
                    .flatMap(claimedTask ->
                        // Update application assigned_admin_id for APPLICATION_CLAIM tasks
                        ("APPLICATION_CLAIM".equals(claimedTask.getTaskType())
                            ? updateApplicationAssignedAdmin(
                                  claimedTask.getApplicationId(),
                                  adminId
                              )
                            : Mono.empty()
                        ).then(
                            // Deactivate other tasks of same type for same application
                            deactivateOtherTasksAfterClaim(claimedTask)
                                .then(
                                    // For APPLICATION_CLAIM tasks, create next stage tasks immediately
                                    "APPLICATION_CLAIM".equals(
                                        claimedTask.getTaskType()
                                    )
                                        ? createNextStageTasksAfterClaim(
                                              claimedTask
                                          )
                                        : Mono.empty()
                                )
                                .thenReturn(claimedTask)
                        )
                    );
            })
            .flatMap(claimedTask -> {
                // Send notification for task claim
                return sendTaskClaimNotification(
                    claimedTask,
                    adminId
                ).thenReturn(claimedTask);
            })
            .doOnSuccess(task ->
                log.info("✅ Task {} claimed by admin {}", taskId, adminId)
            );
    }

    /**
     * Update application assigned_admin_id when APPLICATION_CLAIM task is claimed.
     * Also locks ALL other unclaimed applications from the same student to this admin
     * (race-condition fix: student may have submitted multiple apps before anyone claims).
     */
    private Mono<Void> updateApplicationAssignedAdmin(
        String applicationId,
        Long adminId
    ) {
        log.info(
            "Updating application {} assigned_admin_id to {}",
            applicationId,
            adminId
        );

        return applicationRepository
            .findById(UUID.fromString(applicationId))
            .flatMap(application -> {
                application.setAssignedAdminId(adminId);
                application.setUpdatedAt(LocalDateTime.now());
                application.setUpdatedBy(adminId.toString());
                // Update workflow stage to reflect claim is done
                application.setWorkflowStage("APPLICATION_REVIEW");
                application.setStatus("UNDER_REVIEW");
                // Reset completion to 0 — tasks are still pending
                application.setCompletionPercentage(0);

                return applicationRepository.save(application)
                    .flatMap(saved -> {
                        Long studentId = saved.getStudentId();
                        if (studentId == null) {
                            log.warn("Application {} has no studentId — skipping bulk assignment", applicationId);
                            return Mono.just(saved);
                        }
                        // Lock all other unclaimed apps from this student to the same admin
                        return applicationRepository
                            .updateAssignedAdminForUnclaimedStudentApplications(studentId, adminId)
                            .doOnSuccess(updated ->
                                log.info(
                                    "Locked {} additional unclaimed apps from student {} to admin {}",
                                    updated, studentId, adminId
                                )
                            )
                            .thenReturn(saved);
                    });
            })
            .doOnSuccess(saved ->
                log.info(
                    "Application {} and all sibling apps assigned to admin {}",
                    applicationId,
                    adminId
                )
            )
            .doOnError(error ->
                log.error(
                    "Failed to update application {} assigned admin: {}",
                    applicationId,
                    error.getMessage()
                )
            )
            .then();
    }

    /**
     * Deactivate other tasks of same type after one is claimed
     */
    private Mono<Void> deactivateOtherTasksAfterClaim(Task claimedTask) {
        return taskRepository
            .deactivateTasksByApplicationAndType(
                claimedTask.getApplicationId(),
                claimedTask.getTaskType(),
                claimedTask.getTaskId(),
                System.currentTimeMillis()
            )
            .doOnSuccess(count ->
                log.info("✅ Deactivated {} other tasks after claim", count)
            )
            .then();
    }

    /**
     * Create next stage tasks after claiming APPLICATION_CLAIM task
     */
    private Mono<Void> createNextStageTasksAfterClaim(Task claimedTask) {
        // First get the workflow instance to find the correct workflow definition key
        return workflowInstanceRepository
            .findByInstanceId(claimedTask.getWorkflowInstanceId())
            .flatMap(workflowInstance ->
                workflowDefinitionRepository
                    .findByDefinitionKeyOrderByVersionDesc(
                        workflowInstance.getWorkflowDefinitionKey()
                    )
                    .next()
                    .switchIfEmpty(
                        Mono.error(
                            new RuntimeException(
                                "Workflow definition not found"
                            )
                        )
                    )
            )
            .flatMap(workflowDef -> {
                try {
                    JsonNode config = workflowDef.getConfiguration();
                    log.debug(
                        "Found workflow configuration: {}",
                        config != null ? "present" : "null"
                    );

                    if (config == null) {
                        log.warn(
                            "Workflow configuration is null, skipping next stage task creation"
                        );
                        return Mono.empty();
                    }

                    JsonNode stages = config.get("stages");
                    log.debug(
                        "Found stages configuration: {}",
                        stages != null ? "present" : "null"
                    );

                    if (stages == null) {
                        log.warn(
                            "Stages configuration is null, skipping next stage task creation"
                        );
                        return Mono.empty();
                    }

                    // Find current stage and next stage
                    String currentStage = claimedTask.getStage();
                    String nextStage = getNextStage(stages, currentStage);
                    log.debug(
                        "Current stage: {}, Next stage: {}",
                        currentStage,
                        nextStage
                    );

                    if (nextStage != null) {
                        log.info(
                            "Creating next stage tasks for stage: {}",
                            nextStage
                        );
                        // Advance workflowStage column THEN create the tasks
                        return applicationRepository
                            .updateWorkflowStage(
                                java.util.UUID.fromString(claimedTask.getApplicationId()),
                                nextStage
                            )
                            .doOnSuccess(v -> log.info(
                                "✅ workflowStage updated to {} for application {}",
                                nextStage, claimedTask.getApplicationId()
                            ))
                            .then(
                                createTasksForStage(
                                    claimedTask.getApplicationId(),
                                    claimedTask.getWorkflowInstanceId(),
                                    nextStage,
                                    claimedTask.getOwnerId(),
                                    config
                                )
                            );
                    }
                    log.debug("No next stage found, workflow may be complete");
                    return Mono.empty();
                } catch (Exception e) {
                    log.error("Error creating next stage tasks", e);
                    return Mono.error(e);
                }
            })
            .doOnSuccess(v ->
                log.info(
                    "✅ Created next stage tasks for claimed task {}",
                    claimedTask.getTaskId()
                )
            )
            .then();
    }

    /**
     * Get the next stage in workflow sequence
     */
    private String getNextStage(JsonNode stages, String currentStage) {
        if (stages.isArray()) {
            boolean foundCurrent = false;
            for (JsonNode stage : stages) {
                if (foundCurrent) {
                    return stage.get("name").asText();
                }
                if (stage.get("name").asText().equals(currentStage)) {
                    foundCurrent = true;
                }
            }
        }
        return null;
    }

    /**
     * Create tasks for a specific stage and assign to specific admin
     */
    private Mono<Void> createTasksForStage(
        String applicationId,
        String workflowInstanceId,
        String stageName,
        Long assignedAdminId,
        JsonNode config
    ) {
        JsonNode stages = config.get("stages");

        // Find the stage configuration
        for (JsonNode stage : stages) {
            if (
                stage.has("name") &&
                stage.get("name").asText().equals(stageName)
            ) {
                JsonNode tasks = stage.get("tasks");
                log.debug(
                    "Found stage '{}' with tasks: {}",
                    stageName,
                    tasks != null ? "present" : "null"
                );

                if (tasks == null || !tasks.isArray()) {
                    log.warn("No tasks found for stage: {}", stageName);
                    return Mono.empty();
                }

                log.debug(
                    "Processing {} tasks for stage: {}",
                    tasks.size(),
                    stageName
                );

                return Flux.fromIterable(tasks)
                    .cast(JsonNode.class)
                    .flatMap(taskConfig -> {
                        log.debug("Processing task config: {}", taskConfig);
                        String taskType = taskConfig.has("type")
                            ? taskConfig.get("type").asText()
                            : "UNKNOWN_TASK";
                        String validationRule = taskConfig.has("validationRule")
                            ? taskConfig.get("validationRule").asText()
                            : "ADMIN_CONFIRMATION";
                        int priority = taskConfig.has("priority")
                            ? taskConfig.get("priority").asInt()
                            : 5;

                        Task newTask = Task.builder()
                            .taskId(java.util.UUID.randomUUID().toString())
                            .applicationId(applicationId)
                            .workflowInstanceId(workflowInstanceId)
                            .taskType(taskType)
                            .taskStatus("CREATED")
                            .priority(priority)
                            .dueDate(
                                System.currentTimeMillis() +
                                    (7 * 24 * 60 * 60 * 1000L)
                            ) // 7 days from now
                            .ownerId(assignedAdminId)
                            .stage(stageName)
                            .validationRule(validationRule)
                            .active(true)
                            .createdAt(System.currentTimeMillis())
                            .updatedAt(System.currentTimeMillis())
                            .build();

                        return taskRepository.save(newTask);
                    })
                    .doOnNext(task ->
                        log.info(
                            "✅ Created next stage task: {} for admin: {}",
                            task.getTaskId(),
                            task.getOwnerId()
                        )
                    )
                    .then();
            }
        }

        return Mono.empty();
    }

    /**
     * Complete task and advance workflow if needed
     */
    public Mono<Task> completeTask(
        String taskId,
        Long adminId,
        Object completionData
    ) {
        return taskRepository
            .findByTaskId(taskId)
            .switchIfEmpty(
                Mono.error(new RuntimeException("Task not found: " + taskId))
            )
            .flatMap(task -> {
                if (!task.canBeCompletedBy(adminId)) {
                    return Mono.error(
                        new RuntimeException(
                            "Task cannot be completed by admin: " + adminId
                        )
                    );
                }

                // Validate task completion against student profile flags
                return validationService
                    .validateTaskCompletion(task, task.getApplicationId())
                    .flatMap(validationResult -> {
                        if (!validationResult.isValid()) {
                            log.warn(
                                "❌ Task completion validation failed for task {}: {} [{}]",
                                taskId,
                                validationResult.getMessage(),
                                validationResult.getErrorCode()
                            );
                            return Mono.error(
                                new TaskValidationException(
                                    validationResult,
                                    taskId,
                                    task.getApplicationId()
                                )
                            );
                        }

                        log.info(
                            "✅ Task completion validation passed for task: {}",
                            taskId
                        );

                        // Complete the task
                        task.complete(adminId, completionData);

                        return taskRepository
                            .save(task)
                            .flatMap(completedTask -> {
                                // Send task completion notification (non-blocking, fire-and-forget)
                                sendTaskCompletionNotification(
                                    completedTask,
                                    adminId
                                ).subscribe(
                                    v -> log.debug("Task completion notification sent"),
                                    e -> log.warn("Task completion notification failed (non-blocking): {}", e.getMessage())
                                );

                                return checkAndAdvanceStage(completedTask, adminId)
                                    .thenReturn(completedTask);
                            });
                    });
            })
            .doOnSuccess(task ->
                log.info("✅ Task {} completed by admin {}", taskId, adminId)
            );
    }

    /**
     * Check if stage is completed and advance to next stage
     */
    private Mono<Void> checkAndAdvanceStage(Task completedTask, Long adminId) {
        return isStageCompleted(
            completedTask.getApplicationId(),
            completedTask.getStage()
        ).flatMap(isCompleted -> {
            if (isCompleted) {
                return advanceToNextStage(
                    completedTask.getApplicationId(),
                    completedTask.getStage(),
                    adminId
                );
            }
            return Mono.empty();
        });
    }

    /**
     * Check if all substantive tasks in a stage are done.
     *
     * <p>Logic: a stage is complete when there are zero still-active tasks in it
     * AND at least one task was actually COMPLETED or CLAIMED.
     *
     * <p>We intentionally do NOT filter by active=true before the check.  If we
     * filtered to active-only tasks, then the moment the last task is completed
     * (active→false), the filter would return an empty list and the legacy
     * "empty == not started" guard would return false — freezing the workflow.
     */
    private Mono<Boolean> isStageCompleted(String applicationId, String stage) {
        return taskRepository
            .findByApplicationId(applicationId)
            .filter(task ->
                stage.equals(task.getStage()) && !Boolean.TRUE.equals(task.getDeleted())
            )
            .collectList()
            .flatMap(allStageTasks -> {
                if (allStageTasks.isEmpty()) {
                    // Stage has no tasks at all — treat as not yet started
                    return Mono.just(false);
                }

                long activeCount = allStageTasks.stream()
                    .filter(task -> Boolean.TRUE.equals(task.getActive()))
                    .count();

                long doneCount = allStageTasks.stream()
                    .filter(task ->
                        "COMPLETED".equals(task.getTaskStatus()) ||
                        "CLAIMED".equals(task.getTaskStatus())
                    )
                    .count();

                log.info(
                    "Stage {} for application {}: {}/{} done, {} still active",
                    stage, applicationId, doneCount, allStageTasks.size(), activeCount
                );

                // Complete when nothing is still active AND something was actually done
                return Mono.just(activeCount == 0 && doneCount > 0);
            });
    }

    /**
     * Advance to next stage in workflow
     */
    private Mono<Void> advanceToNextStage(
        String applicationId,
        String currentStage,
        Long adminId
    ) {
        log.info(
            "🚀 Advancing application {} from stage {} to next stage",
            applicationId,
            currentStage
        );

        // Send stage completion notification (fire-and-forget, non-blocking)
        sendStageCompletionNotification(applicationId, currentStage, adminId)
            .subscribe(
                v -> log.debug("Stage completion notification sent"),
                e -> log.warn("Stage completion notification failed (non-blocking): {}", e.getMessage())
            );

        // Find workflow definition for this application via the workflow instance
        return workflowInstanceRepository
            .findByApplicationId(applicationId)
            .next()
            .flatMap(workflowInstance -> {
                log.info(
                    "🔍 Looking up workflow definition for {}",
                    workflowInstance.getWorkflowDefinitionKey()
                );
                return workflowDefinitionRepository
                    .findByDefinitionKeyOrderByVersionDesc(
                        workflowInstance.getWorkflowDefinitionKey()
                    )
                    .next()
                    .map(workflowDef ->
                        new Object[] { workflowInstance, workflowDef }
                    );
            })
            .doOnNext(pair -> {
                Object[] objects = (Object[]) pair;
                WorkflowDefinition found = (WorkflowDefinition) objects[1];
                log.info(
                    "✅ Found workflow definition: {}",
                    found.getDefinitionKey()
                );
            })
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Workflow definition not found for application: " +
                            applicationId
                    )
                )
            )
            .flatMap(pair -> {
                Object[] objects = (Object[]) pair;
                WorkflowInstance workflowInstance =
                    (WorkflowInstance) objects[0];
                WorkflowDefinition workflowDef =
                    (WorkflowDefinition) objects[1];

                // Parse workflow configuration to find next stage
                try {
                    log.info(
                        "📋 Processing workflow definition: {}",
                        workflowDef.getDefinitionKey()
                    );
                    Map<String, Object> config = objectMapper.convertValue(
                        workflowDef.getConfiguration(),
                        Map.class
                    );

                    List<Map<String, Object>> stages = (List<
                        Map<String, Object>
                    >) config.get("stages");
                    log.info(
                        "📋 Found {} stages in workflow configuration",
                        stages != null ? stages.size() : 0
                    );

                    if (stages != null) {
                        for (Map<String, Object> stage : stages) {
                            log.info(
                                "🎯 Stage: {} (order: {})",
                                stage.get("name"),
                                stage.get("order")
                            );
                        }
                    }

                    String nextStage = findNextStage(stages, currentStage);
                    log.info(
                        "🔍 Current stage: {}, Next stage: {}",
                        currentStage,
                        nextStage
                    );

                    if (nextStage != null) {
                        log.info(
                            "📋 Creating tasks for next stage: {}",
                            nextStage
                        );
                        // Update the application's workflow_stage to the next stage
                        String finalNextStage = nextStage;
                        return applicationRepository
                            .updateWorkflowStage(UUID.fromString(applicationId), finalNextStage)
                            .doOnSuccess(v -> log.info(
                                "✅ Updated application {} workflow_stage to {}",
                                applicationId, finalNextStage
                            ))
                            .then(
                                createTasksForStage(
                                    applicationId,
                                    workflowInstance.getInstanceId(),
                                    nextStage,
                                    stages
                                )
                            );
                    } else {
                        log.info(
                            "🏁 Workflow completed - no more stages after {}",
                            currentStage
                        );
                        // Mark application as COMPLETED
                        return applicationRepository
                            .updateWorkflowStage(UUID.fromString(applicationId), "COMPLETED")
                            .then(applicationRepository.updateStatus(
                                UUID.fromString(applicationId), "COMPLETED"
                            ))
                            .doOnSuccess(v -> log.info(
                                "🏁 Marked application {} as COMPLETED", applicationId
                            ))
                            .then();
                    }
                } catch (Exception e) {
                    log.error(
                        "Error parsing workflow configuration: {}",
                        e.getMessage(),
                        e
                    );
                    return Mono.error(e);
                }
            })
            .then();
    }

    /**
     * Find the next stage in the workflow
     */
    private String findNextStage(
        List<Map<String, Object>> stages,
        String currentStage
    ) {
        log.info("🔍 Finding next stage after: {}", currentStage);
        for (int i = 0; i < stages.size(); i++) {
            Map<String, Object> stage = stages.get(i);
            String stageName = (String) stage.get("name");
            log.info("🎯 Checking stage[{}]: {}", i, stageName);
            if (currentStage.equals(stageName)) {
                log.info("✅ Found current stage at index {}", i);
                if (i + 1 < stages.size()) {
                    String nextStageName = (String) stages
                        .get(i + 1)
                        .get("name");
                    log.info("➡️ Next stage: {}", nextStageName);
                    return nextStageName;
                }
                log.info("🏁 Current stage is the last stage");
                break;
            }
        }
        log.warn(
            "❌ Current stage '{}' not found in workflow stages",
            currentStage
        );
        return null;
    }

    /**
     * Create tasks for a specific stage
     */
    private Mono<Void> createTasksForStage(
        String applicationId,
        String workflowKey,
        String stageName,
        List<Map<String, Object>> stages
    ) {
        // Find the stage configuration
        Map<String, Object> stageConfig = stages
            .stream()
            .filter(stage -> stageName.equals(stage.get("name")))
            .findFirst()
            .orElse(null);

        if (stageConfig == null) {
            log.warn("❌ Stage configuration not found for: {}", stageName);
            return Mono.empty();
        }

        List<Map<String, Object>> tasks = (List<
            Map<String, Object>
        >) stageConfig.get("tasks");
        if (tasks == null || tasks.isEmpty()) {
            log.warn("❌ No tasks defined for stage: {}", stageName);
            return Mono.empty();
        }

        log.info("📋 Found {} tasks for stage: {}", tasks.size(), stageName);
        for (Map<String, Object> task : tasks) {
            log.info(
                "  📝 Task: {} (type: {})",
                task.get("displayName"),
                task.get("type")
            );
        }

        // Find the admin who owns this application by looking at existing tasks
        return taskRepository
            .findByApplicationId(applicationId)
            .filter(task -> task.getOwnerId() != null)
            .map(Task::getOwnerId)
            .distinct()
            .collectList()
            .flatMap(assignedAdmins -> {
                if (assignedAdmins.isEmpty()) {
                    log.warn(
                        "❌ No assigned admin found for application: {}",
                        applicationId
                    );
                    return Mono.empty();
                }

                // Use the first assigned admin (should be consistent)
                Long assignedAdminId = assignedAdmins.get(0);
                log.info(
                    "✅ Found assigned admin: {} for application: {}",
                    assignedAdminId,
                    applicationId
                );

                // For stage advancement, create tasks only for the assigned admin
                // (not claim tasks which go to all admins)
                return Flux.fromIterable(tasks)
                    .flatMap(taskConfig -> {
                        String taskType = (String) taskConfig.get("type");
                        String validationRule = (String) taskConfig.get(
                            "validation_rule"
                        );
                        Integer priority = (Integer) taskConfig.getOrDefault(
                            "priority",
                            2
                        );

                        log.info(
                            "🚀 Creating assigned task '{}' for admin {}",
                            taskType,
                            assignedAdminId
                        );

                        // Create task only for the assigned admin
                        return createTaskForOwner(
                            taskType,
                            applicationId,
                            workflowKey,
                            assignedAdminId,
                            stageName,
                            "DE"
                        );
                    })
                    .then();
            });
    }

    /**
     * Get claimable tasks for a specific admin
     */
    public Flux<Task> getClaimableTasksForAdmin(
        Long adminId,
        String countryCode
    ) {
        return taskRepository
            .findByTaskStatus("CREATED")
            .filter(task -> task.isClaimableBy(adminId));
    }

    /**
     * Create workflow instance from client-based workflow definition
     */
    private Mono<Void> createWorkflowInstanceFromDefinition(
        String applicationId,
        Long workflowDefinitionId,
        String workflowInstanceId,
        String workflowConfig
    ) {
        return workflowDefinitionRepository
            .findById(workflowDefinitionId)
            .flatMap(workflowDefinition -> {
                WorkflowInstance instance = new WorkflowInstance();
                instance.setInstanceId(workflowInstanceId);
                instance.setApplicationId(applicationId);
                instance.setWorkflowDefinitionKey(
                    workflowDefinition.getDefinitionKey()
                );
                instance.setDefinitionKey(
                    workflowDefinition.getDefinitionKey()
                );
                instance.setInstanceStatus("ACTIVE");
                instance.setCurrentStage("INITIAL");
                instance.setCreatedAt(LocalDateTime.now());
                instance.setUpdatedAt(LocalDateTime.now());

                log.info(
                    "Creating workflow instance {} for application {} using definition {}",
                    workflowInstanceId,
                    applicationId,
                    workflowDefinition.getDefinitionKey()
                );

                return workflowInstanceRepository.save(instance);
            })
            .then();
    }

    /**
     * Create initial tasks from workflow definition configuration
     */
    private Mono<Void> createInitialTasksFromWorkflowDefinition(
        String applicationId,
        String workflowInstanceId,
        String workflowConfig
    ) {
        try {
            // Parse workflow configuration to get first stage tasks
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode config = objectMapper.readTree(workflowConfig);

            if (!config.has("stages") || !config.get("stages").isArray()) {
                log.error(
                    "❌ No stages found in workflow configuration for application: {}",
                    applicationId
                );
                return Mono.error(
                    new IllegalStateException(
                        "Workflow configuration is invalid: no 'stages' array found for application '" +
                            applicationId +
                            "'. Please ensure the workflow definition has valid stages configured."
                    )
                );
            }

            JsonNode stages = config.get("stages");
            if (stages.size() == 0) {
                log.error(
                    "❌ Empty stages array in workflow configuration for application: {}",
                    applicationId
                );
                return Mono.error(
                    new IllegalStateException(
                        "Workflow configuration is invalid: 'stages' array is empty for application '" +
                            applicationId +
                            "'. Please ensure the workflow definition has at least one stage configured."
                    )
                );
            }

            // Get first stage
            JsonNode firstStage = stages.get(0);
            if (
                !firstStage.has("tasks") || !firstStage.get("tasks").isArray()
            ) {
                log.error(
                    "❌ No tasks found in first stage for application: {}",
                    applicationId
                );
                return Mono.error(
                    new IllegalStateException(
                        "Workflow configuration is invalid: first stage has no 'tasks' array for application '" +
                            applicationId +
                            "'. Please ensure the workflow stages have tasks configured."
                    )
                );
            }

            JsonNode tasks = firstStage.get("tasks");
            String firstStageName = firstStage.get("name").asText("INITIAL");

            // Student-aware routing: if this student already has an assigned admin,
            // route the APPLICATION_CLAIM exclusively to them instead of broadcasting.
            return applicationRepository
                .findById(java.util.UUID.fromString(applicationId))
                .flatMap(application -> {
                    Long studentId = application.getStudentId();
                    if (studentId == null) {
                        log.warn(
                            "Application {} has no studentId — broadcasting to all eligible admins",
                            applicationId
                        );
                        return broadcastTasksFromConfig(
                            applicationId, workflowInstanceId, tasks, firstStageName
                        );
                    }

                    return applicationRepository
                        .findLatestAssignedApplicationForStudent(studentId, applicationId)
                        .map(app -> app.getAssignedAdminId())
                        .<Boolean>flatMap(existingAdminId -> {
                            log.info(
                                "Student {} already assigned to admin {} — routing APPLICATION_CLAIM exclusively to that admin",
                                studentId, existingAdminId
                            );
                            // thenReturn emits a real value so switchIfEmpty below does NOT fire.
                            return createTaskForOwner(
                                "APPLICATION_CLAIM",
                                applicationId,
                                workflowInstanceId,
                                existingAdminId,
                                firstStageName,
                                "DE"
                            ).thenReturn(Boolean.TRUE);
                        })
                        .switchIfEmpty(
                            // No prior admin — broadcast to all eligible admins
                            broadcastTasksFromConfig(
                                applicationId, workflowInstanceId, tasks, firstStageName
                            ).thenReturn(Boolean.FALSE)
                        )
                        .then(); // Collapse Mono<Boolean> back to Mono<Void>
                })
                .doOnSuccess(v ->
                    log.info(
                        "Created tasks from workflow definition for application: {}",
                        applicationId
                    )
                );
        } catch (Exception e) {
            log.error(
                "Failed to parse workflow configuration for application {}: {}",
                applicationId,
                e.getMessage()
            );
            return Mono.error(
                new IllegalStateException(
                    "Failed to parse workflow configuration for application '" +
                        applicationId +
                        "'. Error: " +
                        e.getMessage()
                )
            );
        }
    }

    /**
     * Broadcast tasks to all eligible admins based on first-stage workflow config.
     * Called only when a student has no prior admin assignment.
     */
    private Mono<Void> broadcastTasksFromConfig(
        String applicationId,
        String workflowInstanceId,
        JsonNode tasks,
        String stageName
    ) {
        return Flux.fromIterable(tasks)
            .flatMap(taskConfig ->
                createTasksForAllEligibleAdminsFromConfig(
                    applicationId,
                    workflowInstanceId,
                    taskConfig,
                    stageName
                )
            )
            .then()
            .doOnSuccess(v ->
                log.info(
                    "Broadcast APPLICATION_CLAIM to all eligible admins for application: {}",
                    applicationId
                )
            );
    }

    /**
     * Create tasks for all eligible admins based on workflow configuration
     */
    private Mono<Void> createTasksForAllEligibleAdminsFromConfig(
        String applicationId,
        String workflowInstanceId,
        JsonNode taskConfig,
        String stageName
    ) {
        String taskType = taskConfig.get("type").asText();
        String displayName = taskConfig
            .get("displayName")
            .asText("Application Review");

        // Extract owner types or default to ADMIN
        JsonNode ownerTypesNode = taskConfig.get("ownerTypes");
        Set<String> ownerTypes = new HashSet<>();
        if (ownerTypesNode != null && ownerTypesNode.isArray()) {
            ownerTypesNode.forEach(node -> ownerTypes.add(node.asText()));
        } else {
            ownerTypes.add("ADMIN");
        }

        log.info(
            "📋 Creating tasks for application: {}, taskType: {}, stage: {}",
            applicationId,
            taskType,
            stageName
        );

        // Fetch application to get actual country and degree level - no defaults
        return applicationRepository
            .findById(UUID.fromString(applicationId))
            .switchIfEmpty(
                Mono.error(
                    new IllegalArgumentException(
                        "Application not found: " + applicationId
                    )
                )
            )
            .flatMapMany(application -> {
                String rawCountryCode = application.getCountryCode();
                String rawDegreeLevel = application.getDegreeLevel();

                // Validate country code - no defaults
                if (rawCountryCode == null || rawCountryCode.isBlank()) {
                    log.error(
                        "❌ Country code is required but missing for application {}",
                        application.getReferenceNumber()
                    );
                    return Flux.error(
                        new IllegalArgumentException(
                            "Country code is required but not found in application '" +
                                application.getReferenceNumber() +
                                "'. Please ensure the application has a valid country_code."
                        )
                    );
                }

                // Validate degree level - no defaults
                if (rawDegreeLevel == null || rawDegreeLevel.isBlank()) {
                    log.error(
                        "❌ Degree level is required but missing for application {}",
                        application.getReferenceNumber()
                    );
                    return Flux.error(
                        new IllegalArgumentException(
                            "Degree level is required but not found in application '" +
                                application.getReferenceNumber() +
                                "'. Please ensure the application has a valid degree_level."
                        )
                    );
                }

                String countryCode;
                String degreeLevel;
                try {
                    countryCode = CountryCodeUtils.validateCountryCode(
                        rawCountryCode
                    );
                    degreeLevel = CountryCodeUtils.validateDegreeLevel(
                        rawDegreeLevel
                    );
                } catch (IllegalArgumentException e) {
                    log.error(
                        "❌ Invalid country/degree for application {}: {}",
                        application.getReferenceNumber(),
                        e.getMessage()
                    );
                    return Flux.error(e);
                }

                log.info(
                    "📍 Application {} - Country: {}, Degree: {} - Fetching eligible admins",
                    application.getReferenceNumber(),
                    countryCode,
                    degreeLevel
                );

                return getEligibleAdminsForApplication(
                    countryCode,
                    degreeLevel
                ).flatMap(adminId ->
                    createTaskForOwnerWithConfig(
                        taskType,
                        displayName,
                        applicationId,
                        workflowInstanceId,
                        adminId,
                        stageName,
                        taskConfig
                    )
                );
            })
            .then();
    }

    /**
     * Create task for owner with configuration details
     */
    private Mono<Void> createTaskForOwnerWithConfig(
        String taskType,
        String displayName,
        String applicationId,
        String workflowInstanceId,
        Long adminId,
        String stageName,
        JsonNode taskConfig
    ) {
        Task task = new Task();
        task.setTaskId(UUID.randomUUID().toString());
        task.setApplicationId(applicationId);
        task.setWorkflowInstanceId(workflowInstanceId);
        task.setTaskType(taskType);
        task.setStage(stageName);
        task.setTaskStatus("CREATED");
        task.setOwnerId(adminId);
        task.setPriority(taskConfig.get("priority").asInt(1));
        task.setCreatedAt(System.currentTimeMillis());
        task.setUpdatedAt(LocalDateTime.now());

        return taskRepository.save(task).then();
    }

    /**
     * Determine workflow definition key based on country and degree level
     */
    private String determineWorkflowDefinitionKey(
        String countryCode,
        String degreeLevel
    ) {
        // Ensure country code is not null
        if (countryCode == null || countryCode.trim().isEmpty()) {
            countryCode = "DE"; // Default fallback
        }

        String normalizedDegreeLevel = normalizeDegreeLevel(degreeLevel);

        return switch (countryCode.toUpperCase()) {
            case "DE" -> "GERMANY_" + normalizedDegreeLevel + "_WORKFLOW";
            case "US" -> "USA_" + normalizedDegreeLevel + "_WORKFLOW";
            case "UK" -> "UK_" + normalizedDegreeLevel + "_WORKFLOW";
            case "CA" -> "CANADA_" + normalizedDegreeLevel + "_WORKFLOW";
            default -> "GENERAL_" + normalizedDegreeLevel + "_WORKFLOW";
        };
    }

    /**
     * Normalize degree level to singular form for consistent workflow keys
     */
    private String normalizeDegreeLevel(String degreeLevel) {
        if (degreeLevel == null) {
            return "BACHELOR";
        }

        return switch (degreeLevel.toUpperCase()) {
            case "BACHELORS", "BACHELOR'S" -> "BACHELOR";
            case "MASTERS", "MASTER'S" -> "MASTERS";
            case "DOCTORATE", "DOCTORATES", "PHD", "PH.D" -> "DOCTORATE";
            case "DIPLOMA", "DIPLOMAS" -> "DIPLOMA";
            case "CERTIFICATE", "CERTIFICATES" -> "CERTIFICATE";
            default -> degreeLevel.toUpperCase();
        };
    }

    /**
     * Create workflow instance for application
     */
    private Mono<WorkflowInstance> createWorkflowInstance(
        String applicationId,
        String workflowDefinitionKey,
        String workflowInstanceId
    ) {
        WorkflowInstance instance = WorkflowInstance.builder()
            .instanceId(workflowInstanceId)
            .workflowInstanceId(workflowInstanceId)
            .applicationId(applicationId)
            .workflowDefinitionKey(workflowDefinitionKey)
            .instanceStatus("ACTIVE")
            .priority(2)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        return workflowInstanceRepository
            .save(instance)
            .doOnSuccess(saved ->
                log.info(
                    "✅ Created workflow instance: {} for application: {}",
                    saved.getWorkflowInstanceId(),
                    applicationId
                )
            );
    }

    /**
     * Send notification when a task is completed
     */
    private Mono<Void> sendTaskCompletionNotification(
        Task completedTask,
        Long adminId
    ) {
        return getStudentIdFromApplication(completedTask.getApplicationId())
            .flatMap(studentId ->
                workflowNotificationService.notifyTaskCompletion(
                    studentId,
                    completedTask.getTaskType(),
                    completedTask.getStage(),
                    completedTask.getApplicationId(),
                    adminId
                )
            )
            .doOnSuccess(v ->
                log.info(
                    "✅ Task completion notification sent for task: {}",
                    completedTask.getTaskId()
                )
            )
            .doOnError(error ->
                log.error(
                    "❌ Failed to send task completion notification for task: {}",
                    completedTask.getTaskId(),
                    error
                )
            )
            .onErrorResume(error -> Mono.empty()); // Don't fail the main operation
    }

    /**
     * Send notification when a task is claimed
     */
    private Mono<Void> sendTaskClaimNotification(
        Task claimedTask,
        Long adminId
    ) {
        return getStudentIdFromApplication(claimedTask.getApplicationId())
            .flatMap(studentId -> {
                // Create a simple claim notification
                String taskDisplayName = formatTaskDisplayName(
                    claimedTask.getTaskType()
                );
                return workflowNotificationService.notifyTaskCompletion(
                    studentId,
                    "Task Assigned: " + taskDisplayName,
                    claimedTask.getStage(),
                    claimedTask.getApplicationId(),
                    adminId
                );
            })
            .doOnSuccess(v ->
                log.info(
                    "✅ Task claim notification sent for task: {}",
                    claimedTask.getTaskId()
                )
            )
            .doOnError(error ->
                log.error(
                    "❌ Failed to send task claim notification for task: {}",
                    claimedTask.getTaskId(),
                    error
                )
            )
            .onErrorResume(error -> Mono.empty()); // Don't fail the main operation
    }

    /**
     * Get student ID from application ID
     */
    private Mono<Long> getStudentIdFromApplication(String applicationId) {
        // Parse the application ID to extract student ID
        // Format expected: "APP_STUDENT_ID_TIMESTAMP" or similar
        try {
            if (applicationId.startsWith("APP_")) {
                String[] parts = applicationId.split("_");
                if (parts.length >= 2) {
                    return Mono.just(Long.parseLong(parts[1]));
                }
            }

            // Fallback: try to find student by application ID
            return studentProfileRepository
                .findByApplicationId(applicationId)
                .map(studentProfile -> studentProfile.getUserId())
                .switchIfEmpty(
                    Mono.error(
                        new RuntimeException(
                            "Student not found for application: " +
                                applicationId
                        )
                    )
                );
        } catch (Exception e) {
            log.error(
                "Failed to extract student ID from application ID: {}",
                applicationId,
                e
            );
            return Mono.error(
                new RuntimeException(
                    "Invalid application ID format: " + applicationId
                )
            );
        }
    }

    /**
     * Format task name for display
     */
    private String formatTaskDisplayName(String taskName) {
        if (taskName == null || taskName.trim().isEmpty()) {
            return "Unknown Task";
        }

        // Convert snake_case or camelCase to human-readable format
        String formatted = taskName
            .replaceAll("([a-z])([A-Z])", "$1 $2") // camelCase to spaces
            .replaceAll("_", " ") // snake_case to spaces
            .replaceAll("\\s+", " ") // multiple spaces to single space
            .trim()
            .toLowerCase();

        // Capitalize first letter of each word
        String[] words = formatted.split(" ");
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < words.length; i++) {
            if (i > 0) result.append(" ");
            if (words[i].length() > 0) {
                result
                    .append(Character.toUpperCase(words[i].charAt(0)))
                    .append(words[i].substring(1));
            }
        }
        return result.toString();
    }

    /**
     * Send notification when a stage is completed
     */
    private Mono<Void> sendStageCompletionNotification(
        String applicationId,
        String completedStage,
        Long adminId
    ) {
        return getStudentIdFromApplication(applicationId)
            .flatMap(studentId ->
                workflowNotificationService.notifyStageCompletion(
                    studentId,
                    completedStage,
                    applicationId,
                    adminId // Use actual admin ID, not hardcoded 1L
                )
            )
            .doOnSuccess(v ->
                log.info(
                    "✅ Stage completion notification sent for stage: {} in application: {}",
                    completedStage,
                    applicationId
                )
            )
            .doOnError(error ->
                log.error(
                    "❌ Failed to send stage completion notification for stage: {} in application: {}",
                    completedStage,
                    applicationId,
                    error
                )
            )
            .onErrorResume(error -> Mono.empty()); // Don't fail the main operation
    }

    /**
     * Set workflow flag for document approval integration
     * Updates workflow variables when documents are approved
     *
     * @param instanceId Workflow instance ID
     * @param flagName Flag name to set
     * @param flagValue Flag value
     * @return Mono<Void> for reactive completion
     */
    public Mono<Void> setWorkflowFlag(
        String instanceId,
        String flagName,
        boolean flagValue
    ) {
        log.debug(
            "Setting workflow flag {} = {} for instance: {}",
            flagName,
            flagValue,
            instanceId
        );

        return workflowInstanceRepository
            .findByInstanceId(instanceId)
            .switchIfEmpty(
                Mono.error(
                    new IllegalArgumentException(
                        "Workflow instance not found: " + instanceId
                    )
                )
            )
            .flatMap(workflowInstance -> {
                try {
                    // Get current variables or create new object
                    com.fasterxml.jackson.databind.node.ObjectNode variables;
                    if (
                        workflowInstance.getVariables() != null &&
                        workflowInstance.getVariables().isObject()
                    ) {
                        variables =
                            (com.fasterxml.jackson.databind.node.ObjectNode) workflowInstance.getVariables();
                    } else {
                        variables = objectMapper.createObjectNode();
                    }

                    // Set the flag
                    variables.put(flagName, flagValue);

                    // Update workflow instance
                    workflowInstance.setVariables(variables);
                    workflowInstance.setUpdatedAt(
                        java.time.LocalDateTime.now()
                    );

                    return workflowInstanceRepository.save(workflowInstance);
                } catch (Exception e) {
                    return Mono.error(
                        new RuntimeException(
                            "Failed to update workflow flag: " + e.getMessage(),
                            e
                        )
                    );
                }
            })
            .doOnSuccess(v ->
                log.info(
                    "✅ Set workflow flag {} = {} for instance: {}",
                    flagName,
                    flagValue,
                    instanceId
                )
            )
            .doOnError(error ->
                log.error(
                    "❌ Failed to set workflow flag {} for instance: {}",
                    flagName,
                    instanceId,
                    error
                )
            )
            .then();
    }
}
