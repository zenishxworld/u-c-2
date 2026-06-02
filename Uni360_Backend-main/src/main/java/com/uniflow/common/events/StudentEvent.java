package com.uniflow.common.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/** Student related events. Used for student profile changes, verification status updates, etc. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class StudentEvent extends BaseEvent {

  /** The student ID involved in the event */
  private Long studentId;

  /** Email of the student */
  private String email;

  /** The specific action that occurred */
  private EventAction action;

  /** Student's current verification status */
  private String verificationStatus;

  /** Student's education level */
  private String educationLevel;

  /** University ID if applicable */
  private Long universityId;

  /** Additional student data */
  private Object studentData;

  /** Previous status for update events */
  private String previousStatus;

  public StudentEvent(Long studentId, String email, EventAction action) {
    super();
    this.studentId = studentId;
    this.email = email;
    this.action = action;
    this.setEventType("STUDENT_EVENT");
    this.setSourceService("students-service");
  }
}
