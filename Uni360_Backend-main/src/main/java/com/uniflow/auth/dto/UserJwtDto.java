package com.uniflow.auth.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * UserJwtDto contains user information extracted from JWT tokens
 *
 * <p>This DTO follows the same pattern as the reference implementation from finvolv project and
 * contains all necessary user context information for authorization and data filtering.
 *
 * <p>Features: - Complete user identification and context - Role-based access control information -
 * Territory and client-based filtering support - Multi-tenant organization support - JSON
 * serialization support
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserJwtDto {

    /** Unique user identifier */
    private Long id;

    /** Username for authentication */
    private String username;

    /** User email address */
    private String email;

    /** User first name */
    private String firstName;

    /** User last name */
    private String lastName;

    /** User type (STUDENT, ADMIN, SUPER_ADMIN, CONSULTANT) */
    private String userType;

    /** Client type for multi-tenant support (UNIFLOW, UNI360) */
    private String clientType;

    /** Territory identifier for geographical/organizational filtering */
    private String territoryIdentifier;

    /** Organization ID for multi-tenant support */
    private String organizationId;

    /** Department within organization */
    private String department;

    /** User roles for role-based access control */
    private List<String> roles;

    /** User permissions for fine-grained access control */
    private List<String> permissions;

    /** User groups for group-based access control */
    private List<String> groups;

    /** Additional user attributes (organizations, products, etc.) */
    private Map<String, Object> attributes;

    /** Session timeout in minutes */
    private Integer sessionTimeoutMinutes;

    /** User status (ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION) */
    private String status;

    /** User timezone */
    private String timezone;

    /** User language preference */
    private String language;

    /**
     * Get roles for specific organization and product This method follows the pattern from the
     * reference implementation
     *
     * @param organizationName Organization name
     * @param productName Product name
     * @return List of roles for the specified context
     */
    public List<String> getRoles(String organizationName, String productName) {
        if (attributes == null) {
            return roles;
        }

        // Try to get organization-specific roles
        Object orgRoles = attributes.get(
            "org_" + organizationName + "_product_" + productName
        );
        if (orgRoles instanceof List) {
            @SuppressWarnings("unchecked")
            List<String> orgRolesList = (List<String>) orgRoles;
            return orgRolesList;
        }

        // Fallback to general roles
        return roles;
    }

    /**
     * Get products from user relations/attributes This method follows the pattern from the reference
     * implementation
     *
     * @return List of products the user has access to
     */
    public List<String> getProductsFromRelations() {
        if (attributes == null) {
            return List.of();
        }

        Object products = attributes.get("products");
        if (products instanceof List) {
            @SuppressWarnings("unchecked")
            List<String> productsList = (List<String>) products;
            return productsList;
        }

        return List.of();
    }

    /**
     * Check if user has specific role
     *
     * @param role Role to check
     * @return true if user has the role
     */
    public boolean hasRole(String role) {
        return roles != null && roles.contains(role);
    }

    /**
     * Check if user has any of the specified roles
     *
     * @param roleList List of roles to check
     * @return true if user has any of the roles
     */
    public boolean hasAnyRole(List<String> roleList) {
        if (roles == null || roleList == null) {
            return false;
        }
        return roles.stream().anyMatch(roleList::contains);
    }

    /**
     * Check if user has specific permission
     *
     * @param permission Permission to check
     * @return true if user has the permission
     */
    public boolean hasPermission(String permission) {
        return permissions != null && permissions.contains(permission);
    }

    /**
     * Check if user belongs to specific group
     *
     * @param group Group to check
     * @return true if user belongs to the group
     */
    public boolean belongsToGroup(String group) {
        return groups != null && groups.contains(group);
    }

    /**
     * Get user display name (full name, username, or email)
     *
     * @return Display name for the user
     */
    public String getDisplayName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        } else if (firstName != null) {
            return firstName;
        } else if (lastName != null) {
            return lastName;
        } else if (username != null && !username.isEmpty()) {
            return username;
        }
        return email != null ? email : "Unknown User";
    }

    /**
     * Get user full name
     *
     * @return Full name or username as fallback
     */
    public String getFullName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        } else if (firstName != null) {
            return firstName;
        } else if (lastName != null) {
            return lastName;
        }
        return username;
    }

    /**
     * Check if user is admin
     *
     * @return true if user has admin role
     */
    public boolean isAdmin() {
        return (
            hasRole("ADMIN") ||
            hasRole("SUPER_ADMIN") ||
            "ADMIN".equals(userType) ||
            "SUPER_ADMIN".equals(userType)
        );
    }

    /**
     * Check if user is super admin
     *
     * @return true if user has super admin role
     */
    public boolean isSuperAdmin() {
        return hasRole("SUPER_ADMIN") || "SUPER_ADMIN".equals(userType);
    }

    /**
     * Check if user is student
     *
     * @return true if user is a student
     */
    public boolean isStudent() {
        return hasRole("STUDENT") || "STUDENT".equals(userType);
    }

    /**
     * Get territory branches (for compatibility with reference implementation)
     *
     * @return List of territory branches
     */
    public List<String> getTerritoryBranches() {
        if (attributes == null) {
            return List.of(
                territoryIdentifier != null ? territoryIdentifier : "DEFAULT"
            );
        }

        Object branches = attributes.get("territory_branches");
        if (branches instanceof List) {
            @SuppressWarnings("unchecked")
            List<String> branchesList = (List<String>) branches;
            return branchesList;
        }

        return List.of(
            territoryIdentifier != null ? territoryIdentifier : "DEFAULT"
        );
    }

    /**
     * Check if account is active
     *
     * @return true if account is active
     */
    public boolean isActive() {
        return "ACTIVE".equals(status);
    }

    /**
     * Check if user is consultant
     *
     * @return true if user is a consultant
     */
    public boolean isConsultant() {
        return hasRole("CONSULTANT") || "CONSULTANT".equals(userType);
    }

    /**
     * Get user ID for workflow orchestration compatibility
     *
     * @return User ID
     */
    public Long getUserId() {
        return this.id;
    }
}
