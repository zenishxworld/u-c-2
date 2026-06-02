package com.uniflow.notification.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Set;
import java.util.function.Predicate;

/**
 * Content type enum for notification message formats.
 * Supports both plain text and HTML content with validation.
 */
public enum ContentType {
    PLAIN("Plain Text", "Plain text content without formatting", false),
    HTML("HTML", "Rich HTML content with formatting and links", true);

    private final String displayName;
    private final String description;
    private final boolean requiresHtmlSanitization;

    ContentType(
        String displayName,
        String description,
        boolean requiresHtmlSanitization
    ) {
        this.displayName = displayName;
        this.description = description;
        this.requiresHtmlSanitization = requiresHtmlSanitization;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public boolean requiresHtmlSanitization() {
        return requiresHtmlSanitization;
    }

    // Functional validation predicates
    public static final Predicate<ContentType> IS_PLAIN = type -> type == PLAIN;
    public static final Predicate<ContentType> IS_HTML = type -> type == HTML;
    public static final Predicate<ContentType> REQUIRES_SANITIZATION =
        ContentType::requiresHtmlSanitization;

    public static final Set<ContentType> HTML_TYPES = Set.of(HTML);
    public static final Set<ContentType> SAFE_TYPES = Set.of(PLAIN);

    /**
     * Check if content type is plain text
     */
    public static boolean isPlainText(ContentType type) {
        return IS_PLAIN.test(type);
    }

    /**
     * Check if content type is HTML
     */
    public static boolean isHtml(ContentType type) {
        return IS_HTML.test(type);
    }

    /**
     * Check if content type requires HTML sanitization
     */
    public static boolean needsSanitization(ContentType type) {
        return type != null && REQUIRES_SANITIZATION.test(type);
    }

    /**
     * Get content type from string value
     */
    public static ContentType fromString(String value) {
        if (value == null) return PLAIN;

        return switch (value.toUpperCase()) {
            case "HTML" -> HTML;
            case "PLAIN", "TEXT" -> PLAIN;
            default -> PLAIN;
        };
    }

    /**
     * Get all HTML content types
     */
    public static ContentType[] getHtmlTypes() {
        return HTML_TYPES.toArray(new ContentType[0]);
    }

    /**
     * Get all safe (non-HTML) content types
     */
    public static ContentType[] getSafeTypes() {
        return SAFE_TYPES.toArray(new ContentType[0]);
    }

    @JsonValue
    public String toValue() {
        return this.name();
    }

    @JsonCreator
    public static ContentType fromValue(String value) {
        if (value == null) {
            return PLAIN;
        }
        try {
            return ContentType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return PLAIN; // Default to PLAIN for invalid values
        }
    }
}
