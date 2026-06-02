package com.uniflow.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

/**
 * Google OAuth Request DTO
 * Represents the OAuth callback request with authorization code and state
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoogleOAuthRequestDTO {

    @NotBlank(message = "Authorization code is required")
    private String code;

    private String state;

    private String ipAddress;

    private String userAgent;

    private String frontendCallbackUrl;
}
