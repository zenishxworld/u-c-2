package com.uniflow.notification.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Set;
import java.util.function.Predicate;

/**
 * Enterprise notification status enum with functional validation patterns.
 * Supports reactive status transitions and validation.
 */
public enum NotificationStatus {
    UNREAD("Unread", "Notification has not been read by the recipient", false),
    READ("Read", "Notification has been read by the recipient", true),
    DISMISSED(
        "Dismissed",
        "Notification has been dismissed by the recipient",
        true
    ),
    EXPIRED("Expired", "Notification has passed its expiration time", true);

    private final String displayName;
    private final String description;
    private final boolean finalState;

    NotificationStatus(
        String displayName,
        String description,
        boolean finalState
    ) {
        this.displayName = displayName;
        this.description = description;
        this.finalState = finalState;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public boolean isFinalState() {
        return finalState;
    }

    // Functional validation predicates
    public static final Predicate<NotificationStatus> IS_UNREAD = status ->
        status == UNREAD;
    public static final Predicate<NotificationStatus> IS_READ = status ->
        status == READ;
    public static final Predicate<NotificationStatus> IS_ACTIONABLE = status ->
        status == UNREAD;

    public static final Set<NotificationStatus> ACTIVE_STATUSES = Set.of(
        UNREAD,
        READ
    );
    public static final Set<NotificationStatus> FINAL_STATUSES = Set.of(
        READ,
        DISMISSED,
        EXPIRED
    );

    /**
     * Check if status represents an unread notification
     */
    public static boolean isUnread(NotificationStatus status) {
        return IS_UNREAD.test(status);
    }

    /**
     * Check if status represents a read notification
     */
    public static boolean isRead(NotificationStatus status) {
        return IS_READ.test(status);
    }

    /**
     * Check if notification can still be acted upon
     */
    public static boolean isActionable(NotificationStatus status) {
        return IS_ACTIONABLE.test(status);
    }

    /**
     * Check if status transition is valid
     */
    public static boolean canTransitionTo(
        NotificationStatus from,
        NotificationStatus to
    ) {
        if (from == null || to == null) return false;

        return switch (from) {
            case UNREAD -> to == READ || to == DISMISSED || to == EXPIRED;
            case READ -> to == DISMISSED || to == EXPIRED;
            case DISMISSED, EXPIRED -> false; // Final states
        };
    }

    /**
     * Get all active notification statuses
     */
    public static NotificationStatus[] getActiveStatuses() {
        return ACTIVE_STATUSES.toArray(new NotificationStatus[0]);
    }

    /**
     * Get all final notification statuses
     */
    public static NotificationStatus[] getFinalStatuses() {
        return FINAL_STATUSES.toArray(new NotificationStatus[0]);
    }

    @JsonValue
    public String toValue() {
        return this.name();
    }

    @JsonCreator
    public static NotificationStatus fromValue(String value) {
        if (value == null) {
            return UNREAD;
        }
        try {
            return NotificationStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return UNREAD; // Default to UNREAD for invalid values
        }
    }
}
