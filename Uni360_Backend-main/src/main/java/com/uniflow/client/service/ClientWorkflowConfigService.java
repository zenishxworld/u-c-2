package com.uniflow.client.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.uniflow.client.dto.ClientWorkflowConfigDTO;
import com.uniflow.client.exception.ClientWorkflowException;
import com.uniflow.workflow.entity.WorkflowDefinition;
import com.uniflow.workflow.repository.WorkflowDefinitionRepository;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Service for managing client workflow configurations
 * Handles loading, parsing, and persisting workflow definitions from YAML files
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClientWorkflowConfigService {

    private final WorkflowDefinitionRepository workflowDefinitionRepository;
    private final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());
    private final ResourceLoader resourceLoader;

    @Value("${uniflow.client.id:uni360}")
    private String clientId;

    @Value("${uniflow.client.config-path:classpath:config/clients}")
    private String configPath;

    /**
     * Load and parse client workflow configurations from YAML
     * @return List of workflow definitions ready for persistence
     */
    public Mono<List<WorkflowDefinition>> loadClientWorkflowConfigurations() {
        return Mono.fromCallable(() -> {
            log.info("📄 Loading client configuration for: {}", clientId);

            String yamlPath = String.format("%s/%s.yml", configPath, clientId);
            log.debug("Loading configuration from: {}", yamlPath);

            try {
                var resource = resourceLoader.getResource(yamlPath);
                if (!resource.exists()) {
                    throw new ClientWorkflowException(
                        clientId,
                        "CONFIG_NOT_FOUND",
                        "Configuration file not found: " + yamlPath
                    );
                }

                ClientWorkflowConfigDTO config = yamlMapper.readValue(
                    resource.getInputStream(),
                    ClientWorkflowConfigDTO.class
                );

                if (!config.isValid()) {
                    throw new ClientWorkflowException(
                        clientId,
                        "INVALID_CONFIG",
                        "Configuration validation failed for client: " +
                            clientId
                    );
                }

                log.info(
                    "✅ Successfully parsed configuration with {} workflows",
                    config.getWorkflows().size()
                );

                return convertToWorkflowDefinitions(config);
            } catch (IOException e) {
                log.error(
                    "Failed to load configuration for client {}: {}",
                    clientId,
                    e.getMessage()
                );
                throw new ClientWorkflowException(
                    clientId,
                    "CONFIG_LOAD_ERROR",
                    "Failed to load configuration: " + e.getMessage(),
                    e
                );
            }
        })
            .doOnSuccess(definitions ->
                log.info(
                    "✅ Successfully processed {} workflow definitions for client: {}",
                    definitions.size(),
                    clientId
                )
            )
            .doOnError(error ->
                log.error(
                    "❌ Failed to load client configurations: {}",
                    error.getMessage()
                )
            );
    }

    /**
     * Upload a new workflow definition with comprehensive configuration
     *
     * @param clientIdParam client ID for the workflow
     * @param countryCode country code for the workflow
     * @param degreeLevel degree level for the workflow
     * @param deploymentId deployment ID (can be null for auto-generation)
     * @param workflowConfig workflow configuration as JsonNode
     * @param uploadedBy user who uploaded the configuration
     * @param forceUpload whether to force upload even if exists
     * @return saved workflow definition
     */
    public Mono<WorkflowDefinition> uploadWorkflowDefinition(
        String clientIdParam,
        String countryCode,
        String degreeLevel,
        String deploymentId,
        JsonNode workflowConfig,
        String uploadedBy,
        Boolean forceUpload
    ) {
        log.info(
            "📤 Uploading workflow definition for client: {}, country: {}, degree: {}",
            clientIdParam,
            countryCode,
            degreeLevel
        );

        return Mono.just(workflowConfig)
            .flatMap(config -> {
                // Use provided deployment ID or generate new one
                // For force uploads, always generate new deployment ID to avoid unique constraint violation
                Mono<String> deploymentIdMono = (deploymentId != null &&
                        !deploymentId.trim().isEmpty() &&
                        !Boolean.TRUE.equals(forceUpload))
                    ? Mono.just(deploymentId)
                    : generateDeploymentId();

                return deploymentIdMono.flatMap(finalDeploymentId -> {
                    // Check if workflow already exists (unless force upload)
                    if (!Boolean.TRUE.equals(forceUpload)) {
                        return workflowDefinitionRepository
                            .findByClientIdAndCountryCodeAndDegreeLevelAndIsActiveTrue(
                                clientIdParam,
                                countryCode,
                                degreeLevel
                            )
                            .flatMap(existing ->
                                Mono.error(
                                    new RuntimeException(
                                        String.format(
                                            "Active workflow already exists for %s/%s/%s. Use force_upload=true to override.",
                                            clientIdParam,
                                            countryCode,
                                            degreeLevel
                                        )
                                    )
                                )
                            )
                            .then(
                                saveWorkflowDefinitionWithClient(
                                    clientIdParam,
                                    countryCode,
                                    degreeLevel,
                                    workflowConfig,
                                    finalDeploymentId,
                                    uploadedBy
                                )
                            );
                    } else {
                        // Force upload - deactivate existing first
                        return workflowDefinitionRepository
                            .deactivatePreviousVersions(
                                clientIdParam,
                                countryCode,
                                degreeLevel
                            )
                            .then(
                                saveWorkflowDefinitionWithClient(
                                    clientIdParam,
                                    countryCode,
                                    degreeLevel,
                                    workflowConfig,
                                    finalDeploymentId,
                                    uploadedBy
                                )
                            );
                    }
                });
            })
            .doOnSuccess(definition ->
                log.info(
                    "✅ Successfully uploaded workflow definition with ID: {}",
                    definition.getId()
                )
            )
            .doOnError(error ->
                log.error(
                    "❌ Failed to upload workflow definition: {}",
                    error.getMessage()
                )
            );
    }

    /**
     * Upload a new workflow definition for the client (legacy version)
     * @param countryCode country code for the workflow
     * @param degreeLevel degree level for the workflow
     * @param workflowConfig workflow configuration as JsonNode
     * @param uploadedBy user who uploaded the configuration
     * @return saved workflow definition
     */
    public Mono<WorkflowDefinition> uploadWorkflowDefinition(
        String countryCode,
        String degreeLevel,
        JsonNode workflowConfig,
        String uploadedBy
    ) {
        log.info(
            "📤 Uploading workflow definition for client: {}, country: {}, degree: {}",
            clientId,
            countryCode,
            degreeLevel
        );

        return generateDeploymentId()
            .flatMap(deploymentId ->
                saveWorkflowDefinition(
                    countryCode,
                    degreeLevel,
                    workflowConfig,
                    deploymentId,
                    uploadedBy
                )
            )
            .doOnSuccess(definition ->
                log.info(
                    "✅ Successfully uploaded workflow definition with ID: {}",
                    definition.getId()
                )
            )
            .doOnError(error ->
                log.error(
                    "❌ Failed to upload workflow definition: {}",
                    error.getMessage()
                )
            );
    }

    /**
     * Get active workflow definition for client, country, and degree level
     * @param countryCode country code
     * @param degreeLevel degree level
     * @return active workflow definition
     */
    public Mono<WorkflowDefinition> getActiveWorkflowDefinition(
        String countryCode,
        String degreeLevel
    ) {
        return workflowDefinitionRepository
            .findByClientIdAndCountryCodeAndDegreeLevelAndIsActiveTrue(
                clientId,
                countryCode,
                degreeLevel
            )
            .doOnSuccess(definition -> {
                if (definition != null) {
                    log.debug(
                        "Found active workflow definition: {} for {}/{}/{}",
                        definition.getDefinitionKey(),
                        clientId,
                        countryCode,
                        degreeLevel
                    );
                } else {
                    log.warn(
                        "No active workflow definition found for {}/{}/{}",
                        clientId,
                        countryCode,
                        degreeLevel
                    );
                }
            });
    }

    /**
     * Convert ClientWorkflowConfigDTO to WorkflowDefinition entities
     */
    private List<WorkflowDefinition> convertToWorkflowDefinitions(
        ClientWorkflowConfigDTO config
    ) {
        List<WorkflowDefinition> definitions = new ArrayList<>();

        for (ClientWorkflowConfigDTO.WorkflowConfigDTO workflowConfig : config.getWorkflows()) {
            try {
                JsonNode workflowJson = yamlMapper.valueToTree(workflowConfig);
                String deploymentId = UUID.randomUUID().toString();

                WorkflowDefinition definition = WorkflowDefinition.builder()
                    .definitionKey(workflowConfig.getWorkflowDefinitionKey())
                    .definitionName(workflowConfig.getName())
                    .definitionDescription(workflowConfig.getDescription())
                    .version(1) // Initial version
                    .clientId(clientId)
                    .countryCode(workflowConfig.getCountryCode())
                    .degreeLevel(workflowConfig.getDegreeLevel())
                    .workflowConfig(workflowJson)
                    .deploymentId(deploymentId)
                    .isActive(true) // keep it active as you import
                    .deleted(false)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .createdBy("system")
                    .updatedBy("system")
                    .build();

                definitions.add(definition);
            } catch (Exception e) {
                log.error(
                    "Failed to convert workflow config to definition: {}",
                    e.getMessage()
                );
                throw new ClientWorkflowException(
                    clientId,
                    "CONFIG_CONVERSION_ERROR",
                    "Failed to convert workflow config: " +
                        workflowConfig.getWorkflowDefinitionKey(),
                    e
                );
            }
        }

        return definitions;
    }

    /**
     * Save workflow definition with version management (with specific client ID)
     */
    private Mono<WorkflowDefinition> saveWorkflowDefinitionWithClient(
        String clientIdParam,
        String countryCode,
        String degreeLevel,
        JsonNode workflowConfig,
        String deploymentId,
        String uploadedBy
    ) {
        // Get next version number
        return workflowDefinitionRepository
            .findLatestVersion(clientIdParam, countryCode, degreeLevel)
            .defaultIfEmpty(0)
            .flatMap(latestVersion -> {
                Integer nextVersion = latestVersion + 1;
                String definitionKey = String.format(
                    "%s_%s_%s_WORKFLOW",
                    clientIdParam.toUpperCase(),
                    countryCode.toUpperCase(),
                    degreeLevel.toUpperCase()
                );

                WorkflowDefinition newDefinition = WorkflowDefinition.builder()
                    .definitionKey(definitionKey)
                    .definitionName(
                        String.format(
                            "%s %s %s Workflow",
                            clientIdParam.toUpperCase(),
                            countryCode,
                            degreeLevel
                        )
                    )
                    .definitionDescription(
                        String.format(
                            "Workflow for %s client, %s country, %s degree applications",
                            clientIdParam,
                            countryCode,
                            degreeLevel
                        )
                    )
                    .version(nextVersion)
                    .clientId(clientIdParam)
                    .countryCode(countryCode)
                    .degreeLevel(degreeLevel)
                    .workflowConfig(workflowConfig)
                    .deploymentId(deploymentId)
                    .isActive(true) // Activate immediately for API uploads
                    .deleted(false)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .createdBy(uploadedBy != null ? uploadedBy : "api")
                    .updatedBy(uploadedBy != null ? uploadedBy : "api")
                    .build();

                return workflowDefinitionRepository.save(newDefinition);
            });
    }

    /**
     * Save workflow definition with version management (legacy version)
     */
    private Mono<WorkflowDefinition> saveWorkflowDefinition(
        String countryCode,
        String degreeLevel,
        JsonNode workflowConfig,
        String deploymentId,
        String uploadedBy
    ) {
        // Get next version number
        return workflowDefinitionRepository
            .findLatestVersion(clientId, countryCode, degreeLevel)
            .defaultIfEmpty(0)
            .flatMap(latestVersion -> {
                Integer nextVersion = latestVersion + 1;
                String definitionKey = String.format(
                    "%s_%s_%s",
                    clientId.toUpperCase(),
                    countryCode.toUpperCase(),
                    degreeLevel.toUpperCase()
                );

                WorkflowDefinition newDefinition = WorkflowDefinition.builder()
                    .definitionKey(definitionKey)
                    .definitionName(
                        String.format(
                            "%s %s Workflow",
                            countryCode,
                            degreeLevel
                        )
                    )
                    .definitionDescription(
                        String.format(
                            "Workflow for %s %s applications",
                            countryCode,
                            degreeLevel
                        )
                    )
                    .version(nextVersion)
                    .clientId(clientId)
                    .countryCode(countryCode)
                    .degreeLevel(degreeLevel)
                    .workflowConfig(workflowConfig)
                    .deploymentId(deploymentId)
                    .isActive(false) // Will be activated after validation
                    .deleted(false)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .createdBy(uploadedBy != null ? uploadedBy : "system")
                    .updatedBy(uploadedBy != null ? uploadedBy : "system")
                    .build();

                return workflowDefinitionRepository.save(newDefinition);
            });
    }

    /**
     * Generate unique deployment ID
     */
    private Mono<String> generateDeploymentId() {
        return generateUniqueDeploymentId();
    }

    private Mono<String> generateUniqueDeploymentId() {
        String deploymentId = String.format(
            "%s-%s-%d",
            clientId,
            UUID.randomUUID().toString().substring(0, 8),
            System.currentTimeMillis()
        );

        return workflowDefinitionRepository
            .existsByDeploymentId(deploymentId)
            .flatMap(exists -> {
                if (exists) {
                    // If exists, recursively generate a new one
                    return generateUniqueDeploymentId();
                } else {
                    // If unique, return it
                    return Mono.just(deploymentId);
                }
            });
    }

    /**
     * Get all workflow definitions for the client
     */
    public Flux<WorkflowDefinition> getClientWorkflowDefinitions() {
        return workflowDefinitionRepository
            .findByClientIdAndIsActiveTrue(clientId)
            .doOnNext(definition ->
                log.debug(
                    "Found workflow definition: {} for client: {}",
                    definition.getDefinitionKey(),
                    clientId
                )
            );
    }

    /**
     * Activate workflow definition and deactivate previous versions
     */
    public Mono<WorkflowDefinition> activateWorkflowDefinition(
        String countryCode,
        String degreeLevel,
        String deploymentId
    ) {
        log.info(
            "🔄 Activating workflow definition with deployment ID: {}",
            deploymentId
        );

        return workflowDefinitionRepository
            .findFirstByDeploymentId(deploymentId)
            .switchIfEmpty(
                Mono.error(
                    new ClientWorkflowException(
                        clientId,
                        "DEPLOYMENT_NOT_FOUND",
                        "Deployment not found: " + deploymentId
                    )
                )
            )
            .flatMap(definition ->
                // First deactivate previous versions
                workflowDefinitionRepository
                    .deactivatePreviousVersions(
                        clientId,
                        countryCode,
                        degreeLevel
                    )
                    .then(Mono.just(definition))
            )
            .flatMap(definition -> {
                // Activate the new definition
                definition.setIsActive(true);
                definition.setUpdatedAt(LocalDateTime.now());
                return workflowDefinitionRepository.save(definition);
            })
            .doOnSuccess(definition ->
                log.info(
                    "✅ Successfully activated workflow definition: {} version: {}",
                    definition.getDefinitionKey(),
                    definition.getVersion()
                )
            );
    }
}
