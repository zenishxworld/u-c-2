package com.uniflow.client.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.uniflow.client.exception.ClientWorkflowException;
import com.uniflow.workflow.entity.WorkflowDefinition;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * Service for validating workflow definitions
 * Provides comprehensive validation for client workflow configurations
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowValidationService {

    /**
     * Validate a workflow definition for correctness and completeness
     * @param workflowDefinition the workflow definition to validate
     * @return Mono that completes successfully if valid, errors if invalid
     */
    public Mono<Void> validateWorkflowDefinition(WorkflowDefinition workflowDefinition) {
        return Mono.fromCallable(() -> {
            log.debug("🔍 Validating workflow definition: {}", workflowDefinition.getDefinitionKey());

            List<String> errors = new ArrayList<>();

            // Basic field validation
            validateBasicFields(workflowDefinition, errors);

            // Client-specific field validation
            validateClientFields(workflowDefinition, errors);

            // Workflow configuration validation
            validateWorkflowConfig(workflowDefinition, errors);

            // Version and deployment validation
            validateVersionAndDeployment(workflowDefinition, errors);

            if (!errors.isEmpty()) {
                String errorMessage = "Workflow definition validation failed: " + String.join(", ", errors);
                log.error("❌ Validation failed for workflow {}: {}",
                        workflowDefinition.getDefinitionKey(), errorMessage);
                throw new ClientWorkflowException(
                        workflowDefinition.getClientId(),
                        "VALIDATION_FAILED",
                        errorMessage
                );
            }

            log.debug("✅ Workflow definition validation passed: {}", workflowDefinition.getDefinitionKey());
            return null;
        });
    }

    /**
     * Validate workflow configuration JSON structure
     * @param workflowConfig the workflow configuration to validate
     * @param clientId client ID for error context
     * @return Mono that completes successfully if valid, errors if invalid
     */
    public Mono<Void> validateWorkflowConfig(JsonNode workflowConfig, String clientId) {
        return Mono.fromCallable(() -> {
            log.debug("🔍 Validating workflow configuration JSON for client: {}", clientId);

            List<String> errors = new ArrayList<>();

            if (workflowConfig == null) {
                errors.add("Workflow configuration cannot be null");
            } else {
                validateWorkflowConfigStructure(workflowConfig, errors);
            }

            if (!errors.isEmpty()) {
                String errorMessage = "Workflow configuration validation failed: " + String.join(", ", errors);
                log.error("❌ Configuration validation failed for client {}: {}", clientId, errorMessage);
                throw new ClientWorkflowException(
                        clientId,
                        "CONFIG_VALIDATION_FAILED",
                        errorMessage
                );
            }

            log.debug("✅ Workflow configuration validation passed for client: {}", clientId);
            return null;
        });
    }

    /**
     * Validate basic workflow definition fields
     */
    private void validateBasicFields(WorkflowDefinition definition, List<String> errors) {
        if (definition.getDefinitionKey() == null || definition.getDefinitionKey().trim().isEmpty()) {
            errors.add("Definition key is required");
        }

        if (definition.getDefinitionName() == null || definition.getDefinitionName().trim().isEmpty()) {
            errors.add("Definition name is required");
        }

        if (definition.getVersion() == null || definition.getVersion() <= 0) {
            errors.add("Version must be a positive number");
        }

        if (definition.getDeploymentId() == null || definition.getDeploymentId().trim().isEmpty()) {
            errors.add("Deployment ID is required");
        }

        // Validate definition key format
        if (definition.getDefinitionKey() != null && !definition.getDefinitionKey().matches("^[A-Z0-9_]+$")) {
            errors.add("Definition key must contain only uppercase letters, numbers, and underscores");
        }
    }

    /**
     * Validate client-specific fields
     */
    private void validateClientFields(WorkflowDefinition definition, List<String> errors) {
        if (definition.getClientId() == null || definition.getClientId().trim().isEmpty()) {
            errors.add("Client ID is required");
        }

        if (definition.getCountryCode() == null || definition.getCountryCode().trim().isEmpty()) {
            errors.add("Country code is required");
        } else if (!definition.getCountryCode().matches("^[A-Z]{2}$")) {
            errors.add("Country code must be a 2-letter uppercase code (e.g., DE, US, UK)");
        }

        if (definition.getDegreeLevel() == null || definition.getDegreeLevel().trim().isEmpty()) {
            errors.add("Degree level is required");
        }
    }

    /**
     * Validate workflow configuration structure
     */
    private void validateWorkflowConfig(WorkflowDefinition definition, List<String> errors) {
        JsonNode config = definition.getWorkflowConfig();
        if (config != null) {
            validateWorkflowConfigStructure(config, errors);
        }
    }

    /**
     * Validate workflow configuration JSON structure
     */
    private void validateWorkflowConfigStructure(JsonNode config, List<String> errors) {
        // Validate required top-level fields
        if (!config.has("workflowDefinitionKey") || config.get("workflowDefinitionKey").asText().trim().isEmpty()) {
            errors.add("Workflow configuration must have a workflowDefinitionKey");
        }

        if (!config.has("name") || config.get("name").asText().trim().isEmpty()) {
            errors.add("Workflow configuration must have a name");
        }

        if (!config.has("countryCode") || config.get("countryCode").asText().trim().isEmpty()) {
            errors.add("Workflow configuration must have a countryCode");
        }

        if (!config.has("degreeLevel") || config.get("degreeLevel").asText().trim().isEmpty()) {
            errors.add("Workflow configuration must have a degreeLevel");
        }

        // Validate stages structure
        if (!config.has("stages")) {
            errors.add("Workflow configuration must have stages");
        } else {
            JsonNode stages = config.get("stages");
            if (!stages.isArray() || stages.size() == 0) {
                errors.add("Workflow configuration must have at least one stage");
            } else {
                validateStages(stages, errors);
            }
        }

        // Validate validation rules if present
        if (config.has("validationRules")) {
            validateValidationRules(config.get("validationRules"), errors);
        }

        // Validate assignment rules if present
        if (config.has("assignmentRules")) {
            validateAssignmentRules(config.get("assignmentRules"), errors);
        }
    }

    /**
     * Validate stages structure
     */
    private void validateStages(JsonNode stages, List<String> errors) {
        Set<String> stageNames = new HashSet<>();
        Set<Integer> stageOrders = new HashSet<>();

        for (int i = 0; i < stages.size(); i++) {
            JsonNode stage = stages.get(i);
            String stagePrefix = "Stage " + (i + 1);

            // Validate required stage fields
            if (!stage.has("name") || stage.get("name").asText().trim().isEmpty()) {
                errors.add(stagePrefix + " must have a name");
            } else {
                String stageName = stage.get("name").asText();
                if (stageNames.contains(stageName)) {
                    errors.add("Duplicate stage name: " + stageName);
                }
                stageNames.add(stageName);
            }

            if (!stage.has("displayName") || stage.get("displayName").asText().trim().isEmpty()) {
                errors.add(stagePrefix + " must have a displayName");
            }

            if (stage.has("order")) {
                int order = stage.get("order").asInt();
                if (stageOrders.contains(order)) {
                    errors.add("Duplicate stage order: " + order);
                }
                stageOrders.add(order);
            }

            // Validate tasks
            if (!stage.has("tasks")) {
                errors.add(stagePrefix + " must have tasks");
            } else {
                JsonNode tasks = stage.get("tasks");
                if (!tasks.isArray() || tasks.size() == 0) {
                    errors.add(stagePrefix + " must have at least one task");
                } else {
                    validateTasks(tasks, stagePrefix, errors);
                }
            }
        }
    }

    /**
     * Validate tasks structure
     */
    private void validateTasks(JsonNode tasks, String stagePrefix, List<String> errors) {
        Set<String> taskTypes = new HashSet<>();

        for (int i = 0; i < tasks.size(); i++) {
            JsonNode task = tasks.get(i);
            String taskPrefix = stagePrefix + " Task " + (i + 1);

            // Validate required task fields
            if (!task.has("type") || task.get("type").asText().trim().isEmpty()) {
                errors.add(taskPrefix + " must have a type");
            } else {
                String taskType = task.get("type").asText();
                if (taskTypes.contains(taskType)) {
                    errors.add("Duplicate task type in " + stagePrefix + ": " + taskType);
                }
                taskTypes.add(taskType);
            }

            if (!task.has("displayName") || task.get("displayName").asText().trim().isEmpty()) {
                errors.add(taskPrefix + " must have a displayName");
            }

            // Validate ownerTypes if present
            if (task.has("ownerTypes")) {
                JsonNode ownerTypes = task.get("ownerTypes");
                if (ownerTypes.isArray() && ownerTypes.size() == 0) {
                    errors.add(taskPrefix + " ownerTypes cannot be empty if specified");
                }
            }

            // Validate estimatedDurationHours if present
            if (task.has("estimatedDurationHours")) {
                int duration = task.get("estimatedDurationHours").asInt();
                if (duration <= 0) {
                    errors.add(taskPrefix + " estimatedDurationHours must be positive");
                }
            }

            // Validate priority if present
            if (task.has("priority")) {
                int priority = task.get("priority").asInt();
                if (priority < 1 || priority > 5) {
                    errors.add(taskPrefix + " priority must be between 1 and 5");
                }
            }
        }
    }

    /**
     * Validate validation rules structure
     */
    private void validateValidationRules(JsonNode validationRules, List<String> errors) {
        if (!validationRules.isObject()) {
            errors.add("Validation rules must be an object");
            return;
        }

        validationRules.fieldNames().forEachRemaining(ruleName -> {
            JsonNode rule = validationRules.get(ruleName);
            if (!rule.has("type") || rule.get("type").asText().trim().isEmpty()) {
                errors.add("Validation rule '" + ruleName + "' must have a type");
            }

            if (!rule.has("description") || rule.get("description").asText().trim().isEmpty()) {
                errors.add("Validation rule '" + ruleName + "' must have a description");
            }
        });
    }

    /**
     * Validate assignment rules structure
     */
    private void validateAssignmentRules(JsonNode assignmentRules, List<String> errors) {
        if (!assignmentRules.isObject()) {
            errors.add("Assignment rules must be an object");
            return;
        }

        if (assignmentRules.has("maxConcurrentTasksPerAdmin")) {
            int maxTasks = assignmentRules.get("maxConcurrentTasksPerAdmin").asInt();
            if (maxTasks <= 0) {
                errors.add("maxConcurrentTasksPerAdmin must be positive");
            }
        }

        if (assignmentRules.has("taskTimeoutHours")) {
            int timeout = assignmentRules.get("taskTimeoutHours").asInt();
            if (timeout <= 0) {
                errors.add("taskTimeoutHours must be positive");
            }
        }
    }

    /**
     * Validate version and deployment information
     */
    private void validateVersionAndDeployment(WorkflowDefinition definition, List<String> errors) {
        // Validate deployment ID format
        if (definition.getDeploymentId() != null &&
                !definition.getDeploymentId().matches("^[a-zA-Z0-9\\-_]+$")) {
            errors.add("Deployment ID must contain only alphanumeric characters, hyphens, and underscores");
        }

        // Validate version consistency
        if (definition.getWorkflowConfig() != null &&
                definition.getWorkflowConfig().has("version")) {
            String configVersion = definition.getWorkflowConfig().get("version").asText();
            if (configVersion != null && !configVersion.trim().isEmpty()) {
                // Could add version format validation here
            }
        }
    }


    /**
     * Validate multiple workflow definitions
     * @param definitions list of workflow definitions to validate
     * @return Mono that completes successfully if all are valid
     */
    public Mono<Void> validateWorkflowDefinitions(List<WorkflowDefinition> definitions) {
        if (definitions == null || definitions.isEmpty()) {
            return Mono.error(new ClientWorkflowException(
                    "unknown",
                    "NO_DEFINITIONS",
                    "No workflow definitions to validate"
            ));
        }

        return Mono.fromCallable(() -> {
            log.info("🔍 Validating {} workflow definitions", definitions.size());

            Set<String> definitionKeys = new HashSet<>();
            Set<String> deploymentIds = new HashSet<>();
            List<String> globalErrors = new ArrayList<>();

            for (WorkflowDefinition definition : definitions) {
                // Check for duplicate definition keys
                if (definitionKeys.contains(definition.getDefinitionKey())) {
                    globalErrors.add("Duplicate definition key: " + definition.getDefinitionKey());
                }
                definitionKeys.add(definition.getDefinitionKey());

                // Check for duplicate deployment IDs
                if (deploymentIds.contains(definition.getDeploymentId())) {
                    globalErrors.add("Duplicate deployment ID: " + definition.getDeploymentId());
                }
                deploymentIds.add(definition.getDeploymentId());

                // Validate individual definition
                try {
                    validateWorkflowDefinition(definition).block();
                } catch (Exception e) {
                    globalErrors.add("Definition " + definition.getDefinitionKey() + ": " + e.getMessage());
                }
            }

            if (!globalErrors.isEmpty()) {
                String errorMessage = "Multiple workflow definitions validation failed: " +
                        String.join(", ", globalErrors);
                log.error("❌ Multiple definitions validation failed: {}", errorMessage);
                throw new ClientWorkflowException(
                        definitions.get(0).getClientId(),
                        "BULK_VALIDATION_FAILED",
                        errorMessage
                );
            }

            log.info("✅ All {} workflow definitions validated successfully", definitions.size());
            return null;
        });
    }
}