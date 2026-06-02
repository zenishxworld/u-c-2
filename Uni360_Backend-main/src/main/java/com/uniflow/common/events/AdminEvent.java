package com.uniflow.common.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * Admin related events. Used for admin actions, user management, system configuration changes, etc.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class AdminEvent extends BaseEvent {

  /** The admin user ID who performed the action */
  private Long adminId;

  /** Email of the admin user */
  private String adminEmail;

  /** The specific action that occurred */
  private EventAction action;

  /** Target entity type (user, application, university, etc.) */
  private String entityType;

  /** Target entity ID */
  private Long entityId;

  /** Target user ID if applicable */
  private Long targetUserId;

  /** Admin role */
  private String adminRole;

  /** Action description */
  private String actionDescription;

  /** Before value for updates */
  private Object beforeValue;

  /** After value for updates */
  private Object afterValue;

  /** IP address from which the action originated */
  private String ipAddress;

  /** User agent string from the request */
  private String userAgent;

  /** Additional admin action data */
  private Object adminData;

  public AdminEvent(Long adminId, String adminEmail, EventAction action) {
    super();
    this.adminId = adminId;
    this.adminEmail = adminEmail;
    this.action = action;
    this.setEventType("ADMIN_EVENT");
    this.setSourceService("admins-service");
  }
}
