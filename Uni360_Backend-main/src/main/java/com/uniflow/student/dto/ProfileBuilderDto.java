package com.uniflow.student.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Profile Builder DTOs for step-by-step profile creation Based on Django profile_builder_dto.py
 * from services/students/
 */
public class ProfileBuilderDto {

    /** Response DTO for profile builder overview */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ProfileBuilderOverviewResponse {

        private boolean success;
        private String message;
        private OverviewData overview;
        private List<StepStatus> stepsStatus;
        private ProgressData progress;
    }

    /** Overview data containing completion information */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class OverviewData {

        private int completionPercentage;
        private int totalSteps;
        private int completedSteps;
        private String workflowStage;
        private String currentStep;
        private boolean isComplete;
        private String profileStatus;
        private long estimatedTimeMinutes;
    }

    /** Step status information */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StepStatus {

        private String stepId;
        private String title;
        private boolean completed;
        private boolean required;
        private int estimatedTimeMinutes;
        private int order;
        private List<String> dependencies;
        private Map<String, Object> metadata;
    }

    /** Progress tracking data */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ProgressData {

        private int current;
        private int total;
        private int percentage;
        private String stage;
        private String currentStep;
        private List<String> completedSteps;
        private List<String> remainingSteps;

        public ProgressData getProgress(Object data) {
            return this;
        }
    }

    /** Current step response with form data */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CurrentStepResponse {

        private boolean success;
        private String message;
        private boolean completed;
        private int completionPercentage;
        private FormData formData;
        private ProgressData progress;
        private StepMetadata metadata;

        public boolean isCompleted() {
            return this.completed;
        }
    }

    /** Form data for current step */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class FormData {

        private String stepId;
        private String title;
        private String description;
        private List<FormField> fields;
        private Map<String, Object> existingData;
        private boolean isCompleted;
        private int estimatedTimeMinutes;
        private List<String> requiredFields;
        private Map<String, Object> requestBodyTemplate;
    }

    /** Form field definition */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class FormField {

        private String name;
        private String type; // text, select, multiselect, number, boolean, array, object, textarea, date
        private String label;
        private String placeholder;
        private boolean required;
        private List<String> options;
        private FieldValidation validation;
        private String helpText;
        private Object defaultValue;
        private Map<String, Object> metadata;
        private boolean conditional;
        private Map<String, Object> conditionalLogic;
    }

    /** Field validation rules */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class FieldValidation {

        @JsonProperty("min_length")
        private Integer minLength;

        @JsonProperty("max_length")
        private Integer maxLength;

        private Integer min;
        private Integer max;
        private String pattern;
        private String format;

        @JsonProperty("allowed_values")
        private List<String> allowedValues;

        @JsonProperty("custom_validation")
        private String customValidation;

        private String message;

        @JsonProperty("min_age")
        private Integer minAge;

        @JsonProperty("max_age")
        private Integer maxAge;

        @JsonProperty("must_be_true")
        private Boolean mustBeTrue;
    }

    /** Step metadata */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StepMetadata {

        private String category;
        private List<String> tags;
        private String icon;
        private String color;
        private boolean skippable;
        private Map<String, Object> hints;
        private List<String> tips;
    }

    /** Step submission request */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StepSubmissionRequest {

        private String stepId;
        private Map<String, Object> data;
        private boolean saveAsDraft;
        private String clientId;
    }

    /** Step submission response */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StepSubmissionResponse {

        private boolean success;
        private String message;
        private boolean stepCompleted;
        private int completionPercentage;
        private boolean hasNext;
        private FormData nextStep;
        private ProgressData progress;
        private Map<String, String> validationErrors;
        private List<String> warnings;

        public boolean isSuccess() {
            return this.success;
        }

        public String getMessage() {
            return this.message;
        }
    }

    /** Validation request */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ValidationRequest {

        private String stepId;
        private Map<String, Object> data;
        private boolean validateOnly;
    }

    /** Validation response */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ValidationResponse {

        private boolean success;
        private String message;
        private boolean valid;
        private boolean stepCompleted;
        private int completionPercentage;
        private boolean hasNext;
        private NextStepInfo nextStep;
        private Map<String, String> validationErrors;
        private Map<String, Object> fieldErrors;
        private List<String> warnings;
        private List<String> suggestions;
        private Map<String, Object> requestBodyTemplate;
    }

    /** Profile summary response */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ProfileSummaryResponse {

        private boolean success;
        private String message;
        private ProfileSummary summary;
        private List<StepStatus> stepsStatus;
        private Map<String, Object> profileData;

        public Map<String, Object> getProfileData(Object data) {
            return this.profileData;
        }
    }

    /** Profile summary data */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ProfileSummary {

        private int completionPercentage;
        private boolean isComplete;
        private String workflowStage;
        private int completedSteps;
        private int totalSteps;
        private List<String> missingFields;
        private List<String> recommendations;
        private double profileScore;
        private String profileStatus;
        private boolean canSubmitApplications;
    }

    /** Step details response */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StepDetailsResponse {

        private boolean success;
        private String message;
        private FormData formData;
        private Map<String, Object> existingData;
        private StepMetadata metadata;
        private boolean canEdit;
        private String lastModified;
    }

    /** Profile builder configuration */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ProfileBuilderConfig {

        private List<StepDefinition> steps;
        private Map<String, Object> globalSettings;
        private Map<String, Object> validationRules;
        private Map<String, Object> uiSettings;
    }

    /** Step definition */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StepDefinition {

        private String id;
        private String title;
        private String description;
        private boolean required;
        private int order;
        private int estimatedTimeMinutes;
        private List<String> dependencies;
        private List<FormField> fields;
        private StepMetadata metadata;
        private Map<String, Object> conditionalLogic;
    }

    /** Dashboard data response */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StudentDashboardResponse {

        private boolean success;
        private String message;
        private DashboardData dashboard;
        private ProfileSummary profile;
        private List<RecentActivity> recentActivities;
        private List<Recommendation> recommendations;
    }

    /** Dashboard data */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DashboardData {

        private int profileCompletionPercentage;
        private int totalApplications;
        private int pendingTasks;
        private int unreadNotifications;
        private String nextAction;
        private List<QuickAction> quickActions;
        private Map<String, Object> analytics;
    }

    /** Recent activity item */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RecentActivity {

        private String id;
        private String type;
        private String title;
        private String description;
        private String timestamp;
        private String status;
        private Map<String, Object> metadata;
    }

    /** Recommendation item */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Recommendation {

        private String id;
        private String type;
        private String title;
        private String description;
        private String action;
        private String priority;
        private Map<String, Object> data;
    }

    /** Quick action */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class QuickAction {

        private String id;
        private String title;
        private String description;
        private String action;
        private String icon;
        private boolean enabled;
        private Map<String, Object> metadata;
    }

    /** Next step information */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class NextStepInfo {

        private String stepId;
        private String stepName;
        private FormData formData;
        private StepMetadata metadata;
    }

    /** Bulk set request - set multiple steps at once */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class BulkSetRequest {

        private Map<String, Map<String, Object>> data;
        private boolean skipValidation;
    }

    /** Bulk set response - results of bulk setting */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class BulkSetResponse {

        private boolean success;
        private String message;
        private int totalSteps;
        private int successfulSteps;
        private int failedSteps;
        private int completionPercentage;
        private List<BulkSetStepResult> stepResults;
        private Map<String, List<String>> validationErrors;
    }

    /** Result for individual step in bulk set */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class BulkSetStepResult {

        private String stepId;
        private boolean success;
        private String message;
        private Map<String, String> errors;
    }
}
