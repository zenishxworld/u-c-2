package com.uniflow.common.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * Authentication and authorization related events. Used for user login, logout, password changes,
 * etc.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class AuthEvent extends BaseEvent {

  /** The user ID involved in the auth event */
  private Long userId;

  /** Username or email of the user */
  private String username;

  /** The specific action that occurred */
  private EventAction action;

  /** IP address from which the action originated */
  private String ipAddress;

  /** User agent string from the request */
  private String userAgent;

  /** Session ID if applicable */
  private String sessionId;

  /** Success/failure status */
  private boolean success;

  /** Failure reason if applicable */
  private String failureReason;

  /** Role of the user */
  private String userRole;

  public AuthEvent(Long userId, String username, EventAction action) {
    super();
    this.userId = userId;
    this.username = username;
    this.action = action;
    this.setEventType("AUTH_EVENT");
    this.setSourceService("auth-service");
  }
}
