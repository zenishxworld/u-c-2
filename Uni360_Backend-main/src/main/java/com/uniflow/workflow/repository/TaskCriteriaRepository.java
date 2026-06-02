package com.uniflow.workflow.repository;

import com.uniflow.auth.util.CommonHelperUtils;
import com.uniflow.workflow.dto.TaskCountDTO;
import com.uniflow.workflow.entity.Task;
import com.uniflow.workflow.repository.query.TaskQueries;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.r2dbc.core.FetchSpec;
import org.springframework.stereotype.Repository;
import org.springframework.web.reactive.function.server.ServerRequest;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Task Criteria Repository for dynamic task filtering operations
 *
 * This repository provides reactive data access methods for complex task queries
 * with dynamic filtering capabilities using R2DBC DatabaseClient.
 *
 * Features:
 * - Dynamic filter parameter binding with wildcard support
 * - Group by operations for filter analytics
 * - Pagination support
 * - User context-based filtering
 */
@Slf4j
@Repository
@RequiredArgsConstructor
public class TaskCriteriaRepository {

    private final DatabaseClient databaseClient;
    private final CommonHelperUtils commonHelperUtils;

    /**
     * Find tasks with comprehensive filters and pagination
     *
     * @param request ServerRequest containing query parameters and user context
     * @return Flux of Task entities matching the filters
     */
    public Flux<Task> findTasksWithFilters(ServerRequest request) {
        return extractTaskFilterParameters(request)
            .flatMapMany(params -> {
                String sortOrder = (String) params.getOrDefault(
                    "sortOrder",
                    "DESC"
                );
                String sqlQuery = TaskQueries.FIND_TASKS_WITH_FILTERS.formatted(
                    sortOrder
                );
                return executeQueryWithBindings(sqlQuery, params).all();
            })
            .map(this::mapRowToTask);
    }

    /**
     * Get total count of tasks matching filters
     *
     * @param request ServerRequest containing query parameters
     * @return Mono containing the total count
     */
    public Mono<Long> getTotalCountWithFilters(ServerRequest request) {
        return extractTaskFilterParameters(request)
            .flatMap(params ->
                executeQueryWithBindings(
                    TaskQueries.GET_TASK_COUNT_WITH_FILTERS,
                    params
                ).one()
            )
            .map(result -> ((Number) result.get("count")).longValue());
    }

    /**
     * Find task counts grouped by specified fields for filter analytics
     *
     * @param request ServerRequest containing user context
     * @param groupByParams List of field names to group by (e.g., "task_type", "task_status")
     * @return Flux of TaskCountDTO with filter analytics
     */
    public Flux<TaskCountDTO> findTaskCountsByFields(
        ServerRequest request,
        List<String> groupByParams
    ) {
        return extractTaskFilterParameters(request).flatMapMany(params ->
            Flux.fromIterable(groupByParams)
                .flatMap(groupBy -> {
                    String sqlQuery;
                    String displayName = convertColumnToDisplayName(groupBy);

                    if ("priority".equals(groupBy)) {
                        sqlQuery = TaskQueries.FIND_TASK_COUNTS_BY_PRIORITY;
                    } else if ("active".equals(groupBy)) {
                        sqlQuery =
                            TaskQueries.FIND_TASK_COUNTS_BY_BOOLEAN_FIELD.formatted(
                                displayName,
                                groupBy,
                                groupBy,
                                groupBy
                            );
                    } else {
                        sqlQuery =
                            TaskQueries.FIND_TASK_COUNTS_BY_FIELD.formatted(
                                displayName,
                                groupBy,
                                groupBy
                            );
                    }

                    return executeQueryWithBindings(sqlQuery, params).all();
                })
                .map(this::mapRowToTaskCount)
                .filter(taskCount -> taskCount.getFilterId() != null)
                .filter(taskCount -> taskCount.getCount() > 0)
        );
    }

    /**
     * Extract and normalize task filter parameters from ServerRequest
     * FULLY REACTIVE - NO BLOCKING CALLS
     *
     * @param request ServerRequest containing query parameters
     * @return Mono of Map with normalized parameters ready for SQL binding
     */
    private Mono<Map<String, Object>> extractTaskFilterParameters(
        ServerRequest request
    ) {
        // Extract query parameters (all synchronous, non-blocking)
        int size = Integer.parseInt(request.queryParam("size").orElse("200"));
        int page = Integer.parseInt(request.queryParam("page").orElse("0"));
        int offset = page * size;

        String taskTypes = request.queryParam("taskTypes").orElse("");
        String taskStatuses = request.queryParam("taskStatuses").orElse("");
        String priorities = request.queryParam("priorities").orElse("");
        String stages = request.queryParam("stages").orElse("");
        String applicationIds = request.queryParam("applicationIds").orElse("");
        String active = request.queryParam("active").orElse("");
        String fromDate = request.queryParam("fromDate").orElse("0");
        String toDate = request.queryParam("toDate").orElse("0");
        String sortOrder = request.queryParam("sortOrder").orElse("DESC");
        String ownerIdFilter = request.queryParam("ownerId").orElse("");

        // Parse to lists
        List<String> taskTypesList = parseCommaSeparatedList(taskTypes);
        List<String> taskStatusesList = parseCommaSeparatedList(taskStatuses);
        List<Integer> prioritiesList = parseCommaSeparatedIntList(priorities);
        List<String> stagesList = parseCommaSeparatedList(stages);
        List<String> applicationIdsList = parseCommaSeparatedList(
            applicationIds
        );

        // Active flag
        boolean activeValue = active.isEmpty()
            ? true
            : Boolean.parseBoolean(active);
        boolean activeWildcard = active.isEmpty();

        // Date filters
        long fromDateLong = Long.parseLong(fromDate);
        long toDateLong = Long.parseLong(toDate);

        // Get user context reactively and build parameters map
        return commonHelperUtils
            .getUserFromServerRequest(request)
            .map(userContext -> {
                Map<String, Object> parameters = new HashMap<>();

                Long userId = userContext.getUserId();

                // Determine ownerId - use from filter or default to authenticated user
                Long ownerId = ownerIdFilter.isEmpty()
                    ? userId
                    : Long.parseLong(ownerIdFilter);
                // For filters, always filter by owner - no wildcard unless explicitly passed
                boolean ownerIdWildcard = false;

                // Populate parameters map
                parameters.put("userId", userId);
                parameters.put("ownerId", ownerId);
                parameters.put("ownerIdWildcard", ownerIdWildcard);
                parameters.put("size", size);
                parameters.put("offset", offset);
                parameters.put(
                    "taskTypes",
                    taskTypesList.isEmpty()
                        ? Collections.singletonList("")
                        : taskTypesList
                );
                parameters.put("taskTypesWildcard", taskTypes.isEmpty());
                parameters.put(
                    "taskStatuses",
                    taskStatusesList.isEmpty()
                        ? Collections.singletonList("")
                        : taskStatusesList
                );
                parameters.put("taskStatusesWildcard", taskStatuses.isEmpty());
                parameters.put(
                    "priorities",
                    prioritiesList.isEmpty()
                        ? Collections.singletonList(0)
                        : prioritiesList
                );
                parameters.put("prioritiesWildcard", priorities.isEmpty());
                parameters.put(
                    "stages",
                    stagesList.isEmpty()
                        ? Collections.singletonList("")
                        : stagesList
                );
                parameters.put("stagesWildcard", stages.isEmpty());
                parameters.put(
                    "applicationIds",
                    applicationIdsList.isEmpty()
                        ? Collections.singletonList("")
                        : applicationIdsList
                );
                parameters.put(
                    "applicationIdsWildcard",
                    applicationIds.isEmpty()
                );
                parameters.put("active", activeValue);
                parameters.put("activeWildcard", activeWildcard);
                parameters.put("fromDate", fromDateLong);
                parameters.put("toDate", toDateLong);
                parameters.put("sortOrder", sortOrder);

                log.debug(
                    "Extracted task filter parameters: {}",
                    CommonHelperUtils.prettyPrintJson(parameters)
                );
                return parameters;
            });
    }

    /**
     * Execute SQL query with dynamic parameter binding
     *
     * @param sqlQuery SQL query string with named parameters
     * @param parameters Map of parameter values
     * @return FetchSpec for executing the query
     */
    private FetchSpec<Map<String, Object>> executeQueryWithBindings(
        String sqlQuery,
        Map<String, Object> parameters
    ) {
        // Extract parameter names from SQL query
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
                executeSpec = executeSpec.bind(
                    parameterName,
                    parameters.get(parameterName)
                );
            }
        }

        log.trace("Executing query: {}", sqlQuery);
        return executeSpec.fetch();
    }

    /**
     * Map database row to Task entity
     *
     * @param row Database row as Map
     * @return Task entity
     */
    private Task mapRowToTask(Map<String, Object> row) {
        return Task.builder()
            .id(
                row.get("id") != null
                    ? ((Number) row.get("id")).longValue()
                    : null
            )
            .taskId((String) row.get("task_id"))
            .applicationId((String) row.get("application_id"))
            .workflowInstanceId((String) row.get("workflow_instance_id"))
            .taskType((String) row.get("task_type"))
            .taskStatus((String) row.get("task_status"))
            .priority(
                row.get("priority") != null
                    ? ((Number) row.get("priority")).intValue()
                    : 3
            )
            .dueDate(
                row.get("due_date") != null
                    ? ((Number) row.get("due_date")).longValue()
                    : null
            )
            .ownerId(
                row.get("owner_id") != null
                    ? ((Number) row.get("owner_id")).longValue()
                    : null
            )
            .stage((String) row.get("stage"))
            .validationRule((String) row.get("validation_rule"))
            .active(
                row.get("active") != null ? (Boolean) row.get("active") : true
            )
            .claimedBy(
                row.get("claimed_by") != null
                    ? ((Number) row.get("claimed_by")).longValue()
                    : null
            )
            .claimedAt(
                row.get("claimed_at") != null
                    ? ((Number) row.get("claimed_at")).longValue()
                    : null
            )
            .completedAt(
                row.get("completed_at") != null
                    ? ((Number) row.get("completed_at")).longValue()
                    : null
            )
            .createdAt(
                row.get("created_at") != null
                    ? ((Number) row.get("created_at")).longValue()
                    : System.currentTimeMillis()
            )
            .updatedAt(
                row.get("updated_at") != null
                    ? ((Number) row.get("updated_at")).longValue()
                    : System.currentTimeMillis()
            )
            .deleted(
                row.get("deleted") != null
                    ? (Boolean) row.get("deleted")
                    : false
            )
            .build();
    }

    /**
     * Map database row to TaskCountDTO
     *
     * @param row Database row as Map
     * @return TaskCountDTO
     */
    private TaskCountDTO mapRowToTaskCount(Map<String, Object> row) {
        TaskCountDTO taskCount = new TaskCountDTO();
        taskCount.setFilterParam((String) row.get("filterParam"));
        taskCount.setFilterId(row.get("filterId"));
        taskCount.setCount(((Number) row.get("count")).longValue());
        return taskCount;
    }

    /**
     * Parse comma-separated string to list
     *
     * @param value Comma-separated string
     * @return List of strings
     */
    private List<String> parseCommaSeparatedList(String value) {
        if (value == null || value.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.stream(value.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();
    }

    /**
     * Parse comma-separated string to list of integers
     *
     * @param value Comma-separated string
     * @return List of integers
     */
    private List<Integer> parseCommaSeparatedIntList(String value) {
        if (value == null || value.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return Arrays.stream(value.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .map(Integer::parseInt)
            .toList();
    }

    /**
     * Convert database column name to display name for filters
     *
     * @param columnName Database column name (e.g., "task_type")
     * @return Display name (e.g., "taskTypes")
     */
    private String convertColumnToDisplayName(String columnName) {
        Map<String, String> columnToDisplayMap = Map.of(
            "task_type",
            "taskTypes",
            "task_status",
            "taskStatuses",
            "priority",
            "priorities",
            "stage",
            "stages",
            "owner_id",
            "ownerIds",
            "active",
            "active"
        );
        return columnToDisplayMap.getOrDefault(columnName, columnName);
    }
}
