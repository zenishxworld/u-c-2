package com.uniflow.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.function.Predicate;

/**
 * Google OAuth Token Response DTO with functional validation
 * Represents the response from Google's token endpoint
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoogleOAuthTokenResponse {

    @JsonProperty("access_token")
    private String accessToken;

    @JsonProperty("refresh_token")
    private String refreshToken;

    @JsonProperty("token_type")
    private String tokenType;

    @JsonProperty("expires_in")
    private Integer expiresIn;

    @JsonProperty("scope")
    private String scope;

    @JsonProperty("id_token")
    private String idToken;

    // Functional validation predicate
    public static final Predicate<GoogleOAuthTokenResponse> IS_VALID = response ->
            response != null &&
            response.getAccessToken() != null && !response.getAccessToken().isEmpty() &&
            response.getTokenType() != null && response.getTokenType().equalsIgnoreCase("Bearer") &&
            response.getExpiresIn() != null && response.getExpiresIn() > 0;

    public String getAccessToken() {
        return accessToken != null ? accessToken : "";
    }

    public Instant getExpirationTime() {
        return expiresIn != null ?
               Instant.now().plusSeconds(expiresIn) :
               Instant.now().plusSeconds(3600); // Default 1 hour
    }

    public boolean isValid() {
        return IS_VALID.test(this);
    }
}
