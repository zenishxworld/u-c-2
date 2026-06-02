package com.uniflow.auth.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * LoginResponseDTO for user authentication responses
 *
 * <p>This DTO represents the response payload for successful user login operations. It contains JWT
 * tokens, user information, and session details required by client applications to maintain
 * authenticated sessions.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponseDTO {

  // Authentication tokens
  private String accessToken;

  private String refreshToken;

  @Builder.Default private String tokenType = "Bearer";

  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime expiresAt;

  private Long expiresIn; // seconds until expiration

  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime refreshExpiresAt;

  private Long refreshExpiresIn; // seconds until refresh token expiration

  // User information
  private Long userId;

  private String username;

  private String email;

  private String firstName;

  private String lastName;

  private String fullName;

  private String userType;

  private String status;

  private String avatarUrl;

  // Roles and permissions
  private List<String> roles;

  private List<String> permissions;

  private List<String> groups;

  // Business context
  private String clientType;

  private String territoryIdentifier;

  private String organizationId;

  private String department;

  // Session information
  private String sessionId;

  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime loginAt;

  private String loginIp;

  private String userAgent;

  private String deviceId;

  // User preferences
  private String timezone;

  private String language;

  private String country;

  // Security information
  private Boolean twoFactorEnabled;

  private Boolean emailVerified;

  private Boolean phoneVerified;

  private Boolean forcePasswordChange;

  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime passwordChangedAt;

  // Notification preferences
  private Boolean emailNotifications;

  private Boolean smsNotifications;

  private Boolean pushNotifications;

  // Login statistics
  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  private LocalDateTime lastLoginAt;

  private String lastLoginIp;

  private Integer totalLogins;

  // Account status flags
  private Boolean isFirstLogin;

  private Boolean requiresProfileCompletion;

  private Boolean requiresEmailVerification;

  private Boolean requiresPhoneVerification;

  private Boolean requiresTermsAcceptance;

  // Auth provider info — tells frontend which login methods are available
  private String authProvider;  // "LOCAL", "GOOGLE", or "HYBRID"

  private Boolean hasPassword;  // true if user has a bcrypt password set

  // Additional metadata
  private JsonNode metadata;

  private JsonNode preferences;

  // Token claims for client-side validation
  private String issuer;

  private String audience;

  private List<String> scopes;

  // Helper methods
  public String getDisplayName() {
    if (fullName != null && !fullName.trim().isEmpty()) {
      return fullName;
    } else if (firstName != null && lastName != null) {
      return firstName + " " + lastName;
    } else if (firstName != null) {
      return firstName;
    } else if (email != null) {
      return email;
    }
    return username;
  }

  public boolean hasRole(String role) {
    return roles != null && roles.contains(role);
  }

  public boolean hasAnyRole(List<String> rolesToCheck) {
    if (roles == null || rolesToCheck == null) return false;
    return roles.stream().anyMatch(rolesToCheck::contains);
  }

  public boolean hasPermission(String permission) {
    return permissions != null && permissions.contains(permission);
  }

  public boolean isAdmin() {
    return hasRole("ADMIN") || hasRole("SUPER_ADMIN");
  }

  public boolean isStudent() {
    return hasRole("STUDENT") || "STUDENT".equals(userType);
  }

  public boolean requiresAction() {
    return (Boolean.TRUE.equals(forcePasswordChange)
        || Boolean.TRUE.equals(requiresProfileCompletion)
        || Boolean.TRUE.equals(requiresEmailVerification)
        || Boolean.TRUE.equals(requiresPhoneVerification)
        || Boolean.TRUE.equals(requiresTermsAcceptance));
  }

  public boolean isTokenExpired() {
    return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
  }

  public boolean isRefreshTokenExpired() {
    return (refreshExpiresAt != null && LocalDateTime.now().isAfter(refreshExpiresAt));
  }
}
