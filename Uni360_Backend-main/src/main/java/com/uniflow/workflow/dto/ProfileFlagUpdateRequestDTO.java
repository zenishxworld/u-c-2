package com.uniflow.workflow.dto;

import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating student profile flags
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileFlagUpdateRequestDTO {

    /**
     * Map of flag names to boolean values
     * Example: {"academic_documents_uploaded": true, "gpa_calculated": false}
     */
    private Map<String, Boolean> flags;

    /**
     * Optional notes about the flag updates
     */
    private String notes;

    /**
     * Admin ID making the update (optional, will be extracted from auth context)
     */
    private Long updatedBy;
}
