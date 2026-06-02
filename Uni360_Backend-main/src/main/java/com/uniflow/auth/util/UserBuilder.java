package com.uniflow.auth.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.uniflow.auth.entity.User;
import io.r2dbc.postgresql.codec.Json;
import java.time.LocalDateTime;
import lombok.extern.slf4j.Slf4j;

/**
 * Utility class for building User entities with JSONB data
 *
 * This utility helps construct User objects while properly handling
 * the JSONB data field for complex attributes.
 */
@Slf4j
public class UserBuilder {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    private final User.UserBuilder userBuilder;
    private final ObjectNode dataNode;

    private UserBuilder() {
        this.userBuilder = User.builder();
        this.dataNode = objectMapper.createObjectNode();
        initializeDefaultDataStructure();
    }

    public static UserBuilder newUser() {
        return new UserBuilder();
    }

    public static UserBuilder fromUser(User user) {
        UserBuilder builder = new UserBuilder();

        // Copy core fields
        builder.userBuilder
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .password(user.getPassword().orElse(null))
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .phoneNumber(user.getPhoneNumber())
            .userType(user.getUserType())
            .status(user.getStatus())
            .emailVerified(user.getEmailVerified())
            .phoneVerified(user.getPhoneVerified())
            .status(user.getIsActive() ? "ACTIVE" : "INACTIVE")
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .createdBy(user.getCreatedBy())
            .updatedBy(user.getUpdatedBy())
            .deleted(user.getDeleted());

        // Copy existing data if available
        if (user.getData() != null && user.getData().toString() != null) {
            try {
                builder.dataNode.setAll(
                    (ObjectNode) objectMapper.readTree(
                        user.getData().toString()
                    )
                );
            } catch (Exception e) {
                log.warn(
                    "Failed to parse existing user data: {}",
                    e.getMessage()
                );
            }
        }

        return builder;
    }

    private void initializeDefaultDataStructure() {
        dataNode.set("verification", objectMapper.createObjectNode());
        dataNode.set("profile", objectMapper.createObjectNode());
        dataNode.set("security", objectMapper.createObjectNode());
        dataNode.set("business", objectMapper.createObjectNode());
        dataNode.set("preferences", objectMapper.createObjectNode());
        dataNode.set("consent", objectMapper.createObjectNode());
        dataNode.set("metadata", objectMapper.createObjectNode());
    }

    // Core field builders
    public UserBuilder id(Long id) {
        userBuilder.id(id);
        return this;
    }

    public UserBuilder username(String username) {
        userBuilder.username(username);
        return this;
    }

    public UserBuilder email(String email) {
        userBuilder.email(email);
        return this;
    }

    public UserBuilder password(String password) {
        userBuilder.password(password);
        return this;
    }

    public UserBuilder firstName(String firstName) {
        userBuilder.firstName(firstName);
        return this;
    }

    public UserBuilder lastName(String lastName) {
        userBuilder.lastName(lastName);
        return this;
    }

    public UserBuilder phoneNumber(String phoneNumber) {
        userBuilder.phoneNumber(phoneNumber);
        return this;
    }

    public UserBuilder userType(String userType) {
        userBuilder.userType(userType);
        return this;
    }

    public UserBuilder status(String status) {
        userBuilder.status(status);
        return this;
    }

    public UserBuilder emailVerified(Boolean emailVerified) {
        userBuilder.emailVerified(emailVerified);
        return this;
    }

    public UserBuilder phoneVerified(Boolean phoneVerified) {
        userBuilder.phoneVerified(phoneVerified);
        return this;
    }

    public UserBuilder isActive(Boolean isActive) {
        if (isActive != null && isActive) {
            userBuilder.status("ACTIVE");
        } else {
            userBuilder.status("INACTIVE");
        }
        return this;
    }

    public UserBuilder createdBy(String createdBy) {
        userBuilder.createdBy(createdBy);
        return this;
    }

    public UserBuilder updatedBy(String updatedBy) {
        userBuilder.updatedBy(updatedBy);
        return this;
    }

    // Verification data builders
    public UserBuilder verificationToken(String token) {
        ((ObjectNode) dataNode.get("verification")).put(
            "verification_token",
            token
        );
        return this;
    }

    public UserBuilder verificationTokenExpiresAt(LocalDateTime expiresAt) {
        if (expiresAt != null) {
            ((ObjectNode) dataNode.get("verification")).put(
                "verification_token_expires_at",
                expiresAt.toString()
            );
        }
        return this;
    }

    public UserBuilder passwordResetToken(String token) {
        ((ObjectNode) dataNode.get("verification")).put(
            "password_reset_token",
            token
        );
        return this;
    }

    public UserBuilder passwordResetTokenExpiresAt(LocalDateTime expiresAt) {
        if (expiresAt != null) {
            ((ObjectNode) dataNode.get("verification")).put(
                "password_reset_token_expires_at",
                expiresAt.toString()
            );
        }
        return this;
    }

    // Profile data builders
    public UserBuilder avatarUrl(String avatarUrl) {
        if (avatarUrl != null) {
            ((ObjectNode) dataNode.get("profile")).put("avatar_url", avatarUrl);
        }
        return this;
    }

    public UserBuilder timezone(String timezone) {
        ((ObjectNode) dataNode.get("profile")).put(
            "timezone",
            timezone != null ? timezone : "UTC"
        );
        return this;
    }

    public UserBuilder language(String language) {
        ((ObjectNode) dataNode.get("profile")).put(
            "language",
            language != null ? language : "en"
        );
        return this;
    }

    public UserBuilder country(String country) {
        if (country != null) {
            ((ObjectNode) dataNode.get("profile")).put("country", country);
        }
        return this;
    }

    public UserBuilder city(String city) {
        if (city != null) {
            ((ObjectNode) dataNode.get("profile")).put("city", city);
        }
        return this;
    }

    public UserBuilder dateOfBirth(LocalDateTime dateOfBirth) {
        if (dateOfBirth != null) {
            ((ObjectNode) dataNode.get("profile")).put(
                "date_of_birth",
                dateOfBirth.toString()
            );
        }
        return this;
    }

    public UserBuilder gender(String gender) {
        if (gender != null) {
            ((ObjectNode) dataNode.get("profile")).put("gender", gender);
        }
        return this;
    }

    // Security data builders
    public UserBuilder lastLoginAt(LocalDateTime lastLoginAt) {
        if (lastLoginAt != null) {
            ((ObjectNode) dataNode.get("security")).put(
                "last_login_at",
                lastLoginAt.toString()
            );
        }
        return this;
    }

    public UserBuilder lastLoginIp(String lastLoginIp) {
        if (lastLoginIp != null) {
            ((ObjectNode) dataNode.get("security")).put(
                "last_login_ip",
                lastLoginIp
            );
        }
        return this;
    }

    public UserBuilder loginAttempts(Integer loginAttempts) {
        ((ObjectNode) dataNode.get("security")).put(
            "login_attempts",
            loginAttempts != null ? loginAttempts : 0
        );
        return this;
    }

    public UserBuilder lockedUntil(LocalDateTime lockedUntil) {
        if (lockedUntil != null) {
            ((ObjectNode) dataNode.get("security")).put(
                "locked_until",
                lockedUntil.toString()
            );
        }
        return this;
    }

    public UserBuilder forcePasswordChange(Boolean forcePasswordChange) {
        ((ObjectNode) dataNode.get("security")).put(
            "force_password_change",
            forcePasswordChange != null ? forcePasswordChange : false
        );
        return this;
    }

    public UserBuilder twoFactorEnabled(Boolean twoFactorEnabled) {
        ((ObjectNode) dataNode.get("security")).put(
            "two_factor_enabled",
            twoFactorEnabled != null ? twoFactorEnabled : false
        );
        return this;
    }

    public UserBuilder sessionTimeoutMinutes(Integer sessionTimeoutMinutes) {
        ((ObjectNode) dataNode.get("security")).put(
            "session_timeout_minutes",
            sessionTimeoutMinutes != null ? sessionTimeoutMinutes : 480
        );
        return this;
    }

    public UserBuilder passwordChangedAt(LocalDateTime passwordChangedAt) {
        if (passwordChangedAt != null) {
            ((ObjectNode) dataNode.get("security")).put(
                "password_changed_at",
                passwordChangedAt.toString()
            );
        }
        return this;
    }

    // Business data builders
    public UserBuilder clientType(String clientType) {
        ((ObjectNode) dataNode.get("business")).put(
            "client_type",
            clientType != null ? clientType : "UNIFLOW"
        );
        return this;
    }

    public UserBuilder territoryIdentifier(String territoryIdentifier) {
        if (territoryIdentifier != null) {
            ((ObjectNode) dataNode.get("business")).put(
                "territory_identifier",
                territoryIdentifier
            );
        }
        return this;
    }

    public UserBuilder organizationId(String organizationId) {
        if (organizationId != null) {
            ((ObjectNode) dataNode.get("business")).put(
                "organization_id",
                organizationId
            );
        }
        return this;
    }

    public UserBuilder department(String department) {
        if (department != null) {
            ((ObjectNode) dataNode.get("business")).put(
                "department",
                department
            );
        }
        return this;
    }

    public UserBuilder jobTitle(String jobTitle) {
        if (jobTitle != null) {
            ((ObjectNode) dataNode.get("business")).put("job_title", jobTitle);
        }
        return this;
    }

    // Preferences data builders
    public UserBuilder emailNotifications(Boolean emailNotifications) {
        ((ObjectNode) dataNode.get("preferences")).put(
            "email_notifications",
            emailNotifications != null ? emailNotifications : true
        );
        return this;
    }

    public UserBuilder smsNotifications(Boolean smsNotifications) {
        ((ObjectNode) dataNode.get("preferences")).put(
            "sms_notifications",
            smsNotifications != null ? smsNotifications : false
        );
        return this;
    }

    public UserBuilder pushNotifications(Boolean pushNotifications) {
        ((ObjectNode) dataNode.get("preferences")).put(
            "push_notifications",
            pushNotifications != null ? pushNotifications : true
        );
        return this;
    }

    // Consent data builders
    public UserBuilder privacyPolicyAccepted(Boolean privacyPolicyAccepted) {
        ((ObjectNode) dataNode.get("consent")).put(
            "privacy_policy_accepted",
            privacyPolicyAccepted != null ? privacyPolicyAccepted : false
        );
        return this;
    }

    public UserBuilder privacyPolicyAcceptedAt(
        LocalDateTime privacyPolicyAcceptedAt
    ) {
        if (privacyPolicyAcceptedAt != null) {
            ((ObjectNode) dataNode.get("consent")).put(
                "privacy_policy_accepted_at",
                privacyPolicyAcceptedAt.toString()
            );
        }
        return this;
    }

    public UserBuilder termsOfServiceAccepted(Boolean termsOfServiceAccepted) {
        ((ObjectNode) dataNode.get("consent")).put(
            "terms_of_service_accepted",
            termsOfServiceAccepted != null ? termsOfServiceAccepted : false
        );
        return this;
    }

    public UserBuilder termsOfServiceAcceptedAt(
        LocalDateTime termsOfServiceAcceptedAt
    ) {
        if (termsOfServiceAcceptedAt != null) {
            ((ObjectNode) dataNode.get("consent")).put(
                "terms_of_service_accepted_at",
                termsOfServiceAcceptedAt.toString()
            );
        }
        return this;
    }

    public UserBuilder marketingEmailsConsent(Boolean marketingEmailsConsent) {
        ((ObjectNode) dataNode.get("consent")).put(
            "marketing_emails_consent",
            marketingEmailsConsent != null ? marketingEmailsConsent : false
        );
        return this;
    }

    // Metadata builders
    public UserBuilder source(String source) {
        ((ObjectNode) dataNode.get("metadata")).put(
            "source",
            source != null ? source : "REGISTRATION"
        );
        return this;
    }

    public UserBuilder registrationIp(String registrationIp) {
        if (registrationIp != null) {
            ((ObjectNode) dataNode.get("metadata")).put(
                "registration_ip",
                registrationIp
            );
        }
        return this;
    }

    public UserBuilder userAgent(String userAgent) {
        if (userAgent != null) {
            ((ObjectNode) dataNode.get("metadata")).put(
                "user_agent",
                userAgent
            );
        }
        return this;
    }

    public UserBuilder utmSource(String utmSource) {
        if (utmSource != null) {
            ((ObjectNode) dataNode.get("metadata")).put(
                "utm_source",
                utmSource
            );
        }
        return this;
    }

    public UserBuilder utmCampaign(String utmCampaign) {
        if (utmCampaign != null) {
            ((ObjectNode) dataNode.get("metadata")).put(
                "utm_campaign",
                utmCampaign
            );
        }
        return this;
    }

    public UserBuilder referralCode(String referralCode) {
        if (referralCode != null) {
            ((ObjectNode) dataNode.get("metadata")).put(
                "referral_code",
                referralCode
            );
        }
        return this;
    }

    public UserBuilder externalUserId(String externalUserId) {
        if (externalUserId != null) {
            ((ObjectNode) dataNode.get("metadata")).put(
                "external_user_id",
                externalUserId
            );
        }
        return this;
    }

    public UserBuilder ldapDn(String ldapDn) {
        if (ldapDn != null) {
            ((ObjectNode) dataNode.get("metadata")).put("ldap_dn", ldapDn);
        }
        return this;
    }

    public UserBuilder ssoProvider(String ssoProvider) {
        if (ssoProvider != null) {
            ((ObjectNode) dataNode.get("metadata")).put(
                "sso_provider",
                ssoProvider
            );
        }
        return this;
    }

    public UserBuilder ssoExternalId(String ssoExternalId) {
        if (ssoExternalId != null) {
            ((ObjectNode) dataNode.get("metadata")).put(
                "sso_external_id",
                ssoExternalId
            );
        }
        return this;
    }

    // Build method
    public User build() {
        try {
            String jsonData = objectMapper.writeValueAsString(dataNode);
            userBuilder.data(objectMapper.readTree(jsonData));
        } catch (Exception e) {
            log.error(
                "Failed to serialize user data to JSON: {}",
                e.getMessage()
            );
            try {
                userBuilder.data(objectMapper.readTree("{}"));
            } catch (Exception ex) {
                // Fallback to null data
                userBuilder.data(null);
            }
        }

        return userBuilder.build();
    }
}
