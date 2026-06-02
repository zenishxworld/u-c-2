package com.uniflow.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.uniflow.auth.repository.UserRepository;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * Custom implementation of ReactiveUserDetailsService for Spring Security. This service loads
 * user-specific data and is used by Spring Security for authentication.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomReactiveUserDetailsService
    implements ReactiveUserDetailsService {

    private final UserRepository userRepository;

    @Override
    public Mono<UserDetails> findByUsername(String username) {
        log.debug("Loading user details for username: {}", username);

        return userRepository
            .findByUsername(username)
            .switchIfEmpty(userRepository.findByEmail(username))
            .switchIfEmpty(
                Mono.error(
                    new UsernameNotFoundException("User not found: " + username)
                )
            )
            .map(user -> {
                log.debug(
                    "Found user: {} with email: {}",
                    user.getUsername(),
                    user.getEmail()
                );

                // Check if account is active
                if (!user.isActive()) {
                    log.warn("Account is not active for user: {}", username);
                    throw new RuntimeException("Account is not active");
                }

                // Extract roles and permissions
                Collection<? extends GrantedAuthority> authorities =
                    extractAuthorities(user);

                // Create Spring Security UserDetails
                return User.builder()
                    .username(user.getUsername())
                    .password(user.getPassword().orElse(""))
                    .authorities(authorities)
                    .accountExpired(false)
                    .accountLocked(false)
                    .credentialsExpired(false)
                    .disabled(false)
                    .build();
            })
            .cast(UserDetails.class)
            .doOnSuccess(userDetails ->
                log.debug("Successfully loaded user details for: {}", username)
            )
            .doOnError(error ->
                log.error(
                    "Error loading user details for username: {}",
                    username,
                    error
                )
            );
    }

    /** Extract authorities (roles and permissions) from user entity */
    private Collection<? extends GrantedAuthority> extractAuthorities(
        com.uniflow.auth.entity.User user
    ) {
        try {
            // Extract roles from JSON
            List<String> roles = new ArrayList<>();

            // Extract permissions from JSON
            List<String> permissions = new ArrayList<>();

            // Combine roles and permissions into authorities
            List<GrantedAuthority> authorities = roles
                .stream()
                .map(role ->
                    new SimpleGrantedAuthority("ROLE_" + role.toUpperCase())
                )
                .collect(Collectors.toList());

            // Add permissions as authorities
            permissions
                .stream()
                .map(permission ->
                    new SimpleGrantedAuthority(permission.toUpperCase())
                )
                .forEach(authorities::add);

            // Ensure user has at least USER role if no roles defined
            if (authorities.isEmpty()) {
                authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
            }

            log.debug(
                "User {} has authorities: {}",
                user.getUsername(),
                authorities
            );
            return authorities;
        } catch (Exception e) {
            log.warn(
                "Error extracting authorities for user: {}, using default USER role",
                user.getUsername(),
                e
            );
            return Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_USER")
            );
        }
    }

    /** Extract roles from JSON field */
    private List<String> extractRolesFromJson(JsonNode rolesJson) {
        if (rolesJson == null || rolesJson.isNull()) {
            return Collections.emptyList();
        }

        try {
            if (rolesJson.isArray()) {
                return rolesJson.findValuesAsText("role");
            } else if (rolesJson.isTextual()) {
                return Collections.singletonList(rolesJson.asText());
            } else if (rolesJson.has("roles")) {
                JsonNode rolesArray = rolesJson.get("roles");
                if (rolesArray.isArray()) {
                    return rolesArray.findValuesAsText("name");
                }
            }
        } catch (Exception e) {
            log.warn("Error parsing roles JSON: {}", e.getMessage());
        }

        return Collections.emptyList();
    }

    /** Extract permissions from JSON field */
    private List<String> extractPermissionsFromJson(JsonNode permissionsJson) {
        if (permissionsJson == null || permissionsJson.isNull()) {
            return Collections.emptyList();
        }

        try {
            if (permissionsJson.isArray()) {
                return permissionsJson.findValuesAsText("permission");
            } else if (permissionsJson.isTextual()) {
                return Collections.singletonList(permissionsJson.asText());
            } else if (permissionsJson.has("permissions")) {
                JsonNode permissionsArray = permissionsJson.get("permissions");
                if (permissionsArray.isArray()) {
                    return permissionsArray.findValuesAsText("name");
                }
            }
        } catch (Exception e) {
            log.warn("Error parsing permissions JSON: {}", e.getMessage());
        }

        return Collections.emptyList();
    }
}
