package com.uniflow.workflow.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.workflow.entity.WorkflowDefinition;
import com.uniflow.workflow.repository.WorkflowDefinitionRepository;
import java.io.InputStream;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Static Workflow Seeder
 *
 * <p>
 * Loads the 4 static workflow definitions from classpath JSON files on startup.
 * Each file is an API response with a 'data' wrapper containing the workflow
 * info.
 * Uses upsert logic: if a workflow definition with the same
 * client+country+degree already
 * exists and is active, it will be updated to the latest version from the file.
 * This ensures the DB always matches the static files in the repository.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(50) // Run before ProfileBuilderConfigLoader
public class StaticWorkflowSeeder implements CommandLineRunner {

    private final WorkflowDefinitionRepository workflowDefinitionRepository;
    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper;

    // The 4 static workflow files in classpath:workflow/
    private static final String[] WORKFLOW_FILES = {
            "classpath:workflow/germanybachelor.json",
            "classpath:workflow/germanymasters.json",
            "classpath:workflow/ukbachelor.json",
            "classpath:workflow/ukmasters.json",
    };

    @Override
    public void run(String... args) throws Exception {
        log.info("🚀 [StaticWorkflowSeeder] Starting static workflow seeding...");
        try {
            Flux.fromArray(WORKFLOW_FILES)
                    .flatMap(this::seedWorkflowFromFile)
                    .doOnComplete(() -> log.info(
                            "✅ [StaticWorkflowSeeder] All static workflows seeded successfully"))
                    .doOnError(e -> log.error(
                            "❌ [StaticWorkflowSeeder] Error seeding workflows: {}",
                            e.getMessage(),
                            e))
                    .blockLast();
        } catch (Exception e) {
            log.error(
                    "💥 [StaticWorkflowSeeder] Critical error during workflow seeding: {}",
                    e.getMessage(),
                    e);
            // Don't fail startup - log and continue
        }
    }

    private Mono<WorkflowDefinition> seedWorkflowFromFile(String filePath) {
        return Mono.fromCallable(() -> {
            log.info(
                    "📄 [StaticWorkflowSeeder] Loading workflow from: {}",
                    filePath);
            Resource resource = resourceLoader.getResource(filePath);
            if (!resource.exists()) {
                log.warn(
                        "⚠️ [StaticWorkflowSeeder] Workflow file not found: {}, skipping",
                        filePath);
                return null;
            }

            try (InputStream is = resource.getInputStream()) {
                JsonNode root = objectMapper.readTree(is);

                // The files are API response format: { "success": true, "data": { ... } }
                JsonNode data = root.has("data") ? root.get("data") : root;

                String clientId = data.path("clientId").asText("uni360");
                String countryCode = data.path("countryCode").asText();
                String degreeLevel = data.path("degreeLevel").asText();
                String definitionKey = data.path("definitionKey").asText();
                String definitionName = data.path("definitionName").asText();
                String deploymentId = data.path("deploymentId").asText(null);
                JsonNode workflowConfig = data.path("workflowConfig");

                log.info(
                        "📝 [StaticWorkflowSeeder] Parsed workflow: client={}, country={}, degree={}, key={}",
                        clientId,
                        countryCode,
                        degreeLevel,
                        definitionKey);

                return new WorkflowPayload(
                        clientId,
                        countryCode,
                        degreeLevel,
                        definitionKey,
                        definitionName,
                        deploymentId,
                        workflowConfig);
            }
        })
                .filter(payload -> payload != null)
                .flatMap(this::upsertWorkflow);
    }

    private Mono<WorkflowDefinition> upsertWorkflow(WorkflowPayload payload) {
        return workflowDefinitionRepository
                .findLatestByClientAndCountryAndDegree(
                        payload.clientId(),
                        payload.countryCode(),
                        payload.degreeLevel())
                .flatMap(existing -> {
                    log.info(
                            "🔄 [StaticWorkflowSeeder] Updating existing workflow: {} (version {})",
                            existing.getDefinitionKey(),
                            existing.getVersion());
                    existing.setDefinitionKey(payload.definitionKey());
                    existing.setDefinitionName(payload.definitionName());
                    existing.setWorkflowConfig(payload.workflowConfig());
                    existing.setIsActive(true);
                    existing.setIsSuspended(false);
                    existing.setDeleted(false);
                    existing.setUpdatedAt(LocalDateTime.now());
                    existing.setUpdatedBy("STATIC_SEEDER");
                    return workflowDefinitionRepository.save(existing);
                })
                .switchIfEmpty(
                        Mono.defer(() -> {
                            log.info(
                                    "➕ [StaticWorkflowSeeder] Creating new workflow: {}",
                                    payload.definitionKey());
                            WorkflowDefinition definition = WorkflowDefinition.builder()
                                    .definitionKey(payload.definitionKey())
                                    .definitionName(payload.definitionName())
                                    .clientId(payload.clientId())
                                    .countryCode(payload.countryCode())
                                    .degreeLevel(payload.degreeLevel())
                                    .workflowConfig(payload.workflowConfig())
                                    .deploymentId(payload.deploymentId())
                                    .version(1)
                                    .isActive(true)
                                    .isSuspended(false)
                                    .deleted(false)
                                    .category("APPLICATION_PROCESSING")
                                    .createdAt(LocalDateTime.now())
                                    .updatedAt(LocalDateTime.now())
                                    .createdBy("STATIC_SEEDER")
                                    .updatedBy("STATIC_SEEDER")
                                    .build();
                            return workflowDefinitionRepository.save(definition);
                        }))
                .doOnSuccess(saved -> log.info(
                        "✅ [StaticWorkflowSeeder] Workflow seeded: {} [client={}, country={}, degree={}]",
                        saved.getDefinitionKey(),
                        saved.getClientId(),
                        saved.getCountryCode(),
                        saved.getDegreeLevel()));
    }

    // Simple record to carry parsed workflow data between reactive steps
    private record WorkflowPayload(
            String clientId,
            String countryCode,
            String degreeLevel,
            String definitionKey,
            String definitionName,
            String deploymentId,
            JsonNode workflowConfig) {
    }
}
