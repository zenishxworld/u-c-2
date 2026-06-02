package com.uniflow.auth.filter;

import com.uniflow.auth.service.JwtService;
import jakarta.annotation.Nonnull;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * JWT Validation Filter for reactive web filter chain
 *
 * <p>This filter validates JWT tokens and extracts user information for downstream handlers. It
 * follows the reactive programming model and integrates with the existing JWT service.
 *
 * <p>Features: - Token validation and parsing - User context extraction and storage - Public
 * endpoint bypass - Proper error handling and logging
 */
@RequiredArgsConstructor
@Slf4j
public class JwtValidationWebFilter implements WebFilter {

    private final JwtService jwtService;

    // Public endpoints that don't require authentication
    private static final List<String> PUBLIC_PATHS = Arrays.asList(
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/auth/register/student",
        "/api/v1/auth/register/admin",
        "/api/v1/auth/refresh",
        "/api/v1/auth/forgot-password",
        "/api/v1/auth/reset-password",
        "/api/v1/auth/verify-email",
        "/api/v1/auth/google/url",
        "/api/v1/auth/google/callback",
        "/api/v1/auth/health",
        "/api/v1/universities",
        "/api/v1/health",
        "/api/v1/ai/health",
        "/api/v1/public",
        "/health",
        "/actuator",
        "/swagger-ui",
        "/v3/api-docs",
        "/webjars"
    );

    @Nonnull
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String path = exchange.getRequest().getPath().value();

        log.debug("Processing request for path: {}", path);

        // Skip JWT validation for public endpoints
        if (isPublicPath(path)) {
            log.debug("Skipping JWT validation for public path: {}", path);
            return chain.filter(exchange);
        }

        String token = extractTokenFromRequest(exchange);

        if (token == null) {
            log.warn(
                "No Authorization header found for protected path: {}",
                path
            );
            return handleUnauthorized(exchange, "Missing Authorization header");
        }

        return jwtService
            .validateToken(token)
            .doOnNext(claims ->
                log.debug(
                    "Token validation successful for path: {}, subject: {}",
                    path,
                    claims.getSubject()
                )
            )
            .flatMap(claims -> {
                try {
                    // Extract user information from token claims with null checks
                    Long userId = Long.parseLong(claims.getSubject());
                    String username = claims.get("username", String.class);
                    String email = claims.get("email", String.class);
                    String userType = claims.get("userType", String.class);
                    String clientType = claims.get("clientType", String.class);
                    String territoryIdentifier = claims.get(
                        "territoryIdentifier",
                        String.class
                    );

                    log.debug(
                        "Extracted claims - userId: {}, username: {}, userType: {}",
                        userId,
                        username,
                        userType
                    );

                    // Validate required fields
                    if (username == null || userType == null) {
                        throw new IllegalArgumentException(
                            "Missing required JWT claims: username or userType"
                        );
                    }

                    // Store user context in exchange attributes for downstream handlers
                    exchange.getAttributes().put("userId", userId);
                    exchange.getAttributes().put("username", username);
                    if (email != null) {
                        exchange.getAttributes().put("email", email);
                    }
                    exchange.getAttributes().put("userType", userType);
                    if (clientType != null) {
                        exchange.getAttributes().put("clientType", clientType);
                    }
                    if (territoryIdentifier != null) {
                        exchange
                            .getAttributes()
                            .put("territoryIdentifier", territoryIdentifier);
                    }
                    exchange.getAttributes().put("jwtClaims", claims);

                    // Create Spring Security Authentication with proper authorities
                    List<SimpleGrantedAuthority> authorities = Arrays.asList(
                        new SimpleGrantedAuthority("ROLE_" + userType)
                    );

                    UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                            username,
                            null,
                            authorities
                        );

                    log.debug(
                        "Successfully validated JWT for user: {} (ID: {}) with role: ROLE_{}",
                        username,
                        userId,
                        userType
                    );

                    // Set the security context and continue with the request
                    return chain
                        .filter(exchange)
                        .contextWrite(
                            ReactiveSecurityContextHolder.withAuthentication(
                                authentication
                            )
                        );
                } catch (Exception e) {
                    log.error(
                        "Error processing JWT claims for path: {} - {}",
                        path,
                        e.getMessage(),
                        e
                    );
                    return Mono.error(e);
                }
            })
            .onErrorResume(error -> {
                String errorMessage =
                    error.getMessage() != null
                        ? error.getMessage()
                        : error.getClass().getSimpleName();

                // Check if this is a routing/method error rather than auth error
                if (
                    errorMessage.contains("No static resource") ||
                    errorMessage.contains("404 NOT_FOUND")
                ) {
                    log.debug(
                        "Request path not found: {} - letting Spring handle routing",
                        path
                    );
                    // Let Spring handle the routing error instead of treating as auth failure
                    return chain.filter(exchange);
                }

                log.debug(
                    "JWT validation failed for path: {} - {}",
                    path,
                    errorMessage
                );
                return handleUnauthorized(exchange, "Invalid or expired token");
            });
    }

    /** Check if the request path is public and doesn't require authentication */
    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(publicPath ->
            path.startsWith(publicPath)
        );
    }

    /** Extract JWT token from Authorization header */
    private String extractTokenFromRequest(ServerWebExchange exchange) {
        String authHeader = exchange
            .getRequest()
            .getHeaders()
            .getFirst("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        return null;
    }

    /** Handle unauthorized access by returning 401 status */
    private Mono<Void> handleUnauthorized(
        ServerWebExchange exchange,
        String message
    ) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);

        // Add error message to response headers for debugging
        response.getHeaders().add("X-Auth-Error", message);

        return response.setComplete();
    }
}
