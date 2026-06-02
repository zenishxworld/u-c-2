package com.uniflow.student.dto.dashboard;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Recent Notifications KPI Card
 * Part of ST-02: Enhanced Student Dashboard KPIs
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Recent Notifications KPI Card data")
public class NotificationKPIDTO {

    @Schema(description = "Total unread notifications count", example = "5")
    private Integer unreadCount;

    @Schema(description = "Total notifications count", example = "12")
    private Integer totalCount;

    @Schema(description = "Recent notifications count (last 7 days)", example = "8")
    private Integer recentCount;

    @Schema(description = "High priority notifications count", example = "2")
    private Integer highPriorityCount;

    @Schema(description = "Last notification received time")
    private LocalDateTime lastNotificationTime;

    @Schema(description = "Notification summary status")
    private String notificationStatus; // "NONE", "LOW_ACTIVITY", "MODERATE_ACTIVITY", "HIGH_ACTIVITY"

    @Schema(description = "Most recent notification preview")
    private String mostRecentPreview;

    @Schema(description = "List of recent important notifications")
    private List<RecentNotification> recentNotifications;

    @Schema(description = "Notification categories breakdown")
    private NotificationBreakdown breakdown;

    /**
     * Nested class for individual notification information
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "Individual recent notification")
    public static class RecentNotification {

        @Schema(description = "Notification ID", example = "NOTIF-001")
        private String notificationId;

        @Schema(description = "Notification title", example = "Document Review Required")
        private String title;

        @Schema(description = "Notification message preview", example = "Your transcript needs admin review...")
        private String message;

        @Schema(description = "Notification type", example = "DOCUMENT_REVIEW")
        private String type; // "APPLICATION_UPDATE", "DOCUMENT_REVIEW", "TASK_REMINDER", "DEADLINE_ALERT", "SYSTEM_ANNOUNCEMENT"

        @Schema(description = "Notification priority", example = "HIGH")
        private String priority; // "LOW", "MEDIUM", "HIGH", "URGENT"

        @Schema(description = "Is notification read", example = "false")
        private Boolean isRead;

        @Schema(description = "Notification received time")
        private LocalDateTime receivedAt;

        @Schema(description = "Related application ID", example = "APP-001")
        private String relatedApplicationId;

        @Schema(description = "Action URL", example = "/documents/review")
        private String actionUrl;

        @Schema(description = "Time ago text", example = "2 hours ago")
        private String timeAgo;
    }

    /**
     * Nested class for notification breakdown by category
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "Notification breakdown by category")
    public static class NotificationBreakdown {

        @Schema(description = "Application update notifications count", example = "3")
        private Integer applicationUpdates;

        @Schema(description = "Document review notifications count", example = "2")
        private Integer documentReviews;

        @Schema(description = "Task reminder notifications count", example = "4")
        private Integer taskReminders;

        @Schema(description = "Deadline alert notifications count", example = "1")
        private Integer deadlineAlerts;

        @Schema(description = "System announcement notifications count", example = "2")
        private Integer systemAnnouncements;

        @Schema(description = "Payment related notifications count", example = "1")
        private Integer paymentNotifications;

        @Schema(description = "University communication notifications count", example = "1")
        private Integer universityCommunications;
    }
}
