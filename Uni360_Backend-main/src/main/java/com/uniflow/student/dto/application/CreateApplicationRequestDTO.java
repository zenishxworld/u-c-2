package com.uniflow.student.dto.application;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Simplified CreateApplicationRequestDTO for Phase 18 Application API
 *
 * This DTO handles the simplified application creation flow following
 * the Phase 18 implementation plan for streamlined application management.
 *
 * @author UniFLow Development Team
 * @version 2.0 (Phase 18)
 * @since 2024-01-01
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateApplicationRequestDTO {

    // Core Required Fields
    @NotNull(message = "Student ID is required")
    @JsonProperty("studentId")
    private Long studentId;

    @NotNull(message = "Target university ID is required")
    @JsonProperty("targetUniversityId")
    private String targetUniversityId;

    @NotNull(message = "Target course ID is required")
    @JsonProperty("targetCourseId")
    private String targetCourseId;

    @NotBlank(message = "Target semester is required")
    @Pattern(regexp = "^(FALL|SPRING|SUMMER|WINTER)$", message = "Invalid semester. Must be FALL, SPRING, SUMMER, or WINTER")
    @JsonProperty("targetSemester")
    private String targetSemester;

    @NotNull(message = "Target year is required")
    @Min(value = 2024, message = "Target year must be current year or later")
    @Max(value = 2030, message = "Target year cannot be more than 6 years in the future")
    @JsonProperty("targetYear")
    private Integer targetYear;

    // Optional Fields
    @JsonProperty("alternateUniversityId")
    private String alternateUniversityId;

    @JsonProperty("alternateCourseId")
    private String alternateCourseId;

    @JsonProperty("source")
    private String source;

    @JsonProperty("priority")
    private String priority;

    @JsonProperty("isUrgent")
    private Boolean isUrgent;

    @JsonProperty("expediteProcessing")
    private Boolean expediteProcessing;

    @JsonProperty("communicationPreference")
    private String communicationPreference;

    @JsonProperty("languagePreference")
    private String languagePreference;

    @JsonProperty("specialRequirements")
    private String specialRequirements;

    // Validation methods
    public void setDefaults() {
        if (source == null) {
            source = "DIRECT";
        }
        if (priority == null) {
            priority = "NORMAL";
        }
        if (isUrgent == null) {
            isUrgent = false;
        }
        if (expediteProcessing == null) {
            expediteProcessing = false;
        }
        if (communicationPreference == null) {
            communicationPreference = "EMAIL";
        }
        if (languagePreference == null) {
            languagePreference = "EN";
        }
    }

    public boolean isValid() {
        return studentId != null
            && targetUniversityId != null
            && targetCourseId != null
            && targetSemester != null
            && targetYear != null;
    }
}
