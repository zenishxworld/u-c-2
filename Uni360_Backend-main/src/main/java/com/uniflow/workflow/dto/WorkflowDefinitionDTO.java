package com.uniflow.workflow.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * WorkflowDefinitionDTO for API responses
 *
 * <p>This DTO represents workflow definition information returned by the workflow service APIs. It
 * includes all relevant workflow definition details for frontend consumption and administration.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowDefinitionDTO {

  private Long id;
  private String definitionKey;
  private String definitionName;
  private String definitionDescription;
  private Integer version;
  private String category;
  private String tenantId;
  private String deploymentId;
  private String resourceName;
  private String diagramResourceName;
  private JsonNode processDefinition;
  private String startFormKey;
  private Boolean hasStartFormKey;
  private Boolean hasGraphicalNotation;
  private Boolean isSuspended;
  private Boolean isActive;
  private List<String> startUserCandidateGroups;
  private List<String> startUserCandidateUsers;
  private Integer revision;
  private JsonNode variables;
  private JsonNode configuration;

  // UniFLow specific fields
  private String clientType;
  private String territoryIdentifier;
  private String workflowType;
  private JsonNode autoAssignmentRules;
  private JsonNode escalationRules;
  private JsonNode notificationRules;
  private JsonNode approvalHierarchy;
  private JsonNode requiredDocuments;
  private Integer slaHours;
  private List<String> tags;

  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime createdAt;

  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime updatedAt;

  private String createdBy;
  private String updatedBy;

  // Additional computed fields for UI
  private String statusDisplay;
  private String typeDisplay;
  private Long activeInstancesCount;
  private Long completedInstancesCount;
  private Double averageCompletionTimeHours;
  private String slaDisplay;
  private Boolean canEdit;
  private Boolean canActivate;
  private Boolean canSuspend;
}
