package com.uniflow.student.dto.application;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for student applications list endpoint
 * Used for /api/v1/students/applications API consolidation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentApplicationsResponseDTO {

    private List<StudentApplicationSummaryDTO> applications;
    private PaginationDTO pagination;
    private ApplicationSummaryStatsDTO summary;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime timestamp;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentApplicationSummaryDTO {

        private UUID id;
        private String referenceNumber;
        private String universityName;
        private String programName;
        private ApplicationDegreeLevel degreeLevel;
        private ApplicationIntakeTerm intakeTerm;
        private ApplicationStatus status;
        private String countryCode;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime submittedAt;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime applicationDeadline;

        private AssignedAdminDTO assignedAdmin;
        private ApplicationWorkflowStage currentStage;
        private Integer completionPercentage;
        private WorkflowProgressDTO workflowProgress;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignedAdminDTO {

        private Long id;
        private String name;
        private String email;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkflowProgressDTO {

        private String currentStep;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime estimatedCompletion;

        private Integer pendingTasks;
        private Boolean requiresStudentAction;
        private String nextActionRequired;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaginationDTO {

        private Integer page;
        private Integer size;
        private Long total;
        private Integer totalPages;
        private Boolean hasNext;
        private Boolean hasPrevious;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplicationSummaryStatsDTO {

        private Integer totalApplications;
        private Integer draftApplications;
        private Integer submittedApplications;
        private Integer underReviewApplications;
        private Integer approvedApplications;
        private Integer rejectedApplications;
    }

    // Application Status Enum
    public enum ApplicationStatus {
        DRAFT("draft"),
        SUBMITTED("submitted"),
        UNDER_REVIEW("under_review"),
        DOCUMENTS_REQUESTED("documents_requested"),
        DOCUMENTS_VERIFIED("documents_verified"),
        PAYMENT_PENDING("payment_pending"),
        PAYMENT_COMPLETED("payment_completed"),
        UNIVERSITY_SUBMITTED("university_submitted"),
        ACCEPTED("accepted"),
        REJECTED("rejected"),
        ENROLLED("enrolled"),
        WITHDRAWN("withdrawn"),
        EXPIRED("expired");

        private final String value;

        ApplicationStatus(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public static ApplicationStatus fromValue(String value) {
            for (ApplicationStatus status : values()) {
                if (status.value.equals(value)) {
                    return status;
                }
            }
            return null;
        }
    }

    // Degree Level Enum
    public enum ApplicationDegreeLevel {
        BACHELORS("bachelors"),
        MASTERS("masters"),
        DOCTORATE("doctorate"),
        DIPLOMA("diploma"),
        CERTIFICATE("certificate");

        private final String value;

        ApplicationDegreeLevel(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public static ApplicationDegreeLevel fromValue(String value) {
            for (ApplicationDegreeLevel level : values()) {
                if (level.value.equals(value)) {
                    return level;
                }
            }
            return null;
        }
    }

    // Intake Term Enum
    public enum ApplicationIntakeTerm {
        WINTER_2024("winter_2024"),
        SUMMER_2024("summer_2024"),
        WINTER_2025("winter_2025"),
        SUMMER_2025("summer_2025"),
        WINTER_2026("winter_2026"),
        SUMMER_2026("summer_2026"),
        FALL_2024("fall_2024"),
        SPRING_2024("spring_2024"),
        FALL_2025("fall_2025"),
        SPRING_2025("spring_2025"),
        FALL_2026("fall_2026"),
        SPRING_2026("spring_2026");

        private final String value;

        ApplicationIntakeTerm(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public static ApplicationIntakeTerm fromValue(String value) {
            for (ApplicationIntakeTerm term : values()) {
                if (term.value.equals(value)) {
                    return term;
                }
            }
            return null;
        }

        public static ApplicationIntakeTerm fromSeasonAndYear(
            String season,
            Integer year
        ) {
            if (season == null || year == null) {
                return null;
            }
            String normalizedValue = season.toLowerCase() + "_" + year;
            return fromValue(normalizedValue);
        }
    }

    // Workflow Stage Enum
    public enum ApplicationWorkflowStage {
        DRAFT("draft"),
        SUBMISSION("submission"),
        DOCUMENT_VERIFICATION("document_verification"),
        APS_CERTIFICATE("aps_certificate"),
        PAYMENT_PROCESSING("payment_processing"),
        UNIVERSITY_SUBMISSION("university_submission"),
        UNIVERSITY_REVIEW("university_review"),
        DECISION("decision"),
        ENROLLMENT("enrollment"),
        COMPLETED("completed"),
        CLOSED("closed");

        private final String value;

        ApplicationWorkflowStage(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public static ApplicationWorkflowStage fromValue(String value) {
            for (ApplicationWorkflowStage stage : values()) {
                if (stage.value.equals(value)) {
                    return stage;
                }
            }
            return null;
        }
    }
}
