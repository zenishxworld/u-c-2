package com.uniflow.university.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.uniflow.auth.dto.UserJwtDto;
import com.uniflow.auth.util.JwtUtils;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.r2dbc.core.FetchSpec;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.server.ServerRequest;
import reactor.core.publisher.Mono;

/**
 * University Query Utilities for extracting and processing query parameters
 *
 * <p>This service provides comprehensive utility methods for handling university search parameters,
 * building filtered SQL queries, and managing request parameters in the reactive environment.
 * It follows the same pattern as the CommonHelperUtils reference implementation.
 *
 * <p>Features:
 * - University query parameter extraction and validation
 * - SQL query parameter binding and execution
 * - Geographic and ranking-based filtering
 * - Financial filtering (tuition fees, scholarships)
 * - Multi-criteria search support
 * - Reactive SQL execution with proper parameter binding
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UniversityQueryUtils {

    private final DatabaseClient databaseClient;
    private final JwtUtils jwtUtils;
    private final ObjectMapper objectMapper;

    // ========================================
    // PARAMETER EXTRACTION METHODS
    // ========================================

    /**
     * Extract all university query parameters from ServerRequest
     */
    public Mono<Map<String, Object>> extractUniversityParameters(
        ServerRequest request
    ) {
        return Mono.fromCallable(() -> {
            Map<String, Object> parameters = new HashMap<>();

            // Basic pagination and sorting
            String size = request.queryParam("size").orElse("20");
            String page = request.queryParam("page").orElse("0");
            String sortBy = request.queryParam("sort_by").orElse("name");
            String sortDirection = request
                .queryParam("sort_direction")
                .orElse("ASC");

            // Status and basic filters
            String status = request
                .queryParam("status")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String active = request
                .queryParam("active")
                .filter(s -> !s.isEmpty())
                .orElse("true");
            String type = request
                .queryParam("type")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String institutionType = request
                .queryParam("institution_type")
                .filter(s -> !s.isEmpty())
                .orElse("");

            // Geographic filters
            String country = request
                .queryParam("country")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String state = request
                .queryParam("state")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String city = request
                .queryParam("city")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String region = request
                .queryParam("region")
                .filter(s -> !s.isEmpty())
                .orElse("");

            // Search terms
            String searchTerm = request
                .queryParam("search")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String name = request
                .queryParam("name")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String code = request
                .queryParam("code")
                .filter(s -> !s.isEmpty())
                .orElse("");

            // Ranking filters
            String worldRankingMin = request
                .queryParam("world_ranking_min")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String worldRankingMax = request
                .queryParam("world_ranking_max")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String nationalRankingMin = request
                .queryParam("national_ranking_min")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String nationalRankingMax = request
                .queryParam("national_ranking_max")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String qsRankingMin = request
                .queryParam("qs_ranking_min")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String qsRankingMax = request
                .queryParam("qs_ranking_max")
                .filter(s -> !s.isEmpty())
                .orElse("");

            // Financial filters
            String tuitionMin = request
                .queryParam("tuition_min")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String tuitionMax = request
                .queryParam("tuition_max")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String currency = request
                .queryParam("currency")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String scholarshipsAvailable = request
                .queryParam("scholarships_available")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String financialAidAvailable = request
                .queryParam("financial_aid_available")
                .filter(s -> !s.isEmpty())
                .orElse("");

            // Academic filters
            String foundedYearMin = request
                .queryParam("founded_year_min")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String foundedYearMax = request
                .queryParam("founded_year_max")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String languageOfInstruction = request
                .queryParam("language_of_instruction")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String studentPopulationMin = request
                .queryParam("student_population_min")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String studentPopulationMax = request
                .queryParam("student_population_max")
                .filter(s -> !s.isEmpty())
                .orElse("");

            // Client and territory filters (for multi-tenant support)
            String clientId = request
                .queryParam("client_id")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String territory = request
                .queryParam("territory")
                .filter(s -> !s.isEmpty())
                .orElse("");

            // Course-level filters
            String courseSearch = request
                .queryParam("course_search")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String degreeLevel = request
                .queryParam("degree_level")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String studyMode = request
                .queryParam("study_mode")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String courseTuitionMin = request
                .queryParam("course_tuition_min")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String courseTuitionMax = request
                .queryParam("course_tuition_max")
                .filter(s -> !s.isEmpty())
                .orElse("");
            String courseDuration = request
                .queryParam("course_duration")
                .filter(s -> !s.isEmpty())
                .orElse("");

            // Convert string parameters to appropriate types
            int sizeInt = Integer.parseInt(size);
            int pageInt = Integer.parseInt(page);
            boolean activeBool = Boolean.parseBoolean(active);
            boolean scholarshipsBool =
                !scholarshipsAvailable.isEmpty() &&
                Boolean.parseBoolean(scholarshipsAvailable);
            boolean financialAidBool =
                !financialAidAvailable.isEmpty() &&
                Boolean.parseBoolean(financialAidAvailable);

            // Add all parameters to map with correct names matching SQL queries
            parameters.put("size", sizeInt);
            parameters.put("page", pageInt);
            parameters.put("offset", pageInt * sizeInt);
            parameters.put("sortBy", mapSortField(sortBy));
            parameters.put("sortDirection", sortDirection.toUpperCase());

            // Filter values
            parameters.put("status", status);
            parameters.put("type", type);
            parameters.put("institutionType", institutionType);
            parameters.put("country", country);
            parameters.put("state", state);
            parameters.put("city", city);
            parameters.put("region", region);
            parameters.put("searchTerm", searchTerm);
            parameters.put("name", name);
            parameters.put("code", code);
            parameters.put("currency", currency);
            parameters.put("languageOfInstruction", languageOfInstruction);
            parameters.put("clientId", clientId);
            parameters.put("territory", territory);

            // Course-level filter values
            parameters.put("courseSearch", courseSearch);
            parameters.put("degreeLevel", degreeLevel);
            parameters.put("studyMode", studyMode);
            parameters.put("courseTuitionMin", parseBigDecimalSafely(courseTuitionMin));
            parameters.put("courseTuitionMax", parseBigDecimalSafely(courseTuitionMax));
            parameters.put("courseDuration", parseIntegerSafely(courseDuration));

            // Numeric ranges
            parameters.put(
                "worldRankingMin",
                parseIntegerSafely(worldRankingMin)
            );
            parameters.put(
                "worldRankingMax",
                parseIntegerSafely(worldRankingMax)
            );
            parameters.put(
                "nationalRankingMin",
                parseIntegerSafely(nationalRankingMin)
            );
            parameters.put(
                "nationalRankingMax",
                parseIntegerSafely(nationalRankingMax)
            );
            parameters.put("qsRankingMin", parseIntegerSafely(qsRankingMin));
            parameters.put("qsRankingMax", parseIntegerSafely(qsRankingMax));
            parameters.put("tuitionMin", parseBigDecimalSafely(tuitionMin));
            parameters.put("tuitionMax", parseBigDecimalSafely(tuitionMax));
            parameters.put(
                "foundedYearMin",
                parseIntegerSafely(foundedYearMin)
            );
            parameters.put(
                "foundedYearMax",
                parseIntegerSafely(foundedYearMax)
            );
            parameters.put(
                "studentPopulationMin",
                parseIntegerSafely(studentPopulationMin)
            );
            parameters.put(
                "studentPopulationMax",
                parseIntegerSafely(studentPopulationMax)
            );

            // Boolean flags for SQL conditions (wildcard means condition is ignored)
            parameters.put("statusWildcard", status.isEmpty());
            parameters.put("activeFilter", activeBool && status.isEmpty()); // Only apply active filter if no specific status
            parameters.put("typeWildcard", type.isEmpty());
            parameters.put(
                "institutionTypeWildcard",
                institutionType.isEmpty()
            );
            parameters.put("countryWildcard", country.isEmpty());
            parameters.put("stateWildcard", state.isEmpty());
            parameters.put("cityWildcard", city.isEmpty());
            parameters.put("regionWildcard", region.isEmpty());
            parameters.put("searchTermWildcard", searchTerm.isEmpty());
            parameters.put("nameWildcard", name.isEmpty());
            parameters.put("codeWildcard", code.isEmpty());
            parameters.put("currencyWildcard", currency.isEmpty());
            parameters.put("languageWildcard", languageOfInstruction.isEmpty());
            parameters.put("clientIdWildcard", clientId.isEmpty());
            parameters.put("territoryWildcard", territory.isEmpty());
            parameters.put("scholarshipsFilter", scholarshipsBool);
            parameters.put("financialAidFilter", financialAidBool);
            // Only apply active filter if explicitly requested - default to showing all statuses
            parameters.put("activeFilter", false);

            // Range wildcards
            parameters.put(
                "worldRankingWildcard",
                worldRankingMin.isEmpty() && worldRankingMax.isEmpty()
            );
            parameters.put(
                "nationalRankingWildcard",
                nationalRankingMin.isEmpty() && nationalRankingMax.isEmpty()
            );
            parameters.put(
                "qsRankingWildcard",
                qsRankingMin.isEmpty() && qsRankingMax.isEmpty()
            );
            parameters.put(
                "tuitionWildcard",
                tuitionMin.isEmpty() && tuitionMax.isEmpty()
            );
            parameters.put(
                "foundedYearWildcard",
                foundedYearMin.isEmpty() && foundedYearMax.isEmpty()
            );
            parameters.put(
                "studentPopulationWildcard",
                studentPopulationMin.isEmpty() && studentPopulationMax.isEmpty()
            );

            // Course-level wildcard flags
            parameters.put("courseSearchWildcard", courseSearch.isEmpty());
            parameters.put("degreeLevelWildcard", degreeLevel.isEmpty());
            parameters.put("studyModeWildcard", studyMode.isEmpty());
            parameters.put(
                "courseTuitionWildcard",
                courseTuitionMin.isEmpty() && courseTuitionMax.isEmpty()
            );
            parameters.put("courseDurationWildcard", courseDuration.isEmpty());

            log.debug(
                "Extracted university parameters: {}",
                prettyPrintJson(parameters)
            );
            return parameters;
        });
    }

    /**
     * Map sort field names to database column names
     */
    private String mapSortField(String sortBy) {
        return switch (sortBy.toLowerCase()) {
            case "name" -> "u.name";
            case "founded_year" -> "CAST(u.data->>'founding_year' AS INTEGER)";
            case "world_ranking" -> "CAST(u.data->>'world_ranking' AS INTEGER)";
            case "national_ranking" -> "CAST(u.data->>'national_ranking' AS INTEGER)";
            case "student_population" -> "CAST(u.data->>'total_students' AS INTEGER)";
            case "tuition_fee" -> "CAST(u.data->>'tuition_international_undergraduate' AS DECIMAL)";
            case "created_at" -> "u.created_at";
            case "updated_at" -> "u.updated_at";
            default -> "u.name";
        };
    }

    // ========================================
    // SQL QUERY BUILDING AND EXECUTION
    // ========================================

    /**
     * Execute SQL query with parameter binding
     */
    public FetchSpec<Map<String, Object>> executeQueryWithBindings(
        String sqlQuery,
        Map<String, Object> parameters
    ) {
        // Build dynamic SQL by removing conditions based on wildcard flags
        String dynamicSql = buildDynamicSqlQuery(sqlQuery, parameters);

        // Extract parameter names from the final SQL query
        Set<String> parameterNames = new HashSet<>();
        Matcher matcher = Pattern.compile(":([a-zA-Z0-9_]+)").matcher(
            dynamicSql
        );
        while (matcher.find()) {
            parameterNames.add(matcher.group(1));
        }

        // Start building the execute spec
        DatabaseClient.GenericExecuteSpec executeSpec = databaseClient.sql(
            dynamicSql
        );

        // Bind only parameters that exist and have non-null values
        for (String parameterName : parameterNames) {
            if (parameters.containsKey(parameterName)) {
                Object value = parameters.get(parameterName);
                if (value != null) {
                    executeSpec = executeSpec.bind(parameterName, value);
                    log.debug("Bound parameter: {} = {}", parameterName, value);
                }
            }
        }

        // Execute the query and return the result
        log.info("=== EXECUTING QUERY ===");
        log.info("Original SQL: {}", sqlQuery);
        log.info("Dynamic SQL: {}", dynamicSql);
        prettyPrintQuery(dynamicSql, parameters);
        return executeSpec.fetch();
    }

    /**
     * Get the formatted SQL query with sorting parameters
     */
    public String getFormattedQuery(
        String baseQuery,
        Map<String, Object> parameters
    ) {
        String sortField = (String) parameters.get("sortBy");
        String sortDirection = (String) parameters.get("sortDirection");

        // Replace ORDER BY placeholders manually to avoid String.format issues with single quotes in SQL
        return baseQuery.replace(
            "ORDER BY %s %s",
            "ORDER BY " + sortField + " " + sortDirection
        );
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    /**
     * Extract user context from ServerRequest
     */
    public Mono<UserJwtDto> getUserFromServerRequest(ServerRequest request) {
        return jwtUtils.getUserFromServerRequest(request);
    }

    /**
     * Pretty print JSON for logging
     */
    public String prettyPrintJson(Map<String, Object> parameters) {
        try {
            objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
            Map<String, Object> sortedParameters = new TreeMap<>(parameters);
            return objectMapper.writeValueAsString(sortedParameters);
        } catch (JsonProcessingException e) {
            log.error("Error pretty printing JSON", e);
            return parameters.toString();
        }
    }

    /**
     * Pretty print SQL query with parameter substitution for logging
     */
    public void prettyPrintQuery(
        String sqlQuery,
        Map<String, Object> parameters
    ) {
        log.info("=== QUERY PARAMETERS ===");
        parameters.forEach((key, value) -> {
            log.info(
                "Parameter [{}] = {} ({})",
                key,
                value,
                value != null ? value.getClass().getSimpleName() : "null"
            );
        });

        String result = sqlQuery;
        for (Map.Entry<String, Object> entry : parameters.entrySet()) {
            String placeholder = ":" + entry.getKey();
            String value = entry.getValue() != null
                ? entry.getValue().toString()
                : "NULL";
            result = result.replace(placeholder, "'" + value + "'");
        }

        log.info("=== FINAL QUERY WITH SUBSTITUTIONS ===");
        log.info("{}", result);
        log.info("=== END QUERY DEBUG ===");
    }

    /**
     * Safely parse integer from string
     */
    private Integer parseIntegerSafely(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            log.warn("Invalid integer value: {}", value);
            return null;
        }
    }

    /**
     * Get the appropriate Java type for a parameter name based on common naming patterns
     */
    private Class<?> getParameterType(String parameterName) {
        // Determine type based on parameter name patterns
        if (
            parameterName.endsWith("Min") ||
            parameterName.endsWith("Max") ||
            parameterName.endsWith("Population") ||
            parameterName.equals("worldRanking") ||
            parameterName.equals("nationalRanking") ||
            parameterName.equals("qsRanking") ||
            parameterName.equals("foundedYear")
        ) {
            return Integer.class;
        }
        if (
            parameterName.contains("tuition") ||
            parameterName.contains("Tuition")
        ) {
            return java.math.BigDecimal.class;
        }
        if (
            parameterName.endsWith("Wildcard") ||
            parameterName.endsWith("Filter") ||
            parameterName.equals("activeFilter")
        ) {
            return Boolean.class;
        }
        if (
            parameterName.equals("userId") || parameterName.equals("clientId")
        ) {
            return Long.class;
        }
        // Default to String for most parameters
        return String.class;
    }

    /**
     * Build dynamic SQL query by removing conditions based on wildcard flags
     */
    private String buildDynamicSqlQuery(
        String baseQuery,
        Map<String, Object> parameters
    ) {
        String dynamicQuery = baseQuery;

        // Map of wildcard flags to their corresponding regex patterns
        // Remove ALL conditions where the wildcard flag is TRUE (parameter not provided)
        Map<String, String> wildcardPatterns = new java.util.LinkedHashMap<>();

        // JSONB data field patterns
        wildcardPatterns.put(
            "statusWildcard",
            "AND \\(:statusWildcard = TRUE OR \\(u\\.data->>'status'\\) = :status\\)"
        );
        wildcardPatterns.put(
            "typeWildcard",
            "AND \\(:typeWildcard = TRUE OR \\(u\\.data->>'type'\\) = :type\\)"
        );
        wildcardPatterns.put(
            "institutionTypeWildcard",
            "AND \\(:institutionTypeWildcard = TRUE OR \\(u\\.data->>'institution_type'\\) = :institutionType\\)"
        );
        wildcardPatterns.put(
            "countryWildcard",
            "AND \\(:countryWildcard = TRUE OR LOWER\\(u\\.data->>'country'\\) = LOWER\\(:country\\)\\)"
        );
        wildcardPatterns.put(
            "stateWildcard",
            "AND \\(:stateWildcard = TRUE OR LOWER\\(u\\.data->>'state'\\) = LOWER\\(:state\\)\\)"
        );
        wildcardPatterns.put(
            "cityWildcard",
            "AND \\(:cityWildcard = TRUE OR LOWER\\(u\\.data->>'city'\\) = LOWER\\(:city\\)\\)"
        );
        wildcardPatterns.put(
            "regionWildcard",
            "AND \\(:regionWildcard = TRUE OR LOWER\\(u\\.data->>'region'\\) = LOWER\\(:region\\)\\)"
        );
        wildcardPatterns.put(
            "searchTermWildcard",
            "AND \\(:searchTermWildcard = TRUE OR \\([\\s\\S]*?LOWER\\(u\\.data->>'description'\\) LIKE LOWER\\(CONCAT\\('%', :searchTerm, '%'\\)\\)[\\s\\S]*?\\)\\)"
        );
        wildcardPatterns.put(
            "nameWildcard",
            "AND \\(:nameWildcard = TRUE OR LOWER\\(u\\.name\\) LIKE LOWER\\(CONCAT\\('%', :name, '%'\\)\\)\\)"
        );
        wildcardPatterns.put(
            "codeWildcard",
            "AND \\(:codeWildcard = TRUE OR LOWER\\(u\\.code\\) = LOWER\\(:code\\)\\)"
        );
        wildcardPatterns.put(
            "currencyWildcard",
            "AND \\(:currencyWildcard = TRUE OR LOWER\\(u\\.data->>'currency'\\) = LOWER\\(:currency\\)\\)"
        );
        wildcardPatterns.put(
            "clientIdWildcard",
            "AND \\(:clientIdWildcard = TRUE OR \\(u\\.data->>'client_id'\\) = :clientId\\)"
        );

        // Range patterns (world ranking, national ranking, etc.)
        wildcardPatterns.put(
            "worldRankingWildcard",
            "AND \\(:worldRankingWildcard = TRUE OR \\([\\s\\S]*?:worldRankingMax[\\s\\S]*?\\)\\)"
        );
        wildcardPatterns.put(
            "nationalRankingWildcard",
            "AND \\(:nationalRankingWildcard = TRUE OR \\([\\s\\S]*?:nationalRankingMax[\\s\\S]*?\\)\\)"
        );
        wildcardPatterns.put(
            "qsRankingWildcard",
            "AND \\(:qsRankingWildcard = TRUE OR \\([\\s\\S]*?:qsRankingMax[\\s\\S]*?\\)\\)"
        );
        wildcardPatterns.put(
            "tuitionWildcard",
            "AND \\(:tuitionWildcard = TRUE OR \\([\\s\\S]*?:tuitionMax[\\s\\S]*?\\)\\)"
        );
        wildcardPatterns.put(
            "foundedYearWildcard",
            "AND \\(:foundedYearWildcard = TRUE OR \\([\\s\\S]*?:foundedYearMax[\\s\\S]*?\\)\\)"
        );
        wildcardPatterns.put(
            "studentPopulationWildcard",
            "AND \\(:studentPopulationWildcard = TRUE OR \\([\\s\\S]*?:studentPopulationMax[\\s\\S]*?\\)\\)"
        );
        wildcardPatterns.put(
            "languageWildcard",
            "AND \\(:languageWildcard = TRUE OR EXISTS \\([\\s\\S]*?WHERE LOWER\\(lang\\) LIKE LOWER\\(CONCAT\\('%', :languageOfInstruction, '%'\\)\\)[\\s\\S]*?\\)\\)"
        );
        wildcardPatterns.put(
            "courseSearchWildcard",
            "AND \\(:courseSearchWildcard = TRUE OR EXISTS \\([\\s\\S]*?LOWER\\(c\\.name\\) LIKE LOWER\\(CONCAT\\('%', :courseSearch, '%'\\)\\)[\\s\\S]*?\\)\\)"
        );
        wildcardPatterns.put(
            "degreeLevelWildcard",
            "AND \\(:degreeLevelWildcard = TRUE OR EXISTS \\([\\s\\S]*?LOWER\\(:degreeLevel\\)[\\s\\S]*?\\)\\)"
        );
        wildcardPatterns.put(
            "studyModeWildcard",
            "AND \\(:studyModeWildcard = TRUE OR EXISTS \\([\\s\\S]*?LOWER\\(:studyMode\\)[\\s\\S]*?\\)\\)"
        );
        wildcardPatterns.put(
            "courseTuitionWildcard",
            "AND \\(:courseTuitionWildcard = TRUE OR EXISTS \\([\\s\\S]*?:courseTuitionMax[\\s\\S]*?\\)\\)"
        );
        wildcardPatterns.put(
            "courseDurationWildcard",
            "AND \\(:courseDurationWildcard = TRUE OR EXISTS \\([\\s\\S]*?:courseDuration[\\s\\S]*?\\)\\)"
        );

        // Remove all wildcard conditions when parameter not provided
        for (Map.Entry<String, String> entry : wildcardPatterns.entrySet()) {
            if (Boolean.TRUE.equals(parameters.get(entry.getKey()))) {
                dynamicQuery = dynamicQuery.replaceAll(entry.getValue(), "");
                log.debug("Removed {} condition", entry.getKey());
            }
        }

        // Handle boolean filters - remove when FALSE
        if (!Boolean.TRUE.equals(parameters.get("scholarshipsFilter"))) {
            dynamicQuery = dynamicQuery.replaceAll(
                "AND \\(:scholarshipsFilter = FALSE OR CAST\\(u\\.data->>'scholarships_available' AS BOOLEAN\\) = TRUE\\)",
                ""
            );
            log.debug("Removed scholarshipsFilter condition");
        }

        if (!Boolean.TRUE.equals(parameters.get("financialAidFilter"))) {
            dynamicQuery = dynamicQuery.replaceAll(
                "AND \\(:financialAidFilter = FALSE OR CAST\\(u\\.data->>'financial_aid_percentage' AS DECIMAL\\) > 0\\)",
                ""
            );
            log.debug("Removed financialAidFilter condition");
        }

        if (!Boolean.TRUE.equals(parameters.get("activeFilter"))) {
            dynamicQuery = dynamicQuery.replaceAll(
                "AND \\(:activeFilter = FALSE OR \\(u\\.data->>'status'\\) = 'ACTIVE'\\)",
                ""
            );
            log.debug("Removed activeFilter condition");
        }

        // Clean up any extra whitespace/newlines left by removals
        dynamicQuery = dynamicQuery
            .replaceAll("(?m)^\\s*$", "")
            .replaceAll("\\s+", " ");

        log.info("=== FINAL DYNAMIC SQL ===");
        log.info("Final SQL: {}", dynamicQuery);
        return dynamicQuery;
    }

    /**
     * Safely parse BigDecimal from string
     */
    private BigDecimal parseBigDecimalSafely(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return new BigDecimal(value.trim());
        } catch (NumberFormatException e) {
            log.warn("Invalid decimal value: {}", value);
            return null;
        }
    }
}
