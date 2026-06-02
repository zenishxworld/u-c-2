package com.uniflow.notification.exception;

/**
 * Exception thrown when a user is forbidden from performing a notification operation.
 * Used for authorization failures, particularly when admin access is required.
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }

    public ForbiddenException(String message, Throwable cause) {
        super(message, cause);
    }
}
