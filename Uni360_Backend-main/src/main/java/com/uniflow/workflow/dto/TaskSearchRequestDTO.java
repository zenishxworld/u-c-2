package com.uniflow.workflow.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * TaskSearchRequestDTO for task search API requests
 *
 * <p>This DTO represents the request payload for searching and filtering tasks in the workflow
 * system. It supports complex queries, pagination, sorting, and various filter criteria.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskSearchRequestDTO {

  // Basic search
  private String searchQuery;
  private String searchType; // SIMPLE, ADVANCED, FUZZY

  // Pagination
  @Min(value = 0, message = "Page number must be non-negative")
  @Builder.Default
  private Integer page = 0;

  @Min(value = 1, message = "Page size must be at least 1")
  @Max(value = 1000, message = "Page size cannot exceed 1000")
  @Builder.Default
  private Integer size = 20;

  // Sorting
  private String sortBy; // taskName, createdAt, dueDate, priority, status, assignee
  @Builder.Default private String sortDirection = "DESC"; // ASC, DESC
  private List<SortCriteria> multipleSorts;

  // Task filters
  private List<String> taskIds;
  private List<String> applicationIds;
  private List<String> workflowDefinitionKeys;
  private List<String> taskDefinitionKeys;
  private List<String> taskStatuses;
  private List<String> assignees;
  private List<String> assigneeTypes;
  private List<String> owners;
  private List<String> categories;
  private List<Integer> priorities;

  // Date range filters
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime createdAfter;

  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime createdBefore;

  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime dueAfter;

  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime dueBefore;

  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime completedAfter;

  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime completedBefore;

  // Boolean filters
  private Boolean suspended;
  private Boolean fastTracked;
  private Boolean isRead;
  private Boolean isBookmarked;
  private Boolean overdue;
  private Boolean deleted;

  // UniFLow specific filters
  private List<String> territoryIdentifiers;
  private List<String> clientTypes;
  private List<String> tags;

  // Advanced filters
  private String taskNamePattern; // For regex matching
  private String descriptionPattern;
  private String notesPattern;

  // Variable filters (search in task variables)
  private Map<String, Object> variableEquals;
  private Map<String, Object> variableContains;
  private Map<String, List<Object>> variableIn;

  // Duration filters
  private Integer minEstimatedDurationMinutes;
  private Integer maxEstimatedDurationMinutes;
  private Integer minActualDurationMinutes;
  private Integer maxActualDurationMinutes;

  // Candidate filters
  private List<String> candidateUsers;
  private List<String> candidateGroups;
  private Boolean unassigned; // Tasks with no assignee
  private Boolean availableToUser; // Tasks available to current user

  // Workflow instance filters
  private List<String> processInstanceIds;
  private List<String> executionIds;
  private List<String> businessKeys;

  // SLA and escalation filters
  private Boolean slaBreached;
  private Boolean escalated;
  private Integer minEscalationLevel;
  private Integer maxEscalationLevel;

  // Parent-child relationship filters
  private List<String> parentTaskIds;
  private Boolean hasSubTasks;
  private Boolean isSubTask;

  // Inclusion/exclusion options
  private Boolean includeVariables;
  private Boolean includeTaskLocalVariables;
  private Boolean includeFormData;
  private Boolean includeComments;
  private Boolean includeAttachments;

  // Security and permissions
  private String userId; // For permission-based filtering
  private List<String> userRoles;
  private List<String> userGroups;
  private Boolean onlyAssignedToUser;
  private Boolean onlyCreatedByUser;

  // Analytics and reporting
  private Boolean includeMetrics;
  private Boolean includeTrends;
  private String groupBy; // For grouping results
  private List<String> aggregations; // COUNT, AVG, SUM, MIN, MAX

  // Export options
  private String exportFormat; // JSON, CSV, EXCEL, PDF
  private Boolean exportAll; // Export all results, ignore pagination

  // Cache control
  private Boolean useCache;
  private Integer cacheTimeoutSeconds;

  // Debug and performance
  private Boolean includeDebugInfo;
  private Boolean explainQuery;

  /** Inner class for multiple sort criteria */
  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  @Builder
  public static class SortCriteria {
    private String field;
    private String direction; // ASC, DESC
    private Integer priority; // Sort order priority
  }

  // Saved search support
  private String savedSearchId;
  private String savedSearchName;
  private Boolean saveSearch;

  // Quick filters (predefined common searches)
  private String quickFilter; // MY_TASKS, OVERDUE, HIGH_PRIORITY, UNASSIGNED, etc.

  // Custom query support
  private String customQuery;
  private Map<String, Object> customParameters;

  // Validation method
  public boolean isValidRequest() {
    if (page != null && page < 0) return false;
    if (size != null && (size < 1 || size > 1000)) return false;
    if (createdAfter != null && createdBefore != null && createdAfter.isAfter(createdBefore))
      return false;
    if (dueAfter != null && dueBefore != null && dueAfter.isAfter(dueBefore)) return false;
    if (completedAfter != null
        && completedBefore != null
        && completedAfter.isAfter(completedBefore)) return false;
    return true;
  }
}
