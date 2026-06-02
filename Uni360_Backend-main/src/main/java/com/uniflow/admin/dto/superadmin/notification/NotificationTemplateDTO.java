package com.uniflow.admin.dto.superadmin.notification;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * NotificationTemplateDTO - Notification template management for Super Admin
 *
 * Provides comprehensive template management including creation, editing,
 * versioning, localization, and performance tracking of notification templates.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Notification template management and configuration")
public class NotificationTemplateDTO {

    @Schema(description = "Template ID")
    @JsonProperty("template_id")
    private String templateId;

    @NotBlank(message = "Template name is required")
    @Size(max = 255, message = "Template name must not exceed 255 characters")
    @Schema(
        description = "Template name",
        example = "Application Status Update",
        required = true
    )
    @JsonProperty("template_name")
    private String templateName;

    @Schema(description = "Template category", example = "WORKFLOW")
    @JsonProperty("category")
    private String category;

    @NotNull(message = "Template type is required")
    @Schema(
        description = "Notification type",
        example = "TASK_COMPLETION",
        required = true
    )
    @JsonProperty("notification_type")
    private String notificationType;

    @NotBlank(message = "Template subject is required")
    @Size(max = 255, message = "Subject must not exceed 255 characters")
    @Schema(
        description = "Template subject/title",
        example = "Your {{task_name}} has been completed",
        required = true
    )
    @JsonProperty("subject_template")
    private String subjectTemplate;

    @NotBlank(message = "Template content is required")
    @Size(max = 5000, message = "Content must not exceed 5000 characters")
    @Schema(
        description = "Template content with placeholders",
        example = "Hello {{user_name}}, your {{task_name}} in stage {{stage_name}} has been completed.",
        required = true
    )
    @JsonProperty("content_template")
    private String contentTemplate;

    @Schema(description = "Template version", example = "1.2")
    @JsonProperty("version")
    private String version;

    @Schema(
        description = "Template status",
        example = "ACTIVE",
        allowableValues = { "DRAFT", "ACTIVE", "ARCHIVED", "DEPRECATED" }
    )
    @JsonProperty("status")
    @Builder.Default
    private String status = "DRAFT";

    @Schema(
        description = "Content type",
        example = "PLAIN",
        allowableValues = { "PLAIN", "HTML", "MARKDOWN" }
    )
    @JsonProperty("content_type")
    @Builder.Default
    private String contentType = "PLAIN";

    @Schema(
        description = "Template priority level",
        example = "MEDIUM",
        allowableValues = { "LOW", "MEDIUM", "HIGH", "URGENT" }
    )
    @JsonProperty("priority")
    @Builder.Default
    private String priority = "MEDIUM";

    @Schema(description = "Available template variables")
    @JsonProperty("variables")
    private List<TemplateVariableDTO> variables;

    @Schema(description = "Localization settings")
    @JsonProperty("localization")
    private LocalizationDTO localization;

    @Schema(description = "Template configuration options")
    @JsonProperty("configuration")
    private TemplateConfigurationDTO configuration;

    @Schema(description = "Performance metrics")
    @JsonProperty("performance_metrics")
    private TemplatePerformanceDTO performanceMetrics;

    @Schema(description = "Template metadata")
    @JsonProperty("metadata")
    private JsonNode metadata;

    @Schema(description = "Creation timestamp")
    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @Schema(description = "Last updated timestamp")
    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;

    @Schema(description = "Created by user ID")
    @JsonProperty("created_by")
    private Long createdBy;

    @Schema(description = "Last updated by user ID")
    @JsonProperty("updated_by")
    private Long updatedBy;

    @Schema(description = "Template tags for organization")
    @JsonProperty("tags")
    private List<String> tags;

    /**
     * Template variable definition
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TemplateVariableDTO {

        @Schema(description = "Variable name", example = "user_name")
        @JsonProperty("variable_name")
        private String variableName;

        @Schema(description = "Variable display name", example = "User Name")
        @JsonProperty("display_name")
        private String displayName;

        @Schema(
            description = "Variable description",
            example = "The full name of the user"
        )
        @JsonProperty("description")
        private String description;

        @Schema(
            description = "Variable type",
            example = "STRING",
            allowableValues = {
                "STRING", "NUMBER", "DATE", "BOOLEAN", "OBJECT",
            }
        )
        @JsonProperty("variable_type")
        private String variableType;

        @Schema(description = "Whether variable is required", example = "true")
        @JsonProperty("required")
        @Builder.Default
        private Boolean required = false;

        @Schema(description = "Default value if not provided", example = "User")
        @JsonProperty("default_value")
        private String defaultValue;

        @Schema(description = "Validation rules")
        @JsonProperty("validation")
        private VariableValidationDTO validation;

        @Schema(description = "Example values for testing")
        @JsonProperty("example_values")
        private List<String> exampleValues;
    }

    /**
     * Variable validation rules
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariableValidationDTO {

        @Schema(
            description = "Minimum length for string variables",
            example = "1"
        )
        @JsonProperty("min_length")
        private Integer minLength;

        @Schema(
            description = "Maximum length for string variables",
            example = "255"
        )
        @JsonProperty("max_length")
        private Integer maxLength;

        @Schema(
            description = "Regular expression pattern",
            example = "^[a-zA-Z\\s]+$"
        )
        @JsonProperty("pattern")
        private String pattern;

        @Schema(
            description = "Allowed values",
            example = "[\"PENDING\", \"APPROVED\", \"REJECTED\"]"
        )
        @JsonProperty("allowed_values")
        private List<String> allowedValues;

        @Schema(description = "Minimum value for numbers", example = "0")
        @JsonProperty("min_value")
        private Double minValue;

        @Schema(description = "Maximum value for numbers", example = "100")
        @JsonProperty("max_value")
        private Double maxValue;
    }

    /**
     * Localization configuration
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocalizationDTO {

        @Schema(description = "Default language", example = "en")
        @JsonProperty("default_language")
        @Builder.Default
        private String defaultLanguage = "en";

        @Schema(
            description = "Supported languages",
            example = "[\"en\", \"es\", \"fr\", \"de\"]"
        )
        @JsonProperty("supported_languages")
        private List<String> supportedLanguages;

        @Schema(description = "Localized templates")
        @JsonProperty("localized_templates")
        private List<LocalizedTemplateDTO> localizedTemplates;

        @Schema(description = "Auto-translation enabled", example = "false")
        @JsonProperty("auto_translation_enabled")
        @Builder.Default
        private Boolean autoTranslationEnabled = false;
    }

    /**
     * Localized template version
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocalizedTemplateDTO {

        @Schema(description = "Language code", example = "es")
        @JsonProperty("language_code")
        private String languageCode;

        @Schema(
            description = "Localized subject",
            example = "Su {{task_name}} ha sido completada"
        )
        @JsonProperty("localized_subject")
        private String localizedSubject;

        @Schema(
            description = "Localized content",
            example = "Hola {{user_name}}, su {{task_name}} en etapa {{stage_name}} ha sido completada."
        )
        @JsonProperty("localized_content")
        private String localizedContent;

        @Schema(
            description = "Translation status",
            example = "REVIEWED",
            allowableValues = {
                "DRAFT", "AUTO_TRANSLATED", "REVIEWED", "APPROVED",
            }
        )
        @JsonProperty("translation_status")
        private String translationStatus;

        @Schema(description = "Last updated timestamp")
        @JsonProperty("updated_at")
        private LocalDateTime updatedAt;

        @Schema(description = "Translated by user ID")
        @JsonProperty("translated_by")
        private Long translatedBy;
    }

    /**
     * Template configuration options
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TemplateConfigurationDTO {

        @Schema(description = "Enable rich text formatting", example = "true")
        @JsonProperty("enable_rich_text")
        @Builder.Default
        private Boolean enableRichText = false;

        @Schema(description = "Enable personalization", example = "true")
        @JsonProperty("enable_personalization")
        @Builder.Default
        private Boolean enablePersonalization = true;

        @Schema(description = "Enable A/B testing", example = "false")
        @JsonProperty("enable_ab_testing")
        @Builder.Default
        private Boolean enableAbTesting = false;

        @Schema(description = "Maximum delivery attempts", example = "3")
        @JsonProperty("max_delivery_attempts")
        @Builder.Default
        private Integer maxDeliveryAttempts = 3;

        @Schema(
            description = "Delivery channels",
            example = "[\"SYSTEM\", \"EMAIL\"]"
        )
        @JsonProperty("delivery_channels")
        private List<String> deliveryChannels;

        @Schema(description = "Template expiration settings")
        @JsonProperty("expiration")
        private TemplateExpirationDTO expiration;

        @Schema(description = "Frequency limits")
        @JsonProperty("frequency_limits")
        private FrequencyLimitDTO frequencyLimits;
    }

    /**
     * Template expiration settings
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TemplateExpirationDTO {

        @Schema(description = "Enable expiration", example = "false")
        @JsonProperty("enable_expiration")
        @Builder.Default
        private Boolean enableExpiration = false;

        @Schema(description = "Expiration hours after sending", example = "72")
        @JsonProperty("expiration_hours")
        private Integer expirationHours;

        @Schema(
            description = "Auto-remove expired notifications",
            example = "true"
        )
        @JsonProperty("auto_remove_expired")
        @Builder.Default
        private Boolean autoRemoveExpired = true;
    }

    /**
     * Frequency limits configuration
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FrequencyLimitDTO {

        @Schema(description = "Maximum per user per day", example = "5")
        @JsonProperty("max_per_user_daily")
        private Integer maxPerUserDaily;

        @Schema(description = "Maximum per user per week", example = "20")
        @JsonProperty("max_per_user_weekly")
        private Integer maxPerUserWeekly;

        @Schema(
            description = "Minimum interval between same type (minutes)",
            example = "60"
        )
        @JsonProperty("min_interval_minutes")
        private Integer minIntervalMinutes;

        @Schema(description = "Enable rate limiting", example = "true")
        @JsonProperty("enable_rate_limiting")
        @Builder.Default
        private Boolean enableRateLimiting = true;
    }

    /**
     * Template performance metrics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TemplatePerformanceDTO {

        @Schema(description = "Total times used", example = "1547")
        @JsonProperty("usage_count")
        private Long usageCount;

        @Schema(description = "Average delivery rate", example = "96.8")
        @JsonProperty("avg_delivery_rate")
        private Double avgDeliveryRate;

        @Schema(description = "Average read rate", example = "84.2")
        @JsonProperty("avg_read_rate")
        private Double avgReadRate;

        @Schema(description = "Average click-through rate", example = "18.5")
        @JsonProperty("avg_click_rate")
        private Double avgClickRate;

        @Schema(description = "User satisfaction score", example = "8.7")
        @JsonProperty("satisfaction_score")
        private Double satisfactionScore;

        @Schema(
            description = "Performance trend",
            example = "IMPROVING",
            allowableValues = { "IMPROVING", "STABLE", "DECLINING" }
        )
        @JsonProperty("performance_trend")
        private String performanceTrend;

        @Schema(description = "Last performance update")
        @JsonProperty("last_metrics_update")
        private LocalDateTime lastMetricsUpdate;

        @Schema(description = "A/B test results")
        @JsonProperty("ab_test_results")
        private List<ABTestResultDTO> abTestResults;
    }

    /**
     * A/B test result data
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ABTestResultDTO {

        @Schema(description = "Test variant name", example = "Variant A")
        @JsonProperty("variant_name")
        private String variantName;

        @Schema(description = "Sample size", example = "1000")
        @JsonProperty("sample_size")
        private Long sampleSize;

        @Schema(description = "Conversion rate", example = "23.5")
        @JsonProperty("conversion_rate")
        private Double conversionRate;

        @Schema(description = "Confidence level", example = "95.0")
        @JsonProperty("confidence_level")
        private Double confidenceLevel;

        @Schema(
            description = "Test status",
            example = "COMPLETED",
            allowableValues = { "RUNNING", "COMPLETED", "CANCELLED" }
        )
        @JsonProperty("test_status")
        private String testStatus;

        @Schema(description = "Test start date")
        @JsonProperty("start_date")
        private LocalDateTime startDate;

        @Schema(description = "Test end date")
        @JsonProperty("end_date")
        private LocalDateTime endDate;
    }

    /**
     * Validation method for template business rules
     */
    public boolean isValid() {
        // Basic validation
        if (templateName == null || templateName.trim().isEmpty()) {
            return false;
        }
        if (subjectTemplate == null || subjectTemplate.trim().isEmpty()) {
            return false;
        }
        if (contentTemplate == null || contentTemplate.trim().isEmpty()) {
            return false;
        }
        if (notificationType == null || notificationType.trim().isEmpty()) {
            return false;
        }

        // Variable validation
        if (variables != null) {
            for (TemplateVariableDTO variable : variables) {
                if (
                    variable.getVariableName() == null ||
                    variable.getVariableName().trim().isEmpty()
                ) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Check if template is ready for production use
     */
    public boolean isProductionReady() {
        return (
            "ACTIVE".equals(status) &&
            version != null &&
            !version.trim().isEmpty() &&
            isValid()
        );
    }

    /**
     * Get template variable names from content
     */
    public List<String> extractVariableNames() {
        // This would extract variable names from the template content
        // For example: {{user_name}}, {{task_name}}, etc.
        // Implementation would use regex to find all {{variable_name}} patterns
        return List.of(); // Placeholder
    }

    /**
     * Check if template supports localization
     */
    public boolean supportsLocalization() {
        return (
            localization != null &&
            localization.getSupportedLanguages() != null &&
            !localization.getSupportedLanguages().isEmpty()
        );
    }
}
