package com.uniflow.workflow.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * TaskListResponseDTO for paginated task list API responses
 *
 * <p>This DTO represents paginated task list responses with filtering, sorting, and search
 * capabilities for task management interfaces.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskListResponseDTO {

  // Pagination information
  private Long totalElements;
  private Integer totalPages;
  private Integer currentPage;
  private Integer pageSize;
  private Boolean hasNext;
  private Boolean hasPrevious;
  private Boolean isFirst;
  private Boolean isLast;

  // Task data
  private List<TaskDTO> tasks;

  // Filtering and sorting information
  private Map<String, Object> appliedFilters;
  private String sortBy;
  private String sortDirection; // ASC, DESC
  private String searchQuery;

  // Summary statistics for current filter/search
  private Long filteredTotal;
  private Map<String, Long> statusCounts;
  private Map<String, Long> priorityCounts;
  private Map<String, Long> assigneeCounts;

  // Available filter options
  private List<FilterOption> availableStatuses;
  private List<FilterOption> availablePriorities;
  private List<FilterOption> availableAssignees;
  private List<FilterOption> availableTypes;
  private List<FilterOption> availableTerritories;

  // Metadata
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime lastUpdated;

  private String currentUser;
  private List<String> userPermissions;

  // Bulk operation support
  private List<BulkAction> availableBulkActions;
  private Boolean supportsBulkOperations;

  /** Inner class for filter options */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class FilterOption {
    private String value;
    private String label;
    private String description;
    private Long count;
    private Boolean enabled;
    private String icon;
    private String color;
  }

  /** Inner class for bulk actions */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class BulkAction {
    private String actionId;
    private String actionName;
    private String actionType;
    private String description;
    private String icon;
    private Boolean requiresConfirmation;
    private String confirmationMessage;
    private List<String> requiredPermissions;
    private Integer maxItems; // Maximum items this action can handle at once
  }

  // Export capabilities
  private List<ExportOption> exportOptions;

  /** Inner class for export options */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class ExportOption {
    private String format; // CSV, EXCEL, PDF
    private String label;
    private String description;
    private Boolean available;
    private Integer maxRows;
  }

  // Performance metrics
  private Long queryExecutionTimeMs;
  private Boolean fromCache;
  private String cacheKey;

  // Additional context for UI
  private Map<String, Object> uiContext;
  private List<String> warnings;
  private List<String> errors;
}
