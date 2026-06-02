package com.uniflow.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Task Count DTO for grouped filter operations
 *
 * This DTO represents count information for task filters,
 * used in the /api/v1/admin/tasks/filters endpoint to provide
 * aggregated counts for various filter parameters (taskTypes, taskStatuses, priorities, etc.)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskCountDTO {

    /**
     * The filter parameter name (e.g., "taskTypes", "taskStatuses", "priorities", "stages")
     */
    private String filterParam;

    /**
     * The specific filter value (e.g., "DOCUMENT_REVIEW", "CREATED", 1, "INITIAL_REVIEW")
     */
    private Object filterId;

    /**
     * The count of tasks matching this filter value
     */
    private Long count;
}
