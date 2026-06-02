package com.uniflow.student.entity;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * ProfileBuilderConfig entity representing dynamic profile builder configurations
 *
 * <p>This entity stores profile builder step configurations in a flexible JSONB structure
 * allowing runtime modification of steps, fields, and validation rules per client.
 *
 * <p>Supports multiple versions and activation management for safe configuration updates.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("profile_builder_configs")
public class ProfileBuilderConfig {

    @Id
    private Long id;

    /** Client identifier (e.g., "uni360", "client_xyz") */
    @Column("client_id")
    private String clientId;

    /** Human-readable configuration name */
    @Column("config_name")
    private String configName;

    /** Configuration description */
    @Column("config_description")
    private String configDescription;

    /** Configuration version (e.g., "1.0.0", "2.1.0") */
    @Column("version")
    @Builder.Default
    private String version = "1.0.0";

    /**
     * Complete profile builder configuration stored as JSONB
     *
     * <p>Structure example:
     * {
     *   "steps": [
     *     {
     *       "step_id": "basic_info",
     *       "title": "Basic Information",
     *       "description": "Provide your personal details",
     *       "order": 1,
     *       "required": true,
     *       "estimated_time_minutes": 10,
     *       "fields": [
     *         {
     *           "name": "phone",
     *           "type": "text",
     *           "label": "Phone Number",
     *           "required": true,
     *           "validation": {
     *             "pattern": "^\\+?[1-9]\\d{1,14}$",
     *             "message": "Invalid phone number format"
     *           }
     *         }
     *       ]
     *     }
     *   ]
     * }
     */
    @Column("config_data")
    private JsonNode configData;

    /** Whether this configuration is currently active */
    @Column("is_active")
    @Builder.Default
    private Boolean isActive = false;

    /** Whether this is the default configuration for the client */
    @Column("is_default")
    @Builder.Default
    private Boolean isDefault = false;

    /** User ID who created this configuration */
    @Column("created_by")
    private Long createdBy;

    /** User ID who last updated this configuration */
    @Column("updated_by")
    private Long updatedBy;

    /** Timestamp when configuration was created */
    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    /** Timestamp when configuration was last updated */
    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;

    /** Soft delete flag */
    @Column("deleted")
    @Builder.Default
    private Boolean deleted = false;

    /**
     * Get step order from configuration data
     *
     * @return List of step IDs in order, or empty list if not configured
     */
    public java.util.List<String> getStepOrder() {
        if (configData == null || !configData.has("steps")) {
            return java.util.Collections.emptyList();
        }

        java.util.List<String> stepOrder = new java.util.ArrayList<>();
        configData.get("steps").forEach(step -> {
            if (step.has("step_id")) {
                stepOrder.add(step.get("step_id").asText());
            }
        });

        return stepOrder;
    }

    /**
     * Get specific step configuration by step ID
     *
     * @param stepId The step identifier
     * @return JsonNode containing step configuration, or null if not found
     */
    public JsonNode getStepConfig(String stepId) {
        if (configData == null || !configData.has("steps")) {
            return null;
        }

        for (JsonNode step : configData.get("steps")) {
            if (step.has("step_id") && step.get("step_id").asText().equals(stepId)) {
                return step;
            }
        }

        return null;
    }

    /**
     * Get total number of steps in configuration
     *
     * @return Number of steps configured
     */
    public int getTotalSteps() {
        if (configData == null || !configData.has("steps")) {
            return 0;
        }

        return configData.get("steps").size();
    }

    /**
     * Check if configuration is valid
     *
     * @return true if configuration has required fields
     */
    public boolean isValid() {
        return clientId != null &&
               !clientId.isEmpty() &&
               configData != null &&
               configData.has("steps") &&
               configData.get("steps").isArray() &&
               configData.get("steps").size() > 0;
    }

    /**
     * Get all required fields from a specific step
     *
     * @param stepId The step identifier
     * @return List of required field names
     */
    public java.util.List<String> getRequiredFields(String stepId) {
        JsonNode stepConfig = getStepConfig(stepId);
        if (stepConfig == null || !stepConfig.has("fields")) {
            return java.util.Collections.emptyList();
        }

        java.util.List<String> requiredFields = new java.util.ArrayList<>();
        stepConfig.get("fields").forEach(field -> {
            if (field.has("required") && field.get("required").asBoolean() && field.has("name")) {
                requiredFields.add(field.get("name").asText());
            }
        });

        return requiredFields;
    }
}
