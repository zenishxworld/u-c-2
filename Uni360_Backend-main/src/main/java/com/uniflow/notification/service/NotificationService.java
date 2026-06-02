package com.uniflow.notification.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.auth.repository.UserRepository;
import com.uniflow.notification.dto.BroadcastRequest;
import com.uniflow.notification.dto.NotificationRequest;
import com.uniflow.notification.exception.ForbiddenException;
import com.uniflow.notification.exception.NotificationNotFoundException;
import com.uniflow.notification.exception.UnauthorizedException;
import com.uniflow.notification.model.Notification;
import com.uniflow.notification.model.NotificationStatus;
import com.uniflow.notification.model.NotificationType;
import com.uniflow.notification.repository.NotificationRepository;
import com.uniflow.notification.websocket.NotificationWebSocketHandler;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Enterprise notification service with reactive composition patterns.
 * Handles notification creation, delivery, and real-time WebSocket broadcasting.
 */
@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;

    public NotificationService(
        NotificationRepository notificationRepository,
        UserRepository userRepository,
        NotificationWebSocketHandler webSocketHandler,
        ObjectMapper objectMapper
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.webSocketHandler = webSocketHandler;
        this.objectMapper = objectMapper;
    }

    /**
     * Send a notification to a single recipient
     */
    public Mono<Notification> sendNotification(
        NotificationRequest request,
        Long senderId
    ) {
        return validateNotificationRequest(request)
            .then(verifyRecipientExists(request.getRecipientId()))
            .then(createNotification(request, senderId))
            .flatMap(notificationRepository::save)
            .doOnSuccess(this::sendRealTimeNotification);
    }

    /**
     * Send broadcast notification to multiple recipients
     */
    public Flux<Notification> sendBroadcast(
        BroadcastRequest request,
        Long senderId
    ) {
        return validateBroadcastRequest(request).thenMany(
            Flux.fromIterable(request.getRecipientIds()).flatMap(recipientId ->
                verifyRecipientExists(recipientId)
                    .then(
                        createBroadcastNotification(
                            request,
                            senderId,
                            recipientId
                        )
                    )
                    .flatMap(notificationRepository::save)
                    .doOnSuccess(this::sendRealTimeNotification)
            )
        );
    }

    /**
     * Get notifications for a user with pagination
     */
    public Flux<Notification> getUserNotifications(
        Long userId,
        int page,
        int size
    ) {
        long offset = (long) page * size;
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(
            userId,
            (long) size,
            offset
        );
    }

    /**
     * Get notifications sent by an admin with pagination
     */
    public Flux<Notification> getSentNotifications(
        Long senderId,
        int page,
        int size
    ) {
        long offset = (long) page * size;
        return notificationRepository.findBySenderIdOrderByCreatedAtDescWithPagination(
            senderId,
            (long) size,
            offset
        );
    }

    /**
     * Get a specific notification by ID
     */
    public Mono<Notification> getNotification(
        UUID notificationId,
        Long userId
    ) {
        return notificationRepository
            .findById(notificationId)
            .filter(notification -> notification.belongsToUser(userId))
            .switchIfEmpty(
                Mono.error(
                    new NotificationNotFoundException("Notification not found")
                )
            );
    }

    /**
     * Mark a notification as read
     */
    public Mono<Notification> markAsRead(UUID notificationId, Long userId) {
        return notificationRepository
            .findById(notificationId)
            .filter(notification -> notification.belongsToUser(userId))
            .switchIfEmpty(
                Mono.error(
                    new NotificationNotFoundException("Notification not found")
                )
            )
            .map(Notification::markAsRead)
            .flatMap(notificationRepository::save);
    }

    /**
     * Get unread notification count for a user
     */
    public Mono<Long> getUnreadCount(Long userId) {
        return notificationRepository.countUnreadByUserId(userId);
    }

    // Private helper methods

    private Mono<Void> validateNotificationRequest(
        NotificationRequest request
    ) {
        if (!request.isValidRequest()) {
            return Mono.error(
                new IllegalArgumentException("Invalid notification request")
            );
        }
        return Mono.empty();
    }

    private Mono<Void> validateBroadcastRequest(BroadcastRequest request) {
        if (!request.isValidRequest()) {
            return Mono.error(
                new IllegalArgumentException("Invalid broadcast request")
            );
        }
        return Mono.empty();
    }

    private Mono<Void> verifyRecipientExists(Long userId) {
        return userRepository
            .existsById(userId)
            .filter(exists -> exists)
            .switchIfEmpty(
                Mono.error(new IllegalArgumentException("Recipient not found"))
            )
            .then();
    }

    private Mono<Notification> createNotification(
        NotificationRequest request,
        Long senderId
    ) {
        Notification notification = Notification.NotificationBuilder.forUser(
            request.getRecipientId()
        )
            .fromSender(senderId)
            .withType(request.getType())
            .withTitle(request.getTitle())
            .withMessage(request.getMessage())
            .withContentType(
                request.getContentType() != null
                    ? request.getContentType()
                    : com.uniflow.notification.model.ContentType.PLAIN
            )
            .withActionUrl(request.getActionUrl())
            .withMetadata(
                request.getMetadata() != null
                    ? request.getMetadata()
                    : objectMapper.createObjectNode()
            )
            .build();

        return Mono.just(notification);
    }

    private Mono<Notification> createBroadcastNotification(
        BroadcastRequest request,
        Long senderId,
        Long recipientId
    ) {
        Notification notification = Notification.NotificationBuilder.forUser(
            recipientId
        )
            .fromSender(senderId)
            .withType(request.getType())
            .withTitle(request.getTitle())
            .withMessage(request.getMessage())
            .withContentType(
                request.getContentType() != null
                    ? request.getContentType()
                    : com.uniflow.notification.model.ContentType.PLAIN
            )
            .withActionUrl(request.getActionUrl())
            .withMetadata(
                request.getMetadata() != null
                    ? request.getMetadata()
                    : objectMapper.createObjectNode()
            )
            .build();

        return Mono.just(notification);
    }

    private void sendRealTimeNotification(Notification notification) {
        // Delegate to WebSocket handler for real-time delivery
        webSocketHandler
            .sendNotificationToUser(notification.getUserId(), notification)
            .subscribe(
                success -> {}, // Success handler (empty for now)
                error ->
                    System.err.println(
                        "Failed to send real-time notification: " +
                            error.getMessage()
                    )
            );
    }

    /**
     * Get unread notifications for a user
     */
    public Flux<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findUnreadByUserId(userId);
    }

    /**
     * Mark all notifications as read for a user
     */
    public Mono<Integer> markAllAsRead(Long userId) {
        return notificationRepository.markAllAsReadForUser(
            userId,
            LocalDateTime.now()
        );
    }

    /**
     * Get actionable notifications (those with action URLs)
     */
    public Flux<Notification> getActionableNotifications(Long userId) {
        return notificationRepository.findActionableByUserId(userId);
    }

    /**
     * Get notifications by type for analytics
     */
    public Flux<Notification> getNotificationsByType(NotificationType type) {
        return notificationRepository.findByType(type.name());
    }

    /**
     * Count notifications by type
     */
    public Mono<Long> countNotificationsByType(NotificationType type) {
        return notificationRepository.countByType(type.name());
    }

    /**
     * Count notifications sent by a sender
     */
    public Mono<Long> countNotificationsBySender(Long senderId) {
        return notificationRepository.countBySenderId(senderId);
    }
}
