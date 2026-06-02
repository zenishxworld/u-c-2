package com.uniflow.admin.repository;

import com.uniflow.admin.entity.AdminPermissionAudit;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * AdminPermissionAuditRepository - Repository for AdminPermissionAudit entity
 *
 * <p>Provides database access methods for admin permission audit trail management
 * with optimized queries for security monitoring and compliance reporting.
 *
 * <p>Features:
 * - Audit trail tracking for all permission changes
 * - Security monitoring and compliance reporting
 * - High-risk permission change detection
 * - Time-based filtering for audit reviews
 * - Admin-specific audit history
 */
@Repository
public interface AdminPermissionAuditRepository
    extends R2dbcRepository<AdminPermissionAudit, UUID> {

    // Basic Audit Queries
    @Query(
        "SELECT * FROM admin_permission_audit WHERE admin_id = :adminId ORDER BY created_at DESC"
    )
    Flux<AdminPermissionAudit> findByAdminId(@Param("adminId") UUID adminId);

    @Query(
        "SELECT * FROM admin_permission_audit WHERE admin_username = :username ORDER BY created_at DESC"
    )
    Flux<AdminPermissionAudit> findByAdminUsername(@Param("username") String username);

    @Query(
        "SELECT * FROM admin_permission_audit WHERE changed_by = :changedBy ORDER BY created_at DESC"
    )
    Flux<AdminPermissionAudit> findByChangedBy(@Param("changedBy") UUID changedBy);

    // Permission-specific Queries
    @Query(
        "SELECT * FROM admin_permission_audit WHERE permission_key = :permissionKey ORDER BY created_at DESC"
    )
    Flux<AdminPermissionAudit> findByPermissionKey(@Param("permissionKey") String permissionKey);

    @Query(
        "SELECT * FROM admin_permission_audit WHERE admin_id = :adminId AND permission_key = :permissionKey ORDER BY created_at DESC"
    )
    Flux<AdminPermissionAudit> findByAdminIdAndPermissionKey(
        @Param("adminId") UUID adminId,
        @Param("permissionKey") String permissionKey
    );

    // Action-based Queries
    @Query(
        "SELECT * FROM admin_permission_audit WHERE action = :action ORDER BY created_at DESC"
    )
    Flux<AdminPermissionAudit> findByAction(@Param("action") String action);

    @Query(
        "SELECT * FROM admin_permission_audit WHERE admin_id = :adminId AND action = :action ORDER BY created_at DESC"
    )
    Flux<AdminPermissionAudit> findByAdminIdAndAction(
        @Param("adminId") UUID adminId,
        @Param("action") String action
    );

    // Time-based Queries
    @Query(
        "SELECT * FROM admin_permission_audit WHERE created_at >= :startDate ORDER BY created_at DESC"
    )
    Flux<AdminPermissionAudit> findByCreatedAtAfter(@Param("startDate") LocalDateTime startDate);

    @Query(
        "SELECT * FROM admin_permission_audit WHERE created_at BETWEEN :startDate AND :endDate ORDER BY created_at DESC"
    )
    Flux<AdminPermissionAudit> findByCreatedAtBetween(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    @Query(
        "SELECT * FROM admin_permission_audit WHERE admin_id = :adminId AND created_at >= :startDate ORDER BY created_at DESC"
    )
    Flux<AdminPermissionAudit> findByAdminIdAndCreatedAtAfter(
        @Param("adminId") UUID adminId,
        @Param("startDate") LocalDateTime startDate
    );

    // High-Risk Permission Queries
    @Query(
        "SELECT * FROM admin_permission_audit WHERE permission_key IN (:riskPermissions) ORDER BY created_at DESC"
    )
    Flux<AdminPermissionAudit> findHighRiskPermissionChanges(
        @Param("riskPermissions") java.util.List<String> riskPermissions
    );

    @Query(
        "SELECT * FROM admin_permission_audit WHERE permission_key IN ('can_refund_payments', 'can_manage_permissions', 'can_impersonate_users', 'can_manage_system_settings') ORDER BY created_at DESC"
    )
    Flux<AdminPermissionAudit> findCriticalPermissionChanges();

    // IP Address and Security Queries
    @Query(
        "SELECT * FROM admin_permission_audit WHERE ip_address = :ipAddress ORDER BY created_at DESC"
    )
    Flux<AdminPermissionAudit> findByIpAddress(@Param("ipAddress") String ipAddress);

    @Query(
        "SELECT DISTINCT ip_address FROM admin_permission_audit WHERE admin_id = :adminId"
    )
    Flux<String> findDistinctIpAddressesByAdminId(@Param("adminId") UUID adminId);

    @Query(
        "SELECT * FROM admin_permission_audit WHERE changed_by = :changedBy AND created_at >= :startDate ORDER BY created_at DESC"
    )
    Flux<AdminPermissionAudit> findRecentChangesByChanger(
        @Param("changedBy") UUID changedBy,
        @Param("startDate") LocalDateTime startDate
    );

    // Statistics and Analytics
    @Query(
        "SELECT COUNT(*) FROM admin_permission_audit WHERE admin_id = :adminId"
    )
    Mono<Long> countByAdminId(@Param("adminId") UUID adminId);

    @Query(
        "SELECT COUNT(*) FROM admin_permission_audit WHERE permission_key = :permissionKey"
    )
    Mono<Long> countByPermissionKey(@Param("permissionKey") String permissionKey);

    @Query(
        "SELECT COUNT(*) FROM admin_permission_audit WHERE action = :action"
    )
    Mono<Long> countByAction(@Param("action") String action);

    @Query(
        "SELECT COUNT(*) FROM admin_permission_audit WHERE created_at >= :startDate"
    )
    Mono<Long> countByCreatedAtAfter(@Param("startDate") LocalDateTime startDate);

    @Query(
        "SELECT COUNT(*) FROM admin_permission_audit WHERE changed_by = :changedBy"
    )
    Mono<Long> countByChangedBy(@Param("changedBy") UUID changedBy);

    // Distribution Queries for Reporting
    @Query(
        "SELECT action, COUNT(*) as count FROM admin_permission_audit WHERE created_at >= :startDate GROUP BY action"
    )
    Flux<Object[]> getActionDistributionSince(@Param("startDate") LocalDateTime startDate);

    @Query(
        "SELECT permission_key, COUNT(*) as count FROM admin_permission_audit WHERE created_at >= :startDate GROUP BY permission_key ORDER BY count DESC"
    )
    Flux<Object[]> getPermissionChangeFrequency(@Param("startDate") LocalDateTime startDate);

    @Query(
        "SELECT admin_username, COUNT(*) as count FROM admin_permission_audit WHERE created_at >= :startDate GROUP BY admin_username ORDER BY count DESC"
    )
    Flux<Object[]> getAdminChangeFrequency(@Param("startDate") LocalDateTime startDate);

    @Query(
        "SELECT changed_by, COUNT(*) as count FROM admin_permission_audit WHERE created_at >= :startDate GROUP BY changed_by ORDER BY count DESC"
    )
    Flux<Object[]> getChangerFrequency(@Param("startDate") LocalDateTime startDate);

    // Pagination Support
    @Query(
        "SELECT * FROM admin_permission_audit ORDER BY created_at DESC LIMIT :size OFFSET :offset"
    )
    Flux<AdminPermissionAudit> findAllWithPagination(
        @Param("size") Integer size,
        @Param("offset") Integer offset
    );

    @Query(
        "SELECT * FROM admin_permission_audit WHERE admin_id = :adminId ORDER BY created_at DESC LIMIT :size OFFSET :offset"
    )
    Flux<AdminPermissionAudit> findByAdminIdWithPagination(
        @Param("adminId") UUID adminId,
        @Param("size") Integer size,
        @Param("offset") Integer offset
    );

    // Recent Activity Queries
    @Query(
        "SELECT * FROM admin_permission_audit WHERE created_at >= :since ORDER BY created_at DESC LIMIT :limit"
    )
    Flux<AdminPermissionAudit> findRecentActivity(
        @Param("since") LocalDateTime since,
        @Param("limit") Integer limit
    );

    @Query(
        "SELECT * FROM admin_permission_audit WHERE admin_id = :adminId AND created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours' ORDER BY created_at DESC"
    )
    Flux<AdminPermissionAudit> findLast24HoursForAdmin(@Param("adminId") UUID adminId);

    @Query(
        "SELECT * FROM admin_permission_audit WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' ORDER BY created_at DESC"
    )
    Flux<AdminPermissionAudit> findLastWeekActivity();

    // Cleanup Queries (for data retention)
    @Query(
        "DELETE FROM admin_permission_audit WHERE created_at < :cutoffDate"
    )
    Mono<Integer> deleteOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);

    @Query(
        "SELECT COUNT(*) FROM admin_permission_audit WHERE created_at < :cutoffDate"
    )
    Mono<Long> countRecordsOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);
}
