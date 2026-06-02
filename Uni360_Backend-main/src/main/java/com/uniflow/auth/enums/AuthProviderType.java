package com.uniflow.auth.enums;

import java.util.Arrays;
import java.util.Optional;

/**
 * OAuth Provider Type Enum
 * Defines supported OAuth providers for external authentication
 */
public enum AuthProviderType {
    GOOGLE("GOOGLE", "Google OAuth 2.0"),
    FACEBOOK("FACEBOOK", "Facebook OAuth 2.0"),
    GITHUB("GITHUB", "GitHub OAuth 2.0"),
    MICROSOFT("MICROSOFT", "Microsoft OAuth 2.0"),
    APPLE("APPLE", "Apple Sign In");

    private final String code;
    private final String description;

    AuthProviderType(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static Optional<AuthProviderType> fromAuthProvider(AuthProvider authProvider) {
        return switch (authProvider) {
            case GOOGLE -> Optional.of(GOOGLE);
            case LOCAL, HYBRID -> Optional.empty();
        };
    }

    public static Optional<AuthProviderType> fromCode(String code) {
        return Arrays.stream(values())
                .filter(type -> type.code.equalsIgnoreCase(code))
                .findFirst();
    }
}
