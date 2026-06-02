package com.uniflow.common.events;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * Event for password reset operations including forgot password requests, temporary credentials
 * generation, and password updates.
 *
 * <p>This event is published whenever password reset related operations occur and is used for
 * notification, auditing, and security monitoring purposes.
 */
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class PasswordResetEvent extends BaseEvent {

  @JsonProperty("email")
  private String email;

  @JsonProperty("reset_token")
  private String resetToken;

  @JsonProperty("reset_link")
  private String resetLink;

  @JsonProperty("user_type")
  private String userType;

  @JsonProperty("action")
  private PasswordResetAction action;

  @JsonProperty("expires_at")
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS")
  private LocalDateTime expiresAt;

  @JsonProperty("ip_address")
  private String ipAddress;

  @JsonProperty("user_agent")
  private String userAgent;

  @JsonProperty("temporary_password")
  private String temporaryPassword;

  @JsonProperty("temporary_credentials_expires_at")
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS")
  private LocalDateTime temporaryCredentialsExpiresAt;

  @JsonProperty("notification_modes")
  private String[] notificationModes;

  @JsonProperty("security_context")
  private SecurityContext securityContext;

  /** Password reset action types */
  public enum PasswordResetAction {
    FORGOT_PASSWORD_REQUESTED,
    RESET_LINK_CLICKED,
    TEMPORARY_CREDENTIALS_GENERATED,
    PASSWORD_RESET_COMPLETED,
    RESET_TOKEN_EXPIRED,
    INVALID_RESET_ATTEMPT
  }

  /** Security context for the password reset event */
  @Data
  @SuperBuilder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SecurityContext {
    @JsonProperty("client_info")
    private String clientInfo;

    @JsonProperty("session_id")
    private String sessionId;

    @JsonProperty("device_fingerprint")
    private String deviceFingerprint;

    @JsonProperty("location")
    private String location;

    @JsonProperty("risk_score")
    private Double riskScore;

    @JsonProperty("requires_additional_verification")
    private Boolean requiresAdditionalVerification;
  }

  /** Creates a forgot password event */
  public static PasswordResetEvent forgotPasswordRequested(
      String email,
      String resetToken,
      String resetLink,
      Long userId,
      String userType,
      LocalDateTime expiresAt,
      String ipAddress,
      String userAgent) {
    return PasswordResetEvent.builder()
        .eventType("PASSWORD_RESET_EVENT")
        .sourceService("uniflow-auth-service")
        .email(email)
        .resetToken(resetToken)
        .resetLink(resetLink)
        .userId(userId)
        .userType(userType)
        .action(PasswordResetAction.FORGOT_PASSWORD_REQUESTED)
        .expiresAt(expiresAt)
        .ipAddress(ipAddress)
        .userAgent(userAgent)
        .priority(EventPriority.HIGH)
        .retryable(true)
        .maxRetries(3)
        .timestamp(LocalDateTime.now())
        .build();
  }

  /** Creates a temporary credentials generated event */
  public static PasswordResetEvent temporaryCredentialsGenerated(
      String email,
      String resetToken,
      String temporaryPassword,
      Long userId,
      String userType,
      LocalDateTime credentialsExpiresAt,
      String ipAddress) {
    return PasswordResetEvent.builder()
        .eventType("PASSWORD_RESET_EVENT")
        .sourceService("uniflow-auth-service")
        .email(email)
        .resetToken(resetToken)
        .temporaryPassword(temporaryPassword)
        .userId(userId)
        .userType(userType)
        .action(PasswordResetAction.TEMPORARY_CREDENTIALS_GENERATED)
        .temporaryCredentialsExpiresAt(credentialsExpiresAt)
        .ipAddress(ipAddress)
        .priority(EventPriority.HIGH)
        .retryable(true)
        .maxRetries(3)
        .timestamp(LocalDateTime.now())
        .build();
  }

  /** Creates a password reset completed event */
  public static PasswordResetEvent passwordResetCompleted(
      String email, Long userId, String userType, String ipAddress, String userAgent) {
    return PasswordResetEvent.builder()
        .eventType("PASSWORD_RESET_EVENT")
        .sourceService("uniflow-auth-service")
        .email(email)
        .userId(userId)
        .userType(userType)
        .action(PasswordResetAction.PASSWORD_RESET_COMPLETED)
        .ipAddress(ipAddress)
        .userAgent(userAgent)
        .priority(EventPriority.NORMAL)
        .retryable(false)
        .timestamp(LocalDateTime.now())
        .build();
  }
}
