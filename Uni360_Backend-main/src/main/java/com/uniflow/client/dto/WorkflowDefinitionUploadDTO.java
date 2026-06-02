package com.uniflow.client.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for Workflow Definition Upload API
 *
 * <p>This DTO handles requests for uploading new workflow definitions through the REST API.
 * It includes validation rules and supports both JSON and YAML workflow configurations.
 *
 * <p>Key Features:
 * - Client ID validation for multi-tenant support
 * - Country code and degree level validation
 * - Flexible workflow configuration support (JSON/YAML)
 * - Deployment tracking with unique deployment IDs
 * - Audit trail with uploaded_by field
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-01
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowDefinitionUploadDTO {

    /**
     * Client identifier (uni360, uniflow, etc.)
     * Used for multi-tenant workflow configuration
     */
    @NotBlank(message = "Client ID is required")
    @Pattern(
        regexp = "^(uni360|uniflow|DEFAULT)$",
        message = "Invalid client ID. Must be uni360, uniflow, or DEFAULT"
    )
    @JsonProperty("client_id")
    private String clientId;

    /**
     * ISO country code (DE, US, UK, etc.)
     * Use "DEFAULT" for fallback workflows
     */
    @NotBlank(message = "Country code is required")
    @Pattern(
        regexp = "^([A-Z]{2}|DEFAULT)$",
        message = "Invalid country code. Must be 2-letter ISO code or DEFAULT"
    )
    @JsonProperty("country_code")
    private String countryCode;

    /**
     * Academic degree level (BACHELOR, MASTERS, DOCTORATE, etc.)
     * Use "DEFAULT" for fallback workflows
     */
    @NotBlank(message = "Degree level is required")
    @Pattern(
        regexp = "^(BACHELOR|MASTERS|DOCTORATE|DIPLOMA|CERTIFICATE|DEFAULT)$",
        message = "Invalid degree level. Must be BACHELOR, MASTERS, DOCTORATE, DIPLOMA, CERTIFICATE, or DEFAULT"
    )
    @JsonProperty("degree_level")
    private String degreeLevel;

    /**
     * Unique deployment identifier
     * Used for tracking and version management
     */
    @Size(max = 100, message = "Deployment ID cannot exceed 100 characters")
    @JsonProperty("deployment_id")
    private String deploymentId;

    /**
     * Complete workflow configuration as JSON object
     * Contains stages, tasks, validation rules, assignment rules, notifications
     */
    @NotNull(message = "Workflow configuration is required")
    @JsonProperty("workflow_config")
    private JsonNode workflowConfig;

    /**
     * User who uploaded this workflow definition
     * Used for audit trail and access control
     */
    @NotBlank(message = "Uploaded by is required")
    @Size(max = 100, message = "Uploaded by cannot exceed 100 characters")
    @JsonProperty("uploaded_by")
    private String uploadedBy;

    /**
     * Optional workflow name override
     * If not provided, name will be extracted from workflow configuration
     */
    @Size(max = 200, message = "Workflow name cannot exceed 200 characters")
    @JsonProperty("workflow_name")
    private String workflowName;

    /**
     * Optional description override
     * If not provided, description will be extracted from workflow configuration
     */
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    @JsonProperty("description")
    private String description;

    /**
     * Force upload flag - overrides existing active workflows
     * Use with caution in production environments
     */
    @Builder.Default
    @JsonProperty("force_upload")
    private Boolean forceUpload = false;

    /**
     * Validation method to ensure DTO is valid for processing
     *
     * @return true if all required fields are present and valid
     */
    public boolean isValid() {
        return (
            clientId != null &&
            !clientId.trim().isEmpty() &&
            countryCode != null &&
            !countryCode.trim().isEmpty() &&
            degreeLevel != null &&
            !degreeLevel.trim().isEmpty() &&
            workflowConfig != null &&
            !workflowConfig.isEmpty() &&
            uploadedBy != null &&
            !uploadedBy.trim().isEmpty()
        );
    }

    /**
     * Generates a unique workflow definition key based on client, country, and degree
     *
     * @return formatted workflow definition key
     */
    public String generateWorkflowDefinitionKey() {
        return String.format(
            "%s_%s_%s_WORKFLOW",
            clientId.toUpperCase(),
            countryCode.toUpperCase(),
            degreeLevel.toUpperCase()
        );
    }

    /**
     * Validates that the workflow configuration is valid JSON
     *
     * @return true if workflow configuration is valid JSON
     */
    public boolean hasValidWorkflowConfig() {
        return workflowConfig != null && !workflowConfig.isEmpty();
    }

    /**
     * Extracts workflow name from configuration if not provided
     *
     * @return workflow name from configuration or generated name
     */
    public String getEffectiveWorkflowName() {
        if (workflowName != null && !workflowName.trim().isEmpty()) {
            return workflowName;
        }

        // Try to extract from workflow configuration
        if (workflowConfig != null && workflowConfig.has("name")) {
            return workflowConfig.get("name").asText();
        }

        // Generate default name
        return String.format(
            "%s %s %s Workflow",
            clientId.substring(0, 1).toUpperCase() +
                clientId.substring(1).toLowerCase(),
            countryCode,
            degreeLevel.substring(0, 1).toUpperCase() +
                degreeLevel.substring(1).toLowerCase()
        );
    }

    /**
     * Extracts workflow description from configuration if not provided
     *
     * @return workflow description from configuration or generated description
     */
    public String getEffectiveDescription() {
        if (description != null && !description.trim().isEmpty()) {
            return description;
        }

        // Try to extract from workflow configuration
        if (workflowConfig != null && workflowConfig.has("description")) {
            return workflowConfig.get("description").asText();
        }

        // Generate default description
        return String.format(
            "Workflow for %s client, %s country, %s degree level",
            clientId,
            countryCode,
            degreeLevel
        );
    }

    /**
     * Gets the workflow configuration as a JSON string for database storage
     *
     * @return workflow configuration as JSON string
     */
    public String getWorkflowConfigAsString() {
        if (workflowConfig == null) {
            return null;
        }
        return workflowConfig.toString();
    }
}
