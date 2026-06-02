package com.uniflow.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.application.entity.Application;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * ApplicationQueryExecutor - Advanced JSONB query service for Application filtering
 * This service provides dynamic SQL generation for complex application filtering
 * using JSONB data extraction and efficient pagination.
 */
@Service
public class ApplicationQueryExecutor {

    private final DatabaseClient databaseClient;
    private final ObjectMapper objectMapper;

    public ApplicationQueryExecutor(
        DatabaseClient databaseClient,
        ObjectMapper objectMapper
    ) {
        this.databaseClient = databaseClient;
        this.objectMapper = objectMapper;
    }

    /**
     * Get applications with advanced filtering and pagination
     */
    public Flux<Application> getApplicationsWithFilters(
        Map<String, Object> filters,
        String sortBy,
        String sortDirection,
        int page,
        int size
    ) {
        ApplicationQuery query = buildApplicationQuery(
            filters,
            sortBy,
            sortDirection,
            page,
            size,
            false
        );

        DatabaseClient.GenericExecuteSpec executeSpec = databaseClient.sql(
            query.sql
        );

        // Bind parameters
        for (Map.Entry<String, Object> param : query.parameters.entrySet()) {
            executeSpec = executeSpec.bind(param.getKey(), param.getValue());
        }

        return executeSpec
            .map(row -> {
                Application app = new Application();
                app.setId(row.get("id", UUID.class));
                app.setReferenceNumber(
                    row.get("reference_number", String.class)
                );
                app.setStudentId(row.get("student_id", Long.class));
                app.setUniversityId(row.get("university_id", UUID.class));
                app.setCourseId(row.get("course_id", UUID.class));
                app.setStatus(row.get("status", String.class));
                app.setWorkflowStage(row.get("workflow_stage", String.class));
                app.setPriority(row.get("priority", String.class));
                app.setSubmittedAt(
                    row.get("submitted_at", LocalDateTime.class)
                );
                app.setDeadline(row.get("deadline", LocalDateTime.class));
                app.setAssignedAdminId(
                    row.get("assigned_admin_id", Long.class)
                );
                app.setCompletionPercentage(
                    row.get("completion_percentage", Integer.class)
                );
                app.setIsUrgent(row.get("is_urgent", Boolean.class));
                app.setIsActive(row.get("is_active", Boolean.class));
                app.setCreatedAt(row.get("created_at", LocalDateTime.class));
                app.setUpdatedAt(row.get("updated_at", LocalDateTime.class));
                app.setCreatedBy(row.get("created_by", String.class));
                app.setUpdatedBy(row.get("updated_by", String.class));
                return app;
            })
            .all();
    }

    /**
     * Count applications with filters for pagination
     */
    public Mono<Long> getApplicationCount(Map<String, Object> filters) {
        ApplicationQuery query = buildApplicationQuery(
            filters,
            null,
            null,
            0,
            0,
            true
        );

        DatabaseClient.GenericExecuteSpec executeSpec = databaseClient.sql(
            query.sql
        );

        // Bind parameters
        for (Map.Entry<String, Object> param : query.parameters.entrySet()) {
            executeSpec = executeSpec.bind(param.getKey(), param.getValue());
        }

        return executeSpec.map(row -> row.get(0, Long.class)).one();
    }

    /**
     * Build dynamic SQL query based on filters
     */
    private ApplicationQuery buildApplicationQuery(
        Map<String, Object> filters,
        String sortBy,
        String sortDirection,
        int page,
        int size,
        boolean isCountQuery
    ) {
        StringBuilder sql = new StringBuilder();
        List<String> conditions = new ArrayList<>();
        Map<String, Object> parameters = new java.util.HashMap<>();

        // Base query
        if (isCountQuery) {
            sql.append("SELECT COUNT(*) FROM applications");
        } else {
            sql.append("SELECT * FROM applications");
        }

        // Always filter active applications
        conditions.add("is_active = true");

        // Add filter conditions
        addFilterConditions(filters, conditions, parameters);

        // Add WHERE clause if conditions exist
        if (!conditions.isEmpty()) {
            sql.append(" WHERE ").append(String.join(" AND ", conditions));
        }

        // Add sorting and pagination for data queries
        if (!isCountQuery) {
            addSortingAndPagination(sql, sortBy, sortDirection, page, size);
        }

        return new ApplicationQuery(sql.toString(), parameters);
    }

    /**
     * Add filter conditions to the query
     */
    private void addFilterConditions(
        Map<String, Object> filters,
        List<String> conditions,
        Map<String, Object> parameters
    ) {
        // Student ID filter
        if (
            filters.containsKey("studentId") && filters.get("studentId") != null
        ) {
            conditions.add("student_id = :studentId");
            parameters.put("studentId", filters.get("studentId"));
        }

        // University ID filter
        if (
            filters.containsKey("universityId") &&
            filters.get("universityId") != null
        ) {
            conditions.add("university_id = :universityId");
            parameters.put("universityId", filters.get("universityId"));
        }

        // Course ID filter
        if (
            filters.containsKey("courseId") && filters.get("courseId") != null
        ) {
            conditions.add("course_id = :courseId");
            parameters.put("courseId", filters.get("courseId"));
        }

        // Status filter
        if (filters.containsKey("status") && filters.get("status") != null) {
            conditions.add("status = :status");
            parameters.put("status", filters.get("status"));
        }

        // Workflow stage filter
        if (
            filters.containsKey("workflowStage") &&
            filters.get("workflowStage") != null
        ) {
            conditions.add("workflow_stage = :workflowStage");
            parameters.put("workflowStage", filters.get("workflowStage"));
        }

        // Priority filter
        if (
            filters.containsKey("priority") && filters.get("priority") != null
        ) {
            conditions.add("priority = :priority");
            parameters.put("priority", filters.get("priority"));
        }

        // Urgent filter
        if (
            filters.containsKey("isUrgent") && filters.get("isUrgent") != null
        ) {
            conditions.add("is_urgent = :isUrgent");
            parameters.put("isUrgent", filters.get("isUrgent"));
        }

        // Assigned admin filter
        if (
            filters.containsKey("assignedAdminId") &&
            filters.get("assignedAdminId") != null
        ) {
            conditions.add("assigned_admin_id = :assignedAdminId");
            parameters.put("assignedAdminId", filters.get("assignedAdminId"));
        }

        // JSONB filters - Program name
        if (
            filters.containsKey("programName") &&
            filters.get("programName") != null
        ) {
            conditions.add("data->'academic'->>'program_name' = :programName");
            parameters.put("programName", filters.get("programName"));
        }

        // JSONB filters - Degree level
        if (
            filters.containsKey("degreeLevel") &&
            filters.get("degreeLevel") != null
        ) {
            conditions.add("data->'academic'->>'degree_level' = :degreeLevel");
            parameters.put("degreeLevel", filters.get("degreeLevel"));
        }

        // JSONB filters - Field of study
        if (
            filters.containsKey("fieldOfStudy") &&
            filters.get("fieldOfStudy") != null
        ) {
            conditions.add(
                "data->'academic'->>'field_of_study' = :fieldOfStudy"
            );
            parameters.put("fieldOfStudy", filters.get("fieldOfStudy"));
        }

        // JSONB filters - Intake term
        if (
            filters.containsKey("intakeTerm") &&
            filters.get("intakeTerm") != null
        ) {
            conditions.add("data->'academic'->>'intake_term' = :intakeTerm");
            parameters.put("intakeTerm", filters.get("intakeTerm"));
        }

        // JSONB filters - Documents verified
        if (
            filters.containsKey("documentsVerified") &&
            filters.get("documentsVerified") != null
        ) {
            conditions.add(
                "(data->'documents'->>'documents_verified')::boolean = :documentsVerified"
            );
            parameters.put(
                "documentsVerified",
                filters.get("documentsVerified")
            );
        }

        // JSONB filters - Payment completed
        if (
            filters.containsKey("paymentCompleted") &&
            filters.get("paymentCompleted") != null
        ) {
            conditions.add(
                "(data->'payment'->>'payment_completed')::boolean = :paymentCompleted"
            );
            parameters.put("paymentCompleted", filters.get("paymentCompleted"));
        }

        // JSONB filters - Submitted to university
        if (
            filters.containsKey("submittedToUniversity") &&
            filters.get("submittedToUniversity") != null
        ) {
            conditions.add(
                "(data->'university'->>'submitted_to_university')::boolean = :submittedToUniversity"
            );
            parameters.put(
                "submittedToUniversity",
                filters.get("submittedToUniversity")
            );
        }

        // Date range filters
        if (
            filters.containsKey("submittedAfter") &&
            filters.get("submittedAfter") != null
        ) {
            conditions.add("submitted_at >= :submittedAfter");
            parameters.put("submittedAfter", filters.get("submittedAfter"));
        }

        if (
            filters.containsKey("submittedBefore") &&
            filters.get("submittedBefore") != null
        ) {
            conditions.add("submitted_at <= :submittedBefore");
            parameters.put("submittedBefore", filters.get("submittedBefore"));
        }

        if (
            filters.containsKey("deadlineAfter") &&
            filters.get("deadlineAfter") != null
        ) {
            conditions.add("deadline >= :deadlineAfter");
            parameters.put("deadlineAfter", filters.get("deadlineAfter"));
        }

        if (
            filters.containsKey("deadlineBefore") &&
            filters.get("deadlineBefore") != null
        ) {
            conditions.add("deadline <= :deadlineBefore");
            parameters.put("deadlineBefore", filters.get("deadlineBefore"));
        }

        // Completion percentage range
        if (
            filters.containsKey("minCompletionPercentage") &&
            filters.get("minCompletionPercentage") != null
        ) {
            conditions.add("completion_percentage >= :minCompletionPercentage");
            parameters.put(
                "minCompletionPercentage",
                filters.get("minCompletionPercentage")
            );
        }

        if (
            filters.containsKey("maxCompletionPercentage") &&
            filters.get("maxCompletionPercentage") != null
        ) {
            conditions.add("completion_percentage <= :maxCompletionPercentage");
            parameters.put(
                "maxCompletionPercentage",
                filters.get("maxCompletionPercentage")
            );
        }

        // Text search across multiple fields
        if (filters.containsKey("search") && filters.get("search") != null) {
            String searchTerm = "%" + filters.get("search").toString() + "%";
            conditions.add(
                "(reference_number ILIKE :search OR " +
                    "data->'academic'->>'program_name' ILIKE :search OR " +
                    "data->'university'->>'university_reference_number' ILIKE :search)"
            );
            parameters.put("search", searchTerm);
        }
    }

    /**
     * Add sorting and pagination to the query
     */
    private void addSortingAndPagination(
        StringBuilder sql,
        String sortBy,
        String sortDirection,
        int page,
        int size
    ) {
        // Default sorting
        sql.append(" ORDER BY ");

        if (sortBy != null) {
            switch (sortBy.toLowerCase()) {
                case "created_at":
                    sql.append("created_at");
                    break;
                case "updated_at":
                    sql.append("updated_at");
                    break;
                case "submitted_at":
                    sql.append("submitted_at");
                    break;
                case "deadline":
                    sql.append("deadline");
                    break;
                case "priority":
                    sql.append(
                        "CASE priority " +
                            "WHEN 'URGENT' THEN 4 " +
                            "WHEN 'HIGH' THEN 3 " +
                            "WHEN 'NORMAL' THEN 2 " +
                            "WHEN 'LOW' THEN 1 " +
                            "ELSE 0 END"
                    );
                    break;
                case "status":
                    sql.append("status");
                    break;
                case "completion_percentage":
                    sql.append("completion_percentage");
                    break;
                case "reference_number":
                    sql.append("reference_number");
                    break;
                case "program_name":
                    sql.append("data->'academic'->>'program_name'");
                    break;
                default:
                    sql.append("created_at");
            }
        } else {
            sql.append("created_at");
        }

        // Sort direction
        if ("asc".equalsIgnoreCase(sortDirection)) {
            sql.append(" ASC");
        } else {
            sql.append(" DESC");
        }

        // Secondary sort for consistency
        sql.append(", id ASC");

        // Pagination
        if (size > 0) {
            sql.append(" LIMIT ").append(size);
            sql.append(" OFFSET ").append(page * size);
        }
    }

    /**
     * Get application filter options for frontend
     */
    public Mono<Map<String, Object>> getApplicationFilterOptions() {
        String sql = """
            SELECT
                array_agg(DISTINCT status) as statuses,
                array_agg(DISTINCT workflow_stage) as workflow_stages,
                array_agg(DISTINCT priority) as priorities,
                array_agg(DISTINCT data->'academic'->>'degree_level') as degree_levels,
                array_agg(DISTINCT data->'academic'->>'field_of_study') as fields_of_study,
                array_agg(DISTINCT data->'academic'->>'intake_term') as intake_terms
            FROM applications
            WHERE is_active = true
            AND data IS NOT NULL
            """;

        return databaseClient
            .sql(sql)
            .map(row -> {
                Map<String, Object> options = new java.util.HashMap<>();
                options.put("statuses", row.get("statuses"));
                options.put("workflowStages", row.get("workflow_stages"));
                options.put("priorities", row.get("priorities"));
                options.put("degreeLevels", row.get("degree_levels"));
                options.put("fieldsOfStudy", row.get("fields_of_study"));
                options.put("intakeTerms", row.get("intake_terms"));
                return options;
            })
            .one();
    }

    /**
     * Get application statistics
     */
    public Mono<Map<String, Object>> getApplicationStatistics(
        Map<String, Object> filters
    ) {
        StringBuilder sql = new StringBuilder();
        List<String> conditions = new ArrayList<>();
        Map<String, Object> parameters = new java.util.HashMap<>();

        sql.append(
            """
            SELECT
                COUNT(*) as total_applications,
                COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_count,
                COUNT(CASE WHEN status = 'SUBMITTED' THEN 1 END) as submitted_count,
                COUNT(CASE WHEN status = 'UNDER_REVIEW' THEN 1 END) as under_review_count,
                COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_count,
                COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_count,
                COUNT(CASE WHEN is_urgent = true THEN 1 END) as urgent_count,
                COUNT(CASE WHEN deadline < NOW() AND status NOT IN ('COMPLETED', 'REJECTED') THEN 1 END) as overdue_count,
                COUNT(CASE WHEN (data->'documents'->>'documents_verified')::boolean = true THEN 1 END) as documents_verified_count,
                COUNT(CASE WHEN (data->'payment'->>'payment_completed')::boolean = true THEN 1 END) as payment_completed_count,
                AVG(completion_percentage) as avg_completion_percentage
            FROM applications
            """
        );

        // Always filter active applications
        conditions.add("is_active = true");

        // Add filter conditions
        addFilterConditions(filters, conditions, parameters);

        // Add WHERE clause
        if (!conditions.isEmpty()) {
            sql.append(" WHERE ").append(String.join(" AND ", conditions));
        }

        DatabaseClient.GenericExecuteSpec executeSpec = databaseClient.sql(
            sql.toString()
        );

        // Bind parameters
        for (Map.Entry<String, Object> param : parameters.entrySet()) {
            executeSpec = executeSpec.bind(param.getKey(), param.getValue());
        }

        return executeSpec
            .map(row -> {
                Map<String, Object> stats = new java.util.HashMap<>();
                stats.put("totalApplications", row.get("total_applications"));
                stats.put("draftCount", row.get("draft_count"));
                stats.put("submittedCount", row.get("submitted_count"));
                stats.put("underReviewCount", row.get("under_review_count"));
                stats.put("completedCount", row.get("completed_count"));
                stats.put("rejectedCount", row.get("rejected_count"));
                stats.put("urgentCount", row.get("urgent_count"));
                stats.put("overdueCount", row.get("overdue_count"));
                stats.put(
                    "documentsVerifiedCount",
                    row.get("documents_verified_count")
                );
                stats.put(
                    "paymentCompletedCount",
                    row.get("payment_completed_count")
                );
                stats.put(
                    "avgCompletionPercentage",
                    row.get("avg_completion_percentage")
                );
                return stats;
            })
            .one();
    }

    /**
     * Internal class to hold query and parameters
     */
    private static class ApplicationQuery {

        final String sql;
        final Map<String, Object> parameters;

        ApplicationQuery(String sql, Map<String, Object> parameters) {
            this.sql = sql;
            this.parameters = parameters;
        }
    }
}
