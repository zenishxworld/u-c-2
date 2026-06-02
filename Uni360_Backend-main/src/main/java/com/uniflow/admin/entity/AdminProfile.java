package com.uniflow.admin.entity;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * AdminProfile entity - Enhanced admin user profiles with comprehensive permission management
 *
 * <p>This entity stores comprehensive information about admin users including their roles,
 * specializations, work schedules, capacity management, granular permissions, and performance metrics.
 *
 * <p>Enhanced Features:
 * - Granular permission system with audit trail
 * - Advanced workload and capacity tracking
 * - Performance metrics and quality scoring
 * - Country-specific specializations
 * - Language proficiency tracking
 * - Territory and specialization management
 * - Multi-tenant support
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("admin_profile")
public class AdminProfile {

    @Id
    private UUID id;

    // User Reference
    @NotBlank
    @Column("user_id")
    private String userId; // Reference to auth service user ID

    @NotBlank
    @Column("username")
    private String username;

    @Email
    @Column("email")
    private String email;

    @Column("first_name")
    private String firstName;

    @Column("last_name")
    private String lastName;

    // Admin Details
    @NotBlank
    @Column("employee_id")
    private String employeeId;

    @Column("role")
    private String role; // ADMIN, SUPER_ADMIN, COUNSELOR, REVIEWER, SPECIALIST

    @Column("specialization")
    private String specialization; // GENERAL, USA, UK, CANADA, AUSTRALIA, etc.

    @Column("department")
    private String department;

    // Contact Information
    @Pattern(regexp = "^\\+?1?\\d{9,15}$")
    @Column("phone")
    private String phone;

    @Column("extension")
    private String extension;

    // Profile Information
    @Column("bio")
    private String bio;

    @Column("profile_photo_url")
    private String profilePhotoUrl;

    // Work Schedule and Capacity
    @Builder.Default
    @Column("work_hours_start")
    private LocalTime workHoursStart = LocalTime.of(9, 0);

    @Builder.Default
    @Column("work_hours_end")
    private LocalTime workHoursEnd = LocalTime.of(17, 0);

    @Builder.Default
    @Column("timezone")
    private String timezone = "UTC";

    @Builder.Default
    @Min(1)
    @Max(50)
    @Column("max_daily_capacity")
    private Integer maxDailyCapacity = 10;

    @Builder.Default
    @Min(0)
    @Column("current_workload")
    private Integer currentWorkload = 0;

    // Enhanced Permission System (JSON stored as comma-separated permission keys)
    @Builder.Default
    @Column("permissions")
    private String permissions = ""; // Stores AdminPermission enum keys as comma-separated string

    @Column("permission_last_updated")
    private LocalDateTime permissionLastUpdated;

    @Column("permission_last_updated_by")
    private String permissionLastUpdatedBy;

    // Advanced Capacity Management
    @Builder.Default
    @Min(1)
    @Max(20)
    @Column("max_concurrent_applications")
    private Integer maxConcurrentApplications = 5;

    // Country-Specific Specializations (JSON array)
    @Column("specialization_countries")
    private String specializationCountries; // JSON array like ["DE", "US", "UK"]

    // Language Proficiencies (JSON array)
    @Column("language_proficiencies")
    private String languageProficiencies; // JSON array like ["EN", "DE", "FR"]

    // Performance Metrics - Enhanced
    @Builder.Default
    @Min(0)
    @Column("total_applications_processed")
    private Integer totalApplicationsProcessed = 0;

    @Builder.Default
    @Min(0)
    @Column("total_documents_verified")
    private Integer totalDocumentsVerified = 0;

    @Builder.Default
    @Min(0)
    @Column("average_processing_time_hours")
    private Double averageProcessingTimeHours = 0.0; // Average hours per application

    @Builder.Default
    @Min(0)
    @Max(10)
    @Column("quality_score")
    private Double qualityScore = 0.0; // Quality score out of 10

    // Status and Activity
    @Builder.Default
    @Column("is_active")
    private Boolean isActive = true;

    @Column("last_activity_at")
    private LocalDateTime lastActivityAt;

    // Legacy Permission Fields (for backward compatibility - will be migrated to permissions field)
    @Builder.Default
    @Column("can_verify_documents")
    private Boolean canVerifyDocuments = false;

    @Builder.Default
    @Column("can_approve_applications")
    private Boolean canApproveApplications = false;

    @Builder.Default
    @Column("can_process_payments")
    private Boolean canProcessPayments = false;

    @Builder.Default
    @Column("can_manage_users")
    private Boolean canManageUsers = false;

    // Client Assignment
    @Builder.Default
    @NotBlank
    @Column("client_id")
    private String clientId = "uniflow";

    // Metadata
    @Column("hire_date")
    private LocalDate hireDate;

    @Column("last_login")
    private LocalDateTime lastLogin;

    @Column("last_activity")
    private LocalDateTime lastActivity;

    // Timestamps
    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;

    // Business Logic Methods

    /**
     * Check if admin has specific permission
     *
     * @param permissionKey the permission key to check
     * @return true if admin has the permission
     */
    public boolean hasPermission(String permissionKey) {
        if (permissions == null || permissionKey == null) {
            return false;
        }
        return permissions.contains(permissionKey);
    }

    /**
     * Get all permission keys as a set
     *
     * @return Set of permission keys
     */
    public Set<String> getPermissionKeys() {
        if (permissions == null || permissions.trim().isEmpty()) {
            return new HashSet<>();
        }
        return Set.of(permissions.split(","));
    }

    /**
     * Parse permissions from comma-separated string
     *
     * @return Set of permission keys
     */
    private Set<String> parsePermissions() {
        return getPermissionKeys();
    }

    /**
     * Check if admin is available for new tasks
     *
     * @return true if admin is available, false otherwise
     */
    public boolean isAvailable() {
        if (!isActive) {
            return false;
        }

        // Check capacity
        return currentWorkload < maxDailyCapacity;
    }

    /**
     * Check if admin can handle specific territory/specialization
     *
     * @param territory the territory to check
     * @return true if admin can handle the territory
     */
    public boolean canHandleTerritory(String territory) {
        if (territory == null) {
            return true;
        }

        return (
            "ALL".equalsIgnoreCase(specialization) ||
            "GENERAL".equalsIgnoreCase(specialization) ||
            specialization.equalsIgnoreCase(territory)
        );
    }

    /**
     * Get admin's full name
     *
     * @return formatted full name
     */
    public String getFullName() {
        if (firstName == null && lastName == null) {
            return username;
        }

        return String.format(
            "%s %s",
            firstName != null ? firstName : "",
            lastName != null ? lastName : ""
        ).trim();
    }

    /**
     * Get utilization percentage
     *
     * @return current workload as percentage of capacity
     */
    public double getUtilizationPercentage() {
        if (maxDailyCapacity == 0) {
            return 0.0;
        }
        return (
            (currentWorkload.doubleValue() / maxDailyCapacity.doubleValue()) *
            100.0
        );
    }

    /**
     * Check if admin is overloaded
     *
     * @return true if workload exceeds 90% of capacity
     */
    public boolean isOverloaded() {
        return getUtilizationPercentage() > 90.0;
    }

    /**
     * Get admin's role display name
     *
     * @return formatted role name
     */
    public String getRoleDisplayName() {
        if (role == null) {
            return "Unknown";
        }

        String result = role.replace("_", " ").toLowerCase();
        // Capitalize first letter of each word
        StringBuilder sb = new StringBuilder();
        boolean capitalizeNext = true;
        for (char c : result.toCharArray()) {
            if (Character.isWhitespace(c)) {
                capitalizeNext = true;
                sb.append(c);
            } else if (capitalizeNext) {
                sb.append(Character.toUpperCase(c));
                capitalizeNext = false;
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    /**
     * Get admin's specialization display name
     *
     * @return formatted specialization name
     */
    public String getSpecializationDisplayName() {
        if (specialization == null) {
            return "General";
        }

        String result = specialization.replace("_", " ").toLowerCase();
        // Capitalize first letter of each word
        StringBuilder sb = new StringBuilder();
        boolean capitalizeNext = true;
        for (char c : result.toCharArray()) {
            if (Character.isWhitespace(c)) {
                capitalizeNext = true;
                sb.append(c);
            } else if (capitalizeNext) {
                sb.append(Character.toUpperCase(c));
                capitalizeNext = false;
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    /**
     * Get average processing time (legacy method name compatibility)
     *
     * @return average processing time in hours
     */
    public Double getAverageProcessingTime() {
        return averageProcessingTimeHours;
    }
}
