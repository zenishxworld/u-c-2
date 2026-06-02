package com.uniflow.common.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * Notification related events. Used for sending notifications, updating notification preferences,
 * etc.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class NotificationEvent extends BaseEvent {

  /** The notification ID */
  private Long notificationId;

  /** Recipient user ID */
  private Long recipientId;

  /** Recipient email */
  private String recipientEmail;

  /** The specific action that occurred */
  private EventAction action;

  /** Notification type (EMAIL, SMS, PUSH, etc.) */
  private String notificationType;

  /** Notification template ID */
  private Long templateId;

  /** Notification subject */
  private String subject;

  /** Notification message content */
  private String message;

  /** Notification status (SENT, DELIVERED, FAILED, etc.) */
  private String status;

  /** Delivery channel (email, sms, push) */
  private String channel;

  /** Notification priority level */
  private String notificationPriority;

  /** Scheduled send time */
  private String scheduledAt;

  /** Actual send time */
  private String sentAt;

  /** Delivery confirmation time */
  private String deliveredAt;

  /** Failure reason if applicable */
  private String failureReason;

  /** Template variables used in the notification */
  private Object templateVariables;

  /** Additional notification data */
  private Object notificationData;

  public NotificationEvent(Long recipientId, String recipientEmail, EventAction action) {
    super();
    this.recipientId = recipientId;
    this.recipientEmail = recipientEmail;
    this.action = action;
    this.setEventType("NOTIFICATION_EVENT");
    this.setSourceService("notifications-service");
  }
}
