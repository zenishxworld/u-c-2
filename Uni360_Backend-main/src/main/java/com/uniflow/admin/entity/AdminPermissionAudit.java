package com.uniflow.admin.entity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * AdminPermissionAudit entity - Audit trail for admin permission changes
 *
 * <p>This entity tracks all changes made to admin permissions, providing
 * comprehensive audit logging for security and compliance purposes.
 *
 * <p>Features:
 * - Complete audit trail of permission changes
 * - IP address tracking for security
 * - Change reason documentation
 * - Old and new value tracking
 * - Administrative accountability
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("admin_permission_audit")
public class AdminPermissionAudit {

    @Id
    private UUID id;

    // Target Admin Information
    @NotNull
    @Column("admin_id")
    private UUID adminId;

    @NotBlank
    @Column("admin_username")
    private String adminUsername;

    // Permission Details
    @NotBlank
    @Column("permission_key")
    private String permissionKey;

    @Column("permission_name")
    private String permissionName;

    // Action Information
    @NotBlank
    @Column("action")
    private String action; // GRANTED, REVOKED, MODIFIED

    @Column("old_value")
    private String oldValue; // Previous permission state

    @Column("new_value")
    private String newValue; // New permission state

    // Change Context
    @NotNull
    @Column("changed_by")
    private UUID changedBy; // Admin who made the change

    @Column("change_reason")
    private String changeReason;

    @Column("ip_address")
    private String ipAddress;

    // Timestamps
    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    /**
     * Create audit record for permission grant
     *
     * @param adminId the admin receiving the permission
     * @param adminUsername the admin's username
     * @param permissionKey the permission key
     * @param permissionName the permission display name
     * @param changedBy who granted the permission
     * @param reason reason for granting
     * @param ipAddress IP address of the change
     * @return AdminPermissionAudit instance
     */
    public static AdminPermissionAudit createGrantRecord(
        UUID adminId,
        String adminUsername,
        String permissionKey,
        String permissionName,
        UUID changedBy,
        String reason,
        String ipAddress
    ) {
        return AdminPermissionAudit.builder()
            .adminId(adminId)
            .adminUsername(adminUsername)
            .permissionKey(permissionKey)
            .permissionName(permissionName)
            .action("GRANTED")
            .oldValue("false")
            .newValue("true")
            .changedBy(changedBy)
            .changeReason(reason)
            .ipAddress(ipAddress)
            .createdAt(LocalDateTime.now())
            .build();
    }

    /**
     * Create audit record for permission revocation
     *
     * @param adminId the admin losing the permission
     * @param adminUsername the admin's username
     * @param permissionKey the permission key
     * @param permissionName the permission display name
     * @param changedBy who revoked the permission
     * @param reason reason for revoking
     * @param ipAddress IP address of the change
     * @return AdminPermissionAudit instance
     */
    public static AdminPermissionAudit createRevokeRecord(
        UUID adminId,
        String adminUsername,
        String permissionKey,
        String permissionName,
        UUID changedBy,
        String reason,
        String ipAddress
    ) {
        return AdminPermissionAudit.builder()
            .adminId(adminId)
            .adminUsername(adminUsername)
            .permissionKey(permissionKey)
            .permissionName(permissionName)
            .action("REVOKED")
            .oldValue("true")
            .newValue("false")
            .changedBy(changedBy)
            .changeReason(reason)
            .ipAddress(ipAddress)
            .createdAt(LocalDateTime.now())
            .build();
    }

    /**
     * Create audit record for permission modification
     *
     * @param adminId the admin whose permission is modified
     * @param adminUsername the admin's username
     * @param permissionKey the permission key
     * @param permissionName the permission display name
     * @param oldValue the old permission value
     * @param newValue the new permission value
     * @param changedBy who modified the permission
     * @param reason reason for modification
     * @param ipAddress IP address of the change
     * @return AdminPermissionAudit instance
     */
    public static AdminPermissionAudit createModifyRecord(
        UUID adminId,
        String adminUsername,
        String permissionKey,
        String permissionName,
        String oldValue,
        String newValue,
        UUID changedBy,
        String reason,
        String ipAddress
    ) {
        return AdminPermissionAudit.builder()
            .adminId(adminId)
            .adminUsername(adminUsername)
            .permissionKey(permissionKey)
            .permissionName(permissionName)
            .action("MODIFIED")
            .oldValue(oldValue)
            .newValue(newValue)
            .changedBy(changedBy)
            .changeReason(reason)
            .ipAddress(ipAddress)
            .createdAt(LocalDateTime.now())
            .build();
    }

    /**
     * Check if this is a high-risk permission change
     *
     * @return true if the permission change involves critical permissions
     */
    public boolean isHighRisk() {
        if (permissionKey == null) {
            return false;
        }

        // Define high-risk permissions
        return (
            permissionKey.contains("refund_payments") ||
            permissionKey.contains("manage_permissions") ||
            permissionKey.contains("impersonate_users") ||
            permissionKey.contains("manage_system_settings")
        );
    }

    /**
     * Get formatted summary of the change
     *
     * @return human-readable summary
     */
    public String getChangeSummary() {
        return String.format(
            "%s permission '%s' for admin %s",
            action.toLowerCase(),
            permissionName != null ? permissionName : permissionKey,
            adminUsername
        );
    }
}
