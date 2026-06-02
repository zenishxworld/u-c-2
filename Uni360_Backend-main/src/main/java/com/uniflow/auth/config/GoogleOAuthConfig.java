package com.uniflow.auth.config;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Enterprise-Grade Google OAuth 2.0 Configuration
 * Provides reactive WebClient instances and configuration validation
 */
@Slf4j
@Configuration
@Getter
public class GoogleOAuthConfig {

    @Value("${uniflow.auth.google.oauth.enabled:true}")
    private boolean enabled;

    @Value("${uniflow.auth.google.oauth.client-id:}")
    private String clientId;

    @Value("${uniflow.auth.google.oauth.client-secret:}")
    private String clientSecret;

    @Value(
        "${uniflow.auth.google.oauth.redirect-uri:http://localhost:8080/api/v1/auth/google/callback}"
    )
    private String redirectUri;

    @Value("${uniflow.auth.google.oauth.scope:openid profile email}")
    private String scope;

    @Value("${uniflow.auth.google.oauth.state-token-ttl:300000}")
    private long stateTokenTtl;

    @Value("${uniflow.auth.google.oauth.max-attempts-per-ip:5}")
    private int maxAttemptsPerIp;

    @Value("${uniflow.auth.google.oauth.rate-limit-window:3600000}")
    private long rateLimitWindow;

    // Google OAuth 2.0 Endpoints
    public static final String AUTHORIZATION_URI =
        "https://accounts.google.com/o/oauth2/v2/auth";
    public static final String TOKEN_URI =
        "https://oauth2.googleapis.com/token";
    public static final String USER_INFO_URI =
        "https://www.googleapis.com/oauth2/v2/userinfo";

    @Bean("googleOAuthWebClient")
    public WebClient googleOAuthWebClient() {
        return WebClient.builder()
            .baseUrl("https://oauth2.googleapis.com")
            .defaultHeader(
                HttpHeaders.CONTENT_TYPE,
                MediaType.APPLICATION_FORM_URLENCODED_VALUE
            )
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
            .codecs(configurer ->
                configurer.defaultCodecs().maxInMemorySize(1024 * 1024)
            )
            .build();
    }

    @Bean("googleApiWebClient")
    public WebClient googleApiWebClient() {
        return WebClient.builder()
            .baseUrl("https://www.googleapis.com")
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
            .codecs(configurer ->
                configurer.defaultCodecs().maxInMemorySize(1024 * 1024)
            )
            .build();
    }

    public boolean isValidRedirectUri(String uri) {
        return redirectUri.equals(uri);
    }

    public void validateConfiguration() {
        if (!enabled) {
            log.info("Google OAuth is disabled");
            return;
        }

        log.debug("Validating Google OAuth configuration...");
        log.debug(
            "Client ID: {}...",
            clientId.isEmpty()
                ? "[EMPTY]"
                : clientId.substring(0, Math.min(10, clientId.length()))
        );
        log.debug(
            "Client Secret: {}...",
            clientSecret.isEmpty() ? "[EMPTY]" : "[CONFIGURED]"
        );
        log.debug("Redirect URI: {}", redirectUri);
        log.debug("Scope: {}", scope);

        List<String> errors = Arrays.asList(
            clientId.isEmpty() ? "Google OAuth Client ID is required" : null,
            clientSecret.isEmpty()
                ? "Google OAuth Client Secret is required"
                : null,
            redirectUri.isEmpty()
                ? "Google OAuth Redirect URI is required"
                : null,
            scope.isEmpty() ? "Google OAuth Scope is required" : null
        )
            .stream()
            .filter(error -> error != null)
            .toList();

        if (!errors.isEmpty()) {
            log.error("Google OAuth configuration validation failed");
            errors.forEach(error ->
                log.error("Configuration error: {}", error)
            );
            throw new IllegalStateException(
                "Google OAuth configuration errors: " +
                    String.join(", ", errors)
            );
        }

        log.info("Google OAuth configuration validated successfully");
        log.info("OAuth will redirect to: {}", redirectUri);
    }


}
