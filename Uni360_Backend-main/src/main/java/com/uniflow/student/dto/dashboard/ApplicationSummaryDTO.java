package com.uniflow.student.dto.dashboard;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for Application Summary used in Dashboard KPIs
 * Simplified version of ApplicationResponseDTO for dashboard purposes
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Application summary for dashboard KPIs")
public class ApplicationSummaryDTO {

    @Schema(description = "Application ID", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID id;

    @Schema(description = "Application reference number", example = "APP-2024-001")
    private String referenceNumber;

    @Schema(description = "Student ID", example = "1001")
    private Long studentId;

    @Schema(description = "Target university ID")
    private UUID targetUniversityId;

    @Schema(description = "Target course ID")
    private UUID targetCourseId;

    @Schema(description = "University name", example = "Harvard University")
    private String universityName;

    @Schema(description = "Course name", example = "Computer Science MS")
    private String courseName;

    @Schema(description = "Application status", example = "IN_PROGRESS")
    private String status;

    @Schema(description = "Application type", example = "FULL_TIME")
    private String applicationType;

    @Schema(description = "Program level", example = "MASTERS")
    private String programLevel;

    @Schema(description = "Target semester", example = "FALL")
    private String targetSemester;

    @Schema(description = "Target year", example = "2024")
    private Integer targetYear;

    @Schema(description = "Priority level", example = "HIGH")
    private String priority;

    @Schema(description = "Workflow stage", example = "DOCUMENT_SUBMISSION")
    private String workflowStage;

    @Schema(description = "Application created date")
    private LocalDateTime createdAt;

    @Schema(description = "Application last updated date")
    private LocalDateTime updatedAt;

    @Schema(description = "Submission date")
    private LocalDateTime submittedAt;

    @Schema(description = "Country code", example = "US")
    private String countryCode;

    @Schema(description = "Is application submitted", example = "false")
    private Boolean isSubmitted;

    @Schema(description = "Application progress percentage", example = "75")
    private Integer progressPercentage;

    /**
     * Helper method to determine if application is active
     */
    public boolean isActive() {
        return status != null &&
               !"CANCELLED".equals(status) &&
               !"REJECTED".equals(status) &&
               !"WITHDRAWN".equals(status);
    }

    /**
     * Helper method to determine if application is completed
     */
    public boolean isCompleted() {
        return "ACCEPTED".equals(status) ||
               "ENROLLED".equals(status) ||
               "REJECTED".equals(status) ||
               "WITHDRAWN".equals(status);
    }

    /**
     * Helper method to get display name
     */
    public String getDisplayName() {
        if (universityName != null && courseName != null) {
            return courseName + " at " + universityName;
        } else if (universityName != null) {
            return universityName;
        } else if (courseName != null) {
            return courseName;
        }
        return "Application " + (referenceNumber != null ? referenceNumber : id);
    }
}
