package com.uniflow.notification.exception;

/**
 * Exception thrown when a user is not authorized to perform a notification operation.
 * Used for authentication and authorization failures in the notification system.
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}
