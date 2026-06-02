package com.uniflow.student.dto.dashboard;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for Profile Progress KPI Card
 * Part of ST-02: Enhanced Student Dashboard KPIs
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Profile Progress KPI Card data")
public class ProfileProgressKPIDTO {

    @Schema(description = "Profile completion percentage", example = "75")
    private Integer completionPercentage;

    @Schema(description = "Total profile sections", example = "8")
    private Integer totalSections;

    @Schema(description = "Completed profile sections", example = "6")
    private Integer completedSections;

    @Schema(description = "Missing profile sections", example = "2")
    private Integer missingSections;

    @Schema(description = "Profile completion status")
    private String completionStatus; // "INCOMPLETE", "MOSTLY_COMPLETE", "COMPLETE"

    @Schema(description = "Next recommended step")
    private String nextRecommendedStep;

    @Schema(description = "List of missing profile steps")
    private List<MissingProfileStep> missingSteps;

    @Schema(description = "Profile strength indicator")
    private String profileStrength; // "WEAK", "MODERATE", "STRONG", "EXCELLENT"

    @Schema(description = "Estimated time to complete profile")
    private String estimatedTimeToComplete;

    /**
     * Nested class for missing profile steps
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @Schema(description = "Missing profile step information")
    public static class MissingProfileStep {

        @Schema(description = "Step name", example = "Education Details")
        private String stepName;

        @Schema(description = "Step description", example = "Add your educational background")
        private String description;

        @Schema(description = "Step priority", example = "HIGH")
        private String priority; // "HIGH", "MEDIUM", "LOW"

        @Schema(description = "Estimated minutes to complete", example = "10")
        private Integer estimatedMinutes;

        @Schema(description = "Step completion URL", example = "/profile/education")
        private String completionUrl;
    }
}
