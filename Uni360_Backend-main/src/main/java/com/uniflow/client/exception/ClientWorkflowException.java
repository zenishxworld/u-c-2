package com.uniflow.client.exception;

/**
 * Exception thrown when client workflow configuration operations fail
 * Provides specific error context for client-based workflow management
 */
public class ClientWorkflowException extends RuntimeException {

    private final String clientId;
    private final String errorCode;

    /**
     * Create exception with client ID and error code
     * @param clientId the client ID where the error occurred
     * @param errorCode specific error code for categorization
     * @param message error message
     */
    public ClientWorkflowException(String clientId, String errorCode, String message) {
        super(String.format("Client: %s, Error: %s - %s", clientId, errorCode, message));
        this.clientId = clientId;
        this.errorCode = errorCode;
    }

    /**
     * Create exception with client ID, error code, and cause
     * @param clientId the client ID where the error occurred
     * @param errorCode specific error code for categorization
     * @param message error message
     * @param cause underlying cause
     */
    public ClientWorkflowException(String clientId, String errorCode, String message, Throwable cause) {
        super(String.format("Client: %s, Error: %s - %s", clientId, errorCode, message), cause);
        this.clientId = clientId;
        this.errorCode = errorCode;
    }

    /**
     * Get the client ID associated with this error
     * @return client ID
     */
    public String getClientId() {
        return clientId;
    }

    /**
     * Get the error code for this exception
     * @return error code
     */
    public String getErrorCode() {
        return errorCode;
    }

    /**
     * Check if this is a configuration error
     * @return true if configuration related
     */
    public boolean isConfigurationError() {
        return errorCode != null && errorCode.contains("CONFIG");
    }

    /**
     * Check if this is a validation error
     * @return true if validation related
     */
    public boolean isValidationError() {
        return errorCode != null && errorCode.contains("VALIDATION");
    }

    /**
     * Check if this is a deployment error
     * @return true if deployment related
     */
    public boolean isDeploymentError() {
        return errorCode != null && errorCode.contains("DEPLOYMENT");
    }
}
