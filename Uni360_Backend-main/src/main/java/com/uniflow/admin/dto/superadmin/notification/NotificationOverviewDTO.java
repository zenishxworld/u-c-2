package com.uniflow.admin.dto.superadmin.notification;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * NotificationOverviewDTO - Comprehensive notification system overview for Super Admin
 *
 * Provides system-wide notification analytics including delivery rates,
 * engagement metrics, failure analysis, and operational statistics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Comprehensive notification system overview and analytics")
public class NotificationOverviewDTO {

    @Schema(description = "Overall notification statistics")
    @JsonProperty("overview_stats")
    private NotificationStatsDTO overviewStats;

    @Schema(description = "Notification delivery analytics")
    @JsonProperty("delivery_analytics")
    private DeliveryAnalyticsDTO deliveryAnalytics;

    @Schema(description = "Channel performance breakdown")
    @JsonProperty("channel_performance")
    private List<ChannelPerformanceDTO> channelPerformance;

    @Schema(description = "Recent system notifications")
    @JsonProperty("recent_notifications")
    private List<RecentNotificationDTO> recentNotifications;

    @Schema(description = "Notification type distribution")
    @JsonProperty("type_distribution")
    private List<NotificationTypeStatsDTO> typeDistribution;

    @Schema(description = "Failure analysis and error breakdown")
    @JsonProperty("failure_analysis")
    private FailureAnalysisDTO failureAnalysis;

    @Schema(description = "User engagement metrics")
    @JsonProperty("engagement_metrics")
    private EngagementMetricsDTO engagementMetrics;

    /**
     * Overall notification statistics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationStatsDTO {

        @Schema(description = "Total notifications sent", example = "15420")
        @JsonProperty("total_sent")
        private Long totalSent;

        @Schema(description = "Total notifications delivered", example = "14892")
        @JsonProperty("total_delivered")
        private Long totalDelivered;

        @Schema(description = "Total notifications read", example = "12340")
        @JsonProperty("total_read")
        private Long totalRead;

        @Schema(description = "Total notifications failed", example = "528")
        @JsonProperty("total_failed")
        private Long totalFailed;

        @Schema(description = "Delivery rate percentage", example = "96.58")
        @JsonProperty("delivery_rate")
        private BigDecimal deliveryRate;

        @Schema(description = "Read rate percentage", example = "82.87")
        @JsonProperty("read_rate")
        private BigDecimal readRate;

        @Schema(description = "Last updated timestamp")
        @JsonProperty("last_updated")
        private LocalDateTime lastUpdated;
    }

    /**
     * Delivery analytics with time-based metrics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeliveryAnalyticsDTO {

        @Schema(description = "Last 24 hours statistics")
        @JsonProperty("last_24h")
        private TimePeriodStatsDTO last24Hours;

        @Schema(description = "Last 7 days statistics")
        @JsonProperty("last_7d")
        private TimePeriodStatsDTO last7Days;

        @Schema(description = "Last 30 days statistics")
        @JsonProperty("last_30d")
        private TimePeriodStatsDTO last30Days;

        @Schema(description = "Average delivery time in seconds", example = "2.45")
        @JsonProperty("avg_delivery_time_seconds")
        private BigDecimal avgDeliveryTimeSeconds;

        @Schema(description = "Peak notification hours")
        @JsonProperty("peak_hours")
        private List<Integer> peakHours;
    }

    /**
     * Time period statistics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimePeriodStatsDTO {

        @Schema(description = "Notifications sent in period", example = "892")
        @JsonProperty("sent")
        private Long sent;

        @Schema(description = "Notifications delivered in period", example = "856")
        @JsonProperty("delivered")
        private Long delivered;

        @Schema(description = "Notifications read in period", example = "723")
        @JsonProperty("read")
        private Long read;

        @Schema(description = "Delivery rate for period", example = "96.0")
        @JsonProperty("delivery_rate")
        private BigDecimal deliveryRate;

        @Schema(description = "Read rate for period", example = "84.5")
        @JsonProperty("read_rate")
        private BigDecimal readRate;
    }

    /**
     * Channel performance metrics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChannelPerformanceDTO {

        @Schema(description = "Channel name", example = "SYSTEM")
        @JsonProperty("channel_name")
        private String channelName;

        @Schema(description = "Channel display name", example = "System Notifications")
        @JsonProperty("channel_display_name")
        private String channelDisplayName;

        @Schema(description = "Total sent through channel", example = "8940")
        @JsonProperty("total_sent")
        private Long totalSent;

        @Schema(description = "Delivery rate for channel", example = "98.2")
        @JsonProperty("delivery_rate")
        private BigDecimal deliveryRate;

        @Schema(description = "Engagement rate for channel", example = "87.3")
        @JsonProperty("engagement_rate")
        private BigDecimal engagementRate;

        @Schema(description = "Channel status", example = "ACTIVE")
        @JsonProperty("status")
        private String status;
    }

    /**
     * Recent notification summary
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentNotificationDTO {

        @Schema(description = "Notification ID")
        @JsonProperty("notification_id")
        private String notificationId;

        @Schema(description = "Notification type", example = "TASK_COMPLETION")
        @JsonProperty("type")
        private String type;

        @Schema(description = "Notification title", example = "Application Task Completed")
        @JsonProperty("title")
        private String title;

        @Schema(description = "Recipient count", example = "15")
        @JsonProperty("recipient_count")
        private Long recipientCount;

        @Schema(description = "Delivery status", example = "DELIVERED")
        @JsonProperty("status")
        private String status;

        @Schema(description = "Sent timestamp")
        @JsonProperty("sent_at")
        private LocalDateTime sentAt;

        @Schema(description = "Sender name", example = "Admin User")
        @JsonProperty("sender_name")
        private String senderName;
    }

    /**
     * Notification type statistics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationTypeStatsDTO {

        @Schema(description = "Notification type", example = "TASK_COMPLETION")
        @JsonProperty("type")
        private String type;

        @Schema(description = "Type display name", example = "Task Completion")
        @JsonProperty("type_display_name")
        private String typeDisplayName;

        @Schema(description = "Count of notifications", example = "2840")
        @JsonProperty("count")
        private Long count;

        @Schema(description = "Percentage of total", example = "18.4")
        @JsonProperty("percentage")
        private BigDecimal percentage;

        @Schema(description = "Average engagement rate", example = "89.2")
        @JsonProperty("avg_engagement_rate")
        private BigDecimal avgEngagementRate;
    }

    /**
     * Failure analysis and error breakdown
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FailureAnalysisDTO {

        @Schema(description = "Total failed notifications", example = "528")
        @JsonProperty("total_failed")
        private Long totalFailed;

        @Schema(description = "Failure rate percentage", example = "3.42")
        @JsonProperty("failure_rate")
        private BigDecimal failureRate;

        @Schema(description = "Common failure reasons")
        @JsonProperty("failure_reasons")
        private List<FailureReasonDTO> failureReasons;

        @Schema(description = "System recovery rate", example = "94.8")
        @JsonProperty("recovery_rate")
        private BigDecimal recoveryRate;

        @Schema(description = "Last failure timestamp")
        @JsonProperty("last_failure_at")
        private LocalDateTime lastFailureAt;
    }

    /**
     * Failure reason breakdown
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FailureReasonDTO {

        @Schema(description = "Failure reason", example = "USER_NOT_FOUND")
        @JsonProperty("reason")
        private String reason;

        @Schema(description = "Failure count", example = "156")
        @JsonProperty("count")
        private Long count;

        @Schema(description = "Percentage of failures", example = "29.5")
        @JsonProperty("percentage")
        private BigDecimal percentage;

        @Schema(description = "Last occurrence")
        @JsonProperty("last_occurrence")
        private LocalDateTime lastOccurrence;
    }

    /**
     * User engagement metrics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EngagementMetricsDTO {

        @Schema(description = "Overall engagement rate", example = "82.87")
        @JsonProperty("overall_engagement_rate")
        private BigDecimal overallEngagementRate;

        @Schema(description = "Average time to read in minutes", example = "45.2")
        @JsonProperty("avg_time_to_read_minutes")
        private BigDecimal avgTimeToReadMinutes;

        @Schema(description = "Active users in last 24h", example = "1842")
        @JsonProperty("active_users_24h")
        private Long activeUsers24h;

        @Schema(description = "Most engaged user types")
        @JsonProperty("top_engaged_user_types")
        private List<UserTypeEngagementDTO> topEngagedUserTypes;

        @Schema(description = "Engagement trend", example = "INCREASING")
        @JsonProperty("engagement_trend")
        private String engagementTrend;
    }

    /**
     * User type engagement statistics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserTypeEngagementDTO {

        @Schema(description = "User type", example = "STUDENT")
        @JsonProperty("user_type")
        private String userType;

        @Schema(description = "Engagement rate", example = "91.4")
        @JsonProperty("engagement_rate")
        private BigDecimal engagementRate;

        @Schema(description = "Average response time minutes", example = "28.5")
        @JsonProperty("avg_response_time_minutes")
        private BigDecimal avgResponseTimeMinutes;

        @Schema(description = "Total notifications sent", example = "4520")
        @JsonProperty("total_sent")
        private Long totalSent;
    }
}
