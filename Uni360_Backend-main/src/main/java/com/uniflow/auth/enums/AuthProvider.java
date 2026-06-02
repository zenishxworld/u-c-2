package com.uniflow.auth.enums;

import java.util.Arrays;
import java.util.Optional;
import java.util.function.Predicate;

/**
 * Enterprise-Grade Authentication Provider Enum
 * Supports multiple authentication methods with functional patterns
 */
public enum AuthProvider {
    LOCAL("LOCAL", "Local Username/Password Authentication", true, false),
    GOOGLE("GOOGLE", "Google OAuth 2.0 Authentication", false, true),
    HYBRID("HYBRID", "Combined Local + Google Authentication", true, true);

    private final String code;
    private final String description;
    private final boolean supportsPasswordAuth;
    private final boolean supportsOAuthAuth;

    AuthProvider(String code, String description, boolean supportsPasswordAuth, boolean supportsOAuthAuth) {
        this.code = code;
        this.description = description;
        this.supportsPasswordAuth = supportsPasswordAuth;
        this.supportsOAuthAuth = supportsOAuthAuth;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public boolean requiresPasswordValidation() {
        return supportsPasswordAuth && this != HYBRID;
    }

    public boolean supportsOAuthLogin() {
        return supportsOAuthAuth;
    }

    public String getAuthenticationErrorMessage() {
        return switch (this) {
            case LOCAL -> "Invalid username or password";
            case GOOGLE -> "Google authentication failed. Please try again";
            case HYBRID -> "Authentication failed. Please check your credentials";
        };
    }

    public static Optional<AuthProvider> fromCode(String code) {
        return Arrays.stream(values())
                .filter(provider -> provider.code.equalsIgnoreCase(code))
                .findFirst();
    }

    public AuthProvider linkWith(AuthProvider other) {
        if (this == LOCAL && other == GOOGLE || this == GOOGLE && other == LOCAL) {
            return HYBRID;
        }
        return this;
    }

    // Functional predicates for filtering
    public static final Predicate<AuthProvider> SUPPORTS_PASSWORD = provider -> provider.supportsPasswordAuth;
    public static final Predicate<AuthProvider> SUPPORTS_OAUTH = provider -> provider.supportsOAuthAuth;
    public static final Predicate<AuthProvider> IS_OAUTH_ONLY = provider -> provider.supportsOAuthAuth && !provider.supportsPasswordAuth;
    public static final Predicate<AuthProvider> IS_HYBRID = provider -> provider == HYBRID;
}
