package com.uniflow.client.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import java.io.IOException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;

/**
 * Utility class to validate client workflow configuration YAML parsing
 * This is used to ensure the YAML files are correctly formatted and parseable
 */
@Slf4j
public class ConfigurationValidator {

    private static final ObjectMapper yamlMapper = new ObjectMapper(
        new YAMLFactory()
    );

    /**
     * Validate that the uni360.yml configuration can be parsed correctly
     * @return true if validation passes, false otherwise
     */
    public static boolean validateUni360Configuration() {
        try {
            ClassPathResource resource = new ClassPathResource(
                "config/clients/uni360.yml"
            );

            if (!resource.exists()) {
                log.error(
                    "Configuration file not found: config/clients/uni360.yml"
                );
                return false;
            }

            log.info("Parsing uni360.yml configuration file...");
            JsonNode config = yamlMapper.readTree(resource.getInputStream());

            if (config == null) {
                log.error("Configuration is null after parsing");
                return false;
            }

            // Validate basic structure
            if (
                !config.has("client_id") ||
                config.get("client_id").asText().trim().isEmpty()
            ) {
                log.error("Client ID is missing or empty");
                return false;
            }

            if (
                !config.has("name") ||
                config.get("name").asText().trim().isEmpty()
            ) {
                log.error("Client name is missing or empty");
                return false;
            }

            if (
                !config.has("workflows") ||
                !config.get("workflows").isArray() ||
                config.get("workflows").size() == 0
            ) {
                log.error("Workflows are missing or empty");
                return false;
            }

            String clientId = config.get("client_id").asText();
            String clientName = config.get("name").asText();
            int workflowCount = config.get("workflows").size();

            log.info("✅ Basic structure validation passed");
            log.info("   - Client ID: {}", clientId);
            log.info("   - Client Name: {}", clientName);
            log.info("   - Number of workflows: {}", workflowCount);

            // Validate each workflow
            JsonNode workflows = config.get("workflows");
            for (int i = 0; i < workflows.size(); i++) {
                JsonNode workflow = workflows.get(i);
                if (!validateWorkflow(workflow, i)) {
                    return false;
                }
            }

            log.info("✅ All validations passed successfully!");
            log.info(
                "✅ Configuration is ready for use in the client workflow system"
            );
            return true;
        } catch (IOException e) {
            log.error(
                "Failed to parse configuration file: {}",
                e.getMessage(),
                e
            );
            return false;
        } catch (Exception e) {
            log.error(
                "Unexpected error during validation: {}",
                e.getMessage(),
                e
            );
            return false;
        }
    }

    /**
     * Validate a single workflow configuration
     * @param workflow the workflow to validate
     * @param index the index of the workflow for logging
     * @return true if valid, false otherwise
     */
    private static boolean validateWorkflow(JsonNode workflow, int index) {
        String prefix = String.format("Workflow [%d]", index);

        if (
            !workflow.has("workflowDefinitionKey") ||
            workflow.get("workflowDefinitionKey").asText().trim().isEmpty()
        ) {
            log.error("{} - Definition key is missing", prefix);
            return false;
        }

        if (
            !workflow.has("name") ||
            workflow.get("name").asText().trim().isEmpty()
        ) {
            log.error("{} - Name is missing", prefix);
            return false;
        }

        if (
            !workflow.has("countryCode") ||
            workflow.get("countryCode").asText().trim().isEmpty()
        ) {
            log.error("{} - Country code is missing", prefix);
            return false;
        }

        if (
            !workflow.has("degreeLevel") ||
            workflow.get("degreeLevel").asText().trim().isEmpty()
        ) {
            log.error("{} - Degree level is missing", prefix);
            return false;
        }

        if (
            !workflow.has("stages") ||
            !workflow.get("stages").isArray() ||
            workflow.get("stages").size() == 0
        ) {
            log.error("{} - Stages are missing or empty", prefix);
            return false;
        }

        String definitionKey = workflow.get("workflowDefinitionKey").asText();
        String name = workflow.get("name").asText();
        String countryCode = workflow.get("countryCode").asText();
        String degreeLevel = workflow.get("degreeLevel").asText();
        int stageCount = workflow.get("stages").size();

        log.info("✅ {} validation passed", prefix);
        log.info("   - Definition Key: {}", definitionKey);
        log.info("   - Name: {}", name);
        log.info("   - Country: {}, Degree: {}", countryCode, degreeLevel);
        log.info("   - Number of stages: {}", stageCount);

        // Validate stages
        JsonNode stages = workflow.get("stages");
        for (int j = 0; j < stages.size(); j++) {
            JsonNode stage = stages.get(j);
            if (!validateStage(stage, index, j)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Validate a single stage configuration
     * @param stage the stage to validate
     * @param workflowIndex the workflow index for logging
     * @param stageIndex the stage index for logging
     * @return true if valid, false otherwise
     */
    private static boolean validateStage(
        JsonNode stage,
        int workflowIndex,
        int stageIndex
    ) {
        String prefix = String.format(
            "Workflow [%d] Stage [%d]",
            workflowIndex,
            stageIndex
        );

        if (!stage.has("name") || stage.get("name").asText().trim().isEmpty()) {
            log.error("{} - Name is missing", prefix);
            return false;
        }

        if (
            !stage.has("displayName") ||
            stage.get("displayName").asText().trim().isEmpty()
        ) {
            log.error("{} - Display name is missing", prefix);
            return false;
        }

        if (!stage.has("tasks")) {
            log.error("{} - Tasks list is missing", prefix);
            return false;
        }

        String stageName = stage.get("name").asText();
        int taskCount = stage.get("tasks").isArray()
            ? stage.get("tasks").size()
            : 0;

        log.debug(
            "✅ {} validation passed - Name: {}, Tasks: {}",
            prefix,
            stageName,
            taskCount
        );

        return true;
    }

    /**
     * Main method for standalone validation
     * @param args command line arguments (not used)
     */
    public static void main(String[] args) {
        System.out.println("=== UniFLow Client Configuration Validator ===");
        System.out.println();

        boolean isValid = validateUni360Configuration();

        System.out.println();
        if (isValid) {
            System.out.println(
                "🎉 SUCCESS: Configuration is valid and ready to use!"
            );
            System.exit(0);
        } else {
            System.out.println("❌ FAILURE: Configuration validation failed!");
            System.exit(1);
        }
    }
}
