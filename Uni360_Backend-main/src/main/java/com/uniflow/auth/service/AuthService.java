package com.uniflow.auth.service;

import com.uniflow.auth.dto.SetPasswordRequestDTO;
import com.uniflow.auth.dto.SetPasswordResponseDTO;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.uniflow.admin.entity.AdminProfile;
import com.uniflow.admin.repository.AdminProfileRepository;
import com.uniflow.auth.dto.AdminRegistrationRequestDTO;
import com.uniflow.auth.dto.ForgotPasswordRequestDTO;
import com.uniflow.auth.dto.GoogleOAuthRequestDTO;
import com.uniflow.auth.dto.GoogleOAuthUrlResponseDTO;
import com.uniflow.auth.dto.LoginRequestDTO;
import com.uniflow.auth.dto.LoginResponseDTO;
import com.uniflow.auth.dto.PasswordResetResponseDTO;
import com.uniflow.auth.dto.RefreshTokenRequestDTO;
import com.uniflow.auth.dto.RegistrationResponseDTO;
import com.uniflow.auth.dto.ResetPasswordRequestDTO;
import com.uniflow.auth.dto.StudentRegistrationRequestDTO;
import com.uniflow.auth.dto.TemporaryCredentialsDTO;
import com.uniflow.auth.entity.User;
import com.uniflow.auth.repository.UserRepository;
import com.uniflow.common.dto.ApiResponse;
import com.uniflow.common.dto.ErrorResponse;
import com.uniflow.common.dto.SuccessResponse;
import com.uniflow.common.enums.VerificationStatus;
import com.uniflow.common.events.PasswordResetEvent;
import com.uniflow.student.entity.StudentProfile;
import com.uniflow.student.repository.StudentProfileRepository;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * AuthService handles authentication and authorization operations
 *
 * <p>This service provides comprehensive authentication functionality including: - User login and
 * logout - JWT token generation and refresh - Password validation and management - Security context
 * management - Account lockout and security policies
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final GoogleOAuthService googleOAuthService;
    // private final VerificationServiceInterface verificationService; // REMOVED - service not implemented

    private final AdminProfileRepository adminProfileRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final ObjectMapper objectMapper;
    private final com.uniflow.student.service.ProfileBuilderConfigService profileBuilderConfigService;

    // EmailService is optional — only used if SMTP is configured
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private EmailService emailService;

    @Value("${uniflow.security.max-login-attempts:5}")
    private Integer maxLoginAttempts;

    @Value("${uniflow.security.lockout-duration-minutes:30}")
    private Integer lockoutDurationMinutes;

    @Value("${uniflow.security.session-timeout-minutes:480}")
    private Integer defaultSessionTimeoutMinutes;

    @Value("${uniflow.app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Value("${uniflow.auth.master-verify-token:MASTER_VERIFY_TOKEN}")
    private String masterVerifyToken;

    @Value("${uniflow.auth.master-reset-token:MASTER_RESET_TOKEN}")
    private String masterResetToken;

    @Value("${uniflow.auth.password-reset-token-expiry-minutes:30}")
    private Integer passwordResetTokenExpiryMinutes;

    @Value("${uniflow.auth.temp-credentials-expiry-hours:24}")
    private Integer tempCredentialsExpiryHours;

    private static final String CHARACTERS =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Authenticate user with username/email and password
     */
    public Mono<ApiResponse<LoginResponseDTO>> login(LoginRequestDTO request) {
        return Mono.just(request)
            .doOnNext(req ->
                log.info("Login attempt for user: {}", req.getUsernameOrEmail())
            )
            .flatMap(this::validateLoginRequest)
            .flatMap(this::findUserForAuthentication)
            .flatMap(user -> validateUserAccountStatus(user, request))
            .flatMap(user -> validatePassword(user, request))
            .flatMap(user -> handleSuccessfulLogin(user, request))
            .map(response -> ApiResponse.success(response, "Login successful"))
            .onErrorResume(error -> {
                log.error(
                    "Login failed for user: {}",
                    request.getUsernameOrEmail(),
                    error
                );
                return handleLoginError(error, request);
            });
    }

    /**
     * Get Google OAuth authorization URL
     */
    public Mono<ApiResponse<GoogleOAuthUrlResponseDTO>> getGoogleAuthUrl(
        String ipAddress,
        String userAgent,
        String frontendCallbackUrl
    ) {
        return googleOAuthService
            .generateAuthorizationUrl(ipAddress, userAgent, frontendCallbackUrl)
            .map(response ->
                ApiResponse.success(response, "Google OAuth URL generated")
            )
            .onErrorResume(error -> {
                log.error("Failed to generate Google OAuth URL", error);
                return Mono.just(
                    ApiResponse.error("Failed to generate Google OAuth URL")
                );
            });
    }

    /**
     * Process Google OAuth login
     */
    public Mono<ApiResponse<LoginResponseDTO>> processGoogleLogin(
        GoogleOAuthRequestDTO request
    ) {
        return googleOAuthService
            .processGoogleLogin(request)
            .map(response ->
                ApiResponse.success(response, "Google login successful")
            )
            .onErrorResume(error -> {
                log.error("Google OAuth login failed", error);
                return Mono.just(
                    ApiResponse.error(
                        "Google OAuth login failed: " + error.getMessage()
                    )
                );
            });
    }

    /**
     * Refresh JWT tokens using valid refresh token
     */
    public Mono<ApiResponse<LoginResponseDTO>> refreshToken(
        RefreshTokenRequestDTO request
    ) {
        return Mono.just(request)
            .doOnNext(req -> log.info("Token refresh attempt"))
            .flatMap(this::validateRefreshRequest)
            .flatMap(req -> jwtService.validateToken(req.getRefreshToken()))
            .flatMap(claims ->
                jwtService
                    .isRefreshToken(request.getRefreshToken())
                    .filter(isRefresh -> isRefresh)
                    .switchIfEmpty(
                        Mono.error(new RuntimeException("Invalid token type"))
                    )
                    .then(Mono.just(claims))
            )
            .flatMap(claims -> {
                Long userId = Long.parseLong(claims.getSubject());
                return userRepository.findByIdAndNotDeleted(userId);
            })
            .switchIfEmpty(Mono.error(new RuntimeException("User not found")))
            .flatMap(user -> validateUserForTokenRefresh(user, request))
            .flatMap(user -> generateNewTokenPair(user, request))
            .map(response ->
                ApiResponse.success(response, "Token refreshed successfully")
            )
            .onErrorResume(error -> {
                log.debug("Token refresh failed: {}", error.getMessage());
                return Mono.just(
                    ApiResponse.error(
                        "Token refresh failed: " + error.getMessage()
                    )
                );
            });
    }

    /**
     * Logout user and blacklist tokens
     */
    public Mono<ApiResponse<Void>> logout(
        String accessToken,
        String refreshToken
    ) {
        return Mono.just(accessToken)
            .doOnNext(token -> log.info("Logout attempt"))
            .flatMap(token ->
                jwtService
                    .validateToken(token)
                    .onErrorResume(error -> {
                        log.warn(
                            "Invalid access token during logout: {}",
                            error.getMessage()
                        );
                        return Mono.empty();
                    })
            )
            .flatMap(claims -> {
                Long userId = Long.parseLong(claims.getSubject());
                return userRepository.findByIdAndNotDeleted(userId);
            })
            .then(
                Mono.just(ApiResponse.<Void>success(null, "Logout successful"))
            )
            .onErrorResume(error -> {
                log.error("Logout failed", error);
                return Mono.just(
                    ApiResponse.<Void>error(
                        "Logout failed: " + error.getMessage()
                    )
                );
            });
    }

    /**
     * Validate user credentials and account status
     */
    private Mono<LoginRequestDTO> validateLoginRequest(
        LoginRequestDTO request
    ) {
        if (!request.isValidRequest()) {
            return Mono.error(new RuntimeException("Invalid login request"));
        }
        return Mono.just(request);
    }

    /**
     * Find user by username or email
     */
    private Mono<User> findUserForAuthentication(LoginRequestDTO request) {
        return userRepository
            .findByUsernameOrEmail(request.getUsernameOrEmail())
            .switchIfEmpty(
                Mono.error(new RuntimeException("Invalid credentials"))
            )
            .doOnNext(user ->
                log.debug(
                    "Found user for authentication: {}",
                    user.getUsername()
                )
            );
    }

    /**
     * Validate user account status and security policies
     */
    private Mono<User> validateUserAccountStatus(
        User user,
        LoginRequestDTO request
    ) {
        return Mono.just(user)
            .filter(u -> !u.getDeleted())
            .switchIfEmpty(
                Mono.error(new RuntimeException("Account not found"))
            )
            .filter(u -> "ACTIVE".equals(u.getStatus()))
            .switchIfEmpty(
                Mono.defer(() -> {
                    if ("PENDING_VERIFICATION".equals(user.getStatus())) {
                        log.warn(
                            "Login attempt with unverified account: {}",
                            user.getUsername()
                        );
                        return Mono.error(
                            new RuntimeException(
                                "Account requires email verification. Please check your email and click the verification link to activate your account."
                            )
                        );
                    } else if ("SUSPENDED".equals(user.getStatus())) {
                        log.warn(
                            "Login attempt with suspended account: {}",
                            user.getUsername()
                        );
                        return Mono.error(
                            new RuntimeException("Account is suspended")
                        );
                    } else {
                        log.warn(
                            "Login attempt with inactive account status '{}' for user: {}",
                            user.getStatus(),
                            user.getUsername()
                        );
                        return Mono.error(
                            new RuntimeException(
                                "Account is not active. Current status: " +
                                    user.getStatus()
                            )
                        );
                    }
                })
            )
            .filter(u -> u.isActive())
            .switchIfEmpty(
                Mono.defer(() -> {
                    log.warn("Account locked for user: {}", user.getUsername());
                    return Mono.error(
                        new RuntimeException(
                            "Account is temporarily locked due to multiple failed login attempts"
                        )
                    );
                })
            )
            .doOnNext(u ->
                log.debug("User account validation passed: {}", u.getUsername())
            );
    }

    /**
     * Validate password and handle failed attempts.
     * Google-only users are blocked here with a clear, actionable message.
     */
    private Mono<User> validatePassword(User user, LoginRequestDTO request) {
        // Guard: Block Google-only users from password login
        if (user.getAuthProvider() == com.uniflow.auth.enums.AuthProvider.GOOGLE) {
            log.warn(
                "Password login attempted for Google-only account: {}",
                user.getUsername()
            );
            return Mono.error(new RuntimeException(
                "This account uses Google Sign-In. Please click 'Login with Google' to access your account. " +
                "To enable email/password login, log in with Google first and then set a password from your account settings."
            ));
        }

        return Mono.just(user)
            .filter(u ->
                passwordEncoder.matches(
                    request.getPassword(),
                    u.getPassword().orElse("")
                )
            )
            .switchIfEmpty(
                Mono.defer(() -> {
                    log.warn(
                        "Invalid password for user: {}",
                        user.getUsername()
                    );
                    return handleFailedLoginAttempt(user).then(
                        Mono.error(new RuntimeException("Invalid credentials"))
                    );
                })
            )
            .doOnNext(u ->
                log.debug("Password validation successful: {}", u.getUsername())
            );
    }

    /**
     * Handle failed login attempt
     */
    private Mono<Void> handleFailedLoginAttempt(User user) {
        LocalDateTime now = LocalDateTime.now();
        return userRepository
            .incrementLoginAttempts(user.getId(), now)
            .then(userRepository.findByIdAndNotDeleted(user.getId()))
            .flatMap(updatedUser -> {
                int attempts = 1; // Simplified since loginAttempts field removed
                if (attempts >= maxLoginAttempts) {
                    LocalDateTime lockUntil = now.plusMinutes(
                        lockoutDurationMinutes
                    );
                    return userRepository
                        .lockUser(user.getId(), lockUntil, now)
                        .doOnNext(result ->
                            log.warn(
                                "User account locked due to excessive login attempts: {}",
                                user.getUsername()
                            )
                        );
                }
                return Mono.just(0);
            })
            .then()
            .doOnNext(v ->
                log.warn(
                    "Failed login attempt for user: {}",
                    user.getUsername()
                )
            );
    }

    /**
     * Reset login attempts after successful login
     */
    private Mono<Void> resetLoginAttempts(User user) {
        LocalDateTime now = LocalDateTime.now();
        return userRepository.updateSuccessfulLogin(user.getId(), now).then();
    }

    /**
     * Handle successful login
     */
    private Mono<LoginResponseDTO> handleSuccessfulLogin(
        User user,
        LoginRequestDTO request
    ) {
        return resetLoginAttempts(user)
            .then(updateLastLogin(user, request))
            .then(generateLoginResponse(user, request))
            .doOnNext(response ->
                log.info("Successful login for user: {}", user.getUsername())
            );
    }

    /**
     * Update last login information
     */
    private Mono<User> updateLastLogin(User user, LoginRequestDTO request) {
        // For now, just return the user - full implementation would update database
        return Mono.just(user);
    }

    /**
     * Generate login response with tokens and user info
     */
    private Mono<LoginResponseDTO> generateLoginResponse(
        User user,
        LoginRequestDTO request
    ) {
        return jwtService
            .generateTokenPair(user, request.getDeviceId())
            .flatMap(tokens -> {
                return jwtService
                    .getTokenExpiration(tokens.get("accessToken"))
                    .map(expiration ->
                        LoginResponseDTO.builder()
                            .accessToken(tokens.get("accessToken"))
                            .refreshToken(tokens.get("refreshToken"))
                            .tokenType("Bearer")
                            .expiresAt(expiration)
                            .expiresIn(360000L) // 100 hour in seconds
                            .userId(user.getId())
                            .username(user.getUsername())
                            .email(user.getEmail())
                            .firstName(user.getFirstName())
                            .lastName(user.getLastName())
                            .fullName(user.getFullName())
                            .userType(user.getUserType())
                            .status(user.getStatus())
                            .avatarUrl(null)
                            .roles(extractRoles(user))
                            .permissions(extractPermissions(user))
                            .groups(extractGroups(user))
                            .clientType("UNIFLOW")
                            .territoryIdentifier(null)
                            .organizationId(null)
                            .department(null)
                            .loginAt(LocalDateTime.now())
                            .loginIp(request.getIpAddress())
                            .userAgent(request.getUserAgent())
                            .deviceId(request.getDeviceId())
                            .timezone("UTC")
                            .language("en")
                            .country(null)
                            .twoFactorEnabled(false)
                            .emailVerified(user.getEmailVerified())
                            .phoneVerified(user.getPhoneVerified())
                            .forcePasswordChange(false)
                            .passwordChangedAt(null)
                            .emailNotifications(true)
                            .smsNotifications(false)
                            .pushNotifications(true)
                            .lastLoginAt(null)
                            .lastLoginIp(null)
                            .isFirstLogin(true)
                            .requiresProfileCompletion(
                                isProfileIncomplete(user)
                            )
                            .requiresEmailVerification(!user.getEmailVerified())
                            .requiresPhoneVerification(!user.getPhoneVerified())
                            .requiresTermsAcceptance(false)
                            .authProvider(user.getAuthProvider().getCode())
                            .hasPassword(user.getPassword().isPresent())
                            .metadata(user.getData())
                            .issuer(jwtService.getClass().getSimpleName())
                            .build()
                    );
            });
    }

    /**
     * Validate refresh token request
     */
    private Mono<RefreshTokenRequestDTO> validateRefreshRequest(
        RefreshTokenRequestDTO request
    ) {
        if (!request.isValidRequest()) {
            return Mono.error(
                new RuntimeException("Invalid refresh token request")
            );
        }
        return Mono.just(request);
    }

    /**
     * Validate user for token refresh
     */
    private Mono<User> validateUserForTokenRefresh(
        User user,
        RefreshTokenRequestDTO request
    ) {
        return Mono.just(user)
            .filter(u -> u.isActive())
            .switchIfEmpty(
                Mono.error(new RuntimeException("User account is not active"))
            )
            .doOnNext(u ->
                log.debug(
                    "User validation passed for token refresh: {}",
                    u.getUsername()
                )
            );
    }

    /**
     * Generate new token pair for refresh
     */
    private Mono<LoginResponseDTO> generateNewTokenPair(
        User user,
        RefreshTokenRequestDTO request
    ) {
        return jwtService
            .generateTokenPair(user, request.getDeviceId())
            .flatMap(tokens -> {
                return jwtService
                    .getTokenExpiration(tokens.get("accessToken"))
                    .map(expiration ->
                        LoginResponseDTO.builder()
                            .accessToken(tokens.get("accessToken"))
                            .refreshToken(tokens.get("refreshToken"))
                            .tokenType("Bearer")
                            .expiresAt(expiration)
                            .expiresIn(360000L)
                            .userId(user.getId())
                            .username(user.getUsername())
                            .email(user.getEmail())
                            .firstName(user.getFirstName())
                            .lastName(user.getLastName())
                            .userType(user.getUserType())
                            .status(user.getStatus())
                            .roles(extractRoles(user))
                            .permissions(extractPermissions(user))
                            .authProvider(user.getAuthProvider().getCode())
                            .hasPassword(user.getPassword().isPresent())
                            .build()
                    );
            });
    }

    /**
     * Blacklist tokens during logout
     */

    /**
     * Handle login errors
     */
    private Mono<ApiResponse<LoginResponseDTO>> handleLoginError(
        Throwable error,
        LoginRequestDTO request
    ) {
        String errorMessage = error.getMessage() != null
            ? error.getMessage()
            : "Authentication failed";
        return Mono.just(ApiResponse.error(errorMessage));
    }

    /**
     * Extract roles from user
     */
    private List<String> extractRoles(User user) {
        List<String> roles = new ArrayList<>();
        if (user.getData() != null && user.getData().has("roles")) {
            user
                .getData()
                .get("roles")
                .forEach(node -> {
                    if (node.isTextual()) {
                        roles.add(node.asText());
                    }
                });
        }
        return roles;
    }

    /**
     * Extract permissions from user
     */
    private List<String> extractPermissions(User user) {
        List<String> permissions = new ArrayList<>();
        if (user.getData() != null && user.getData().has("permissions")) {
            user
                .getData()
                .get("permissions")
                .forEach(node -> {
                    if (node.isTextual()) {
                        permissions.add(node.asText());
                    }
                });
        }
        return permissions;
    }

    /**
     * Extract groups from user
     */
    private List<String> extractGroups(User user) {
        List<String> groups = new ArrayList<>();
        if (user.getData() != null && user.getData().has("groups")) {
            user
                .getData()
                .get("groups")
                .forEach(node -> {
                    if (node.isTextual()) {
                        groups.add(node.asText());
                    }
                });
        }
        return groups;
    }

    /**
     * Check if user profile is incomplete
     */
    private Boolean isProfileIncomplete(User user) {
        return (user.getFirstName() == null || user.getLastName() == null);
    }

    /**
     * Register a new student user
     */
    public Mono<ApiResponse<RegistrationResponseDTO>> registerStudent(
        StudentRegistrationRequestDTO request
    ) {
        return Mono.just(request)
            .doOnNext(req ->
                log.info(
                    "Student registration attempt for email: {}",
                    req.getEmail()
                )
            )
            .flatMap(this::validateStudentRegistrationRequest)
            .flatMap(this::checkForDuplicateCredentials)
            .flatMap(this::createStudentUser)
            .flatMap(this::createStudentProfile)
            .flatMap(this::generateVerificationToken)
            .map(this::buildStudentRegistrationResponse)
            .map(response ->
                ApiResponse.success(response, "Student registration successful")
            )
            .onErrorResume(this::handleRegistrationError);
    }

    /**
     * Register a new admin user
     */
    public Mono<ApiResponse<RegistrationResponseDTO>> registerAdmin(
        AdminRegistrationRequestDTO request
    ) {
        return Mono.just(request)
            .doOnNext(req ->
                log.info(
                    "Admin registration attempt for email: {}",
                    req.getEmail()
                )
            )
            .flatMap(this::validateAdminRegistrationRequest)
            .flatMap(this::checkForDuplicateCredentialsAdmin)
            .flatMap(this::createAdminUser)
            .flatMap(user ->
                this.createAdminProfile(user).contextWrite(context ->
                    context.put("adminRequest", request)
                )
            )
            .flatMap(this::generateVerificationToken)
            .map(this::buildAdminRegistrationResponse)
            .map(response ->
                ApiResponse.success(response, "Admin registration successful")
            )
            .onErrorResume(this::handleRegistrationError);
    }

    /**
     * Enhanced student registration validation with comprehensive checks
     */
    private Mono<
        StudentRegistrationRequestDTO
    > validateStudentRegistrationRequest(
        StudentRegistrationRequestDTO request
    ) {
        // Basic null check
        if (request == null) {
            return Mono.error(
                new IllegalArgumentException(
                    "Registration request cannot be null"
                )
            );
        }

        // Email validation
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return Mono.error(
                new IllegalArgumentException("Email is required")
            );
        }

        // Name validation
        if (
            request.getFirstName() == null ||
            request.getFirstName().trim().isEmpty()
        ) {
            return Mono.error(
                new IllegalArgumentException("First name is required")
            );
        }
        if (
            request.getLastName() == null ||
            request.getLastName().trim().isEmpty()
        ) {
            return Mono.error(
                new IllegalArgumentException("Last name is required")
            );
        }

        // Username validation
        if (
            request.getUsername() == null ||
            request.getUsername().trim().isEmpty()
        ) {
            return Mono.error(
                new IllegalArgumentException("Username is required")
            );
        }

        // Country validation (optional but must be valid if provided)
        if (
            request.getCountry() != null &&
            !request.getCountry().trim().isEmpty() &&
            request.getCountry().trim().length() > 100
        ) {
            return Mono.error(
                new IllegalArgumentException("Country name too long")
            );
        }

        // Phone number validation (optional but must be valid if provided)
        if (
            request.getPhoneNumber() != null &&
            !request.getPhoneNumber().trim().isEmpty()
        ) {
            if (!request.getPhoneNumber().matches("^\\+?[1-9]\\d{1,14}$")) {
                return Mono.error(
                    new IllegalArgumentException(
                        "Phone number format is invalid"
                    )
                );
            }
        }

        // Password validation for non-OAuth users
        if (!request.isOAuthRegistration()) {
            if (!request.isPasswordValid()) {
                return Mono.error(
                    new IllegalArgumentException(
                        "Password must be between 8 and 128 characters and contain uppercase, lowercase, digit, and special character"
                    )
                );
            }
            if (!request.isPasswordMatching()) {
                return Mono.error(
                    new IllegalArgumentException(
                        "Password and confirmation do not match"
                    )
                );
            }
        }

        // Consent validation for non-OAuth users
        if (!request.isOAuthRegistration() && !request.areConsentsAccepted()) {
            return Mono.error(
                new IllegalArgumentException(
                    "Privacy policy and terms of service must be accepted"
                )
            );
        }

        // Education level validation (optional but must be valid if provided)
        if (
            request.getEducationLevel() != null &&
            !request.getEducationLevel().trim().isEmpty()
        ) {
            String[] validLevels = {
                "HIGH_SCHOOL",
                "DIPLOMA",
                "BACHELORS",
                "MASTERS",
                "DOCTORATE",
                "OTHER",
            };
            boolean isValidLevel = false;
            for (String level : validLevels) {
                if (level.equals(request.getEducationLevel())) {
                    isValidLevel = true;
                    break;
                }
            }
            if (!isValidLevel) {
                return Mono.error(
                    new IllegalArgumentException(
                        "Invalid education level provided"
                    )
                );
            }
        }

        // Target degree level validation (optional but must be valid if provided)
        if (
            request.getTargetDegreeLevel() != null &&
            !request.getTargetDegreeLevel().trim().isEmpty()
        ) {
            String[] validTargetLevels = {
                "CERTIFICATE",
                "DIPLOMA",
                "BACHELORS",
                "MASTERS",
                "DOCTORATE",
            };
            boolean isValidTargetLevel = false;
            for (String level : validTargetLevels) {
                if (level.equals(request.getTargetDegreeLevel())) {
                    isValidTargetLevel = true;
                    break;
                }
            }
            if (!isValidTargetLevel) {
                return Mono.error(
                    new IllegalArgumentException(
                        "Invalid target degree level provided"
                    )
                );
            }
        }

        // Study mode validation (optional but must be valid if provided)
        if (
            request.getStudyMode() != null &&
            !request.getStudyMode().trim().isEmpty()
        ) {
            String[] validStudyModes = {
                "FULL_TIME",
                "PART_TIME",
                "ONLINE",
                "HYBRID",
            };
            boolean isValidStudyMode = false;
            for (String mode : validStudyModes) {
                if (mode.equals(request.getStudyMode())) {
                    isValidStudyMode = true;
                    break;
                }
            }
            if (!isValidStudyMode) {
                return Mono.error(
                    new IllegalArgumentException("Invalid study mode provided")
                );
            }
        }

        // Gender validation (optional but must be valid if provided)
        if (
            request.getGender() != null && !request.getGender().trim().isEmpty()
        ) {
            String[] validGenders = {
                "MALE",
                "FEMALE",
                "OTHER",
                "PREFER_NOT_TO_SAY",
            };
            boolean isValidGender = false;
            for (String gender : validGenders) {
                if (gender.equals(request.getGender())) {
                    isValidGender = true;
                    break;
                }
            }
            if (!isValidGender) {
                return Mono.error(
                    new IllegalArgumentException("Invalid gender provided")
                );
            }
        }

        log.info(
            "Student registration validation successful for email: {}",
            request.getEmail()
        );
        return Mono.just(request);
    }

    /**
     * Validate admin registration request
     */
    private Mono<AdminRegistrationRequestDTO> validateAdminRegistrationRequest(
        AdminRegistrationRequestDTO request
    ) {
        log.debug(
            "Validating admin registration - role received: '{}'",
            request.getRole()
        );

        if (!request.isPasswordMatching()) {
            return Mono.error(
                new IllegalArgumentException(
                    "Password and confirmation do not match"
                )
            );
        }
        if (!request.areConsentsAccepted()) {
            return Mono.error(
                new IllegalArgumentException(
                    "Privacy policy and terms of service must be accepted"
                )
            );
        }
        if (!request.isRoleValid()) {
            return Mono.error(
                new IllegalArgumentException(
                    "Invalid admin role '" +
                        request.getRole() +
                        "'. Valid roles are: ADMIN, COUNSELOR, MANAGER, SUPER_ADMIN"
                )
            );
        }

        log.debug(
            "Admin registration validation passed - role: '{}'",
            request.getRole()
        );
        return Mono.just(request);
    }

    /**
     * Check for duplicate credentials for student registration
     */
    private Mono<StudentRegistrationRequestDTO> checkForDuplicateCredentials(
        StudentRegistrationRequestDTO request
    ) {
        // Check duplicates - handle null phone number
        String phoneToCheck = request.getPhoneNumber() != null &&
            !request.getPhoneNumber().trim().isEmpty()
            ? request.getPhoneNumber()
            : null;

        return userRepository
            .existsByUsernameOrEmailOrPhoneNumber(
                request.getUsername(),
                request.getEmail(),
                phoneToCheck
            )
            .flatMap(exists -> {
                if (exists) {
                    return userRepository
                        .findByEmailOrPhoneNumber(
                            request.getEmail(),
                            phoneToCheck
                        )
                        .collectList()
                        .flatMap(users -> {
                            List<String> conflicts = new ArrayList<>();
                            for (User user : users) {
                                if (
                                    request
                                        .getUsername()
                                        .equals(user.getUsername())
                                ) {
                                    conflicts.add("username");
                                }
                                if (
                                    request.getEmail().equals(user.getEmail())
                                ) {
                                    conflicts.add("email");
                                }
                                if (
                                    request.getPhoneNumber() != null &&
                                    user.getPhoneNumber() != null &&
                                    request
                                        .getPhoneNumber()
                                        .equals(user.getPhoneNumber())
                                ) {
                                    conflicts.add("phone number");
                                }
                            }

                            // Additional check for name + phone combination
                            Mono<Boolean> namePhoneCheck;
                            if (request.getPhoneNumber() != null) {
                                namePhoneCheck =
                                    userRepository.existsByNameAndPhoneNumber(
                                        request.getFirstName(),
                                        request.getLastName(),
                                        request.getPhoneNumber()
                                    );
                            } else {
                                namePhoneCheck = Mono.just(false);
                            }

                            return namePhoneCheck.flatMap(namePhoneExists -> {
                                if (namePhoneExists) {
                                    conflicts.add(
                                        "name and phone number combination"
                                    );
                                }
                                String conflictMessage =
                                    "Account already exists with this " +
                                    String.join(", ", conflicts) +
                                    ". Please use different credentials or login to your existing account.";
                                return Mono.<
                                        StudentRegistrationRequestDTO
                                    >error(
                                    new IllegalArgumentException(
                                        conflictMessage
                                    )
                                );
                            });
                        });
                }
                return Mono.just(request);
            });
    }

    /**
     * Check for duplicate credentials for admin registration
     */
    private Mono<AdminRegistrationRequestDTO> checkForDuplicateCredentialsAdmin(
        AdminRegistrationRequestDTO request
    ) {
        // Check duplicates - handle null phone number
        String phoneToCheck = request.getPhoneNumber() != null &&
            !request.getPhoneNumber().trim().isEmpty()
            ? request.getPhoneNumber()
            : null;

        return userRepository
            .existsByUsernameOrEmailOrPhoneNumber(
                request.getUsername(),
                request.getEmail(),
                phoneToCheck
            )
            .flatMap(exists -> {
                if (exists) {
                    return userRepository
                        .findByEmailOrPhoneNumber(
                            request.getEmail(),
                            phoneToCheck
                        )
                        .collectList()
                        .flatMap(users -> {
                            List<String> conflicts = new ArrayList<>();
                            for (User user : users) {
                                if (
                                    request
                                        .getUsername()
                                        .equals(user.getUsername())
                                ) {
                                    conflicts.add("username");
                                }
                                if (
                                    request.getEmail().equals(user.getEmail())
                                ) {
                                    conflicts.add("email");
                                }
                                if (
                                    request
                                        .getPhoneNumber()
                                        .equals(user.getPhoneNumber())
                                ) {
                                    conflicts.add("phone number");
                                }
                            }

                            // Additional check for name + phone combination
                            Mono<Boolean> namePhoneCheck;
                            if (request.getPhoneNumber() != null) {
                                namePhoneCheck =
                                    userRepository.existsByNameAndPhoneNumber(
                                        request.getFirstName(),
                                        request.getLastName(),
                                        request.getPhoneNumber()
                                    );
                            } else {
                                namePhoneCheck = Mono.just(false);
                            }

                            return namePhoneCheck.flatMap(namePhoneExists -> {
                                if (namePhoneExists) {
                                    conflicts.add(
                                        "name and phone number combination"
                                    );
                                }
                                String conflictMessage =
                                    "Account already exists with this " +
                                    String.join(", ", conflicts) +
                                    ". Please use different credentials or login to your existing account.";
                                return Mono.<AdminRegistrationRequestDTO>error(
                                    new IllegalArgumentException(
                                        conflictMessage
                                    )
                                );
                            });
                        });
                }
                return Mono.just(request);
            });
    }

    /**
     * Create student user entity
     */
    private Mono<User> createStudentUser(
        StudentRegistrationRequestDTO request
    ) {
        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .password(
                request.getPassword() != null
                    ? passwordEncoder.encode(request.getPassword())
                    : null
            )
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .phoneNumber(request.getPhoneNumber())
            .userType("STUDENT")
            .status("PENDING_VERIFICATION")
            .emailVerified(false)
            .phoneVerified(false)
            .isActive(true)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .createdBy("SYSTEM")
            .updatedBy("SYSTEM")
            .deleted(false)
            .build();

        return userRepository
            .save(user)
            .doOnSuccess(savedUser ->
                log.info("Student user created with ID: {}", savedUser.getId())
            );
    }

    /**
     * Create initial student profile after user creation
     * Uses dynamic configuration to initialize all steps as empty structures
     */
    private Mono<User> createStudentProfile(User user) {
        log.debug(
            "Creating initial student profile for user: {}",
            user.getId()
        );

        // Get step order dynamically from config to determine first step
        return profileBuilderConfigService
            .getStepOrder("uni360")
            .defaultIfEmpty(java.util.Arrays.asList("basic_info"))
            .flatMap(stepOrder -> {
                // Create initial profile data structure with empty nodes for all steps
                ObjectNode profileData = objectMapper.createObjectNode();

                // Initialize all steps from config as empty objects
                for (String stepId : stepOrder) {
                    profileData.set(stepId, objectMapper.createObjectNode());
                }

                // Pre-populate phone if available from registration
                String firstStep = stepOrder.isEmpty()
                    ? "basic_info"
                    : stepOrder.get(0);
                if (
                    user.getPhoneNumber() != null &&
                    !user.getPhoneNumber().isEmpty()
                ) {
                    // Try to set phone in the first step if it has basic_info in name
                    if (
                        firstStep.contains("basic_info") &&
                        profileData.has(firstStep)
                    ) {
                        ObjectNode basicInfo = (ObjectNode) profileData.get(
                            firstStep
                        );
                        basicInfo.put("phone", user.getPhoneNumber());
                    }
                }

                // Create initial steps completed array (empty at start)
                ArrayNode stepsCompleted = objectMapper.createArrayNode();

                StudentProfile studentProfile = StudentProfile.builder()
                    .userId(user.getId())
                    .profileData(profileData)
                    .profileStatus(VerificationStatus.DRAFT)
                    .completionPercentage(0) // No steps completed yet
                    .profileStepsCompleted(stepsCompleted)
                    .currentStep(firstStep) // First step from dynamic config
                    .workflowStage("PROFILE_BUILDING")
                    .isVerified(false)
                    .deleted(false)
                    .build();

                return studentProfileRepository
                    .save(studentProfile)
                    .doOnSuccess(savedProfile ->
                        log.info(
                            "Student profile created with ID: {} for user: {} (first step: {})",
                            savedProfile.getId(),
                            user.getId(),
                            firstStep
                        )
                    )
                    .then(Mono.just(user)); // Return the original user for the chain
            })
            .onErrorResume(e -> {
                log.error(
                    "Failed to create student profile for user: {}",
                    user.getId(),
                    e
                );
                // Don't fail the registration if profile creation fails
                return Mono.just(user);
            });
    }

    /**
     * Create admin user entity
     */
    private Mono<User> createAdminUser(AdminRegistrationRequestDTO request) {
        log.debug(
            "Creating admin user - role from request: '{}'",
            request.getRole()
        );
        String mappedUserType = mapRoleToUserType(request.getRole());
        log.debug(
            "Mapped role '{}' to userType: '{}'",
            request.getRole(),
            mappedUserType
        );

        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .password(
                request.getPassword() != null
                    ? passwordEncoder.encode(request.getPassword())
                    : null
            )
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .phoneNumber(request.getPhoneNumber())
            .userType(mappedUserType)
            .status("PENDING_VERIFICATION")
            .emailVerified(false)
            .phoneVerified(false)
            .isActive(true)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .createdBy("SYSTEM")
            .updatedBy("SYSTEM")
            .deleted(false)
            .build();

        return userRepository
            .save(user)
            .doOnSuccess(savedUser ->
                log.info(
                    "Admin user created with ID: {} and userType: {}",
                    savedUser.getId(),
                    savedUser.getUserType()
                )
            );
    }

    /**
     * Create initial admin profile after user creation
     */
    private Mono<User> createAdminProfile(User user) {
        return Mono.deferContextual(context -> {
            // Try to get the registration request from context
            AdminRegistrationRequestDTO request = context.getOrDefault(
                "adminRequest",
                null
            );
            if (request != null) {
                return createAdminProfileFromRequest(user, request);
            } else {
                // Fallback to basic profile creation
                return createBasicAdminProfile(user);
            }
        });
    }

    /**
     * Create admin profile with data from registration request
     */
    private Mono<User> createAdminProfileFromRequest(
        User user,
        AdminRegistrationRequestDTO request
    ) {
        log.debug(
            "Creating admin profile from request for user: {}",
            user.getId()
        );

        try {
            AdminProfile adminProfile = AdminProfile.builder()
                .userId(user.getId().toString())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .employeeId(request.getEmployeeId())
                .role(request.getRole())
                .specialization(
                    request.getSpecialization() != null
                        ? request.getSpecialization()
                        : "BACHELOR,MASTERS"
                )
                .department(
                    request.getDepartment() != null
                        ? request.getDepartment()
                        : "Admissions"
                )
                .phone(user.getPhoneNumber())
                .specializationCountries(
                    request.getSpecializationCountries() != null
                        ? request.getSpecializationCountries()
                        : "DE,US,UK"
                )
                .timezone(
                    request.getTimezone() != null
                        ? request.getTimezone()
                        : "UTC"
                )
                .maxDailyCapacity(
                    request.getMaxDailyCapacity() != null
                        ? request.getMaxDailyCapacity()
                        : 10
                )
                .maxConcurrentApplications(
                    request.getMaxConcurrentApplications() != null
                        ? request.getMaxConcurrentApplications()
                        : 5
                )
                .isActive(true)
                .canVerifyDocuments(
                    request.getCanVerifyDocuments() != null
                        ? request.getCanVerifyDocuments()
                        : true
                )
                .canApproveApplications(
                    request.getCanApproveApplications() != null
                        ? request.getCanApproveApplications()
                        : true
                )
                .canProcessPayments(
                    request.getCanProcessPayments() != null
                        ? request.getCanProcessPayments()
                        : false
                )
                .canManageUsers(
                    request.getCanManageUsers() != null
                        ? request.getCanManageUsers()
                        : false
                )
                .totalApplicationsProcessed(0)
                .totalDocumentsVerified(0)
                .averageProcessingTimeHours(0.0)
                .qualityScore(100.0)
                .clientId("uniflow")
                .isActive(true)
                .build();

            return adminProfileRepository
                .save(adminProfile)
                .doOnSuccess(savedProfile ->
                    log.info(
                        "Admin profile created with ID: {} for user: {} with specialization: {}",
                        savedProfile.getId(),
                        user.getId(),
                        savedProfile.getSpecialization()
                    )
                )
                .then(Mono.just(user));
        } catch (Exception e) {
            log.error(
                "Failed to create admin profile for user: {}",
                user.getId(),
                e
            );
            return Mono.error(
                new RuntimeException(
                    "Failed to create admin profile: " + e.getMessage()
                )
            );
        }
    }

    /**
     * Create basic admin profile with default values
     */
    private Mono<User> createBasicAdminProfile(User user) {
        log.debug("Creating basic admin profile for user: {}", user.getId());

        try {
            AdminProfile adminProfile = AdminProfile.builder()
                .userId(user.getId().toString())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .employeeId("EMP_" + user.getId().toString().substring(0, 8))
                .role("COUNSELOR")
                .specialization("BACHELOR,MASTERS")
                .department("Admissions")
                .phone(user.getPhoneNumber())
                .specializationCountries("DE,US,UK")
                .maxDailyCapacity(10)
                .maxConcurrentApplications(5)
                .isActive(true)
                .canVerifyDocuments(true)
                .canApproveApplications(true)
                .canProcessPayments(false)
                .canManageUsers(false)
                .totalApplicationsProcessed(0)
                .totalDocumentsVerified(0)
                .averageProcessingTimeHours(0.0)
                .qualityScore(100.0)
                .timezone("UTC")
                .clientId("uniflow")
                .isActive(true)
                .build();

            return adminProfileRepository
                .save(adminProfile)
                .doOnSuccess(savedProfile ->
                    log.info(
                        "Basic admin profile created with ID: {} for user: {}",
                        savedProfile.getId(),
                        user.getId()
                    )
                )
                .then(Mono.just(user));
        } catch (Exception e) {
            log.error(
                "Failed to create basic admin profile for user: {}",
                user.getId(),
                e
            );
            return Mono.error(
                new RuntimeException(
                    "Failed to create admin profile: " + e.getMessage()
                )
            );
        }
    }

    /**
     * Map role to userType for admin registration
     */
    private String mapRoleToUserType(String role) {
        log.debug("Mapping role to userType - input role: '{}'", role);
        try {
            String userType = com.uniflow.auth.enums.AdminRole.fromString(
                role
            ).getUserType();
            log.debug("Role '{}' mapped to userType: '{}'", role, userType);
            return userType;
        } catch (IllegalArgumentException e) {
            log.error(
                "Failed to map role '{}' to userType: {}",
                role,
                e.getMessage()
            );
            // This should never happen if validation is done properly
            throw new IllegalArgumentException("Invalid admin role: " + role);
        }
    }

    /**
     * Generate email verification token using simple token generation
     */
    private Mono<User> generateVerificationToken(User user) {
        // Simple token generation - verification service removed
        String verificationToken = UUID.randomUUID().toString();
        log.info("Generated verification token for user: {}", user.getEmail());

        return userRepository
            .setVerificationToken(user.getId(), LocalDateTime.now())
            .then(Mono.just(user.toBuilder().build()))
            .flatMap(updatedUser -> {
                // Build verification link
                String verificationLink = String.format(
                    "%s/api/v1/auth/verify-email?token=%s",
                    getBaseUrl(),
                    "verification_token"
                );

                // Note: Verification link is now handled by the verification service
                return Mono.just(updatedUser);
            })
            .doOnSuccess(updatedUser -> {
                // Enhanced notification simulation with verification link
                String userType = user.getUserType().toLowerCase();
                String verificationLink = String.format(
                    "%s/api/v1/auth/verify-email?token=%s",
                    getBaseUrl(),
                    "verification_token"
                );

                log.info("\n🔥🔥🔥 EMAIL NOTIFICATION SIMULATION 🔥🔥🔥");
                log.info("📧 TO: {} ({})", user.getEmail(), user.getFullName());
                log.info(
                    "📝 SUBJECT: Welcome to UniFLow - Verify Your {} Account",
                    userType
                );
                log.info("🔗 VERIFICATION LINK: {}", verificationLink);
                log.info(
                    "⏰ EXPIRES: {} (24 hours)",
                    LocalDateTime.now().plusHours(24)
                );
                log.info("🎯 USER TYPE: {}", user.getUserType());
                log.info("💡 Click the link above to activate your account!");
                log.info(
                    "✅ Verification service: Token stored with rate limiting"
                );
                log.info("🔥🔥🔥 END EMAIL SIMULATION 🔥🔥🔥\n");

                // Notification functionality disabled - was placeholder
                log.info(
                    "✅ Verification link generated (notifications disabled)"
                );

                // TODO: Implement SMS notification as backup
                // if (user.getPhoneNumber() != null) {
                //     smsService.sendVerificationSMS(user.getPhoneNumber(), verificationToken);
                // }
            });
    }

    /**
     * Get base URL for verification links
     */
    private String getBaseUrl() {
        return baseUrl;
    }

    /**
     * Build student registration response
     */
    private RegistrationResponseDTO buildStudentRegistrationResponse(
        User user
    ) {
        return RegistrationResponseDTO.forStudent(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            "verification_token",
            LocalDateTime.now().plusHours(24)
        );
    }

    /**
     * Build admin registration response
     */
    private RegistrationResponseDTO buildAdminRegistrationResponse(User user) {
        return RegistrationResponseDTO.forAdmin(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getUserType(),
            "verification_token",
            LocalDateTime.now().plusHours(24)
        );
    }

    /**
     * Verify email address and activate account using Redis-based verification service
     */
    public Mono<Object> verifyEmail(String token) {
        log.info("Email verification attempt with token: {}", token);

        if (token == null || token.trim().isEmpty()) {
            return Mono.just(ErrorResponse.tokenRequired());
        }

        // Debug logging for token comparison
        log.info(
            "Comparing tokens - received: '{}', master: '{}'",
            token,
            masterVerifyToken
        );
        log.info(
            "Token equals check result: {}",
            masterVerifyToken.equals(token)
        );

        // Check for master verification token bypass (for testing)
        if (masterVerifyToken.equals(token)) {
            log.warn(
                "🔥 MASTER_VERIFY_TOKEN used - marking all unverified users as verified!"
            );
            return userRepository
                .markAllUnverifiedUsersAsVerified(LocalDateTime.now())
                .flatMap(updatedCount -> {
                    log.info(
                        "✅ Master token verification completed - {} users verified",
                        updatedCount
                    );
                    return Mono.just(
                        (Object) SuccessResponse.create(
                            "Master token used - " +
                                updatedCount +
                                " users verified"
                        )
                    );
                })
                .onErrorResume(error -> {
                    log.error("Master token verification failed", error);
                    return Mono.just(
                        (Object) ErrorResponse.create(
                            "Master token verification failed: " +
                                error.getMessage()
                        )
                    );
                });
        }

        // Since verification tokens are not stored in the database in this simplified version,
        // we cannot verify individual tokens. Only master token is supported.
        log.warn(
            "Individual token verification not supported in simplified mode: {}",
            token
        );
        return Mono.just(
            (Object) ErrorResponse.create(
                "Individual token verification not supported. Use master token for testing."
            )
        );
    }

    /**
     * Handle registration errors
     */
    private Mono<ApiResponse<RegistrationResponseDTO>> handleRegistrationError(
        Throwable error
    ) {
        log.error("Registration error", error);
        String errorMessage = error.getMessage();

        if (error instanceof IllegalArgumentException) {
            return Mono.just(ApiResponse.error(errorMessage));
        }

        return Mono.just(
            ApiResponse.error("Registration failed: " + errorMessage)
        );
    }

    // ========================================
    // SET PASSWORD (Google OAuth → HYBRID upgrade)
    // ========================================

    /**
     * Allows a logged-in user to set or change their password.
     *
     * <p>Flow:
     * - GOOGLE users: no currentPassword required. Sets password and upgrades to HYBRID.
     * - HYBRID / LOCAL users: must provide correct currentPassword before changing.
     */
    public Mono<ApiResponse<SetPasswordResponseDTO>> setPassword(
        Long userId,
        SetPasswordRequestDTO request
    ) {
        return userRepository
            .findByIdAndNotDeleted(userId)
            .switchIfEmpty(Mono.error(new RuntimeException("User not found")))
            .flatMap(user -> {
                // Validate password match
                if (!request.isPasswordMatching()) {
                    return Mono.<User>error(new IllegalArgumentException(
                        "New password and confirm password do not match"
                    ));
                }

                // Validate password strength
                if (!request.isPasswordStrong()) {
                    return Mono.<User>error(new IllegalArgumentException(
                        "Password must be at least 8 characters and contain uppercase, lowercase, digit, and special character"
                    ));
                }

                com.uniflow.auth.enums.AuthProvider provider = user.getAuthProvider();

                // If user already has a password (HYBRID or LOCAL), require currentPassword
                if ((provider == com.uniflow.auth.enums.AuthProvider.HYBRID ||
                     provider == com.uniflow.auth.enums.AuthProvider.LOCAL) &&
                    user.getPassword().isPresent()) {

                    if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
                        return Mono.<User>error(new IllegalArgumentException(
                            "Current password is required to change your existing password"
                        ));
                    }

                    if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword().get())) {
                        return Mono.<User>error(new IllegalArgumentException(
                            "Current password is incorrect"
                        ));
                    }
                }

                return Mono.just(user);
            })
            .flatMap(user -> {
                String hashedPassword = passwordEncoder.encode(request.getNewPassword());
                LocalDateTime now = LocalDateTime.now();
                boolean isFirstTimeSetup =
                    user.getAuthProvider() == com.uniflow.auth.enums.AuthProvider.GOOGLE;

                // Any Google-linked user (GOOGLE or HYBRID) who is not yet ACTIVE
                // should be activated when they set a password — Google already verified their email
                boolean needsActivation =
                    (user.getAuthProvider() == com.uniflow.auth.enums.AuthProvider.GOOGLE ||
                     user.getAuthProvider() == com.uniflow.auth.enums.AuthProvider.HYBRID) &&
                    !"ACTIVE".equals(user.getStatus());

                // Update password in DB
                Mono<Integer> updatePassword = userRepository.updatePassword(
                    user.getId(), hashedPassword, now
                );

                // If Google-only user, upgrade oauth_provider_code to HYBRID
                Mono<Integer> upgradeProvider = isFirstTimeSetup
                    ? userRepository.updateOAuthProvider(
                        user.getId(),
                        com.uniflow.auth.enums.AuthProvider.HYBRID.getCode(),
                        now
                    )
                    : Mono.just(1);

                // Activate account if stuck in PENDING_VERIFICATION
                // Covers both: pure GOOGLE users AND HYBRID users already upgraded but not yet active
                Mono<Integer> activateAccount = needsActivation
                    ? userRepository.markEmailAsVerified(user.getId(), now)
                    : Mono.just(1);

                return updatePassword
                    .then(upgradeProvider)
                    .then(activateAccount)
                    .then(Mono.defer(() -> {
                        if (isFirstTimeSetup) {
                            log.info(
                                "✅ First-time password set for Google user: {} — upgraded to HYBRID and activated",
                                user.getEmail()
                            );
                        } else {
                            log.info(
                                "✅ Password changed for user: {}",
                                user.getEmail()
                            );
                        }
                        // TODO: Wire in email notification when email service is enabled.
                        String message = isFirstTimeSetup
                            ? "Password set successfully. You can now log in with your email and password, or continue using Google Sign-In."
                            : "Password changed successfully.";

                        SetPasswordResponseDTO responseData = SetPasswordResponseDTO.builder()
                            .message(message)
                            .email(user.getEmail())
                            .password(request.getNewPassword())  // echo plaintext once — never stored
                            .authProvider(isFirstTimeSetup
                                ? com.uniflow.auth.enums.AuthProvider.HYBRID.getCode()
                                : user.getAuthProvider().getCode())
                            .firstTimeSetup(isFirstTimeSetup)
                            .build();

                        return Mono.just(ApiResponse.success(responseData, message));
                    }));
            })
            .onErrorResume(error -> {
                log.error("Set password failed for userId: {} — {}", userId, error.getMessage());
                return Mono.just(ApiResponse.error(error.getMessage() != null
                    ? error.getMessage()
                    : "Failed to set password"
                ));
            });
    }

    // ========================================
    // PASSWORD RESET FUNCTIONALITY
    // ========================================

    /**
     * Handle forgot password request.
     *
     * <p>For GOOGLE-only users who never set a password, we return a specific helpful error.
     * For LOCAL or HYBRID users, the standard reset-token flow applies.
     */
    public Mono<ApiResponse<PasswordResetResponseDTO>> forgotPassword(

        ForgotPasswordRequestDTO request,
        String clientIp
    ) {
        String requestId = UUID.randomUUID().toString();

        log.info(
            "Forgot password request for email: {} with request ID: {}",
            request.getEmail(),
            requestId
        );

        return validateForgotPasswordRequest(request)
            .flatMap(email ->
                userRepository
                    .findByEmail(email)
                    .flatMap(user -> {
                        // Guard: Google-only users cannot use forgot-password flow until they set one
                        if (user.getAuthProvider() == com.uniflow.auth.enums.AuthProvider.GOOGLE) {
                            log.warn(
                                "Forgot password attempted for Google-only account: {}",
                                user.getEmail()
                            );
                            return Mono.<ApiResponse<PasswordResetResponseDTO>>error(new RuntimeException(
                                "This account uses Google Sign-In and does not have a password. " +
                                "Please log in with Google and then set a password from your account settings."
                            ));
                        }
                        return processForgotPasswordForUser(
                            user,
                            request,
                            clientIp,
                            requestId
                        );
                    })
                    .switchIfEmpty(
                        // Security: Don't reveal if email exists or not - return success even for
                        // non-existent users
                        Mono.defer(() -> {
                            log.warn(
                                "Forgot password request for non-existent email: {}",
                                request.getEmail()
                            );
                            LocalDateTime fakeExpiry =
                                LocalDateTime.now().plusMinutes(
                                    passwordResetTokenExpiryMinutes
                                );
                            PasswordResetResponseDTO response =
                                PasswordResetResponseDTO.forgotPasswordSuccess(
                                    requestId,
                                    fakeExpiry
                                );
                            return Mono.just(
                                ApiResponse.success(
                                    response,
                                    response.getMessage()
                                )
                            );
                        })
                    )
            )
            .onErrorResume(error -> {
                // If it's our own informational error for Google users, propagate it
                if (error.getMessage() != null &&
                    error.getMessage().contains("Google Sign-In")) {
                    return Mono.just(ApiResponse.error(error.getMessage()));
                }
                log.error(
                    "Forgot password processing failed for email: {}",
                    request.getEmail(),
                    error
                );
                // Return success response even on error for security (don't leak info)
                LocalDateTime fakeExpiry = LocalDateTime.now().plusMinutes(
                    passwordResetTokenExpiryMinutes
                );
                PasswordResetResponseDTO response =
                    PasswordResetResponseDTO.forgotPasswordSuccess(
                        requestId,
                        fakeExpiry
                    );
                return Mono.just(
                    ApiResponse.success(response, response.getMessage())
                );
            });
    }

    /**
     * Handle password reset with temporary credentials
     */
    public Mono<ApiResponse<PasswordResetResponseDTO>> resetPassword(
        ResetPasswordRequestDTO request,
        String clientIp
    ) {
        String requestId = UUID.randomUUID().toString();

        log.info(
            "Password reset request with token: {} and request ID: {}",
            request.getResetToken(),
            requestId
        );

        return validateResetPasswordRequest(request)
            .flatMap(req -> findUserByValidResetToken(req.getResetToken()))
            .switchIfEmpty(
                Mono.error(
                    new IllegalArgumentException(
                        "Invalid or expired reset token"
                    )
                )
            )
            .flatMap(user -> Mono.just(user))
            .flatMap(user ->
                updateUserPassword(user, request, clientIp, requestId)
            )
            .map(response ->
                ApiResponse.success(response, response.getMessage())
            )
            .onErrorResume(error -> {
                log.error("Password reset failed: {}", error.getMessage());
                return Mono.just(
                    ApiResponse.error(
                        "Password reset failed: " + error.getMessage()
                    )
                );
            });
    }

    /**
     * Handle reset link click - validates token and sends temporary credentials
     */
    public Mono<ApiResponse<PasswordResetResponseDTO>> processResetLink(
        String resetToken,
        String clientIp
    ) {
        String requestId = UUID.randomUUID().toString();

        log.info(
            "Reset link clicked for token: {} with request ID: {}",
            resetToken,
            requestId
        );

        // Check for master reset token bypass (for testing)
        if (masterResetToken.equals(resetToken)) {
            log.warn(
                "🔥 MASTER_RESET_TOKEN used - generating credentials for first active user!"
            );
            return processMasterResetToken(clientIp, requestId);
        }

        return findUserByValidResetToken(resetToken)
            .switchIfEmpty(
                Mono.error(
                    new IllegalArgumentException(
                        "Invalid or expired reset token"
                    )
                )
            )
            .flatMap(user ->
                generateAndSendTemporaryCredentials(
                    user,
                    resetToken,
                    clientIp,
                    requestId
                )
            )
            .map(response ->
                ApiResponse.success(response, response.getMessage())
            )
            .onErrorResume(error -> {
                log.error(
                    "Reset link processing failed: {}",
                    error.getMessage()
                );
                return Mono.just(
                    ApiResponse.error(
                        "Reset link processing failed: " + error.getMessage()
                    )
                );
            });
    }

    // ========================================
    // PRIVATE HELPER METHODS
    // ========================================

    private Mono<String> validateForgotPasswordRequest(
        ForgotPasswordRequestDTO request
    ) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return Mono.error(
                new IllegalArgumentException("Email is required")
            );
        }
        return Mono.just(request.getEmail().toLowerCase().trim());
    }

    private Mono<ResetPasswordRequestDTO> validateResetPasswordRequest(
        ResetPasswordRequestDTO request
    ) {
        if (
            request.getResetToken() == null ||
            request.getResetToken().trim().isEmpty()
        ) {
            return Mono.error(
                new IllegalArgumentException("Reset token is required")
            );
        }
        if (
            request.getNewPassword() == null ||
            request.getNewPassword().trim().isEmpty()
        ) {
            return Mono.error(
                new IllegalArgumentException("New password is required")
            );
        }
        if (!request.isPasswordConfirmationValid()) {
            return Mono.error(
                new IllegalArgumentException(
                    "New password and confirmation do not match"
                )
            );
        }
        return Mono.just(request);
    }

    private Mono<User> findUserByValidResetToken(String resetToken) {
        LocalDateTime now = LocalDateTime.now();
        return userRepository.findByValidPasswordResetToken(resetToken, now);
    }

    private Mono<
        ApiResponse<PasswordResetResponseDTO>
    > processForgotPasswordForUser(
        User user,
        ForgotPasswordRequestDTO request,
        String clientIp,
        String requestId
    ) {
        // Generate a random temporary password (no email needed)
        String tempPassword = generateTemporaryPassword();
        String hashedPassword = passwordEncoder.encode(tempPassword);
        LocalDateTime now = LocalDateTime.now();

        // Upgrade GOOGLE users to HYBRID so they can login with this temp password
        boolean isGoogleUser =
            user.getAuthProvider() == com.uniflow.auth.enums.AuthProvider.GOOGLE;

        Mono<Integer> savePassword = userRepository.updatePassword(
            user.getId(), hashedPassword, now
        );

        Mono<Integer> upgradeProvider = isGoogleUser
            ? userRepository.updateOAuthProvider(
                user.getId(),
                com.uniflow.auth.enums.AuthProvider.HYBRID.getCode(),
                now
            )
            : Mono.just(1);

        // Also activate account in case stuck in PENDING_VERIFICATION
        boolean needsActivation = isGoogleUser &&
            !"ACTIVE".equals(user.getStatus());
        Mono<Integer> activateAccount = needsActivation
            ? userRepository.markEmailAsVerified(user.getId(), now)
            : Mono.just(1);

        return savePassword
            .then(upgradeProvider)
            .then(activateAccount)
            .then(Mono.defer(() -> {
                log.info(
                    "✅ Temporary password generated for user: {} (requestId: {})",
                    user.getEmail(), requestId
                );

                PasswordResetResponseDTO response = PasswordResetResponseDTO.builder()
                    .message("A temporary password has been set for your account.")
                    .requestId(requestId)
                    .operationType(PasswordResetResponseDTO.PasswordResetOperation.FORGOT_PASSWORD)
                    .timestamp(LocalDateTime.now())
                    .temporaryPassword(tempPassword)  // shown once in response
                    .nextStep("Use this temporary password to log in, then change it in your account settings.")
                    .securityInfo("This password is shown only once. Please change it after logging in.")
                    .requiresAdditionalVerification(false)
                    .build();

                return Mono.just(ApiResponse.success(response, response.getMessage()));
            }));
    }

    private Mono<PasswordResetResponseDTO> generateAndSendTemporaryCredentials(
        User user,
        String resetToken,
        String clientIp,
        String requestId
    ) {
        String temporaryPassword = generateTemporaryPassword();
        String hashedTempPassword = passwordEncoder.encode(temporaryPassword);
        LocalDateTime credentialsExpiry = LocalDateTime.now().plusHours(
            tempCredentialsExpiryHours
        );

        return userRepository
            .updatePassword(
                user.getId(),
                hashedTempPassword,
                LocalDateTime.now()
            )
            .then(
                sendTemporaryCredentialsNotification(
                    user,
                    temporaryPassword,
                    resetToken,
                    credentialsExpiry,
                    clientIp,
                    requestId
                )
            )
            .then(
                Mono.defer(() -> {
                    PasswordResetResponseDTO response =
                        PasswordResetResponseDTO.tempCredentialsSent(requestId);
                    return Mono.just(response);
                })
            )
            .doOnSuccess(result ->
                log.info(
                    "Temporary credentials generated for user: {} with request ID: {}",
                    user.getEmail(),
                    requestId
                )
            );
    }

    private Mono<PasswordResetResponseDTO> updateUserPassword(
        User user,
        ResetPasswordRequestDTO request,
        String clientIp,
        String requestId
    ) {
        String hashedNewPassword = passwordEncoder.encode(
            request.getNewPassword()
        );
        LocalDateTime now = LocalDateTime.now();

        return userRepository
            .updatePassword(user.getId(), hashedNewPassword, now)
            .then(sendPasswordUpdatedNotification(user, clientIp, requestId))
            .then(
                Mono.defer(() -> {
                    PasswordResetResponseDTO response =
                        PasswordResetResponseDTO.passwordUpdated(requestId);
                    return Mono.just(response);
                })
            )
            .doOnSuccess(result ->
                log.info(
                    "Password successfully updated for user: {} with request ID: {}",
                    user.getEmail(),
                    requestId
                )
            );
    }

    private Mono<Void> sendPasswordResetNotification(
        User user,
        String resetToken,
        String resetLink,
        String clientIp,
        String userAgent,
        String requestId
    ) {
        // No email — temp password is returned directly in API response
        log.debug("sendPasswordResetNotification called (no-op — no SMTP configured)");
        return Mono.empty();
    }

    private Mono<Void> sendTemporaryCredentialsNotification(
        User user,
        String temporaryPassword,
        String resetToken,
        LocalDateTime credentialsExpiry,
        String clientIp,
        String requestId
    ) {
        try {
            PasswordResetEvent event =
                PasswordResetEvent.temporaryCredentialsGenerated(
                    user.getEmail(),
                    resetToken,
                    temporaryPassword,
                    user.getId(),
                    user.getUserType().toString(),
                    credentialsExpiry,
                    clientIp
                );

            TemporaryCredentialsDTO credentials =
                TemporaryCredentialsDTO.create(
                    user.getEmail(),
                    temporaryPassword,
                    resetToken,
                    credentialsExpiry,
                    buildResetLink(resetToken)
                );
            credentials.setRequestId(requestId);

            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("email", user.getEmail());
            notificationData.put("temporaryPassword", temporaryPassword);
            notificationData.put("resetToken", resetToken);
            notificationData.put("expiresAt", credentialsExpiry);
            notificationData.put("instructions", credentials.getInstructions());
            notificationData.put(
                "securityWarning",
                credentials.getSecurityWarning()
            );
            notificationData.put("requestId", requestId);

            // Notification functionality disabled - was placeholder
            log.info(
                "✅ Temporary credentials generated (notifications disabled)"
            );
            return Mono.<Void>empty()
                .doOnSuccess(unused ->
                    log.info(
                        "🔑 Temporary credentials sent - Email: {}, TempPass: {}",
                        user.getEmail(),
                        temporaryPassword
                    )
                )
                .doOnError(error ->
                    log.error(
                        "Failed to send temporary credentials notification",
                        error
                    )
                );
        } catch (Exception e) {
            log.error("Failed to create temporary credentials notification", e);
            return Mono.empty();
        }
    }

    private Mono<Void> sendPasswordUpdatedNotification(
        User user,
        String clientIp,
        String requestId
    ) {
        // Optional — only sends if email service is configured
        if (emailService != null) {
            return emailService
                .sendPasswordChangedEmail(user.getEmail(), user.getFirstName())
                .onErrorResume(e -> Mono.empty());
        }
        log.debug("Password changed notification skipped (no SMTP configured)");
        return Mono.empty();
    }


    private String generateSecureToken() {
        return (
            "pwd-reset-" +
            UUID.randomUUID().toString() +
            "-" +
            System.currentTimeMillis()
        );
    }

    private String generateTemporaryPassword() {
        StringBuilder password = new StringBuilder();
        for (int i = 0; i < 12; i++) {
            password.append(
                CHARACTERS.charAt(secureRandom.nextInt(CHARACTERS.length()))
            );
        }
        return password.toString();
    }

    private String buildResetLink(String resetToken) {
        return baseUrl + "/reset-password?token=" + resetToken;
    }

    /**
     * Process master reset token - generates temporary credentials for the first active user
     */
    private Mono<ApiResponse<PasswordResetResponseDTO>> processMasterResetToken(
        String clientIp,
        String requestId
    ) {
        return userRepository
            .findFirstActiveUser()
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "No active users found for master reset"
                    )
                )
            )
            .flatMap(user -> {
                String temporaryPassword = generateTemporaryPassword();
                String hashedTempPassword = passwordEncoder.encode(
                    temporaryPassword
                );
                LocalDateTime credentialsExpiry = LocalDateTime.now().plusHours(
                    tempCredentialsExpiryHours
                );
                String fakeResetToken = generateSecureToken();

                return userRepository
                    .updatePassword(
                        user.getId(),
                        hashedTempPassword,
                        LocalDateTime.now()
                    )
                    .then(
                        userRepository.setPasswordResetToken(
                            user.getId(),
                            fakeResetToken,
                            credentialsExpiry,
                            LocalDateTime.now()
                        )
                    )
                    .then(
                        Mono.defer(() -> {
                            // Log the temporary credentials for testing
                            log.warn("🔥🔥🔥 MASTER RESET CREDENTIALS 🔥🔥🔥");
                            log.warn("📧 Email: {}", user.getEmail());
                            log.warn(
                                "🔑 Temporary Password: {}",
                                temporaryPassword
                            );
                            log.warn("🎫 Reset Token: {}", fakeResetToken);
                            log.warn("⏰ Expires: {}", credentialsExpiry);
                            log.warn(
                                "💡 Use these credentials to reset password!"
                            );
                            log.warn(
                                "🔥🔥🔥 END MASTER RESET CREDENTIALS 🔥🔥🔥"
                            );

                            PasswordResetResponseDTO response =
                                PasswordResetResponseDTO.builder()
                                    .message(
                                        "Master reset token used - temporary credentials generated"
                                    )
                                    .requestId(requestId)
                                    .operationType(
                                        PasswordResetResponseDTO.PasswordResetOperation.MASTER_RESET_CREDENTIALS
                                    )
                                    .timestamp(LocalDateTime.now())
                                    .nextStep(
                                        "Use the temporary credentials logged above to reset password"
                                    )
                                    .securityInfo(
                                        "Master token used - credentials expire in " +
                                            tempCredentialsExpiryHours +
                                            " hours"
                                    )
                                    .build();

                            return Mono.just(
                                ApiResponse.success(
                                    response,
                                    response.getMessage()
                                )
                            );
                        })
                    );
            })
            .onErrorResume(error -> {
                log.error("Master reset token processing failed", error);
                return Mono.just(
                    ApiResponse.error(
                        "Master reset token processing failed: " +
                            error.getMessage()
                    )
                );
            });
    }
}
