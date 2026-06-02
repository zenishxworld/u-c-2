package com.uniflow.application.handler;

import com.uniflow.application.dto.ApplicationRequestDTO;
import com.uniflow.application.dto.ApplicationResponseDTO;
import com.uniflow.application.dto.ApplicationSearchRequestDTO;
import com.uniflow.application.service.ApplicationService;
import com.uniflow.auth.dto.UserJwtDto;
import com.uniflow.auth.util.JwtUtils;
import com.uniflow.common.dto.ApiResponse;

import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * ApplicationHandler - Functional Request Handler for Application Service
 *
 * <p>This handler implements the functional routing pattern for Spring WebFlux, providing reactive
 * endpoints for university application management in the consolidated UniFLow platform with
 * JWT-based user context and data bifurcation.
 *
 * <p>Key Features: - Functional routing with ServerRequest/ServerResponse - Reactive programming
 * with Mono/Flux - JWT-based user context extraction and validation - User-level data bifurcation
 * (students see only their data, admins see territory-based data) - Comprehensive application
 * lifecycle management - RESTful API design with proper HTTP status codes - Standardized
 * ApiResponse wrapper for consistent responses - Request validation and error handling - Support
 * for search and filtering operations - Admin assignment and workflow management
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-01
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ApplicationHandler {

    private final ApplicationService applicationService;
    private final JwtUtils jwtUtils;

    // ========================================
    // CORE CRUD OPERATIONS WITH JWT CONTEXT
    // ========================================

    /**
     * Create a new application POST /api/v1/applications
     */
    public Mono<ServerResponse> createApplication(ServerRequest request) {
        log.info("Processing application creation request");

        return jwtUtils
                .getUserFromServerRequest(request)
                .flatMap(
                        user -> {
                            log.info(
                                    "Creating application for authenticated user: {} ({})",
                                    user.getUsername(),
                                    user.getUserType());

                            return request
                                    .bodyToMono(ApplicationRequestDTO.class)
                                    .doOnNext(
                                            dto -> {
                                                // For students, ensure they can only create applications for themselves
                                                if ("STUDENT".equals(user.getUserType())) {
                                                    // Set student ID from JWT context for security
                                                    // Convert Long user ID to UUID - this is a temporary fix
                                                    // TODO: Implement proper StudentProfile lookup
                                                    dto.setStudentId(
                                                            user.getId());
                                                    log.info(
                                                            "Student {} creating application for themselves", user.getUsername());
                                                } else {
                                                    log.info(
                                                            "Admin/Super Admin {} creating application for student: {}",
                                                            user.getUsername(),
                                                            dto.getStudentId());
                                                }
                                            })
                                    .flatMap(dto -> applicationService.createApplicationWithUserContext(dto, user));
                        })
                .flatMap(
                        response -> {
                            log.info("Successfully created application with ID: {}", response.getId());
                            ApiResponse<ApplicationResponseDTO> apiResponse =
                                    ApiResponse.success(response, "Application created successfully");
                            return ServerResponse.status(HttpStatus.CREATED)
                                                 .contentType(MediaType.APPLICATION_JSON)
                                                 .bodyValue(apiResponse);
                        })
                .onErrorResume(
                        throwable -> {
                            log.error("Error creating application", throwable);
                            ApiResponse<ApplicationResponseDTO> errorResponse =
                                    ApiResponse.error("Failed to create application: " + throwable.getMessage());
                            return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                                 .contentType(MediaType.APPLICATION_JSON)
                                                 .bodyValue(errorResponse);
                        });
    }

    /**
     * Get application by ID GET /api/v1/applications/{id}
     */
    public Mono<ServerResponse> getApplicationById(ServerRequest request) {
        String applicationId = request.pathVariable("id");
        log.info("Fetching application by ID: {}", applicationId);

        return jwtUtils
                .getUserFromServerRequest(request)
                .flatMap(
                        user -> {
                            log.debug(
                                    "User {} ({}) requesting application: {}",
                                    user.getUsername(),
                                    user.getUserType(),
                                    applicationId);

                            return Mono.fromCallable(() -> UUID.fromString(applicationId))
                                       .flatMap(
                                               uuid -> applicationService.getApplicationByIdWithUserContext(uuid, user));
                        })
                .flatMap(
                        response -> {
                            log.debug("Found application: {}", response.getReferenceNumber());
                            ApiResponse<ApplicationResponseDTO> apiResponse =
                                    ApiResponse.success(response, "Application retrieved successfully");
                            return ServerResponse.ok()
                                                 .contentType(MediaType.APPLICATION_JSON)
                                                 .bodyValue(apiResponse);
                        })
                .onErrorResume(
                        IllegalArgumentException.class,
                        e -> {
                            log.error("Invalid UUID format: {}", applicationId);
                            ApiResponse<ApplicationResponseDTO> errorResponse =
                                    ApiResponse.error("Invalid application ID format");
                            return ServerResponse.status(HttpStatus.BAD_REQUEST)
                                                 .contentType(MediaType.APPLICATION_JSON)
                                                 .bodyValue(errorResponse);
                        })
                .onErrorResume(
                        RuntimeException.class,
                        e -> {
                            if (e.getMessage().contains("not found")
                                    || e.getMessage().contains("access denied")) {
                                log.warn("Application not found or access denied: {}", applicationId);
                                ApiResponse<ApplicationResponseDTO> errorResponse =
                                        ApiResponse.error("Application not found or access denied");
                                return ServerResponse.status(HttpStatus.NOT_FOUND)
                                                     .contentType(MediaType.APPLICATION_JSON)
                                                     .bodyValue(errorResponse);
                            }
                            log.error("Error fetching application: {}", applicationId, e);
                            ApiResponse<ApplicationResponseDTO> errorResponse =
                                    ApiResponse.error("Failed to retrieve application: " + e.getMessage());
                            return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                                 .contentType(MediaType.APPLICATION_JSON)
                                                 .bodyValue(errorResponse);
                        });
    }

    /**
     * Get all applications with user-level filtering GET /api/v1/applications
     */
    public Mono<ServerResponse> getAllApplications(ServerRequest request) {
        log.info("Fetching all applications with user context filtering");

        return jwtUtils
                .getUserFromServerRequest(request)
                .flatMap(
                        user -> {
                            log.debug(
                                    "User {} ({}) requesting all applications",
                                    user.getUsername(),
                                    user.getUserType());

                            return applicationService
                                    .getAllApplicationsWithUserContext(user)
                                    .collectList()
                                    .flatMap(
                                            applications -> {
                                                log.info(
                                                        "Retrieved {} applications for user: {}",
                                                        applications.size(),
                                                        user.getUsername());
                                                ApiResponse<Object> apiResponse =
                                                        ApiResponse.success(
                                                                applications, "Applications retrieved successfully");
                                                return ServerResponse.ok()
                                                                     .contentType(MediaType.APPLICATION_JSON)
                                                                     .bodyValue(apiResponse);
                                            });
                        })
                .onErrorResume(
                        throwable -> {
                            log.error("Error fetching applications", throwable);
                            ApiResponse<Object> errorResponse =
                                    ApiResponse.error("Failed to retrieve applications: " + throwable.getMessage());
                            return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                                 .contentType(MediaType.APPLICATION_JSON)
                                                 .bodyValue(errorResponse);
                        });
    }

    /**
     * Get application by reference number GET /api/v1/applications/reference/{referenceNumber}
     */
    public Mono<ServerResponse> getApplicationByReference(ServerRequest request) {
        String referenceNumber = request.pathVariable("referenceNumber");
        log.info("Fetching application by reference: {}", referenceNumber);

        return jwtUtils
                .getUserFromServerRequest(request)
                .flatMap(
                        user -> {
                            log.debug(
                                    "User {} ({}) requesting application by reference: {}",
                                    user.getUsername(),
                                    user.getUserType(),
                                    referenceNumber);

                            return applicationService
                                    .getApplicationByReferenceWithUserContext(referenceNumber, user)
                                    .flatMap(
                                            response -> {
                                                log.debug("Found application: {}", response.getReferenceNumber());
                                                ApiResponse<ApplicationResponseDTO> apiResponse =
                                                        ApiResponse.success(response, "Application retrieved successfully");
                                                return ServerResponse.ok()
                                                                     .contentType(MediaType.APPLICATION_JSON)
                                                                     .bodyValue(apiResponse);
                                            });
                        })
                .onErrorResume(
                        RuntimeException.class,
                        e -> {
                            if (e.getMessage().contains("not found")
                                    || e.getMessage().contains("access denied")) {
                                log.warn("Application not found or access denied: {}", referenceNumber);
                                ApiResponse<ApplicationResponseDTO> errorResponse =
                                        ApiResponse.error("Application not found or access denied");
                                return ServerResponse.status(HttpStatus.NOT_FOUND)
                                                     .contentType(MediaType.APPLICATION_JSON)
                                                     .bodyValue(errorResponse);
                            }
                            log.error("Error fetching application by reference: {}", referenceNumber, e);
                            ApiResponse<ApplicationResponseDTO> errorResponse =
                                    ApiResponse.error("Failed to retrieve application: " + e.getMessage());
                            return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                                 .contentType(MediaType.APPLICATION_JSON)
                                                 .bodyValue(errorResponse);
                        });
    }

    /**
     * Update application PUT /api/v1/applications/{id}
     */
    public Mono<ServerResponse> updateApplication(ServerRequest request) {
        String applicationId = request.pathVariable("id");
        log.info("Updating application: {}", applicationId);

        return jwtUtils
                .getUserFromServerRequest(request)
                .flatMap(
                        user -> {
                            log.debug(
                                    "User {} ({}) updating application: {}",
                                    user.getUsername(),
                                    user.getUserType(),
                                    applicationId);

                            return Mono.fromCallable(() -> UUID.fromString(applicationId))
                                       .zipWith(request.bodyToMono(ApplicationRequestDTO.class))
                                       .flatMap(
                                               tuple ->
                                                       applicationService.updateApplicationWithUserContext(
                                                               tuple.getT1(), tuple.getT2(), user));
                        })
                .flatMap(
                        response -> {
                            log.info("Successfully updated application: {}", response.getReferenceNumber());
                            ApiResponse<ApplicationResponseDTO> apiResponse =
                                    ApiResponse.success(response, "Application updated successfully");
                            return ServerResponse.ok()
                                                 .contentType(MediaType.APPLICATION_JSON)
                                                 .bodyValue(apiResponse);
                        })
                .onErrorResume(
                        IllegalArgumentException.class,
                        e -> {
                            log.error("Invalid UUID format: {}", applicationId);
                            ApiResponse<ApplicationResponseDTO> errorResponse =
                                    ApiResponse.error("Invalid application ID format");
                            return ServerResponse.status(HttpStatus.BAD_REQUEST)
                                                 .contentType(MediaType.APPLICATION_JSON)
                                                 .bodyValue(errorResponse);
                        })
                .onErrorResume(
                        RuntimeException.class,
                        e -> {
                            if (e.getMessage().contains("not found")
                                    || e.getMessage().contains("access denied")) {
                                log.warn("Application not found or access denied for update: {}", applicationId);
                                ApiResponse<ApplicationResponseDTO> errorResponse =
                                        ApiResponse.error("Application not found or access denied");
                                return ServerResponse.status(HttpStatus.NOT_FOUND)
                                                     .contentType(MediaType.APPLICATION_JSON)
                                                     .bodyValue(errorResponse);
                            }
                            if (e.getMessage().contains("Cannot update")) {
                                log.warn("Application cannot be updated: {}", e.getMessage());
                                ApiResponse<ApplicationResponseDTO> errorResponse =
                                        ApiResponse.error(e.getMessage());
                                return ServerResponse.status(HttpStatus.CONFLICT)
                                                     .contentType(MediaType.APPLICATION_JSON)
                                                     .bodyValue(errorResponse);
                            }
                            log.error("Error updating application: {}", applicationId, e);
                            ApiResponse<ApplicationResponseDTO> errorResponse =
                                    ApiResponse.error("Failed to update application: " + e.getMessage());
                            return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                                 .contentType(MediaType.APPLICATION_JSON)
                                                 .bodyValue(errorResponse);
                        });
    }

    /**
     * Update application status PUT /api/v1/applications/{id}/status
     */
    public Mono<ServerResponse> updateApplicationStatus(ServerRequest request) {
        String applicationId = request.pathVariable("id");
        log.info("Updating application status: {}", applicationId);

        return jwtUtils
                .getUserFromServerRequest(request)
                .flatMap(
                        user -> {
                            // Only admins can update application status
                            if (!"ADMIN".equals(user.getUserType())
                                    && !"SUPER_ADMIN".equals(user.getUserType())) {
                                log.warn(
                                        "User {} attempted to update application status without proper role",
                                        user.getUsername());
                                ApiResponse<ApplicationResponseDTO> errorResponse =
                                        ApiResponse.error("Insufficient permissions to update application status");
                                return ServerResponse.status(HttpStatus.FORBIDDEN)
                                                     .contentType(MediaType.APPLICATION_JSON)
                                                     .bodyValue(errorResponse);
                            }

                            return request
                                    .bodyToMono(String.class)
                                    .flatMap(
                                            status -> {
                                                return Mono.fromCallable(() -> UUID.fromString(applicationId))
                                                           .flatMap(
                                                                   uuid ->
                                                                           applicationService.updateApplicationStatusWithUserContext(
                                                                                   uuid, status, user));
                                            })
                                    .flatMap(
                                            response -> {
                                                log.info("Successfully updated application status: {}", applicationId);
                                                ApiResponse<ApplicationResponseDTO> apiResponse =
                                                        ApiResponse.success(
                                                                response, "Application status updated successfully");
                                                return ServerResponse.ok()
                                                                     .contentType(MediaType.APPLICATION_JSON)
                                                                     .bodyValue(apiResponse);
                                            });
                        })
                .onErrorResume(
                        IllegalArgumentException.class,
                        e -> {
                            log.error("Invalid UUID format: {}", applicationId);
                            ApiResponse<ApplicationResponseDTO> errorResponse =
                                    ApiResponse.error("Invalid application ID format");
                            return ServerResponse.status(HttpStatus.BAD_REQUEST)
                                                 .contentType(MediaType.APPLICATION_JSON)
                                                 .bodyValue(errorResponse);
                        })
                .onErrorResume(
                        throwable -> {
                            log.error("Error updating application status: {}", applicationId, throwable);
                            ApiResponse<ApplicationResponseDTO> errorResponse =
                                    ApiResponse.error(
                                            "Failed to update application status: " + throwable.getMessage());
                            return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                                 .contentType(MediaType.APPLICATION_JSON)
                                                 .bodyValue(errorResponse);
                        });
    }

    /**
     * Delete application DELETE /api/v1/applications/{id}
     */
    public Mono<ServerResponse> deleteApplication(ServerRequest request) {
        String applicationId = request.pathVariable("id");
        log.info("Deleting application: {}", applicationId);

        return jwtUtils
                .getUserFromServerRequest(request)
                .flatMap(
                        user -> {
                            // Only admins and super admins can delete applications
                            if (!"ADMIN".equals(user.getUserType())
                                    && !"SUPER_ADMIN".equals(user.getUserType())) {
                                log.warn(
                                        "User {} attempted to delete application without proper role",
                                        user.getUsername());
                                ApiResponse<String> errorResponse =
                                        ApiResponse.error("Insufficient permissions to delete application");
                                return ServerResponse.status(HttpStatus.FORBIDDEN)
                                                     .contentType(MediaType.APPLICATION_JSON)
                                                     .bodyValue(errorResponse);
                            }

                            return Mono.fromCallable(() -> UUID.fromString(applicationId))
                                       .flatMap(uuid -> applicationService.deleteApplicationWithUserContext(uuid, user))
                                       .then(ServerResponse.noContent().build());
                        })
                .onErrorResume(
                        IllegalArgumentException.class,
                        e -> {
                            log.error("Invalid UUID format: {}", applicationId);
                            ApiResponse<String> errorResponse =
                                    ApiResponse.error("Invalid application ID format");
                            return ServerResponse.status(HttpStatus.BAD_REQUEST)
                                                 .contentType(MediaType.APPLICATION_JSON)
                                                 .bodyValue(errorResponse);
                        })
                .onErrorResume(
                        RuntimeException.class,
                        e -> {
                            if (e.getMessage().contains("not found")
                                    || e.getMessage().contains("access denied")) {
                                log.warn("Application not found or access denied for deletion: {}", applicationId);
                                ApiResponse<String> errorResponse =
                                        ApiResponse.error("Application not found or access denied");
                                return ServerResponse.status(HttpStatus.NOT_FOUND)
                                                     .contentType(MediaType.APPLICATION_JSON)
                                                     .bodyValue(errorResponse);
                            }
                            log.error("Error deleting application: {}", applicationId, e);
                            ApiResponse<String> errorResponse =
                                    ApiResponse.error("Failed to delete application: " + e.getMessage());
                            return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                                 .contentType(MediaType.APPLICATION_JSON)
                                                 .bodyValue(errorResponse);
                        });
    }

    // ========================================
    // SEARCH AND FILTERING OPERATIONS
    // ========================================

    /**
     * Search applications with user context POST /api/v1/applications/search
     */
    public Mono<ServerResponse> searchApplications(ServerRequest request) {
        log.info("Processing application search request");

        return jwtUtils
                .getUserFromServerRequest(request)
                .flatMap(
                        user -> {
                            log.debug(
                                    "User {} ({}) searching applications", user.getUsername(), user.getUserType());

                            return request
                                    .bodyToMono(ApplicationSearchRequestDTO.class)
                                    .flatMap(
                                            searchRequest ->
                                                    applicationService
                                                            .searchApplicationsWithUserContext(searchRequest, user)
                                                            .collectList())
                                    .flatMap(
                                            applications -> {
                                                log.info(
                                                        "Search returned {} applications for user: {}",
                                                        applications.size(),
                                                        user.getUsername());
                                                ApiResponse<Object> apiResponse =
                                                        ApiResponse.success(
                                                                applications, "Applications search completed successfully");
                                                return ServerResponse.ok()
                                                                     .contentType(MediaType.APPLICATION_JSON)
                                                                     .bodyValue(apiResponse);
                                            });
                        })
                .onErrorResume(
                        throwable -> {
                            log.error("Error searching applications", throwable);
                            ApiResponse<Object> errorResponse =
                                    ApiResponse.error("Failed to search applications: " + throwable.getMessage());
                            return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                                 .contentType(MediaType.APPLICATION_JSON)
                                                 .bodyValue(errorResponse);
                        });
    }

    /**
     * Get applications requiring attention (for admins) GET /api/v1/applications/attention
     */
    public Mono<ServerResponse> getApplicationsRequiringAttention(ServerRequest request) {
        log.info("Fetching applications requiring attention");

        return jwtUtils
                .getUserFromServerRequest(request)
                .flatMap(
                        user -> {
                            // Only admins can access this endpoint
                            if (!"ADMIN".equals(user.getUserType())
                                    && !"SUPER_ADMIN".equals(user.getUserType())) {
                                log.warn("User {} attempted to access admin-only endpoint", user.getUsername());
                                ApiResponse<Object> errorResponse =
                                        ApiResponse.error("Insufficient permissions to access this resource");
                                return ServerResponse.status(HttpStatus.FORBIDDEN)
                                                     .contentType(MediaType.APPLICATION_JSON)
                                                     .bodyValue(errorResponse);
                            }

                            log.debug("Admin {} requesting applications requiring attention", user.getUsername());

                            return applicationService
                                    .getApplicationsRequiringAttentionWithUserContext(user)
                                    .collectList()
                                    .flatMap(
                                            applications -> {
                                                log.info(
                                                        "Found {} applications requiring attention for admin: {}",
                                                        applications.size(),
                                                        user.getUsername());
                                                ApiResponse<Object> apiResponse =
                                                        ApiResponse.success(
                                                                applications,
                                                                "Applications requiring attention retrieved successfully");
                                                return ServerResponse.ok()
                                                                     .contentType(MediaType.APPLICATION_JSON)
                                                                     .bodyValue(apiResponse);
                                            });
                        })
                .onErrorResume(
                        throwable -> {
                            log.error("Error fetching applications requiring attention", throwable);
                            ApiResponse<Object> errorResponse =
                                    ApiResponse.error("Failed to retrieve applications: " + throwable.getMessage());
                            return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                                 .contentType(MediaType.APPLICATION_JSON)
                                                 .bodyValue(errorResponse);
                        });
    }

    /**
     * Get application statistics GET /api/v1/applications/statistics
     */
    public Mono<ServerResponse> getApplicationStatistics(ServerRequest request) {
        log.info("Fetching application statistics");

        return jwtUtils
                .getUserFromServerRequest(request)
                .flatMap(
                        user -> {
                            log.debug(
                                    "User {} ({}) requesting application statistics",
                                    user.getUsername(),
                                    user.getUserType());

                            return applicationService
                                    .getApplicationStatisticsWithUserContext(user)
                                    .flatMap(
                                            statistics -> {
                                                log.info(
                                                        "Retrieved application statistics for user: {}", user.getUsername());
                                                ApiResponse<Object> apiResponse =
                                                        ApiResponse.success(
                                                                statistics, "Application statistics retrieved successfully");
                                                return ServerResponse.ok()
                                                                     .contentType(MediaType.APPLICATION_JSON)
                                                                     .bodyValue(apiResponse);
                                            });
                        })
                .onErrorResume(
                        throwable -> {
                            log.error("Error fetching application statistics", throwable);
                            ApiResponse<Object> errorResponse =
                                    ApiResponse.error("Failed to retrieve statistics: " + throwable.getMessage());
                            return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                                 .contentType(MediaType.APPLICATION_JSON)
                                                 .bodyValue(errorResponse);
                        });
    }

    // ========================================
    // HEALTH AND UTILITY ENDPOINTS
    // ========================================

    /**
     * Health check endpoint GET /api/v1/applications/health
     */
    public Mono<ServerResponse> healthCheck(ServerRequest request) {
        log.debug("Application service health check requested");

        return ServerResponse.ok()
                             .contentType(MediaType.APPLICATION_JSON)
                             .bodyValue(ApiResponse.success("Application service is healthy", "Health check passed"));
    }

    /**
     * Get service information GET /api/v1/applications/info
     */
    public Mono<ServerResponse> getServiceInfo(ServerRequest request) {
        log.debug("Application service info requested");

        return ServerResponse.ok()
                             .contentType(MediaType.APPLICATION_JSON)
                             .bodyValue(
                                     ApiResponse.success(
                                             "Application Service", "Consolidated UniFLow Application Management"));
    }

    // ========================================
    // PRIVATE HELPER METHODS
    // ========================================

    /**
     * Validate user has permission to access application data Based on user type and territory
     * assignments
     */
    private Mono<Boolean> validateUserAccess(UserJwtDto user, String operation) {
        return Mono.fromCallable(
                           () -> {
                               // Super admins have full access
                               if ("SUPER_ADMIN".equals(user.getUserType())) {
                                   return true;
                               }

                               // Regular admins have territory-based access
                               if ("ADMIN".equals(user.getUserType())) {
                                   return user.getTerritoryIdentifier() != null;
                               }

                               // Students can only access their own data
                               if ("STUDENT".equals(user.getUserType())) {
                                   return "read".equals(operation) || "create".equals(operation);
                               }

                               return false;
                           })
                   .doOnNext(
                           hasAccess ->
                                   log.debug(
                                           "User {} access validation for operation '{}': {}",
                                           user.getUsername(),
                                           operation,
                                           hasAccess));
    }
}
