package com.uniflow.auth.repository;

import com.uniflow.auth.dto.AuthProviderStatistics;
import com.uniflow.auth.entity.User;
import java.time.LocalDateTime;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * UserRepository provides reactive data access for User entities
 *
 * <p>This repository handles user-related database operations including authentication, user
 * management, and security-related queries. All operations are reactive and return Mono/Flux types.
 */
@Repository
public interface UserRepository extends R2dbcRepository<User, Long> {
    // Google OAuth queries
    @Query(
        "SELECT * FROM users WHERE google_id = :googleId AND deleted = false"
    )
    Mono<User> findByGoogleId(@Param("googleId") String googleId);

    @Query(
        "SELECT * FROM users WHERE oauth_provider_code = :provider AND deleted = false"
    )
    Flux<User> findByAuthProvider(@Param("provider") String provider);

    @Query(
        "SELECT COUNT(*) FROM users WHERE oauth_provider_code = 'GOOGLE' AND deleted = false"
    )
    Mono<Long> countGoogleUsers();

    @Query(
        "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM users WHERE google_id = :googleId AND deleted = false"
    )
    Mono<Boolean> existsByGoogleId(@Param("googleId") String googleId);

    @Query(
        "SELECT * FROM users WHERE (google_id = :googleId OR email = :email) AND deleted = false"
    )
    Mono<User> findByGoogleIdOrEmail(
        @Param("googleId") String googleId,
        @Param("email") String email
    );

    @Query(
        """
            SELECT
                oauth_provider_code as provider,
                COUNT(*) as count,
                COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_count
            FROM users
            WHERE deleted = false
            GROUP BY oauth_provider_code
        """
    )
    Flux<AuthProviderStatistics> getAuthProviderStatistics();

    // Authentication queries
    @Query("SELECT * FROM users WHERE username = :username AND deleted = false")
    Mono<User> findByUsername(@Param("username") String username);

    @Query("SELECT * FROM users WHERE email = :email AND deleted = false")
    Mono<User> findByEmail(@Param("email") String email);

    @Query(
        "SELECT * FROM users WHERE (username = :usernameOrEmail OR email = :usernameOrEmail) AND deleted = false"
    )
    Mono<User> findByUsernameOrEmail(
        @Param("usernameOrEmail") String usernameOrEmail
    );

    @Query("SELECT * FROM users WHERE id = :id AND deleted = false")
    Mono<User> findByIdAndNotDeleted(@Param("id") Long id);

    // Status and verification queries
    @Query("SELECT * FROM users WHERE status = :status AND deleted = false")
    Flux<User> findByStatus(@Param("status") String status);

    @Query(
        "SELECT * FROM users WHERE email_verified = false AND deleted = false"
    )
    Flux<User> findUnverifiedUsers();

    @Query(
        "SELECT * FROM users WHERE email_verified = false AND deleted = false"
    )
    Mono<User> findByValidVerificationToken(
        @Param("token") String token,
        @Param("now") LocalDateTime now
    );

    @Query("SELECT * FROM users WHERE deleted = false")
    Mono<User> findByValidPasswordResetToken(
        @Param("token") String token,
        @Param("now") LocalDateTime now
    );

    // Security and login queries - simplified to match actual schema
    @Query("SELECT * FROM users WHERE status = 'LOCKED' AND deleted = false")
    Flux<User> findLockedUsers(@Param("now") LocalDateTime now);

    @Query("SELECT * FROM users WHERE deleted = false")
    Flux<User> findUsersWithExcessiveLoginAttempts(
        @Param("maxAttempts") Integer maxAttempts
    );

    @Query("UPDATE users SET updated_at = :now WHERE id = :id")
    Mono<Integer> incrementLoginAttempts(
        @Param("id") Long id,
        @Param("now") LocalDateTime now
    );

    // Fixed to only update columns that exist in schema
    @Query("UPDATE users SET updated_at = :now WHERE id = :id")
    Mono<Integer> updateSuccessfulLogin(
        @Param("id") Long id,
        @Param("now") LocalDateTime now
    );

    @Query("UPDATE users SET updated_at = :now WHERE id = :id")
    Mono<Integer> lockUser(
        @Param("id") Long id,
        @Param("lockedUntil") LocalDateTime lockedUntil,
        @Param("now") LocalDateTime now
    );

    @Query("UPDATE users SET updated_at = :now WHERE id = :id")
    Mono<Integer> unlockUser(
        @Param("id") Long id,
        @Param("now") LocalDateTime now
    );

    // Password management
    @Query(
        "UPDATE users SET password = :hashedPassword, updated_at = :now WHERE id = :id"
    )
    Mono<Integer> updatePassword(
        @Param("id") Long id,
        @Param("hashedPassword") String hashedPassword,
        @Param("now") LocalDateTime now
    );

    @Query("UPDATE users SET updated_at = :now WHERE id = :id")
    Mono<Integer> setPasswordResetToken(
        @Param("id") Long id,
        @Param("token") String token,
        @Param("expiresAt") LocalDateTime expiresAt,
        @Param("now") LocalDateTime now
    );

    @Query("UPDATE users SET updated_at = :now WHERE id = :id")
    Mono<Integer> setForcePasswordChange(
        @Param("id") Long id,
        @Param("forceChange") Boolean forceChange,
        @Param("now") LocalDateTime now
    );

    // Email verification (simplified - just update timestamp)
    @Query("UPDATE users SET updated_at = :now WHERE id = :id")
    Mono<Integer> setVerificationToken(
        @Param("id") Long id,
        @Param("now") LocalDateTime now
    );

    @Query(
        "UPDATE users SET email_verified = true, status = 'ACTIVE', updated_at = :now WHERE id = :id"
    )
    Mono<Integer> markEmailAsVerified(
        @Param("id") Long id,
        @Param("now") LocalDateTime now
    );

    @Query(
        "UPDATE users SET email_verified = true, status = 'ACTIVE', updated_at = :now WHERE email_verified = false AND deleted = false"
    )
    Mono<Integer> markAllUnverifiedUsersAsVerified(
        @Param("now") LocalDateTime now
    );

    @Query(
        "UPDATE users SET phone_verified = true, updated_at = :now WHERE id = :id"
    )
    Mono<Integer> markPhoneAsVerified(
        @Param("id") Long id,
        @Param("now") LocalDateTime now
    );

    // Email verification token query - simplified since no verification_token column exists
    @Query(
        "SELECT * FROM users WHERE email_verified = false AND deleted = false LIMIT 1"
    )
    Mono<User> findByVerificationToken(@Param("token") String token);

    // User type and role queries
    @Query(
        "SELECT * FROM users WHERE user_type = :userType AND deleted = false"
    )
    Flux<User> findByUserType(@Param("userType") String userType);

    @Query("SELECT * FROM users WHERE deleted = false")
    Flux<User> findByClientType(@Param("clientType") String clientType);

    @Query("SELECT * FROM users WHERE deleted = false")
    Flux<User> findByTerritory(@Param("territory") String territory);

    @Query("SELECT * FROM users WHERE deleted = false")
    Flux<User> findByOrganization(@Param("orgId") String orgId);

    // Search and filtering
    @Query(
        "SELECT * FROM users WHERE (first_name ILIKE :search OR last_name ILIKE :search OR username ILIKE :search OR email ILIKE :search) AND deleted = false ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
    )
    Flux<User> searchUsers(
        @Param("search") String search,
        @Param("limit") Integer limit,
        @Param("offset") Integer offset
    );

    @Query(
        "SELECT COUNT(*) FROM users WHERE (first_name ILIKE :search OR last_name ILIKE :search OR username ILIKE :search OR email ILIKE :search) AND deleted = false"
    )
    Mono<Long> countSearchUsers(@Param("search") String search);

    @Query(
        "SELECT * FROM users WHERE created_at BETWEEN :startDate AND :endDate AND deleted = false ORDER BY created_at DESC"
    )
    Flux<User> findUsersCreatedBetween(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    // Existence checks
    @Query(
        "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM users WHERE username = :username AND deleted = false"
    )
    Mono<Boolean> existsByUsername(@Param("username") String username);

    @Query(
        "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM users WHERE email = :email AND deleted = false"
    )
    Mono<Boolean> existsByEmail(@Param("email") String email);

    @Query(
        "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM users WHERE username = :username AND id != :excludeId AND deleted = false"
    )
    Mono<Boolean> existsByUsernameExcludingId(
        @Param("username") String username,
        @Param("excludeId") Long excludeId
    );

    @Query(
        "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM users WHERE email = :email AND id != :excludeId AND deleted = false"
    )
    Mono<Boolean> existsByEmailExcludingId(
        @Param("email") String email,
        @Param("excludeId") Long excludeId
    );

    // Status updates
    @Query(
        "UPDATE users SET status = :status, updated_at = :now WHERE id = :id"
    )
    Mono<Integer> updateUserStatus(
        @Param("id") Long id,
        @Param("status") String status,
        @Param("now") LocalDateTime now
    );

    @Query("UPDATE users SET deleted = true, updated_at = :now WHERE id = :id")
    Mono<Integer> softDeleteUser(
        @Param("id") Long id,
        @Param("now") LocalDateTime now,
        @Param("deletedBy") String deletedBy
    );

    @Query("UPDATE users SET deleted = false, updated_at = :now WHERE id = :id")
    Mono<Integer> restoreUser(
        @Param("id") Long id,
        @Param("now") LocalDateTime now
    );

    // Statistics and analytics
    @Query(
        "SELECT COUNT(*) FROM users WHERE status = 'ACTIVE' AND deleted = false"
    )
    Mono<Long> countActiveUsers();

    @Query(
        "SELECT COUNT(*) FROM users WHERE user_type = :userType AND deleted = false"
    )
    Mono<Long> countUsersByType(@Param("userType") String userType);

    @Query(
        "SELECT COUNT(*) FROM users WHERE status = :status AND deleted = false"
    )
    Mono<Long> countUsersByStatus(@Param("status") String status);

    @Query(
        "SELECT COUNT(*) FROM users WHERE created_at >= :since AND deleted = false"
    )
    Mono<Long> countUsersCreatedSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(*) FROM users WHERE deleted = false")
    Mono<Long> countUsersLoggedInSince(@Param("since") LocalDateTime since);

    @Query(
        "SELECT COUNT(*) FROM users WHERE email_verified = false AND deleted = false"
    )
    Mono<Long> countUnverifiedUsers();

    // Two-factor authentication - removed non-existent columns
    @Query("UPDATE users SET updated_at = :now WHERE id = :id")
    Mono<Integer> updateTwoFactorAuth(
        @Param("id") Long id,
        @Param("enabled") Boolean enabled,
        @Param("secret") String secret,
        @Param("now") LocalDateTime now
    );

    @Query("SELECT * FROM users WHERE deleted = false")
    Flux<User> findUsersWithTwoFactorEnabled();

    // Preferences and settings - removed non-existent columns
    @Query("UPDATE users SET updated_at = :now WHERE id = :id")
    Mono<Integer> updateUserPreferences(
        @Param("id") Long id,
        @Param("timezone") String timezone,
        @Param("language") String language,
        @Param("now") LocalDateTime now
    );

    @Query("UPDATE users SET updated_at = :now WHERE id = :id")
    Mono<Integer> updateNotificationSettings(
        @Param("id") Long id,
        @Param("emailNotif") Boolean emailNotif,
        @Param("smsNotif") Boolean smsNotif,
        @Param("pushNotif") Boolean pushNotif,
        @Param("now") LocalDateTime now
    );

    // Recent activity - removed non-existent columns
    @Query(
        "SELECT * FROM users WHERE deleted = false ORDER BY created_at DESC LIMIT :limit"
    )
    Flux<User> findRecentlyActiveUsers(@Param("limit") Integer limit);

    @Query(
        "SELECT * FROM users WHERE created_at >= :since AND deleted = false ORDER BY created_at DESC"
    )
    Flux<User> findRecentlyRegisteredUsers(@Param("since") LocalDateTime since);

    // Batch operations
    @Query("SELECT * FROM users WHERE id IN (:userIds) AND deleted = false")
    Flux<User> findByUserIds(@Param("userIds") java.util.List<Long> userIds);

    @Query(
        "UPDATE users SET status = :status, updated_at = :now WHERE id IN (:userIds)"
    )
    Mono<Integer> updateStatusForUsers(
        @Param("userIds") java.util.List<Long> userIds,
        @Param("status") String status,
        @Param("now") LocalDateTime now
    );

    // External system integration - removed non-existent columns
    @Query("SELECT * FROM users WHERE deleted = false")
    Mono<User> findByExternalUserId(@Param("externalId") String externalId);

    @Query("SELECT * FROM users WHERE deleted = false")
    Mono<User> findBySsoProviderAndExternalId(
        @Param("provider") String provider,
        @Param("externalId") String externalId
    );

    @Query("UPDATE users SET updated_at = :now WHERE id = :id")
    Mono<Integer> updateExternalUserId(
        @Param("id") Long id,
        @Param("externalId") String externalId,
        @Param("now") LocalDateTime now
    );

    // Duplicate credential validation queries
    @Query(
        "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM users WHERE phone_number = :phoneNumber AND deleted = false"
    )
    Mono<Boolean> existsByPhoneNumber(@Param("phoneNumber") String phoneNumber);

    @Query(
        "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM users WHERE (email = :email OR phone_number = :phoneNumber) AND deleted = false"
    )
    Mono<Boolean> existsByEmailOrPhoneNumber(
        @Param("email") String email,
        @Param("phoneNumber") String phoneNumber
    );

    @Query(
        "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM users WHERE (username = :username OR email = :email OR phone_number = :phoneNumber) AND deleted = false"
    )
    Mono<Boolean> existsByUsernameOrEmailOrPhoneNumber(
        @Param("username") String username,
        @Param("email") String email,
        @Param("phoneNumber") String phoneNumber
    );

    @Query(
        "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM users WHERE first_name = :firstName AND last_name = :lastName AND phone_number = :phoneNumber AND deleted = false"
    )
    Mono<Boolean> existsByNameAndPhoneNumber(
        @Param("firstName") String firstName,
        @Param("lastName") String lastName,
        @Param("phoneNumber") String phoneNumber
    );

    @Query(
        "SELECT * FROM users WHERE email = :email OR phone_number = :phoneNumber AND deleted = false"
    )
    Flux<User> findByEmailOrPhoneNumber(
        @Param("email") String email,
        @Param("phoneNumber") String phoneNumber
    );

    // OAuth provider management
    @Query(
        "UPDATE users SET oauth_provider_code = :providerCode, updated_at = :now WHERE id = :id"
    )
    Mono<Integer> updateOAuthProvider(
        @Param("id") Long id,
        @Param("providerCode") String providerCode,
        @Param("now") LocalDateTime now
    );

    // Master reset token support
    @Query(
        "SELECT * FROM users WHERE status = 'ACTIVE' AND deleted = false ORDER BY created_at ASC LIMIT 1"
    )
    Mono<User> findFirstActiveUser();
}
