package com.uniflow.workflow.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.application.entity.Application;
import com.uniflow.application.repository.ApplicationRepository;
import com.uniflow.shared.util.CountryCodeUtils;
import com.uniflow.workflow.entity.WorkflowDefinition;
import com.uniflow.workflow.repository.WorkflowDefinitionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

/**
 * Application Workflow Trigger Service
 *
 * <p>
 * This service handles the integration between application submission and
 * workflow initialization.
 * When an application is submitted, it automatically triggers the appropriate
 * workflow based on
 * the application's characteristics (country, degree level, etc.).
 *
 * <p>
 * Key responsibilities:
 * - Detect application submission events
 * - Determine appropriate workflow definition
 * - Initialize workflow instance
 * - Create initial claimable tasks for eligible admins
 * - Update application status to reflect workflow initiation
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ApplicationWorkflowTrigger {

    private final TaskOrchestrationEngine orchestrationEngine;
    private final WorkflowDefinitionRepository workflowDefinitionRepository;
    private final ApplicationRepository applicationRepository;
    private final ObjectMapper objectMapper;

    /**
     * Handles application submission by initializing the appropriate workflow
     *
     * @param application The submitted application
     * @return Mono containing the workflow instance ID
     */
    @Transactional
    public Mono<String> handleApplicationSubmission(Application application) {
        log.info(
            "Handling application submission for application: {} with client: {}",
            application.getReferenceNumber(),
            application.getClientId()
        );

        return validateApplicationForWorkflow(application)
            .then(determineWorkflowDefinition(application))
            .flatMap(workflowDefinition ->
                orchestrationEngine.initializeWorkflowForApplicationWithDefinition(
                    application.getId().toString(),
                    workflowDefinition.getId(),
                    workflowDefinition.getWorkflowConfig().toString()
                )
            )
            .flatMap(workflowInstanceId ->
                updateApplicationWithWorkflowDetails(
                    application,
                    workflowInstanceId
                ).thenReturn(workflowInstanceId)
            )
            .doOnSuccess(workflowInstanceId ->
                log.info(
                    "Successfully initialized workflow {} for application {}",
                    workflowInstanceId,
                    application.getReferenceNumber()
                )
            )
            .doOnError(error ->
                log.error(
                    "Failed to initialize workflow for application {}: {}",
                    application.getReferenceNumber(),
                    error.getMessage(),
                    error
                )
            );
    }

    /**
     * Validates that the application is ready for workflow initiation
     */
    private Mono<Void> validateApplicationForWorkflow(Application application) {
        if (
            application.getReferenceNumber() == null ||
            application.getReferenceNumber().isEmpty()
        ) {
            return Mono.error(
                new IllegalArgumentException(
                    "Application reference number is required"
                )
            );
        }

        if (application.getStudentId() == null) {
            return Mono.error(
                new IllegalArgumentException("Student ID is required")
            );
        }

        if (application.getUniversityId() == null) {
            return Mono.error(
                new IllegalArgumentException("University ID is required")
            );
        }

        if (application.getCourseId() == null) {
            return Mono.error(
                new IllegalArgumentException("Course ID is required")
            );
        }

        if (!"SUBMITTED".equals(application.getStatus())) {
            return Mono.error(
                new IllegalStateException(
                    "Application must be in SUBMITTED status to initialize workflow. Current status: " +
                        application.getStatus()
                )
            );
        }

        return Mono.empty();
    }

    /**
     * Updates the application with workflow instance details
     */
    private Mono<Application> updateApplicationWithWorkflowDetails(
        Application application,
        String workflowInstanceId
    ) {
        // Update application status and workflow details
        application.setWorkflowStage("CLAIM_PENDING");
        application.setStatus("IN_WORKFLOW");

        // Update application data to include workflow instance ID
        try {
            // If application has existing data, we'd merge it here
            // For now, we'll just ensure the workflow instance ID is tracked
            log.debug(
                "Updated application {} with workflow instance {}",
                application.getReferenceNumber(),
                workflowInstanceId
            );
        } catch (Exception e) {
            log.warn(
                "Failed to update application data with workflow instance: {}",
                e.getMessage()
            );
        }

        return applicationRepository.save(application);
    }

    /**
     * Determines if an application can have workflow initiated
     */
    public Mono<Boolean> canInitiateWorkflow(Application application) {
        return validateApplicationForWorkflow(application)
            .then(checkWorkflowDefinitionExists(application))
            .thenReturn(true)
            .onErrorReturn(false);
    }

    /**
     * Checks if a workflow definition exists for the application type
     */
    private Mono<Void> checkWorkflowDefinitionExists(Application application) {
        return determineWorkflowDefinition(application)
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "No workflow definition found for client: " +
                            application.getClientId() +
                            ", country: " +
                            application.getCountryCode() +
                            ", degree: " +
                            application.getDegreeLevel()
                    )
                )
            )
            .then();
    }

    /**
     * Determines the workflow definition based on client and application
     * characteristics. No fallbacks - returns error if exact match not found.
     */
    private Mono<WorkflowDefinition> determineWorkflowDefinition(
        Application application
    ) {
        String clientId =
            application.getClientId() != null
                ? application.getClientId()
                : "uni360";

        // Extract and validate country code - no defaults
        String countryCode;
        try {
            countryCode = extractCountryCode(application);
        } catch (IllegalArgumentException e) {
            return Mono.error(e);
        }

        // Extract and validate degree level - no defaults
        String degreeLevel;
        try {
            degreeLevel = normalizeDegreeLevel(application.getDegreeLevel());
        } catch (IllegalArgumentException e) {
            return Mono.error(e);
        }

        log.info(
            "🔍 WORKFLOW SELECTION - Application: {}, Client: {}, Country: {}, Degree: {}",
            application.getReferenceNumber(),
            clientId,
            countryCode,
            degreeLevel
        );

        return workflowDefinitionRepository
            .findLatestByClientAndCountryAndDegree(
                clientId,
                countryCode,
                degreeLevel
            )
            .doOnNext(workflow ->
                log.info(
                    "✅ WORKFLOW FOUND - ID: {}, Name: '{}', Version: {}, Active: {}",
                    workflow.getId(),
                    workflow.getDefinitionName(),
                    workflow.getVersion(),
                    workflow.getIsActive()
                )
            )
            .switchIfEmpty(
                Mono.defer(() -> {
                    log.error(
                        "❌ NO WORKFLOW FOUND - No workflow definition exists for [client={}, country={}, degree={}] for application {}",
                        clientId,
                        countryCode,
                        degreeLevel,
                        application.getReferenceNumber()
                    );
                    return Mono.error(
                        new RuntimeException(
                            "No workflow definition found for client='" +
                                clientId +
                                "', country='" +
                                countryCode +
                                "', degree='" +
                                degreeLevel +
                                "'. Please configure a workflow for this combination."
                        )
                    );
                })
            );
    }

    /**
     * Normalize degree level to match workflow definition format in database.
     * Throws exception if degree level is null or not recognized.
     */
    private String normalizeDegreeLevel(String degreeLevel) {
        String normalized = CountryCodeUtils.validateDegreeLevel(degreeLevel);
        log.debug(
            "Normalized degree level: '{}' -> '{}'",
            degreeLevel,
            normalized
        );
        return normalized;
    }

    /**
     * Normalizes a country name or code to the ISO 2-letter code.
     * Throws exception if country code is null or not recognized.
     */
    private String normalizeCountryCode(String raw) {
        return CountryCodeUtils.validateCountryCode(raw);
    }

    /**
     * Extracts country code from application. No defaults - throws if not found.
     * Normalizes full country names (e.g. "GERMANY") to ISO codes (e.g. "DE")
     * so they match the countryCode stored in workflow_definitions.
     *
     * @throws IllegalArgumentException if no valid country code found in application
     */
    private String extractCountryCode(Application application) {
        // First try direct country code from application (metadata.country_code)
        if (
            application.getCountryCode() != null &&
            !application.getCountryCode().trim().isEmpty()
        ) {
            String raw = application.getCountryCode().toUpperCase();
            String countryCode = normalizeCountryCode(raw);
            if (!raw.equals(countryCode)) {
                log.info(
                    "Normalized country '{}' -> '{}' for workflow lookup",
                    raw,
                    countryCode
                );
            }
            log.debug(
                "Extracted country code '{}' from application metadata",
                countryCode
            );
            return countryCode;
        }

        // Try to extract from application data
        if (application.getData() != null) {
            try {
                JsonNode data = objectMapper.readTree(
                    application.getData().asString()
                );
                if (
                    data.has("university") &&
                    data.get("university").has("country")
                ) {
                    String universityCountry = data
                        .get("university")
                        .get("country")
                        .asText(null);
                    if (
                        universityCountry != null &&
                        !universityCountry.isBlank()
                    ) {
                        String normalized = normalizeCountryCode(
                            universityCountry.toUpperCase()
                        );
                        log.debug(
                            "Extracted country code '{}' from application data (university)",
                            normalized
                        );
                        return normalized;
                    }
                }
                if (
                    data.has("academic") && data.get("academic").has("country")
                ) {
                    String academicCountry = data
                        .get("academic")
                        .get("country")
                        .asText(null);
                    if (academicCountry != null && !academicCountry.isBlank()) {
                        String normalized = normalizeCountryCode(
                            academicCountry.toUpperCase()
                        );
                        log.debug(
                            "Extracted country code '{}' from application data (academic)",
                            normalized
                        );
                        return normalized;
                    }
                }
            } catch (Exception e) {
                log.warn(
                    "Failed to parse application data for country extraction: {}",
                    e.getMessage()
                );
            }
        }

        // No country code found - throw error instead of using default
        log.error(
            "❌ No country code found in application {}. Country code is required in metadata.country_code or application data.",
            application.getReferenceNumber()
        );
        throw new IllegalArgumentException(
            "Country code is required but not found in application '" +
                application.getReferenceNumber() +
                "'. Please ensure the application has a valid country_code in metadata or application data."
        );
    }

    /**
     * Handles workflow initiation failure and updates application accordingly
     */
    public Mono<Void> handleWorkflowInitializationFailure(
        Application application,
        Throwable error
    ) {
        log.error(
            "Workflow initialization failed for application {}: {}",
            application.getReferenceNumber(),
            error.getMessage()
        );

        // Update application status to indicate workflow failure
        application.setStatus("WORKFLOW_FAILED");
        application.setWorkflowStage("ERROR");

        return applicationRepository
            .save(application)
            .doOnSuccess(savedApp ->
                log.info(
                    "Updated application {} status to WORKFLOW_FAILED",
                    savedApp.getReferenceNumber()
                )
            )
            .then();
    }

    /**
     * Retries workflow initialization for a failed application
     */
    public Mono<String> retryWorkflowInitialization(String applicationId) {
        return applicationRepository
            .findByReferenceNumber(applicationId)
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Application not found: " + applicationId
                    )
                )
            )
            .filter(app -> "WORKFLOW_FAILED".equals(app.getStatus()))
            .switchIfEmpty(
                Mono.error(
                    new IllegalStateException(
                        "Application is not in WORKFLOW_FAILED status and cannot be retried"
                    )
                )
            )
            .flatMap(application -> {
                // Reset application status for retry
                application.setStatus("SUBMITTED");
                application.setWorkflowStage(null);

                return applicationRepository
                    .save(application)
                    .then(handleApplicationSubmission(application));
            });
    }

    /**
     * Gets workflow status for an application
     */
    public Mono<String> getWorkflowStatus(String applicationId) {
        return applicationRepository
            .findByReferenceNumber(applicationId)
            .map(Application::getWorkflowStage)
            .defaultIfEmpty("NO_WORKFLOW");
    }
}
