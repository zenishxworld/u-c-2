package com.uniflow.workflow.exception;

import com.uniflow.workflow.service.TaskCompletionValidationService.ValidationResult;
import java.util.List;
import lombok.Getter;

/**
 * Exception thrown when task validation fails
 * Carries detailed validation information for proper error responses
 */
@Getter
public class TaskValidationException extends RuntimeException {

    private final String errorCode;
    private final String errorType;
    private final List<String> missingFlags;
    private final String taskId;
    private final String applicationId;

    public TaskValidationException(ValidationResult validationResult, String taskId, String applicationId) {
        super(validationResult.getMessage());
        this.errorCode = validationResult.getErrorCode();
        this.errorType = validationResult.getErrorType();
        this.missingFlags = validationResult.getMissingFlags();
        this.taskId = taskId;
        this.applicationId = applicationId;
    }

    public TaskValidationException(String message, String errorCode, String errorType, String taskId, String applicationId) {
        super(message);
        this.errorCode = errorCode;
        this.errorType = errorType;
        this.missingFlags = List.of();
        this.taskId = taskId;
        this.applicationId = applicationId;
    }

    public boolean isSystemError() {
        return "SYSTEM_ERROR".equals(errorCode);
    }

    public boolean isProfileNotFound() {
        return "PROFILE_NOT_FOUND".equals(errorCode);
    }

    public boolean isMissingFlags() {
        return "VALIDATION_FAILED".equals(errorCode);
    }
}
