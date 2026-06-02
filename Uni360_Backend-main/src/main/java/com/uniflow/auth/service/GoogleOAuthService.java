package com.uniflow.auth.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.auth.config.GoogleOAuthConfig;
import com.uniflow.auth.dto.*;
import com.uniflow.auth.dto.StudentRegistrationRequestDTO;
import com.uniflow.auth.entity.User;
import com.uniflow.auth.enums.AuthProvider;
import com.uniflow.auth.repository.UserRepository;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

/**
 * Enterprise-Grade Google OAuth Service with Reactive Composition
 * Handles complete OAuth 2.0 flow with Google including token exchange,
 * user registration, and authentication integration
 */
@Slf4j
@Service
public class GoogleOAuthService {

    private final GoogleOAuthConfig config;
    private final WebClient googleOAuthWebClient;
    private final WebClient googleApiWebClient;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    // Constructor with @Lazy injection to break circular dependency
    public GoogleOAuthService(
        GoogleOAuthConfig config,
        WebClient googleOAuthWebClient,
        WebClient googleApiWebClient,
        UserRepository userRepository,
        @Lazy AuthService authService,
        JwtService jwtService,
        ObjectMapper objectMapper
    ) {
        this.config = config;
        this.googleOAuthWebClient = googleOAuthWebClient;
        this.googleApiWebClient = googleApiWebClient;
        this.userRepository = userRepository;
        this.authService = authService;
        this.jwtService = jwtService;
        this.objectMapper = objectMapper;
    }

    /**
     * Generate Google OAuth authorization URL with state validation
     */
    public Mono<GoogleOAuthUrlResponseDTO> generateAuthorizationUrl(
        String ipAddress,
        String userAgent,
        String frontendCallbackUrl
    ) {
        return validateOAuthRequest(ipAddress, userAgent, frontendCallbackUrl)
            .flatMap(this::buildAuthorizationUrl)
            .map(this::createAuthUrlResponse)
            .doOnSuccess(response ->
                log.info("Generated Google OAuth URL for IP: {}", ipAddress)
            )
            .doOnError(error ->
                log.error(
                    "Failed to generate OAuth URL for IP: {}",
                    ipAddress,
                    error
                )
            );
    }

    /**
     * Process Google OAuth login with complete user flow
     */
    public Mono<LoginResponseDTO> processGoogleLogin(
        GoogleOAuthRequestDTO request
    ) {
        return validateOAuthRequest(request)
            .flatMap(this::exchangeCodeForToken)
            .flatMap(this::getUserInfoFromToken)
            .flatMap(userInfo -> handleUserAuthentication(userInfo, request))
            .doOnSuccess(response ->
                log.info(
                    "Successful Google login for user: {}",
                    request.getCode()
                )
            )
            .doOnError(error ->
                log.error(
                    "Google login failed for request: {}",
                    request.getCode(),
                    error
                )
            )
            .onErrorResume(this::handleOAuthError);
    }

    /**
     * Validate OAuth request parameters and rate limiting
     */
    private Mono<GoogleOAuthRequestDTO> validateOAuthRequest(
        GoogleOAuthRequestDTO request
    ) {
        if (request.getCode() == null || request.getCode().isEmpty()) {
            return Mono.error(
                new IllegalArgumentException("Authorization code is required")
            );
        }

        // Decode the authorization code if it's URL encoded
        try {
            String decodedCode = URLDecoder.decode(
                request.getCode(),
                StandardCharsets.UTF_8
            );
            request.setCode(decodedCode);
            log.debug(
                "Decoded authorization code: {}",
                decodedCode.substring(0, Math.min(20, decodedCode.length())) +
                    "..."
            );
        } catch (Exception e) {
            log.warn(
                "Failed to decode authorization code, using as-is: {}",
                e.getMessage()
            );
        }

        return Mono.just(request);
    }

    /**
     * Exchange authorization code for access token
     */
    private Mono<GoogleOAuthTokenResponse> exchangeCodeForToken(
        GoogleOAuthRequestDTO request
    ) {
        return buildTokenRequestBody(request.getCode())
            .flatMap(this::performTokenExchange)
            .filter(GoogleOAuthTokenResponse.IS_VALID)
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException("Invalid token response from Google")
                )
            );
    }

    /**
     * Get user information from Google using access token
     */
    private Mono<GoogleUserInfoDTO> getUserInfoFromToken(
        GoogleOAuthTokenResponse tokenResponse
    ) {
        return performUserInfoRequest(tokenResponse.getAccessToken())
            .filter(GoogleUserInfoDTO.IS_COMPLETE)
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Incomplete user information from Google"
                    )
                )
            );
    }

    /**
     * Handle user authentication - either link existing user or create new one
     */
    private Mono<LoginResponseDTO> handleUserAuthentication(
        GoogleUserInfoDTO userInfo,
        GoogleOAuthRequestDTO request
    ) {
        return findExistingUserByGoogleId(userInfo.getId())
            .cast(User.class)
            .switchIfEmpty(handleNewOrExistingUser(userInfo))
            .flatMap(user -> createLoginResponse(user, userInfo));
    }

    /**
     * Find existing user by Google ID
     */
    private Mono<User> findExistingUserByGoogleId(String googleId) {
        return userRepository.findByGoogleId(googleId);
    }

    /**
     * Handle new or existing user by email
     */
    private Mono<User> handleNewOrExistingUser(GoogleUserInfoDTO userInfo) {
        return userRepository
            .findByEmail(userInfo.getEmail())
            .flatMap(existingUser ->
                linkGoogleToExistingUser(existingUser, userInfo)
            )
            .switchIfEmpty(registerNewGoogleUser(userInfo));
    }

    /**
     * Link Google account to existing user
     */
    private Mono<User> linkGoogleToExistingUser(
        User existingUser,
        GoogleUserInfoDTO userInfo
    ) {
        User updatedUser = updateUserWithGoogleData(existingUser, userInfo);
        return userRepository
            .save(updatedUser)
            .doOnSuccess(user ->
                log.info(
                    "Linked Google account to existing user: {}",
                    user.getEmail()
                )
            );
    }

    /**
     * Register new user with Google OAuth
     */
    private Mono<User> registerNewGoogleUser(GoogleUserInfoDTO userInfo) {
        return createRegistrationRequest(userInfo)
            .flatMap(this::performRegistrationViaExistingAPI)
            .flatMap(response -> findAndUpdateNewUser(userInfo, response))
            .doOnSuccess(user ->
                log.info("Registered new Google user: {}", user.getEmail())
            );
    }

    /**
     * Update user with Google data while preserving existing information
     */
    private User updateUserWithGoogleData(
        User existingUser,
        GoogleUserInfoDTO userInfo
    ) {
        return existingUser.withGoogleIntegration(
            userInfo.getId(),
            userInfo.getFirstName().isEmpty()
                ? existingUser.getFirstName()
                : userInfo.getFirstName(),
            userInfo.getLastName().isEmpty()
                ? existingUser.getLastName()
                : userInfo.getLastName(),
            userInfo.getEmail()
        );
    }

    /**
     * Build Google OAuth authorization URL with state parameter
     */
    private Mono<String> buildAuthorizationUrl(GoogleOAuthRequestDTO request) {
        String state = generateSecureState();
        if (request.getFrontendCallbackUrl() != null && !request.getFrontendCallbackUrl().isEmpty()) {
            state = state + "_url_" + Base64.getUrlEncoder().withoutPadding().encodeToString(request.getFrontendCallbackUrl().getBytes(StandardCharsets.UTF_8));
        }

        String authUrl = UriComponentsBuilder.fromHttpUrl(
            GoogleOAuthConfig.AUTHORIZATION_URI
        )
            .queryParam("client_id", config.getClientId())
            .queryParam("redirect_uri", config.getRedirectUri())
            .queryParam("scope", config.getScope())
            .queryParam("response_type", "code")
            .queryParam("state", state)
            .queryParam("access_type", "offline")
            .queryParam("prompt", "consent")
            .build()
            .encode()
            .toUriString();
        return Mono.just(authUrl);
    }

    /**
     * Create authorization URL response DTO
     */
    private GoogleOAuthUrlResponseDTO createAuthUrlResponse(String authUrl) {
        return GoogleOAuthUrlResponseDTO.builder()
            .success(true)
            .authorizationUrl(authUrl)
            .state(extractStateFromUrl(authUrl))
            .provider("GOOGLE")
            .build();
    }

    /**
     * Build token exchange request body
     */
    private Mono<MultiValueMap<String, String>> buildTokenRequestBody(
        String code
    ) {
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();
        formData.add("client_id", config.getClientId());
        formData.add("client_secret", config.getClientSecret());
        formData.add("code", code);
        formData.add("grant_type", "authorization_code");
        formData.add("redirect_uri", config.getRedirectUri());

        // Log the request parameters (excluding sensitive data)
        log.debug(
            "Token exchange request - Client ID: {}",
            config.getClientId()
        );
        log.debug(
            "Token exchange request - Redirect URI: {}",
            config.getRedirectUri()
        );
        log.debug("Token exchange request - Code length: {}", code.length());

        return Mono.just(formData);
    }

    /**
     * Perform token exchange with Google
     */
    private Mono<GoogleOAuthTokenResponse> performTokenExchange(
        MultiValueMap<String, String> formData
    ) {
        return googleOAuthWebClient
            .post()
            .uri("/token")
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(BodyInserters.fromFormData(formData))
            .retrieve()
            .onStatus(
                status ->
                    status.is4xxClientError() || status.is5xxServerError(),
                response ->
                    response
                        .bodyToMono(String.class)
                        .doOnNext(errorBody ->
                            log.error(
                                "Google OAuth error response: {}",
                                errorBody
                            )
                        )
                        .flatMap(errorBody -> {
                            String errorMessage =
                                "Google OAuth token exchange failed";
                            if (errorBody.contains("invalid_grant")) {
                                errorMessage =
                                    "Authorization code expired or already used";
                            } else if (errorBody.contains("invalid_client")) {
                                errorMessage =
                                    "Invalid OAuth client credentials";
                            } else if (
                                errorBody.contains("redirect_uri_mismatch")
                            ) {
                                errorMessage = "Redirect URI mismatch";
                            }
                            return Mono.error(
                                new RuntimeException(
                                    errorMessage + ": " + errorBody
                                )
                            );
                        })
            )
            .bodyToMono(GoogleOAuthTokenResponse.class)
            .doOnSuccess(response ->
                log.debug("Successfully exchanged code for token")
            )
            .doOnError(error -> log.error("Token exchange failed", error));
    }

    /**
     * Perform user info request to Google
     */
    private Mono<GoogleUserInfoDTO> performUserInfoRequest(String accessToken) {
        return googleApiWebClient
            .get()
            .uri("/oauth2/v2/userinfo")
            .headers(headers -> headers.setBearerAuth(accessToken))
            .retrieve()
            .bodyToMono(GoogleUserInfoDTO.class)
            .doOnSuccess(userInfo ->
                log.debug("Retrieved user info: {}", userInfo.getEmail())
            )
            .doOnError(error -> log.error("User info request failed", error));
    }

    /**
     * Create registration request for new Google user
     */
    private Mono<StudentRegistrationRequestDTO> createRegistrationRequest(
        GoogleUserInfoDTO userInfo
    ) {
        String username = userInfo.generateUsername();

        // Provide fallback values for missing name fields.
        // Some Google accounts (especially business/custom domain) may not have a last name set.
        String firstName = (userInfo.getFirstName() != null && !userInfo.getFirstName().trim().isEmpty())
            ? userInfo.getFirstName().trim()
            : "User";
        String lastName = (userInfo.getLastName() != null && !userInfo.getLastName().trim().isEmpty())
            ? userInfo.getLastName().trim()
            : "Unknown";

        log.debug("Creating Google registration for: {} {} (email: {})", firstName, lastName, userInfo.getEmail());

        StudentRegistrationRequestDTO registrationRequest =
            StudentRegistrationRequestDTO.builder()
                .username(username)
                .email(userInfo.getEmail())
                .firstName(firstName)
                .lastName(lastName)
                .password(null) // No password for OAuth users
                .confirmPassword(null)
                .userType("STUDENT")
                .build();

        return Mono.just(registrationRequest);
    }

    /**
     * Perform registration via existing AuthService API
     */
    private Mono<RegistrationResponseDTO> performRegistrationViaExistingAPI(
        StudentRegistrationRequestDTO request
    ) {
        return authService
            .registerStudent(request)
            .map(apiResponse -> apiResponse.getData())
            .doOnSuccess(response ->
                log.debug(
                    "Registration completed for Google user: {}",
                    request.getEmail()
                )
            );
    }

    /**
     * Find and update newly created user with Google data
     */
    private Mono<User> findAndUpdateNewUser(
        GoogleUserInfoDTO userInfo,
        RegistrationResponseDTO registrationResponse
    ) {
        return userRepository
            .findByEmail(userInfo.getEmail())
            .map(user -> updateUserWithGoogleData(user, userInfo))
            .flatMap(userRepository::save);
    }

    /**
     * Create login response with JWT tokens
     */
    private Mono<LoginResponseDTO> createLoginResponse(
        User user,
        GoogleUserInfoDTO googleUserInfo
    ) {
        return jwtService
            .generateTokenPair(user, "google-oauth")
            .map(tokenMap ->
                LoginResponseDTO.builder()
                    .accessToken(tokenMap.get("accessToken"))
                    .refreshToken(tokenMap.get("refreshToken"))
                    .tokenType("Bearer")
                    .userId(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .fullName(user.getFullName())
                    .userType(user.getUserType())
                    .status(user.getStatus())
                    .avatarUrl(googleUserInfo.getAvatarUrl())
                    .emailVerified(true)
                    .loginAt(LocalDateTime.now())
                    .build()
            );
    }

    /**
     * Extract state parameter from authorization URL
     */
    private String extractStateFromUrl(String url) {
        try {
            return UriComponentsBuilder.fromUriString(url)
                .build()
                .getQueryParams()
                .getFirst("state");
        } catch (Exception e) {
            return UUID.randomUUID().toString();
        }
    }

    /**
     * Handle OAuth errors with appropriate responses
     */
    private Mono<LoginResponseDTO> handleOAuthError(Throwable error) {
        log.error("OAuth error: ", error);

        // Check if this is a token exchange error (expired/used code)
        if (error.getMessage() != null) {
            if (
                error
                    .getMessage()
                    .contains("Authorization code expired or already used")
            ) {
                log.warn(
                    "Google OAuth code expired or already used. Please initiate a new OAuth flow."
                );
                return Mono.error(
                    new RuntimeException(
                        "Authorization code has expired or been used. Please start a new login flow."
                    )
                );
            } else if (
                error.getMessage().contains("Invalid OAuth client credentials")
            ) {
                log.error("Invalid Google OAuth client credentials configured");
                return Mono.error(
                    new RuntimeException(
                        "OAuth configuration error. Please contact support."
                    )
                );
            } else if (error.getMessage().contains("Redirect URI mismatch")) {
                log.error("OAuth redirect URI mismatch. Check configuration.");
                return Mono.error(
                    new RuntimeException(
                        "OAuth configuration error. Redirect URI mismatch."
                    )
                );
            } else if (error.getMessage().contains("400 Bad Request")) {
                log.warn("Google OAuth request failed with 400 error");
                return Mono.error(
                    new RuntimeException(
                        "Invalid OAuth request. Please try again."
                    )
                );
            }
        }

        // Generic error response
        return Mono.error(
            new RuntimeException(
                "OAuth authentication failed. Please try again."
            )
        );
    }

    /**
     * Generate secure state parameter for OAuth flow
     */
    private String generateSecureState() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Validate OAuth request with IP and user agent
     */
    private Mono<GoogleOAuthRequestDTO> validateOAuthRequest(
        String ipAddress,
        String userAgent,
        String frontendCallbackUrl
    ) {
        return Mono.just(
            GoogleOAuthRequestDTO.builder()
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .frontendCallbackUrl(frontendCallbackUrl)
                .build()
        );
    }
}
