package com.uniflow.notification.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Set;

/**
 * Enterprise notification types with admin access control.
 * Follows functional programming patterns for validation.
 */
public enum NotificationType {
    // Admin-only notification types
    ADMIN_ANNOUNCEMENT(
        "Admin Announcement",
        "System-wide announcements from administrators",
        true
    ),
    WORKFLOW_UPDATE(
        "Workflow Update",
        "Updates on application workflow progress",
        true
    ),
    SYSTEM_ALERT("System Alert", "Critical system notifications", true),

    // General notification types (accessible to all)
    TASK_COMPLETION(
        "Task Completion",
        "Notification when a task is completed",
        false
    ),
    STAGE_COMPLETION(
        "Stage Completion",
        "Notification when a workflow stage is completed",
        false
    ),
    GENERAL_INFO(
        "General Information",
        "General informational messages",
        false
    ),
    GENERAL(
        "General",
        "General notifications",
        false
    ),
    APPLICATION_UPDATE(
        "Application Update",
        "Updates related to student application status",
        false
    );

    private final String displayName;
    private final String description;
    private final boolean adminOnly;

    NotificationType(
        String displayName,
        String description,
        boolean adminOnly
    ) {
        this.displayName = displayName;
        this.description = description;
        this.adminOnly = adminOnly;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public boolean isAdminOnly() {
        return adminOnly;
    }

    // Functional validation predicates
    public static final Set<NotificationType> REQUIRES_ADMIN = Set.of(
        ADMIN_ANNOUNCEMENT,
        WORKFLOW_UPDATE,
        SYSTEM_ALERT
    );

    /**
     * Check if notification type requires admin privileges
     */
    public static boolean requiresAdminAccess(NotificationType type) {
        return type != null && type.isAdminOnly();
    }

    /**
     * Get all admin-only notification types
     */
    public static NotificationType[] getAdminOnlyTypes() {
        return REQUIRES_ADMIN.toArray(new NotificationType[0]);
    }

    /**
     * Get all general notification types (non-admin)
     */
    public static NotificationType[] getGeneralTypes() {
        return java.util.Arrays.stream(values())
            .filter(type -> !type.isAdminOnly())
            .toArray(NotificationType[]::new);
    }

    @JsonValue
    public String toValue() {
        return this.name();
    }

    @JsonCreator
    public static NotificationType fromValue(String value) {
        if (value == null) {
            return null;
        }
        try {
            return NotificationType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                "Invalid NotificationType: " + value
            );
        }
    }
}
