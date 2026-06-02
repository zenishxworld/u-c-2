package com.uniflow.admin.dto.superadmin.user;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * UserOverviewDTO - Comprehensive user management overview for Super Master
 * Admin
 *
 * <p>
 * This DTO provides a complete overview of all users in the system with
 * advanced
 * filtering, sorting, and pagination capabilities for user management
 * operations.
 *
 * <p>
 * Features:
 * - Complete user listing with pagination
 * - Advanced filtering by user type, status, registration date
 * - Search capabilities across name, email, username
 * - User activity and engagement metrics
 * - Bulk operations support
 * - Real-time user statistics
 *
 * <p>
 * Used by endpoints:
 * - GET /api/v1/superadmin/dashboard/users
 * - GET /api/v1/superadmin/dashboard/users/filters
 * - Super Master Admin user management dashboard
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-12
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserOverviewDTO {

    // ===============================
    // USER LISTING & PAGINATION
    // ===============================

    @JsonProperty("users")
    private List<UserSummary> users;

    @JsonProperty("pagination")
    private PaginationInfo pagination;

    @JsonProperty("filters")
    private FilterOptions filters;

    @JsonProperty("summary")
    private UserSummaryStats summary;

    // Metadata
    @JsonProperty("lastUpdated")
    private LocalDateTime lastUpdated;

    @JsonProperty("totalCount")
    private Long totalCount;

    @JsonProperty("filteredCount")
    private Long filteredCount;

    // ===============================
    // USER SUMMARY CLASS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserSummary {

        @JsonProperty("id")
        private Long id;

        @JsonProperty("username")
        private String username;

        @JsonProperty("email")
        private String email;

        @JsonProperty("firstName")
        private String firstName;

        @JsonProperty("lastName")
        private String lastName;

        @JsonProperty("fullName")
        private String fullName;

        @JsonProperty("phoneNumber")
        private String phoneNumber;

        @JsonProperty("userType")
        private String userType; // STUDENT, ADMIN, SUPER_ADMIN, CONSULTANT

        @JsonProperty("status")
        private String status; // ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION

        @JsonProperty("emailVerified")
        private Boolean emailVerified;

        @JsonProperty("phoneVerified")
        private Boolean phoneVerified;

        @JsonProperty("isActive")
        private Boolean isActive;

        @JsonProperty("oauthProviderCode")
        private String oauthProviderCode; // LOCAL, GOOGLE, HYBRID

        @JsonProperty("createdAt")
        private LocalDateTime createdAt;

        @JsonProperty("updatedAt")
        private LocalDateTime updatedAt;

        @JsonProperty("lastLoginAt")
        private LocalDateTime lastLoginAt;

        @JsonProperty("registrationDaysAgo")
        private Long registrationDaysAgo;

        @JsonProperty("activityScore")
        private Integer activityScore; // 0-100

        @JsonProperty("applicationCount")
        private Long applicationCount;

        @JsonProperty("documentsUploaded")
        private Long documentsUploaded;

        @JsonProperty("totalLogins")
        private Long totalLogins;

        @JsonProperty("riskLevel")
        private String riskLevel; // LOW, MEDIUM, HIGH

        @JsonProperty("accountFlags")
        private List<String> accountFlags; // SUSPICIOUS_ACTIVITY, MULTIPLE_ACCOUNTS, etc.

        @JsonProperty("tags")
        private List<String> tags;

        // ===============================
        // STUDENT PROFILE DATA
        // ===============================

        @JsonProperty("profileId")
        private UUID profileId;

        @JsonProperty("nationality")
        private String nationality;

        @JsonProperty("dateOfBirth")
        private String dateOfBirth;

        @JsonProperty("currentLocation")
        private String currentLocation;

        @JsonProperty("educationLevel")
        private String educationLevel;

        @JsonProperty("fieldOfStudy")
        private String fieldOfStudy;

        @JsonProperty("institutionName")
        private String institutionName;

        @JsonProperty("graduationYear")
        private Integer graduationYear;

        @JsonProperty("gpa")
        private Double gpa;

        @JsonProperty("targetCountries")
        private List<String> targetCountries;

        @JsonProperty("preferredPrograms")
        private List<String> preferredPrograms;

        @JsonProperty("preferredStudyLevel")
        private String preferredStudyLevel;

        @JsonProperty("profileCompletionPercentage")
        private Integer profileCompletionPercentage;

        @JsonProperty("profileStatus")
        private String profileStatus;

        @JsonProperty("isProfileVerified")
        private Boolean isProfileVerified;

        @JsonProperty("workflowStage")
        private String workflowStage;

        @JsonProperty("cvResumeUrl")
        private String cvResumeUrl;

        @JsonProperty("profilePhotoUrl")
        private String profilePhotoUrl;

        @JsonProperty("profileCreatedAt")
        private LocalDateTime profileCreatedAt;

        // ===============================
        // DOCUMENT SUMMARY DATA
        // ===============================

        @JsonProperty("totalDocuments")
        private Long totalDocuments;

        @JsonProperty("verifiedDocuments")
        private Long verifiedDocuments;

        @JsonProperty("pendingDocuments")
        private Long pendingDocuments;

        @JsonProperty("rejectedDocuments")
        private Long rejectedDocuments;
    }

    // ===============================
    // PAGINATION INFO
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PaginationInfo {

        @JsonProperty("currentPage")
        private Integer currentPage;

        @JsonProperty("pageSize")
        private Integer pageSize;

        @JsonProperty("totalPages")
        private Integer totalPages;

        @JsonProperty("totalElements")
        private Long totalElements;

        @JsonProperty("hasNext")
        private Boolean hasNext;

        @JsonProperty("hasPrevious")
        private Boolean hasPrevious;

        @JsonProperty("isFirst")
        private Boolean isFirst;

        @JsonProperty("isLast")
        private Boolean isLast;
    }

    // ===============================
    // FILTER OPTIONS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class FilterOptions {

        @JsonProperty("availableUserTypes")
        private List<String> availableUserTypes;

        @JsonProperty("availableStatuses")
        private List<String> availableStatuses;

        @JsonProperty("availableAuthProviders")
        private List<String> availableAuthProviders;

        @JsonProperty("availableRiskLevels")
        private List<String> availableRiskLevels;

        @JsonProperty("availableTags")
        private List<String> availableTags;

        @JsonProperty("dateRangeOptions")
        private List<DateRangeOption> dateRangeOptions;

        @JsonProperty("sortingOptions")
        private List<SortingOption> sortingOptions;

        @JsonProperty("searchableFields")
        private List<String> searchableFields;
    }

    // ===============================
    // USER SUMMARY STATISTICS
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class UserSummaryStats {

        @JsonProperty("totalUsers")
        private Long totalUsers;

        @JsonProperty("totalStudents")
        private Long totalStudents;

        @JsonProperty("totalAdmins")
        private Long totalAdmins;

        @JsonProperty("totalSuperAdmins")
        private Long totalSuperAdmins;

        @JsonProperty("totalConsultants")
        private Long totalConsultants;

        @JsonProperty("activeUsers")
        private Long activeUsers;

        @JsonProperty("inactiveUsers")
        private Long inactiveUsers;

        @JsonProperty("suspendedUsers")
        private Long suspendedUsers;

        @JsonProperty("pendingVerificationUsers")
        private Long pendingVerificationUsers;

        @JsonProperty("emailVerifiedUsers")
        private Long emailVerifiedUsers;

        @JsonProperty("phoneVerifiedUsers")
        private Long phoneVerifiedUsers;

        @JsonProperty("googleUsers")
        private Long googleUsers;

        @JsonProperty("localUsers")
        private Long localUsers;

        @JsonProperty("hybridUsers")
        private Long hybridUsers;

        @JsonProperty("usersCreatedToday")
        private Long usersCreatedToday;

        @JsonProperty("usersCreatedThisWeek")
        private Long usersCreatedThisWeek;

        @JsonProperty("usersCreatedThisMonth")
        private Long usersCreatedThisMonth;

        @JsonProperty("averageActivityScore")
        private Double averageActivityScore;

        @JsonProperty("highRiskUsers")
        private Long highRiskUsers;

        @JsonProperty("mediumRiskUsers")
        private Long mediumRiskUsers;

        @JsonProperty("lowRiskUsers")
        private Long lowRiskUsers;

        @JsonProperty("usersByCountry")
        private Map<String, Long> usersByCountry;

        @JsonProperty("growthTrend")
        private List<TrendDataPoint> growthTrend;
    }

    // ===============================
    // SUPPORTING CLASSES
    // ===============================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DateRangeOption {

        @JsonProperty("label")
        private String label;

        @JsonProperty("value")
        private String value;

        @JsonProperty("startDate")
        private LocalDateTime startDate;

        @JsonProperty("endDate")
        private LocalDateTime endDate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SortingOption {

        @JsonProperty("label")
        private String label;

        @JsonProperty("field")
        private String field;

        @JsonProperty("direction")
        private String direction; // ASC, DESC

        @JsonProperty("isDefault")
        private Boolean isDefault;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TrendDataPoint {

        @JsonProperty("date")
        private String date;

        @JsonProperty("value")
        private Long value;

        @JsonProperty("label")
        private String label;

        @JsonProperty("changeFromPrevious")
        private Long changeFromPrevious;

        @JsonProperty("percentageChange")
        private Double percentageChange;
    }
}
