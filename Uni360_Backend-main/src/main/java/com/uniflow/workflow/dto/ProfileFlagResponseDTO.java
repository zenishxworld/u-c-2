package com.uniflow.workflow.dto;

import java.time.LocalDateTime;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for student profile flag operations
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileFlagResponseDTO {

    /**
     * Application ID for which flags were updated
     */
    private String applicationId;

    /**
     * Map of flags that were updated with their new values
     */
    private Map<String, Boolean> updatedFlags;

    /**
     * Success message describing the operation
     */
    private String message;

    /**
     * Timestamp when the update was performed
     */
    private LocalDateTime updatedAt;

    /**
     * Admin ID who performed the update
     */
    private Long updatedBy;

    /**
     * Total number of flags updated
     */
    private Integer flagsUpdated;

    /**
     * Any additional notes or context about the update
     */
    private String notes;

    public ProfileFlagResponseDTO(
        String applicationId,
        Map<String, Boolean> updatedFlags,
        String message
    ) {
        this.applicationId = applicationId;
        this.updatedFlags = updatedFlags;
        this.message = message;
        this.updatedAt = LocalDateTime.now();
        this.flagsUpdated = updatedFlags != null ? updatedFlags.size() : 0;
    }
}
