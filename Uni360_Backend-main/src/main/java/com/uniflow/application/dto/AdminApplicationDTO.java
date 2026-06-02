package com.uniflow.application.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for Admin Applications List Response
 * Used by admins to view all applications they can manage
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminApplicationDTO {

    private String id;

    @JsonProperty("referenceNumber")
    private String referenceNumber;

    private String status;

    @JsonProperty("workflowStage")
    private String workflowStage;

    private String priority;

    @JsonProperty("universityName")
    private String universityName;

    @JsonProperty("programName")
    private String programName;

    @JsonProperty("countryCode")
    private String countryCode;

    @JsonProperty("degreeLevel")
    private String degreeLevel;

    @JsonProperty("intakeTerm")
    private String intakeTerm;

    @JsonProperty("submittedAt")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime submittedAt;

    private StudentInfo student;

    @JsonProperty("assignedAdmin")
    private AssignedAdminInfo assignedAdmin;

    @JsonProperty("completionPercentage")
    private Integer completionPercentage;

    @JsonProperty("workflowProgress")
    private WorkflowProgressInfo workflowProgress;

    @JsonProperty("isUrgent")
    private Boolean isUrgent;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudentInfo {
        private Long id;
        private String name;
        private String email;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AssignedAdminInfo {
        private Long id;
        private String name;
        private String email;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WorkflowProgressInfo {
        @JsonProperty("currentStage")
        private String currentStage;

        @JsonProperty("estimatedCompletion")
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime estimatedCompletion;

        @JsonProperty("pendingTasks")
        private Integer pendingTasks;

        @JsonProperty("completedTasks")
        private Integer completedTasks;

        @JsonProperty("totalTasks")
        private Integer totalTasks;

        @JsonProperty("requiresAdminAction")
        private Boolean requiresAdminAction;
    }
}
