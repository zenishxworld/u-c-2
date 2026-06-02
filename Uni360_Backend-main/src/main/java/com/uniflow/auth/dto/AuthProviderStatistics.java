package com.uniflow.auth.dto;

/**
 * Statistics record for authentication provider usage
 */
public record AuthProviderStatistics(
    String provider,
    Long count,
    Long activeCount
) {

    public double getActivePercentage() {
        if (count == 0) return 0.0;
        return (activeCount.doubleValue() / count.doubleValue()) * 100.0;
    }

    public boolean isPopularProvider() {
        return count > 10;
    }

    public String getProviderDisplayName() {
        return switch (provider) {
            case "LOCAL" -> "Local Authentication";
            case "GOOGLE" -> "Google OAuth";
            case "HYBRID" -> "Combined Auth";
            default -> provider;
        };
    }
}
