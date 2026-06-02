package com.uniflow.auth.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.uniflow.auth.dto.UserJwtDto;
import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.lang.reflect.InvocationTargetException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.r2dbc.core.FetchSpec;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.server.ServerRequest;
import reactor.core.publisher.Mono;

/**
 * Common Helper Utilities for user context management and query building
 *
 * <p>This service provides comprehensive utility methods for handling user context, building
 * filtered SQL queries, and managing request parameters in the reactive environment. It follows the
 * same pattern as the reference implementation from finvolv project.
 *
 * <p>Features: - User context extraction and management - SQL query parameter binding and execution
 * - Territory and client-based filtering - Request parameter parsing and validation - JSON
 * processing and pretty printing
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CommonHelperUtils {

    private final JwtUtils jwtUtils;
    private final DatabaseClient databaseClient;
    private final ObjectMapper objectMapper;

    public static final String UNDERSCORE = "_";
    public static final String READ = "READ";
    public static String APPLICATION_DATA_READ_ACTION =
        "applicationdatareadaction";
    public static String APPLICATION_DATA_READ_MAPPING =
        "applicationdatareadmapping";
    public static String APPLICATION_CLIENT = "client";

    // ========================================
    // TERRITORY AND APPLICATION ACCESS METHODS
    // ========================================

    /** Check if application is in user's territory */
    public boolean isApplicationInUserTerritory(
        com.uniflow.application.dto.ApplicationResponseDTO application,
        UserJwtDto user
    ) {
        // Super admins have access to all territories
        if ("SUPER_ADMIN".equals(user.getUserType())) {
            return true;
        }

        // Admin users need matching territory
        if (
            "ADMIN".equals(user.getUserType()) &&
            user.getTerritoryIdentifier() != null
        ) {
            return user
                .getTerritoryIdentifier()
                .equals(application.getTerritory());
        }

        // Students can only access their own applications
        if ("STUDENT".equals(user.getUserType())) {
            return user.getId().equals(application.getStudentId());
        }

        return false;
    }

    /** Get applications by user territory */
    public reactor.core.publisher.Flux<
        com.uniflow.application.entity.Application
    > getApplicationsByUserTerritory(UserJwtDto user) {
        log.debug(
            "Getting applications for user territory: {}",
            user.getTerritoryIdentifier()
        );

        if ("SUPER_ADMIN".equals(user.getUserType())) {
            return databaseClient
                .sql(
                    "SELECT * FROM applications WHERE is_archived = false ORDER BY updated_at DESC"
                )
                .fetch()
                .all()
                .map(this::mapToApplicationEntity);
        }

        if (
            "ADMIN".equals(user.getUserType()) &&
            user.getTerritoryIdentifier() != null
        ) {
            return databaseClient
                .sql(
                    "SELECT * FROM applications WHERE territory = :territory AND is_archived = false ORDER BY updated_at DESC"
                )
                .bind("territory", user.getTerritoryIdentifier())
                .fetch()
                .all()
                .map(this::mapToApplicationEntity);
        }

        return reactor.core.publisher.Flux.empty();
    }

    /** Get applications requiring attention by territory */
    public reactor.core.publisher.Flux<
        com.uniflow.application.entity.Application
    > getApplicationsRequiringAttentionByTerritory(String territoryIdentifier) {
        log.debug(
            "Getting applications requiring attention for territory: {}",
            territoryIdentifier
        );

        return databaseClient
            .sql(
                "SELECT * FROM applications WHERE territory = :territory AND requires_attention = true AND is_archived = false ORDER BY priority_level DESC, updated_at ASC"
            )
            .bind("territory", territoryIdentifier)
            .fetch()
            .all()
            .map(this::mapToApplicationEntity);
    }

    /** Get application count by territory */
    public Mono<Long> getApplicationCountByTerritory(
        String territoryIdentifier
    ) {
        log.debug(
            "Getting application count for territory: {}",
            territoryIdentifier
        );

        return databaseClient
            .sql(
                "SELECT COUNT(*) as count FROM applications WHERE territory = :territory AND is_archived = false"
            )
            .bind("territory", territoryIdentifier)
            .fetch()
            .one()
            .map(row -> ((Number) row.get("count")).longValue());
    }

    /** Map database row to Application entity */
    private com.uniflow.application.entity.Application mapToApplicationEntity(
        java.util.Map<String, Object> row
    ) {
        // Basic mapping - this would need to be enhanced based on actual Application entity structure
        com.uniflow.application.entity.Application app =
            new com.uniflow.application.entity.Application();

        if (row.get("id") != null) {
            app.setId(java.util.UUID.fromString(row.get("id").toString()));
        }
        if (row.get("reference_number") != null) {
            app.setReferenceNumber(row.get("reference_number").toString());
        }
        if (row.get("student_id") != null) {
            app.setStudentId(Long.valueOf(row.get("student_id").toString()));
        }
        if (row.get("status") != null) {
            app.setStatus(row.get("status").toString());
        }
        if (row.get("territory") != null) {
            app.setTerritory(row.get("territory").toString());
        }

        return app;
    }

    // ========================================
    // EXISTING UTILITY METHODS
    // ========================================

    /**
     * Pretty print JSON from Map parameters
     *
     * @param parameters Map of parameters to convert to JSON
     * @return Pretty printed JSON string
     */
    public static String prettyPrintJson(Map<String, Object> parameters) {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        Map<String, Object> sortedParameters = new TreeMap<>(parameters);
        String json = "";
        try {
            json = objectMapper.writeValueAsString(sortedParameters);
        } catch (JsonProcessingException e) {
            log.error("Error converting parameters to JSON", e);
        }
        return json;
    }

    /**
     * Convert object to Map using reflection
     *
     * @param request Object to convert
     * @return Map representation of the object
     */
    public static Map<String, Object> objectToMap(Object request) {
        Map<String, Object> params = new HashMap<>();
        try {
            for (PropertyDescriptor propertyDescriptor : Introspector.getBeanInfo(
                request.getClass()
            ).getPropertyDescriptors()) {
                if (
                    propertyDescriptor.getReadMethod() != null &&
                    !"class".equals(propertyDescriptor.getName())
                ) {
                    Object value = propertyDescriptor
                        .getReadMethod()
                        .invoke(request);
                    if (value == null) {
                        value = "null";
                    }
                    params.put(propertyDescriptor.getName(), value);
                }
            }
            log.debug("Converted object to Map: {}", prettyPrintJson(params));
        } catch (
            java.beans.IntrospectionException
            | IllegalAccessException
            | InvocationTargetException e
        ) {
            throw new RuntimeException("Error converting object to Map", e);
        }
        return params;
    }

    /**
     * Extract user information from ServerRequest
     *
     * @param request ServerRequest containing JWT token
     * @return Mono containing UserJwtDto
     */
    public Mono<UserJwtDto> getUserFromServerRequest(ServerRequest request) {
        return jwtUtils
            .getUserFromServerRequest(request)
            .doOnNext(user ->
                log.debug("Extracted user from request: {}", user.getUsername())
            )
            .doOnError(error ->
                log.error("Error extracting user from request", error)
            );
    }

    /**
     * Extract username from ServerRequest
     *
     * @param request ServerRequest containing JWT token
     * @return Mono containing username string
     */
    public Mono<String> getUsernameFromServerRequest(ServerRequest request) {
        return jwtUtils
            .getUsernameFromServerRequest(request)
            .doOnNext(username ->
                log.debug("Extracted username: {}", username)
            );
    }

    /**
     * Extract user ID from ServerRequest
     *
     * @param request ServerRequest containing JWT token
     * @return Mono containing user ID
     */
    public Mono<Long> getUserIdFromServerRequest(ServerRequest request) {
        return jwtUtils
            .getUserIdFromServerRequest(request)
            .doOnNext(userId -> log.debug("Extracted user ID: {}", userId));
    }

    /**
     * Extract client IP address from ServerRequest
     *
     * @param request ServerRequest containing client information
     * @return Client IP address string
     */
    public String extractClientIp(ServerRequest request) {
        return jwtUtils.extractClientIp(request);
    }

    /**
     * Build SQL query with parameter substitution for debugging
     *
     * @param sqlQuery SQL query template
     * @param parameters Map of parameters to substitute
     * @return SQL query with parameters substituted
     */
    public String prettyPrintQuery(
        String sqlQuery,
        Map<String, Object> parameters
    ) {
        String result = sqlQuery;
        for (Map.Entry<String, Object> entry : parameters.entrySet()) {
            String placeholder = ":" + entry.getKey();
            String value = entry.getValue() != null
                ? entry.getValue().toString()
                : "NULL";
            result = result.replace(placeholder, "'" + value + "'");
        }
        return result;
    }

    /**
     * Execute SQL query with parameter bindings
     *
     * @param sqlQuery SQL query template
     * @param parameters Map of parameters to bind
     * @return FetchSpec for executing the query
     */
    public FetchSpec<Map<String, Object>> executeQueryWithBindings(
        String sqlQuery,
        Map<String, Object> parameters
    ) {
        // Extract parameter names from the SQL query
        Set<String> parameterNames = new HashSet<>();
        Matcher matcher = Pattern.compile(":([a-zA-Z0-9_]+)").matcher(sqlQuery);
        while (matcher.find()) {
            parameterNames.add(matcher.group(1));
        }

        // Start building the execute spec
        DatabaseClient.GenericExecuteSpec executeSpec = databaseClient.sql(
            sqlQuery
        );

        // Bind only those parameters that are present in the SQL query
        for (String parameterName : parameterNames) {
            if (parameters.containsKey(parameterName)) {
                Object value = parameters.get(parameterName);
                executeSpec = executeSpec.bind(
                    parameterName,
                    value != null ? value : ""
                );
            }
        }

        // Execute the query and return the result
        log.debug(
            "Executing query: {}",
            prettyPrintQuery(sqlQuery, parameters)
        );
        return executeSpec.fetch();
    }

    /**
     * Extract and validate query parameters from ServerRequest
     *
     * @param request ServerRequest containing query parameters
     * @return Map of extracted parameters with defaults
     */
    public Map<String, Object> extractQueryParameters(ServerRequest request) {
        Map<String, Object> parameters = new HashMap<>();

        // Extract common pagination parameters
        String size = request.queryParam("size").orElse("200");
        String offset = request.queryParam("offset").orElse("0");
        String sortBy = request.queryParam("sortBy").orElse("created_at");
        String sortOrder = request.queryParam("sortOrder").orElse("DESC");

        // Extract filter parameters
        String status = request.queryParam("status").orElse("");
        String workflowStage = request.queryParam("workflowStage").orElse("");
        String priority = request.queryParam("priority").orElse("");
        String fromDate = request.queryParam("fromDate").orElse("");
        String toDate = request.queryParam("toDate").orElse("");

        // Convert and validate parameters
        int sizeInt = Math.min(Integer.parseInt(size), 1000); // Max 1000 records
        int offsetInt = Math.max(Integer.parseInt(offset), 0); // Min 0 offset

        parameters.put("size", sizeInt);
        parameters.put("offset", offsetInt);
        parameters.put("sortBy", sortBy);
        parameters.put("sortOrder", sortOrder.toUpperCase());

        // Add filter parameters with null handling
        parameters.put("status", status.isEmpty() ? null : status);
        parameters.put(
            "workflowStage",
            workflowStage.isEmpty() ? null : workflowStage
        );
        parameters.put("priority", priority.isEmpty() ? null : priority);
        parameters.put("fromDate", fromDate.isEmpty() ? null : fromDate);
        parameters.put("toDate", toDate.isEmpty() ? null : toDate);

        log.debug(
            "Extracted query parameters: {}",
            prettyPrintJson(parameters)
        );
        return parameters;
    }

    /**
     * Add user context to parameters map
     *
     * @param parameters Map to add user context to
     * @param user UserJwtDto containing user information
     * @return Updated parameters map with user context
     */
    public Map<String, Object> addUserContext(
        Map<String, Object> parameters,
        UserJwtDto user
    ) {
        if (user != null) {
            parameters.put("userId", user.getId());
            parameters.put("username", user.getUsername());
            parameters.put("userType", user.getUserType());
            parameters.put("clientType", user.getClientType());
            parameters.put(
                "territoryIdentifier",
                user.getTerritoryIdentifier()
            );
            parameters.put("user", user);

            log.debug(
                "Added user context for user: {} (ID: {})",
                user.getUsername(),
                user.getId()
            );
        }

        return parameters;
    }

    /**
     * Set accessible territories for user based on admin profile assignments
     *
     * @param parameters Map to add territories to
     * @return Mono containing updated parameters with territories
     */
    public Mono<Map<String, Object>> setAccessibleTerritories(
        Map<String, Object> parameters
    ) {
        UserJwtDto user = (UserJwtDto) parameters.get("user");

        if (user == null) {
            return Mono.just(parameters);
        }

        // Super admin users have access to all territories
        if (
            "SUPER_ADMIN".equals(user.getUserType()) ||
            user.hasRole("SUPER_ADMIN")
        ) {
            log.debug("Super admin user has access to all territories");
            parameters.put("territories", List.of("ALL"));
            parameters.put("userType", "SUPER_ADMIN");
            return Mono.just(parameters);
        }

        // Get territories from admin_profiles.assigned_territories JSONB field
        String territoryQuery = """
            SELECT DISTINCT jsonb_array_elements_text(ap.assigned_territories) as territory_name
            FROM admin_profiles ap
            WHERE ap.user_id = :userId
            AND ap.assigned_territories IS NOT NULL
            """;

        Map<String, Object> queryParams = Map.of("userId", user.getId());

        return executeQueryWithBindings(territoryQuery, queryParams)
            .all()
            .map(result -> (String) result.get("territory_name"))
            .collectList()
            .map(territories -> {
                if (territories.isEmpty()) {
                    // Check if user is an admin but has no territories assigned
                    if (user.hasRole("ADMIN")) {
                        territories = List.of("DEFAULT");
                    }
                }

                parameters.put("territories", territories);
                log.debug(
                    "Set accessible territories for user {}: {}",
                    user.getUsername(),
                    territories
                );
                return parameters;
            });
    }

    /**
     * Add applications accessible by user to parameters based on actual schema
     *
     * @param parameters Map to add application IDs to
     * @return Mono containing updated parameters with accessible application IDs
     */
    public Mono<Map<String, Object>> addAccessibleApplications(
        Map<String, Object> parameters
    ) {
        UserJwtDto user = (UserJwtDto) parameters.get("user");

        if (user == null) {
            return Mono.just(parameters);
        }

        String applicationsQuery = """
            SELECT DISTINCT a.id FROM applications a
            LEFT JOIN student_profiles sp ON a.student_id = sp.id
            LEFT JOIN admin_profiles ap ON a.admin_id = ap.id
            WHERE (
                -- Student owns the application
                sp.user_id = :userId
                OR
                -- Admin is assigned to the application
                ap.user_id = :userId
                OR
                -- Super admin access
                (:userType IN ('ADMIN', 'SUPER_ADMIN'))
            )
            """;

        Map<String, Object> queryParams = Map.of(
            "userId",
            user.getId(),
            "userType",
            user.getUserType() != null ? user.getUserType() : "USER"
        );

        return executeQueryWithBindings(applicationsQuery, queryParams)
            .all()
            .map(result -> result.get("id").toString())
            .collectList()
            .filter(applicationIds -> !applicationIds.isEmpty())
            .map(applicationIds -> {
                parameters.put("applicationIds", applicationIds);
                parameters.put(
                    "applicationIdsWildcard",
                    applicationIds.isEmpty()
                );
                log.debug(
                    "Found {} applications accessible by user: {}",
                    applicationIds.size(),
                    user.getUsername()
                );
                return parameters;
            })
            .defaultIfEmpty(parameters);
    }

    /**
     * Verify user has access to specified application IDs based on actual schema
     *
     * @param parameters Map containing application IDs to verify
     * @return Mono containing updated parameters with verified application IDs
     */
    public Mono<Map<String, Object>> verifyApplicationAccess(
        Map<String, Object> parameters
    ) {
        UserJwtDto user = (UserJwtDto) parameters.get("user");
        @SuppressWarnings("unchecked")
        List<String> applicationIds = (List<String>) parameters.get(
            "applicationIds"
        );

        if (
            user == null || applicationIds == null || applicationIds.isEmpty()
        ) {
            return Mono.just(parameters);
        }

        String verifyQuery = """
            SELECT DISTINCT a.id FROM applications a
            LEFT JOIN student_profiles sp ON a.student_id = sp.id
            LEFT JOIN admin_profiles ap ON a.admin_id = ap.id
            LEFT JOIN admin_profiles user_ap ON user_ap.user_id = :userId
            WHERE a.id = ANY(:applicationIds)
            AND (
                -- Student owns the application
                sp.user_id = :userId
                OR
                -- Admin is assigned to the application
                ap.user_id = :userId
                OR
                -- Super admin access
                :userType = 'SUPER_ADMIN'
                OR
                -- Territory-based access for admins
                (
                    :userType = 'ADMIN'
                    AND user_ap.assigned_territories IS NOT NULL
                    AND ap.assigned_territories IS NOT NULL
                    AND user_ap.assigned_territories ?|
                        (SELECT ARRAY(SELECT jsonb_array_elements_text(ap.assigned_territories)))
                )
            )
            """;

        Map<String, Object> queryParams = Map.of(
            "applicationIds",
            applicationIds.toArray(new String[0]),
            "userId",
            user.getId(),
            "userType",
            user.getUserType() != null ? user.getUserType() : "USER"
        );

        return executeQueryWithBindings(verifyQuery, queryParams)
            .all()
            .map(result -> result.get("id").toString())
            .collectList()
            .map(verifiedIds -> {
                // Replace applicationIds with verified IDs (intersection)
                parameters.put("applicationIds", verifiedIds);
                log.debug(
                    "Verified access to {} applications for user: {}",
                    verifiedIds.size(),
                    user.getUsername()
                );
                return parameters;
            });
    }

    /**
     * Build complete user context for query execution
     *
     * @param request ServerRequest containing user token
     * @return Mono containing parameters map with complete user context
     */
    public Mono<Map<String, Object>> buildUserContext(ServerRequest request) {
        Map<String, Object> parameters = extractQueryParameters(request);

        return getUserFromServerRequest(request)
            .map(user -> addUserContext(parameters, user))
            .flatMap(this::setAccessibleTerritories)
            .flatMap(this::addAccessibleApplications)
            .doOnNext(finalParams ->
                log.debug(
                    "Built complete user context: {}",
                    prettyPrintJson(finalParams)
                )
            )
            .onErrorResume(error -> {
                log.error("Error building user context", error);
                return Mono.just(parameters);
            });
    }

    /**
     * Format SQL query template with dynamic parameters
     *
     * @param queryTemplate SQL query template with %s placeholders
     * @param formatParams Parameters to format into the template
     * @return Formatted SQL query string
     */
    public String formatQueryTemplate(
        String queryTemplate,
        Object... formatParams
    ) {
        try {
            return String.format(queryTemplate, formatParams);
        } catch (Exception e) {
            log.error("Error formatting query template", e);
            return queryTemplate;
        }
    }

    /**
     * Validate and sanitize sort field to prevent SQL injection
     *
     * @param sortField Field name to sort by
     * @param allowedFields List of allowed field names
     * @param defaultField Default field if validation fails
     * @return Validated and sanitized sort field
     */
    public String validateSortField(
        String sortField,
        List<String> allowedFields,
        String defaultField
    ) {
        if (sortField == null || sortField.isEmpty()) {
            return defaultField;
        }

        // Remove any SQL injection attempts
        String sanitized = sortField.replaceAll("[^a-zA-Z0-9_]", "");

        if (allowedFields.contains(sanitized)) {
            return sanitized;
        }

        log.warn(
            "Invalid sort field requested: {}, using default: {}",
            sortField,
            defaultField
        );
        return defaultField;
    }

    /**
     * Validate and sanitize sort order
     *
     * @param sortOrder Sort order (ASC or DESC)
     * @return Validated sort order
     */
    public String validateSortOrder(String sortOrder) {
        if (sortOrder == null) {
            return "DESC";
        }

        String upper = sortOrder.toUpperCase();
        return "ASC".equals(upper) || "DESC".equals(upper) ? upper : "DESC";
    }
}
