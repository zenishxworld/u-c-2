package com.uniflow.common.events;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Event DTO for verification link generation and publishing to Kafka.
 *
 * <p>This event is published to the verification-links topic whenever a verification link is
 * generated for user email verification.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerificationLinkEvent {

  /** Unique identifier for the verification token */
  @JsonProperty("token")
  private String token;

  /** User's email address */
  @JsonProperty("email")
  private String email;

  /** Complete verification link URL */
  @JsonProperty("link")
  private String link;

  /** User ID who the verification is for */
  @JsonProperty("user_id")
  private Long userId;

  /** Type of user (STUDENT, ADMIN, etc.) */
  @JsonProperty("user_type")
  private String userType;

  /** When the verification token expires */
  @JsonProperty("expires_at")
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime expiresAt;

  /** When the event was created */
  @JsonProperty("created_at")
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime createdAt;

  /** Event type for categorization */
  @JsonProperty("event_type")
  @Builder.Default
  private String eventType = "VERIFICATION_LINK_GENERATED";

  /** Additional metadata */
  @JsonProperty("metadata")
  private EventMetadata metadata;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class EventMetadata {

    /** Source system that generated the event */
    @JsonProperty("source")
    @Builder.Default
    private String source = "uniflow-auth-service";

    /** Version of the event schema */
    @JsonProperty("version")
    @Builder.Default
    private String version = "1.0";

    /** Environment where the event was generated */
    @JsonProperty("environment")
    private String environment;

    /** Request ID for tracing */
    @JsonProperty("request_id")
    private String requestId;
  }
}
