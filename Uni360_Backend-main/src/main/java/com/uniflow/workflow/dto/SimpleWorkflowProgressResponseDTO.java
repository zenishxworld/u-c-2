package com.uniflow.workflow.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * SimpleWorkflowProgressResponseDTO - Simplified workflow progress response
 *
 * <p>Clean, minimal progress response similar to ProfileBuilderService pattern.
 * Contains only essential information needed by frontend.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SimpleWorkflowProgressResponseDTO {

    private boolean success;
    private String message;
    private ProgressData data;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    /**
     * Essential progress data only
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ProgressData {

        private Integer current; // Completed tasks count
        private Integer total; // Total tasks count
        private Integer percentage; // Completion percentage
        private String stage; // Current stage name
        private String currentStep; // Current task type (next to execute)
        private List<String> completedSteps; // Completed task types
        private List<String> remainingSteps; // Remaining task types
        private NextTaskInfo nextTask; // Next task details for execution
        private NextTaskInfo currentTask; // Current active task details for execution
        private List<StageInfo> allStages; // Complete workflow structure with all stages and tasks

        /**
         * Complete stage information with nested tasks
         */
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        @JsonInclude(JsonInclude.Include.NON_NULL)
        public static class StageInfo {

            private String stageName;
            private String displayName;
            private Integer order;
            private String status; // "COMPLETED", "IN_PROGRESS", "PENDING"
            private List<TaskInfo> tasks;
        }

        /**
         * Task information within a stage
         */
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        @JsonInclude(JsonInclude.Include.NON_NULL)
        public static class TaskInfo {

            private String taskType;
            private String displayName;
            private String status; // "COMPLETED", "ACTIVE", "PENDING"
            private String description;
        }

        /**
         * Next task information for frontend execution
         */
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        @JsonInclude(JsonInclude.Include.NON_NULL)
        public static class NextTaskInfo {

            private String taskId;
            private String taskType;
            private String displayName;
            private String description;
            private String status;
            private List<String> availableActions;
            private Boolean canExecute;
            private FormData formData;
            private List<String> requiredFlags;

            /**
             * Form structure for task completion
             */
            @Data
            @NoArgsConstructor
            @AllArgsConstructor
            @Builder
            @JsonInclude(JsonInclude.Include.NON_NULL)
            public static class FormData {

                private List<FormField> fields;

                @Data
                @NoArgsConstructor
                @AllArgsConstructor
                @Builder
                public static class FormField {

                    private String name;
                    private String type; // "text", "textarea", "select", "number"
                    private String label;
                    private Boolean required;
                    private String placeholder;
                    private List<String> options; // For select fields
                }
            }
        }
    }

    /**
     * Factory method for success response
     */
    public static SimpleWorkflowProgressResponseDTO success(ProgressData data) {
        return SimpleWorkflowProgressResponseDTO.builder()
            .success(true)
            .message("Progress retrieved successfully")
            .data(data)
            .timestamp(LocalDateTime.now())
            .build();
    }

    /**
     * Factory method for error response
     */
    public static SimpleWorkflowProgressResponseDTO error(String message) {
        return SimpleWorkflowProgressResponseDTO.builder()
            .success(false)
            .message(message)
            .timestamp(LocalDateTime.now())
            .build();
    }
}
