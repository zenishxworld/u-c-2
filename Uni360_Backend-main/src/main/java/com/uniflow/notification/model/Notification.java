package com.uniflow.notification.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.function.Predicate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Enhanced Notification entity with functional patterns and reactive composition.
 * Follows enterprise domain-driven design with immutable patterns where appropriate.
 */
@Table("notifications")
public class Notification {

    @Id
    private UUID id;

    @Column("user_id")
    private Long userId;

    @Column("sender_id")
    private Long senderId;

    @Column("type")
    private NotificationType type;

    @Column("title")
    private String title;

    @Column("message")
    private String message;

    @Column("content_type")
    private ContentType contentType;

    @Column("status")
    private NotificationStatus status;

    @Column("action_url")
    private String actionUrl;

    @Column("metadata")
    private JsonNode metadata;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("read_at")
    private LocalDateTime readAt;

    // Functional predicates for validation and filtering
    @JsonIgnore
    public static final Predicate<Notification> IS_UNREAD = notification ->
        notification != null &&
        NotificationStatus.isUnread(notification.getStatus());

    @JsonIgnore
    public static final Predicate<Notification> IS_ACTIONABLE = notification ->
        notification != null &&
        notification.getActionUrl() != null &&
        !notification.getActionUrl().trim().isEmpty();

    // Default constructor required by Spring Data
    public Notification() {
        // Do not set ID - let R2DBC generate it on INSERT
        this.status = NotificationStatus.UNREAD;
        this.contentType = ContentType.PLAIN;
        this.createdAt = LocalDateTime.now();
    }

    // Business method with functional validation
    public Notification markAsRead() {
        if (
            NotificationStatus.canTransitionTo(
                this.status,
                NotificationStatus.READ
            )
        ) {
            this.status = NotificationStatus.READ;
            this.readAt = LocalDateTime.now();
        }
        return this;
    }

    // Domain validation method
    public boolean belongsToUser(Long userId) {
        return userId != null && userId.equals(this.userId);
    }

    // Builder pattern for fluent construction
    public static class NotificationBuilder {

        public static NotificationBuilder forUser(Long userId) {
            NotificationBuilder builder = new NotificationBuilder();
            builder.notification.userId = userId;
            return builder;
        }

        public NotificationBuilder fromSender(Long senderId) {
            this.notification.senderId = senderId;
            return this;
        }

        public NotificationBuilder withWorkflowMetadata(
            String taskName,
            String stageName,
            String applicationId
        ) {
            com.fasterxml.jackson.databind.ObjectMapper mapper =
                new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.node.ObjectNode metadataNode =
                mapper.createObjectNode();
            metadataNode.put("taskName", taskName);
            metadataNode.put("stageName", stageName);
            metadataNode.put("applicationId", applicationId);
            this.notification.metadata = metadataNode;
            return this;
        }

        public NotificationBuilder withType(NotificationType type) {
            this.notification.type = type;
            return this;
        }

        public NotificationBuilder withTitle(String title) {
            this.notification.title = title;
            return this;
        }

        public NotificationBuilder withMessage(String message) {
            this.notification.message = message;
            return this;
        }

        public NotificationBuilder withContentType(ContentType contentType) {
            this.notification.contentType = contentType;
            return this;
        }

        public NotificationBuilder withActionUrl(String actionUrl) {
            this.notification.actionUrl = actionUrl;
            return this;
        }

        public NotificationBuilder withMetadata(Map<String, Object> metadata) {
            if (metadata != null) {
                com.fasterxml.jackson.databind.ObjectMapper mapper =
                    new com.fasterxml.jackson.databind.ObjectMapper();
                this.notification.metadata = mapper.valueToTree(metadata);
            }
            return this;
        }

        public NotificationBuilder withMetadata(JsonNode metadata) {
            this.notification.metadata = metadata;
            return this;
        }

        public Notification build() {
            return this.notification;
        }

        private final Notification notification = new Notification();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public NotificationType getType() {
        return type;
    }

    public void setType(NotificationType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public ContentType getContentType() {
        return contentType;
    }

    public void setContentType(ContentType contentType) {
        this.contentType = contentType;
    }

    public NotificationStatus getStatus() {
        return status;
    }

    public void setStatus(NotificationStatus status) {
        this.status = status;
    }

    public String getActionUrl() {
        return actionUrl;
    }

    public void setActionUrl(String actionUrl) {
        this.actionUrl = actionUrl;
    }

    public JsonNode getMetadata() {
        return metadata;
    }

    public void setMetadata(JsonNode metadata) {
        this.metadata = metadata;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }

    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }

    @Override
    public String toString() {
        return (
            "Notification{" +
            "id=" +
            id +
            ", userId=" +
            userId +
            ", senderId=" +
            senderId +
            ", type=" +
            type +
            ", title='" +
            title +
            '\'' +
            ", status=" +
            status +
            ", createdAt=" +
            createdAt +
            '}'
        );
    }
}
