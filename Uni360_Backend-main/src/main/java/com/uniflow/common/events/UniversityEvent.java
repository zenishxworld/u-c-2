package com.uniflow.common.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * University related events. Used for university registration, verification, program management,
 * etc.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class UniversityEvent extends BaseEvent {

  /** The university ID involved in the event */
  private Long universityId;

  /** University name */
  private String universityName;

  /** University email contact */
  private String universityEmail;

  /** The specific action that occurred */
  private EventAction action;

  /** Current university status */
  private String universityStatus;

  /** Previous status for update events */
  private String previousStatus;

  /** University type (public, private, etc.) */
  private String universityType;

  /** Country where the university is located */
  private String country;

  /** City where the university is located */
  private String city;

  /** Program ID if the event is program-related */
  private Long programId;

  /** Program name if applicable */
  private String programName;

  /** Verification status */
  private String verificationStatus;

  /** Admin ID who performed the action */
  private Long adminId;

  /** Additional university data */
  private Object universityData;

  public UniversityEvent(Long universityId, String universityName, EventAction action) {
    super();
    this.universityId = universityId;
    this.universityName = universityName;
    this.action = action;
    this.setEventType("UNIVERSITY_EVENT");
    this.setSourceService("universities-service");
  }
}
