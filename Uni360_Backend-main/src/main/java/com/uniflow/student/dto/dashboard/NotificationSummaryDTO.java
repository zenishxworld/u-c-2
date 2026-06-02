package com.uniflow.student.dto.dashboard;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for Notification Summary used in Dashboard KPIs
 * Simplified version of Notification entity for dashboard purposes
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Notification summary for dashboard KPIs")
public class NotificationSummaryDTO {

    @Schema(description = "Notification ID")
    private UUID notificationId;

    @Schema(description = "User ID who received the notification")
    private Long userId;

    @Schema(description = "Sender ID who sent the notification")
    private Long senderId;

    @Schema(description = "Notification type", example = "APPLICATION_UPDATE")
    private String type;

    @Schema(description = "Notification title", example = "Document Review Required")
    private String title;

    @Schema(description = "Notification message", example = "Your transcript needs admin review")
    private String message;

    @Schema(description = "Notification status", example = "UNREAD")
    private String status;

    @Schema(description = "Priority level", example = "HIGH")
    private String priority;

    @Schema(description = "Action URL", example = "/documents/review")
    private String actionUrl;

    @Schema(description = "Related application ID", example = "APP-001")
    private String applicationId;

    @Schema(description = "Notification created date")
    private LocalDateTime createdAt;

    @Schema(description = "Notification read date")
    private LocalDateTime readAt;

    @Schema(description = "Is notification read", example = "false")
    private Boolean isRead;

    @Schema(description = "Content type", example = "TEXT")
    private String contentType;

    /**
     * Helper method to check if notification is unread
     */
    public boolean isUnread() {
        return isRead == null || !isRead;
    }

    /**
     * Helper method to check if notification is high priority
     */
    public boolean isHighPriority() {
        return "HIGH".equals(priority) || "URGENT".equals(priority);
    }

    /**
     * Helper method to check if notification is recent (within last 24 hours)
     */
    public boolean isRecent() {
        return createdAt != null &&
               createdAt.isAfter(LocalDateTime.now().minusDays(1));
    }

    /**
     * Helper method to get time ago string
     */
    public String getTimeAgo() {
        if (createdAt == null) return "Unknown";

        LocalDateTime now = LocalDateTime.now();
        long minutes = java.time.Duration.between(createdAt, now).toMinutes();

        if (minutes < 60) {
            return minutes + " minutes ago";
        }

        long hours = minutes / 60;
        if (hours < 24) {
            return hours + " hours ago";
        }

        long days = hours / 24;
        if (days < 30) {
            return days + " days ago";
        }

        long months = days / 30;
        return months + " months ago";
    }

    /**
     * Helper method to get display type
     */
    public String getDisplayType() {
        if (type == null) return "GENERAL";

        return switch (type.toUpperCase()) {
            case "APPLICATION_UPDATE" -> "Application Update";
            case "DOCUMENT_REVIEW" -> "Document Review";
            case "TASK_REMINDER" -> "Task Reminder";
            case "DEADLINE_ALERT" -> "Deadline Alert";
            case "SYSTEM_ANNOUNCEMENT" -> "System Announcement";
            case "PAYMENT_NOTIFICATION" -> "Payment";
            case "UNIVERSITY_COMMUNICATION" -> "University Communication";
            default -> type;
        };
    }
}
