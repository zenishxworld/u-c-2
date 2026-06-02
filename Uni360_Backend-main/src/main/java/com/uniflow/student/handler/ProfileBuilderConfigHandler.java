package com.uniflow.student.handler;

import com.uniflow.auth.dto.UserJwtDto;
import com.uniflow.auth.util.JwtUtils;
import com.uniflow.common.dto.ApiResponse;
import com.uniflow.notification.exception.ForbiddenException;
import com.uniflow.notification.exception.UnauthorizedException;
import com.uniflow.student.dto.ProfileBuilderConfigDto;
import com.uniflow.student.service.ProfileBuilderConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * Handler for Profile Builder Configuration CRUD operations
 *
 * <p>Provides REST API endpoints for Super Admins to manage dynamic profile builder
 * configurations. All endpoints require SUPER_ADMIN role.
 *
 * <p>Features:
 * - Create new profile builder configurations
 * - Update existing configurations
 * - Delete (soft delete) configurations
 * - Activate/deactivate configurations
 * - List all configurations for a client
 * - Get configuration statistics
 * - Get active configuration for students
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProfileBuilderConfigHandler {

    private final ProfileBuilderConfigService configService;
    private final JwtUtils jwtUtils;

    /**
     * GET /api/v1/superadmin/profile-builder/configs
     * List all profile builder configurations for a client
     *
     * Query params:
     * - client_id (optional, defaults to uni360)
     *
     * @param request ServerRequest
     * @return Mono of ServerResponse with list of configurations
     */
    public Mono<ServerResponse> listConfigurations(ServerRequest request) {
        return jwtUtils
            .getUserFromServerRequest(request)
            .cast(UserJwtDto.class)
            .flatMap(user -> {
                // Verify super admin role
                if (!isSuperAdmin(user)) {
                    return Mono.error(
                        new ForbiddenException(
                            "Only Super Admins can access profile builder configurations"
                        )
                    );
                }

                String clientId = request
                    .queryParam("client_id")
                    .orElse("uni360");

                log.info(
                    "Super Admin {} listing profile builder configs for client: {}",
                    user.getUserId(),
                    clientId
                );

                return configService
                    .listConfigurations(clientId)
                    .flatMap(response ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(response)
                    );
            })
            .onErrorResume(this::handleError);
    }

    /**
     * POST /api/v1/superadmin/profile-builder/configs
     * Create a new profile builder configuration
     *
     * Request body: CreateConfigRequest
     *
     * @param request ServerRequest
     * @return Mono of ServerResponse with created configuration
     */
    public Mono<ServerResponse> createConfiguration(ServerRequest request) {
        return jwtUtils
            .getUserFromServerRequest(request)
            .cast(UserJwtDto.class)
            .flatMap(user -> {
                // Verify super admin role
                if (!isSuperAdmin(user)) {
                    return Mono.error(
                        new ForbiddenException(
                            "Only Super Admins can create profile builder configurations"
                        )
                    );
                }

                log.info(
                    "Super Admin {} creating new profile builder configuration",
                    user.getUserId()
                );

                return request
                    .bodyToMono(
                        ProfileBuilderConfigDto.CreateConfigRequest.class
                    )
                    .flatMap(createRequest ->
                        configService.createConfiguration(
                            createRequest,
                            user.getUserId()
                        )
                    )
                    .flatMap(response ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(response)
                    );
            })
            .onErrorResume(this::handleError);
    }

    /**
     * PUT /api/v1/superadmin/profile-builder/configs/{id}
     * Update an existing profile builder configuration
     *
     * Path param: id - Configuration ID
     * Request body: UpdateConfigRequest
     *
     * @param request ServerRequest
     * @return Mono of ServerResponse with updated configuration
     */
    public Mono<ServerResponse> updateConfiguration(ServerRequest request) {
        return jwtUtils
            .getUserFromServerRequest(request)
            .cast(UserJwtDto.class)
            .flatMap(user -> {
                // Verify super admin role
                if (!isSuperAdmin(user)) {
                    return Mono.error(
                        new ForbiddenException(
                            "Only Super Admins can update profile builder configurations"
                        )
                    );
                }

                Long configId = Long.parseLong(request.pathVariable("id"));

                log.info(
                    "Super Admin {} updating profile builder configuration ID: {}",
                    user.getUserId(),
                    configId
                );

                return request
                    .bodyToMono(
                        ProfileBuilderConfigDto.UpdateConfigRequest.class
                    )
                    .flatMap(updateRequest ->
                        configService.updateConfiguration(
                            configId,
                            updateRequest,
                            user.getUserId()
                        )
                    )
                    .flatMap(response ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(response)
                    );
            })
            .onErrorResume(this::handleError);
    }

    /**
     * DELETE /api/v1/superadmin/profile-builder/configs/{id}
     * Delete (soft delete) a profile builder configuration
     *
     * Path param: id - Configuration ID
     *
     * @param request ServerRequest
     * @return Mono of ServerResponse with deletion confirmation
     */
    public Mono<ServerResponse> deleteConfiguration(ServerRequest request) {
        return jwtUtils
            .getUserFromServerRequest(request)
            .cast(UserJwtDto.class)
            .flatMap(user -> {
                // Verify super admin role
                if (!isSuperAdmin(user)) {
                    return Mono.error(
                        new ForbiddenException(
                            "Only Super Admins can delete profile builder configurations"
                        )
                    );
                }

                Long configId = Long.parseLong(request.pathVariable("id"));

                log.info(
                    "Super Admin {} deleting profile builder configuration ID: {}",
                    user.getUserId(),
                    configId
                );

                return configService
                    .deleteConfiguration(configId)
                    .flatMap(response ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(response)
                    );
            })
            .onErrorResume(this::handleError);
    }

    /**
     * POST /api/v1/superadmin/profile-builder/configs/{id}/activate
     * Activate a profile builder configuration
     *
     * Path param: id - Configuration ID
     *
     * @param request ServerRequest
     * @return Mono of ServerResponse with activation confirmation
     */
    public Mono<ServerResponse> activateConfiguration(ServerRequest request) {
        return jwtUtils
            .getUserFromServerRequest(request)
            .cast(UserJwtDto.class)
            .flatMap(user -> {
                // Verify super admin role
                if (!isSuperAdmin(user)) {
                    return Mono.error(
                        new ForbiddenException(
                            "Only Super Admins can activate profile builder configurations"
                        )
                    );
                }

                Long configId = Long.parseLong(request.pathVariable("id"));

                log.info(
                    "Super Admin {} activating profile builder configuration ID: {}",
                    user.getUserId(),
                    configId
                );

                return configService
                    .activateConfiguration(configId)
                    .flatMap(response ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(response)
                    );
            })
            .onErrorResume(this::handleError);
    }

    /**
     * GET /api/v1/superadmin/profile-builder/configs/stats
     * Get configuration statistics for a client
     *
     * Query params:
     * - client_id (optional, defaults to uni360)
     *
     * @param request ServerRequest
     * @return Mono of ServerResponse with configuration statistics
     */
    public Mono<ServerResponse> getConfigurationStats(ServerRequest request) {
        return jwtUtils
            .getUserFromServerRequest(request)
            .cast(UserJwtDto.class)
            .flatMap(user -> {
                // Verify super admin role
                if (!isSuperAdmin(user)) {
                    return Mono.error(
                        new ForbiddenException(
                            "Only Super Admins can access configuration statistics"
                        )
                    );
                }

                String clientId = request
                    .queryParam("client_id")
                    .orElse("uni360");

                log.info(
                    "Super Admin {} getting profile builder config stats for client: {}",
                    user.getUserId(),
                    clientId
                );

                return configService
                    .getConfigurationStats(clientId)
                    .flatMap(response ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(response)
                    );
            })
            .onErrorResume(this::handleError);
    }

    /**
     * GET /api/v1/students/profile/builder/config
     * Get active profile builder configuration (for students)
     *
     * This is a public endpoint that students can use to get the current
     * profile builder configuration without super admin access.
     *
     * @param request ServerRequest
     * @return Mono of ServerResponse with active configuration
     */
    public Mono<ServerResponse> getActiveConfiguration(ServerRequest request) {
        return jwtUtils
            .getUserFromServerRequest(request)
            .cast(UserJwtDto.class)
            .flatMap(user -> {
                String clientId = request
                    .queryParam("client_id")
                    .orElse("uni360");

                log.debug(
                    "User {} getting active profile builder config for client: {}",
                    user.getUserId(),
                    clientId
                );

                return configService
                    .getActiveConfiguration(clientId)
                    .flatMap(config -> {
                        ProfileBuilderConfigDto.ConfigResponse response =
                            ProfileBuilderConfigDto.ConfigResponse.builder()
                                .success(true)
                                .message(
                                    "Active configuration retrieved successfully"
                                )
                                .data(
                                    ProfileBuilderConfigDto.ConfigData.builder()
                                        .id(config.getId())
                                        .clientId(config.getClientId())
                                        .configName(config.getConfigName())
                                        .configDescription(
                                            config.getConfigDescription()
                                        )
                                        .version(config.getVersion())
                                        .configData(config.getConfigData())
                                        .isActive(config.getIsActive())
                                        .totalSteps(config.getTotalSteps())
                                        .stepOrder(config.getStepOrder())
                                        .build()
                                )
                                .build();

                        return ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(response);
                    })
                    .switchIfEmpty(
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(
                                ProfileBuilderConfigDto.ConfigResponse.builder()
                                    .success(false)
                                    .message(
                                        "No active configuration found for client: " +
                                            clientId
                                    )
                                    .build()
                            )
                    );
            })
            .onErrorResume(this::handleError);
    }

    /**
     * Check if user has super admin role
     */
    private boolean isSuperAdmin(UserJwtDto user) {
        return "SUPER_ADMIN".equalsIgnoreCase(user.getUserType());
    }

    /**
     * Handle errors and return appropriate response
     */
    private Mono<ServerResponse> handleError(Throwable error) {
        log.error(
            "Error in ProfileBuilderConfigHandler: {}",
            error.getMessage()
        );

        if (error instanceof UnauthorizedException) {
            return ServerResponse.status(401)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.error(error.getMessage()));
        }

        if (error instanceof ForbiddenException) {
            return ServerResponse.status(403)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.error(error.getMessage()));
        }

        if (error instanceof NumberFormatException) {
            return ServerResponse.status(400)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.error("Invalid configuration ID"));
        }

        return ServerResponse.status(500)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(
                ApiResponse.error(
                    "Internal server error: " + error.getMessage()
                )
            );
    }
}
