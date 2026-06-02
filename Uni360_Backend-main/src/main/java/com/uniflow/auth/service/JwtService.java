package com.uniflow.auth.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.auth.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import javax.crypto.SecretKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * JwtService handles JWT token generation, validation, and management
 *
 * <p>This service provides comprehensive JWT functionality including: - Access token generation and
 * validation - Refresh token management - Token claims extraction and validation - Security context
 * management - Token blacklisting and revocation
 */
@Service
@Slf4j
public class JwtService {

    private final SecretKey secretKey;
    private final ObjectMapper objectMapper;

    @Value("${jwt.expiration:360000000}") // 100 hour default in milliseconds
    private Long accessTokenExpiration;

    @Value("${jwt.refresh-expiration:86400000}") // 24 hours default in milliseconds
    private Long refreshTokenExpiration;

    @Value("${jwt.issuer:uniflow-platform}")
    private String issuer;

    @Value("${jwt.audience:uniflow-client}")
    private String audience;

    public JwtService(
        @Value(
            "${jwt.secret:MySecretKeyForJWTTokenGeneration12345MySecretKeyForJWTTokenGeneration12345}"
        ) String jwtSecret,
        ObjectMapper objectMapper
    ) {
        // Ensure the key is at least 512 bits (64 bytes) for HS512
        if (jwtSecret.getBytes().length < 64) {
            // Generate a secure key if the provided key is too short
            this.secretKey = Keys.secretKeyFor(SignatureAlgorithm.HS512);
            log.warn(
                "JWT secret key was too short for HS512. Generated a secure random key."
            );
        } else {
            this.secretKey = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        }
        this.objectMapper = objectMapper;
    }

    /** Generate access token for authenticated user */
    public Mono<String> generateAccessToken(User user) {
        return Mono.fromCallable(() -> {
            Date now = new Date();
            Date expiryDate = new Date(now.getTime() + accessTokenExpiration);

            Map<String, Object> claims = new HashMap<>();
            claims.put("userId", user.getId());
            claims.put("username", user.getUsername());
            claims.put("email", user.getEmail());
            claims.put("firstName", user.getFirstName());
            claims.put("lastName", user.getLastName());
            claims.put("userType", user.getUserType());
            claims.put("clientType", "UNIFLOW"); // Default client type
            claims.put("status", user.getStatus());
            claims.put("timezone", "UTC"); // Default timezone
            claims.put("language", "en"); // Default language

            // Extract additional data from JSONB data field if available
            if (user.getData() != null) {
                com.fasterxml.jackson.databind.JsonNode profileData = user
                    .getData()
                    .get("profile");
                if (profileData != null) {
                    if (profileData.has("timezone")) {
                        claims.put(
                            "timezone",
                            profileData.get("timezone").asText()
                        );
                    }
                    if (profileData.has("language")) {
                        claims.put(
                            "language",
                            profileData.get("language").asText()
                        );
                    }
                }

                com.fasterxml.jackson.databind.JsonNode businessData = user
                    .getData()
                    .get("business");
                if (businessData != null) {
                    if (businessData.has("territory_identifier")) {
                        claims.put(
                            "territoryIdentifier",
                            businessData.get("territory_identifier").asText()
                        );
                    }
                    if (businessData.has("organization_id")) {
                        claims.put(
                            "organizationId",
                            businessData.get("organization_id").asText()
                        );
                    }
                    if (businessData.has("department")) {
                        claims.put(
                            "department",
                            businessData.get("department").asText()
                        );
                    }
                }
            }

            claims.put("tokenType", "ACCESS");
            claims.put("sessionTimeout", 480);

            return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getId().toString())
                .setIssuer(issuer)
                .setAudience(audience)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .setId(UUID.randomUUID().toString()) // JTI for unique identification
                .signWith(secretKey, SignatureAlgorithm.HS512)
                .compact();
        })
            .doOnNext(token ->
                log.debug(
                    "Generated access token for user: {}",
                    user.getUsername()
                )
            )
            .doOnError(error ->
                log.error(
                    "Error generating access token for user: {}",
                    user.getUsername(),
                    error
                )
            );
    }

    /** Generate refresh token for authenticated user */
    public Mono<String> generateRefreshToken(User user, String deviceId) {
        return Mono.fromCallable(() -> {
            Date now = new Date();
            Date expiryDate = new Date(now.getTime() + refreshTokenExpiration);

            Map<String, Object> claims = new HashMap<>();
            claims.put("userId", user.getId());
            claims.put("username", user.getUsername());
            claims.put("tokenType", "REFRESH");
            if (deviceId != null) {
                claims.put("deviceId", deviceId);
            }

            return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getId().toString())
                .setIssuer(issuer)
                .setAudience(audience)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .setId(UUID.randomUUID().toString())
                .signWith(secretKey, SignatureAlgorithm.HS512)
                .compact();
        })
            .doOnNext(token ->
                log.debug(
                    "Generated refresh token for user: {}",
                    user.getUsername()
                )
            )
            .doOnError(error ->
                log.error(
                    "Error generating refresh token for user: {}",
                    user.getUsername(),
                    error
                )
            );
    }

    /** Validate JWT token and extract claims */
    public Mono<Claims> validateToken(String token) {
        return Mono.fromCallable(() -> {
            try {
                JwtParser parser = Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .requireIssuer(issuer)
                    .requireAudience(audience)
                    .build();

                // Parser automatically validates expiration, signature, etc.
                Claims claims = parser.parseClaimsJws(token).getBody();

                return claims;
            } catch (ExpiredJwtException e) {
                log.debug("JWT token has expired: {}", e.getMessage());
                throw e;
            } catch (UnsupportedJwtException e) {
                log.warn("Unsupported JWT token: {}", e.getMessage());
                throw e;
            } catch (MalformedJwtException e) {
                log.warn("Malformed JWT token: {}", e.getMessage());
                throw e;
            } catch (SignatureException e) {
                log.warn("Invalid JWT signature: {}", e.getMessage());
                throw e;
            } catch (IllegalArgumentException e) {
                log.warn(
                    "JWT token compact of handler are invalid: {}",
                    e.getMessage()
                );
                throw e;
            }
        }).doOnNext(claims ->
            log.debug(
                "Successfully validated token for subject: {}",
                claims.getSubject()
            )
        );
    }

    /** Extract user ID from token */
    public Mono<Long> getUserIdFromToken(String token) {
        return validateToken(token)
            .map(claims -> Long.parseLong(claims.getSubject()))
            .doOnNext(userId ->
                log.debug("Extracted user ID from token: {}", userId)
            )
            .doOnError(error ->
                log.error(
                    "Error extracting user ID from token: {}",
                    error.getMessage()
                )
            );
    }

    /** Extract username from token */
    public Mono<String> getUsernameFromToken(String token) {
        return validateToken(token)
            .map(claims -> claims.get("username", String.class))
            .doOnNext(username ->
                log.debug("Extracted username from token: {}", username)
            )
            .doOnError(error ->
                log.error(
                    "Error extracting username from token: {}",
                    error.getMessage()
                )
            );
    }

    /** Check if token is expired */
    public Mono<Boolean> isTokenExpired(String token) {
        return validateToken(token)
            .map(claims -> claims.getExpiration().before(new Date()))
            .onErrorReturn(true) // If validation fails, consider token expired
            .doOnNext(expired ->
                log.debug("Token expired check result: {}", expired)
            );
    }

    /** Get token expiration date */
    public Mono<LocalDateTime> getTokenExpiration(String token) {
        return validateToken(token)
            .map(claims ->
                claims
                    .getExpiration()
                    .toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDateTime()
            )
            .doOnNext(expiration ->
                log.debug("Token expiration: {}", expiration)
            )
            .doOnError(error ->
                log.error(
                    "Error getting token expiration: {}",
                    error.getMessage()
                )
            );
    }

    /** Extract all roles from token */
    @SuppressWarnings("unchecked")
    public Mono<List<String>> getRolesFromToken(String token) {
        return validateToken(token)
            .map(claims -> {
                Object rolesObj = claims.get("roles");
                if (rolesObj instanceof List) {
                    return (List<String>) rolesObj;
                }
                return new ArrayList<String>();
            })
            .doOnNext(roles ->
                log.debug("Extracted roles from token: {}", roles)
            )
            .doOnError(error ->
                log.error(
                    "Error extracting roles from token: {}",
                    error.getMessage()
                )
            );
    }

    /** Extract all permissions from token */
    @SuppressWarnings("unchecked")
    public Mono<List<String>> getPermissionsFromToken(String token) {
        return validateToken(token)
            .map(claims -> {
                Object permissionsObj = claims.get("permissions");
                if (permissionsObj instanceof List) {
                    return (List<String>) permissionsObj;
                }
                return new ArrayList<String>();
            })
            .doOnNext(permissions ->
                log.debug("Extracted permissions from token: {}", permissions)
            )
            .doOnError(error ->
                log.error(
                    "Error extracting permissions from token: {}",
                    error.getMessage()
                )
            );
    }

    /** Extract client type from token */
    public Mono<String> getClientTypeFromToken(String token) {
        return validateToken(token)
            .map(claims -> claims.get("clientType", String.class))
            .doOnNext(clientType ->
                log.debug("Extracted client type from token: {}", clientType)
            )
            .doOnError(error ->
                log.error(
                    "Error extracting client type from token: {}",
                    error.getMessage()
                )
            );
    }

    /** Extract territory identifier from token */
    public Mono<String> getTerritoryFromToken(String token) {
        return validateToken(token)
            .map(claims -> claims.get("territoryIdentifier", String.class))
            .doOnNext(territory ->
                log.debug("Extracted territory from token: {}", territory)
            )
            .doOnError(error ->
                log.error(
                    "Error extracting territory from token: {}",
                    error.getMessage()
                )
            );
    }

    /** Check if token is a refresh token */
    public Mono<Boolean> isRefreshToken(String token) {
        return validateToken(token)
            .map(claims ->
                "REFRESH".equals(claims.get("tokenType", String.class))
            )
            .onErrorReturn(false)
            .doOnNext(isRefresh ->
                log.debug("Token is refresh token: {}", isRefresh)
            );
    }

    /** Extract JWT ID (JTI) from token */
    public Mono<String> getTokenId(String token) {
        return validateToken(token)
            .map(Claims::getId)
            .doOnNext(jti -> log.debug("Extracted token ID: {}", jti))
            .doOnError(error ->
                log.error("Error extracting token ID: {}", error.getMessage())
            );
    }

    /** Get token issued date */
    public Mono<LocalDateTime> getTokenIssuedAt(String token) {
        return validateToken(token)
            .map(claims ->
                claims
                    .getIssuedAt()
                    .toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDateTime()
            )
            .doOnNext(issuedAt -> log.debug("Token issued at: {}", issuedAt))
            .doOnError(error ->
                log.error(
                    "Error getting token issued date: {}",
                    error.getMessage()
                )
            );
    }

    /** Generate token pair (access + refresh) for user */
    public Mono<Map<String, String>> generateTokenPair(
        User user,
        String deviceId
    ) {
        return Mono.zip(
            generateAccessToken(user),
            generateRefreshToken(user, deviceId)
        )
            .map(tuple -> {
                Map<String, String> tokens = new HashMap<>();
                tokens.put("accessToken", tuple.getT1());
                tokens.put("refreshToken", tuple.getT2());
                return tokens;
            })
            .doOnNext(tokens ->
                log.debug(
                    "Generated token pair for user: {}",
                    user.getUsername()
                )
            )
            .doOnError(error ->
                log.error(
                    "Error generating token pair for user: {}",
                    user.getUsername(),
                    error
                )
            );
    }

    /** Helper method to convert JsonNode to List<String> */
    @SuppressWarnings("unchecked")
    private List<String> convertJsonNodeToList(
        com.fasterxml.jackson.databind.JsonNode jsonNode
    ) {
        try {
            if (jsonNode.isArray()) {
                return objectMapper.convertValue(jsonNode, List.class);
            }
        } catch (Exception e) {
            log.warn("Error converting JsonNode to List: {}", e.getMessage());
        }
        return new ArrayList<>();
    }

    /** Create JWT parser for token validation */
    private JwtParser createParser() {
        return Jwts.parserBuilder()
            .setSigningKey(secretKey)
            .requireIssuer(issuer)
            .requireAudience(audience)
            .build();
    }
}
