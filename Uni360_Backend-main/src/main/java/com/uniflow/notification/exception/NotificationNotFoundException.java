package com.uniflow.notification.exception;

/**
 * Exception thrown when a notification is not found.
 * Used for proper error handling in notification operations.
 */
public class NotificationNotFoundException extends RuntimeException {

    public NotificationNotFoundException(String message) {
        super(message);
    }

    public NotificationNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
