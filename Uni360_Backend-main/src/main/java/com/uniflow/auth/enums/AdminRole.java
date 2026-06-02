package com.uniflow.auth.enums;

/**
 * Enum defining valid admin roles in the UniFLow system
 *
 * This enum provides type safety and validation for admin role assignments
 * and maps to corresponding UserType values in the system.
 */
public enum AdminRole {

    /**
     * Regular administrator with standard admin privileges
     */
    ADMIN("ADMIN", "Administrator"),

    /**
     * Academic counselor with student guidance privileges
     */
    COUNSELOR("ADMIN", "Academic Counselor"),

    /**
     * Manager with team oversight and administrative privileges
     */
    MANAGER("ADMIN", "Manager"),

    /**
     * Super administrator with full system privileges
     */
    SUPER_ADMIN("SUPER_ADMIN", "Super Administrator");

    private final String userType;
    private final String displayName;

    AdminRole(String userType, String displayName) {
        this.userType = userType;
        this.displayName = displayName;
    }

    /**
     * Get the corresponding UserType for this admin role
     *
     * @return UserType string value
     */
    public String getUserType() {
        return userType;
    }

    /**
     * Get the human-readable display name for this role
     *
     * @return Display name
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Parse a string role into AdminRole enum
     *
     * @param role String role to parse
     * @return AdminRole enum value
     * @throws IllegalArgumentException if role is invalid
     */
    public static AdminRole fromString(String role) {
        if (role == null || role.trim().isEmpty()) {
            throw new IllegalArgumentException("Role cannot be null or empty");
        }

        try {
            return AdminRole.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                String.format(
                    "Invalid admin role '%s'. Valid roles are: ADMIN, COUNSELOR, MANAGER, SUPER_ADMIN",
                    role
                )
            );
        }
    }

    /**
     * Check if a string represents a valid admin role
     *
     * @param role String to check
     * @return true if valid, false otherwise
     */
    public static boolean isValid(String role) {
        if (role == null || role.trim().isEmpty()) {
            return false;
        }

        try {
            AdminRole.valueOf(role.toUpperCase());
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Get all valid role names as a string array
     *
     * @return Array of valid role names
     */
    public static String[] getValidRoles() {
        AdminRole[] roles = AdminRole.values();
        String[] roleNames = new String[roles.length];
        for (int i = 0; i < roles.length; i++) {
            roleNames[i] = roles[i].name();
        }
        return roleNames;
    }
}
