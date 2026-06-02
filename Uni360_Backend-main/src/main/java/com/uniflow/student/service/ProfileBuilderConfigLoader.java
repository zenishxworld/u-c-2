package com.uniflow.student.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.student.entity.ProfileBuilderConfig;
import com.uniflow.student.repository.ProfileBuilderConfigRepository;
import java.io.InputStream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Static Profile Builder Configuration Loader
 *
 * <p>
 * Loads the hardcoded profile builder configuration from the static JSON file
 * (config/profile-builder-static.json) on every application startup.
 * This ensures the database always reflects the fixed v1.4.0 configuration,
 * regardless of any previous DB state.
 *
 * <p>
 * Logic:
 * 1. Deactivate all existing configs for this client.
 * 2. Check if the static version (1.4.0) already exists in the DB.
 * 3. If yes: reactivate it (in case it was deactivated).
 * 4. If no: read the static JSON file, save it, and activate it.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(60) // Run after StaticWorkflowSeeder (order 50)
public class ProfileBuilderConfigLoader implements CommandLineRunner {

        private static final String STATIC_CONFIG_PATH = "classpath:config/profile-builder-static.json";
        private static final String STATIC_VERSION = "1.4.1";

        private final ProfileBuilderConfigRepository configRepository;
        private final ResourceLoader resourceLoader;
        private final ObjectMapper objectMapper;

        @Value("${uniflow.client.id:uni360}")
        private String clientId;

        @Value("${uniflow.profile-builder.auto-load:true}")
        private boolean autoLoad;

        @Value("${uniflow.profile-builder.fail-on-error:false}")
        private boolean failOnError;

        @Override
        public void run(String... args) throws Exception {
                if (!autoLoad) {
                        log.info("⏭️  Profile builder auto-load is disabled, skipping...");
                        return;
                }

                log.info(
                                "🚀 [StaticProfileBuilder] Loading static profile builder config v{} for client: {}",
                                STATIC_VERSION,
                                clientId);

                try {
                        loadStaticConfig()
                                        .doOnSuccess(config -> {
                                                if (config != null) {
                                                        log.info(
                                                                        "✅ [StaticProfileBuilder] Active config: ID={}, Version={}, Steps={}",
                                                                        config.getId(),
                                                                        config.getVersion(),
                                                                        config.getTotalSteps());
                                                }
                                        })
                                        .doOnError(error -> log.error(
                                                        "❌ [StaticProfileBuilder] Failed: {}",
                                                        error.getMessage(),
                                                        error))
                                        .block();
                } catch (Exception e) {
                        log.error(
                                        "💥 [StaticProfileBuilder] Critical error during config loading",
                                        e);
                        if (failOnError) {
                                throw e;
                        } else {
                                log.warn(
                                                "⚠️  Continuing startup despite error (fail-on-error=false)");
                        }
                }

                log.info(
                                "✅ [StaticProfileBuilder] Profile builder configuration loading complete");
        }

        private Mono<ProfileBuilderConfig> loadStaticConfig() {
                // Step 1: Check if the static version already exists in DB
                return configRepository
                                .existsByClientIdAndVersion(clientId, STATIC_VERSION)
                                .flatMap(exists -> {
                                        if (Boolean.TRUE.equals(exists)) {
                                                // Already in DB - just make sure it's active
                                                log.info(
                                                                "📄 [StaticProfileBuilder] v{} already in DB. Ensuring it is active...",
                                                                STATIC_VERSION);
                                                return configRepository
                                                                .deactivateAllByClientId(clientId)
                                                                .then(
                                                                                configRepository
                                                                                                .findByClientIdAndVersion(
                                                                                                                clientId,
                                                                                                                STATIC_VERSION)
                                                                                                .flatMap(config -> {
                                                                                                        config.setIsActive(
                                                                                                                        true);
                                                                                                        return configRepository
                                                                                                                        .save(config);
                                                                                                }));
                                        } else {
                                                // Not in DB - read from file and save
                                                log.info(
                                                                "📥 [StaticProfileBuilder] v{} not found in DB. Loading from static file...",
                                                                STATIC_VERSION);
                                                return readStaticConfigFile()
                                                                .flatMap(config -> configRepository
                                                                                .deactivateAllByClientId(clientId)
                                                                                .then(configRepository.save(config)));
                                        }
                                })
                                .onErrorResume(error -> {
                                        log.error(
                                                        "🚫 [StaticProfileBuilder] Error: {}",
                                                        error.getMessage());
                                        return failOnError ? Mono.error(error) : Mono.empty();
                                });
        }

        private Mono<ProfileBuilderConfig> readStaticConfigFile() {
                return Mono.fromCallable(() -> {
                        Resource resource = resourceLoader.getResource(STATIC_CONFIG_PATH);
                        if (!resource.exists()) {
                                throw new RuntimeException(
                                                "Static profile builder config not found at: " +
                                                                STATIC_CONFIG_PATH);
                        }

                        try (InputStream is = resource.getInputStream()) {
                                JsonNode root = objectMapper.readTree(is);

                                String configName = root
                                                .path("configName")
                                                .asText("UNI360 Profile Builder v1.4.0");
                                String configDescription = root
                                                .path("configDescription")
                                                .asText("");
                                String version = root.path("version").asText(STATIC_VERSION);
                                String fileClientId = root.path("client_id").asText(clientId);
                                JsonNode configData = root.path("configData");

                                log.info(
                                                "✅ [StaticProfileBuilder] Parsed static config: '{}' v{}",
                                                configName,
                                                version);

                                return ProfileBuilderConfig.builder()
                                                .clientId(fileClientId)
                                                .version(version)
                                                .configName(configName)
                                                .configDescription(configDescription)
                                                .configData(configData)
                                                .isActive(true)
                                                .isDefault(true)
                                                .build();
                        }
                });
        }

        /**
         * Get configuration statistics for monitoring
         *
         * @return Mono of String containing stats
         */
        public Mono<String> getConfigurationStats() {
                return configRepository
                                .countActiveByClientId(clientId)
                                .flatMap(activeCount -> configRepository
                                                .findAllByClientId(clientId)
                                                .count()
                                                .map(totalCount -> String.format(
                                                                "Client: %s | Total Configs: %d | Active: %d",
                                                                clientId,
                                                                totalCount,
                                                                activeCount)));
        }
}
