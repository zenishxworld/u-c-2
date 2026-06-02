package com.uniflow.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * RefreshTokenRequestDTO for JWT token refresh requests
 *
 * <p>This DTO represents the request payload for refreshing expired access tokens using valid
 * refresh tokens. It includes device and security context for enhanced security validation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshTokenRequestDTO {

  @NotBlank(message = "Refresh token is required")
  private String refreshToken;

  // Device and session context
  private String deviceId;

  private String userAgent;

  private String ipAddress;

  // Client context
  private String clientType; // UNIFLOW, UNI360

  private String source; // WEB, MOBILE, API

  // Security options
  @Builder.Default private Boolean validateDevice = true;

  @Builder.Default private Boolean extendSession = false;

  // Requested token scope (optional)
  private String scope;

  // Validation method
  public boolean isValidRequest() {
    return refreshToken != null && !refreshToken.trim().isEmpty();
  }
}
