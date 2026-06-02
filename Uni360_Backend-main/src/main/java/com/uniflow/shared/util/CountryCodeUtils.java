package com.uniflow.shared.util;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Utility class for normalizing country codes and degree levels.
 *
 * <p>Provides centralized normalization logic to convert full country names
 * to ISO 2-letter codes and standardize degree level formats to match
 * database storage conventions.
 *
 * <p>This utility does NOT provide default values. If a value cannot be
 * normalized or is invalid, it will return empty Optional or throw an exception.
 *
 * <p>Usage:
 * <pre>
 * String countryCode = CountryCodeUtils.normalizeCountryCode("GERMANY"); // Returns "DE"
 * String degreeLevel = CountryCodeUtils.normalizeDegreeLevel("Master's"); // Returns "MASTERS"
 *
 * // Validation (throws exception if invalid)
 * CountryCodeUtils.validateCountryCode("GERMANY"); // Returns "DE"
 * CountryCodeUtils.validateDegreeLevel("MASTERS"); // Returns "MASTERS"
 * </pre>
 */
public final class CountryCodeUtils {

    private CountryCodeUtils() {
        // Utility class - prevent instantiation
    }

    /**
     * Country name to ISO 2-letter code mapping.
     * Keys are uppercase for case-insensitive lookup.
     */
    private static final Map<String, String> COUNTRY_CODE_MAP = new HashMap<>();

    /**
     * Valid degree levels that match database storage format.
     */
    private static final Map<String, String> DEGREE_LEVEL_MAP = new HashMap<>();

    static {
        // Germany
        COUNTRY_CODE_MAP.put("GERMANY", "DE");
        COUNTRY_CODE_MAP.put("DEUTSCHLAND", "DE");
        COUNTRY_CODE_MAP.put("DE", "DE");

        // United Kingdom
        COUNTRY_CODE_MAP.put("UNITED KINGDOM", "UK");
        COUNTRY_CODE_MAP.put("GREAT BRITAIN", "UK");
        COUNTRY_CODE_MAP.put("UK", "UK");
        COUNTRY_CODE_MAP.put("GB", "UK");
        COUNTRY_CODE_MAP.put("ENGLAND", "UK");
        COUNTRY_CODE_MAP.put("SCOTLAND", "UK");
        COUNTRY_CODE_MAP.put("WALES", "UK");
        COUNTRY_CODE_MAP.put("NORTHERN IRELAND", "UK");

        // United States
        COUNTRY_CODE_MAP.put("UNITED STATES", "US");
        COUNTRY_CODE_MAP.put("UNITED STATES OF AMERICA", "US");
        COUNTRY_CODE_MAP.put("USA", "US");
        COUNTRY_CODE_MAP.put("US", "US");

        // France
        COUNTRY_CODE_MAP.put("FRANCE", "FR");
        COUNTRY_CODE_MAP.put("FR", "FR");

        // Netherlands
        COUNTRY_CODE_MAP.put("NETHERLANDS", "NL");
        COUNTRY_CODE_MAP.put("THE NETHERLANDS", "NL");
        COUNTRY_CODE_MAP.put("HOLLAND", "NL");
        COUNTRY_CODE_MAP.put("NL", "NL");

        // Austria
        COUNTRY_CODE_MAP.put("AUSTRIA", "AT");
        COUNTRY_CODE_MAP.put("ÖSTERREICH", "AT");
        COUNTRY_CODE_MAP.put("OESTERREICH", "AT");
        COUNTRY_CODE_MAP.put("AT", "AT");

        // Switzerland
        COUNTRY_CODE_MAP.put("SWITZERLAND", "CH");
        COUNTRY_CODE_MAP.put("SCHWEIZ", "CH");
        COUNTRY_CODE_MAP.put("SUISSE", "CH");
        COUNTRY_CODE_MAP.put("CH", "CH");

        // Australia
        COUNTRY_CODE_MAP.put("AUSTRALIA", "AU");
        COUNTRY_CODE_MAP.put("AU", "AU");

        // Canada
        COUNTRY_CODE_MAP.put("CANADA", "CA");
        COUNTRY_CODE_MAP.put("CA", "CA");

        // Ireland
        COUNTRY_CODE_MAP.put("IRELAND", "IE");
        COUNTRY_CODE_MAP.put("IE", "IE");

        // Sweden
        COUNTRY_CODE_MAP.put("SWEDEN", "SE");
        COUNTRY_CODE_MAP.put("SVERIGE", "SE");
        COUNTRY_CODE_MAP.put("SE", "SE");

        // Norway
        COUNTRY_CODE_MAP.put("NORWAY", "NO");
        COUNTRY_CODE_MAP.put("NORGE", "NO");
        COUNTRY_CODE_MAP.put("NO", "NO");

        // Denmark
        COUNTRY_CODE_MAP.put("DENMARK", "DK");
        COUNTRY_CODE_MAP.put("DANMARK", "DK");
        COUNTRY_CODE_MAP.put("DK", "DK");

        // Finland
        COUNTRY_CODE_MAP.put("FINLAND", "FI");
        COUNTRY_CODE_MAP.put("SUOMI", "FI");
        COUNTRY_CODE_MAP.put("FI", "FI");

        // Italy
        COUNTRY_CODE_MAP.put("ITALY", "IT");
        COUNTRY_CODE_MAP.put("ITALIA", "IT");
        COUNTRY_CODE_MAP.put("IT", "IT");

        // Spain
        COUNTRY_CODE_MAP.put("SPAIN", "ES");
        COUNTRY_CODE_MAP.put("ESPAÑA", "ES");
        COUNTRY_CODE_MAP.put("ESPANA", "ES");
        COUNTRY_CODE_MAP.put("ES", "ES");

        // Portugal
        COUNTRY_CODE_MAP.put("PORTUGAL", "PT");
        COUNTRY_CODE_MAP.put("PT", "PT");

        // Belgium
        COUNTRY_CODE_MAP.put("BELGIUM", "BE");
        COUNTRY_CODE_MAP.put("BELGIQUE", "BE");
        COUNTRY_CODE_MAP.put("BELGIE", "BE");
        COUNTRY_CODE_MAP.put("BE", "BE");

        // Poland
        COUNTRY_CODE_MAP.put("POLAND", "PL");
        COUNTRY_CODE_MAP.put("POLSKA", "PL");
        COUNTRY_CODE_MAP.put("PL", "PL");

        // India
        COUNTRY_CODE_MAP.put("INDIA", "IN");
        COUNTRY_CODE_MAP.put("IN", "IN");

        // Singapore
        COUNTRY_CODE_MAP.put("SINGAPORE", "SG");
        COUNTRY_CODE_MAP.put("SG", "SG");

        // Japan
        COUNTRY_CODE_MAP.put("JAPAN", "JP");
        COUNTRY_CODE_MAP.put("JP", "JP");

        // China
        COUNTRY_CODE_MAP.put("CHINA", "CN");
        COUNTRY_CODE_MAP.put("CN", "CN");

        // New Zealand
        COUNTRY_CODE_MAP.put("NEW ZEALAND", "NZ");
        COUNTRY_CODE_MAP.put("NZ", "NZ");

        // South Korea
        COUNTRY_CODE_MAP.put("SOUTH KOREA", "KR");
        COUNTRY_CODE_MAP.put("KOREA", "KR");
        COUNTRY_CODE_MAP.put("KR", "KR");

        // Degree level mappings (DB uses "MASTERS" not "MASTER")
        DEGREE_LEVEL_MAP.put("BACHELOR", "BACHELOR");
        DEGREE_LEVEL_MAP.put("BACHELORS", "BACHELOR");
        DEGREE_LEVEL_MAP.put("BACHELOR'S", "BACHELOR");
        DEGREE_LEVEL_MAP.put("BSC", "BACHELOR");
        DEGREE_LEVEL_MAP.put("BA", "BACHELOR");
        DEGREE_LEVEL_MAP.put("BENG", "BACHELOR");
        DEGREE_LEVEL_MAP.put("BTECH", "BACHELOR");

        DEGREE_LEVEL_MAP.put("MASTERS", "MASTERS");
        DEGREE_LEVEL_MAP.put("MASTER", "MASTERS");
        DEGREE_LEVEL_MAP.put("MASTER'S", "MASTERS");
        DEGREE_LEVEL_MAP.put("MSC", "MASTERS");
        DEGREE_LEVEL_MAP.put("MA", "MASTERS");
        DEGREE_LEVEL_MAP.put("MENG", "MASTERS");
        DEGREE_LEVEL_MAP.put("MTECH", "MASTERS");
        DEGREE_LEVEL_MAP.put("MBA", "MASTERS");

        DEGREE_LEVEL_MAP.put("DOCTORATE", "DOCTORATE");
        DEGREE_LEVEL_MAP.put("DOCTORATES", "DOCTORATE");
        DEGREE_LEVEL_MAP.put("PHD", "DOCTORATE");
        DEGREE_LEVEL_MAP.put("PH.D", "DOCTORATE");
        DEGREE_LEVEL_MAP.put("PH.D.", "DOCTORATE");
        DEGREE_LEVEL_MAP.put("DOCTORAL", "DOCTORATE");

        DEGREE_LEVEL_MAP.put("DIPLOMA", "DIPLOMA");
        DEGREE_LEVEL_MAP.put("DIPLOMAS", "DIPLOMA");
        DEGREE_LEVEL_MAP.put("DIP", "DIPLOMA");

        DEGREE_LEVEL_MAP.put("CERTIFICATE", "CERTIFICATE");
        DEGREE_LEVEL_MAP.put("CERTIFICATES", "CERTIFICATE");
        DEGREE_LEVEL_MAP.put("CERT", "CERTIFICATE");
    }

    /**
     * Normalizes a country name or code to the ISO 2-letter code.
     * Returns Optional.empty() if the country is not recognized.
     *
     * @param raw The raw country name or code (case-insensitive)
     * @return Optional containing the ISO 2-letter country code, or empty if not found
     */
    public static Optional<String> normalizeCountryCode(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        String key = raw.trim().toUpperCase();
        return Optional.ofNullable(COUNTRY_CODE_MAP.get(key));
    }

    /**
     * Validates and normalizes a country code. Throws exception if invalid.
     *
     * @param raw The raw country name or code
     * @return The normalized ISO 2-letter country code
     * @throws IllegalArgumentException if country code is null, blank, or not recognized
     */
    public static String validateCountryCode(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException(
                "Country code is required but was null or blank"
            );
        }
        String key = raw.trim().toUpperCase();
        String normalized = COUNTRY_CODE_MAP.get(key);
        if (normalized == null) {
            throw new IllegalArgumentException(
                "Unrecognized country code or name: '" +
                    raw +
                    "'. " +
                    "Please use a valid ISO 2-letter code (e.g., DE, UK, US) or full country name (e.g., Germany, United Kingdom)"
            );
        }
        return normalized;
    }

    /**
     * Normalizes a degree level to match the database storage format.
     * Returns Optional.empty() if the degree level is not recognized.
     *
     * @param degreeLevel The raw degree level string
     * @return Optional containing the normalized degree level, or empty if not found
     */
    public static Optional<String> normalizeDegreeLevel(String degreeLevel) {
        if (degreeLevel == null || degreeLevel.isBlank()) {
            return Optional.empty();
        }
        String key = degreeLevel.trim().toUpperCase();
        return Optional.ofNullable(DEGREE_LEVEL_MAP.get(key));
    }

    /**
     * Validates and normalizes a degree level. Throws exception if invalid.
     *
     * @param degreeLevel The raw degree level string
     * @return The normalized degree level
     * @throws IllegalArgumentException if degree level is null, blank, or not recognized
     */
    public static String validateDegreeLevel(String degreeLevel) {
        if (degreeLevel == null || degreeLevel.isBlank()) {
            throw new IllegalArgumentException(
                "Degree level is required but was null or blank"
            );
        }
        String key = degreeLevel.trim().toUpperCase();
        String normalized = DEGREE_LEVEL_MAP.get(key);
        if (normalized == null) {
            throw new IllegalArgumentException(
                "Unrecognized degree level: '" +
                    degreeLevel +
                    "'. " +
                    "Valid values are: BACHELOR, MASTERS, DOCTORATE, DIPLOMA, CERTIFICATE"
            );
        }
        return normalized;
    }

    /**
     * Checks if the given string is a valid ISO 2-letter country code.
     *
     * @param code The code to check
     * @return true if it's a recognized country code, false otherwise
     */
    public static boolean isValidCountryCode(String code) {
        return normalizeCountryCode(code).isPresent();
    }

    /**
     * Checks if the given string is a valid degree level.
     *
     * @param degreeLevel The degree level to check
     * @return true if it's a recognized degree level, false otherwise
     */
    public static boolean isValidDegreeLevel(String degreeLevel) {
        return normalizeDegreeLevel(degreeLevel).isPresent();
    }

    /**
     * Checks if the given string is an ISO 2-letter format (regardless of whether it's in our map).
     *
     * @param code The code to check
     * @return true if it's a 2-letter uppercase code, false otherwise
     */
    public static boolean isIsoFormat(String code) {
        if (code == null || code.length() != 2) {
            return false;
        }
        return code.equals(code.toUpperCase()) && code.matches("^[A-Z]{2}$");
    }
}
