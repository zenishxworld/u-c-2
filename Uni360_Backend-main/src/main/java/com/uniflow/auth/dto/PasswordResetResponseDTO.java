package com.uniflow.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for password reset operations.
 *
 * <p>This DTO provides consistent response structure for both forgot password and reset password
 * operations, including status information and next steps.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response for password reset operations")
public class PasswordResetResponseDTO {

  @Schema(
      description = "Operation status message",
      example = "Password reset link has been sent to your email",
      required = true)
  @JsonProperty("message")
  private String message;

  @Schema(
      description = "Unique identifier for tracking this password reset request",
      example = "pwd-reset-12345-abcde",
      required = false)
  @JsonProperty("request_id")
  private String requestId;

  @Schema(
      description = "Type of password reset operation",
      example = "FORGOT_PASSWORD",
      allowableValues = {
        "FORGOT_PASSWORD",
        "RESET_PASSWORD",
        "TEMP_CREDENTIALS_SENT",
      },
      required = true)
  @JsonProperty("operation_type")
  private PasswordResetOperation operationType;

  @Schema(
      description = "Timestamp when the operation was processed",
      example = "2024-01-15T10:30:00",
      required = true)
  @JsonProperty("timestamp")
  private LocalDateTime timestamp;

  @Schema(
      description = "Next step information for the user",
      example = "Check your email for password reset instructions",
      required = false)
  @JsonProperty("next_step")
  private String nextStep;

  @Schema(
      description = "Token expiry time (only for forgot password responses)",
      example = "2024-01-15T11:00:00",
      required = false)
  @JsonProperty("expires_at")
  private LocalDateTime expiresAt;

  @Schema(
      description = "Security information and warnings",
      example = "This link will expire in 30 minutes for security reasons",
      required = false)
  @JsonProperty("security_info")
  private String securityInfo;

  @Schema(
      description = "Whether additional verification steps are required",
      example = "false",
      required = false)
  @JsonProperty("requires_additional_verification")
  private Boolean requiresAdditionalVerification;

  @Schema(
      description = "Temporary password generated for the user (shown once — no email required)",
      example = "Xy9#mNpQ",
      required = false)
  @JsonProperty("temporary_password")
  private String temporaryPassword;

  /** Enum for different types of password reset operations. */
  public enum PasswordResetOperation {
    FORGOT_PASSWORD,
    RESET_PASSWORD,
    TEMP_CREDENTIALS_SENT,
    PASSWORD_UPDATED,
    MASTER_RESET_CREDENTIALS,
  }

  /**
   * Creates a successful forgot password response.
   *
   * @param requestId Unique request identifier
   * @param expiresAt When the reset token expires
   * @return Configured response DTO
   */
  public static PasswordResetResponseDTO forgotPasswordSuccess(
      String requestId, LocalDateTime expiresAt) {
    return PasswordResetResponseDTO.builder()
        .message(
            "If an account with that email exists, you will receive password reset instructions.")
        .requestId(requestId)
        .operationType(PasswordResetOperation.FORGOT_PASSWORD)
        .timestamp(LocalDateTime.now())
        .nextStep("Check your email for password reset instructions")
        .expiresAt(expiresAt)
        .securityInfo("Reset link will expire in 30 minutes for security reasons")
        .requiresAdditionalVerification(false)
        .build();
  }

  /**
   * Creates a successful temporary credentials sent response.
   *
   * @param requestId Unique request identifier
   * @return Configured response DTO
   */
  public static PasswordResetResponseDTO tempCredentialsSent(String requestId) {
    return PasswordResetResponseDTO.builder()
        .message("Temporary credentials have been sent to your email.")
        .requestId(requestId)
        .operationType(PasswordResetOperation.TEMP_CREDENTIALS_SENT)
        .timestamp(LocalDateTime.now())
        .nextStep("Use the temporary credentials to set your new password")
        .securityInfo("Temporary credentials will expire in 24 hours")
        .requiresAdditionalVerification(true)
        .build();
  }

  /**
   * Creates a successful password updated response.
   *
   * @param requestId Unique request identifier
   * @return Configured response DTO
   */
  public static PasswordResetResponseDTO passwordUpdated(String requestId) {
    return PasswordResetResponseDTO.builder()
        .message("Your password has been successfully updated.")
        .requestId(requestId)
        .operationType(PasswordResetOperation.PASSWORD_UPDATED)
        .timestamp(LocalDateTime.now())
        .nextStep("You can now login with your new password")
        .securityInfo("All existing sessions have been invalidated for security")
        .requiresAdditionalVerification(false)
        .build();
  }
}
