package com.uniflow.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for temporary credentials sent to users during password reset process.
 *
 * <p>This DTO contains temporary login credentials that are generated and sent to users after they
 * click on a valid password reset link. These credentials are used as the "current password" when
 * setting a new password.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Temporary credentials for password reset process")
public class TemporaryCredentialsDTO {

  @Schema(
      description = "Temporary password for the user",
      example = "TempPass123!",
      required = true)
  @JsonProperty("temporary_password")
  private String temporaryPassword;

  @Schema(description = "User's email address", example = "john.doe@example.com", required = true)
  @JsonProperty("email")
  private String email;

  @Schema(
      description = "When the temporary credentials expire",
      example = "2024-01-16T10:30:00",
      required = true)
  @JsonProperty("expires_at")
  private LocalDateTime expiresAt;

  @Schema(
      description = "Instructions for the user",
      example =
          "Use this temporary password along with your new desired password to complete the reset",
      required = true)
  @JsonProperty("instructions")
  private String instructions;

  @Schema(
      description = "Security warning message",
      example =
          "This temporary password will expire in 24 hours. Please change your password immediately.",
      required = true)
  @JsonProperty("security_warning")
  private String securityWarning;

  @Schema(
      description = "Reset token associated with this temporary credential",
      example = "pwd-reset-token-12345",
      required = true)
  @JsonProperty("reset_token")
  private String resetToken;

  @Schema(description = "Request ID for tracking", example = "req-12345-abcde", required = false)
  @JsonProperty("request_id")
  private String requestId;

  @Schema(
      description = "Link to complete the password reset",
      example = "https://app.uniflow.com/reset-password?token=xyz",
      required = false)
  @JsonProperty("reset_link")
  private String resetLink;

  /**
   * Creates a new temporary credentials DTO with default values.
   *
   * @param email User's email address
   * @param temporaryPassword Generated temporary password
   * @param resetToken Reset token for verification
   * @param expiresAt When credentials expire
   * @param resetLink Link to complete password reset
   * @return Configured temporary credentials DTO
   */
  public static TemporaryCredentialsDTO create(
      String email,
      String temporaryPassword,
      String resetToken,
      LocalDateTime expiresAt,
      String resetLink) {

    return TemporaryCredentialsDTO.builder()
        .email(email)
        .temporaryPassword(temporaryPassword)
        .resetToken(resetToken)
        .expiresAt(expiresAt)
        .resetLink(resetLink)
        .instructions(
            "Use this temporary password along with your new desired password to complete the password reset process.")
        .securityWarning(
            "This temporary password will expire in 24 hours. Please change your password immediately for security reasons.")
        .build();
  }

  /**
   * Checks if the temporary credentials are still valid.
   *
   * @return true if credentials are valid, false if expired
   */
  public boolean isValid() {
    return expiresAt != null && expiresAt.isAfter(LocalDateTime.now());
  }

  /**
   * Gets the remaining validity time in hours.
   *
   * @return hours until expiry, or 0 if already expired
   */
  public long getHoursUntilExpiry() {
    if (expiresAt == null) {
      return 0;
    }

    LocalDateTime now = LocalDateTime.now();
    if (expiresAt.isBefore(now)) {
      return 0;
    }

    return java.time.Duration.between(now, expiresAt).toHours();
  }
}
