package com.uniflow.common.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/** Application related events. Used for application submission, status changes, reviews, etc. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class ApplicationEvent extends BaseEvent {

  /** The application ID involved in the event */
  private Long applicationId;

  /** Student ID who owns the application */
  private Long studentId;

  /** University ID where the application was submitted */
  private Long universityId;

  /** Program ID for the application */
  private Long programId;

  /** The specific action that occurred */
  private EventAction action;

  /** Current application status */
  private String applicationStatus;

  /** Previous status for update events */
  private String previousStatus;

  /** Application type */
  private String applicationType;

  /** Academic year */
  private String academicYear;

  /** Application deadline */
  private String deadline;

  /** Reviewer ID if applicable */
  private Long reviewerId;

  /** Review notes or comments */
  private String reviewNotes;

  /** Application data */
  private Object applicationData;

  public ApplicationEvent(Long applicationId, Long studentId, EventAction action) {
    super();
    this.applicationId = applicationId;
    this.studentId = studentId;
    this.action = action;
    this.setEventType("APPLICATION_EVENT");
    this.setSourceService("applications-service");
  }
}
