package com.uniflow.student.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.uniflow.student.dto.ProfileBuilderConfigDto;
import com.uniflow.student.entity.ProfileBuilderConfig;
import com.uniflow.student.repository.ProfileBuilderConfigRepository;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Service for managing Profile Builder Configurations
 * Handles CRUD operations, YAML loading, and configuration activation
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileBuilderConfigService {

    private final ProfileBuilderConfigRepository configRepository;
    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());

    @Value(
        "${uniflow.profile-builder.config-path:classpath:config/profile-builder-config.yml}"
    )
    private String configPath;

    /**
     * Load configuration from YAML file
     *
     * @return Mono of ProfileBuilderConfig ready to be persisted
     */
    public Mono<ProfileBuilderConfig> loadConfigurationFromYaml() {
        return Mono.fromCallable(() -> {
            log.info(
                "📄 Loading profile builder configuration from: {}",
                configPath
            );

            try {
                var resource = resourceLoader.getResource(configPath);
                if (!resource.exists()) {
                    throw new RuntimeException(
                        "Configuration file not found: " + configPath
                    );
                }

                // Parse YAML to JsonNode
                JsonNode yamlData = yamlMapper.readTree(
                    resource.getInputStream()
                );

                // Extract configuration details
                String clientId = yamlData.has("client_id")
                    ? yamlData.get("client_id").asText()
                    : "uni360";
                String version = yamlData.has("version")
                    ? yamlData.get("version").asText()
                    : "1.0.0";
                String configName = yamlData.has("config_name")
                    ? yamlData.get("config_name").asText()
                    : "Default Profile Builder";
                String configDescription = yamlData.has("config_description")
                    ? yamlData.get("config_description").asText()
                    : "";

                // Build config entity
                ProfileBuilderConfig config = ProfileBuilderConfig.builder()
                    .clientId(clientId)
                    .version(version)
                    .configName(configName)
                    .configDescription(configDescription)
                    .configData(yamlData.get("profile_builder"))
                    .isActive(false)
                    .isDefault(true)
                    .build();

                log.info(
                    "✅ Successfully parsed profile builder configuration"
                );
                return config;
            } catch (IOException e) {
                log.error(
                    "❌ Failed to load configuration from YAML: {}",
                    e.getMessage()
                );
                throw new RuntimeException(
                    "Failed to load configuration: " + e.getMessage(),
                    e
                );
            }
        });
    }

    /**
     * Get active configuration for a client
     *
     * @param clientId The client identifier
     * @return Mono of ProfileBuilderConfig
     */
    public Mono<ProfileBuilderConfig> getActiveConfiguration(String clientId) {
        log.info(
            "🔍 [CONFIG-DEBUG] Fetching active configuration for client: '{}'",
            clientId
        );
        return configRepository
            .findActiveByClientId(clientId)
            .doOnNext(config -> {
                log.info(
                    "✅ [CONFIG-DEBUG] Found config - ID: {}, Version: {}, Name: {}, isActive: {}, deleted: {}",
                    config.getId(),
                    config.getVersion(),
                    config.getConfigName(),
                    config.getIsActive(),
                    config.getDeleted()
                );
                if (config.getConfigData() != null) {
                    log.info(
                        "✅ [CONFIG-DEBUG] configData has {} top-level keys",
                        config.getConfigData().size()
                    );
                    if (config.getConfigData().has("steps")) {
                        log.info(
                            "✅ [CONFIG-DEBUG] configData has 'steps' with {} entries",
                            config.getConfigData().get("steps").size()
                        );
                    } else {
                        log.warn(
                            "⚠️ [CONFIG-DEBUG] configData does NOT have 'steps' key!"
                        );
                    }
                } else {
                    log.warn("⚠️ [CONFIG-DEBUG] configData is NULL!");
                }
            })
            .doOnSuccess(config -> {
                if (config != null) {
                    log.info(
                        "✅ [CONFIG-DEBUG] Successfully loaded config for client: {}",
                        clientId
                    );
                }
            })
            .switchIfEmpty(
                Mono.defer(() -> {
                    log.warn(
                        "⚠️ [CONFIG-DEBUG] No active configuration found for client: '{}' - repository returned empty!",
                        clientId
                    );
                    return Mono.empty();
                })
            )
            .doOnError(error ->
                log.error(
                    "❌ [CONFIG-DEBUG] Error fetching config for client '{}': {}",
                    clientId,
                    error.getMessage()
                )
            );
    }

    /**
     * Get default configuration for a client
     *
     * @param clientId The client identifier
     * @return Mono of ProfileBuilderConfig
     */
    public Mono<ProfileBuilderConfig> getDefaultConfiguration(String clientId) {
        log.debug("🔍 Fetching default configuration for client: {}", clientId);
        return configRepository.findDefaultByClientId(clientId);
    }

    /**
     * Create a new configuration
     *
     * @param request Create config request
     * @param userId User ID creating the configuration
     * @return Mono of ConfigResponse
     */
    public Mono<ProfileBuilderConfigDto.ConfigResponse> createConfiguration(
        ProfileBuilderConfigDto.CreateConfigRequest request,
        Long userId
    ) {
        log.info(
            "📝 Creating new profile builder configuration for client: {}",
            request.getClientId()
        );

        // Validate request
        if (request.getClientId() == null || request.getConfigData() == null) {
            return Mono.just(
                ProfileBuilderConfigDto.ConfigResponse.builder()
                    .success(false)
                    .message("Client ID and configuration data are required")
                    .build()
            );
        }

        // Check if version already exists
        return configRepository
            .existsByClientIdAndVersion(
                request.getClientId(),
                request.getVersion()
            )
            .flatMap(exists -> {
                if (Boolean.TRUE.equals(exists)) {
                    return Mono.just(
                        ProfileBuilderConfigDto.ConfigResponse.builder()
                            .success(false)
                            .message(
                                "Configuration with this version already exists"
                            )
                            .build()
                    );
                }

                // Create new config
                ProfileBuilderConfig config = ProfileBuilderConfig.builder()
                    .clientId(request.getClientId())
                    .configName(request.getConfigName())
                    .configDescription(request.getConfigDescription())
                    .version(
                        request.getVersion() != null
                            ? request.getVersion()
                            : "1.0.0"
                    )
                    .configData(request.getConfigData())
                    .isActive(false)
                    .isDefault(Boolean.TRUE.equals(request.getIsDefault()))
                    .createdBy(userId)
                    .updatedBy(userId)
                    .build();

                return configRepository
                    .save(config)
                    .map(savedConfig -> {
                        log.info(
                            "✅ Successfully created configuration with ID: {}",
                            savedConfig.getId()
                        );
                        return ProfileBuilderConfigDto.ConfigResponse.builder()
                            .success(true)
                            .message("Configuration created successfully")
                            .data(mapToConfigData(savedConfig))
                            .build();
                    });
            })
            .onErrorResume(error -> {
                log.error(
                    "❌ Failed to create configuration: {}",
                    error.getMessage()
                );
                return Mono.just(
                    ProfileBuilderConfigDto.ConfigResponse.builder()
                        .success(false)
                        .message(
                            "Failed to create configuration: " +
                                error.getMessage()
                        )
                        .build()
                );
            });
    }

    /**
     * Update an existing configuration
     *
     * @param id Configuration ID
     * @param request Update config request
     * @param userId User ID updating the configuration
     * @return Mono of ConfigResponse
     */
    public Mono<ProfileBuilderConfigDto.ConfigResponse> updateConfiguration(
        Long id,
        ProfileBuilderConfigDto.UpdateConfigRequest request,
        Long userId
    ) {
        log.info("📝 Updating profile builder configuration ID: {}", id);

        return configRepository
            .findById(id)
            .flatMap(config -> {
                // Update fields
                if (request.getConfigName() != null) {
                    config.setConfigName(request.getConfigName());
                }
                if (request.getConfigDescription() != null) {
                    config.setConfigDescription(request.getConfigDescription());
                }
                if (request.getConfigData() != null) {
                    config.setConfigData(request.getConfigData());
                }
                if (request.getIsDefault() != null) {
                    config.setIsDefault(request.getIsDefault());
                }
                config.setUpdatedBy(userId);

                return configRepository
                    .save(config)
                    .map(savedConfig -> {
                        log.info(
                            "✅ Successfully updated configuration ID: {}",
                            id
                        );
                        return ProfileBuilderConfigDto.ConfigResponse.builder()
                            .success(true)
                            .message("Configuration updated successfully")
                            .data(mapToConfigData(savedConfig))
                            .build();
                    });
            })
            .switchIfEmpty(
                Mono.just(
                    ProfileBuilderConfigDto.ConfigResponse.builder()
                        .success(false)
                        .message("Configuration not found with ID: " + id)
                        .build()
                )
            )
            .onErrorResume(error -> {
                log.error(
                    "❌ Failed to update configuration: {}",
                    error.getMessage()
                );
                return Mono.just(
                    ProfileBuilderConfigDto.ConfigResponse.builder()
                        .success(false)
                        .message(
                            "Failed to update configuration: " +
                                error.getMessage()
                        )
                        .build()
                );
            });
    }

    /**
     * Delete a configuration (soft delete)
     *
     * @param id Configuration ID
     * @return Mono of DeleteConfigResponse
     */
    public Mono<
        ProfileBuilderConfigDto.DeleteConfigResponse
    > deleteConfiguration(Long id) {
        log.info("🗑️  Deleting profile builder configuration ID: {}", id);

        return configRepository
            .findById(id)
            .flatMap(config -> {
                if (Boolean.TRUE.equals(config.getIsActive())) {
                    return Mono.just(
                        ProfileBuilderConfigDto.DeleteConfigResponse.builder()
                            .success(false)
                            .message(
                                "Cannot delete active configuration. Deactivate it first."
                            )
                            .build()
                    );
                }

                return configRepository
                    .softDeleteById(id)
                    .map(rowsAffected -> {
                        log.info(
                            "✅ Successfully deleted configuration ID: {}",
                            id
                        );
                        return ProfileBuilderConfigDto.DeleteConfigResponse.builder()
                            .success(true)
                            .message("Configuration deleted successfully")
                            .deletedConfigId(id)
                            .build();
                    });
            })
            .switchIfEmpty(
                Mono.just(
                    ProfileBuilderConfigDto.DeleteConfigResponse.builder()
                        .success(false)
                        .message("Configuration not found with ID: " + id)
                        .build()
                )
            )
            .onErrorResume(error -> {
                log.error(
                    "❌ Failed to delete configuration: {}",
                    error.getMessage()
                );
                return Mono.just(
                    ProfileBuilderConfigDto.DeleteConfigResponse.builder()
                        .success(false)
                        .message(
                            "Failed to delete configuration: " +
                                error.getMessage()
                        )
                        .build()
                );
            });
    }

    /**
     * Activate a configuration
     *
     * @param id Configuration ID to activate
     * @return Mono of ActivateConfigResponse
     */
    public Mono<
        ProfileBuilderConfigDto.ActivateConfigResponse
    > activateConfiguration(Long id) {
        log.info("⚡ Activating profile builder configuration ID: {}", id);

        return configRepository
            .findById(id)
            .flatMap(config -> {
                // Deactivate all other configs for this client
                return configRepository
                    .deactivateAllByClientId(config.getClientId())
                    .then(
                        Mono.defer(() -> {
                            // Activate this config
                            config.setIsActive(true);
                            return configRepository.save(config);
                        })
                    )
                    .map(savedConfig -> {
                        log.info(
                            "✅ Successfully activated configuration ID: {}",
                            id
                        );
                        return ProfileBuilderConfigDto.ActivateConfigResponse.builder()
                            .success(true)
                            .message("Configuration activated successfully")
                            .activatedConfigId(id)
                            .clientId(savedConfig.getClientId())
                            .version(savedConfig.getVersion())
                            .build();
                    });
            })
            .switchIfEmpty(
                Mono.just(
                    ProfileBuilderConfigDto.ActivateConfigResponse.builder()
                        .success(false)
                        .message("Configuration not found with ID: " + id)
                        .build()
                )
            )
            .onErrorResume(error -> {
                log.error(
                    "❌ Failed to activate configuration: {}",
                    error.getMessage()
                );
                return Mono.just(
                    ProfileBuilderConfigDto.ActivateConfigResponse.builder()
                        .success(false)
                        .message(
                            "Failed to activate configuration: " +
                                error.getMessage()
                        )
                        .build()
                );
            });
    }

    /**
     * List all configurations for a client
     *
     * @param clientId The client identifier
     * @return Mono of ConfigListResponse
     */
    public Mono<ProfileBuilderConfigDto.ConfigListResponse> listConfigurations(
        String clientId
    ) {
        log.debug("📋 Listing configurations for client: {}", clientId);

        return configRepository
            .findAllByClientId(clientId)
            .map(this::mapToConfigData)
            .collectList()
            .map(configs ->
                ProfileBuilderConfigDto.ConfigListResponse.builder()
                    .success(true)
                    .message("Configurations retrieved successfully")
                    .data(configs)
                    .totalCount(configs.size())
                    .build()
            )
            .onErrorResume(error -> {
                log.error(
                    "❌ Failed to list configurations: {}",
                    error.getMessage()
                );
                return Mono.just(
                    ProfileBuilderConfigDto.ConfigListResponse.builder()
                        .success(false)
                        .message(
                            "Failed to list configurations: " +
                                error.getMessage()
                        )
                        .build()
                );
            });
    }

    /**
     * Get step order for a client
     *
     * @param clientId The client identifier
     * @return Mono of List of step IDs in order
     */
    public Mono<List<String>> getStepOrder(String clientId) {
        log.info(
            "📋 [STEP-ORDER-DEBUG] Getting step order for client: '{}'",
            clientId
        );
        return getActiveConfiguration(clientId)
            .doOnNext(config -> {
                log.info(
                    "📋 [STEP-ORDER-DEBUG] Config found, calling getStepOrder() on config ID: {}",
                    config.getId()
                );
            })
            .map(config -> {
                List<String> stepOrder = config.getStepOrder();
                log.info(
                    "📋 [STEP-ORDER-DEBUG] getStepOrder() returned {} steps: {}",
                    stepOrder.size(),
                    stepOrder
                );
                return stepOrder;
            })
            .switchIfEmpty(
                Mono.defer(() -> {
                    log.warn(
                        "⚠️ [STEP-ORDER-DEBUG] getActiveConfiguration returned empty for client '{}', returning empty list",
                        clientId
                    );
                    return Mono.just(new ArrayList<>());
                })
            );
    }

    /**
     * Get step definitions map for a client
     *
     * @param clientId The client identifier
     * @return Mono of Map with step definitions
     */
    public Mono<Map<String, JsonNode>> getStepDefinitions(String clientId) {
        log.debug("📋 Getting step definitions for client: {}", clientId);
        return getActiveConfiguration(clientId)
            .map(config -> {
                Map<String, JsonNode> stepDefinitions = new HashMap<>();
                if (
                    config.getConfigData() != null &&
                    config.getConfigData().has("steps")
                ) {
                    config
                        .getConfigData()
                        .get("steps")
                        .forEach(step -> {
                            if (step.has("step_id")) {
                                String stepId = step.get("step_id").asText();
                                stepDefinitions.put(stepId, step);
                            }
                        });
                }
                return stepDefinitions;
            })
            .switchIfEmpty(Mono.just(new HashMap<>()));
    }

    /**
     * Get configuration statistics for a client
     *
     * @param clientId The client identifier
     * @return Mono of ConfigStatsResponse
     */
    public Mono<
        ProfileBuilderConfigDto.ConfigStatsResponse
    > getConfigurationStats(String clientId) {
        log.debug(
            "📊 Getting configuration statistics for client: {}",
            clientId
        );

        return Mono.zip(
            configRepository.findAllByClientId(clientId).count(),
            configRepository.countActiveByClientId(clientId),
            configRepository
                .findActiveByClientId(clientId)
                .map(ProfileBuilderConfig::getVersion)
                .defaultIfEmpty(""),
            configRepository
                .findDefaultByClientId(clientId)
                .map(ProfileBuilderConfig::getVersion)
                .defaultIfEmpty(""),
            configRepository
                .findAllByClientId(clientId)
                .map(ProfileBuilderConfig::getUpdatedAt)
                .sort((a, b) -> b.compareTo(a))
                .next()
                .defaultIfEmpty(java.time.LocalDateTime.now())
        )
            .map(tuple -> {
                Long totalConfigs = tuple.getT1();
                Long activeConfigs = tuple.getT2();
                String activeVersion = tuple.getT3();
                String defaultVersion = tuple.getT4();
                java.time.LocalDateTime lastUpdated = tuple.getT5();

                return ProfileBuilderConfigDto.ConfigStatsResponse.builder()
                    .success(true)
                    .message("Statistics retrieved successfully")
                    .stats(
                        ProfileBuilderConfigDto.ConfigStats.builder()
                            .clientId(clientId)
                            .totalConfigs(totalConfigs.intValue())
                            .activeConfigs(activeConfigs.intValue())
                            .inactiveConfigs(
                                Integer.valueOf(
                                    (int) (totalConfigs - activeConfigs)
                                )
                            )
                            .activeVersion(
                                activeVersion.isEmpty() ? null : activeVersion
                            )
                            .defaultVersion(
                                defaultVersion.isEmpty() ? null : defaultVersion
                            )
                            .lastUpdated(lastUpdated)
                            .build()
                    )
                    .build();
            })
            .onErrorResume(error -> {
                log.error(
                    "❌ Failed to get statistics: {}",
                    error.getMessage()
                );
                return Mono.just(
                    ProfileBuilderConfigDto.ConfigStatsResponse.builder()
                        .success(false)
                        .message(
                            "Failed to get statistics: " + error.getMessage()
                        )
                        .build()
                );
            });
    }

    /**
     * Map entity to DTO
     */
    private ProfileBuilderConfigDto.ConfigData mapToConfigData(
        ProfileBuilderConfig config
    ) {
        return ProfileBuilderConfigDto.ConfigData.builder()
            .id(config.getId())
            .clientId(config.getClientId())
            .configName(config.getConfigName())
            .configDescription(config.getConfigDescription())
            .version(config.getVersion())
            .configData(config.getConfigData())
            .isActive(config.getIsActive())
            .isDefault(config.getIsDefault())
            .createdBy(config.getCreatedBy())
            .updatedBy(config.getUpdatedBy())
            .createdAt(config.getCreatedAt())
            .updatedAt(config.getUpdatedAt())
            .totalSteps(config.getTotalSteps())
            .stepOrder(config.getStepOrder())
            .build();
    }
}
