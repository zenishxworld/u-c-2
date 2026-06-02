package com.uniflow.admin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.admin.entity.AdminProfile;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * AdminQueryExecutor - Generic SQL Query Executor for Admin filtering and management
 *
 * <p>This service provides dynamic SQL query execution capabilities for admin profile
 * filtering, searching, and analytics. It supports the new SuperAdmin system with
 * flexible parameter-based filtering and pagination.
 *
 * <p>Features:
 * - Dynamic parameter extraction from request maps
 * - SQL injection prevention with parameterized queries
 * - Flexible filtering by role, specialization, permissions, etc.
 * - Pagination and sorting support
 * - Performance metrics and analytics queries
 * - Multi-tenant support
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminQueryExecutor {

    private final DatabaseClient databaseClient;
    private final ObjectMapper objectMapper;

    /**
     * Extract admin filtering parameters from request map
     *
     * @param params Raw parameter map from HTTP request
     * @return Cleaned and validated parameter map
     */
    public Map<String, Object> extractAdminParameters(Map<String, Object> params) {
        Map<String, Object> cleanParams = new HashMap<>();

        if (params == null || params.isEmpty()) {
            return cleanParams;
        }

        // Extract and validate common filter parameters
        extractStringParam(params, cleanParams, "role");
        extractStringParam(params, cleanParams, "specialization");
        extractStringParam(params, cleanParams, "department");
        extractBooleanParam(params, cleanParams, "is_active");
        extractStringParam(params, cleanParams, "search");

        // Permission filters
        extractBooleanParam(params, cleanParams, "can_verify_documents");
        extractBooleanParam(params, cleanParams, "can_approve_applications");
        extractBooleanParam(params, cleanParams, "can_process_payments");
        extractBooleanParam(params, cleanParams, "can_manage_users");

        // Workload filters
        extractIntegerParam(params, cleanParams, "min_workload");
        extractIntegerParam(params, cleanParams, "max_workload");
        extractDoubleParam(params, cleanParams, "min_quality_score");
        extractDoubleParam(params, cleanParams, "max_quality_score");

        // Country and language filters
        extractStringParam(params, cleanParams, "country_code");
        extractStringParam(params, cleanParams, "language_code");

        // Pagination parameters
        extractIntegerParam(params, cleanParams, "page", 0);
        extractIntegerParam(params, cleanParams, "size", 20);
        extractStringParam(params, cleanParams, "sort", "created_at");
        extractStringParam(params, cleanParams, "direction", "DESC");

        log.debug("Extracted admin parameters: {}", cleanParams);
        return cleanParams;
    }

    /**
     * Execute dynamic admin query with filters
     *
     * @param filterParams Parameter map for filtering
     * @param clientId Client identifier for multi-tenant support
     * @return Flux of AdminProfile results
     */
    public Flux<AdminProfile> executeAdminQuery(
        Map<String, Object> filterParams,
        String clientId
    ) {
        StringBuilder queryBuilder = new StringBuilder(
            "SELECT * FROM admin_profile WHERE client_id = :clientId"
        );

        Map<String, Object> bindParams = new HashMap<>();
        bindParams.put("clientId", clientId);

        // Build dynamic WHERE conditions
        buildWhereConditions(queryBuilder, filterParams, bindParams);

        // Add sorting
        addSorting(queryBuilder, filterParams);

        // Add pagination
        addPagination(queryBuilder, filterParams, bindParams);

        String finalQuery = queryBuilder.toString();
        log.debug("Executing admin query: {}", finalQuery);
        log.debug("With parameters: {}", bindParams);

        DatabaseClient.GenericExecuteSpec executeSpec = databaseClient.sql(finalQuery);

        // Bind all parameters
        for (Map.Entry<String, Object> entry : bindParams.entrySet()) {
            executeSpec = executeSpec.bind(entry.getKey(), entry.getValue());
        }

        return executeSpec
            .map((row, metadata) -> mapRowToAdminProfile(row))
            .all();
    }

    /**
     * Get total count of admins matching filters
     *
     * @param filterParams Parameter map for filtering
     * @param clientId Client identifier
     * @return Mono of total count
     */
    public Mono<Long> getAdminCount(
        Map<String, Object> filterParams,
        String clientId
    ) {
        StringBuilder queryBuilder = new StringBuilder(
            "SELECT COUNT(*) FROM admin_profile WHERE client_id = :clientId"
        );

        Map<String, Object> bindParams = new HashMap<>();
        bindParams.put("clientId", clientId);

        // Build dynamic WHERE conditions (without pagination)
        buildWhereConditions(queryBuilder, filterParams, bindParams);

        String finalQuery = queryBuilder.toString();
        log.debug("Executing admin count query: {}", finalQuery);

        DatabaseClient.GenericExecuteSpec executeSpec = databaseClient.sql(finalQuery);

        // Bind all parameters
        for (Map.Entry<String, Object> entry : bindParams.entrySet()) {
            executeSpec = executeSpec.bind(entry.getKey(), entry.getValue());
        }

        return executeSpec
            .map(row -> row.get(0, Long.class))
            .one();
    }

    /**
     * Build dynamic WHERE conditions based on filter parameters
     */
    private void buildWhereConditions(
        StringBuilder queryBuilder,
        Map<String, Object> filterParams,
        Map<String, Object> bindParams
    ) {
        // Role filter
        if (filterParams.containsKey("role")) {
            queryBuilder.append(" AND role = :role");
            bindParams.put("role", filterParams.get("role"));
        }

        // Specialization filter
        if (filterParams.containsKey("specialization")) {
            queryBuilder.append(" AND specialization = :specialization");
            bindParams.put("specialization", filterParams.get("specialization"));
        }

        // Department filter
        if (filterParams.containsKey("department")) {
            queryBuilder.append(" AND department = :department");
            bindParams.put("department", filterParams.get("department"));
        }

        // Active status filter
        if (filterParams.containsKey("is_active")) {
            queryBuilder.append(" AND is_active = :isActive");
            bindParams.put("isActive", filterParams.get("is_active"));
        }

        // Permission filters
        if (filterParams.containsKey("can_verify_documents")) {
            queryBuilder.append(" AND can_verify_documents = :canVerifyDocuments");
            bindParams.put("canVerifyDocuments", filterParams.get("can_verify_documents"));
        }

        if (filterParams.containsKey("can_approve_applications")) {
            queryBuilder.append(" AND can_approve_applications = :canApproveApplications");
            bindParams.put("canApproveApplications", filterParams.get("can_approve_applications"));
        }

        if (filterParams.containsKey("can_process_payments")) {
            queryBuilder.append(" AND can_process_payments = :canProcessPayments");
            bindParams.put("canProcessPayments", filterParams.get("can_process_payments"));
        }

        if (filterParams.containsKey("can_manage_users")) {
            queryBuilder.append(" AND can_manage_users = :canManageUsers");
            bindParams.put("canManageUsers", filterParams.get("can_manage_users"));
        }

        // Workload filters
        if (filterParams.containsKey("min_workload")) {
            queryBuilder.append(" AND current_workload >= :minWorkload");
            bindParams.put("minWorkload", filterParams.get("min_workload"));
        }

        if (filterParams.containsKey("max_workload")) {
            queryBuilder.append(" AND current_workload <= :maxWorkload");
            bindParams.put("maxWorkload", filterParams.get("max_workload"));
        }

        // Quality score filters
        if (filterParams.containsKey("min_quality_score")) {
            queryBuilder.append(" AND quality_score >= :minQualityScore");
            bindParams.put("minQualityScore", filterParams.get("min_quality_score"));
        }

        if (filterParams.containsKey("max_quality_score")) {
            queryBuilder.append(" AND quality_score <= :maxQualityScore");
            bindParams.put("maxQualityScore", filterParams.get("max_quality_score"));
        }

        // Country specialization filter
        if (filterParams.containsKey("country_code")) {
            queryBuilder.append(" AND (specialization_countries LIKE :countryCode OR specialization_countries IS NULL)");
            bindParams.put("countryCode", "%" + filterParams.get("country_code") + "%");
        }

        // Language proficiency filter
        if (filterParams.containsKey("language_code")) {
            queryBuilder.append(" AND (language_proficiencies LIKE :languageCode OR language_proficiencies IS NULL)");
            bindParams.put("languageCode", "%" + filterParams.get("language_code") + "%");
        }

        // Search filter (across multiple fields)
        if (filterParams.containsKey("search")) {
            String searchTerm = "%" + filterParams.get("search").toString().toLowerCase() + "%";
            queryBuilder.append(" AND (");
            queryBuilder.append("LOWER(first_name) LIKE :searchTerm OR ");
            queryBuilder.append("LOWER(last_name) LIKE :searchTerm OR ");
            queryBuilder.append("LOWER(username) LIKE :searchTerm OR ");
            queryBuilder.append("LOWER(email) LIKE :searchTerm OR ");
            queryBuilder.append("LOWER(employee_id) LIKE :searchTerm");
            queryBuilder.append(")");
            bindParams.put("searchTerm", searchTerm);
        }
    }

    /**
     * Add sorting to query
     */
    private void addSorting(StringBuilder queryBuilder, Map<String, Object> filterParams) {
        String sortField = filterParams.getOrDefault("sort", "created_at").toString();
        String direction = filterParams.getOrDefault("direction", "DESC").toString();

        // Validate sort field to prevent SQL injection
        if (isValidSortField(sortField)) {
            queryBuilder.append(" ORDER BY ").append(sortField).append(" ").append(direction);
        } else {
            queryBuilder.append(" ORDER BY created_at DESC");
        }
    }

    /**
     * Add pagination to query
     */
    private void addPagination(
        StringBuilder queryBuilder,
        Map<String, Object> filterParams,
        Map<String, Object> bindParams
    ) {
        int page = (Integer) filterParams.getOrDefault("page", 0);
        int size = (Integer) filterParams.getOrDefault("size", 20);

        // Limit size to prevent performance issues
        size = Math.min(size, 100);

        int offset = page * size;

        queryBuilder.append(" LIMIT :limit OFFSET :offset");
        bindParams.put("limit", size);
        bindParams.put("offset", offset);
    }

    /**
     * Validate sort field to prevent SQL injection
     */
    private boolean isValidSortField(String field) {
        List<String> allowedFields = List.of(
            "id", "username", "email", "first_name", "last_name",
            "role", "specialization", "department", "is_active",
            "current_workload", "quality_score", "total_applications_processed",
            "average_processing_time_hours", "last_activity_at", "created_at", "updated_at"
        );

        return allowedFields.contains(field.toLowerCase());
    }

    /**
     * Map database row to AdminProfile entity
     */
    private AdminProfile mapRowToAdminProfile(io.r2dbc.spi.Row row) {
        return AdminProfile.builder()
            .id(row.get("id", java.util.UUID.class))
            .userId(row.get("user_id", String.class))
            .username(row.get("username", String.class))
            .email(row.get("email", String.class))
            .firstName(row.get("first_name", String.class))
            .lastName(row.get("last_name", String.class))
            .employeeId(row.get("employee_id", String.class))
            .role(row.get("role", String.class))
            .specialization(row.get("specialization", String.class))
            .department(row.get("department", String.class))
            .phone(row.get("phone", String.class))
            .extension(row.get("extension", String.class))
            .bio(row.get("bio", String.class))
            .profilePhotoUrl(row.get("profile_photo_url", String.class))
            .workHoursStart(row.get("work_hours_start", java.time.LocalTime.class))
            .workHoursEnd(row.get("work_hours_end", java.time.LocalTime.class))
            .timezone(row.get("timezone", String.class))
            .maxDailyCapacity(row.get("max_daily_capacity", Integer.class))
            .currentWorkload(row.get("current_workload", Integer.class))
            .permissions(row.get("permissions", String.class))
            .permissionLastUpdated(row.get("permission_last_updated", LocalDateTime.class))
            .permissionLastUpdatedBy(row.get("permission_last_updated_by", String.class))
            .maxConcurrentApplications(row.get("max_concurrent_applications", Integer.class))
            .specializationCountries(row.get("specialization_countries", String.class))
            .languageProficiencies(row.get("language_proficiencies", String.class))
            .totalApplicationsProcessed(row.get("total_applications_processed", Integer.class))
            .averageProcessingTimeHours(row.get("average_processing_time_hours", Double.class))
            .qualityScore(row.get("quality_score", Double.class))
            .isActive(row.get("is_active", Boolean.class))
            .lastActivityAt(row.get("last_activity_at", LocalDateTime.class))
            .canVerifyDocuments(row.get("can_verify_documents", Boolean.class))
            .canApproveApplications(row.get("can_approve_applications", Boolean.class))
            .canProcessPayments(row.get("can_process_payments", Boolean.class))
            .canManageUsers(row.get("can_manage_users", Boolean.class))
            .clientId(row.get("client_id", String.class))
            .hireDate(row.get("hire_date", java.time.LocalDate.class))
            .lastLogin(row.get("last_login", LocalDateTime.class))
            .lastActivity(row.get("last_activity", LocalDateTime.class))
            .createdAt(row.get("created_at", LocalDateTime.class))
            .updatedAt(row.get("updated_at", LocalDateTime.class))
            .build();
    }

    // Helper methods for parameter extraction
    private void extractStringParam(
        Map<String, Object> source,
        Map<String, Object> target,
        String key
    ) {
        extractStringParam(source, target, key, null);
    }

    private void extractStringParam(
        Map<String, Object> source,
        Map<String, Object> target,
        String key,
        String defaultValue
    ) {
        Object value = source.get(key);
        if (value != null && !value.toString().trim().isEmpty()) {
            target.put(key, value.toString().trim());
        } else if (defaultValue != null) {
            target.put(key, defaultValue);
        }
    }

    private void extractBooleanParam(
        Map<String, Object> source,
        Map<String, Object> target,
        String key
    ) {
        Object value = source.get(key);
        if (value != null) {
            if (value instanceof Boolean) {
                target.put(key, value);
            } else {
                target.put(key, Boolean.parseBoolean(value.toString()));
            }
        }
    }

    private void extractIntegerParam(
        Map<String, Object> source,
        Map<String, Object> target,
        String key
    ) {
        extractIntegerParam(source, target, key, null);
    }

    private void extractIntegerParam(
        Map<String, Object> source,
        Map<String, Object> target,
        String key,
        Integer defaultValue
    ) {
        Object value = source.get(key);
        if (value != null) {
            try {
                if (value instanceof Integer) {
                    target.put(key, value);
                } else {
                    target.put(key, Integer.parseInt(value.toString()));
                }
            } catch (NumberFormatException e) {
                if (defaultValue != null) {
                    target.put(key, defaultValue);
                }
            }
        } else if (defaultValue != null) {
            target.put(key, defaultValue);
        }
    }

    private void extractDoubleParam(
        Map<String, Object> source,
        Map<String, Object> target,
        String key
    ) {
        Object value = source.get(key);
        if (value != null) {
            try {
                if (value instanceof Double) {
                    target.put(key, value);
                } else {
                    target.put(key, Double.parseDouble(value.toString()));
                }
            } catch (NumberFormatException e) {
                // Ignore invalid double values
            }
        }
    }
}
