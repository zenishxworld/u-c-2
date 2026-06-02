package com.uniflow.student.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTOs for Profile Builder Configuration Management
 * Supports CRUD operations for dynamic profile builder configurations
 */
public class ProfileBuilderConfigDto {

    /**
     * Request DTO for creating a new profile builder configuration
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CreateConfigRequest {
        private String clientId;
        private String configName;
        private String configDescription;
        private String version;
        private JsonNode configData;
        private Boolean isDefault;
    }

    /**
     * Request DTO for updating an existing profile builder configuration
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UpdateConfigRequest {
        private String configName;
        private String configDescription;
        private JsonNode configData;
        private Boolean isDefault;
    }

    /**
     * Response DTO for profile builder configuration
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ConfigResponse {
        private boolean success;
        private String message;
        private ConfigData data;
    }

    /**
     * Configuration data details
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ConfigData {
        private Long id;
        private String clientId;
        private String configName;
        private String configDescription;
        private String version;
        private JsonNode configData;
        private Boolean isActive;
        private Boolean isDefault;
        private Long createdBy;
        private Long updatedBy;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Integer totalSteps;
        private List<String> stepOrder;
    }

    /**
     * Response DTO for list of configurations
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ConfigListResponse {
        private boolean success;
        private String message;
        private List<ConfigData> data;
        private Integer totalCount;
    }

    /**
     * Request DTO for activating a configuration
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ActivateConfigRequest {
        private Long configId;
    }

    /**
     * Response DTO for activation operation
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ActivateConfigResponse {
        private boolean success;
        private String message;
        private Long activatedConfigId;
        private String clientId;
        private String version;
    }

    /**
     * Response DTO for delete operation
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DeleteConfigResponse {
        private boolean success;
        private String message;
        private Long deletedConfigId;
    }

    /**
     * DTO for YAML configuration upload
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class YamlConfigUploadRequest {
        private String clientId;
        private String yamlContent;
        private Boolean autoActivate;
    }

    /**
     * Response DTO for step definitions query
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StepDefinitionsResponse {
        private boolean success;
        private String message;
        private List<StepDefinition> steps;
        private List<String> stepOrder;
        private String clientId;
        private String version;
    }

    /**
     * Step definition details
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StepDefinition {
        private String stepId;
        private String title;
        private String description;
        private Integer order;
        private Boolean required;
        private Integer estimatedTimeMinutes;
        private List<FieldDefinition> fields;
    }

    /**
     * Field definition details
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class FieldDefinition {
        private String name;
        private String type;
        private String label;
        private String placeholder;
        private Boolean required;
        private String helpText;
        private List<String> options;
        private ValidationRule validation;
        private Boolean conditional;
        private JsonNode conditionalLogic;
        private JsonNode metadata;
    }

    /**
     * Validation rule details
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ValidationRule {
        private String pattern;
        private String message;
        private Integer minLength;
        private Integer maxLength;
        private Integer min;
        private Integer max;
        private Integer minAge;
        private Integer maxAge;
        private Boolean mustBeTrue;
    }

    /**
     * Configuration statistics response
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ConfigStatsResponse {
        private boolean success;
        private String message;
        private ConfigStats stats;
    }

    /**
     * Configuration statistics data
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ConfigStats {
        private String clientId;
        private Integer totalConfigs;
        private Integer activeConfigs;
        private Integer inactiveConfigs;
        private String activeVersion;
        private String defaultVersion;
        private LocalDateTime lastUpdated;
    }
}
