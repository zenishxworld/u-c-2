package com.uniflow.auth.handler;

import com.uniflow.auth.dto.AdminRegistrationRequestDTO;
import com.uniflow.auth.dto.ForgotPasswordRequestDTO;
import com.uniflow.auth.dto.GoogleOAuthRequestDTO;
import com.uniflow.auth.dto.LoginRequestDTO;
import com.uniflow.auth.dto.LoginResponseDTO;
import com.uniflow.auth.dto.PasswordResetResponseDTO;
import com.uniflow.auth.dto.RefreshTokenRequestDTO;
import com.uniflow.auth.dto.RegistrationResponseDTO;
import com.uniflow.auth.dto.ResetPasswordRequestDTO;
import com.uniflow.auth.dto.SetPasswordRequestDTO;
import com.uniflow.auth.dto.SetPasswordResponseDTO;
import com.uniflow.auth.dto.StudentRegistrationRequestDTO;
import com.uniflow.auth.service.AuthService;
import com.uniflow.common.dto.ApiResponse;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.net.URI;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * AuthHandler provides functional request handling for authentication operations
 *
 * <p>This handler follows the functional routing pattern used in Spring WebFlux, where business
 * logic is separated from routing configuration. Each method handles a specific endpoint and
 * returns a ServerResponse.
 *
 * <p>Pattern Usage: - Request validation and parameter extraction - Delegate business logic to
 * service layer - Transform service responses to HTTP responses - Error handling and logging
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuthHandler {

    private final AuthService authService;
    private final Validator validator;

    @Value("${uniflow.auth.google.oauth.frontend-redirect-uri:http://localhost:5173/auth/callback}")
    private String frontendRedirectUri;

    /** Handle user login requests POST /api/v1/auth/login */
    public Mono<ServerResponse> login(ServerRequest request) {
        return request
            .bodyToMono(LoginRequestDTO.class)
            .doOnNext(loginRequest -> {
                // Extract IP address and user agent from request headers
                String clientIp = extractClientIp(request);
                String userAgent = request.headers().firstHeader("User-Agent");

                loginRequest.setIpAddress(clientIp);
                loginRequest.setUserAgent(userAgent);

                log.info(
                    "Login attempt for user: {}",
                    loginRequest.getUsernameOrEmail()
                );
            })
            .flatMap(authService::login)
            .flatMap(response -> {
                if (response.isSuccess()) {
                    return ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(response);
                } else {
                    return ServerResponse.status(401)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(response);
                }
            })
            .onErrorResume(error -> {
                log.error("Login error", error);
                ApiResponse<LoginResponseDTO> errorResponse = ApiResponse.error(
                    "Authentication failed: " + error.getMessage()
                );
                return ServerResponse.status(401)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            });
    }

    /**
     * Get Google OAuth authorization URL
     */
    public Mono<ServerResponse> getGoogleAuthUrl(ServerRequest request) {
        String ipAddress = extractClientIp(request);
        String userAgent = request.headers().firstHeader("User-Agent");
        
        // Determine dynamic frontend callback URL
        String frontendCallbackUrl = request.queryParam("redirectUri").orElse(null);
        if (frontendCallbackUrl == null) {
            String origin = request.headers().firstHeader("Origin");
            if (origin != null && !origin.isEmpty()) {
                frontendCallbackUrl = origin + "/auth/callback";
            } else {
                String referer = request.headers().firstHeader("Referer");
                if (referer != null && !referer.isEmpty()) {
                    try {
                        java.net.URI uri = new java.net.URI(referer);
                        frontendCallbackUrl = uri.getScheme() + "://" + uri.getAuthority() + "/auth/callback";
                    } catch (Exception e) {
                        log.warn("Failed to parse referer: {}", referer);
                    }
                }
            }
        }

        return authService
            .getGoogleAuthUrl(ipAddress, userAgent, frontendCallbackUrl)
            .flatMap(this::createAuthResponse)
            .doOnSuccess(response ->
                log.info("Generated Google OAuth URL for IP: {}", ipAddress)
            )
            .onErrorResume(this::createErrorResponse);
    }

    /**
     * Process Google OAuth login callback
     */
    public Mono<ServerResponse> googleLogin(ServerRequest request) {
        return Mono.fromCallable(() -> {
            String code = request.queryParam("code").orElse(null);
            String state = request.queryParam("state").orElse(null);
            String ipAddress = extractClientIp(request);
            String userAgent = request.headers().firstHeader("User-Agent");

            return GoogleOAuthRequestDTO.builder()
                .code(code)
                .state(state)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .build();
        })
            .doOnNext(req -> log.info("Google OAuth login attempt"))
            .flatMap(this::validateOAuthRequest)
            .flatMap(authService::processGoogleLogin)
            .flatMap(response -> {
                com.uniflow.auth.dto.LoginResponseDTO data = response.getData();
                
                String dynamicRedirect = frontendRedirectUri;
                String state = request.queryParam("state").orElse("");
                if (state.contains("_url_")) {
                    try {
                        String[] parts = state.split("_url_", 2);
                        dynamicRedirect = new String(java.util.Base64.getUrlDecoder().decode(parts[1]), java.nio.charset.StandardCharsets.UTF_8);
                        log.debug("Using dynamic frontend redirect URI: {}", dynamicRedirect);
                    } catch (Exception e) {
                        log.warn("Failed to decode dynamic redirect URI from state", e);
                    }
                }
                
                String redirectUrl = dynamicRedirect + 
                    "?accessToken=" + data.getAccessToken() + 
                    "&refreshToken=" + data.getRefreshToken() + 
                    "&userId=" + data.getUserId();
                return ServerResponse.status(HttpStatus.FOUND)
                    .location(URI.create(redirectUrl))
                    .build();
            })
            .doOnSuccess(response -> log.info("Google OAuth login completed, redirected to frontend"))
            .onErrorResume(e -> {
                log.error("Google OAuth login failed", e);
                
                String dynamicRedirect = frontendRedirectUri;
                String state = request.queryParam("state").orElse("");
                if (state.contains("_url_")) {
                    try {
                        String[] parts = state.split("_url_", 2);
                        dynamicRedirect = new String(java.util.Base64.getUrlDecoder().decode(parts[1]), java.nio.charset.StandardCharsets.UTF_8);
                    } catch (Exception ex) {}
                }
                
                String errorUrl = dynamicRedirect + "?error=AuthenticationFailed";
                return ServerResponse.status(HttpStatus.FOUND)
                    .location(URI.create(errorUrl))
                    .build();
            });
    }

    /**
     * Extract optional state parameter from request
     */
    private String extractOptionalState(ServerRequest request) {
        return request.queryParam("state").orElse(null);
    }

    /**
     * Validate OAuth request
     */
    private Mono<GoogleOAuthRequestDTO> validateOAuthRequest(
        GoogleOAuthRequestDTO request
    ) {
        Set<ConstraintViolation<GoogleOAuthRequestDTO>> violations =
            validator.validate(request);

        if (!violations.isEmpty()) {
            String errorMessage = violations
                .stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining(", "));
            return Mono.error(
                new IllegalArgumentException(
                    "Validation failed: " + errorMessage
                )
            );
        }

        return Mono.just(request);
    }

    /**
     * Create authentication response for OAuth URL generation
     */
    private Mono<ServerResponse> createAuthResponse(
        ApiResponse<?> apiResponse
    ) {
        if (apiResponse.isSuccess()) {
            return ServerResponse.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(apiResponse);
        } else {
            return createErrorResponse(
                new RuntimeException(apiResponse.getMessage())
            );
        }
    }

    /**
     * Create success response for OAuth login
     */
    private Mono<ServerResponse> createSuccessResponse(
        ApiResponse<?> apiResponse
    ) {
        return ServerResponse.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(apiResponse);
    }

    /**
     * Create error response with appropriate HTTP status
     */
    private Mono<ServerResponse> createErrorResponse(Throwable error) {
        log.error("Request processing error", error);

        HttpStatus status = determineErrorStatus(error);
        ApiResponse<Void> errorResponse = ApiResponse.error(error.getMessage());

        return ServerResponse.status(status)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(errorResponse);
    }

    /**
     * Determine appropriate HTTP status code for error
     */
    private HttpStatus determineErrorStatus(Throwable error) {
        if (error instanceof IllegalArgumentException) {
            return HttpStatus.BAD_REQUEST;
        } else if (
            error.getMessage() != null &&
            error.getMessage().contains("authentication")
        ) {
            return HttpStatus.UNAUTHORIZED;
        }
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    /** Handle token refresh requests POST /api/v1/auth/refresh */
    public Mono<ServerResponse> refreshToken(ServerRequest request) {
        return request
            .bodyToMono(RefreshTokenRequestDTO.class)
            .doOnNext(refreshRequest -> {
                String clientIp = extractClientIp(request);
                String userAgent = request.headers().firstHeader("User-Agent");

                refreshRequest.setIpAddress(clientIp);
                refreshRequest.setUserAgent(userAgent);

                log.info("Token refresh attempt");
            })
            .flatMap(authService::refreshToken)
            .flatMap(response -> {
                if (response.isSuccess()) {
                    return ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(response);
                } else {
                    return ServerResponse.status(401)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(response);
                }
            })
            .onErrorResume(error -> {
                log.error("Token refresh error", error);
                ApiResponse<LoginResponseDTO> errorResponse = ApiResponse.error(
                    "Token refresh failed: " + error.getMessage()
                );
                return ServerResponse.status(401)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            });
    }

    /** Handle user logout requests POST /api/v1/auth/logout */
    public Mono<ServerResponse> logout(ServerRequest request) {
        String authHeader = request.headers().firstHeader("Authorization");
        String refreshToken = request.headers().firstHeader("X-Refresh-Token");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Invalid authorization header for logout");
            ApiResponse<Void> errorResponse = ApiResponse.error(
                "Invalid authorization header"
            );
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(errorResponse);
        }

        String accessToken = authHeader.substring(7);
        log.info("Logout attempt");

        return authService
            .logout(accessToken, refreshToken)
            .flatMap(response -> {
                if (response.isSuccess()) {
                    return ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(response);
                } else {
                    return ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(response);
                }
            })
            .onErrorResume(error -> {
                log.error("Logout error", error);
                ApiResponse<Void> errorResponse = ApiResponse.error(
                    "Logout failed: " + error.getMessage()
                );
                return ServerResponse.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            });
    }

    /** Handle forgot password requests POST /api/v1/auth/forgot-password */
    public Mono<ServerResponse> forgotPassword(ServerRequest request) {
        return request
            .bodyToMono(ForgotPasswordRequestDTO.class)
            .doOnNext(forgotPasswordRequest -> {
                // Extract IP address and user agent from request headers
                String clientIp = extractClientIp(request);
                String userAgent = request.headers().firstHeader("User-Agent");

                forgotPasswordRequest.setUserAgent(userAgent);

                log.info(
                    "Password reset request for email: {}",
                    forgotPasswordRequest.getEmail()
                );
            })
            .flatMap(forgotPasswordRequest -> {
                String clientIp = extractClientIp(request);
                return authService.forgotPassword(
                    forgotPasswordRequest,
                    clientIp
                );
            })
            .flatMap(response -> {
                if (response.isSuccess()) {
                    return ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(response);
                } else {
                    return ServerResponse.status(400)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(response);
                }
            })
            .onErrorResume(error -> {
                log.error("Forgot password error", error);
                ApiResponse<PasswordResetResponseDTO> errorResponse =
                    ApiResponse.error(
                        "Password reset request failed: " + error.getMessage()
                    );
                return ServerResponse.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            });
    }

    /** Handle reset password requests POST /api/v1/auth/reset-password */
    public Mono<ServerResponse> resetPassword(ServerRequest request) {
        return request
            .bodyToMono(ResetPasswordRequestDTO.class)
            .doOnNext(resetPasswordRequest -> {
                String clientIp = extractClientIp(request);
                String userAgent = request.headers().firstHeader("User-Agent");

                resetPasswordRequest.setClientInfo(userAgent);

                log.info(
                    "Password reset confirmation with token: {}",
                    resetPasswordRequest.getResetToken()
                );
            })
            .flatMap(resetPasswordRequest -> {
                String clientIp = extractClientIp(request);
                return authService.resetPassword(
                    resetPasswordRequest,
                    clientIp
                );
            })
            .flatMap(response -> {
                if (response.isSuccess()) {
                    return ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(response);
                } else {
                    return ServerResponse.status(400)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(response);
                }
            })
            .onErrorResume(error -> {
                log.error("Reset password error", error);
                ApiResponse<PasswordResetResponseDTO> errorResponse =
                    ApiResponse.error(
                        "Password reset failed: " + error.getMessage()
                    );
                return ServerResponse.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            });
    }

    /** Enhanced student registration handler with input sanitization POST /api/v1/auth/register/student */
    public Mono<ServerResponse> registerStudent(ServerRequest request) {
        return request
            .bodyToMono(StudentRegistrationRequestDTO.class)
            .doOnNext(registrationRequest -> {
                // Extract IP address and user agent from request headers
                String clientIp = extractClientIp(request);
                String userAgent = request.headers().firstHeader("User-Agent");

                registrationRequest.setIpAddress(clientIp);
                registrationRequest.setUserAgent(userAgent);

                // Input sanitization
                sanitizeStudentRegistrationInput(registrationRequest);

                log.info(
                    "Enhanced student registration attempt - Email: {}, Username: {}, Country: {}, HasPhone: {}",
                    registrationRequest.getEmail(),
                    registrationRequest.getUsername(),
                    registrationRequest.getCountry(),
                    registrationRequest.getPhoneNumber() != null &&
                        !registrationRequest.getPhoneNumber().trim().isEmpty()
                );
            })
            .flatMap(authService::registerStudent)
            .flatMap(response -> {
                if (response.isSuccess()) {
                    log.info(
                        "Student registration successful for email: {}",
                        response.getData() != null
                            ? response.getData().getEmail()
                            : "unknown"
                    );
                    return ServerResponse.status(201)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(response);
                } else {
                    log.warn(
                        "Student registration failed with response: {}",
                        response.getMessage()
                    );
                    return ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(response);
                }
            })
            .onErrorResume(error -> {
                log.error(
                    "Student registration error: {}",
                    error.getMessage(),
                    error
                );
                ApiResponse<RegistrationResponseDTO> errorResponse =
                    ApiResponse.error(
                        "Student registration failed: " + error.getMessage()
                    );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            });
    }

    /** Handle admin registration requests POST /api/v1/auth/register/admin */
    public Mono<ServerResponse> registerAdmin(ServerRequest request) {
        return request
            .bodyToMono(AdminRegistrationRequestDTO.class)
            .flatMap(this::validateAdminRegistrationRequest)
            .onErrorResume(
                org.springframework.web.server.ServerWebInputException.class,
                error -> {
                    // Handle JSON deserialization errors with specific field validation
                    String errorMessage = error.getMessage();
                    if (
                        errorMessage != null &&
                        errorMessage.contains("Unrecognized field")
                    ) {
                        // Extract the field name from the error message
                        String fieldName = extractFieldNameFromError(
                            errorMessage
                        );
                        String validationMessage = String.format(
                            "Invalid field '%s'. Valid fields for admin registration are: username, email, password, confirmPassword, firstName, lastName, phoneNumber, employeeId, role, department, jobTitle, specializaton, country, city, timezone, language, territoryIdentifier, organizationId, privacyPolicyAccepted, termsOfServiceAccepted",
                            fieldName
                        );
                        ApiResponse<RegistrationResponseDTO> errorResponse =
                            ApiResponse.error(validationMessage);
                        return ServerResponse.badRequest()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(errorResponse)
                            .then(Mono.empty());
                    }

                    // Handle other validation errors
                    String validationMessage =
                        "Invalid request format. Please check your JSON structure and field names.";
                    if (errorMessage != null) {
                        if (
                            errorMessage.contains(
                                "Required request body is missing"
                            )
                        ) {
                            validationMessage =
                                "Request body is required for admin registration.";
                        } else if (
                            errorMessage.contains("JSON decoding error")
                        ) {
                            validationMessage =
                                "Invalid JSON format in request body.";
                        }
                    }

                    ApiResponse<RegistrationResponseDTO> errorResponse =
                        ApiResponse.error(validationMessage);
                    return ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(errorResponse)
                        .then(Mono.empty());
                }
            )
            .doOnNext(registrationRequest -> {
                // Extract IP address and user agent from request headers
                String clientIp = extractClientIp(request);
                String userAgent = request.headers().firstHeader("User-Agent");

                registrationRequest.setIpAddress(clientIp);
                registrationRequest.setUserAgent(userAgent);

                log.info(
                    "Admin registration attempt for email: {}",
                    registrationRequest.getEmail()
                );
            })
            .flatMap(authService::registerAdmin)
            .flatMap(response -> {
                if (response.isSuccess()) {
                    return ServerResponse.status(201)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(response);
                } else {
                    return ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(response);
                }
            })
            .onErrorResume(error -> {
                log.error("Admin registration error", error);
                ApiResponse<RegistrationResponseDTO> errorResponse =
                    ApiResponse.error(
                        "Admin registration failed: " + error.getMessage()
                    );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            });
    }

    /** Validate admin registration request using Bean Validation */
    private Mono<AdminRegistrationRequestDTO> validateAdminRegistrationRequest(
        AdminRegistrationRequestDTO request
    ) {
        log.debug(
            "Handler validation - received role: '{}'",
            request.getRole()
        );

        Set<ConstraintViolation<AdminRegistrationRequestDTO>> violations =
            validator.validate(request);

        if (!violations.isEmpty()) {
            String errorMessage = violations
                .stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining(", "));

            log.error("Bean validation failed: {}", errorMessage);
            return Mono.error(
                new IllegalArgumentException(
                    "Validation failed: " + errorMessage
                )
            );
        }

        // Additional custom validation
        if (!request.isRoleValid()) {
            log.error(
                "Custom role validation failed - invalid role: '{}'",
                request.getRole()
            );
            return Mono.error(
                new IllegalArgumentException(
                    "Invalid admin role '" +
                        request.getRole() +
                        "'. Valid roles are: ADMIN, COUNSELOR, MANAGER, SUPER_ADMIN"
                )
            );
        }

        log.debug("Handler validation passed - role: '{}'", request.getRole());
        return Mono.just(request);
    }

    private String extractFieldNameFromError(String errorMessage) {
        // Extract field name from error like: "Unrecognized field "userType" (class ...)"
        if (errorMessage.contains("Unrecognized field \"")) {
            int start = errorMessage.indexOf("Unrecognized field \"") + 20;
            int end = errorMessage.indexOf("\"", start);
            if (end > start) {
                return errorMessage.substring(start, end);
            }
        }
        return "unknown";
    }

    /** Handle email verification requests GET /api/v1/auth/verify-email */
    public Mono<ServerResponse> verifyEmail(ServerRequest request) {
        String token = request.queryParam("token").orElse("");

        log.info("Email verification request with token: {}", token);

        return authService
            .verifyEmail(token)
            .flatMap(response -> {
                return ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(response);
            })
            .onErrorResume(error -> {
                log.error("Email verification error", error);
                ApiResponse<Object> errorResponse = ApiResponse.error(
                    "Email verification failed: " + error.getMessage()
                );
                return ServerResponse.status(400)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            });
    }

    /** Handle health check requests GET /api/v1/auth/health */
    public Mono<ServerResponse> healthCheck(ServerRequest request) {
        return ServerResponse.ok()
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(ApiResponse.success("OK", "Auth service is healthy"));
    }

    /**
     * Handle set-password requests POST /api/v1/auth/set-password
     *
     * <p>Authenticated endpoint. JWT filter already validated the token and placed
     * userId in exchange attributes. No need to re-parse the token here.
     */
    public Mono<ServerResponse> setPassword(ServerRequest request) {
        Long userId = (Long) request.attributes().get("userId");

        if (userId == null) {
            ApiResponse<Void> errorResponse = ApiResponse.error(
                "Authentication required: missing user context"
            );
            return ServerResponse.status(401)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(errorResponse);
        }

        return request
            .bodyToMono(SetPasswordRequestDTO.class)
            .doOnNext(dto -> log.info("Set-password request for userId: {}", userId))
            .flatMap(dto -> authService.setPassword(userId, dto))
            .flatMap(response -> {
                if (response.isSuccess()) {
                    return ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(response);
                } else {
                    return ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(response);
                }
            })
            .onErrorResume(error -> {
                log.error("Set-password error for userId: {}", userId, error);
                ApiResponse<Void> errorResponse = ApiResponse.error(
                    "Failed to set password: " + error.getMessage()
                );
                return ServerResponse.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            });
    }

    /** Extract client IP address from request headers */
    private String extractClientIp(ServerRequest request) {

        String xForwardedFor = request.headers().firstHeader("X-Forwarded-For");
        String xRealIp = request.headers().firstHeader("X-Real-IP");

        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs, take the first one
            return xForwardedFor.split(",")[0].trim();
        } else if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp.trim();
        } else {
            return "127.0.0.1"; // Default fallback
        }
    }

    /**
     * Sanitize student registration input to prevent XSS and injection attacks
     */
    private void sanitizeStudentRegistrationInput(
        StudentRegistrationRequestDTO request
    ) {
        if (request == null) return;

        // Sanitize text fields
        if (request.getUsername() != null) {
            request.setUsername(sanitizeString(request.getUsername()));
        }
        if (request.getEmail() != null) {
            request.setEmail(sanitizeString(request.getEmail()).toLowerCase());
        }
        if (request.getFirstName() != null) {
            request.setFirstName(sanitizeString(request.getFirstName()));
        }
        if (request.getLastName() != null) {
            request.setLastName(sanitizeString(request.getLastName()));
        }
        if (request.getCountry() != null) {
            request.setCountry(sanitizeString(request.getCountry()));
        }
        if (request.getCity() != null) {
            request.setCity(sanitizeString(request.getCity()));
        }
        if (request.getFieldOfStudy() != null) {
            request.setFieldOfStudy(sanitizeString(request.getFieldOfStudy()));
        }
        if (request.getTerritoryIdentifier() != null) {
            request.setTerritoryIdentifier(
                sanitizeString(request.getTerritoryIdentifier())
            );
        }
        if (request.getUtmSource() != null) {
            request.setUtmSource(sanitizeString(request.getUtmSource()));
        }
        if (request.getUtmCampaign() != null) {
            request.setUtmCampaign(sanitizeString(request.getUtmCampaign()));
        }
        if (request.getReferralCode() != null) {
            request.setReferralCode(sanitizeString(request.getReferralCode()));
        }

        // Validate and sanitize phone number (optional)
        if (
            request.getPhoneNumber() != null &&
            !request.getPhoneNumber().trim().isEmpty()
        ) {
            String sanitizedPhone = sanitizeString(request.getPhoneNumber());
            // Remove all non-digit and non-plus characters for validation
            String phoneDigits = sanitizedPhone.replaceAll("[^\\d+]", "");
            request.setPhoneNumber(phoneDigits);
        }

        // Set default values for optional fields if null
        if (
            request.getTimezone() == null ||
            request.getTimezone().trim().isEmpty()
        ) {
            request.setTimezone("UTC");
        }
        if (
            request.getLanguage() == null ||
            request.getLanguage().trim().isEmpty()
        ) {
            request.setLanguage("en");
        }
        if (
            request.getStudyMode() == null ||
            request.getStudyMode().trim().isEmpty()
        ) {
            request.setStudyMode("FULL_TIME");
        }

        log.debug(
            "Student registration input sanitization completed for email: {}",
            request.getEmail()
        );
    }

    /**
     * Basic string sanitization to prevent XSS
     */
    private String sanitizeString(String input) {
        if (input == null) return null;

        return input
            .trim()
            .replaceAll("[<>\"'&]", "") // Remove basic HTML/script characters
            .replaceAll("\\s+", " "); // Normalize whitespace
    }
}
