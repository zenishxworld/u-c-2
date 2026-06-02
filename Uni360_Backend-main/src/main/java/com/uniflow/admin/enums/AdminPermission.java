package com.uniflow.admin.enums;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * AdminPermission enum - Comprehensive permission system for admin users
 *
 * <p>This enum defines all available permissions in the system with metadata including
 * categories, risk levels, and descriptions. It supports the new granular permission
 * management system replacing the legacy boolean permission fields.
 *
 * <p>Features:
 * - Hierarchical permission categorization
 * - Risk level assessment for sensitive operations
 * - Display names and descriptions for UI
 * - Permission dependency validation
 * - Filtering by category and risk level
 */
public enum AdminPermission {

    // Document Management Permissions
    CAN_VERIFY_DOCUMENTS(
        "can_verify_documents",
        "Verify Documents",
        "Can verify and validate student documents",
        PermissionCategory.DOCUMENT_MANAGEMENT,
        RiskLevel.MEDIUM
    ),
    CAN_REJECT_DOCUMENTS(
        "can_reject_documents",
        "Reject Documents",
        "Can reject invalid or incomplete documents",
        PermissionCategory.DOCUMENT_MANAGEMENT,
        RiskLevel.MEDIUM
    ),
    CAN_REQUEST_DOCUMENT_RESUBMISSION(
        "can_request_document_resubmission",
        "Request Document Resubmission",
        "Can request students to resubmit documents",
        PermissionCategory.DOCUMENT_MANAGEMENT,
        RiskLevel.LOW
    ),

    // Application Processing Permissions
    CAN_APPROVE_APPLICATIONS(
        "can_approve_applications",
        "Approve Applications",
        "Can approve student applications for processing",
        PermissionCategory.APPLICATION_PROCESSING,
        RiskLevel.HIGH
    ),
    CAN_REJECT_APPLICATIONS(
        "can_reject_applications",
        "Reject Applications",
        "Can reject student applications with reasons",
        PermissionCategory.APPLICATION_PROCESSING,
        RiskLevel.HIGH
    ),
    CAN_MODIFY_APPLICATION_STATUS(
        "can_modify_application_status",
        "Modify Application Status",
        "Can change application status and workflow stages",
        PermissionCategory.APPLICATION_PROCESSING,
        RiskLevel.MEDIUM
    ),
    CAN_BULK_UPDATE_APPLICATIONS(
        "can_bulk_update_applications",
        "Bulk Update Applications",
        "Can perform bulk operations on multiple applications",
        PermissionCategory.APPLICATION_PROCESSING,
        RiskLevel.HIGH
    ),

    // Payment Management Permissions
    CAN_PROCESS_PAYMENTS(
        "can_process_payments",
        "Process Payments",
        "Can process student payment transactions",
        PermissionCategory.PAYMENT_MANAGEMENT,
        RiskLevel.HIGH
    ),
    CAN_REFUND_PAYMENTS(
        "can_refund_payments",
        "Refund Payments",
        "Can issue payment refunds to students",
        PermissionCategory.PAYMENT_MANAGEMENT,
        RiskLevel.CRITICAL
    ),
    CAN_VIEW_PAYMENT_DETAILS(
        "can_view_payment_details",
        "View Payment Details",
        "Can view detailed payment information and history",
        PermissionCategory.PAYMENT_MANAGEMENT,
        RiskLevel.MEDIUM
    ),
    CAN_GENERATE_PAYMENT_REPORTS(
        "can_generate_payment_reports",
        "Generate Payment Reports",
        "Can generate payment and financial reports",
        PermissionCategory.PAYMENT_MANAGEMENT,
        RiskLevel.MEDIUM
    ),

    // User Management Permissions
    CAN_MANAGE_USERS(
        "can_manage_users",
        "Manage Users",
        "Can create, update, and deactivate user accounts",
        PermissionCategory.USER_MANAGEMENT,
        RiskLevel.HIGH
    ),
    CAN_VIEW_USER_DETAILS(
        "can_view_user_details",
        "View User Details",
        "Can access detailed user information and profiles",
        PermissionCategory.USER_MANAGEMENT,
        RiskLevel.MEDIUM
    ),
    CAN_IMPERSONATE_USERS(
        "can_impersonate_users",
        "Impersonate Users",
        "Can log in as other users for support purposes",
        PermissionCategory.USER_MANAGEMENT,
        RiskLevel.CRITICAL
    ),

    // Communication Permissions
    CAN_SEND_NOTIFICATIONS(
        "can_send_notifications",
        "Send Notifications",
        "Can send system notifications to users",
        PermissionCategory.COMMUNICATION,
        RiskLevel.LOW
    ),
    CAN_SEND_BULK_EMAILS(
        "can_send_bulk_emails",
        "Send Bulk Emails",
        "Can send bulk email communications",
        PermissionCategory.COMMUNICATION,
        RiskLevel.MEDIUM
    ),
    CAN_ACCESS_CHAT_SUPPORT(
        "can_access_chat_support",
        "Access Chat Support",
        "Can access and manage chat support system",
        PermissionCategory.COMMUNICATION,
        RiskLevel.LOW
    ),

    // System Administration Permissions
    CAN_MANAGE_SYSTEM_SETTINGS(
        "can_manage_system_settings",
        "Manage System Settings",
        "Can modify system configuration and settings",
        PermissionCategory.SYSTEM_ADMINISTRATION,
        RiskLevel.CRITICAL
    ),
    CAN_VIEW_SYSTEM_LOGS(
        "can_view_system_logs",
        "View System Logs",
        "Can access and review system logs and audit trails",
        PermissionCategory.SYSTEM_ADMINISTRATION,
        RiskLevel.HIGH
    ),
    CAN_MANAGE_PERMISSIONS(
        "can_manage_permissions",
        "Manage Permissions",
        "Can modify user permissions and access controls",
        PermissionCategory.SYSTEM_ADMINISTRATION,
        RiskLevel.CRITICAL
    ),

    // Reporting and Analytics Permissions
    CAN_GENERATE_REPORTS(
        "can_generate_reports",
        "Generate Reports",
        "Can create and export various system reports",
        PermissionCategory.REPORTING_ANALYTICS,
        RiskLevel.LOW
    ),
    CAN_VIEW_ANALYTICS(
        "can_view_analytics",
        "View Analytics",
        "Can access system analytics and performance metrics",
        PermissionCategory.REPORTING_ANALYTICS,
        RiskLevel.LOW
    ),
    CAN_EXPORT_DATA(
        "can_export_data",
        "Export Data",
        "Can export system data in various formats",
        PermissionCategory.REPORTING_ANALYTICS,
        RiskLevel.MEDIUM
    ),

    // Workflow Management Permissions
    CAN_MANAGE_WORKFLOWS(
        "can_manage_workflows",
        "Manage Workflows",
        "Can create and modify application workflows",
        PermissionCategory.WORKFLOW_MANAGEMENT,
        RiskLevel.HIGH
    ),
    CAN_ASSIGN_TASKS(
        "can_assign_tasks",
        "Assign Tasks",
        "Can assign workflow tasks to other administrators",
        PermissionCategory.WORKFLOW_MANAGEMENT,
        RiskLevel.MEDIUM
    ),
    CAN_OVERRIDE_WORKFLOW_STAGES(
        "can_override_workflow_stages",
        "Override Workflow Stages",
        "Can bypass normal workflow progression rules",
        PermissionCategory.WORKFLOW_MANAGEMENT,
        RiskLevel.HIGH
    );

    private final String key;
    private final String displayName;
    private final String description;
    private final PermissionCategory category;
    private final RiskLevel riskLevel;

    AdminPermission(
        String key,
        String displayName,
        String description,
        PermissionCategory category,
        RiskLevel riskLevel
    ) {
        this.key = key;
        this.displayName = displayName;
        this.description = description;
        this.category = category;
        this.riskLevel = riskLevel;
    }

    public String getKey() {
        return key;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public PermissionCategory getCategory() {
        return category;
    }

    public RiskLevel getRiskLevel() {
        return riskLevel;
    }

    /**
     * Find permission by key
     *
     * @param key the permission key
     * @return AdminPermission or null if not found
     */
    public static AdminPermission fromKey(String key) {
        if (key == null) {
            return null;
        }
        for (AdminPermission permission : values()) {
            if (permission.key.equals(key)) {
                return permission;
            }
        }
        return null;
    }

    /**
     * Get permissions by category
     *
     * @param category the permission category
     * @return list of permissions in the category
     */
    public static List<AdminPermission> getByCategory(PermissionCategory category) {
        return Arrays.stream(values())
            .filter(p -> p.category == category)
            .collect(Collectors.toList());
    }

    /**
     * Get permissions by risk level
     *
     * @param riskLevel the risk level
     * @return list of permissions with the specified risk level
     */
    public static List<AdminPermission> getByRiskLevel(RiskLevel riskLevel) {
        return Arrays.stream(values())
            .filter(p -> p.riskLevel == riskLevel)
            .collect(Collectors.toList());
    }

    /**
     * Permission categories for grouping related permissions
     */
    public enum PermissionCategory {
        DOCUMENT_MANAGEMENT("Document Management"),
        APPLICATION_PROCESSING("Application Processing"),
        PAYMENT_MANAGEMENT("Payment Management"),
        USER_MANAGEMENT("User Management"),
        COMMUNICATION("Communication"),
        SYSTEM_ADMINISTRATION("System Administration"),
        REPORTING_ANALYTICS("Reporting & Analytics"),
        WORKFLOW_MANAGEMENT("Workflow Management");

        private final String displayName;

        PermissionCategory(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    /**
     * Risk levels for permission operations
     */
    public enum RiskLevel {
        LOW("Low", 1),
        MEDIUM("Medium", 2),
        HIGH("High", 3),
        CRITICAL("Critical", 4);

        private final String displayName;
        private final int level;

        RiskLevel(String displayName, int level) {
            this.displayName = displayName;
            this.level = level;
        }

        public String getDisplayName() {
            return displayName;
        }

        public int getLevel() {
            return level;
        }
    }
}
