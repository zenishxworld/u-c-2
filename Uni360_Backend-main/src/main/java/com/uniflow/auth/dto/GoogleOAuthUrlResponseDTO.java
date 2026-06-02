package com.uniflow.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Google OAuth URL Response DTO
 * Represents the response containing the Google OAuth authorization URL
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoogleOAuthUrlResponseDTO {

    private boolean success;
    private String authorizationUrl;
    private String state;
    private String provider;
}
