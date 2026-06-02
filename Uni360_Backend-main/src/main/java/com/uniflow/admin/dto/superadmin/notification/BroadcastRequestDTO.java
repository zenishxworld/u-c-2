package com.uniflow.admin.dto.superadmin.notification;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
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
 * BroadcastRequestDTO - Request DTO for system-wide notification broadcasting
 *
 * Supports targeted broadcasting with multiple filtering criteria,
 * scheduling, priority levels, and multi-channel delivery options.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request for broadcasting system-wide notifications")
public class BroadcastRequestDTO {

    @NotBlank(message = "Notification title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    @Schema(
        description = "Notification title",
        example = "Important System Update",
        required = true
    )
    @JsonProperty("title")
    private String title;

    @NotBlank(message = "Notification message is required")
    @Size(max = 2000, message = "Message must not exceed 2000 characters")
    @Schema(
        description = "Notification message content",
        example = "System maintenance scheduled for tonight",
        required = true
    )
    @JsonProperty("message")
    private String message;

    @NotNull(message = "Notification type is required")
    @Schema(
        description = "Type of notification",
        example = "SYSTEM_ANNOUNCEMENT",
        required = true
    )
    @JsonProperty("type")
    private String type;

    @Schema(
        description = "Notification priority level",
        example = "HIGH",
        allowableValues = { "LOW", "MEDIUM", "HIGH", "URGENT" }
    )
    @JsonProperty("priority")
    @Builder.Default
    private String priority = "MEDIUM";

    @Schema(
        description = "Content type of the message",
        example = "PLAIN",
        allowableValues = { "PLAIN", "HTML", "MARKDOWN" }
    )
    @JsonProperty("content_type")
    @Builder.Default
    private String contentType = "PLAIN";

    @Schema(
        description = "Action URL for the notification",
        example = "/system/maintenance"
    )
    @JsonProperty("action_url")
    private String actionUrl;

    @Schema(description = "Target audience configuration")
    @JsonProperty("target_audience")
    private TargetAudienceDTO targetAudience;

    @Schema(description = "Delivery channels for the broadcast")
    @JsonProperty("delivery_channels")
    @NotEmpty(message = "At least one delivery channel must be specified")
    private List<String> deliveryChannels;

    @Schema(description = "Scheduling options for the broadcast")
    @JsonProperty("scheduling")
    private SchedulingDTO scheduling;

    @Schema(description = "Additional metadata for the notification")
    @JsonProperty("metadata")
    private JsonNode metadata;

    @Schema(description = "Expiration settings for the notification")
    @JsonProperty("expiration")
    private ExpirationDTO expiration;

    @Schema(description = "Tracking and analytics settings")
    @JsonProperty("tracking")
    private TrackingDTO tracking;

    /**
     * Target audience configuration
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TargetAudienceDTO {

        @Schema(description = "Include all users", example = "false")
        @JsonProperty("include_all_users")
        @Builder.Default
        private Boolean includeAllUsers = false;

        @Schema(
            description = "Target user types",
            example = "[\"STUDENT\", \"ADMIN\"]"
        )
        @JsonProperty("user_types")
        private List<String> userTypes;

        @Schema(
            description = "Target specific user IDs",
            example = "[123, 456, 789]"
        )
        @JsonProperty("user_ids")
        private List<Long> userIds;

        @Schema(
            description = "Target users by location/country",
            example = "[\"US\", \"CA\", \"UK\"]"
        )
        @JsonProperty("countries")
        private List<String> countries;

        @Schema(description = "Target users by admin permissions")
        @JsonProperty("admin_permissions")
        private List<String> adminPermissions;

        @Schema(description = "Target users by application status")
        @JsonProperty("application_statuses")
        private List<String> applicationStatuses;

        @Schema(description = "Target users by registration date range")
        @JsonProperty("registration_date_range")
        private DateRangeDTO registrationDateRange;

        @Schema(description = "Target users by last activity date range")
        @JsonProperty("last_activity_range")
        private DateRangeDTO lastActivityRange;

        @Schema(
            description = "Exclude specific user IDs",
            example = "[999, 888]"
        )
        @JsonProperty("exclude_user_ids")
        private List<Long> excludeUserIds;

        @Schema(description = "Include only active users", example = "true")
        @JsonProperty("active_users_only")
        @Builder.Default
        private Boolean activeUsersOnly = true;
    }

    /**
     * Date range filter
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DateRangeDTO {

        @Schema(description = "Start date for the range")
        @JsonProperty("start_date")
        private LocalDateTime startDate;

        @Schema(description = "End date for the range")
        @JsonProperty("end_date")
        private LocalDateTime endDate;
    }

    /**
     * Scheduling configuration
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SchedulingDTO {

        @Schema(description = "Send immediately", example = "true")
        @JsonProperty("send_immediately")
        @Builder.Default
        private Boolean sendImmediately = true;

        @Schema(description = "Scheduled send time (if not immediate)")
        @JsonProperty("scheduled_time")
        private LocalDateTime scheduledTime;

        @Schema(description = "Time zone for scheduling", example = "UTC")
        @JsonProperty("time_zone")
        @Builder.Default
        private String timeZone = "UTC";

        @Schema(description = "Retry configuration for failed deliveries")
        @JsonProperty("retry_config")
        private RetryConfigDTO retryConfig;
    }

    /**
     * Retry configuration
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RetryConfigDTO {

        @Schema(description = "Maximum retry attempts", example = "3")
        @JsonProperty("max_attempts")
        @Builder.Default
        private Integer maxAttempts = 3;

        @Schema(description = "Retry interval in minutes", example = "5")
        @JsonProperty("retry_interval_minutes")
        @Builder.Default
        private Integer retryIntervalMinutes = 5;

        @Schema(description = "Enable exponential backoff", example = "true")
        @JsonProperty("exponential_backoff")
        @Builder.Default
        private Boolean exponentialBackoff = true;
    }

    /**
     * Expiration configuration
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExpirationDTO {

        @Schema(description = "Enable expiration", example = "false")
        @JsonProperty("enable_expiration")
        @Builder.Default
        private Boolean enableExpiration = false;

        @Schema(description = "Expiration time")
        @JsonProperty("expires_at")
        private LocalDateTime expiresAt;

        @Schema(
            description = "Auto-remove expired notifications",
            example = "true"
        )
        @JsonProperty("auto_remove_expired")
        @Builder.Default
        private Boolean autoRemoveExpired = true;
    }

    /**
     * Tracking and analytics configuration
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrackingDTO {

        @Schema(description = "Enable delivery tracking", example = "true")
        @JsonProperty("track_delivery")
        @Builder.Default
        private Boolean trackDelivery = true;

        @Schema(description = "Enable read tracking", example = "true")
        @JsonProperty("track_reads")
        @Builder.Default
        private Boolean trackReads = true;

        @Schema(description = "Enable click tracking", example = "true")
        @JsonProperty("track_clicks")
        @Builder.Default
        private Boolean trackClicks = true;

        @Schema(description = "Generate analytics report", example = "true")
        @JsonProperty("generate_analytics")
        @Builder.Default
        private Boolean generateAnalytics = true;

        @Schema(
            description = "Campaign ID for tracking",
            example = "system-maintenance-2024"
        )
        @JsonProperty("campaign_id")
        private String campaignId;
    }

    /**
     * Validation method for business rules
     */
    public boolean isValid() {
        // Basic validation
        if (title == null || title.trim().isEmpty()) {
            return false;
        }
        if (message == null || message.trim().isEmpty()) {
            return false;
        }
        if (deliveryChannels == null || deliveryChannels.isEmpty()) {
            return false;
        }

        // Scheduling validation
        if (
            scheduling != null &&
            !scheduling.getSendImmediately() &&
            scheduling.getScheduledTime() == null
        ) {
            return false;
        }

        // Audience validation
        if (targetAudience != null && !targetAudience.getIncludeAllUsers()) {
            boolean hasTargets =
                (targetAudience.getUserTypes() != null &&
                    !targetAudience.getUserTypes().isEmpty()) ||
                (targetAudience.getUserIds() != null &&
                    !targetAudience.getUserIds().isEmpty()) ||
                (targetAudience.getCountries() != null &&
                    !targetAudience.getCountries().isEmpty()) ||
                (targetAudience.getAdminPermissions() != null &&
                    !targetAudience.getAdminPermissions().isEmpty()) ||
                (targetAudience.getApplicationStatuses() != null &&
                    !targetAudience.getApplicationStatuses().isEmpty());

            if (!hasTargets) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get estimated recipient count (placeholder for validation)
     */
    public long getEstimatedRecipientCount() {
        // This would be calculated based on targetAudience criteria
        // For now, return a placeholder
        return 0L;
    }

    /**
     * Check if broadcast requires admin approval
     */
    public boolean requiresApproval() {
        // System-wide broadcasts or urgent priority notifications might require approval
        return (
            "URGENT".equals(priority) ||
            (targetAudience != null && targetAudience.getIncludeAllUsers()) ||
            getEstimatedRecipientCount() > 1000
        );
    }
}
