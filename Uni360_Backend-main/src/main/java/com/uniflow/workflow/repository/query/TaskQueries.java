package com.uniflow.workflow.repository.query;

/**
 * SQL Query constants for Task filtering and counting operations
 *
 * This class contains SQL queries for:
 * - Finding tasks with dynamic filters and wildcard support
 * - Counting tasks with filters
 * - Grouping tasks by various fields for filter analytics
 *
 * Wildcard pattern: (column IN (:param) OR :paramWildcard IS TRUE)
 * This allows bypassing filters when parameters are not provided.
 */
public final class TaskQueries {

    private TaskQueries() {
        // Private constructor to prevent instantiation
    }

    /**
     * Find tasks with comprehensive filter support
     * Supports wildcards for all filter parameters
     */
    public static final String FIND_TASKS_WITH_FILTERS = """
        SELECT * FROM tasks t
        WHERE t.deleted = false
        AND (t.owner_id = :ownerId OR :ownerIdWildcard IS TRUE)
        AND (t.task_type IN (:taskTypes) OR :taskTypesWildcard IS TRUE)
        AND (t.task_status IN (:taskStatuses) OR :taskStatusesWildcard IS TRUE)
        AND (t.priority IN (:priorities) OR :prioritiesWildcard IS TRUE)
        AND (t.stage IN (:stages) OR :stagesWildcard IS TRUE)
        AND (t.active = :active OR :activeWildcard IS TRUE)
        AND (t.application_id IN (:applicationIds) OR :applicationIdsWildcard IS TRUE)
        AND (t.created_at >= :fromDate OR :fromDate = 0)
        AND (t.created_at <= :toDate OR :toDate = 0)
        ORDER BY t.updated_at %s
        LIMIT :size OFFSET :offset
        """;

    /**
     * Get total count of tasks with filters
     */
    public static final String GET_TASK_COUNT_WITH_FILTERS = """
        SELECT COUNT(*) as count FROM tasks t
        WHERE t.deleted = false
        AND (t.owner_id = :ownerId OR :ownerIdWildcard IS TRUE)
        AND (t.task_type IN (:taskTypes) OR :taskTypesWildcard IS TRUE)
        AND (t.task_status IN (:taskStatuses) OR :taskStatusesWildcard IS TRUE)
        AND (t.priority IN (:priorities) OR :prioritiesWildcard IS TRUE)
        AND (t.stage IN (:stages) OR :stagesWildcard IS TRUE)
        AND (t.active = :active OR :activeWildcard IS TRUE)
        AND (t.application_id IN (:applicationIds) OR :applicationIdsWildcard IS TRUE)
        AND (t.created_at >= :fromDate OR :fromDate = 0)
        AND (t.created_at <= :toDate OR :toDate = 0)
        """;

    /**
     * Find task counts grouped by a specific field
     * Used for filter analytics - shows count for each unique value
     * Format parameters: filterParam (display name), column name (3 times for SELECT, GROUP BY, ORDER BY)
     */
    public static final String FIND_TASK_COUNTS_BY_FIELD = """
        SELECT '%s' as filterParam, t.%s as filterId, COUNT(*) as count
        FROM tasks t
        WHERE t.deleted = false
        AND (t.owner_id = :ownerId OR :ownerIdWildcard IS TRUE)
        AND (t.task_type IN (:taskTypes) OR :taskTypesWildcard IS TRUE)
        AND (t.task_status IN (:taskStatuses) OR :taskStatusesWildcard IS TRUE)
        AND (t.priority IN (:priorities) OR :prioritiesWildcard IS TRUE)
        AND (t.stage IN (:stages) OR :stagesWildcard IS TRUE)
        AND (t.active = :active OR :activeWildcard IS TRUE)
        AND (t.application_id IN (:applicationIds) OR :applicationIdsWildcard IS TRUE)
        AND (t.created_at >= :fromDate OR :fromDate = 0)
        AND (t.created_at <= :toDate OR :toDate = 0)
        GROUP BY t.%s
        ORDER BY count DESC
        """;

    /**
     * Find task counts for boolean fields (like active)
     * Used for filter analytics on boolean columns
     */
    public static final String FIND_TASK_COUNTS_BY_BOOLEAN_FIELD = """
        SELECT '%s' as filterParam, t.%s as filterId, COUNT(*) as count
        FROM tasks t
        WHERE t.deleted = false
        AND (t.owner_id = :ownerId OR :ownerIdWildcard IS TRUE)
        AND (t.task_type IN (:taskTypes) OR :taskTypesWildcard IS TRUE)
        AND (t.task_status IN (:taskStatuses) OR :taskStatusesWildcard IS TRUE)
        AND (t.priority IN (:priorities) OR :prioritiesWildcard IS TRUE)
        AND (t.stage IN (:stages) OR :stagesWildcard IS TRUE)
        AND (t.active = :active OR :activeWildcard IS TRUE)
        AND (t.application_id IN (:applicationIds) OR :applicationIdsWildcard IS TRUE)
        AND (t.created_at >= :fromDate OR :fromDate = 0)
        AND (t.created_at <= :toDate OR :toDate = 0)
        AND t.%s IS NOT NULL
        GROUP BY t.%s
        ORDER BY count DESC
        """;

    /**
     * Find task counts grouped by priority (integer field)
     * Used specifically for priority filter analytics
     */
    public static final String FIND_TASK_COUNTS_BY_PRIORITY = """
        SELECT 'priorities' as filterParam, t.priority as filterId, COUNT(*) as count
        FROM tasks t
        WHERE t.deleted = false
        AND (t.owner_id = :ownerId OR :ownerIdWildcard IS TRUE)
        AND (t.task_type IN (:taskTypes) OR :taskTypesWildcard IS TRUE)
        AND (t.task_status IN (:taskStatuses) OR :taskStatusesWildcard IS TRUE)
        AND (t.priority IN (:priorities) OR :prioritiesWildcard IS TRUE)
        AND (t.stage IN (:stages) OR :stagesWildcard IS TRUE)
        AND (t.active = :active OR :activeWildcard IS TRUE)
        AND (t.application_id IN (:applicationIds) OR :applicationIdsWildcard IS TRUE)
        AND (t.created_at >= :fromDate OR :fromDate = 0)
        AND (t.created_at <= :toDate OR :toDate = 0)
        AND t.priority IS NOT NULL
        GROUP BY t.priority
        ORDER BY t.priority ASC
        """;
}
