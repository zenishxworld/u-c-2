package com.uniflow.notification.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.uniflow.auth.repository.UserRepository;
import com.uniflow.notification.dto.NotificationRequest;
import com.uniflow.notification.model.ContentType;
import com.uniflow.notification.model.NotificationType;
import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

/**
 * Workflow integration service for automatic notification generation.
 * Handles notifications triggered by workflow events like task and stage completion.
 */
@Slf4j
@Service
public class WorkflowNotificationService {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public WorkflowNotificationService(
        NotificationService notificationService,
        UserRepository userRepository,
        ObjectMapper objectMapper
    ) {
        this.notificationService = notificationService;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Send notification when a workflow task is completed
     */
    public Mono<Void> notifyTaskCompletion(
        Long studentId,
        String taskName,
        String stageName,
        String applicationId,
        Long completedByUserId
    ) {
        String displayTaskName = formatTaskDisplayName(taskName);
        String displayStageName = formatStageDisplayName(stageName);

        NotificationRequest request = new NotificationRequest();
        request.setRecipientId(studentId);
        request.setType(NotificationType.TASK_COMPLETION);
        request.setTitle("Task Completed: " + displayTaskName);
        request.setMessage(
            createTaskCompletionMessage(displayTaskName, displayStageName)
        );
        request.setContentType(ContentType.PLAIN);
        request.setActionUrl("/applications/" + applicationId);

        ObjectNode metadata = objectMapper.createObjectNode();
        metadata.put("taskName", taskName);
        metadata.put("stageName", stageName);
        metadata.put("applicationId", applicationId);
        metadata.put("completedBy", completedByUserId);
        metadata.put("eventType", "TASK_COMPLETION");
        request.setMetadata(metadata);

        return notificationService
            .sendNotification(request, completedByUserId)
            .then()
            .doOnSuccess(unused ->
                log.info(
                    "Task completion notification sent for task: {}", taskName
                )
            )
            .doOnError(error ->
                log.error(
                    "Failed to send task completion notification: {}",
                    error.getMessage()
                )
            );
    }

    /**
     * Send notification when a workflow stage is completed
     */
    public Mono<Void> notifyStageCompletion(
        Long studentId,
        String stageName,
        String applicationId,
        Long completedByUserId
    ) {
        String displayStageName = formatStageDisplayName(stageName);

        NotificationRequest request = new NotificationRequest();
        request.setRecipientId(studentId);
        request.setType(NotificationType.STAGE_COMPLETION);
        request.setTitle("Stage Completed: " + displayStageName);
        request.setMessage(createStageCompletionMessage(displayStageName));
        request.setContentType(ContentType.PLAIN);
        request.setActionUrl("/applications/" + applicationId);

        ObjectNode metadata = objectMapper.createObjectNode();
        metadata.put("stageName", stageName);
        metadata.put("applicationId", applicationId);
        metadata.put("completedBy", completedByUserId);
        metadata.put("eventType", "STAGE_COMPLETION");
        request.setMetadata(metadata);

        return notificationService
            .sendNotification(request, completedByUserId)
            .then()
            .doOnSuccess(unused ->
                log.info(
                    "Stage completion notification sent for stage: {}", stageName
                )
            )
            .doOnError(error ->
                log.error(
                    "Failed to send stage completion notification: {}",
                    error.getMessage()
                )
            );
    }

    // Private helper methods

    private String formatTaskDisplayName(String taskName) {
        if (taskName == null || taskName.trim().isEmpty()) {
            return "Unknown Task";
        }

        // Convert snake_case or camelCase to human-readable format
        String formatted = taskName
            .replaceAll("([a-z])([A-Z])", "$1 $2") // camelCase to spaces
            .replaceAll("_", " ") // snake_case to spaces
            .replaceAll("\\s+", " ") // multiple spaces to single space
            .trim()
            .toLowerCase();

        // Capitalize first letter of each word
        String[] words = formatted.split(" ");
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < words.length; i++) {
            if (i > 0) result.append(" ");
            if (words[i].length() > 0) {
                result
                    .append(Character.toUpperCase(words[i].charAt(0)))
                    .append(words[i].substring(1));
            }
        }
        return result.toString();
    }

    private String formatStageDisplayName(String stageName) {
        return formatTaskDisplayName(stageName);
    }

    private String createTaskCompletionMessage(
        String taskName,
        String stageName
    ) {
        return String.format(
            "Great news! The task '%s' in stage '%s' has been completed. " +
                "You can view the updated status in your application dashboard.",
            taskName,
            stageName
        );
    }

    private String createStageCompletionMessage(String stageName) {
        return String.format(
            "Congratulations! The '%s' stage of your application has been completed. " +
                "Your application is now ready for the next step in the process.",
            stageName
        );
    }
}
