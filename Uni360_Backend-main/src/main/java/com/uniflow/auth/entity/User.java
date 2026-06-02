package com.uniflow.auth.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.uniflow.auth.enums.AuthProvider;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.Optional;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * User Entity - Matches actual database schema
 * Only includes columns that actually exist in the users table
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@Table("users")
@JsonIgnoreProperties(ignoreUnknown = true)
public class User {

    @Id
    private Long id;

    @NotBlank(message = "Username is required")
    @Column("username")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Column("email")
    private String email;

    @JsonIgnore
    @Column("password")
    private String password;

    @Column("first_name")
    private String firstName;

    @Column("last_name")
    private String lastName;

    @Column("phone_number")
    private String phoneNumber;

    @NotNull
    @Builder.Default
    @Column("user_type")
    private String userType = "STUDENT"; // STUDENT, ADMIN, SUPER_ADMIN, CONSULTANT

    @NotNull
    @Builder.Default
    @Column("status")
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION

    @Builder.Default
    @Column("email_verified")
    private Boolean emailVerified = false;

    @Builder.Default
    @Column("phone_verified")
    private Boolean phoneVerified = false;

    @Builder.Default
    @Column("is_active")
    private Boolean isActive = true;

    @Column("data")
    private JsonNode data;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;

    @Column("created_by")
    private String createdBy;

    @Column("updated_by")
    private String updatedBy;

    @Builder.Default
    @Column("deleted")
    private Boolean deleted = false;

    // Google OAuth Integration Fields
    @Column("google_id")
    private String googleId;

    @NotNull
    @Builder.Default
    @Column("oauth_provider_code")
    private String oauthProviderCode = "LOCAL";

    // Google OAuth Getters
    public Optional<String> getGoogleId() {
        return Optional.ofNullable(googleId);
    }

    public AuthProvider getAuthProvider() {
        return AuthProvider.fromCode(oauthProviderCode).orElse(
            AuthProvider.LOCAL
        );
    }

    public Optional<String> getPassword() {
        return Optional.ofNullable(password);
    }

    // Authentication Support Checks
    public boolean supportsPasswordAuthentication() {
        return (
            getAuthProvider().requiresPasswordValidation() ||
            getAuthProvider() == AuthProvider.HYBRID
        );
    }

    public boolean supportsGoogleAuthentication() {
        return getAuthProvider().supportsOAuthLogin();
    }

    public boolean requiresPasswordForLogin() {
        return (
            getAuthProvider() == AuthProvider.LOCAL ||
            (getAuthProvider() == AuthProvider.HYBRID && password != null)
        );
    }

    // Functional Enhancement Methods
    public User withGoogleIntegration(
        String googleId,
        String firstName,
        String lastName,
        String email
    ) {
        AuthProvider currentProvider = getAuthProvider();
        AuthProvider newProvider = currentProvider == AuthProvider.LOCAL
            ? AuthProvider.HYBRID
            : AuthProvider.GOOGLE;

        return this.toBuilder()
            .googleId(googleId)
            .oauthProviderCode(newProvider.getCode())
            .firstName(firstName != null ? firstName : this.firstName)
            .lastName(lastName != null ? lastName : this.lastName)
            .email(email != null ? email : this.email)
            .emailVerified(true)
            .status("ACTIVE")   // Google has verified the email — activate immediately
            .build();
    }

    public User withoutPassword() {
        return this.toBuilder()
            .password(null)
            .oauthProviderCode(AuthProvider.GOOGLE.getCode())
            .build();
    }

    // Google-specific utility methods
    public Optional<String> getGoogleAvatarUrl() {
        return getGoogleId().map(id ->
            String.format(
                "https://lh3.googleusercontent.com/a/default-user=%s",
                id
            )
        );
    }

    public String getGoogleDisplayName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        }
        return getFullName();
    }

    public String getDisplayAvatarUrl() {
        return getGoogleAvatarUrl().orElse("https://via.placeholder.com/150");
    }

    // Static factory method for Google OAuth users
    public static User createGoogleUser(
        String googleId,
        String firstName,
        String lastName,
        String email,
        String username
    ) {
        return User.builder()
            .googleId(googleId)
            .oauthProviderCode(AuthProvider.GOOGLE.getCode())
            .firstName(firstName)
            .lastName(lastName)
            .email(email)
            .username(username)
            .emailVerified(true)
            .password(null)
            .build();
    }

    // Utility methods
    public boolean isAdmin() {
        return "ADMIN".equals(userType) || "SUPER_ADMIN".equals(userType);
    }

    public boolean isActive() {
        return (
            Boolean.TRUE.equals(isActive) &&
            !"SUSPENDED".equals(status) &&
            !Boolean.TRUE.equals(deleted)
        );
    }

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

    public boolean isEmailVerified() {
        return Boolean.TRUE.equals(emailVerified);
    }

    public boolean isPhoneVerified() {
        return Boolean.TRUE.equals(phoneVerified);
    }

    // Temporary placeholder methods to avoid compilation errors
    public boolean isAccountLocked() {
        return false;
    }
}
