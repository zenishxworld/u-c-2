package com.uniflow.student.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.uniflow.common.enums.VerificationStatus;
import com.uniflow.student.dto.ProfileBuilderDto;
import com.uniflow.student.entity.StudentProfile;
import com.uniflow.student.repository.StudentProfileRepository;
import java.time.LocalDate;
import java.time.Period;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * ProfileBuilderService - Core service for step-by-step profile creation
 *
 * <p>
 * This service handles the complex workflow of building student profiles
 * through a multi-step
 * process with validation, progress tracking, and dynamic form generation based
 * on client
 * configuration.
 *
 * <p>
 * Based on Django profile_builder_service.py from services/students/
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileBuilderService {

    private final StudentProfileRepository studentProfileRepository;
    private final ObjectMapper objectMapper;
    private final ProfileBuilderConfigService configService;

    // Profile builder step definitions (fallback when dynamic config is not
    // available)
    private static final Map<String, ProfileBuilderDto.StepDefinition> STEP_DEFINITIONS = createStepDefinitions();

    private static final List<String> STEP_ORDER = Arrays.asList(
            "basic_info",
            "education",
            "test_scores",
            "preferences",
            "experience",
            "financial",
            "documents",
            "goals",
            "compliance");

    /**
     * Get complete profile builder overview
     */
    public Mono<ProfileBuilderDto.ProfileBuilderOverviewResponse> getProfileBuilderOverview(Long userId,
            String clientId) {
        log.debug(
                "Getting profile builder overview for user: {}, client: {}",
                userId,
                clientId);

        return getStepOrderDynamic(clientId)
                .flatMap(stepOrder -> configService
                        .getStepDefinitions(clientId != null ? clientId : "uni360")
                        .flatMap(stepDefinitions -> studentProfileRepository
                                .findActiveByUserId(userId)
                                .switchIfEmpty(createNewProfile(userId))
                                .map(profile -> {
                                    var overview = buildOverviewData(
                                            profile,
                                            stepOrder);
                                    var stepsStatus = buildStepsStatus(
                                            profile,
                                            clientId,
                                            stepOrder,
                                            stepDefinitions);
                                    var progress = buildProgressData(
                                            profile,
                                            stepOrder);

                                    return ProfileBuilderDto.ProfileBuilderOverviewResponse.builder()
                                            .success(true)
                                            .message(
                                                    "Profile builder overview retrieved successfully")
                                            .overview(overview)
                                            .stepsStatus(stepsStatus)
                                            .progress(progress)
                                            .build();
                                })))
                .doOnSuccess(response -> log.debug(
                        "Profile builder overview created for user: {}",
                        userId))
                .onErrorResume(error -> {
                    log.error(
                            "Failed to get profile builder overview for user: {}",
                            userId,
                            error);
                    return Mono.just(
                            ProfileBuilderDto.ProfileBuilderOverviewResponse.builder()
                                    .success(false)
                                    .message(
                                            "Failed to retrieve profile builder overview: " +
                                                    error.getMessage())
                                    .build());
                });
    }

    /**
     * Get current step details (what's next in the form builder)
     */
    public Mono<ProfileBuilderDto.CurrentStepResponse> getCurrentStep(
            Long userId,
            String clientId) {
        log.debug(
                "Getting current step for user: {}, client: {}",
                userId,
                clientId);

        String effectiveClientId = clientId != null ? clientId : "uni360";

        return getStepOrderDynamic(effectiveClientId)
                .flatMap(stepOrder -> configService
                        .getStepDefinitions(effectiveClientId)
                        .flatMap(stepDefinitions -> studentProfileRepository
                                .findActiveByUserId(userId)
                                .switchIfEmpty(createNewProfile(userId))
                                .map(profile -> {
                                    String currentStepId = determineCurrentStep(
                                            profile,
                                            stepOrder);

                                    if (currentStepId == null) {
                                        // Profile is complete
                                        // Calculate dynamic completion percentage
                                        Map<String, Object> storedProfileData = extractAllProfileData(profile);
                                        int dynamicCompletion = calculateDynamicCompletionPercentage(
                                                storedProfileData,
                                                stepOrder);

                                        return ProfileBuilderDto.CurrentStepResponse.builder()
                                                .success(true)
                                                .message("Profile building completed!")
                                                .completed(true)
                                                .completionPercentage(dynamicCompletion)
                                                .progress(
                                                        buildProgressData(
                                                                profile,
                                                                stepOrder))
                                                .build();
                                    }

                                    var formData = buildFormDataDynamic(
                                            currentStepId,
                                            profile,
                                            stepDefinitions);
                                    var progress = buildProgressData(
                                            profile,
                                            stepOrder);
                                    var metadata = buildStepMetadataDynamic(
                                            currentStepId,
                                            stepDefinitions);

                                    // Calculate dynamic completion percentage
                                    Map<String, Object> storedProfileData = extractAllProfileData(profile);
                                    int dynamicCompletion = calculateDynamicCompletionPercentage(
                                            storedProfileData,
                                            stepOrder);

                                    return ProfileBuilderDto.CurrentStepResponse.builder()
                                            .success(true)
                                            .message(
                                                    "Current step retrieved successfully")
                                            .completed(false)
                                            .completionPercentage(dynamicCompletion)
                                            .formData(formData)
                                            .progress(progress)
                                            .metadata(metadata)
                                            .build();
                                })))
                .doOnSuccess(response -> log.debug("Current step retrieved for user: {}", userId))
                .onErrorResume(error -> {
                    log.error(
                            "Failed to get current step for user: {}",
                            userId,
                            error);
                    return Mono.just(
                            ProfileBuilderDto.CurrentStepResponse.builder()
                                    .success(false)
                                    .message(
                                            "Failed to retrieve current step: " +
                                                    error.getMessage())
                                    .build());
                });
    }

    /**
     * Submit step data and get next step
     */
    public Mono<ProfileBuilderDto.StepSubmissionResponse> submitStepAndGetNext(
            Long userId,
            ProfileBuilderDto.StepSubmissionRequest request) {
        log.debug(
                "Submitting step '{}' for user: {}",
                request.getStepId(),
                userId);

        String clientId = request.getClientId() != null ? request.getClientId() : "uni360";

        return getStepOrderDynamic(clientId)
                .flatMap(stepOrder -> configService
                        .getStepDefinitions(clientId)
                        .flatMap(stepDefinitions -> studentProfileRepository
                                .findActiveByUserId(userId)
                                .switchIfEmpty(createNewProfile(userId))
                                .flatMap(profile -> {
                                    // Validate step data dynamically
                                    var validationResult = validateStepDataDynamic(
                                            request.getStepId(),
                                            request.getData(),
                                            stepDefinitions);
                                    if (!validationResult.isValid()) {
                                        return Mono.just(
                                                ProfileBuilderDto.StepSubmissionResponse.builder()
                                                        .success(false)
                                                        .message("Validation failed")
                                                        .validationErrors(
                                                                validationResult.getValidationErrors())
                                                        .build());
                                    }

                                    // Update profile with step data
                                    updateProfileWithStepData(
                                            profile,
                                            request.getStepId(),
                                            request.getData());

                                    // Mark step as completed using dynamic step order
                                    markStepAsCompletedDynamic(
                                            profile,
                                            request.getStepId(),
                                            stepOrder);

                                    // Update completion percentage and status
                                    profile.updateProfileStatus();

                                    // Determine next step using dynamic step order
                                    String nextStepId = determineNextStepDynamic(
                                            profile,
                                            request.getStepId(),
                                            stepOrder);

                                    return studentProfileRepository
                                            .save(profile)
                                            .map(savedProfile -> {
                                                var response = ProfileBuilderDto.StepSubmissionResponse.builder()
                                                        .success(true)
                                                        .message(
                                                                "Step submitted successfully")
                                                        .stepCompleted(true)
                                                        .completionPercentage(
                                                                savedProfile.getCompletionPercentage())
                                                        .hasNext(nextStepId != null)
                                                        .progress(
                                                                buildProgressData(
                                                                        savedProfile,
                                                                        stepOrder));

                                                if (nextStepId != null) {
                                                    var nextFormData = buildFormDataDynamic(
                                                            nextStepId,
                                                            savedProfile,
                                                            stepDefinitions);
                                                    response.nextStep(nextFormData);
                                                }

                                                return response.build();
                                            });
                                })))
                .doOnSuccess(response -> log.debug(
                        "Step '{}' submitted for user: {}",
                        request.getStepId(),
                        userId))
                .onErrorResume(error -> {
                    log.error(
                            "Failed to submit step '{}' for user: {}",
                            request.getStepId(),
                            userId,
                            error);
                    return Mono.just(
                            ProfileBuilderDto.StepSubmissionResponse.builder()
                                    .success(false)
                                    .message("Failed to submit step: " + error.getMessage())
                                    .build());
                });
    }

    /**
     * Validate step data without saving
     */
    public Mono<ProfileBuilderDto.ValidationResponse> validateStep(
            Long userId,
            ProfileBuilderDto.ValidationRequest request) {
        log.debug(
                "Validating step '{}' for user: {}",
                request.getStepId(),
                userId);

        return Mono.fromCallable(() -> {
            var validationResult = validateStepData(
                    request.getStepId(),
                    request.getData());

            return ProfileBuilderDto.ValidationResponse.builder()
                    .success(true)
                    .message("Validation completed")
                    .valid(validationResult.isValid())
                    .validationErrors(validationResult.getValidationErrors())
                    .warnings(validationResult.getWarnings())
                    .suggestions(validationResult.getSuggestions())
                    .build();
        })
                .doOnSuccess(response -> log.debug(
                        "Validation completed for step '{}', user: {}",
                        request.getStepId(),
                        userId))
                .onErrorResume(error -> {
                    log.error(
                            "Failed to validate step '{}' for user: {}",
                            request.getStepId(),
                            userId,
                            error);
                    return Mono.just(
                            ProfileBuilderDto.ValidationResponse.builder()
                                    .success(false)
                                    .message("Validation failed: " + error.getMessage())
                                    .valid(false)
                                    .build());
                });
    }

    /**
     * Validate and save specific step - advances to next step automatically
     */
    public Mono<ProfileBuilderDto.ValidationResponse> validateAndSaveStep(
            Long userId,
            ProfileBuilderDto.ValidationRequest request) {
        log.debug(
                "Validating and saving step '{}' for user: {}",
                request.getStepId(),
                userId);

        String clientId = "uni360"; // TODO: Get from request context

        return getStepOrderDynamic(clientId)
                .flatMap(stepOrder -> configService
                        .getStepDefinitions(clientId)
                        .flatMap(stepDefinitions -> studentProfileRepository
                                .findActiveByUserId(userId)
                                .switchIfEmpty(createNewProfile(userId))
                                .flatMap(profile -> {
                                    // Validate step data dynamically
                                    var validationResult = validateStepDataDynamic(
                                            request.getStepId(),
                                            request.getData(),
                                            stepDefinitions);

                                    if (!validationResult.isValid()) {
                                        // Get step definition to build request template
                                        JsonNode stepDef = stepDefinitions.get(
                                                request.getStepId());
                                        List<ProfileBuilderDto.FormField> fields = new ArrayList<>();
                                        if (stepDef != null && stepDef.has("fields")) {
                                            stepDef
                                                    .get("fields")
                                                    .forEach(fieldNode -> fields.add(
                                                            parseFormField(fieldNode)));
                                        }
                                        Map<String, Object> requestBodyTemplate = createRequestBodyTemplate(fields);

                                        return Mono.just(
                                                ProfileBuilderDto.ValidationResponse.builder()
                                                        .success(false)
                                                        .message("Validation failed")
                                                        .valid(false)
                                                        .validationErrors(
                                                                validationResult.getValidationErrors())
                                                        .warnings(
                                                                validationResult.getWarnings())
                                                        .suggestions(
                                                                validationResult.getSuggestions())
                                                        .requestBodyTemplate(
                                                                requestBodyTemplate)
                                                        .build());
                                    }

                                    // Save step data and advance to next step using dynamic step order
                                    return saveStepDataAndAdvanceDynamic(
                                            profile,
                                            request.getStepId(),
                                            request.getData(),
                                            stepOrder).map(
                                                    updatedProfile -> createAdvancementResponseDynamic(
                                                            updatedProfile,
                                                            request.getStepId(),
                                                            stepDefinitions,
                                                            stepOrder));
                                })))
                .doOnSuccess(response -> log.debug(
                        "Step '{}' validated and saved for user: {}",
                        request.getStepId(),
                        userId))
                .onErrorResume(error -> {
                    log.error(
                            "Failed to validate and save step '{}' for user: {}",
                            request.getStepId(),
                            userId,
                            error);
                    return Mono.just(
                            ProfileBuilderDto.ValidationResponse.builder()
                                    .success(false)
                                    .message(
                                            "Failed to validate and save step: " +
                                                    error.getMessage())
                                    .valid(false)
                                    .build());
                });
    }

    /**
     * Validate entire profile - validates stored profile data from database
     */
    public Mono<ProfileBuilderDto.ValidationResponse> validateEntireProfile(
            Long userId,
            Map<String, Object> unused) {
        log.debug("Validating entire profile for user: {}", userId);

        return studentProfileRepository
                .findActiveByUserId(userId)
                .switchIfEmpty(createNewProfile(userId))
                .flatMap(profile -> {
                    Map<String, String> allValidationErrors = new HashMap<>();
                    List<String> allWarnings = new ArrayList<>();
                    List<String> allSuggestions = new ArrayList<>();

                    // Extract profile data from database
                    Map<String, Object> storedProfileData = extractAllProfileData(
                            profile);

                    // Validate ALL defined steps, not just ones with existing data
                    for (String stepId : STEP_ORDER) {
                        // Get existing data for this step (empty map if no data)
                        Map<String, Object> stepDataMap = new HashMap<>();

                        if (storedProfileData.containsKey(stepId) &&
                                storedProfileData.get(stepId) instanceof Map) {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> existingStepData = (Map<String, Object>) storedProfileData.get(stepId);
                            stepDataMap.putAll(existingStepData);
                        }

                        var validationResult = validateStepData(
                                stepId,
                                stepDataMap);

                        // Collect all validation errors with step prefix
                        validationResult
                                .getValidationErrors()
                                .forEach((field, error) -> allValidationErrors.put(stepId + "." + field, error));

                        allWarnings.addAll(validationResult.getWarnings());
                        allSuggestions.addAll(validationResult.getSuggestions());
                    }

                    // Return validation results (don't save anything - just validate)
                    if (allValidationErrors.isEmpty()) {
                        // Calculate dynamic completion percentage based on actual validation
                        int dynamicCompletion = calculateDynamicCompletionPercentage(storedProfileData);

                        return Mono.just(
                                ProfileBuilderDto.ValidationResponse.builder()
                                        .success(true)
                                        .message(
                                                "Profile validation completed successfully")
                                        .valid(true)
                                        .stepCompleted(false)
                                        .completionPercentage(dynamicCompletion)
                                        .hasNext(false)
                                        .validationErrors(new HashMap<>())
                                        .warnings(allWarnings)
                                        .suggestions(allSuggestions)
                                        .build());
                    } else {
                        return Mono.just(
                                ProfileBuilderDto.ValidationResponse.builder()
                                        .success(false)
                                        .message("Profile validation failed")
                                        .valid(false)
                                        .validationErrors(allValidationErrors)
                                        .warnings(allWarnings)
                                        .suggestions(allSuggestions)
                                        .build());
                    }
                })
                .doOnSuccess(response -> log.debug("Profile validation completed for user: {}", userId))
                .onErrorResume(error -> {
                    log.error(
                            "Failed to validate entire profile for user: {}",
                            userId,
                            error);
                    return Mono.just(
                            ProfileBuilderDto.ValidationResponse.builder()
                                    .success(false)
                                    .message(
                                            "Failed to validate profile: " + error.getMessage())
                                    .valid(false)
                                    .build());
                });
    }

    /**
     * Get specific step details
     */
    public Mono<ProfileBuilderDto.StepDetailsResponse> getStepDetails(
            Long userId,
            String stepId,
            String clientId) {
        log.debug(
                "Getting details for step '{}', user: {}, client: {}",
                stepId,
                userId,
                clientId);

        String effectiveClientId = clientId != null ? clientId : "uni360";

        return configService
                .getStepDefinitions(effectiveClientId)
                .flatMap(stepDefinitions -> studentProfileRepository
                        .findActiveByUserId(userId)
                        .switchIfEmpty(createNewProfile(userId))
                        .map(profile -> {
                            var formData = buildFormDataDynamic(
                                    stepId,
                                    profile,
                                    stepDefinitions);
                            var existingData = extractStepData(profile, stepId);
                            var metadata = buildStepMetadataDynamic(
                                    stepId,
                                    stepDefinitions);
                            boolean canEdit = canEditStep(profile, stepId);

                            return ProfileBuilderDto.StepDetailsResponse.builder()
                                    .success(true)
                                    .message("Step details retrieved successfully")
                                    .formData(formData)
                                    .existingData(existingData)
                                    .metadata(metadata)
                                    .canEdit(canEdit)
                                    .lastModified(profile.getUpdatedAt().toString())
                                    .build();
                        }))
                .doOnSuccess(response -> log.debug(
                        "Step details retrieved for step '{}', user: {}",
                        stepId,
                        userId))
                .onErrorResume(error -> {
                    log.error(
                            "Failed to get step details for step '{}', user: {}",
                            stepId,
                            userId,
                            error);
                    return Mono.just(
                            ProfileBuilderDto.StepDetailsResponse.builder()
                                    .success(false)
                                    .message(
                                            "Failed to retrieve step details: " +
                                                    error.getMessage())
                                    .build());
                });
    }

    /**
     * Get complete profile summary
     */
    public Mono<ProfileBuilderDto.ProfileSummaryResponse> getProfileSummary(
            Long userId) {
        log.debug("Getting profile summary for user: {}", userId);

        return studentProfileRepository
                .findActiveByUserId(userId)
                .switchIfEmpty(createNewProfile(userId))
                .flatMap(profile -> getStepOrderDynamic(null).flatMap(stepOrder -> configService
                        .getStepDefinitions("uni360")
                        .map(stepDefinitions -> {
                            var summary = buildProfileSummaryDynamic(
                                    profile,
                                    stepOrder,
                                    stepDefinitions);
                            var stepsStatus = buildStepsStatus(
                                    profile,
                                    null,
                                    stepOrder,
                                    stepDefinitions);
                            var profileData = extractAllProfileData(profile);

                            return ProfileBuilderDto.ProfileSummaryResponse.builder()
                                    .success(true)
                                    .message(
                                            "Profile summary retrieved successfully")
                                    .summary(summary)
                                    .stepsStatus(stepsStatus)
                                    .profileData(profileData)
                                    .build();
                        })))
                .doOnSuccess(response -> log.debug("Profile summary retrieved for user: {}", userId))
                .onErrorResume(error -> {
                    log.error(
                            "Failed to get profile summary for user: {}",
                            userId,
                            error);
                    return Mono.just(
                            ProfileBuilderDto.ProfileSummaryResponse.builder()
                                    .success(false)
                                    .message(
                                            "Failed to retrieve profile summary: " +
                                                    error.getMessage())
                                    .build());
                });
    }

    /**
     * Get student dashboard data
     */
    public Mono<ProfileBuilderDto.StudentDashboardResponse> getStudentDashboard(
            Long userId) {
        log.debug("Getting student dashboard for user: {}", userId);

        String clientId = "uni360"; // Default client

        return getStepOrderDynamic(clientId)
                .flatMap(stepOrder -> configService
                        .getStepDefinitions(clientId)
                        .flatMap(stepDefinitions -> studentProfileRepository
                                .findActiveByUserId(userId)
                                .switchIfEmpty(createNewProfile(userId))
                                .map(profile -> {
                                    var dashboard = buildDashboardDataDynamic(
                                            profile,
                                            stepOrder);
                                    var profileSummary = buildProfileSummaryDynamic(
                                            profile,
                                            stepOrder,
                                            stepDefinitions);
                                    var recentActivities = buildRecentActivities(
                                            profile);
                                    var recommendations = buildRecommendations(
                                            profile);

                                    return ProfileBuilderDto.StudentDashboardResponse.builder()
                                            .success(true)
                                            .message(
                                                    "Student dashboard retrieved successfully")
                                            .dashboard(dashboard)
                                            .profile(profileSummary)
                                            .recentActivities(recentActivities)
                                            .recommendations(recommendations)
                                            .build();
                                })))
                .doOnSuccess(response -> log.debug("Student dashboard retrieved for user: {}", userId))
                .onErrorResume(error -> {
                    log.error(
                            "Failed to get student dashboard for user: {}",
                            userId,
                            error);
                    return Mono.just(
                            ProfileBuilderDto.StudentDashboardResponse.builder()
                                    .success(false)
                                    .message(
                                            "Failed to retrieve student dashboard: " +
                                                    error.getMessage())
                                    .build());
                });
    }

    // Private helper methods

    private Mono<StudentProfile> createNewProfile(Long userId) {
        log.debug("Creating new profile for user: {}", userId);

        var newProfile = StudentProfile.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .profileData(objectMapper.createObjectNode())
                .profileStatus(VerificationStatus.DRAFT)
                .completionPercentage(0)
                .profileStepsCompleted(objectMapper.createArrayNode())
                .currentStep("basic_info")
                .isVerified(false)
                .workflowStage("profile_building")
                .deleted(false)
                .build();

        return studentProfileRepository.save(newProfile);
    }

    private ProfileBuilderDto.OverviewData buildOverviewData(
            StudentProfile profile,
            List<String> stepOrder) {
        int completedSteps = getCompletedStepsCount(profile);
        int totalSteps = stepOrder.size();
        long estimatedTime = calculateEstimatedTime(profile);

        // Calculate dynamic completion percentage
        Map<String, Object> storedProfileData = extractAllProfileData(profile);
        int dynamicCompletion = calculateDynamicCompletionPercentage(
                storedProfileData,
                stepOrder);

        return ProfileBuilderDto.OverviewData.builder()
                .completionPercentage(dynamicCompletion)
                .totalSteps(totalSteps)
                .completedSteps(completedSteps)
                .workflowStage(profile.getWorkflowStage())
                .currentStep(profile.getCurrentStep())
                .isComplete(profile.isProfileComplete())
                .profileStatus(profile.getProfileStatus().getCode())
                .estimatedTimeMinutes(estimatedTime)
                .build();
    }

    private List<ProfileBuilderDto.StepStatus> buildStepsStatus(
            StudentProfile profile,
            String clientId,
            List<String> stepOrder,
            Map<String, JsonNode> stepDefinitions) {
        List<String> completedSteps = getCompletedStepsList(profile);

        return stepOrder
                .stream()
                .map(stepId -> {
                    JsonNode stepConfig = stepDefinitions.get(stepId);

                    String title = stepId;
                    boolean required = true;
                    int estimatedTime = 10;

                    if (stepConfig != null) {
                        title = stepConfig.has("title")
                                ? stepConfig.get("title").asText()
                                : stepId;
                        required = stepConfig.has("required")
                                ? stepConfig.get("required").asBoolean()
                                : true;
                        estimatedTime = stepConfig.has("estimated_time_minutes")
                                ? stepConfig.get("estimated_time_minutes").asInt()
                                : 10;
                    }

                    return ProfileBuilderDto.StepStatus.builder()
                            .stepId(stepId)
                            .title(title)
                            .completed(completedSteps.contains(stepId))
                            .required(required)
                            .estimatedTimeMinutes(estimatedTime)
                            .order(stepOrder.indexOf(stepId) + 1)
                            .dependencies(new ArrayList<>())
                            .build();
                })
                .collect(Collectors.toList());
    }

    private ProfileBuilderDto.ProgressData buildProgressData(
            StudentProfile profile,
            List<String> stepOrder) {
        List<String> completedSteps = getCompletedStepsList(profile);
        int completedCount = completedSteps.size();
        int totalCount = stepOrder.size();

        List<String> remainingSteps = stepOrder
                .stream()
                .filter(step -> !completedSteps.contains(step))
                .collect(Collectors.toList());

        // Determine current step (first remaining step)
        String currentStep = remainingSteps.isEmpty()
                ? null
                : remainingSteps.get(0);

        return ProfileBuilderDto.ProgressData.builder()
                .current(completedCount)
                .total(totalCount)
                .percentage(
                        totalCount > 0 ? ((completedCount * 100) / totalCount) : 0)
                .stage(profile.getWorkflowStage())
                .currentStep(currentStep)
                .completedSteps(completedSteps)
                .remainingSteps(remainingSteps)
                .build();
    }

    private ProfileBuilderDto.DashboardData buildDashboardData(
            StudentProfile profile) {
        // Calculate dynamic completion percentage
        Map<String, Object> storedProfileData = extractAllProfileData(profile);
        int dynamicCompletion = calculateDynamicCompletionPercentage(
                storedProfileData);

        var quickActions = Arrays.asList(
                ProfileBuilderDto.QuickAction.builder()
                        .id("continue_profile")
                        .title("Continue Profile")
                        .description("Complete your profile to unlock more features")
                        .action("profile_builder")
                        .icon("user-edit")
                        .enabled(dynamicCompletion < 100)
                        .build(),
                ProfileBuilderDto.QuickAction.builder()
                        .id("browse_universities")
                        .title("Browse Universities")
                        .description("Explore universities that match your profile")
                        .action("university_search")
                        .icon("graduation-cap")
                        .enabled(dynamicCompletion >= 50)
                        .build());

        return ProfileBuilderDto.DashboardData.builder()
                .profileCompletionPercentage(dynamicCompletion)
                .totalApplications(0) // Would be populated from applications service
                .pendingTasks(calculatePendingTasks(profile))
                .unreadNotifications(0) // Would be populated from notifications service
                .nextAction(determineNextAction(profile))
                .quickActions(quickActions)
                .analytics(
                        Map.of(
                                "profile_score",
                                profile.getProfileScore() != null
                                        ? profile.getProfileScore()
                                        : 0.0))
                .build();
    }

    /**
     * Build dashboard data using dynamic step order from config
     */
    private ProfileBuilderDto.DashboardData buildDashboardDataDynamic(
            StudentProfile profile,
            List<String> stepOrder) {
        // Calculate dynamic completion percentage
        Map<String, Object> storedProfileData = extractAllProfileData(profile);
        int dynamicCompletion = calculateDynamicCompletionPercentage(
                storedProfileData,
                stepOrder);

        List<ProfileBuilderDto.QuickAction> quickActions = Arrays.asList(
                ProfileBuilderDto.QuickAction.builder()
                        .id("complete_profile")
                        .title("Complete Profile")
                        .description("Complete your profile to unlock more features")
                        .action("profile_builder")
                        .icon("user-edit")
                        .enabled(dynamicCompletion < 100)
                        .build(),
                ProfileBuilderDto.QuickAction.builder()
                        .id("browse_universities")
                        .title("Browse Universities")
                        .description("Explore universities that match your profile")
                        .action("university_search")
                        .icon("graduation-cap")
                        .enabled(dynamicCompletion >= 50)
                        .build());

        return ProfileBuilderDto.DashboardData.builder()
                .profileCompletionPercentage(dynamicCompletion)
                .totalApplications(0) // Would be populated from applications service
                .pendingTasks(calculatePendingTasksDynamic(profile, stepOrder))
                .unreadNotifications(0) // Would be populated from notifications service
                .nextAction(determineNextAction(profile))
                .quickActions(quickActions)
                .analytics(
                        Map.of(
                                "profile_score",
                                profile.getProfileScore() != null
                                        ? profile.getProfileScore()
                                        : 0.0))
                .build();
    }

    private ProfileBuilderDto.ProfileSummary buildProfileSummary(
            StudentProfile profile) {
        List<String> missingFields = calculateMissingFields(profile);
        List<String> recommendations = generateRecommendations(profile);

        // Calculate dynamic completion percentage
        Map<String, Object> storedProfileData = extractAllProfileData(profile);
        int dynamicCompletion = calculateDynamicCompletionPercentage(
                storedProfileData);

        return ProfileBuilderDto.ProfileSummary.builder()
                .completionPercentage(dynamicCompletion)
                .isComplete(dynamicCompletion >= 80)
                .workflowStage(profile.getWorkflowStage())
                .completedSteps(getCompletedStepsCount(profile))
                .totalSteps(STEP_DEFINITIONS.size())
                .missingFields(missingFields)
                .recommendations(recommendations)
                .profileScore(
                        profile.getProfileScore() != null
                                ? profile.getProfileScore()
                                : 0.0)
                .profileStatus(profile.getProfileStatus().getCode())
                .canSubmitApplications(dynamicCompletion >= 80)
                .build();
    }

    /**
     * Build profile summary using dynamic config from DB
     */
    private ProfileBuilderDto.ProfileSummary buildProfileSummaryDynamic(
            StudentProfile profile,
            List<String> stepOrder,
            Map<String, JsonNode> stepDefinitions) {
        List<String> missingFields = calculateMissingFieldsDynamic(
                profile,
                stepOrder,
                stepDefinitions);
        List<String> recommendations = generateRecommendations(profile);

        // Calculate dynamic completion percentage
        Map<String, Object> storedProfileData = extractAllProfileData(profile);
        int dynamicCompletion = calculateDynamicCompletionPercentage(
                storedProfileData,
                stepOrder);

        return ProfileBuilderDto.ProfileSummary.builder()
                .completionPercentage(dynamicCompletion)
                .isComplete(dynamicCompletion >= 80)
                .workflowStage(profile.getWorkflowStage())
                .completedSteps(getCompletedStepsCount(profile))
                .totalSteps(stepOrder.size())
                .missingFields(missingFields)
                .recommendations(recommendations)
                .profileScore(
                        profile.getProfileScore() != null
                                ? profile.getProfileScore()
                                : 0.0)
                .profileStatus(profile.getProfileStatus().getCode())
                .canSubmitApplications(dynamicCompletion >= 80)
                .build();
    }

    private List<ProfileBuilderDto.RecentActivity> buildRecentActivities(
            StudentProfile profile) {
        // This would normally come from an activity log
        List<ProfileBuilderDto.RecentActivity> activities = new ArrayList<>();

        if (profile.getUpdatedAt() != null) {
            activities.add(
                    ProfileBuilderDto.RecentActivity.builder()
                            .id(UUID.randomUUID().toString())
                            .type("profile_update")
                            .title("Profile Updated")
                            .description("Your profile was last updated")
                            .timestamp(profile.getUpdatedAt().toString())
                            .status("completed")
                            .build());
        }

        return activities;
    }

    private List<ProfileBuilderDto.Recommendation> buildRecommendations(
            StudentProfile profile) {
        List<ProfileBuilderDto.Recommendation> recommendations = new ArrayList<>();

        // Calculate dynamic completion percentage
        Map<String, Object> storedProfileData = extractAllProfileData(profile);
        int dynamicCompletion = calculateDynamicCompletionPercentage(
                storedProfileData);

        if (dynamicCompletion < 80) {
            recommendations.add(
                    ProfileBuilderDto.Recommendation.builder()
                            .id("complete_profile")
                            .type("profile")
                            .title("Complete Your Profile")
                            .description("Complete your profile to unlock all features")
                            .action("continue_profile_builder")
                            .priority("high")
                            .build());
        }

        return recommendations;
    }

    private String determineCurrentStep(
            StudentProfile profile,
            List<String> stepOrder) {
        List<String> completedSteps = getCompletedStepsList(profile);

        return stepOrder
                .stream()
                .filter(step -> !completedSteps.contains(step))
                .findFirst()
                .orElse(null); // All steps completed
    }

    private String determineNextStep(
            StudentProfile profile,
            String currentStepId) {
        int currentIndex = STEP_ORDER.indexOf(currentStepId);
        if (currentIndex >= 0 && currentIndex < STEP_ORDER.size() - 1) {
            return STEP_ORDER.get(currentIndex + 1);
        }
        return null;
    }

    /**
     * Determine next step using dynamic step order from config
     */
    private String determineNextStepDynamic(
            StudentProfile profile,
            String currentStepId,
            List<String> stepOrder) {
        int currentIndex = stepOrder.indexOf(currentStepId);
        if (currentIndex >= 0 && currentIndex < stepOrder.size() - 1) {
            return stepOrder.get(currentIndex + 1);
        }
        return null;
    }

    /**
     * Get next step ID using dynamic step order
     */
    private String getNextStepIdDynamic(
            String currentStepId,
            List<String> stepOrder) {
        int currentIndex = stepOrder.indexOf(currentStepId);
        if (currentIndex >= 0 && currentIndex < stepOrder.size() - 1) {
            return stepOrder.get(currentIndex + 1);
        }
        return "completed"; // All steps completed
    }

    private ProfileBuilderDto.FormData buildFormData(
            String stepId,
            StudentProfile profile,
            String clientId) {
        ProfileBuilderDto.StepDefinition stepDef = STEP_DEFINITIONS.get(stepId);
        Map<String, Object> existingData = extractStepData(profile, stepId);
        Map<String, Object> requestBodyTemplate = createRequestBodyTemplate(
                stepDef.getFields());

        return ProfileBuilderDto.FormData.builder()
                .stepId(stepId)
                .title(stepDef.getTitle())
                .description(stepDef.getDescription())
                .fields(stepDef.getFields())
                .existingData(existingData)
                .isCompleted(getCompletedStepsList(profile).contains(stepId))
                .estimatedTimeMinutes(stepDef.getEstimatedTimeMinutes())
                .requiredFields(getRequiredFields(stepDef))
                .requestBodyTemplate(requestBodyTemplate)
                .build();
    }

    /**
     * Build form data dynamically from config service step definitions
     */
    private ProfileBuilderDto.FormData buildFormDataDynamic(
            String stepId,
            StudentProfile profile,
            Map<String, JsonNode> stepDefinitions) {
        JsonNode stepDef = stepDefinitions.get(stepId);

        if (stepDef == null) {
            log.error("❌ Step definition not found for stepId: {}", stepId);
            throw new RuntimeException(
                    "Step definition not found for: " + stepId);
        }

        // Parse step definition from JsonNode
        String title = stepDef.has("title")
                ? stepDef.get("title").asText()
                : stepId;
        String description = stepDef.has("description")
                ? stepDef.get("description").asText()
                : "";
        Integer estimatedTime = stepDef.has("estimated_time_minutes")
                ? stepDef.get("estimated_time_minutes").asInt()
                : 10;

        // Parse fields
        List<ProfileBuilderDto.FormField> fields = new ArrayList<>();
        if (stepDef.has("fields")) {
            JsonNode fieldsNode = stepDef.get("fields");
            for (JsonNode fieldNode : fieldsNode) {
                fields.add(parseFormField(fieldNode));
            }
        }

        Map<String, Object> existingData = extractStepData(profile, stepId);
        Map<String, Object> requestBodyTemplate = createRequestBodyTemplate(
                fields);

        return ProfileBuilderDto.FormData.builder()
                .stepId(stepId)
                .title(title)
                .description(description)
                .fields(fields)
                .existingData(existingData)
                .isCompleted(getCompletedStepsList(profile).contains(stepId))
                .estimatedTimeMinutes(estimatedTime)
                .requiredFields(getRequiredFieldsFromList(fields))
                .requestBodyTemplate(requestBodyTemplate)
                .build();
    }

    /**
     * Parse a form field from JsonNode
     */
    private ProfileBuilderDto.FormField parseFormField(JsonNode fieldNode) {
        ProfileBuilderDto.FormField.FormFieldBuilder builder = ProfileBuilderDto.FormField.builder();

        if (fieldNode.has("name"))
            builder.name(fieldNode.get("name").asText());
        if (fieldNode.has("type"))
            builder.type(fieldNode.get("type").asText());
        if (fieldNode.has("label"))
            builder.label(
                    fieldNode.get("label").asText());
        if (fieldNode.has("placeholder"))
            builder.placeholder(
                    fieldNode.get("placeholder").asText());
        if (fieldNode.has("required"))
            builder.required(
                    fieldNode.get("required").asBoolean());
        if (fieldNode.has("help_text"))
            builder.helpText(
                    fieldNode.get("help_text").asText());

        // Parse options
        if (fieldNode.has("options")) {
            List<String> options = new ArrayList<>();
            fieldNode.get("options").forEach(opt -> options.add(opt.asText()));
            builder.options(options);
        }

        // Parse validation
        if (fieldNode.has("validation")) {
            JsonNode validation = fieldNode.get("validation");
            ProfileBuilderDto.FieldValidation fieldValidation = objectMapper.convertValue(
                    validation,
                    ProfileBuilderDto.FieldValidation.class);
            builder.validation(fieldValidation);
        }

        // Parse metadata
        if (fieldNode.has("metadata")) {
            JsonNode metadata = fieldNode.get("metadata");
            Map<String, Object> metadataMap = objectMapper.convertValue(
                    metadata,
                    Map.class);
            builder.metadata(metadataMap);
        }

        if (fieldNode.has("conditional"))
            builder.conditional(
                    fieldNode.get("conditional").asBoolean());
        if (fieldNode.has("conditional_logic")) {
            JsonNode condLogic = fieldNode.get("conditional_logic");
            Map<String, Object> condLogicMap = objectMapper.convertValue(
                    condLogic,
                    Map.class);
            builder.conditionalLogic(condLogicMap);
        }

        if (fieldNode.has("default_value")) {
            builder.defaultValue(fieldNode.get("default_value").asText());
        }

        return builder.build();
    }

    /**
     * Get required fields from a list of FormFields
     */
    private List<String> getRequiredFieldsFromList(
            List<ProfileBuilderDto.FormField> fields) {
        return fields
                .stream()
                .filter(ProfileBuilderDto.FormField::isRequired)
                .map(ProfileBuilderDto.FormField::getName)
                .collect(Collectors.toList());
    }

    /**
     * Build step metadata dynamically from config
     */
    private ProfileBuilderDto.StepMetadata buildStepMetadataDynamic(
            String stepId,
            Map<String, JsonNode> stepDefinitions) {
        JsonNode stepDef = stepDefinitions.get(stepId);

        if (stepDef == null) {
            return ProfileBuilderDto.StepMetadata.builder()
                    .skippable(false)
                    .build();
        }

        boolean required = stepDef.has("required")
                ? stepDef.get("required").asBoolean()
                : true;
        boolean skippable = !required;

        return ProfileBuilderDto.StepMetadata.builder()
                .skippable(skippable)
                .build();
    }

    private Map<String, Object> createRequestBodyTemplate(
            List<ProfileBuilderDto.FormField> fields) {
        Map<String, Object> template = new HashMap<>();

        if (fields != null) {
            for (ProfileBuilderDto.FormField field : fields) {
                switch (field.getType()) {
                    case "text":
                    case "textarea":
                    case "select":
                        template.put(field.getName(), "");
                        break;
                    case "number":
                        template.put(field.getName(), null);
                        break;
                    case "date":
                        template.put(field.getName(), "");
                        break;
                    case "boolean":
                        template.put(field.getName(), false);
                        break;
                    case "array":
                        template.put(field.getName(), new ArrayList<>());
                        break;
                    case "object":
                        template.put(field.getName(), new HashMap<>());
                        break;
                    default:
                        template.put(field.getName(), "");
                }
            }
        }

        return template;
    }

    private ProfileBuilderDto.StepMetadata buildStepMetadata(String stepId) {
        return ProfileBuilderDto.StepMetadata.builder()
                .category("profile")
                .tags(Arrays.asList("profile_builder", stepId))
                .icon("form")
                .color("blue")
                .skippable(false)
                .hints(Map.of("tip", "Fill out all required fields to proceed"))
                .tips(Arrays.asList("Make sure all information is accurate"))
                .build();
    }

    /**
     * Validate step data dynamically using config service step definitions
     */
    private ValidationResult validateStepDataDynamic(
            String stepId,
            Map<String, Object> data,
            Map<String, JsonNode> stepDefinitions) {
        Map<String, String> errors = new HashMap<>();
        List<String> warnings = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();

        JsonNode stepDef = stepDefinitions.get(stepId);

        if (stepDef == null) {
            errors.put("step", "Invalid step ID: " + stepId);
            return new ValidationResult(false, errors, warnings, suggestions);
        }

        if (!stepDef.has("fields")) {
            return new ValidationResult(true, errors, warnings, suggestions);
        }

        // Parse fields from JsonNode
        List<ProfileBuilderDto.FormField> fields = new ArrayList<>();
        stepDef
                .get("fields")
                .forEach(fieldNode -> fields.add(parseFormField(fieldNode)));

        if (fields.isEmpty()) {
            return new ValidationResult(true, errors, warnings, suggestions);
        }

        // 1. STRICT: Check for unknown fields - reject any field not defined for this
        // step
        Set<String> allowedFields = fields
                .stream()
                .map(ProfileBuilderDto.FormField::getName)
                .collect(Collectors.toSet());

        for (String fieldName : data.keySet()) {
            if (!allowedFields.contains(fieldName)) {
                errors.put(
                        fieldName,
                        "Unknown field '" +
                                fieldName +
                                "' is not allowed for step '" +
                                stepId +
                                "'");
            }
        }

        // 2. STRICT: Validate each defined field
        for (ProfileBuilderDto.FormField field : fields) {
            Object value = data.get(field.getName());

            // Required field validation
            if (field.isRequired() && isFieldEmpty(value)) {
                errors.put(field.getName(), field.getLabel() + " is required");
                continue;
            }

            // Skip further validation if field is empty and not required
            if (isFieldEmpty(value)) {
                continue;
            }

            // Type validation
            if (!validateFieldType(field, value)) {
                errors.put(
                        field.getName(),
                        "Invalid " +
                                field.getType() +
                                " value for " +
                                field.getLabel());
                continue;
            }

            // Value validation (ranges, formats, etc.)
            String valueError = validateFieldValue(field, value);
            if (valueError != null) {
                errors.put(field.getName(), valueError);
            }
        }

        return new ValidationResult(
                errors.isEmpty(),
                errors,
                warnings,
                suggestions);
    }

    /**
     * Legacy validateStepData using hardcoded definitions (kept for backward
     * compatibility)
     * Internally delegates to dynamic validation
     */
    private ValidationResult validateStepData(
            String stepId,
            Map<String, Object> data) {
        // Try to get dynamic step definitions, fallback to hardcoded if not available
        try {
            String clientId = "uni360"; // Default client
            Map<String, JsonNode> stepDefinitions = configService
                    .getStepDefinitions(clientId)
                    .block(); // Block here since this is called from non-reactive context

            if (stepDefinitions != null && stepDefinitions.containsKey(stepId)) {
                return validateStepDataDynamic(stepId, data, stepDefinitions);
            }
        } catch (Exception e) {
            log.warn(
                    "Failed to get dynamic step definitions, using hardcoded fallback: {}",
                    e.getMessage());
        }

        // Fallback to hardcoded validation
        Map<String, String> errors = new HashMap<>();
        List<String> warnings = new ArrayList<>();
        List<String> suggestions = new ArrayList<>();
        ProfileBuilderDto.StepDefinition stepDef = STEP_DEFINITIONS.get(stepId);

        if (stepDef == null) {
            errors.put("step", "Invalid step ID: " + stepId);
            return new ValidationResult(false, errors, warnings, suggestions);
        }

        if (stepDef.getFields() == null || stepDef.getFields().isEmpty()) {
            return new ValidationResult(true, errors, warnings, suggestions);
        }

        // 1. STRICT: Check for unknown fields
        Set<String> allowedFields = stepDef
                .getFields()
                .stream()
                .map(ProfileBuilderDto.FormField::getName)
                .collect(Collectors.toSet());

        for (String fieldName : data.keySet()) {
            if (!allowedFields.contains(fieldName)) {
                errors.put(
                        fieldName,
                        "Unknown field '" +
                                fieldName +
                                "' is not allowed for step '" +
                                stepId +
                                "'");
            }
        }

        // 2. STRICT: Validate each defined field
        for (ProfileBuilderDto.FormField field : stepDef.getFields()) {
            Object value = data.get(field.getName());

            // Required field validation
            if (field.isRequired() && isFieldEmpty(value)) {
                errors.put(field.getName(), field.getLabel() + " is required");
                continue;
            }

            // Skip further validation if field is empty and not required
            if (isFieldEmpty(value)) {
                continue;
            }

            // Type validation
            if (!validateFieldType(field, value)) {
                errors.put(
                        field.getName(),
                        "Invalid " +
                                field.getType() +
                                " value for " +
                                field.getLabel());
                continue;
            }

            // Value validation
            String valueError = validateFieldValue(field, value);
            if (valueError != null) {
                errors.put(field.getName(), valueError);
            }
        }

        return new ValidationResult(
                errors.isEmpty(),
                errors,
                warnings,
                suggestions);
    }

    private boolean isFieldEmpty(Object value) {
        return (value == null ||
                (value instanceof String && ((String) value).trim().isEmpty()) ||
                (value instanceof List && ((List<?>) value).isEmpty()) ||
                (value instanceof Map && ((Map<?, ?>) value).isEmpty()));
    }

    private boolean validateFieldType(
            ProfileBuilderDto.FormField field,
            Object value) {
        switch (field.getType().toLowerCase()) {
            case "text":
            case "textarea":
            case "select":
                return value instanceof String;
            case "number":
                return (value instanceof Number ||
                        (value instanceof String && isNumeric((String) value)));
            case "date":
                return value instanceof String && isValidDate((String) value);
            case "boolean":
                return (value instanceof Boolean ||
                        (value instanceof String && isValidBoolean((String) value)));
            case "array":
                return value instanceof List;
            case "object":
                return value instanceof Map;
            default:
                return true; // Unknown types pass for now
        }
    }

    private String validateFieldValue(
            ProfileBuilderDto.FormField field,
            Object value) {
        String fieldName = field.getName();
        String stringValue = value.toString();

        // Phone number validation
        if (fieldName.contains("phone")) {
            if (!stringValue.matches("^\\+?[1-9]\\d{1,14}$")) {
                return "Phone number must be in valid international format (e.g., +1-555-0123)";
            }
        }

        // Email validation
        if (fieldName.contains("email") && !fieldName.contains("password")) {
            if (!stringValue.matches(
                    "^[A-Za-z0-9+_.-]+@([A-Za-z0-9.-]+\\.[A-Za-z]{2,})$")) {
                return "Please enter a valid email address";
            }
        }

        // Date of birth validation
        if (fieldName.contains("date_of_birth")) {
            try {
                LocalDate dob = LocalDate.parse(stringValue);
                LocalDate now = LocalDate.now();
                int age = Period.between(dob, now).getYears();
                if (age < 16 || age > 100) {
                    return "Age must be between 16 and 100 years";
                }
            } catch (Exception e) {
                return "Date must be in YYYY-MM-DD format";
            }
        }

        // GPA validation
        if (fieldName.contains("gpa") && field.getType().equals("number")) {
            try {
                double gpa = Double.parseDouble(stringValue);
                if (gpa < 0.0 || gpa > 4.0) {
                    return "GPA must be between 0.0 and 4.0";
                }
            } catch (NumberFormatException e) {
                return "GPA must be a valid number";
            }
        }

        // Graduation year validation
        if (fieldName.contains("graduation_year") ||
                fieldName.contains("intake_year")) {
            try {
                int year = Integer.parseInt(stringValue);
                int currentYear = LocalDate.now().getYear();
                if (year < 1950 || year > currentYear + 10) {
                    return ("Year must be between 1950 and " + (currentYear + 10));
                }
            } catch (NumberFormatException e) {
                return "Year must be a valid number";
            }
        }

        // Nationality validation
        if (fieldName.contains("nationality")) {
            if (stringValue.length() < 2 || stringValue.length() > 50) {
                return "Nationality must be between 2 and 50 characters";
            }
        }

        return null; // No validation errors
    }

    private boolean isNumeric(String str) {
        try {
            Double.parseDouble(str);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private boolean isValidDate(String str) {
        try {
            LocalDate.parse(str);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isValidBoolean(String str) {
        return "true".equalsIgnoreCase(str) || "false".equalsIgnoreCase(str);
    }

    private void updateProfileWithStepData(
            StudentProfile profile,
            String stepId,
            Map<String, Object> data) {
        ObjectNode profileData = (ObjectNode) profile.getProfileData();
        if (profileData == null) {
            profileData = objectMapper.createObjectNode();
            profile.setProfileData(profileData);
        }

        ObjectNode stepData = objectMapper.valueToTree(data);
        profileData.set(stepId, stepData);
    }

    private void markStepAsCompleted(StudentProfile profile, String stepId) {
        ArrayNode completedSteps = (ArrayNode) profile.getProfileStepsCompleted();
        if (completedSteps == null) {
            completedSteps = objectMapper.createArrayNode();
            profile.setProfileStepsCompleted(completedSteps);
        }

        // Check if step is already marked as completed
        boolean alreadyCompleted = false;
        for (JsonNode step : completedSteps) {
            if (stepId.equals(step.asText())) {
                alreadyCompleted = true;
                break;
            }
        }

        if (!alreadyCompleted) {
            completedSteps.add(stepId);
        }

        // Note: currentStep will be set by the caller using dynamic step order
    }

    /**
     * Mark step as completed and set next step using dynamic step order
     */
    private void markStepAsCompletedDynamic(
            StudentProfile profile,
            String stepId,
            List<String> stepOrder) {
        ArrayNode completedSteps = (ArrayNode) profile.getProfileStepsCompleted();
        if (completedSteps == null) {
            completedSteps = objectMapper.createArrayNode();
            profile.setProfileStepsCompleted(completedSteps);
        }

        // Check if step is already marked as completed
        boolean alreadyCompleted = false;
        for (JsonNode step : completedSteps) {
            if (stepId.equals(step.asText())) {
                alreadyCompleted = true;
                break;
            }
        }

        if (!alreadyCompleted) {
            completedSteps.add(stepId);
        }

        profile.setCurrentStep(
                determineNextStepDynamic(profile, stepId, stepOrder));
    }

    private Map<String, Object> extractStepData(
            StudentProfile profile,
            String stepId) {
        if (profile.getProfileData() != null &&
                profile.getProfileData().has(stepId)) {
            return objectMapper.convertValue(
                    profile.getProfileData().get(stepId),
                    Map.class);
        }
        return new HashMap<>();
    }

    private Map<String, Object> extractAllProfileData(StudentProfile profile) {
        if (profile.getProfileData() != null) {
            return objectMapper.convertValue(
                    profile.getProfileData(),
                    Map.class);
        }
        return new HashMap<>();
    }

    private List<String> getCompletedStepsList(StudentProfile profile) {
        if (profile.getProfileStepsCompleted() != null) {
            List<String> completed = new ArrayList<>();
            profile
                    .getProfileStepsCompleted()
                    .forEach(step -> completed.add(step.asText()));
            return completed;
        }
        return new ArrayList<>();
    }

    private int getCompletedStepsCount(StudentProfile profile) {
        return getCompletedStepsList(profile).size();
    }

    private long calculateEstimatedTime(StudentProfile profile) {
        List<String> completedSteps = getCompletedStepsList(profile);
        return STEP_DEFINITIONS.values()
                .stream()
                .filter(step -> !completedSteps.contains(step.getId()))
                .mapToLong(
                        ProfileBuilderDto.StepDefinition::getEstimatedTimeMinutes)
                .sum();
    }

    private boolean canEditStep(StudentProfile profile, String stepId) {
        // Allow editing if profile is not verified
        return !Boolean.TRUE.equals(profile.getIsVerified());
    }

    private List<String> getRequiredFields(
            ProfileBuilderDto.StepDefinition stepDef) {
        return stepDef
                .getFields()
                .stream()
                .filter(ProfileBuilderDto.FormField::isRequired)
                .map(ProfileBuilderDto.FormField::getName)
                .collect(Collectors.toList());
    }

    private int calculatePendingTasks(StudentProfile profile) {
        // Calculate based on incomplete steps and other pending items
        int incompleteTasks = STEP_DEFINITIONS.size() - getCompletedStepsCount(profile);
        return Math.max(0, incompleteTasks);
    }

    /**
     * Calculate pending tasks using dynamic step order from config
     */
    private int calculatePendingTasksDynamic(
            StudentProfile profile,
            List<String> stepOrder) {
        // Calculate based on incomplete steps and other pending items
        int incompleteTasks = stepOrder.size() - getCompletedStepsCount(profile);
        return Math.max(0, incompleteTasks);
    }

    private String determineNextAction(StudentProfile profile) {
        // Calculate dynamic completion percentage
        Map<String, Object> storedProfileData = extractAllProfileData(profile);
        int dynamicCompletion = calculateDynamicCompletionPercentage(
                storedProfileData);

        if (dynamicCompletion < 50) {
            return "Complete basic information";
        } else if (dynamicCompletion < 100) {
            return "Finish profile setup";
        } else {
            return "Start applying to universities";
        }
    }

    private List<String> calculateMissingFields(StudentProfile profile) {
        List<String> missing = new ArrayList<>();
        List<String> completed = getCompletedStepsList(profile);

        for (String step : STEP_ORDER) {
            if (!completed.contains(step)) {
                ProfileBuilderDto.StepDefinition stepDef = STEP_DEFINITIONS.get(
                        step);
                if (stepDef != null && stepDef.isRequired()) {
                    missing.add(stepDef.getTitle());
                }
            }
        }

        return missing;
    }

    /**
     * Calculate missing fields using dynamic config from DB
     */
    private List<String> calculateMissingFieldsDynamic(
            StudentProfile profile,
            List<String> stepOrder,
            Map<String, JsonNode> stepDefinitions) {
        List<String> missing = new ArrayList<>();
        List<String> completed = getCompletedStepsList(profile);

        for (String step : stepOrder) {
            if (!completed.contains(step)) {
                JsonNode stepDef = stepDefinitions.get(step);
                if (stepDef != null) {
                    boolean isRequired = stepDef.has("required")
                            ? stepDef.get("required").asBoolean()
                            : false;
                    if (isRequired) {
                        String title = stepDef.has("title")
                                ? stepDef.get("title").asText()
                                : step;
                        missing.add(title);
                    }
                }
            }
        }

        return missing;
    }

    private List<String> generateRecommendations(StudentProfile profile) {
        List<String> recommendations = new ArrayList<>();

        // Calculate dynamic completion percentage
        Map<String, Object> storedProfileData = extractAllProfileData(profile);
        int dynamicCompletion = calculateDynamicCompletionPercentage(
                storedProfileData);

        if (dynamicCompletion < 25) {
            recommendations.add("Add your basic information to get started");
        }
        if (dynamicCompletion < 50) {
            recommendations.add("Complete your education details");
        }
        if (dynamicCompletion < 75) {
            recommendations.add("Add your test scores to improve matching");
        }
        if (dynamicCompletion < 100) {
            recommendations.add(
                    "Complete all sections for the best experience");
        }

        return recommendations;
    }

    // Step definitions - in production this would come from configuration
    private static Map<String, ProfileBuilderDto.StepDefinition> createStepDefinitions() {
        Map<String, ProfileBuilderDto.StepDefinition> definitions = new HashMap<>();

        definitions.put("basic_info", createBasicInfoStep());
        definitions.put("education", createEducationStep());
        definitions.put("test_scores", createTestScoresStep());
        definitions.put("preferences", createPreferencesStep());
        definitions.put("experience", createExperienceStep());
        definitions.put("financial", createFinancialStep());
        definitions.put("documents", createDocumentsStep());
        definitions.put("goals", createGoalsStep());
        definitions.put("compliance", createComplianceStep());

        return definitions;
    }

    private static ProfileBuilderDto.StepDefinition createBasicInfoStep() {
        return ProfileBuilderDto.StepDefinition.builder()
                .id("basic_info")
                .title("Basic Information")
                .description("Tell us about yourself")
                .required(true)
                .order(1)
                .estimatedTimeMinutes(5)
                .dependencies(new ArrayList<>())
                .fields(
                        Arrays.asList(
                                ProfileBuilderDto.FormField.builder()
                                        .name("phone")
                                        .type("text")
                                        .label("Phone Number")
                                        .required(true)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("nationality")
                                        .type("select")
                                        .label("Nationality")
                                        .required(true)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("current_location")
                                        .type("text")
                                        .label("Current Location")
                                        .required(true)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("date_of_birth")
                                        .type("date")
                                        .label("Date of Birth")
                                        .required(true)
                                        .build()))
                .build();
    }

    private static ProfileBuilderDto.StepDefinition createEducationStep() {
        return ProfileBuilderDto.StepDefinition.builder()
                .id("education")
                .title("Education Background")
                .description("Your educational history")
                .required(true)
                .order(2)
                .estimatedTimeMinutes(10)
                .dependencies(Arrays.asList("basic_info"))
                .fields(
                        Arrays.asList(
                                ProfileBuilderDto.FormField.builder()
                                        .name("education_level")
                                        .type("select")
                                        .label("Education Level")
                                        .required(true)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("field_of_study")
                                        .type("text")
                                        .label("Field of Study")
                                        .required(true)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("institution_name")
                                        .type("text")
                                        .label("Institution Name")
                                        .required(true)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("graduation_year")
                                        .type("number")
                                        .label("Graduation Year")
                                        .required(true)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("gpa")
                                        .type("number")
                                        .label("GPA")
                                        .required(false)
                                        .build()))
                .build();
    }

    private static ProfileBuilderDto.StepDefinition createTestScoresStep() {
        return ProfileBuilderDto.StepDefinition.builder()
                .id("test_scores")
                .title("Test Scores")
                .description("Your standardized test scores")
                .required(false)
                .order(3)
                .estimatedTimeMinutes(5)
                .dependencies(Arrays.asList("education"))
                .fields(
                        Arrays.asList(
                                ProfileBuilderDto.FormField.builder()
                                        .name("ielts")
                                        .type("text")
                                        .label("IELTS Score")
                                        .required(false)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("toefl")
                                        .type("text")
                                        .label("TOEFL Score")
                                        .required(false)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("gre")
                                        .type("text")
                                        .label("GRE Score")
                                        .required(false)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("gmat")
                                        .type("text")
                                        .label("GMAT Score")
                                        .required(false)
                                        .build()))
                .build();
    }

    private static ProfileBuilderDto.StepDefinition createPreferencesStep() {
        return ProfileBuilderDto.StepDefinition.builder()
                .id("preferences")
                .title("Study Preferences")
                .description("Where and what you want to study")
                .required(true)
                .order(4)
                .estimatedTimeMinutes(8)
                .dependencies(Arrays.asList("education"))
                .fields(
                        Arrays.asList(
                                ProfileBuilderDto.FormField.builder()
                                        .name("target_countries")
                                        .type("multiselect")
                                        .label("Target Countries")
                                        .required(true)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("preferred_programs")
                                        .type("multiselect")
                                        .label("Preferred Programs")
                                        .required(true)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("study_level")
                                        .type("select")
                                        .label("Study Level")
                                        .required(true)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("intake_year")
                                        .type("number")
                                        .label("Intake Year")
                                        .required(true)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("intake_semester")
                                        .type("select")
                                        .label("Intake Semester")
                                        .required(true)
                                        .build()))
                .build();
    }

    private static ProfileBuilderDto.StepDefinition createExperienceStep() {
        return ProfileBuilderDto.StepDefinition.builder()
                .id("experience")
                .title("Work Experience")
                .description("Your professional background")
                .required(false)
                .order(5)
                .estimatedTimeMinutes(10)
                .dependencies(Arrays.asList("education"))
                .fields(
                        Arrays.asList(
                                ProfileBuilderDto.FormField.builder()
                                        .name("work_experience")
                                        .type("textarea")
                                        .label("Work Experience")
                                        .required(false)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("extracurricular")
                                        .type("textarea")
                                        .label("Extracurricular Activities")
                                        .required(false)
                                        .build()))
                .build();
    }

    private static ProfileBuilderDto.StepDefinition createFinancialStep() {
        return ProfileBuilderDto.StepDefinition.builder()
                .id("financial")
                .title("Financial Information")
                .description("Your budget and funding sources")
                .required(false)
                .order(6)
                .estimatedTimeMinutes(5)
                .dependencies(Arrays.asList("preferences"))
                .fields(
                        Arrays.asList(
                                ProfileBuilderDto.FormField.builder()
                                        .name("budget_min")
                                        .type("number")
                                        .label("Minimum Budget")
                                        .required(false)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("budget_max")
                                        .type("number")
                                        .label("Maximum Budget")
                                        .required(false)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("budget_currency")
                                        .type("select")
                                        .label("Budget Currency")
                                        .required(false)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("funding_source")
                                        .type("select")
                                        .label("Funding Source")
                                        .required(false)
                                        .build()))
                .build();
    }

    private static ProfileBuilderDto.StepDefinition createDocumentsStep() {
        return ProfileBuilderDto.StepDefinition.builder()
                .id("documents")
                .title("Document Upload")
                .description("Upload your important documents")
                .required(false)
                .order(7)
                .estimatedTimeMinutes(15)
                .dependencies(Arrays.asList("basic_info", "education"))
                .fields(
                        Arrays.asList(
                                ProfileBuilderDto.FormField.builder()
                                        .name("cv_resume")
                                        .type("file")
                                        .label("CV/Resume")
                                        .required(false)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("transcripts")
                                        .type("file")
                                        .label("Transcripts")
                                        .required(false)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("certificates")
                                        .type("file")
                                        .label("Certificates")
                                        .required(false)
                                        .build()))
                .build();
    }

    private static ProfileBuilderDto.StepDefinition createGoalsStep() {
        return ProfileBuilderDto.StepDefinition.builder()
                .id("goals")
                .title("Goals & Aspirations")
                .description("Your academic and career goals")
                .required(false)
                .order(8)
                .estimatedTimeMinutes(10)
                .dependencies(Arrays.asList("preferences"))
                .fields(
                        Arrays.asList(
                                ProfileBuilderDto.FormField.builder()
                                        .name("career_goals")
                                        .type("textarea")
                                        .label("Career Goals")
                                        .required(false)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("personal_statement")
                                        .type("textarea")
                                        .label("Personal Statement")
                                        .required(false)
                                        .build()))
                .build();
    }

    private static ProfileBuilderDto.StepDefinition createComplianceStep() {
        return ProfileBuilderDto.StepDefinition.builder()
                .id("compliance")
                .title("Terms & Privacy")
                .description("Accept our terms and privacy policy")
                .required(true)
                .order(9)
                .estimatedTimeMinutes(2)
                .dependencies(new ArrayList<>())
                .fields(
                        Arrays.asList(
                                ProfileBuilderDto.FormField.builder()
                                        .name("gdpr_consent")
                                        .type("boolean")
                                        .label("I consent to GDPR data processing")
                                        .required(true)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("terms_accepted")
                                        .type("boolean")
                                        .label("I accept the Terms of Service")
                                        .required(true)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("privacy_policy_accepted")
                                        .type("boolean")
                                        .label("I accept the Privacy Policy")
                                        .required(true)
                                        .build(),
                                ProfileBuilderDto.FormField.builder()
                                        .name("marketing_consent")
                                        .type("boolean")
                                        .label("I consent to receive marketing communications")
                                        .required(false)
                                        .build()))
                .build();
    }

    // Validation result helper class
    private static class ValidationResult {

        private final boolean valid;
        private final Map<String, String> validationErrors;
        private final List<String> warnings;
        private final List<String> suggestions;

        public ValidationResult(
                boolean valid,
                Map<String, String> validationErrors,
                List<String> warnings,
                List<String> suggestions) {
            this.valid = valid;
            this.validationErrors = validationErrors;
            this.warnings = warnings;
            this.suggestions = suggestions;
        }

        public boolean isValid() {
            return valid;
        }

        public Map<String, String> getValidationErrors() {
            return validationErrors;
        }

        public List<String> getWarnings() {
            return warnings;
        }

        public List<String> getSuggestions() {
            return suggestions;
        }
    }

    /**
     * Save step data and advance to next step
     */
    private Mono<StudentProfile> saveStepDataAndAdvance(
            StudentProfile profile,
            String stepId,
            Map<String, Object> stepData) {
        try {
            // Update the profile data
            ObjectNode profileDataNode;
            if (profile.getProfileData() != null) {
                profileDataNode = (ObjectNode) profile.getProfileData();
            } else {
                profileDataNode = objectMapper.createObjectNode();
            }
            profileDataNode.set(stepId, objectMapper.valueToTree(stepData));

            // Mark current step as completed
            markStepAsCompleted(profile, stepId);

            // Update current step to next step
            String nextStepId = getNextStepId(stepId);
            profile.setCurrentStep(nextStepId);
            profile.setProfileData(profileDataNode);

            // Recalculate completion percentage
            profile.updateProfileStatus();

            log.debug(
                    "Updated profile: step '{}' -> '{}', completion: {}%",
                    stepId,
                    nextStepId,
                    profile.getCompletionPercentage());

            return studentProfileRepository.save(profile);
        } catch (Exception e) {
            return Mono.error(
                    new RuntimeException(
                            "Failed to save step data: " + e.getMessage()));
        }
    }

    /**
     * Save step data and advance to next step using dynamic step order from config
     */
    private Mono<StudentProfile> saveStepDataAndAdvanceDynamic(
            StudentProfile profile,
            String stepId,
            Map<String, Object> stepData,
            List<String> stepOrder) {
        try {
            // Update the profile data
            ObjectNode profileDataNode;
            if (profile.getProfileData() != null) {
                profileDataNode = (ObjectNode) profile.getProfileData();
            } else {
                profileDataNode = objectMapper.createObjectNode();
            }
            profileDataNode.set(stepId, objectMapper.valueToTree(stepData));

            // Mark current step as completed using dynamic step order
            markStepAsCompletedDynamic(profile, stepId, stepOrder);

            // Update current step to next step using dynamic step order
            String nextStepId = getNextStepIdDynamic(stepId, stepOrder);
            profile.setCurrentStep(nextStepId);
            profile.setProfileData(profileDataNode);

            // Recalculate completion percentage
            profile.updateProfileStatus();

            log.debug(
                    "🔄 Updated profile (dynamic): step '{}' -> '{}', completion: {}%",
                    stepId,
                    nextStepId,
                    profile.getCompletionPercentage());

            return studentProfileRepository.save(profile);
        } catch (Exception e) {
            return Mono.error(
                    new RuntimeException(
                            "Failed to save step data: " + e.getMessage()));
        }
    }

    /**
     * Save multiple steps and advance profile
     */
    private Mono<StudentProfile> saveMultipleStepsAndAdvance(
            StudentProfile profile,
            Map<String, Object> profileData) {
        try {
            // Update the profile data with all steps
            ObjectNode profileDataNode;
            if (profile.getProfileData() != null) {
                profileDataNode = (ObjectNode) profile.getProfileData();
            } else {
                profileDataNode = objectMapper.createObjectNode();
            }

            for (Map.Entry<String, Object> entry : profileData.entrySet()) {
                String stepId = entry.getKey();
                Object stepData = entry.getValue();
                profileDataNode.set(stepId, objectMapper.valueToTree(stepData));
            }

            // Update current step to final step
            profile.setCurrentStep("completed");
            profile.setProfileData(profileDataNode);

            // Recalculate completion percentage
            profile.updateProfileStatus();

            log.debug(
                    "Updated multiple steps, completion: {}%",
                    profile.getCompletionPercentage());

            return studentProfileRepository.save(profile);
        } catch (Exception e) {
            return Mono.error(
                    new RuntimeException(
                            "Failed to save profile data: " + e.getMessage()));
        }
    }

    /**
     * Create advancement response with next step info (legacy - uses static
     * definitions)
     */
    private ProfileBuilderDto.ValidationResponse createAdvancementResponse(
            StudentProfile profile,
            String completedStepId) {
        String nextStepId = profile.getCurrentStep();
        boolean hasNext = nextStepId != null && !nextStepId.equals("completed");

        // Calculate dynamic completion percentage
        Map<String, Object> storedProfileData = extractAllProfileData(profile);
        int dynamicCompletion = calculateDynamicCompletionPercentage(
                storedProfileData);

        ProfileBuilderDto.ValidationResponse.ValidationResponseBuilder builder = ProfileBuilderDto.ValidationResponse
                .builder()
                .success(true)
                .message("Step completed successfully")
                .valid(true)
                .stepCompleted(true)
                .completionPercentage(dynamicCompletion)
                .hasNext(hasNext)
                .validationErrors(new HashMap<>())
                .warnings(new ArrayList<>())
                .suggestions(new ArrayList<>());

        // Add next step info if available
        if (hasNext) {
            ProfileBuilderDto.StepDefinition nextStepDef = STEP_DEFINITIONS.get(
                    nextStepId);
            if (nextStepDef != null) {
                builder.nextStep(
                        ProfileBuilderDto.NextStepInfo.builder()
                                .stepId(nextStepId)
                                .stepName(nextStepDef.getTitle())
                                .formData(
                                        ProfileBuilderDto.FormData.builder()
                                                .stepId(nextStepId)
                                                .title(nextStepDef.getTitle())
                                                .description(nextStepDef.getDescription())
                                                .fields(nextStepDef.getFields())
                                                .estimatedTimeMinutes(
                                                        nextStepDef.getEstimatedTimeMinutes())
                                                .build())
                                .metadata(
                                        ProfileBuilderDto.StepMetadata.builder()
                                                .category("profile")
                                                .build())
                                .build());
            }
        }

        return builder.build();
    }

    /**
     * Create advancement response with next step info using dynamic config from DB
     */
    private ProfileBuilderDto.ValidationResponse createAdvancementResponseDynamic(
            StudentProfile profile,
            String completedStepId,
            Map<String, JsonNode> stepDefinitions,
            List<String> stepOrder) {
        String nextStepId = profile.getCurrentStep();
        boolean hasNext = nextStepId != null && !nextStepId.equals("completed");

        // Calculate dynamic completion percentage
        Map<String, Object> storedProfileData = extractAllProfileData(profile);
        int dynamicCompletion = calculateDynamicCompletionPercentage(
                storedProfileData,
                stepOrder);

        ProfileBuilderDto.ValidationResponse.ValidationResponseBuilder builder = ProfileBuilderDto.ValidationResponse
                .builder()
                .success(true)
                .message("Step completed successfully")
                .valid(true)
                .stepCompleted(true)
                .completionPercentage(dynamicCompletion)
                .hasNext(hasNext)
                .validationErrors(new HashMap<>())
                .warnings(new ArrayList<>())
                .suggestions(new ArrayList<>());

        // Add next step info if available using dynamic step definitions
        if (hasNext && stepDefinitions.containsKey(nextStepId)) {
            JsonNode nextStepDef = stepDefinitions.get(nextStepId);

            String title = nextStepDef.has("title")
                    ? nextStepDef.get("title").asText()
                    : nextStepId;
            String description = nextStepDef.has("description")
                    ? nextStepDef.get("description").asText()
                    : "";
            Integer estimatedTime = nextStepDef.has("estimated_time_minutes")
                    ? nextStepDef.get("estimated_time_minutes").asInt()
                    : 10;

            // Parse fields
            List<ProfileBuilderDto.FormField> fields = new ArrayList<>();
            if (nextStepDef.has("fields")) {
                JsonNode fieldsNode = nextStepDef.get("fields");
                for (JsonNode fieldNode : fieldsNode) {
                    fields.add(parseFormField(fieldNode));
                }
            }

            builder.nextStep(
                    ProfileBuilderDto.NextStepInfo.builder()
                            .stepId(nextStepId)
                            .stepName(title)
                            .formData(
                                    ProfileBuilderDto.FormData.builder()
                                            .stepId(nextStepId)
                                            .title(title)
                                            .description(description)
                                            .fields(fields)
                                            .estimatedTimeMinutes(estimatedTime)
                                            .build())
                            .metadata(
                                    ProfileBuilderDto.StepMetadata.builder()
                                            .category("profile")
                                            .build())
                            .build());
        }

        return builder.build();
    }

    /**
     * Calculate dynamic completion percentage based on actual profile data
     * without relying on stored completion percentage
     */
    private int calculateDynamicCompletionPercentage(
            Map<String, Object> profileData,
            List<String> stepOrder) {
        if (profileData == null || profileData.isEmpty()) {
            return 0;
        }

        int totalSteps = stepOrder.size();
        int completedSteps = 0;

        // Count steps that have valid data
        for (String stepId : stepOrder) {
            if (profileData.containsKey(stepId)) {
                Object stepDataObj = profileData.get(stepId);
                if (stepDataObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> stepDataMap = (Map<String, Object>) stepDataObj;

                    // Check if step has meaningful data (not just empty map)
                    if (!stepDataMap.isEmpty()) {
                        completedSteps++;
                    }
                }
            }
        }

        // Calculate percentage: completed/total * 100, rounded to nearest integer
        double percentage = ((double) completedSteps / totalSteps) * 100.0;
        return (int) Math.round(percentage);
    }

    /**
     * Overloaded version using static STEP_ORDER as fallback
     */
    private int calculateDynamicCompletionPercentage(
            Map<String, Object> profileData) {
        return calculateDynamicCompletionPercentage(profileData, STEP_ORDER);
    }

    /**
     * Overloaded version using static STEP_ORDER as fallback
     */
    private ProfileBuilderDto.ProgressData buildProgressData(
            StudentProfile profile) {
        return buildProgressData(profile, STEP_ORDER);
    }

    /**
     * Reset profile data and remove default/dummy values
     * Fetches latest config from DB to determine first step
     */
    public Mono<ProfileBuilderDto.ValidationResponse> resetProfileData(
            Long userId) {
        log.debug("🔄 Resetting profile data for user: {}", userId);

        String clientId = "uni360"; // Default client

        // First fetch the latest step order from DB config
        return getStepOrderDynamic(clientId)
                .flatMap(stepOrder -> {
                    // Get first step from dynamic config
                    String firstStep = stepOrder.isEmpty()
                            ? "basic_info"
                            : stepOrder.get(0);
                    log.info(
                            "🔄 Reset will set first step to '{}' from config (total {} steps)",
                            firstStep,
                            stepOrder.size());

                    return studentProfileRepository
                            .findActiveByUserId(userId)
                            .flatMap(profile -> {
                                // Clear profile data but keep basic structure
                                profile.setProfileData(objectMapper.createObjectNode());
                                profile.setCompletionPercentage(0);
                                profile.setCurrentStep(firstStep); // Use dynamic first step
                                profile.setProfileStepsCompleted(
                                        objectMapper.createArrayNode());
                                profile.setProfileStatus(VerificationStatus.DRAFT);
                                profile.setWorkflowStage("profile_building");
                                profile.setIsVerified(false);
                                profile.setProfileScore(null);

                                log.info(
                                        "🔄 Profile reset for user {}: currentStep='{}', completedSteps=[]",
                                        userId,
                                        firstStep);

                                return studentProfileRepository.save(profile);
                            })
                            .map(savedProfile -> ProfileBuilderDto.ValidationResponse.builder()
                                    .success(true)
                                    .message(
                                            "Profile data reset successfully. Starting from step: " +
                                                    firstStep)
                                    .valid(true)
                                    .completionPercentage(0)
                                    .stepCompleted(false)
                                    .hasNext(true)
                                    .validationErrors(new HashMap<>())
                                    .warnings(new ArrayList<>())
                                    .suggestions(new ArrayList<>())
                                    .build())
                            .switchIfEmpty(
                                    Mono.just(
                                            ProfileBuilderDto.ValidationResponse.builder()
                                                    .success(false)
                                                    .message("Profile not found for user")
                                                    .valid(false)
                                                    .build()));
                })
                .onErrorResume(error -> {
                    log.error(
                            "❌ Failed to reset profile data for user: {}",
                            userId,
                            error);
                    return Mono.just(
                            ProfileBuilderDto.ValidationResponse.builder()
                                    .success(false)
                                    .message(
                                            "Failed to reset profile data: " +
                                                    error.getMessage())
                                    .valid(false)
                                    .build());
                });
    }

    /**
     * Bulk set profile data for multiple steps at once
     * Validates each step and saves data, skipping validation if requested
     */
    public Mono<ProfileBuilderDto.BulkSetResponse> bulkSetProfileData(
            Long userId,
            ProfileBuilderDto.BulkSetRequest request) {
        log.info("═══════════════════════════════════════════════════════════");
        log.info(
                "🔄 [BULK-SET] Starting bulk profile set for userId: {}",
                userId);
        log.info(
                "   └─ Steps to set: {}",
                request.getData() != null ? request.getData().keySet() : "none");
        log.info("   └─ Skip validation: {}", request.isSkipValidation());
        log.info("───────────────────────────────────────────────────────────");

        if (request.getData() == null || request.getData().isEmpty()) {
            log.warn("❌ [BULK-SET] No data provided");
            return Mono.just(
                    ProfileBuilderDto.BulkSetResponse.builder()
                            .success(false)
                            .message("No data provided for bulk set")
                            .totalSteps(0)
                            .successfulSteps(0)
                            .failedSteps(0)
                            .stepResults(new ArrayList<>())
                            .validationErrors(new HashMap<>())
                            .build());
        }

        String clientId = "uni360";

        return configService
                .getStepDefinitions(clientId)
                .flatMap(stepDefinitions -> studentProfileRepository
                        .findActiveByUserId(userId)
                        .switchIfEmpty(createNewProfile(userId))
                        .flatMap(profile -> {
                            List<ProfileBuilderDto.BulkSetStepResult> stepResults = new ArrayList<>();
                            Map<String, List<String>> allValidationErrors = new HashMap<>();
                            int successCount = 0;
                            int failCount = 0;

                            // Process each step
                            for (Map.Entry<String, Map<String, Object>> entry : request.getData().entrySet()) {
                                String stepId = entry.getKey();
                                Map<String, Object> stepData = entry.getValue();

                                log.info(
                                        "📝 [BULK-SET] Processing step: {}",
                                        stepId);

                                if (!request.isSkipValidation()) {
                                    // Validate step data
                                    var validationResult = validateStepDataDynamic(
                                            stepId,
                                            stepData,
                                            stepDefinitions);

                                    if (!validationResult.isValid()) {
                                        log.warn(
                                                "   └─ ❌ Validation failed for step: {}",
                                                stepId);
                                        failCount++;
                                        stepResults.add(
                                                ProfileBuilderDto.BulkSetStepResult.builder()
                                                        .stepId(stepId)
                                                        .success(false)
                                                        .message("Validation failed")
                                                        .errors(
                                                                validationResult.getValidationErrors())
                                                        .build());
                                        allValidationErrors.put(
                                                stepId,
                                                new ArrayList<>(
                                                        validationResult
                                                                .getValidationErrors()
                                                                .values()));
                                        continue;
                                    }
                                }

                                // Save step data directly to profile
                                try {
                                    ObjectNode profileDataNode;
                                    if (profile.getProfileData() != null) {
                                        profileDataNode = (ObjectNode) profile.getProfileData();
                                    } else {
                                        profileDataNode = objectMapper.createObjectNode();
                                    }
                                    profileDataNode.set(
                                            stepId,
                                            objectMapper.valueToTree(stepData));
                                    profile.setProfileData(profileDataNode);
                                    markStepAsCompleted(profile, stepId);

                                    log.info("   └─ ✅ Step saved: {}", stepId);
                                    successCount++;
                                    stepResults.add(
                                            ProfileBuilderDto.BulkSetStepResult.builder()
                                                    .stepId(stepId)
                                                    .success(true)
                                                    .message("Step data saved successfully")
                                                    .errors(new HashMap<>())
                                                    .build());
                                } catch (Exception e) {
                                    log.error(
                                            "   └─ ❌ Failed to save step {}: {}",
                                            stepId,
                                            e.getMessage());
                                    failCount++;
                                    stepResults.add(
                                            ProfileBuilderDto.BulkSetStepResult.builder()
                                                    .stepId(stepId)
                                                    .success(false)
                                                    .message(
                                                            "Failed to save: " + e.getMessage())
                                                    .errors(new HashMap<>())
                                                    .build());
                                }
                            }

                            // Recalculate completion percentage
                            Map<String, Object> allProfileData = extractAllProfileData(profile);
                            int completionPercentage = calculateDynamicCompletionPercentage(
                                    allProfileData);
                            profile.setCompletionPercentage(completionPercentage);

                            final int finalSuccessCount = successCount;
                            final int finalFailCount = failCount;

                            return studentProfileRepository
                                    .save(profile)
                                    .map(savedProfile -> {
                                        log.info(
                                                "═══════════════════════════════════════════════════════════");
                                        log.info("✅ [BULK-SET] Completed");
                                        log.info(
                                                "   ├─ Total steps: {}",
                                                stepResults.size());
                                        log.info(
                                                "   ├─ Successful: {}",
                                                finalSuccessCount);
                                        log.info("   ├─ Failed: {}", finalFailCount);
                                        log.info(
                                                "   └─ Completion: {}%",
                                                completionPercentage);
                                        log.info(
                                                "═══════════════════════════════════════════════════════════");

                                        return ProfileBuilderDto.BulkSetResponse.builder()
                                                .success(finalFailCount == 0)
                                                .message(
                                                        finalFailCount == 0
                                                                ? "All steps saved successfully"
                                                                : finalSuccessCount +
                                                                        " steps saved, " +
                                                                        finalFailCount +
                                                                        " failed")
                                                .totalSteps(stepResults.size())
                                                .successfulSteps(finalSuccessCount)
                                                .failedSteps(finalFailCount)
                                                .completionPercentage(completionPercentage)
                                                .stepResults(stepResults)
                                                .validationErrors(allValidationErrors)
                                                .build();
                                    });
                        }))
                .onErrorResume(error -> {
                    log.error("❌ [BULK-SET] Error: {}", error.getMessage());
                    return Mono.just(
                            ProfileBuilderDto.BulkSetResponse.builder()
                                    .success(false)
                                    .message("Bulk set failed: " + error.getMessage())
                                    .totalSteps(0)
                                    .successfulSteps(0)
                                    .failedSteps(0)
                                    .stepResults(new ArrayList<>())
                                    .validationErrors(new HashMap<>())
                                    .build());
                });
    }

    /**
     * Get next step ID in the sequence
     */
    private String getNextStepId(String currentStepId) {
        int currentIndex = STEP_ORDER.indexOf(currentStepId);
        if (currentIndex >= 0 && currentIndex < STEP_ORDER.size() - 1) {
            return STEP_ORDER.get(currentIndex + 1);
        }
        return "completed"; // All steps completed
    }

    /**
     * Sync a document URL into the student profile after a successful upload.
     *
     * <p>
     * Called from StudentHandler immediately after
     * genericDocumentService.uploadDocument()
     * succeeds. Updates:
     * <ol>
     * <li>The dedicated column (leavingCertificateUrl, twelfthMarksheetUrl,
     * etc.)</li>
     * <li>The profileData.documents JSONB node for frontend display</li>
     * </ol>
     *
     * @param userId       Student user ID
     * @param documentType Type of document (e.g. LEAVING_CERTIFICATE, CV, PASSPORT)
     * @param fileUrl      S3 URL returned by the document upload
     * @return Updated StudentProfile
     */
    public Mono<StudentProfile> updateDocumentInProfile(
            Long userId,
            String documentType,
            String fileUrl) {
        log.info(
                "Syncing document type: {} URL to profile for user: {}",
                documentType,
                userId);
        return studentProfileRepository
                .findActiveByUserId(userId)
                .switchIfEmpty(createNewProfile(userId))
                .flatMap(profile -> {
                    // 1. Update the dedicated typed column
                    if (documentType != null) {
                        switch (documentType.toUpperCase()) {
                            case "CV":
                            case "RESUME":
                            case "CURRICULUM_VITAE":
                                profile.setCvResumeUrl(fileUrl);
                                break;
                            case "LEAVING_CERTIFICATE":
                                profile.setLeavingCertificateUrl(fileUrl);
                                break;
                            case "TWELFTH_MARKSHEET":
                            case "12TH_MARKSHEET":
                                profile.setTwelfthMarksheetUrl(fileUrl);
                                break;
                            case "TENTH_MARKSHEET":
                            case "10TH_MARKSHEET":
                                profile.setTenthMarksheetUrl(fileUrl);
                                break;
                            default:
                                break;
                        }
                    }

                    // 2. Also persist in profileData.documents JSONB for frontend
                    // Use canonical key mapping so all document types resolve to the same
                    // stable key that matches the Profile Builder config field names.
                    try {
                        JsonNode existingData = profile.getProfileData();
                        ObjectNode profileData = existingData != null
                                ? (ObjectNode) objectMapper.readTree(existingData.toString())
                                : objectMapper.createObjectNode();

                        ObjectNode documentsNode = profileData.has("documents") &&
                                profileData.get("documents").isObject()
                                        ? (ObjectNode) profileData.get("documents")
                                        : objectMapper.createObjectNode();

                        String docKey = resolveDocumentJsonKey(documentType);
                        documentsNode.put(docKey, fileUrl);
                        profileData.set("documents", documentsNode);
                        profile.setProfileData(profileData);
                    } catch (Exception e) {
                        log.warn(
                                "Failed to update profileData JSONB for document type: {}, error: {}",
                                documentType,
                                e.getMessage());
                    }
                    return studentProfileRepository.save(profile);
                })
                .doOnSuccess(profile -> log.info(
                        "✅ Synced document type: {} to profile for user: {}",
                        documentType,
                        userId))
                .doOnError(error -> log.error(
                        "❌ Failed to sync document type: {} to profile for user: {}",
                        documentType,
                        userId,
                        error));
    }

    /**
     * Resolve a stable, canonical JSONB key for the documents node.
     *
     * <p>
     * Maps any document_type string (including aliases and past typos) to
     * the same key that the Profile Builder config field uses as its {@code name}.
     * This ensures that even if the upload API is called with slightly different
     * strings, the profile always shows a clean, consistent document map.
     *
     * @param documentType raw document_type from the upload request
     * @return canonical key to use inside profileData.documents
     */
    private String resolveDocumentJsonKey(String documentType) {
        if (documentType == null)
            return "document_url";
        return switch (documentType.toUpperCase().trim()) {
            case "PASSPORT", "PASSPORT_COPY" -> "passport_copy";
            case "TRANSCRIPT", "TRANSCRIPTS", "ACADEMIC_TRANSCRIPT" -> "academic_transcripts";
            case "ENGLISH_TEST", "IELTS", "TOEFL", "PTE",
                    "DUOLINGO", "LANGUAGE_TEST" ->
                "test_score_reports";
            case "CV", "RESUME", "CURRICULUM_VITAE" -> "cv_resume";
            case "SOP", "STATEMENT_OF_PURPOSE" -> "statement_of_purpose";
            case "LOR", "RECOMMENDATION", "LETTER_OF_RECOMMENDATION" -> "letters_of_recommendation";
            case "DIPLOMA", "DEGREE_CERTIFICATE", "DEGREE_CERTIFICATES" -> "degree_certificates";
            case "FINANCIAL_PROOF", "FINANCIAL_DOCS",
                    "FINANCIAL_DOCUMENTS", "BANK_STATEMENT" ->
                "financial_documents";
            case "LEAVING_CERTIFICATE" -> "leaving_certificate_url";
            case "TWELFTH_MARKSHEET", "12TH_MARKSHEET",
                    "TWELVETH_MARKSHEET", "12_MARKSHEET" ->
                "twelfth_marksheet_url";
            case "TENTH_MARKSHEET", "10TH_MARKSHEET", "10_MARKSHEET" -> "tenth_marksheet_url";
            default -> documentType.toLowerCase().replace(" ", "_");
        };
    }

    /**
     * Get step order dynamically from config service, fallback to static
     */
    private Mono<List<String>> getStepOrderDynamic(String clientId) {
        String effectiveClientId = clientId != null ? clientId : "uni360";
        log.debug("🔍 Loading step order for client: {}", effectiveClientId);
        return configService
                .getStepOrder(effectiveClientId)
                .doOnNext(stepOrder -> log.info(
                        "✅ Loaded {} steps from config for client {}: {}",
                        stepOrder.size(),
                        effectiveClientId,
                        stepOrder))
                .filter(list -> !list.isEmpty())
                .switchIfEmpty(
                        Mono.defer(() -> {
                            log.warn(
                                    "⚠️ No steps found in config for client {}, using static fallback with {} steps",
                                    effectiveClientId,
                                    STEP_ORDER.size());
                            return Mono.just(STEP_ORDER);
                        }))
                .onErrorResume(error -> {
                    log.error(
                            "❌ Failed to load dynamic step order for client {}, using static fallback: {}",
                            effectiveClientId,
                            error.getMessage());
                    return Mono.just(STEP_ORDER);
                });
    }
}
