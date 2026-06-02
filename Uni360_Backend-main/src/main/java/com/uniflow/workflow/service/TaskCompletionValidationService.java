package com.uniflow.workflow.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.student.entity.StudentProfile;
import com.uniflow.student.repository.StudentProfileRepository;
import com.uniflow.workflow.entity.Task;
import com.uniflow.workflow.entity.WorkflowDefinition;
import com.uniflow.workflow.repository.WorkflowDefinitionRepository;
import com.uniflow.workflow.repository.WorkflowInstanceRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * TaskCompletionValidationService - Validates task completion against student profile flags
 *
 * <p>This service checks if a task can be completed by validating required flags
 * in the student's profile data against the task's configuration requirements.
 * Flags are stored in the student profile's JSONB data field.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TaskCompletionValidationService {

    private final StudentProfileRepository studentProfileRepository;
    private final WorkflowDefinitionRepository workflowDefinitionRepository;
    private final WorkflowInstanceRepository workflowInstanceRepository;
    private final ObjectMapper objectMapper;

    /**
     * Validates if a task can be completed based on student profile flags
     *
     * @param task The task to validate
     * @param applicationId The application ID to find the student profile
     * @return Mono<ValidationResult> containing validation result and details
     */
    public Mono<ValidationResult> validateTaskCompletion(
        Task task,
        String applicationId
    ) {
        log.info(
            "🔍 Validating task completion for task: {} in application: {}",
            task.getTaskType(),
            applicationId
        );

        return getRequiredFlagsForTask(task)
            .flatMap(requiredFlags -> {
                if (requiredFlags.isEmpty()) {
                    log.info(
                        "✅ No required flags for task: {} - validation passed",
                        task.getTaskType()
                    );
                    return Mono.just(ValidationResult.success());
                }

                return validateStudentProfileFlags(
                    applicationId,
                    requiredFlags
                ).map(missingFlags -> {
                    if (missingFlags.isEmpty()) {
                        log.info(
                            "✅ All required flags present for task: {}",
                            task.getTaskType()
                        );
                        return ValidationResult.success();
                    } else {
                        log.warn(
                            "❌ Missing required flags for task: {} - Missing: {}",
                            task.getTaskType(),
                            missingFlags
                        );
                        return ValidationResult.failure(
                            String.format(
                                "Cannot complete task '%s'. Missing required student profile flags: %s. Please ensure all required documents and verifications are completed before proceeding.",
                                task.getTaskType(),
                                String.join(", ", missingFlags)
                            ),
                            missingFlags
                        );
                    }
                });
            })
            .onErrorResume(error -> {
                log.error(
                    "🚨 Error validating task completion for task: {}",
                    task.getTaskType(),
                    error
                );

                // Check if it's a profile not found scenario
                if (
                    error.getMessage() != null &&
                    (error.getMessage().contains("student_profiles") ||
                        error.getMessage().contains("No student profile found"))
                ) {
                    return Mono.just(
                        ValidationResult.profileNotFound(applicationId)
                    );
                }

                return Mono.just(
                    ValidationResult.systemError(
                        "System error during validation. Please contact support if this issue persists."
                    )
                );
            });
    }

    /**
     * Gets required flags for a task from workflow configuration
     */
    private Mono<List<String>> getRequiredFlagsForTask(Task task) {
        // Get workflow definition key from the task's workflow instance
        return workflowInstanceRepository
            .findByInstanceId(task.getWorkflowInstanceId())
            .flatMap(workflowInstance ->
                workflowDefinitionRepository.findByDefinitionKeyAndIsActive(
                    workflowInstance.getWorkflowDefinitionKey(),
                    true
                )
            )
            .map(workflowDef -> extractRequiredFlags(workflowDef, task))
            .switchIfEmpty(Mono.just(List.of()));
    }

    /**
     * Extracts required flags from workflow definition for specific task
     */
    private List<String> extractRequiredFlags(
        WorkflowDefinition workflowDef,
        Task task
    ) {
        try {
            JsonNode config = workflowDef.getConfiguration();
            JsonNode stages = config.get("stages");

            if (stages != null && stages.isArray()) {
                for (JsonNode stage : stages) {
                    if (task.getStage().equals(stage.get("name").asText())) {
                        JsonNode tasks = stage.get("tasks");
                        if (tasks != null && tasks.isArray()) {
                            for (JsonNode taskNode : tasks) {
                                if (
                                    task
                                        .getTaskType()
                                        .equals(taskNode.get("type").asText())
                                ) {
                                    JsonNode requiredFlags = taskNode.get(
                                        "requiredFlags"
                                    );
                                    if (requiredFlags != null) {
                                        List<String> flags = new ArrayList<>();
                                        if (requiredFlags.isArray()) {
                                            for (JsonNode flag : requiredFlags) {
                                                flags.add(flag.asText());
                                            }
                                        }
                                        log.info(
                                            "📋 Found {} required flags for task {}: {}",
                                            flags.size(),
                                            task.getTaskType(),
                                            flags
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
            log.error(
                "Error extracting required flags from workflow config",
                e
            );
        }

        return List.of();
    }

    /**
     * Validates student profile flags against required flags
     */
    private Mono<List<String>> validateStudentProfileFlags(
        String applicationId,
        List<String> requiredFlags
    ) {
        return studentProfileRepository
            .findByApplicationId(applicationId)
            .map(studentProfile -> {
                JsonNode profileData = studentProfile.getProfileData();
                List<String> missingFlags = new ArrayList<>();

                for (String requiredFlag : requiredFlags) {
                    if (!isFlagSetInProfile(profileData, requiredFlag)) {
                        missingFlags.add(requiredFlag);
                    }
                }

                log.info(
                    "🔍 Profile validation for application {}: Required {} flags, Missing {} flags",
                    applicationId,
                    requiredFlags.size(),
                    missingFlags.size()
                );

                return missingFlags;
            })
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "No student profile found for application: " +
                            applicationId
                    )
                )
            );
    }

    /**
     * Checks if a specific flag is set to true in student profile data
     * Recursively searches through the entire JSON structure
     */
    private boolean isFlagSetInProfile(JsonNode profileData, String flagName) {
        if (profileData == null) {
            return false;
        }

        return findFlagInNode(profileData, flagName);
    }

    /**
     * Recursively searches for a flag in a JSON node
     */
    private boolean findFlagInNode(JsonNode node, String flagName) {
        if (node == null) {
            return false;
        }

        // Check if current node has the flag directly
        JsonNode flagNode = node.get(flagName);
        if (flagNode != null && flagNode.isBoolean() && flagNode.asBoolean()) {
            return true;
        }

        // Recursively search through all object fields
        if (node.isObject()) {
            for (JsonNode childNode : node) {
                if (findFlagInNode(childNode, flagName)) {
                    return true;
                }
            }
        }

        // Search through array elements
        if (node.isArray()) {
            for (JsonNode arrayElement : node) {
                if (findFlagInNode(arrayElement, flagName)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Updates a specific flag in student profile data
     */
    public Mono<Void> updateStudentProfileFlag(
        String applicationId,
        String flagName,
        boolean flagValue
    ) {
        log.info(
            "🔄 Updating student profile flag: {} = {} for application: {}",
            flagName,
            flagValue,
            applicationId
        );

        return studentProfileRepository
            .findByApplicationId(applicationId)
            .flatMap(studentProfile -> {
                JsonNode profileData = studentProfile.getProfileData();

                // Create mutable copy of profile data
                Map<String, Object> profileMap;
                if (profileData != null) {
                    profileMap = objectMapper.convertValue(
                        profileData,
                        HashMap.class
                    );
                } else {
                    profileMap = new HashMap<>();
                }

                // Store flags in a dedicated workflow_flags section for organization
                @SuppressWarnings("unchecked")
                Map<String, Object> workflowFlags = (Map<
                    String,
                    Object
                >) profileMap.computeIfAbsent("workflow_flags", k ->
                    new HashMap<>()
                );

                // Update the flag
                workflowFlags.put(flagName, flagValue);

                // Convert back to JsonNode
                JsonNode updatedProfileData = objectMapper.valueToTree(
                    profileMap
                );
                studentProfile.setProfileData(updatedProfileData);

                return studentProfileRepository.save(studentProfile).then();
            })
            .doOnSuccess(v ->
                log.info(
                    "✅ Successfully updated flag {} for application {}",
                    flagName,
                    applicationId
                )
            )
            .onErrorResume(error -> {
                log.error(
                    "🚨 Error updating student profile flag: {} for application: {}",
                    flagName,
                    applicationId,
                    error
                );
                return Mono.error(error);
            });
    }

    /**
     * Updates multiple flags in student profile data
     */
    public Mono<Void> updateStudentProfileFlags(
        String applicationId,
        Map<String, Boolean> flags
    ) {
        log.info(
            "🔄 Updating {} student profile flags for application: {}",
            flags.size(),
            applicationId
        );

        return studentProfileRepository
            .findByApplicationId(applicationId)
            .flatMap(studentProfile -> {
                JsonNode profileData = studentProfile.getProfileData();

                // Create mutable copy of profile data
                Map<String, Object> profileMap;
                if (profileData != null) {
                    profileMap = objectMapper.convertValue(
                        profileData,
                        HashMap.class
                    );
                } else {
                    profileMap = new HashMap<>();
                }

                // Store flags in a dedicated workflow_flags section for organization
                @SuppressWarnings("unchecked")
                Map<String, Object> workflowFlags = (Map<
                    String,
                    Object
                >) profileMap.computeIfAbsent("workflow_flags", k ->
                    new HashMap<>()
                );

                // Update all flags
                flags.forEach(workflowFlags::put);

                // Convert back to JsonNode
                JsonNode updatedProfileData = objectMapper.valueToTree(
                    profileMap
                );
                studentProfile.setProfileData(updatedProfileData);

                return studentProfileRepository.save(studentProfile).then();
            })
            .doOnSuccess(v ->
                log.info(
                    "✅ Successfully updated {} flags for application {}",
                    flags.size(),
                    applicationId
                )
            )
            .onErrorResume(error -> {
                log.error(
                    "🚨 Error updating student profile flags for application: {}",
                    applicationId,
                    error
                );
                return Mono.error(error);
            });
    }

    /**
     * Retrieves current profile flags for an application
     */
    public Mono<Map<String, Boolean>> getProfileFlags(String applicationId) {
        log.info(
            "🔍 Retrieving profile flags for application: {}",
            applicationId
        );

        return studentProfileRepository
            .findByApplicationId(applicationId)
            .map(studentProfile -> {
                JsonNode profileData = studentProfile.getProfileData();
                Map<String, Boolean> allFlags = new HashMap<>();

                if (profileData != null) {
                    extractAllFlags(profileData, allFlags);
                }

                log.info(
                    "✅ Retrieved {} flags for application: {}",
                    allFlags.size(),
                    applicationId
                );

                return allFlags;
            })
            .switchIfEmpty(
                Mono.fromSupplier(() -> {
                    log.warn(
                        "⚠️ No student profile found for application: {}",
                        applicationId
                    );
                    return new HashMap<>();
                })
            );
    }

    /**
     * Recursively extracts all boolean flags from JSON data
     */
    private void extractAllFlags(JsonNode node, Map<String, Boolean> flags) {
        if (node == null) {
            return;
        }

        if (node.isObject()) {
            node
                .fields()
                .forEachRemaining(entry -> {
                    String fieldName = entry.getKey();
                    JsonNode fieldValue = entry.getValue();

                    if (fieldValue.isBoolean()) {
                        flags.put(fieldName, fieldValue.asBoolean());
                    } else if (fieldValue.isObject() || fieldValue.isArray()) {
                        extractAllFlags(fieldValue, flags);
                    }
                });
        } else if (node.isArray()) {
            for (JsonNode arrayElement : node) {
                extractAllFlags(arrayElement, flags);
            }
        }
    }

    /**
     * Validation result container with detailed error information
     */
    public static class ValidationResult {

        private final boolean valid;
        private final String message;
        private final List<String> missingFlags;
        private final String errorCode;
        private final String errorType;

        private ValidationResult(
            boolean valid,
            String message,
            List<String> missingFlags,
            String errorCode,
            String errorType
        ) {
            this.valid = valid;
            this.message = message;
            this.missingFlags = missingFlags;
            this.errorCode = errorCode;
            this.errorType = errorType;
        }

        public static ValidationResult success() {
            return new ValidationResult(
                true,
                "Validation successful",
                List.of(),
                null,
                null
            );
        }

        public static ValidationResult failure(
            String message,
            List<String> missingFlags
        ) {
            return new ValidationResult(
                false,
                message,
                missingFlags,
                "VALIDATION_FAILED",
                "MISSING_REQUIRED_FLAGS"
            );
        }

        public static ValidationResult systemError(String message) {
            return new ValidationResult(
                false,
                message,
                List.of(),
                "SYSTEM_ERROR",
                "VALIDATION_SYSTEM_ERROR"
            );
        }

        public static ValidationResult profileNotFound(String applicationId) {
            return new ValidationResult(
                false,
                "Student profile not found for application: " + applicationId,
                List.of(),
                "PROFILE_NOT_FOUND",
                "MISSING_STUDENT_PROFILE"
            );
        }

        public boolean isValid() {
            return valid;
        }

        public String getMessage() {
            return message;
        }

        public List<String> getMissingFlags() {
            return missingFlags;
        }

        public String getErrorCode() {
            return errorCode;
        }

        public String getErrorType() {
            return errorType;
        }

        public boolean isSystemError() {
            return "SYSTEM_ERROR".equals(errorCode);
        }

        public boolean isProfileNotFound() {
            return "PROFILE_NOT_FOUND".equals(errorCode);
        }
    }
}
