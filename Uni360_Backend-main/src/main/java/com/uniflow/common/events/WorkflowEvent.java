package com.uniflow.common.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * Workflow related events. Used for workflow execution, task management, process state changes,
 * etc.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class WorkflowEvent extends BaseEvent {

  /** The workflow definition ID */
  private Long workflowDefinitionId;

  /** The workflow instance ID */
  private Long workflowInstanceId;

  /** The task ID if this is a task-related event */
  private Long taskId;

  /** The specific action that occurred */
  private EventAction action;

  /** Workflow name */
  private String workflowName;

  /** Current workflow status */
  private String workflowStatus;

  /** Previous status for update events */
  private String previousStatus;

  /** Task name if applicable */
  private String taskName;

  /** Task status if applicable */
  private String taskStatus;

  /** Assignee ID for task assignments */
  private Long assigneeId;

  /** Assignee email for task assignments */
  private String assigneeEmail;

  /** Process variables */
  private Object processVariables;

  /** Task variables if applicable */
  private Object taskVariables;

  /** Business key for the workflow */
  private String businessKey;

  /** Entity ID that triggered the workflow */
  private Long entityId;

  /** Entity type that triggered the workflow */
  private String entityType;

  /** Workflow start time */
  private String startedAt;

  /** Workflow completion time */
  private String completedAt;

  /** Task due date if applicable */
  private String dueDate;

  /** Error message if the workflow failed */
  private String errorMessage;

  /** Additional workflow data */
  private Object workflowData;

  public WorkflowEvent(Long workflowInstanceId, String workflowName, EventAction action) {
    super();
    this.workflowInstanceId = workflowInstanceId;
    this.workflowName = workflowName;
    this.action = action;
    this.setEventType("WORKFLOW_EVENT");
    this.setSourceService("workflow-service");
  }
}
