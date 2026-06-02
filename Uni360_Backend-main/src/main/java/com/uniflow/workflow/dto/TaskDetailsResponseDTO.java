package com.uniflow.workflow.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * TaskDetailsResponseDTO - Detailed task information response
 *
 * <p>This DTO provides comprehensive task details including related application,
 * student information, workflow progress, and related tasks.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskDetailsResponseDTO {

    private TaskDTO task;
    private ApplicationInfo application;
    private StudentInfo student;
    private WorkflowProgress workflowProgress;
    private List<TaskDTO> relatedTasks;
    private List<TaskHistoryEntry> taskHistory;
    private List<DocumentInfo> documents;
    private List<CommentEntry> comments;
    private TaskRequirements requirements;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
    private LocalDateTime retrievedAt;

    private String retrievedBy;

    /**
     * Application information related to the task
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ApplicationInfo {
        private String applicationId;
        private String referenceNumber;
        private String status;
        private String priority;
        private String degreeLevel;
        private String programName;
        private String universityName;
        private String countryCode;
        private String countryName;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime submittedAt;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime deadline;

        private String intakeSession;
        private String applicationSource;
        private Map<String, Object> customFields;
        private Integer completionPercentage;
    }

    /**
     * Student information related to the task
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudentInfo {
        private String studentId;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private String nationality;
        private String passportNumber;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime dateOfBirth;

        private String currentEducationLevel;
        private String previousUniversity;
        private String englishProficiency;
        private Double gpa;
        private String profileStatus;
        private Integer profileCompletionPercentage;
    }

    /**
     * Workflow progress information
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WorkflowProgress {
        private String workflowInstanceId;
        private String workflowDefinitionKey;
        private String currentStage;
        private String previousStage;
        private String nextStage;
        private Integer totalStages;
        private Integer completedStages;
        private Integer overallCompletionPercentage;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime workflowStartedAt;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime estimatedCompletion;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime actualCompletion;

        private Long elapsedTimeHours;
        private Long remainingTimeHours;
        private Boolean isOnTrack;
        private String slaStatus; // ON_TRACK, AT_RISK, BREACHED

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime slaDeadline;

        private List<StageInfo> stageHistory;
        private List<MilestoneInfo> milestones;
    }

    /**
     * Stage information in workflow progress
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StageInfo {
        private String stageName;
        private String stageStatus; // PENDING, IN_PROGRESS, COMPLETED, SKIPPED
        private String stageDescription;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime startedAt;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime completedAt;

        private Integer estimatedDurationHours;
        private Integer actualDurationHours;
        private String completedBy;
        private List<String> requiredPermissions;
    }

    /**
     * Milestone information
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MilestoneInfo {
        private String milestoneName;
        private String milestoneType; // DOCUMENT_VERIFICATION, PAYMENT, SUBMISSION
        private String status; // PENDING, COMPLETED, FAILED

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime targetDate;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime completedDate;

        private String description;
        private Boolean isCritical;
    }

    /**
     * Task history entry
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskHistoryEntry {
        private String action; // CREATED, CLAIMED, STARTED, COMPLETED, REASSIGNED
        private String performedBy;
        private String performedByName;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime performedAt;

        private String description;
        private String previousValue;
        private String newValue;
        private String reason;
        private JsonNode metadata;
    }

    /**
     * Document information
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DocumentInfo {
        private String documentId;
        private String documentName;
        private String documentType;
        private String documentCategory; // ACADEMIC, LANGUAGE, FINANCIAL, IDENTITY
        private String verificationStatus; // PENDING, VERIFIED, REJECTED, EXPIRED
        private String fileUrl;
        private String fileName;
        private Long fileSize;
        private String mimeType;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime uploadedAt;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime verifiedAt;

        private String verifiedBy;
        private String verificationNotes;
        private Boolean isRequired;
        private Boolean isValid;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime expiryDate;
    }

    /**
     * Comment entry for task
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CommentEntry {
        private String commentId;
        private String commentText;
        private String commentType; // NOTE, QUESTION, ISSUE, RESOLUTION
        private String authorId;
        private String authorName;
        private String authorRole;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime createdAt;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'")
        private LocalDateTime updatedAt;

        private Boolean isInternal; // Internal admin comment vs visible to student
        private Boolean isImportant;
        private List<String> attachments;
        private String parentCommentId; // For threaded comments
    }

    /**
     * Task requirements and validation info
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskRequirements {
        private List<String> requiredPermissions;
        private List<String> requiredDocuments;
        private List<String> requiredFields;
        private List<ValidationRule> validationRules;
        private Map<String, Object> businessRules;
        private List<String> dependencies;
        private String formKey;
        private String helpText;
        private List<ActionButton> availableActions;
    }

    /**
     * Validation rule for task completion
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ValidationRule {
        private String ruleName;
        private String ruleType; // REQUIRED, FORMAT, RANGE, BUSINESS
        private String description;
        private String errorMessage;
        private JsonNode ruleConfig;
        private Boolean isBlocking; // Whether this rule blocks task completion
    }

    /**
     * Available action buttons for the task
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ActionButton {
        private String actionId;
        private String actionName;
        private String actionType; // COMPLETE, REJECT, ESCALATE, REASSIGN, COMMENT
        private String buttonStyle; // PRIMARY, SECONDARY, DANGER, WARNING
        private String confirmationMessage;
        private Boolean requiresComment;
        private List<String> requiredPermissions;
        private Boolean isEnabled;
    }

    /**
     * Factory method for successful response
     */
    public static TaskDetailsResponseDTO success(
        TaskDTO task,
        ApplicationInfo application,
        StudentInfo student,
        WorkflowProgress workflowProgress,
        List<TaskDTO> relatedTasks
    ) {
        return TaskDetailsResponseDTO.builder()
            .task(task)
            .application(application)
            .student(student)
            .workflowProgress(workflowProgress)
            .relatedTasks(relatedTasks)
            .retrievedAt(LocalDateTime.now())
            .build();
    }

    /**
     * Helper method to check if task is overdue
     */
    public boolean isOverdue() {
        return task != null && task.getDueDate() != null &&
               task.getDueDate().isBefore(LocalDateTime.now());
    }

    /**
     * Helper method to check if task is urgent
     */
    public boolean isUrgent() {
        return task != null && task.getPriority() != null && task.getPriority() >= 4;
    }

    /**
     * Helper method to check if workflow is on track
     */
    public boolean isWorkflowOnTrack() {
        return workflowProgress != null && Boolean.TRUE.equals(workflowProgress.getIsOnTrack());
    }

    /**
     * Helper method to get completion percentage
     */
    public Integer getCompletionPercentage() {
        return workflowProgress != null ? workflowProgress.getOverallCompletionPercentage() : 0;
    }

    /**
     * Helper method to check if all required documents are verified
     */
    public boolean areAllDocumentsVerified() {
        if (documents == null || documents.isEmpty()) return true;

        return documents.stream()
            .filter(doc -> Boolean.TRUE.equals(doc.getIsRequired()))
            .allMatch(doc -> "VERIFIED".equals(doc.getVerificationStatus()));
    }

    /**
     * Helper method to get pending document count
     */
    public long getPendingDocumentCount() {
        if (documents == null || documents.isEmpty()) return 0;

        return documents.stream()
            .filter(doc -> "PENDING".equals(doc.getVerificationStatus()))
            .count();
    }
}
