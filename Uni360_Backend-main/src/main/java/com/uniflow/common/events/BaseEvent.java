package com.uniflow.common.events;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * Base event class for all inter-service communication events. Provides common fields and structure
 * for event-driven architecture.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "eventType")
@JsonSubTypes({
  @JsonSubTypes.Type(value = StudentEvent.class, name = "STUDENT_EVENT"),
  @JsonSubTypes.Type(value = ApplicationEvent.class, name = "APPLICATION_EVENT"),
  @JsonSubTypes.Type(value = AdminEvent.class, name = "ADMIN_EVENT"),
  @JsonSubTypes.Type(value = WorkflowEvent.class, name = "WORKFLOW_EVENT"),
  @JsonSubTypes.Type(value = NotificationEvent.class, name = "NOTIFICATION_EVENT"),
  @JsonSubTypes.Type(value = UniversityEvent.class, name = "UNIVERSITY_EVENT"),
  @JsonSubTypes.Type(value = AuthEvent.class, name = "AUTH_EVENT"),
  @JsonSubTypes.Type(value = PasswordResetEvent.class, name = "PASSWORD_RESET_EVENT"),
})
public abstract class BaseEvent {

  /** Unique identifier for this event */
  private String eventId = UUID.randomUUID().toString();

  /** Type of the event (will be set by subclasses) */
  private String eventType;

  /** Source service that generated this event */
  private String sourceService;

  /** Target service(s) for this event (optional) */
  private String targetService;

  /** Timestamp when the event was created */
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS")
  private LocalDateTime timestamp = LocalDateTime.now();

  /** Version of the event schema for compatibility */
  private String version = "1.0";

  /** Correlation ID to track related events across services */
  private String correlationId;

  /** User ID associated with this event (if applicable) */
  private Long userId;

  /** Client ID for multi-tenant support */
  private String clientId;

  /** Additional metadata for the event */
  private Map<String, Object> metadata;

  /** Priority level for event processing */
  private EventPriority priority = EventPriority.NORMAL;

  /** Whether this event should be retried on failure */
  private boolean retryable = true;

  /** Maximum number of retry attempts */
  private int maxRetries = 3;

  /** Event priority levels */
  public enum EventPriority {
    HIGH,
    NORMAL,
    LOW,
  }

  /** Common event action types */
  public enum EventAction {
    CREATED,
    UPDATED,
    DELETED,
    SUBMITTED,
    APPROVED,
    REJECTED,
    ASSIGNED,
    COMPLETED,
    CANCELLED,
    EXPIRED,
    SUSPENDED,
    ACTIVATED,
    NOTIFICATION_SENT,
    LOGIN,
    LOGOUT,
    PASSWORD_CHANGED,
  }

  /** Event status for tracking processing */
  public enum EventStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED,
    RETRYING,
    DEAD_LETTER,
  }
}
