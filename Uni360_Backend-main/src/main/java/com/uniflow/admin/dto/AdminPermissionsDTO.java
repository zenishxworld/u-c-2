package com.uniflow.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * AdminPermissionsDTO - Data Transfer Object for admin permission updates
 *
 * <p>This DTO handles permission update requests in the new SuperAdmin system,
 * supporting both legacy boolean permissions and the new granular permission system.
 *
 * <p>Features:
 * - Legacy permission fields for backward compatibility
 * - New granular permission keys system
 * - Audit trail support with change reasons
 * - Validation for permission changes
 * - IP address tracking for security
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminPermissionsDTO {

    // Legacy Permission Fields (for backward compatibility)
    private Boolean canVerifyDocuments;
    private Boolean canApproveApplications;
    private Boolean canProcessPayments;
    private Boolean canManageUsers;

    // New Granular Permission System
    private List<String> permissionKeys; // List of AdminPermission enum keys
    private List<String> grantPermissions; // Permissions to grant
    private List<String> revokePermissions; // Permissions to revoke

    // Change Context and Audit
    @NotNull
    private String reason; // Required reason for permission change
    private String changeCategory; // ROUTINE, ESCALATION, EMERGENCY, etc.
    private Integer validityDays; // Optional: permissions valid for specific duration
    private LocalDateTime effectiveFrom; // When permissions should take effect
    private LocalDateTime effectiveUntil; // When permissions should expire

    // Security Context
    private String ipAddress; // IP address of the requester
    private String userAgent; // User agent of the requester
    private String changeSource; // WEB, API, BULK_UPDATE, etc.

    // Approval Workflow (for high-risk permissions)
    private Boolean requiresApproval; // Whether this change needs approval
    private String approvedBy; // Who approved the change (if applicable)
    private LocalDateTime approvedAt; // When the change was approved
    private String approvalReference; // Reference to approval ticket/request

    // Bulk Operations Support
    private List<String> targetAdminIds; // For bulk permission updates
    private Boolean applyToAll; // Apply to all matching admins
    private BulkUpdateCriteria bulkCriteria; // Criteria for bulk operations

    /**
     * Check if this is a high-risk permission change
     */
    public boolean isHighRiskChange() {
        if (permissionKeys != null) {
            return permissionKeys.stream().anyMatch(key ->
                key.contains("refund_payments") ||
                key.contains("manage_permissions") ||
                key.contains("impersonate_users") ||
                key.contains("manage_system_settings")
            );
        }

        // Check legacy permissions for high-risk changes
        return Boolean.TRUE.equals(canProcessPayments) ||
               Boolean.TRUE.equals(canManageUsers);
    }

    /**
     * Get total number of permission changes
     */
    public int getTotalChanges() {
        int count = 0;

        if (grantPermissions != null) {
            count += grantPermissions.size();
        }

        if (revokePermissions != null) {
            count += revokePermissions.size();
        }

        // Add legacy permission changes
        if (canVerifyDocuments != null) count++;
        if (canApproveApplications != null) count++;
        if (canProcessPayments != null) count++;
        if (canManageUsers != null) count++;

        return count;
    }

    /**
     * Validate permission change request
     */
    public boolean isValidRequest() {
        // Must have a reason
        if (reason == null || reason.trim().isEmpty()) {
            return false;
        }

        // Must have at least one permission change
        boolean hasChanges = getTotalChanges() > 0;

        // For bulk operations, must have target criteria
        if (Boolean.TRUE.equals(applyToAll) && bulkCriteria == null) {
            return false;
        }

        return hasChanges;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkUpdateCriteria {
        private String role; // Apply to specific role
        private String specialization; // Apply to specific specialization
        private String department; // Apply to specific department
        private Boolean isActive; // Apply to active/inactive admins
        private List<String> excludeAdminIds; // Exclude specific admin IDs
        private Integer maxAffectedAdmins; // Safety limit for bulk operations
    }
}
