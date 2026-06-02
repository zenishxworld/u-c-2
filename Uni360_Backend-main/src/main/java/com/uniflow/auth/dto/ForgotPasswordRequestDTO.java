package com.uniflow.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for forgot password functionality.
 *
 * <p>This DTO handles the initial step of password reset where the user provides their email
 * address to receive a password reset link.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to initiate password reset process")
public class ForgotPasswordRequestDTO {

  @Schema(
      description = "Email address of the user requesting password reset",
      example = "john.doe@example.com",
      required = true)
  @NotBlank(message = "Email is required")
  @Email(message = "Email must be a valid email address")
  @Size(max = 255, message = "Email must not exceed 255 characters")
  @JsonProperty("email")
  private String email;

  @Schema(
      description = "Optional client information for tracking",
      example = "web-app-v1.0",
      required = false)
  @Size(max = 100, message = "Client info must not exceed 100 characters")
  @JsonProperty("client_info")
  private String clientInfo;

  @Schema(
      description = "Optional user agent information",
      example = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      required = false)
  @Size(max = 500, message = "User agent must not exceed 500 characters")
  @JsonProperty("user_agent")
  private String userAgent;
}
