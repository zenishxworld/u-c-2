package com.uniflow.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for reset password functionality.
 *
 * <p>This DTO handles the password reset process where the user provides their reset token and new
 * password to complete the reset.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to reset user password with reset token")
public class ResetPasswordRequestDTO {

  @Schema(
      description = "New password to set for the account",
      example = "MyNewSecurePass123!",
      required = true)
  @NotBlank(message = "New password is required")
  @Size(min = 8, max = 128, message = "New password must be between 8 and 128 characters")
  @Pattern(
      regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
      message =
          "New password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character")
  @JsonProperty("new_password")
  private String newPassword;

  @Schema(
      description = "Confirmation of the new password",
      example = "MyNewSecurePass123!",
      required = true)
  @NotBlank(message = "Password confirmation is required")
  @JsonProperty("confirm_password")
  private String confirmPassword;

  @Schema(
      description = "Password reset token received in the reset link",
      example = "abc123-def456-ghi789",
      required = true)
  @NotBlank(message = "Reset token is required")
  @Size(max = 255, message = "Reset token must not exceed 255 characters")
  @JsonProperty("reset_token")
  private String resetToken;

  @Schema(
      description = "Optional client information for security tracking",
      example = "web-app-v1.0",
      required = false)
  @Size(max = 100, message = "Client info must not exceed 100 characters")
  @JsonProperty("client_info")
  private String clientInfo;

  /**
   * Validates that the new password and confirmation match.
   *
   * @return true if passwords match, false otherwise
   */
  public boolean isPasswordConfirmationValid() {
    return newPassword != null && newPassword.equals(confirmPassword);
  }
}
