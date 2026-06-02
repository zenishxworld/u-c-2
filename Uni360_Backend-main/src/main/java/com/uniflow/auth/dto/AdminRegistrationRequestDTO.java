package com.uniflow.auth.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.uniflow.auth.enums.AdminRole;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** DTO for admin user registration requests */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Admin user registration request")
@JsonIgnoreProperties(ignoreUnknown = false)
public class AdminRegistrationRequestDTO {

    @Schema(
        description = "Username for the admin account",
        example = "admin.john"
    )
    @NotBlank(message = "Username is required")
    @Size(
        min = 3,
        max = 50,
        message = "Username must be between 3 and 50 characters"
    )
    @Pattern(
        regexp = "^[a-zA-Z0-9._-]+$",
        message = "Username can only contain letters, numbers, dots, underscores, and hyphens"
    )
    private String username;

    @Schema(
        description = "Email address",
        example = "john.admin@university.edu"
    )
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;

    @Schema(description = "Password", example = "SecurePassword123!")
    @NotBlank(message = "Password is required")
    @Size(
        min = 8,
        max = 128,
        message = "Password must be between 8 and 128 characters"
    )
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
        message = "Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character"
    )
    private String password;

    @Schema(
        description = "Password confirmation",
        example = "SecurePassword123!"
    )
    @NotBlank(message = "Password confirmation is required")
    @JsonProperty("confirmPassword")
    private String confirmPassword;

    @Schema(description = "First name", example = "John")
    @NotBlank(message = "First name is required")
    @Size(
        min = 1,
        max = 100,
        message = "First name must be between 1 and 100 characters"
    )
    private String firstName;

    @Schema(description = "Last name", example = "Smith")
    @NotBlank(message = "Last name is required")
    @Size(
        min = 1,
        max = 100,
        message = "Last name must be between 1 and 100 characters"
    )
    private String lastName;

    @Schema(description = "Phone number", example = "+1234567890")
    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^\\+?[1-9]\\d{1,14}$",
        message = "Phone number must be valid"
    )
    private String phoneNumber;

    @Schema(description = "Employee ID", example = "EMP001")
    @NotBlank(message = "Employee ID is required")
    @Size(
        min = 3,
        max = 50,
        message = "Employee ID must be between 3 and 50 characters"
    )
    private String employeeId;

    @Schema(
        description = "Admin role",
        example = "COUNSELOR",
        allowableValues = { "ADMIN", "COUNSELOR", "MANAGER", "SUPER_ADMIN" }
    )
    @Pattern(
        regexp = "^(ADMIN|COUNSELOR|MANAGER|SUPER_ADMIN)$",
        message = "Role must be one of: ADMIN, COUNSELOR, MANAGER, SUPER_ADMIN"
    )
    @NotBlank(message = "Role is required")
    @Builder.Default
    private String role = "COUNSELOR";

    @Schema(description = "Department", example = "Admissions")
    @Size(max = 100, message = "Department must not exceed 100 characters")
    private String department;

    @Schema(description = "Job title", example = "Senior Admissions Counselor")
    @Size(max = 100, message = "Job title must not exceed 100 characters")
    private String jobTitle;

    @Schema(
        description = "Specialization area",
        example = "BACHELOR,MASTERS,DOCTORATE"
    )
    @Builder.Default
    private String specialization = "BACHELOR,MASTERS";

    @Schema(
        description = "Specialization countries (comma-separated)",
        example = "DE,US,UK,CA"
    )
    private String specializationCountries;

    @Schema(description = "Country", example = "United States")
    @Size(max = 100, message = "Country must not exceed 100 characters")
    private String country;

    @Schema(description = "City", example = "New York")
    @Size(max = 100, message = "City must not exceed 100 characters")
    private String city;

    @Schema(description = "Timezone", example = "America/New_York")
    @Builder.Default
    private String timezone = "UTC";

    @Schema(description = "Language preference", example = "en")
    @Builder.Default
    private String language = "en";

    @Schema(description = "Territory identifier", example = "US-EAST")
    private String territoryIdentifier;

    @Schema(description = "Organization ID", example = "ORG001")
    private String organizationId;

    @Schema(description = "Client IP address", hidden = true)
    private String ipAddress;

    @Schema(description = "User agent", hidden = true)
    private String userAgent;

    @Schema(description = "Maximum daily capacity", example = "10")
    private Integer maxDailyCapacity;

    @Schema(description = "Maximum concurrent applications", example = "5")
    private Integer maxConcurrentApplications;

    @Schema(description = "Can verify documents", example = "true")
    private Boolean canVerifyDocuments;

    @Schema(description = "Can approve applications", example = "true")
    private Boolean canApproveApplications;

    @Schema(description = "Can process payments", example = "false")
    private Boolean canProcessPayments;

    @Schema(description = "Can manage users", example = "false")
    private Boolean canManageUsers;

    @Schema(description = "Privacy policy acceptance", example = "true")
    @Builder.Default
    private Boolean privacyPolicyAccepted = false;

    @Schema(description = "Terms of service acceptance", example = "true")
    @Builder.Default
    private Boolean termsOfServiceAccepted = false;

    /** Validates that password and confirmation match */
    public boolean isPasswordMatching() {
        return password != null && password.equals(confirmPassword);
    }

    /** Validates that required consents are accepted */
    public boolean areConsentsAccepted() {
        return (
            Boolean.TRUE.equals(privacyPolicyAccepted) &&
            Boolean.TRUE.equals(termsOfServiceAccepted)
        );
    }

    /** Validates that the role is valid */
    public boolean isRoleValid() {
        return AdminRole.isValid(this.role);
    }

    /** Get the AdminRole enum from the role string */
    public AdminRole getAdminRole() {
        return AdminRole.fromString(this.role);
    }
}
