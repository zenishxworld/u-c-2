package com.uniflow.auth.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** DTO for user registration responses */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "User registration response")
public class RegistrationResponseDTO {

    @Schema(description = "User ID", example = "12345")
    private Long userId;

    @Schema(description = "Username", example = "john.doe")
    private String username;

    @Schema(description = "Email address", example = "john.doe@email.com")
    private String email;

    @Schema(description = "First name", example = "John")
    private String firstName;

    @Schema(description = "Last name", example = "Doe")
    private String lastName;

    @Schema(description = "User type", example = "STUDENT")
    private String userType;

    @Schema(description = "Account status", example = "PENDING_VERIFICATION")
    private String status;

    @Schema(description = "Email verification status", example = "false")
    @JsonProperty("emailVerified")
    private Boolean emailVerified;

    @Schema(description = "Phone verification status", example = "false")
    @JsonProperty("phoneVerified")
    private Boolean phoneVerified;

    @Schema(
        description = "Registration timestamp",
        example = "2024-01-15T10:30:00"
    )
    private LocalDateTime registrationTime;

    @Schema(
        description = "Verification token (if email verification required)",
        example = "abc123def456"
    )
    private String verificationToken;

    @Schema(
        description = "Token expiration time",
        example = "2024-01-16T10:30:00"
    )
    private LocalDateTime verificationTokenExpiresAt;

    @Schema(
        description = "Whether email verification is required",
        example = "true"
    )
    @JsonProperty("requiresEmailVerification")
    private Boolean requiresEmailVerification;

    @Schema(description = "Next steps for the user")
    private String nextSteps;

    @Schema(description = "Welcome message")
    private String welcomeMessage;

    @Schema(description = "Profile completion URL")
    private String profileCompletionUrl;

    @Schema(description = "Login URL")
    private String loginUrl;

    /** Creates a response for successful student registration */
    public static RegistrationResponseDTO forStudent(
        Long userId,
        String username,
        String email,
        String firstName,
        String lastName,
        String verificationToken,
        LocalDateTime tokenExpiry
    ) {
        return RegistrationResponseDTO.builder()
            .userId(userId)
            .username(username)
            .email(email)
            .firstName(firstName)
            .lastName(lastName)
            .userType("STUDENT")
            .status("PENDING_VERIFICATION")
            .emailVerified(false)
            .phoneVerified(false)
            .registrationTime(LocalDateTime.now())
            .verificationToken(verificationToken)
            .verificationTokenExpiresAt(tokenExpiry)
            .requiresEmailVerification(true)
            .nextSteps(
                "Please check your email and click the verification link to activate your account."
            )
            .welcomeMessage(
                "Welcome to UniFLow! Your student account has been created successfully."
            )
            .profileCompletionUrl("/student/profile/complete")
            .loginUrl("/auth/login")
            .build();
    }

    /** Creates a response for successful admin registration */
    public static RegistrationResponseDTO forAdmin(
        Long userId,
        String username,
        String email,
        String firstName,
        String lastName,
        String userType,
        String verificationToken,
        LocalDateTime tokenExpiry
    ) {
        return RegistrationResponseDTO.builder()
            .userId(userId)
            .username(username)
            .email(email)
            .firstName(firstName)
            .lastName(lastName)
            .userType(userType)
            .status("PENDING_VERIFICATION")
            .emailVerified(false)
            .phoneVerified(false)
            .registrationTime(LocalDateTime.now())
            .verificationToken(verificationToken)
            .verificationTokenExpiresAt(tokenExpiry)
            .requiresEmailVerification(true)
            .nextSteps(
                "Please check your email and click the verification link to activate your admin account."
            )
            .welcomeMessage(
                "Welcome to UniFLow Admin! Your administrator account has been created successfully."
            )
            .profileCompletionUrl("/admin/profile/complete")
            .loginUrl("/auth/login")
            .build();
    }

    /** Creates a response for when email verification is not required */
    public static RegistrationResponseDTO withoutEmailVerification(
        Long userId,
        String username,
        String email,
        String firstName,
        String lastName,
        String userType
    ) {
        return RegistrationResponseDTO.builder()
            .userId(userId)
            .username(username)
            .email(email)
            .firstName(firstName)
            .lastName(lastName)
            .userType(userType)
            .status("ACTIVE")
            .emailVerified(true)
            .phoneVerified(false)
            .registrationTime(LocalDateTime.now())
            .requiresEmailVerification(false)
            .nextSteps("Your account is ready to use. You can now log in.")
            .welcomeMessage(
                "Welcome to UniFLow! Your account has been created and activated."
            )
            .loginUrl("/auth/login")
            .build();
    }
}
