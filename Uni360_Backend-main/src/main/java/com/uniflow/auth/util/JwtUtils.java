package com.uniflow.auth.util;

import com.uniflow.auth.dto.UserJwtDto;
import com.uniflow.auth.service.JwtService;
import io.jsonwebtoken.Claims;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import reactor.core.publisher.Mono;

/**
 * JWT Utilities for token parsing and user information extraction
 *
 * <p>This utility class provides convenience methods for extracting user information from JWT
 * tokens in reactive handlers and services. It follows the same pattern as the reference
 * implementation from finvolv project.
 *
 * <p>Features: - User information extraction from tokens - Server request token parsing - Reactive
 * programming support - Error handling and validation
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtUtils {

    private final JwtService jwtService;

    /**
     * Extract user information from JWT token
     *
     * @param token JWT token string
     * @return Mono containing UserJwtDto with user information
     */
    public Mono<UserJwtDto> getUserInfoFromJwt(String token) {
        return jwtService
            .validateToken(token)
            .map(this::buildUserJwtDto)
            .doOnNext(userDto ->
                log.debug("Extracted user info for: {}", userDto.getUsername())
            )
            .doOnError(error ->
                log.error(
                    "Error extracting user info from JWT: {}",
                    error.getMessage()
                )
            );
    }

    /**
     * Extract user information from ServerRequest Authorization header
     *
     * @param request ServerRequest containing Authorization header
     * @return Mono containing UserJwtDto with user information
     */
    public Mono<UserJwtDto> getUserFromServerRequest(ServerRequest request) {
        String token = extractTokenFromHeader(request);

        if (token == null) {
            log.warn("No Authorization header found in request");
            return Mono.empty();
        }

        return getUserInfoFromJwt(token);
    }

    /**
     * Extract username from ServerRequest Authorization header
     *
     * @param request ServerRequest containing Authorization header
     * @return Mono containing username string
     */
    public Mono<String> getUsernameFromServerRequest(ServerRequest request) {
        return getUserFromServerRequest(request)
            .map(UserJwtDto::getUsername)
            .doOnNext(username ->
                log.debug("Extracted username: {}", username)
            );
    }

    /**
     * Extract user ID from ServerRequest Authorization header
     *
     * @param request ServerRequest containing Authorization header
     * @return Mono containing user ID
     */
    public Mono<Long> getUserIdFromServerRequest(ServerRequest request) {
        return getUserFromServerRequest(request)
            .map(UserJwtDto::getId)
            .doOnNext(userId -> log.debug("Extracted user ID: {}", userId));
    }

    /**
     * Extract user email from ServerRequest Authorization header
     *
     * @param request ServerRequest containing Authorization header
     * @return Mono containing user email
     */
    public Mono<String> getUserEmailFromServerRequest(ServerRequest request) {
        return getUserFromServerRequest(request)
            .map(UserJwtDto::getEmail)
            .doOnNext(email -> log.debug("Extracted user email: {}", email));
    }

    /**
     * Extract user type from ServerRequest Authorization header
     *
     * @param request ServerRequest containing Authorization header
     * @return Mono containing user type string
     */
    public Mono<String> getUserTypeFromServerRequest(ServerRequest request) {
        return getUserFromServerRequest(request)
            .map(UserJwtDto::getUserType)
            .doOnNext(userType ->
                log.debug("Extracted user type: {}", userType)
            );
    }

    /**
     * Extract client IP address from ServerRequest headers
     *
     * @param request ServerRequest containing client information
     * @return Client IP address string
     */
    public String extractClientIp(ServerRequest request) {
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
     * Extract JWT token from Authorization header
     *
     * @param request ServerRequest containing Authorization header
     * @return JWT token string or null if not found
     */
    public String extractTokenFromHeader(ServerRequest request) {
        String authHeader = request.headers().firstHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        return null;
    }

    /**
     * Check if user has specific role
     *
     * @param request ServerRequest containing Authorization header
     * @param role Role to check
     * @return Mono containing boolean result
     */
    public Mono<Boolean> userHasRole(ServerRequest request, String role) {
        return getUserFromServerRequest(request)
            .map(
                user ->
                    user.getRoles() != null && user.getRoles().contains(role)
            )
            .defaultIfEmpty(false)
            .doOnNext(hasRole ->
                log.debug("User has role '{}': {}", role, hasRole)
            );
    }

    /**
     * Check if user has any of the specified roles
     *
     * @param request ServerRequest containing Authorization header
     * @param roles List of roles to check
     * @return Mono containing boolean result
     */
    public Mono<Boolean> userHasAnyRole(
        ServerRequest request,
        List<String> roles
    ) {
        return getUserFromServerRequest(request)
            .map(user -> {
                if (user.getRoles() == null || roles == null) {
                    return false;
                }
                return user.getRoles().stream().anyMatch(roles::contains);
            })
            .defaultIfEmpty(false)
            .doOnNext(hasRole ->
                log.debug("User has any of roles {}: {}", roles, hasRole)
            );
    }

    /**
     * Get user's territory identifier from token
     *
     * @param request ServerRequest containing Authorization header
     * @return Mono containing territory identifier
     */
    public Mono<String> getUserTerritoryFromServerRequest(
        ServerRequest request
    ) {
        return getUserFromServerRequest(request)
            .map(UserJwtDto::getTerritoryIdentifier)
            .doOnNext(territory ->
                log.debug("Extracted user territory: {}", territory)
            );
    }

    /**
     * Get user's client type from token
     *
     * @param request ServerRequest containing Authorization header
     * @return Mono containing client type
     */
    public Mono<String> getUserClientTypeFromServerRequest(
        ServerRequest request
    ) {
        return getUserFromServerRequest(request)
            .map(UserJwtDto::getClientType)
            .doOnNext(clientType ->
                log.debug("Extracted user client type: {}", clientType)
            );
    }

    /**
     * Build UserJwtDto from JWT Claims
     *
     * @param claims JWT token claims
     * @return UserJwtDto with extracted information
     */
    @SuppressWarnings("unchecked")
    private UserJwtDto buildUserJwtDto(Claims claims) {
        UserJwtDto userDto = new UserJwtDto();

        userDto.setId(Long.parseLong(claims.getSubject()));
        userDto.setUsername(claims.get("username", String.class));
        userDto.setEmail(claims.get("email", String.class));
        userDto.setFirstName(claims.get("firstName", String.class));
        userDto.setLastName(claims.get("lastName", String.class));
        userDto.setUserType(claims.get("userType", String.class));
        userDto.setClientType(claims.get("clientType", String.class));
        userDto.setTerritoryIdentifier(
            claims.get("territoryIdentifier", String.class)
        );
        userDto.setOrganizationId(claims.get("organizationId", String.class));
        userDto.setDepartment(claims.get("department", String.class));
        userDto.setStatus(claims.get("status", String.class));
        userDto.setTimezone(claims.get("timezone", String.class));
        userDto.setLanguage(claims.get("language", String.class));

        // Extract session timeout
        Object sessionTimeoutObj = claims.get("sessionTimeout");
        if (sessionTimeoutObj instanceof Integer) {
            userDto.setSessionTimeoutMinutes((Integer) sessionTimeoutObj);
        }

        // Extract roles if present
        Object rolesObj = claims.get("roles");
        if (rolesObj instanceof List) {
            userDto.setRoles((List<String>) rolesObj);
        }

        // Extract permissions if present
        Object permissionsObj = claims.get("permissions");
        if (permissionsObj instanceof List) {
            userDto.setPermissions((List<String>) permissionsObj);
        }

        // Extract groups if present
        Object groupsObj = claims.get("groups");
        if (groupsObj instanceof List) {
            userDto.setGroups((List<String>) groupsObj);
        }

        return userDto;
    }
}
