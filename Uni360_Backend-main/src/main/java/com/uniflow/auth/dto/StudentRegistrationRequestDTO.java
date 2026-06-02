package com.uniflow.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** DTO for student user registration requests */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Student user registration request")
public class StudentRegistrationRequestDTO {

    @Schema(
        description = "Username for the student account",
        example = "john.student"
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

    @Schema(description = "Email address", example = "john.student@email.com")
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;

    @Schema(description = "Password", example = "SecurePassword123!")
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
    @JsonProperty("confirmPassword")
    private String confirmPassword;

    @Schema(description = "User type", example = "STUDENT")
    @Builder.Default
    private String userType = "STUDENT";

    @Schema(description = "First name", example = "John")
    @NotBlank(message = "First name is required")
    @Size(
        min = 1,
        max = 100,
        message = "First name must be between 1 and 100 characters"
    )
    private String firstName;

    @Schema(description = "Last name", example = "Doe")
    @NotBlank(message = "Last name is required")
    @Size(
        min = 1,
        max = 100,
        message = "Last name must be between 1 and 100 characters"
    )
    private String lastName;

    @Schema(description = "Phone number (optional)", example = "+1234567890")
    @Pattern(
        regexp = "^\\+?[1-9]\\d{1,14}$",
        message = "Phone number must be valid"
    )
    private String phoneNumber;

    @Schema(description = "Date of birth", example = "1995-06-15")
    private LocalDate dateOfBirth;

    @Schema(
        description = "Gender",
        example = "MALE",
        allowableValues = { "MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY" }
    )
    private String gender;

    @Schema(description = "Country (optional)", example = "United States")
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

    @Schema(
        description = "Highest education level",
        example = "HIGH_SCHOOL",
        allowableValues = {
            "HIGH_SCHOOL",
            "DIPLOMA",
            "BACHELORS",
            "MASTERS",
            "DOCTORATE",
            "OTHER",
        }
    )
    private String educationLevel;

    @Schema(
        description = "Field of study interest",
        example = "Computer Science"
    )
    @Size(max = 200, message = "Field of study must not exceed 200 characters")
    private String fieldOfStudy;

    @Schema(
        description = "Target degree level",
        example = "BACHELORS",
        allowableValues = {
            "CERTIFICATE", "DIPLOMA", "BACHELORS", "MASTERS", "DOCTORATE",
        }
    )
    private String targetDegreeLevel;

    @Schema(
        description = "Preferred study mode",
        example = "FULL_TIME",
        allowableValues = { "FULL_TIME", "PART_TIME", "ONLINE", "HYBRID" }
    )
    @Builder.Default
    private String studyMode = "FULL_TIME";

    @Schema(description = "Territory identifier", example = "US-EAST")
    private String territoryIdentifier;

    @Schema(description = "Marketing source", example = "GOOGLE_ADS")
    private String utmSource;

    @Schema(description = "Marketing campaign", example = "SPRING_2024")
    private String utmCampaign;

    @Schema(description = "Referral code", example = "REF123")
    private String referralCode;

    @Schema(description = "Client IP address", hidden = true)
    private String ipAddress;

    @Schema(description = "User agent", hidden = true)
    private String userAgent;

    @Schema(description = "Privacy policy acceptance", example = "true")
    @Builder.Default
    private Boolean privacyPolicyAccepted = false;

    @Schema(description = "Terms of service acceptance", example = "true")
    @Builder.Default
    private Boolean termsOfServiceAccepted = false;

    @Schema(description = "Marketing emails consent", example = "false")
    @Builder.Default
    private Boolean marketingEmailsConsent = false;

    @Schema(description = "Email notifications preference", example = "true")
    @Builder.Default
    private Boolean emailNotifications = true;

    @Schema(description = "SMS notifications preference", example = "false")
    @Builder.Default
    private Boolean smsNotifications = false;

    @Schema(description = "Push notifications preference", example = "true")
    @Builder.Default
    private Boolean pushNotifications = true;

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

    /** Gets full name */
    public String getFullName() {
        return firstName + " " + lastName;
    }

    /** Validates password is present and valid for local registration */
    public boolean isPasswordValid() {
        return (
            password != null &&
            !password.trim().isEmpty() &&
            password.length() >= 8 &&
            password.length() <= 128
        );
    }

    /** Check if this is an OAuth registration (no password required) */
    public boolean isOAuthRegistration() {
        return password == null || password.trim().isEmpty();
    }

    /** Functional validation for OAuth registration */
    public static final java.util.function.Predicate<
        StudentRegistrationRequestDTO
    > IS_OAUTH_VALID = request ->
        request != null &&
        request.isOAuthRegistration() &&
        request.getEmail() != null &&
        !request.getEmail().isEmpty();

    /** Functional validation for local registration */
    public static final java.util.function.Predicate<
        StudentRegistrationRequestDTO
    > IS_LOCAL_VALID = request ->
        request != null &&
        !request.isOAuthRegistration() &&
        request.isPasswordValid() &&
        request.isPasswordMatching();
}
