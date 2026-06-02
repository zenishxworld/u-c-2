package com.uniflow.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LoginRequestDTO for user authentication requests
 *
 * <p>This DTO represents the request payload for user login operations. It supports both
 * username/email and password authentication with optional two-factor authentication and device
 * tracking.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequestDTO {

  @NotBlank(message = "Username or email is required")
  private String usernameOrEmail;

  @NotBlank(message = "Password is required")
  private String password;

  // Two-factor authentication
  private String twoFactorCode;

  private String backupCode;

  // Device and session information
  private String deviceId;

  private String deviceName;

  private String userAgent;

  private String ipAddress;

  // Login options
  @Builder.Default private Boolean rememberMe = false;

  // Client context
  private String clientType; // UNIFLOW, UNI360

  private String source; // WEB, MOBILE, API

  // Security options
  @Builder.Default private Boolean skipTwoFactor = false;

  // Validation method
  public boolean isValidRequest() {
    return usernameOrEmail != null
        && !usernameOrEmail.trim().isEmpty()
        && password != null
        && !password.trim().isEmpty();
  }
}
