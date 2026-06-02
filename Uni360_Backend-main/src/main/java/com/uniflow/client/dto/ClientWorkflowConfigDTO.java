package com.uniflow.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for client workflow configuration loaded from YAML files
 * Represents the complete client configuration including workflows, validation rules, etc.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ClientWorkflowConfigDTO {

    @JsonProperty("client_id")
    private String clientId;

    private String name;
    private String description;
    private List<WorkflowConfigDTO> workflows;

    /**
     * Validate the configuration
     * @return true if valid, false otherwise
     */
    public boolean isValid() {
        return (
            clientId != null &&
            !clientId.trim().isEmpty() &&
            name != null &&
            !name.trim().isEmpty() &&
            workflows != null &&
            !workflows.isEmpty() &&
            workflows.stream().allMatch(WorkflowConfigDTO::isValid)
        );
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WorkflowConfigDTO {

        @JsonProperty("workflowDefinitionKey")
        private String workflowDefinitionKey;

        private String name;

        @JsonProperty("countryCode")
        private String countryCode;

        @JsonProperty("degreeLevel")
        private String degreeLevel;

        private String description;
        private List<StageConfigDTO> stages;

        @JsonProperty("validationRules")
        private Map<String, ValidationRuleDTO> validationRules;

        @JsonProperty("assignmentRules")
        private AssignmentRulesDTO assignmentRules;

        private NotificationConfigDTO notifications;

        public boolean isValid() {
            return (
                workflowDefinitionKey != null &&
                !workflowDefinitionKey.trim().isEmpty() &&
                name != null &&
                !name.trim().isEmpty() &&
                countryCode != null &&
                !countryCode.trim().isEmpty() &&
                degreeLevel != null &&
                !degreeLevel.trim().isEmpty() &&
                stages != null &&
                !stages.isEmpty()
            );
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class StageConfigDTO {

        private String name;

        @JsonProperty("displayName")
        private String displayName;

        private Integer order;
        private String description;
        private List<TaskConfigDTO> tasks;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TaskConfigDTO {

        private String type;

        @JsonProperty("displayName")
        private String displayName;

        private String description;

        @JsonProperty("validationRule")
        private String validationRule;

        @JsonProperty("ownerTypes")
        private List<String> ownerTypes;

        @JsonProperty("estimatedDurationHours")
        private Integer estimatedDurationHours;

        private Integer priority;

        @JsonProperty("requiredPermissions")
        private List<String> requiredPermissions;

        @JsonProperty("requiredFlags")
        private List<String> requiredFlags;

        @JsonProperty("requiredDocuments")
        private List<String> requiredDocuments;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ValidationRuleDTO {

        private String type;
        private String description;

        @JsonProperty("requiredFields")
        private List<String> requiredFields;

        @JsonProperty("requiredDocuments")
        private List<String> requiredDocuments;

        @JsonProperty("validationMessage")
        private String validationMessage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AssignmentRulesDTO {

        @JsonProperty("defaultAdminSelection")
        private String defaultAdminSelection;

        @JsonProperty("fallbackSelection")
        private String fallbackSelection;

        @JsonProperty("maxConcurrentTasksPerAdmin")
        private Integer maxConcurrentTasksPerAdmin;

        @JsonProperty("taskTimeoutHours")
        private Integer taskTimeoutHours;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class NotificationConfigDTO {

        @JsonProperty("taskCreated")
        private Boolean taskCreated;

        @JsonProperty("taskClaimed")
        private Boolean taskClaimed;

        @JsonProperty("taskCompleted")
        private Boolean taskCompleted;

        @JsonProperty("stageCompleted")
        private Boolean stageCompleted;

        @JsonProperty("workflowCompleted")
        private Boolean workflowCompleted;

        @JsonProperty("overdueTasks")
        private Boolean overdueTasks;
    }
}
