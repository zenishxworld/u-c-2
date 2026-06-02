package com.uniflow.config;

import com.uniflow.auth.filter.JwtValidationWebFilter;
import com.uniflow.auth.service.JwtService;
import java.util.Arrays;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.UserDetailsRepositoryReactiveAuthenticationManager;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.authentication.AuthenticationWebFilter;
import org.springframework.security.web.server.authentication.ServerAuthenticationConverter;
import org.springframework.security.web.server.context.NoOpServerSecurityContextRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

/**
 * Security configuration for the consolidated UniFLow platform.
 *
 * <p>This configuration handles: - JWT-based authentication - CORS configuration for web clients -
 * Public and protected endpoint routing - Stateless security context for reactive applications
 */
@Slf4j
@Configuration
@EnableWebFluxSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    // Public endpoints that don't require authentication
    private static final String[] PUBLIC_URLS = {
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
        "/api/v1/universities/**",
        "/api/v1/health",
        "/health",
        "/actuator/**",
        "/swagger-ui/**",
        "/v3/api-docs/**",
        "/webjars/**",
        // Only payment health check is public; create/verify require student JWT
        "/api/v1/payment/health",
        "/api/v1/public/**"
    };

    // Super Admin only endpoints
    private static final String[] SUPER_ADMIN_URLS = {
        "/api/core/**",
        "/api/v1/core/**",
        "/api/v1/superadmin/**",
    };

    // Admin-only endpoints
    private static final String[] ADMIN_URLS = {
        "/api/v1/admin/**",
        "/api/v1/applications/admin/**",
        "/api/v1/universities/admin/**",
        "/api/v1/students/admin/**",
        "/api/v1/workflow/admin/**",
        "/api/university/excel/**",
    };

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    @ConditionalOnWebApplication(
        type = ConditionalOnWebApplication.Type.REACTIVE
    )
    public JwtValidationWebFilter jwtValidationFilter(JwtService jwtService) {
        return new JwtValidationWebFilter(jwtService);
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(
        ServerHttpSecurity http,
        ReactiveAuthenticationManager authenticationManager,
        ServerAuthenticationConverter authenticationConverter,
        JwtValidationWebFilter jwtValidationFilter
    ) {
        return http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
            .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
            .logout(ServerHttpSecurity.LogoutSpec::disable)
            // Configure CORS
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // Add JWT validation filter before authentication
            .addFilterBefore(
                jwtValidationFilter,
                SecurityWebFiltersOrder.AUTHENTICATION
            )
            // Configure authorization rules
            .authorizeExchange(exchanges ->
                exchanges
                    // Public endpoints
                    .pathMatchers(PUBLIC_URLS)
                    .permitAll()
                    .pathMatchers(HttpMethod.OPTIONS)
                    .permitAll()
                    // Core API endpoints require SUPER_ADMIN role only
                    .pathMatchers(SUPER_ADMIN_URLS)
                    .hasRole("SUPER_ADMIN")
                    // Admin endpoints require ADMIN or SUPER_ADMIN role
                    .pathMatchers(ADMIN_URLS)
                    .hasAnyRole("ADMIN", "SUPER_ADMIN")
                    // University-specific endpoints
                    .pathMatchers("/api/v1/universities/manage/**")
                    .hasAnyRole("ADMIN", "UNIVERSITY_ADMIN")
                    // Student-specific endpoints - be specific to avoid catching non-existent routes
                    .pathMatchers("/api/v1/students/profile/**")
                    .hasAnyRole("STUDENT", "ADMIN")
                    .pathMatchers("/api/v1/students/dashboard")
                    .hasAnyRole("STUDENT", "ADMIN")
                    .pathMatchers("/api/v1/students/dashboard/profile-progress")
                    .hasAnyRole("STUDENT", "ADMIN")
                    .pathMatchers("/api/v1/students/dashboard/task-progress")
                    .hasAnyRole("STUDENT", "ADMIN")
                    .pathMatchers("/api/v1/students/dashboard/notifications")
                    .hasAnyRole("STUDENT", "ADMIN")
                    .pathMatchers("/api/v1/students/applications/**")
                    .hasAnyRole("STUDENT", "ADMIN")
                    .pathMatchers("/api/v1/applications/student/**")
                    .hasAnyRole("STUDENT", "ADMIN")
                    // Any unmatched route requires authentication (fails safe → 401 not 404)
                    .anyExchange()
                    .authenticated()
            )
            // Configure stateless security context
            .securityContextRepository(
                NoOpServerSecurityContextRepository.getInstance()
            )
            // Configure authentication manager
            .authenticationManager(authenticationManager)
            .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allow specific origins in production, all origins in development
        configuration.setAllowedOriginPatterns(
            Arrays.asList(
                "https://*.vercel.app", // Vercel deployments
                "https://kartonmeister.com", // Production domain
                "https://*.kartonmeister.com", // Subdomains
                "https://uni360degree.com", // Uni360 Production domain
                "https://*.uni360degree.com", // Uni360 Subdomains
                "http://localhost:*", // All localhost ports
                "http://127.0.0.1:*", // All 127.0.0.1 ports
                "http://localhost:3000", // Next.js default
                "http://localhost:5173", // Vite default
                "http://localhost:8080" // Local Spring Boot
            )
        );
        configuration.setAllowedMethods(
            Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
        );
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(
            Arrays.asList(
                "Authorization",
                "Content-Type",
                "X-Total-Count",
                "X-Request-ID"
            )
        );
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    public ReactiveAuthenticationManager reactiveAuthenticationManager(
        ReactiveUserDetailsService userDetailsService,
        PasswordEncoder passwordEncoder
    ) {
        UserDetailsRepositoryReactiveAuthenticationManager authenticationManager =
            new UserDetailsRepositoryReactiveAuthenticationManager(
                userDetailsService
            );
        authenticationManager.setPasswordEncoder(passwordEncoder);

        return authenticationManager;
    }

    @Bean
    public ServerAuthenticationConverter jwtAuthenticationConverter() {
        return exchange -> {
            // JWT validation is now handled by JwtValidationFilter
            // This converter can be used for additional authentication processing if needed
            return reactor.core.publisher.Mono.empty();
        };
    }

    /**
     * Creates custom authentication filter for JWT processing. This will be fully implemented when
     * the auth service is migrated.
     */
    private AuthenticationWebFilter createAuthenticationFilter(
        ReactiveAuthenticationManager authenticationManager,
        ServerAuthenticationConverter authenticationConverter
    ) {
        AuthenticationWebFilter authenticationFilter =
            new AuthenticationWebFilter(authenticationManager);
        authenticationFilter.setServerAuthenticationConverter(
            authenticationConverter
        );

        // Configure authentication success/failure handlers if needed
        return authenticationFilter;
    }
}
