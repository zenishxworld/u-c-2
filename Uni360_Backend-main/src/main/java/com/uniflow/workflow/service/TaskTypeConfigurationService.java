package com.uniflow.workflow.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * TaskTypeConfigurationService - Dynamic task type configuration management
 *
 * <p>This service loads and manages task type configurations from JSON files,
 * providing dynamic task type information without requiring code changes.
 *
 * <p>Features:
 * - Load task types from configurable JSON file
 * - Filter task types by country, category, automation level
 * - Provide validation rules and metadata
 * - Support for country-specific task requirements
 * - Cache configuration for performance
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TaskTypeConfigurationService {

    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper;

    @Value("${app.task-types.config-file:classpath:config/task-types.json}")
    private String configFile;

    private TaskTypeConfiguration configuration;

    /**
     * Load task type configuration from JSON file on service initialization
     */
    @PostConstruct
    public void loadTaskTypes() {
        try {
            log.info("Loading task type configuration from: {}", configFile);

            Resource resource = resourceLoader.getResource(configFile);
            if (!resource.exists()) {
                log.error("Task type configuration file not found: {}", configFile);
                throw new RuntimeException("Task type configuration file not found: " + configFile);
            }

            JsonNode configNode = objectMapper.readTree(resource.getInputStream());
            configuration = parseConfiguration(configNode);

            log.info("Successfully loaded {} task types from configuration",
                    configuration.getTaskTypes().size());

        } catch (IOException e) {
            log.error("Failed to load task type configuration: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to load task type configuration", e);
        }
    }

    /**
     * Get all available task types
     */
    public List<TaskTypeConfig> getAllTaskTypes() {
        ensureConfigurationLoaded();
        return new ArrayList<>(configuration.getTaskTypes());
    }

    /**
     * Get task types filtered by country
     */
    public List<TaskTypeConfig> getTaskTypesByCountry(String countryCode) {
        ensureConfigurationLoaded();

        if (countryCode == null || countryCode.isEmpty()) {
            return getAllTaskTypes();
        }

        return configuration.getTaskTypes().stream()
            .filter(taskType ->
                !taskType.isCountrySpecific() ||
                (taskType.getCountryCode() != null && taskType.getCountryCode().equals(countryCode)) ||
                (taskType.getCountryCode() == null && taskType.isCountrySpecific())
            )
            .collect(Collectors.toList());
    }

    /**
     * Get task types by category
     */
    public List<TaskTypeConfig> getTaskTypesByCategory(String category) {
        ensureConfigurationLoaded();

        if (category == null || category.isEmpty()) {
            return getAllTaskTypes();
        }

        return configuration.getTaskTypes().stream()
            .filter(taskType -> category.equals(taskType.getCategory()))
            .collect(Collectors.toList());
    }

    /**
     * Get task types by automation level
     */
    public List<TaskTypeConfig> getTaskTypesByAutomationLevel(String automationLevel) {
        ensureConfigurationLoaded();

        if (automationLevel == null || automationLevel.isEmpty()) {
            return getAllTaskTypes();
        }

        return configuration.getTaskTypes().stream()
            .filter(taskType -> automationLevel.equals(taskType.getAutomationLevel()))
            .collect(Collectors.toList());
    }

    /**
     * Get specific task type by code
     */
    public TaskTypeConfig getTaskType(String code) {
        ensureConfigurationLoaded();

        return configuration.getTaskTypes().stream()
            .filter(taskType -> code.equals(taskType.getCode()))
            .findFirst()
            .orElse(null);
    }

    /**
     * Get all categories
     */
    public List<CategoryConfig> getCategories() {
        ensureConfigurationLoaded();
        return new ArrayList<>(configuration.getCategories());
    }

    /**
     * Get all automation levels
     */
    public List<AutomationLevelConfig> getAutomationLevels() {
        ensureConfigurationLoaded();
        return new ArrayList<>(configuration.getAutomationLevels());
    }

    /**
     * Get country-specific task information
     */
    public Map<String, CountryTaskConfig> getCountrySpecificTasks() {
        ensureConfigurationLoaded();
        return configuration.getCountrySpecificTasks();
    }

    /**
     * Get country-specific tasks for a specific country
     */
    public CountryTaskConfig getCountryTasks(String countryCode) {
        ensureConfigurationLoaded();
        return configuration.getCountrySpecificTasks().get(countryCode);
    }

    /**
     * Get priority levels
     */
    public List<PriorityLevelConfig> getPriorityLevels() {
        ensureConfigurationLoaded();
        return new ArrayList<>(configuration.getPriorityLevels());
    }

    /**
     * Get configuration metadata
     */
    public Map<String, Object> getMetadata() {
        ensureConfigurationLoaded();
        return configuration.getMetadata();
    }

    /**
     * Reload configuration from file (for runtime updates)
     */
    public void reloadConfiguration() {
        log.info("Reloading task type configuration");
        loadTaskTypes();
    }

    /**
     * Validate if task type code exists
     */
    public boolean isValidTaskType(String code) {
        return getTaskType(code) != null;
    }

    /**
     * Get task types that require specialist permissions
     */
    public List<TaskTypeConfig> getSpecialistTasks() {
        ensureConfigurationLoaded();
        return configuration.getTaskTypes().stream()
            .filter(TaskTypeConfig::isRequiresSpecialist)
            .collect(Collectors.toList());
    }

    // Private helper methods

    private void ensureConfigurationLoaded() {
        if (configuration == null) {
            loadTaskTypes();
        }
    }

    private TaskTypeConfiguration parseConfiguration(JsonNode configNode) {
        TaskTypeConfiguration config = new TaskTypeConfiguration();

        // Parse task types
        if (configNode.has("taskTypes")) {
            JsonNode taskTypesNode = configNode.get("taskTypes");
            List<TaskTypeConfig> taskTypes = new ArrayList<>();

            for (JsonNode taskTypeNode : taskTypesNode) {
                TaskTypeConfig taskType = parseTaskType(taskTypeNode);
                taskTypes.add(taskType);
            }
            config.setTaskTypes(taskTypes);
        }

        // Parse categories
        if (configNode.has("categories")) {
            JsonNode categoriesNode = configNode.get("categories");
            List<CategoryConfig> categories = new ArrayList<>();

            for (JsonNode categoryNode : categoriesNode) {
                CategoryConfig category = parseCategoryConfig(categoryNode);
                categories.add(category);
            }
            config.setCategories(categories);
        }

        // Parse automation levels
        if (configNode.has("automationLevels")) {
            JsonNode automationLevelsNode = configNode.get("automationLevels");
            List<AutomationLevelConfig> automationLevels = new ArrayList<>();

            for (JsonNode automationLevelNode : automationLevelsNode) {
                AutomationLevelConfig automationLevel = parseAutomationLevelConfig(automationLevelNode);
                automationLevels.add(automationLevel);
            }
            config.setAutomationLevels(automationLevels);
        }

        // Parse country-specific tasks
        if (configNode.has("countrySpecificTasks")) {
            JsonNode countryTasksNode = configNode.get("countrySpecificTasks");
            Map<String, CountryTaskConfig> countryTasks = objectMapper.convertValue(
                countryTasksNode,
                objectMapper.getTypeFactory().constructMapType(Map.class, String.class, CountryTaskConfig.class)
            );
            config.setCountrySpecificTasks(countryTasks);
        }

        // Parse priority levels
        if (configNode.has("priorityLevels")) {
            JsonNode priorityLevelsNode = configNode.get("priorityLevels");
            List<PriorityLevelConfig> priorityLevels = new ArrayList<>();

            for (JsonNode priorityLevelNode : priorityLevelsNode) {
                PriorityLevelConfig priorityLevel = parsePriorityLevelConfig(priorityLevelNode);
                priorityLevels.add(priorityLevel);
            }
            config.setPriorityLevels(priorityLevels);
        }

        // Parse metadata
        if (configNode.has("metadata")) {
            Map<String, Object> metadata = objectMapper.convertValue(
                configNode.get("metadata"),
                objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class)
            );
            config.setMetadata(metadata);
        }

        return config;
    }

    private TaskTypeConfig parseTaskType(JsonNode taskTypeNode) {
        TaskTypeConfig taskType = new TaskTypeConfig();

        taskType.setCode(taskTypeNode.get("code").asText());
        taskType.setDisplayName(taskTypeNode.get("displayName").asText());
        taskType.setDescription(taskTypeNode.get("description").asText());
        taskType.setOwner(taskTypeNode.get("owner").asText());
        taskType.setCategory(taskTypeNode.get("category").asText());
        taskType.setAutomationLevel(taskTypeNode.get("automationLevel").asText());

        if (taskTypeNode.has("estimatedDurationHours")) {
            taskType.setEstimatedDurationHours(taskTypeNode.get("estimatedDurationHours").asDouble());
        }
        if (taskTypeNode.has("estimatedDurationDays")) {
            taskType.setEstimatedDurationDays(taskTypeNode.get("estimatedDurationDays").asInt());
        }

        taskType.setPriority(taskTypeNode.get("priority").asInt());
        taskType.setRequiresSpecialist(taskTypeNode.get("requiresSpecialist").asBoolean());
        taskType.setCountrySpecific(taskTypeNode.get("countrySpecific").asBoolean());

        if (taskTypeNode.has("countryCode")) {
            taskType.setCountryCode(taskTypeNode.get("countryCode").asText());
        }

        // Parse required permissions
        if (taskTypeNode.has("requiredPermissions")) {
            List<String> permissions = new ArrayList<>();
            for (JsonNode permissionNode : taskTypeNode.get("requiredPermissions")) {
                permissions.add(permissionNode.asText());
            }
            taskType.setRequiredPermissions(permissions);
        }

        // Parse validation rules
        if (taskTypeNode.has("validationRules")) {
            Map<String, Object> validationRules = objectMapper.convertValue(
                taskTypeNode.get("validationRules"),
                objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class)
            );
            taskType.setValidationRules(validationRules);
        }

        // Parse additional fields
        if (taskTypeNode.has("studentInstructions")) {
            taskType.setStudentInstructions(taskTypeNode.get("studentInstructions").asText());
        }

        if (taskTypeNode.has("paymentDetails")) {
            Map<String, Object> paymentDetails = objectMapper.convertValue(
                taskTypeNode.get("paymentDetails"),
                objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class)
            );
            taskType.setPaymentDetails(paymentDetails);
        }

        return taskType;
    }

    private CategoryConfig parseCategoryConfig(JsonNode categoryNode) {
        CategoryConfig category = new CategoryConfig();
        category.setCode(categoryNode.get("code").asText());
        category.setDisplayName(categoryNode.get("displayName").asText());
        category.setDescription(categoryNode.get("description").asText());
        return category;
    }

    private AutomationLevelConfig parseAutomationLevelConfig(JsonNode automationLevelNode) {
        AutomationLevelConfig automationLevel = new AutomationLevelConfig();
        automationLevel.setCode(automationLevelNode.get("code").asText());
        automationLevel.setDisplayName(automationLevelNode.get("displayName").asText());
        automationLevel.setDescription(automationLevelNode.get("description").asText());
        return automationLevel;
    }

    private PriorityLevelConfig parsePriorityLevelConfig(JsonNode priorityLevelNode) {
        PriorityLevelConfig priorityLevel = new PriorityLevelConfig();
        priorityLevel.setLevel(priorityLevelNode.get("level").asInt());
        priorityLevel.setDisplayName(priorityLevelNode.get("displayName").asText());
        priorityLevel.setDescription(priorityLevelNode.get("description").asText());
        priorityLevel.setSlaHours(priorityLevelNode.get("slaHours").asInt());
        return priorityLevel;
    }

    // Configuration classes

    @lombok.Data
    public static class TaskTypeConfiguration {
        private List<TaskTypeConfig> taskTypes = new ArrayList<>();
        private List<CategoryConfig> categories = new ArrayList<>();
        private List<AutomationLevelConfig> automationLevels = new ArrayList<>();
        private Map<String, CountryTaskConfig> countrySpecificTasks = new java.util.HashMap<>();
        private List<PriorityLevelConfig> priorityLevels = new ArrayList<>();
        private Map<String, Object> metadata = new java.util.HashMap<>();
    }

    @lombok.Data
    public static class TaskTypeConfig {
        private String code;
        private String displayName;
        private String description;
        private String owner;
        private String category;
        private String automationLevel;
        private Double estimatedDurationHours;
        private Integer estimatedDurationDays;
        private Integer priority;
        private boolean requiresSpecialist;
        private boolean countrySpecific;
        private String countryCode;
        private List<String> requiredPermissions = new ArrayList<>();
        private Map<String, Object> validationRules = new java.util.HashMap<>();
        private String studentInstructions;
        private Map<String, Object> paymentDetails = new java.util.HashMap<>();
    }

    @lombok.Data
    public static class CategoryConfig {
        private String code;
        private String displayName;
        private String description;
    }

    @lombok.Data
    public static class AutomationLevelConfig {
        private String code;
        private String displayName;
        private String description;
    }

    @lombok.Data
    public static class CountryTaskConfig {
        private String displayName;
        private List<String> tasks = new ArrayList<>();
        private List<String> specialRequirements = new ArrayList<>();
    }

    @lombok.Data
    public static class PriorityLevelConfig {
        private Integer level;
        private String displayName;
        private String description;
        private Integer slaHours;
    }
}
