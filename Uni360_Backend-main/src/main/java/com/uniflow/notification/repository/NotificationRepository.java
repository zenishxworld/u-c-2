package com.uniflow.notification.repository;

import com.uniflow.notification.model.Notification;
import com.uniflow.notification.model.NotificationType;
import com.uniflow.notification.model.NotificationStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Reactive repository for notification management with advanced query capabilities.
 * Follows reactive patterns with R2DBC for non-blocking database operations.
 */
@Repository
public interface NotificationRepository extends R2dbcRepository<Notification, UUID> {

    /**
     * Find all notifications for a specific user with pagination
     */
    @Query("SELECT * FROM notifications WHERE user_id = :userId ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Notification> findByUserIdOrderByCreatedAtDesc(
        @Param("userId") Long userId,
        @Param("limit") Long limit,
        @Param("offset") Long offset
    );

    /**
     * Find unread notifications for a user
     */
    @Query("SELECT * FROM notifications WHERE user_id = :userId AND status = 'UNREAD' ORDER BY created_at DESC")
    Flux<Notification> findUnreadByUserId(@Param("userId") Long userId);

    /**
     * Count unread notifications for a user
     */
    @Query("SELECT COUNT(*) FROM notifications WHERE user_id = :userId AND status = 'UNREAD'")
    Mono<Long> countUnreadByUserId(@Param("userId") Long userId);

    /**
     * Find notifications by type for analytics
     */
    @Query("SELECT * FROM notifications WHERE type = :type ORDER BY created_at DESC")
    Flux<Notification> findByType(@Param("type") String type);

    /**
     * Count notifications by type
     */
    @Query("SELECT COUNT(*) FROM notifications WHERE type = :type")
    Mono<Long> countByType(@Param("type") String type);

    /**
     * Count notifications by sender
     */
    @Query("SELECT COUNT(*) FROM notifications WHERE sender_id = :senderId")
    Mono<Long> countBySenderId(@Param("senderId") Long senderId);

    /**
     * Mark all notifications as read for a user
     */
    @Modifying
    @Query("UPDATE notifications SET status = 'READ', read_at = :readAt WHERE user_id = :userId AND status = 'UNREAD'")
    Mono<Integer> markAllAsReadForUser(@Param("userId") Long userId, @Param("readAt") LocalDateTime readAt);

    /**
     * Find notifications sent by a specific sender
     */
    @Query("SELECT * FROM notifications WHERE sender_id = :senderId ORDER BY created_at DESC")
    Flux<Notification> findBySenderIdOrderByCreatedAtDesc(@Param("senderId") Long senderId);

    /**
     * Find notifications sent by a specific sender with pagination
     */
    @Query("SELECT * FROM notifications WHERE sender_id = :senderId ORDER BY created_at DESC LIMIT :limit OFFSET :offset")
    Flux<Notification> findBySenderIdOrderByCreatedAtDescWithPagination(
        @Param("senderId") Long senderId,
        @Param("limit") Long limit,
        @Param("offset") Long offset
    );

    /**
     * Find notifications created within a date range
     */
    @Query("SELECT * FROM notifications WHERE created_at BETWEEN :startDate AND :endDate ORDER BY created_at DESC")
    Flux<Notification> findByCreatedAtBetween(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Find notifications by user and status
     */
    @Query("SELECT * FROM notifications WHERE user_id = :userId AND status = :status ORDER BY created_at DESC")
    Flux<Notification> findByUserIdAndStatus(
        @Param("userId") Long userId,
        @Param("status") String status
    );

    /**
     * Delete old notifications (for cleanup)
     */
    @Modifying
    @Query("DELETE FROM notifications WHERE created_at < :cutoffDate")
    Mono<Integer> deleteOldNotifications(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Find actionable notifications (those with action URLs)
     */
    @Query("SELECT * FROM notifications WHERE user_id = :userId AND action_url IS NOT NULL AND action_url != '' ORDER BY created_at DESC")
    Flux<Notification> findActionableByUserId(@Param("userId") Long userId);
}
