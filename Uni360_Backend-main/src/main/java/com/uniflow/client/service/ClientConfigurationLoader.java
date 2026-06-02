package com.uniflow.client.service;

import com.uniflow.client.exception.ClientWorkflowException;
import com.uniflow.workflow.entity.WorkflowDefinition;
import com.uniflow.workflow.repository.WorkflowDefinitionRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Boot-time configuration loader for client workflow definitions
 * Implements CommandLineRunner to load and validate workflow configurations at application startup
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Profile("!test") // Don't run during tests
public class ClientConfigurationLoader implements CommandLineRunner {

    private final ClientWorkflowConfigService clientWorkflowConfigService;
    private final WorkflowValidationService workflowValidationService;
    private final WorkflowDefinitionRepository workflowDefinitionRepository;

    @Value("${uniflow.client.id:uni360}")
    private String clientId;

    @Value("${uniflow.client.auto-load:true}")
    private boolean autoLoad;

    @Value("${uniflow.client.validation.strict:true}")
    private boolean strictValidation;

    @Value("${uniflow.client.validation.fail-on-error:true}")
    private boolean failOnError;

    /**
     * Main entry point called during application startup
     * @param args command line arguments (not used)
     */
    @Override
    public void run(String... args) throws Exception {
        if (!autoLoad) {
            log.info(
                    "⏭️  Client configuration auto-load is disabled, skipping..."
            );
            return;
        }

        log.info("🚀 Starting client configuration loading for: {}", clientId);
        log.info("📋 Configuration settings:");
        log.info("   - Client ID: {}", clientId);
        log.info("   - Auto-load: {}", autoLoad);
        log.info("   - Strict validation: {}", strictValidation);
        log.info("   - Fail on error: {}", failOnError);

        try {
            loadAndValidateConfigurations()
                    .doOnSuccess(count ->
                            log.info(
                                    "🎉 Successfully loaded and validated {} workflow definitions",
                                    count
                            )
                    )
                    .doOnError(error -> {
                        log.error(
                                "❌ Failed to load client configurations: {}",
                                error.getMessage()
                        );
                        if (failOnError) {
                            log.error(
                                    "💥 Application startup will fail due to configuration errors"
                            );
                            System.exit(1);
                        } else {
                            log.warn(
                                    "⚠️  Continuing startup despite configuration errors (fail-on-error=false)"
                            );
                        }
                    })
                    .block();
        } catch (Exception e) {
            log.error("💥 Critical error during configuration loading", e);
            if (failOnError) {
                throw e;
            } else {
                log.warn(
                        "⚠️  Continuing startup despite critical error (fail-on-error=false)"
                );
            }
        }

        log.info("✅ Client configuration loading completed for: {}", clientId);
    }

    /**
     * Load and validate configurations with comprehensive error handling
     * @return Mono<Integer> number of successfully loaded definitions
     */
    private Mono<Integer> loadAndValidateConfigurations() {
        return checkExistingConfigurations()
                .flatMap(hasExisting -> {
                    if (hasExisting) {
                        log.info(
                                "📄 Found existing workflow definitions for client: {}",
                                clientId
                        );
                        return validateExistingConfigurations();
                    } else {
                        log.info(
                                "📄 No existing configurations found, loading from YAML files"
                        );
                        return loadNewConfigurations();
                    }
                })
                .onErrorResume(error -> {
                    if (error instanceof ClientWorkflowException) {
                        ClientWorkflowException cwe =
                                (ClientWorkflowException) error;
                        log.error(
                                "🚫 Client workflow error [{}]: {}",
                                cwe.getErrorCode(),
                                cwe.getMessage()
                        );
                    } else {
                        log.error(
                                "🚫 Unexpected error during configuration loading",
                                error
                        );
                    }

                    if (failOnError) {
                        return Mono.error(error);
                    } else {
                        log.warn(
                                "⚠️  Returning 0 due to error (fail-on-error=false)"
                        );
                        return Mono.just(0);
                    }
                });
    }

    /**
     * Check if existing configurations are present for this client
     * @return Mono<Boolean> true if existing configurations found
     */
    private Mono<Boolean> checkExistingConfigurations() {
        log.debug(
                "🔍 Checking for existing workflow definitions for client: {}",
                clientId
        );

        return workflowDefinitionRepository
                .countActiveWorkflowsByClient(clientId)
                .map(count -> {
                    log.debug(
                            "📊 Found {} active workflow definitions for client: {}",
                            count,
                            clientId
                    );
                    return count > 0;
                })
                .doOnError(error ->
                        log.error(
                                "❌ Failed to check existing configurations: {}",
                                error.getMessage()
                        )
                );
    }

    /**
     * Validate existing configurations in the database
     * @return Mono<Integer> number of validated definitions
     */
    private Mono<Integer> validateExistingConfigurations() {
        log.info(
                "🔍 Validating existing workflow definitions for client: {}",
                clientId
        );

        return clientWorkflowConfigService
                .getClientWorkflowDefinitions()
                .collectList()
                .flatMap(definitions -> {
                    if (definitions.isEmpty()) {
                        log.info(
                                "📄 No active workflow definitions found for validation"
                        );
                        return Mono.just(0);
                    }

                    log.info(
                            "🔍 Validating {} existing workflow definitions",
                            definitions.size()
                    );

                    if (strictValidation) {
                        return workflowValidationService
                                .validateWorkflowDefinitions(definitions)
                                .then(Mono.just(definitions.size()))
                                .doOnSuccess(count ->
                                        log.info(
                                                "✅ All {} existing workflow definitions validated successfully",
                                                count
                                        )
                                );
                    } else {
                        return validateDefinitionsLenient(definitions);
                    }
                });
    }

    /**
     * Load new configurations from YAML files
     * @return Mono<Integer> number of loaded definitions
     */
    private Mono<Integer> loadNewConfigurations() {
        log.info(
                "📥 Loading new workflow configurations from YAML for client: {}",
                clientId
        );

        return clientWorkflowConfigService
                .loadClientWorkflowConfigurations()
                .flatMap(definitions -> {
                    if (definitions.isEmpty()) {
                        log.warn(
                                "⚠️  No workflow definitions found in configuration files"
                        );
                        return Mono.just(0);
                    }

                    log.info(
                            "📋 Loaded {} workflow definitions from configuration",
                            definitions.size()
                    );

                    // Validate definitions before persisting
                    if (strictValidation) {
                        return workflowValidationService
                                .validateWorkflowDefinitions(definitions)
                                .then(persistWorkflowDefinitions(definitions));
                    } else {
                        return persistWorkflowDefinitions(definitions);
                    }
                });
    }

    /**
     * Persist workflow definitions to database with idempotency
     * @param definitions workflow definitions to persist
     * @return Mono<Integer> number of persisted definitions
     */
    private Mono<Integer> persistWorkflowDefinitions(
            List<WorkflowDefinition> definitions
    ) {
        log.info(
                "💾 Persisting {} workflow definitions to database",
                definitions.size()
        );

        return Flux.fromIterable(definitions)
                   .flatMap(this::persistSingleDefinition)
                   .collectList()
                   .map(results -> {
                       int successCount = (int) results
                               .stream()
                               .filter(Boolean::booleanValue)
                               .count();
                       int failCount = results.size() - successCount;

                       log.info(
                               "💾 Persistence results: {} succeeded, {} failed",
                               successCount,
                               failCount
                       );

                       if (failCount > 0 && failOnError) {
                           throw new ClientWorkflowException(
                                   clientId,
                                   "PERSISTENCE_FAILED",
                                   String.format(
                                           "Failed to persist %d workflow definitions",
                                           failCount
                                   )
                           );
                       }

                       return successCount;
                   });
    }

    /**
     * Persist a single workflow definition with idempotency check
     * @param definition workflow definition to persist
     * @return Mono<Boolean> true if successfully persisted or already exists
     */
    private Mono<Boolean> persistSingleDefinition(
            WorkflowDefinition definition
    ) {
        log.debug(
                "💾 Persisting workflow definition: {}",
                definition.getDefinitionKey()
        );

        // Check if definition already exists with same unique constraint fields
        return workflowDefinitionRepository
                .existsByClientIdAndCountryCodeAndDegreeLevelAndVersion(
                        definition.getClientId(),
                        definition.getCountryCode(),
                        definition.getDegreeLevel(),
                        definition.getVersion()
                )
                .flatMap(exists -> {
                    if (exists) {
                        log.debug(
                                "⏭️  Workflow definition already exists: client={}, country={}, degree={}, version={}",
                                definition.getClientId(),
                                definition.getCountryCode(),
                                definition.getDegreeLevel(),
                                definition.getVersion()
                        );
                        return Mono.just(true); // Already exists, consider it success
                    } else {
                        // Set audit fields
                        definition.setCreatedAt(LocalDateTime.now());
                        definition.setUpdatedAt(LocalDateTime.now());
                        definition.setCreatedBy("system-loader");
                        definition.setUpdatedBy("system-loader");

                        return workflowDefinitionRepository
                                .save(definition)
                                .map(saved -> {
                                    log.debug(
                                            "✅ Successfully persisted workflow definition: {} with ID: {}",
                                            saved.getDefinitionKey(),
                                            saved.getId()
                                    );
                                    return true;
                                })
                                .onErrorResume(error -> {
                                    log.error(
                                            "❌ Failed to persist workflow definition {}: {}",
                                            definition.getDefinitionKey(),
                                            error.getMessage()
                                    );
                                    return Mono.just(false);
                                });
                    }
                });
    }

    /**
     * Validate definitions in lenient mode (log errors but don't fail)
     * @param definitions workflow definitions to validate
     * @return Mono<Integer> number of definitions processed
     */
    private Mono<Integer> validateDefinitionsLenient(
            List<WorkflowDefinition> definitions
    ) {
        log.info(
                "🔍 Validating {} definitions in lenient mode",
                definitions.size()
        );

        return Flux.fromIterable(definitions)
                   .flatMap(definition ->
                           workflowValidationService
                                   .validateWorkflowDefinition(definition)
                                   .then(Mono.just(true))
                                   .onErrorResume(error -> {
                                       log.warn(
                                               "⚠️  Validation failed for definition {} (lenient mode): {}",
                                               definition.getDefinitionKey(),
                                               error.getMessage()
                                       );
                                       return Mono.just(false);
                                   })
                   )
                   .collectList()
                   .map(results -> {
                       int validCount = (int) results
                               .stream()
                               .filter(Boolean::booleanValue)
                               .count();
                       int invalidCount = results.size() - validCount;

                       log.info(
                               "🔍 Validation results: {} valid, {} invalid",
                               validCount,
                               invalidCount
                       );

                       return results.size(); // Return total processed count
                   });
    }

    /**
     * Activate loaded workflow definitions
     * This method can be called after successful loading to activate the definitions
     * @param definitions workflow definitions to activate
     * @return Mono<Integer> number of activated definitions
     */
    public Mono<Integer> activateWorkflowDefinitions(
            List<WorkflowDefinition> definitions
    ) {
        log.info("🔄 Activating {} workflow definitions", definitions.size());

        return Flux.fromIterable(definitions)
                   .flatMap(definition ->
                           clientWorkflowConfigService
                                   .activateWorkflowDefinition(
                                           definition.getCountryCode(),
                                           definition.getDegreeLevel(),
                                           definition.getDeploymentId()
                                   )
                                   .then(Mono.just(true))
                                   .onErrorResume(error -> {
                                       log.error(
                                               "❌ Failed to activate workflow definition {}: {}",
                                               definition.getDefinitionKey(),
                                               error.getMessage()
                                       );
                                       return Mono.just(false);
                                   })
                   )
                   .collectList()
                   .map(results -> {
                       int activatedCount = (int) results
                               .stream()
                               .filter(Boolean::booleanValue)
                               .count();
                       log.info(
                               "🔄 Successfully activated {} workflow definitions",
                               activatedCount
                       );
                       return activatedCount;
                   });
    }

    /**
     * Get configuration loading statistics
     * @return Mono with configuration statistics
     */
    public Mono<ConfigurationStats> getConfigurationStats() {
        return workflowDefinitionRepository
                .countActiveWorkflowsByClient(clientId)
                .map(activeCount ->
                        ConfigurationStats.builder()
                                          .clientId(clientId)
                                          .activeDefinitions(activeCount)
                                          .autoLoad(autoLoad)
                                          .strictValidation(strictValidation)
                                          .failOnError(failOnError)
                                          .lastLoadTime(LocalDateTime.now())
                                          .build()
                );
    }

    /**
     * Configuration statistics data class
     */
    @lombok.Data
    @lombok.Builder
    public static class ConfigurationStats {

        private String clientId;
        private Long activeDefinitions;
        private boolean autoLoad;
        private boolean strictValidation;
        private boolean failOnError;
        private LocalDateTime lastLoadTime;
    }
}