package com.uniflow.student.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.application.dto.ApplicationRequestDTO;
import com.uniflow.application.dto.ApplicationResponseDTO;
import com.uniflow.application.service.ApplicationService;
import com.uniflow.auth.util.JwtUtils;
import com.uniflow.common.dto.ApiResponse;
import com.uniflow.document.service.DocumentWorkflowService;
import com.uniflow.document.service.GenericDocumentService;
import com.uniflow.notification.service.NotificationService;
import com.uniflow.student.dto.ProfileBuilderDto;
import com.uniflow.student.dto.application.ApplicationProgressResponseDTO;
import com.uniflow.student.dto.application.ApplicationSubmissionResponseDTO;
import com.uniflow.student.dto.application.CreateApplicationRequestDTO;
import com.uniflow.student.dto.application.StudentApplicationsResponseDTO;
import com.uniflow.student.dto.dashboard.ApplicationSummaryDTO;
import com.uniflow.student.dto.dashboard.NotificationKPIDTO;
import com.uniflow.student.dto.dashboard.NotificationSummaryDTO;
import com.uniflow.student.dto.dashboard.ProfileProgressKPIDTO;
import com.uniflow.student.dto.dashboard.TaskProgressKPIDTO;
import com.uniflow.student.dto.document.StudentDocumentDTO;
import com.uniflow.student.dto.university.StudentCourseDTO;
import com.uniflow.student.dto.university.StudentUniversityCardDTO;
import com.uniflow.student.dto.university.StudentUniversityFiltersDTO;
import com.uniflow.student.dto.university.UniversityInfoPopupDTO;
import com.uniflow.student.entity.CourseFavorite;
import com.uniflow.student.repository.CourseFavoriteRepository;
import com.uniflow.student.repository.CourseFavoriteRepository;
import com.uniflow.student.service.ProfileBuilderService;
import com.uniflow.university.dto.UniversityResponseDTO;
import com.uniflow.university.entity.Course;
import com.uniflow.university.entity.University;
import com.uniflow.university.repository.CourseRepository;
import com.uniflow.university.repository.UniversityCriteriaRepository;
import com.uniflow.university.repository.UniversityRepository;
import com.uniflow.university.service.UniversityService;
import com.uniflow.workflow.service.TaskOrchestrationEngine;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * StudentHandler - Functional request handler for student-related operations
 *
 * <p>Handles all student profile and profile builder operations using Spring WebFlux functional
 * routing pattern. This handler manages the step-by-step profile creation workflow, dashboard data,
 * and student profile management.
 *
 * <p>Following the established functional routing pattern from other consolidated services.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StudentHandler {

    private final ProfileBuilderService profileBuilderService;
    private final ApplicationService applicationService;
    private final JwtUtils jwtUtils;
    private final UniversityRepository universityRepository;
    private final CourseRepository courseRepository;
    private final TaskOrchestrationEngine taskOrchestrationEngine;
    private final NotificationService notificationService;
    private final UniversityService universityService;
    private final UniversityCriteriaRepository universityCriteriaRepository;
    private final CourseFavoriteRepository courseFavoriteRepository;
    private final DocumentWorkflowService documentWorkflowService;
    private final GenericDocumentService genericDocumentService;
    private final com.uniflow.workflow.repository.WorkflowInstanceRepository workflowInstanceRepository;

    // ===== PROFILE BUILDER ENDPOINTS =====

    /** GET /api/v1/students/profile/builder - Get profile builder overview */
    public Mono<ServerResponse> getProfileBuilderOverview(
        ServerRequest request
    ) {
        final String clientId = request.headers().firstHeader("X-Client-ID");
        final String finalClientId = clientId != null ? clientId : "uni360";

        return extractUserIdFromRequest(request)
            .doOnNext(userId ->
                log.debug(
                    "Getting profile builder overview for user: {}, client: {}",
                    userId,
                    finalClientId
                )
            )
            .flatMap(userId ->
                profileBuilderService.getProfileBuilderOverview(
                    userId,
                    finalClientId
                )
            )
            .flatMap(overview ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            overview,
                            "Profile builder overview retrieved successfully"
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Failed to get profile builder overview: {}",
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "Failed to retrieve profile builder overview: " +
                                error.getMessage()
                        )
                    );
            });
    }

    /** GET /api/v1/students/profile/builder/current - Get current step (what's next) */
    public Mono<ServerResponse> getCurrentStep(ServerRequest request) {
        final String clientId = request.headers().firstHeader("X-Client-ID");
        final String finalClientId = clientId != null ? clientId : "uni360";

        return extractUserIdFromRequest(request)
            .doOnNext(userId ->
                log.debug(
                    "Getting current step for user: {}, client: {}",
                    userId,
                    finalClientId
                )
            )
            .flatMap(userId ->
                profileBuilderService.getCurrentStep(userId, finalClientId)
            )
            .flatMap(currentStep -> {
                String message = currentStep.isCompleted()
                    ? "Profile building completed! 🎉"
                    : "Current step retrieved successfully";

                return ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(currentStep, message));
            })
            .onErrorResume(error -> {
                log.error("Failed to get current step: {}", error.getMessage());
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "Failed to retrieve current step: " +
                                error.getMessage()
                        )
                    );
            });
    }

    /** POST /api/v1/students/profile/builder/next - Submit step and get next */
    public Mono<ServerResponse> submitStepAndGetNext(ServerRequest request) {
        return extractUserIdFromRequest(request)
            .doOnNext(userId ->
                log.debug("Submitting step for user: {}", userId)
            )
            .flatMap(userId ->
                request
                    .bodyToMono(ProfileBuilderDto.StepSubmissionRequest.class)
                    .flatMap(submissionRequest ->
                        profileBuilderService.submitStepAndGetNext(
                            userId,
                            submissionRequest
                        )
                    )
            )
            .flatMap(response -> {
                if (response.isSuccess()) {
                    return ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.success(
                                response,
                                "Step submitted successfully"
                            )
                        );
                } else {
                    return ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.error(response.getMessage()));
                }
            })
            .onErrorResume(error -> {
                log.error("Failed to submit step: {}", error.getMessage());
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "Failed to submit step: " + error.getMessage()
                        )
                    );
            });
    }

    /** POST /api/v1/students/profile/builder/validate/{stepId} - Validate and save specific step */
    public Mono<ServerResponse> validateAndSaveStep(ServerRequest request) {
        final String stepId = request.pathVariable("stepId");

        return extractUserIdFromRequest(request)
            .doOnNext(userId ->
                log.debug(
                    "Validating and saving step '{}' for user: {}",
                    stepId,
                    userId
                )
            )
            .flatMap(userId ->
                request
                    .bodyToMono(Map.class)
                    .cast(Map.class)
                    .flatMap(stepData -> {
                        // Create validation request
                        ProfileBuilderDto.ValidationRequest validationRequest =
                            ProfileBuilderDto.ValidationRequest.builder()
                                .stepId(stepId)
                                .data(stepData)
                                .build();

                        // Validate and save the step
                        return profileBuilderService.validateAndSaveStep(
                            userId,
                            validationRequest
                        );
                    })
            )
            .flatMap(response ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            response,
                            "Step validated and saved successfully"
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Failed to validate and save step '{}': {}",
                    stepId,
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "Failed to validate and save step: " +
                                error.getMessage()
                        )
                    );
            });
    }

    /** POST /api/v1/students/profile/builder/validate - Validate entire profile */
    public Mono<ServerResponse> validateEntireProfile(ServerRequest request) {
        return extractUserIdFromRequest(request)
            .doOnNext(userId ->
                log.debug("Validating entire profile for user: {}", userId)
            )
            .flatMap(userId ->
                profileBuilderService.validateEntireProfile(userId, null)
            )
            .flatMap(response ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            response,
                            "Profile validation completed"
                        )
                    )
            )
            .onErrorResume(error -> {
                String errorMessage =
                    error instanceof Throwable
                        ? ((Throwable) error).getMessage()
                        : error.toString();
                log.error(
                    "Failed to validate entire profile: {}",
                    errorMessage
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "Failed to validate profile: " + errorMessage
                        )
                    );
            });
    }

    /** POST /api/v1/students/profile/builder/validate - Legacy validate step (deprecated) */
    @Deprecated
    public Mono<ServerResponse> validateStep(ServerRequest request) {
        return extractUserIdFromRequest(request)
            .doOnNext(userId ->
                log.debug(
                    "Validating step for user: {} (legacy method)",
                    userId
                )
            )
            .flatMap(userId ->
                request
                    .bodyToMono(ProfileBuilderDto.ValidationRequest.class)
                    .flatMap(validationRequest ->
                        profileBuilderService.validateStep(
                            userId,
                            validationRequest
                        )
                    )
            )
            .flatMap(response ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(response, "Validation completed")
                    )
            )
            .onErrorResume(error -> {
                log.error("Profile validation failed: {}", error.getMessage());
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "Profile validation failed: " + error.getMessage()
                        )
                    );
            });
    }

    /** POST /api/v1/students/profile/builder/reset - Reset profile data and remove defaults */
    public Mono<ServerResponse> resetProfileData(ServerRequest request) {
        return extractUserIdFromRequest(request)
            .doOnNext(userId ->
                log.debug("Resetting profile data for user: {}", userId)
            )
            .flatMap(userId -> profileBuilderService.resetProfileData(userId))
            .flatMap(response ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            response,
                            "Profile data reset completed"
                        )
                    )
            )
            .onErrorResume(error -> {
                String errorMessage =
                    error instanceof Throwable
                        ? ((Throwable) error).getMessage()
                        : error.toString();
                log.error("Failed to reset profile data: {}", errorMessage);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "Failed to reset profile data: " + errorMessage
                        )
                    );
            });
    }

    /** POST /api/v1/students/profile/builder/set - Bulk set profile data for multiple steps */
    public Mono<ServerResponse> bulkSetProfileData(ServerRequest request) {
        log.info("🔄 POST /api/v1/students/profile/builder/set");

        return extractUserIdFromRequest(request)
            .doOnNext(userId ->
                log.info("🔍 Bulk setting profile data for userId: {}", userId)
            )
            .flatMap(userId ->
                request
                    .bodyToMono(ProfileBuilderDto.BulkSetRequest.class)
                    .flatMap(bulkRequest ->
                        profileBuilderService.bulkSetProfileData(
                            userId,
                            bulkRequest
                        )
                    )
            )
            .flatMap(response ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            response,
                            response.isSuccess()
                                ? "Profile data set successfully"
                                : "Profile data set completed with errors"
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "❌ Failed to bulk set profile data: {}",
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "Failed to set profile data: " + error.getMessage()
                        )
                    );
            });
    }

    /** GET /api/v1/students/profile/builder/steps/{stepId} - Get step details */
    public Mono<ServerResponse> getStepDetails(ServerRequest request) {
        String stepId = request.pathVariable("stepId");
        final String clientId = request.headers().firstHeader("X-Client-ID");
        final String finalClientId = clientId != null ? clientId : "uni360";

        return extractUserIdFromRequest(request)
            .doOnNext(userId ->
                log.debug(
                    "Getting step details for step '{}', user: {}, client: {}",
                    stepId,
                    userId,
                    finalClientId
                )
            )
            .flatMap(userId ->
                profileBuilderService.getStepDetails(
                    userId,
                    stepId,
                    finalClientId
                )
            )
            .flatMap(response ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            response,
                            "Step details retrieved successfully"
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Failed to get step details for step '{}': {}",
                    stepId,
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "Failed to retrieve step details: " +
                                error.getMessage()
                        )
                    );
            });
    }

    /** PUT /api/v1/students/profile/builder/steps/{stepId} - Update step data */
    public Mono<ServerResponse> updateStep(ServerRequest request) {
        String stepId = request.pathVariable("stepId");

        return extractUserIdFromRequest(request)
            .doOnNext(userId ->
                log.debug("Updating step '{}' for user: {}", stepId, userId)
            )
            .flatMap(userId ->
                request
                    .bodyToMono(ProfileBuilderDto.StepSubmissionRequest.class)
                    .doOnNext(req -> req.setStepId(stepId)) // Ensure stepId matches path variable
                    .flatMap(submissionRequest ->
                        profileBuilderService.submitStepAndGetNext(
                            userId,
                            submissionRequest
                        )
                    )
            )
            .flatMap(response -> {
                if (response.isSuccess()) {
                    return ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.success(
                                response,
                                "Step updated successfully"
                            )
                        );
                } else {
                    return ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.error(response.getMessage()));
                }
            })
            .onErrorResume(error -> {
                log.error(
                    "Failed to update step '{}': {}",
                    stepId,
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "Failed to update step: " + error.getMessage()
                        )
                    );
            });
    }

    /** GET /api/v1/students/profile/builder/progress - Get profile building progress */
    public Mono<ServerResponse> getProgress(ServerRequest request) {
        final String clientId = request.headers().firstHeader("X-Client-ID");
        final String finalClientId = clientId != null ? clientId : "uni360";

        return extractUserIdFromRequest(request)
            .doOnNext(userId ->
                log.debug(
                    "Getting progress for user: {}, client: {}",
                    userId,
                    finalClientId
                )
            )
            .flatMap(userId ->
                profileBuilderService.getProfileBuilderOverview(userId, null)
            )
            .map(response -> response.getProgress())
            .flatMap(progress ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            progress,
                            "Progress retrieved successfully"
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error("Failed to get progress: {}", error.getMessage());
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "Failed to retrieve progress: " + error.getMessage()
                        )
                    );
            });
    }

    // ===== STUDENT DASHBOARD ENDPOINTS =====

    /** GET /api/v1/students/dashboard - Get student dashboard data */
    public Mono<ServerResponse> getStudentDashboard(ServerRequest request) {
        return extractUserIdFromRequest(request)
            .doOnNext(userId ->
                log.debug(
                    "Getting enhanced student dashboard for user: {}",
                    userId
                )
            )
            .flatMap(userId ->
                Mono.zip(
                    profileBuilderService.getStudentDashboard(userId),
                    buildProfileProgressKPI(userId),
                    buildTaskProgressKPI(userId),
                    buildNotificationKPI(userId)
                ).map(tuple -> {
                    var originalDashboard = tuple.getT1();
                    var profileKPI = tuple.getT2();
                    var taskKPI = tuple.getT3();
                    var notificationKPI = tuple.getT4();

                    // Create enhanced dashboard response with KPIs
                    return Map.of(
                        "originalDashboard",
                        originalDashboard,
                        "kpiCards",
                        Map.of(
                            "profileProgress",
                            profileKPI,
                            "taskProgress",
                            taskKPI,
                            "notifications",
                            notificationKPI
                        )
                    );
                })
            )
            .flatMap(enhancedResponse ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            enhancedResponse,
                            "Enhanced student dashboard retrieved successfully"
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Failed to get enhanced student dashboard: {}",
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "Failed to retrieve enhanced student dashboard: " +
                                error.getMessage()
                        )
                    );
            });
    }

    // ===== DASHBOARD KPI ENDPOINTS (ST-02) =====

    /** GET /api/v1/students/dashboard/profile-progress - Get Profile Progress KPI */
    public Mono<ServerResponse> getProfileProgressKPI(ServerRequest request) {
        return extractUserIdFromRequest(request)
            .doOnNext(userId ->
                log.debug("Getting profile progress KPI for user: {}", userId)
            )
            .flatMap(this::buildProfileProgressKPI)
            .flatMap(kpi ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            kpi,
                            "Profile progress KPI retrieved successfully"
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Failed to get profile progress KPI: {}",
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "Failed to retrieve profile progress KPI: " +
                                error.getMessage()
                        )
                    );
            });
    }

    /** GET /api/v1/students/dashboard/task-progress - Get Application/Tasks Progress KPI */
    public Mono<ServerResponse> getApplicationTasksProgressKPI(
        ServerRequest request
    ) {
        return extractUserIdFromRequest(request)
            .doOnNext(userId ->
                log.debug("Getting task progress KPI for user: {}", userId)
            )
            .flatMap(this::buildTaskProgressKPI)
            .flatMap(kpi ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            kpi,
                            "Task progress KPI retrieved successfully"
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Failed to get task progress KPI: {}",
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "Failed to retrieve task progress KPI: " +
                                error.getMessage()
                        )
                    );
            });
    }

    /** GET /api/v1/students/dashboard/notifications - Get Recent Notifications KPI */
    public Mono<ServerResponse> getRecentNotificationsKPI(
        ServerRequest request
    ) {
        return extractUserIdFromRequest(request)
            .doOnNext(userId ->
                log.debug("Getting notifications KPI for user: {}", userId)
            )
            .flatMap(this::buildNotificationKPI)
            .flatMap(kpi ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            kpi,
                            "Notifications KPI retrieved successfully"
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Failed to get notifications KPI: {}",
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "Failed to retrieve notifications KPI: " +
                                error.getMessage()
                        )
                    );
            });
    }

    // ===== KPI BUILDER METHODS =====

    /**
     * Build Profile Progress KPI data
     */
    private Mono<ProfileProgressKPIDTO> buildProfileProgressKPI(Long userId) {
        return profileBuilderService
            .getProfileSummary(userId)
            .map(profileSummary -> {
                // Extract real completion percentage from profile
                Integer completionPercentageObj =
                    profileSummary.getSummary() != null
                        ? profileSummary.getSummary().getCompletionPercentage()
                        : null;
                int completionPercentage =
                    completionPercentageObj != null
                        ? completionPercentageObj
                        : 0;

                // Define total sections (based on typical profile sections)
                int totalSections = 8; // Personal, Education, Experience, Documents, Preferences, etc.
                int completedSections = (int) Math.ceil(
                    (completionPercentage / 100.0) * totalSections
                );
                int missingSections = totalSections - completedSections;

                // Determine completion status
                String completionStatus = determineCompletionStatus(
                    completionPercentage
                );
                String profileStrength = determineProfileStrength(
                    completionPercentage
                );

                // Build missing steps
                List<ProfileProgressKPIDTO.MissingProfileStep> missingSteps =
                    buildMissingProfileSteps(completionPercentage);

                return ProfileProgressKPIDTO.builder()
                    .completionPercentage(completionPercentage)
                    .totalSections(totalSections)
                    .completedSections(completedSections)
                    .missingSections(missingSections)
                    .completionStatus(completionStatus)
                    .nextRecommendedStep(
                        getNextRecommendedStep(completionPercentage)
                    )
                    .missingSteps(missingSteps)
                    .profileStrength(profileStrength)
                    .estimatedTimeToComplete(
                        calculateEstimatedTime(missingSections)
                    )
                    .build();
            });
    }

    /**
     * Build Task Progress KPI data
     */
    private Mono<TaskProgressKPIDTO> buildTaskProgressKPI(Long userId) {
        return applicationService
            .getStudentApplications(userId, null, null, 0, 50, "uni360")
            .map(this::convertToApplicationSummary)
            .collectList()
            .map(applications -> {
                // Calculate real task metrics from applications
                int totalApplications = applications.size();
                int completedApplications = (int) applications
                    .stream()
                    .filter(ApplicationSummaryDTO::isCompleted)
                    .count();
                int activeApplications = (int) applications
                    .stream()
                    .filter(ApplicationSummaryDTO::isActive)
                    .count();
                int pendingApplications =
                    totalApplications - completedApplications;

                // Estimate tasks: 5 per application
                int totalTasks = totalApplications * 5;
                int completedTasks = completedApplications * 5;
                int pendingTasks = pendingApplications * 5;
                int overdueTasks = Math.max(
                    0,
                    pendingApplications - activeApplications
                );

                int overallCompletionPercentage =
                    totalTasks > 0 ? (completedTasks * 100) / totalTasks : 0;

                String progressStatus = determineTaskProgressStatus(
                    overallCompletionPercentage,
                    overdueTasks,
                    pendingTasks
                );

                // Build application progress list
                List<
                    TaskProgressKPIDTO.ApplicationProgress
                > applicationProgressList = buildApplicationProgressList(
                    applications
                );

                return TaskProgressKPIDTO.builder()
                    .overallCompletionPercentage(overallCompletionPercentage)
                    .totalTasks(totalTasks)
                    .completedTasks(completedTasks)
                    .pendingTasks(pendingTasks)
                    .overdueTasks(overdueTasks)
                    .progressStatus(progressStatus)
                    .nextUrgentTask(getNextUrgentTask(applications))
                    .activeApplications(applicationProgressList)
                    .recentActivity(getRecentTaskActivity(applications))
                    .estimatedCompletionDate(
                        calculateEstimatedCompletionDate(applications)
                    )
                    .build();
            });
    }

    /**
     * Build Notification KPI data
     */
    private Mono<NotificationKPIDTO> buildNotificationKPI(Long userId) {
        return Mono.zip(
            notificationService.getUnreadCount(userId),
            notificationService
                .getUserNotifications(userId, 0, 20)
                .map(this::convertToNotificationSummary)
                .collectList()
        ).map(tuple -> {
            Long unreadCountLong = tuple.getT1();
            Integer unreadCount = unreadCountLong.intValue();
            var notifications = tuple.getT2();

            int totalCount = notifications.size();
            LocalDateTime sevenDaysAgo = LocalDateTime.now().minus(
                7,
                ChronoUnit.DAYS
            );
            int recentCount = (int) notifications
                .stream()
                .filter(
                    n ->
                        n.getCreatedAt() != null &&
                        n.getCreatedAt().isAfter(sevenDaysAgo)
                )
                .count();

            int highPriorityCount = (int) notifications
                .stream()
                .filter(NotificationSummaryDTO::isHighPriority)
                .count();

            LocalDateTime lastNotificationTime = notifications.isEmpty()
                ? null
                : notifications.get(0).getCreatedAt();

            String notificationStatus = determineNotificationStatus(
                recentCount,
                unreadCount
            );
            String mostRecentPreview = notifications.isEmpty()
                ? "No recent notifications"
                : notifications.get(0).getMessage();

            // Build recent notifications list
            List<NotificationKPIDTO.RecentNotification> recentNotifications =
                buildRecentNotificationsList(notifications);

            // Build breakdown
            NotificationKPIDTO.NotificationBreakdown breakdown =
                buildNotificationBreakdown(notifications);

            return NotificationKPIDTO.builder()
                .unreadCount(unreadCount)
                .totalCount(totalCount)
                .recentCount(recentCount)
                .highPriorityCount(highPriorityCount)
                .lastNotificationTime(lastNotificationTime)
                .notificationStatus(notificationStatus)
                .mostRecentPreview(mostRecentPreview)
                .recentNotifications(recentNotifications)
                .breakdown(breakdown)
                .build();
        });
    }

    // ===== HELPER METHODS FOR KPI CALCULATIONS =====

    private String determineCompletionStatus(int percentage) {
        if (percentage >= 90) return "COMPLETE";
        if (percentage >= 70) return "MOSTLY_COMPLETE";
        return "INCOMPLETE";
    }

    private String determineProfileStrength(int percentage) {
        if (percentage >= 85) return "EXCELLENT";
        if (percentage >= 70) return "STRONG";
        if (percentage >= 50) return "MODERATE";
        return "WEAK";
    }

    private List<
        ProfileProgressKPIDTO.MissingProfileStep
    > buildMissingProfileSteps(int completionPercentage) {
        List<ProfileProgressKPIDTO.MissingProfileStep> steps =
            new ArrayList<>();

        if (completionPercentage < 20) {
            steps.add(
                ProfileProgressKPIDTO.MissingProfileStep.builder()
                    .stepName("Personal Information")
                    .description("Complete your basic personal details")
                    .priority("HIGH")
                    .estimatedMinutes(5)
                    .completionUrl("/profile/personal")
                    .build()
            );
        }

        if (completionPercentage < 40) {
            steps.add(
                ProfileProgressKPIDTO.MissingProfileStep.builder()
                    .stepName("Education Background")
                    .description("Add your educational qualifications")
                    .priority("HIGH")
                    .estimatedMinutes(10)
                    .completionUrl("/profile/education")
                    .build()
            );
        }

        if (completionPercentage < 60) {
            steps.add(
                ProfileProgressKPIDTO.MissingProfileStep.builder()
                    .stepName("Academic Preferences")
                    .description("Set your study preferences and goals")
                    .priority("MEDIUM")
                    .estimatedMinutes(8)
                    .completionUrl("/profile/preferences")
                    .build()
            );
        }

        return steps;
    }

    private String getNextRecommendedStep(int completionPercentage) {
        if (completionPercentage < 20) return "Complete Personal Information";
        if (completionPercentage < 40) return "Add Education Background";
        if (completionPercentage < 60) return "Set Academic Preferences";
        if (completionPercentage < 80) return "Upload Documents";
        return "Review and Submit Profile";
    }

    private String calculateEstimatedTime(int missingSections) {
        int minutes = missingSections * 7; // Average 7 minutes per section
        if (minutes < 60) return minutes + " minutes";
        int hours = minutes / 60;
        int remainingMinutes = minutes % 60;
        return hours + "h " + remainingMinutes + "m";
    }

    private String determineTaskProgressStatus(
        int percentage,
        int overdue,
        int pending
    ) {
        if (percentage == 100) return "COMPLETED";
        if (overdue > 0) return "CRITICAL";
        if (percentage < 50 && pending > 5) return "BEHIND_SCHEDULE";
        return "ON_TRACK";
    }

    private List<
        TaskProgressKPIDTO.ApplicationProgress
    > buildApplicationProgressList(List<ApplicationSummaryDTO> applications) {
        return applications
            .stream()
            .filter(ApplicationSummaryDTO::isActive)
            .limit(5) // Show top 5 active applications
            .map(app -> {
                int completionPercentage =
                    calculateApplicationCompletionPercentage(app);
                return TaskProgressKPIDTO.ApplicationProgress.builder()
                    .applicationId(
                        app.getId() != null
                            ? app.getId().toString()
                            : (app.getReferenceNumber() != null
                                  ? app.getReferenceNumber()
                                  : "Unknown")
                    )
                    .universityName(
                        app.getUniversityName() != null
                            ? app.getUniversityName()
                            : "Unknown University"
                    )
                    .programName(
                        app.getCourseName() != null
                            ? app.getCourseName()
                            : "Unknown Program"
                    )
                    .status(app.getStatus() != null ? app.getStatus() : "DRAFT")
                    .completionPercentage(completionPercentage)
                    .pendingTasks(
                        calculatePendingTasksForApplication(
                            completionPercentage
                        )
                    )
                    .nextDeadline(calculateNextDeadline(app))
                    .priority(determinePriority(app.getStatus()))
                    .currentStage(determineCurrentStage(app.getStatus()))
                    .build();
            })
            .toList();
    }

    private int calculateApplicationProgress(String status) {
        if (status == null) return 10;
        return switch (status.toUpperCase()) {
            case "DRAFT" -> 20;
            case "IN_PROGRESS" -> 60;
            case "SUBMITTED" -> 90;
            case "ACCEPTED", "REJECTED" -> 100;
            default -> 10;
        };
    }

    private int calculatePendingTasks(int completionPercentage) {
        return Math.max(0, 5 - (completionPercentage / 20));
    }

    private String determinePriority(String status) {
        if (status == null) return "MEDIUM";
        return switch (status.toUpperCase()) {
            case "DRAFT" -> "HIGH";
            case "IN_PROGRESS" -> "HIGH";
            case "SUBMITTED" -> "MEDIUM";
            default -> "LOW";
        };
    }

    private String determineCurrentStage(String status) {
        if (status == null) return "Initial Setup";
        return switch (status.toUpperCase()) {
            case "DRAFT" -> "Profile Completion";
            case "IN_PROGRESS" -> "Document Submission";
            case "SUBMITTED" -> "Under Review";
            case "ACCEPTED" -> "Enrollment";
            case "REJECTED" -> "Completed";
            default -> "Initial Setup";
        };
    }

    private String getNextUrgentTask(List<ApplicationSummaryDTO> applications) {
        return applications
            .stream()
            .filter(
                app ->
                    "DRAFT".equals(app.getStatus()) ||
                    "IN_PROGRESS".equals(app.getStatus())
            )
            .findFirst()
            .map(
                app ->
                    "Complete application for " +
                    (app.getUniversityName() != null
                        ? app.getUniversityName()
                        : "University")
            )
            .orElse("No urgent tasks");
    }

    private String getRecentTaskActivity(
        List<ApplicationSummaryDTO> applications
    ) {
        long recentActivity = applications
            .stream()
            .filter(
                app ->
                    app.getUpdatedAt() != null &&
                    app.getUpdatedAt().isAfter(LocalDateTime.now().minusDays(7))
            )
            .count();

        if (recentActivity > 0) {
            return recentActivity + " application(s) updated recently";
        }
        return "No recent activity";
    }

    private LocalDateTime calculateEstimatedCompletionDate(
        List<ApplicationSummaryDTO> applications
    ) {
        long pendingApplications = applications
            .stream()
            .filter(
                app ->
                    "DRAFT".equals(app.getStatus()) ||
                    "IN_PROGRESS".equals(app.getStatus())
            )
            .count();

        if (pendingApplications == 0) return LocalDateTime.now();

        // Estimate 14 days per pending application
        return LocalDateTime.now().plusDays(pendingApplications * 14);
    }

    private String determineNotificationStatus(
        int recentCount,
        int unreadCount
    ) {
        if (recentCount == 0) return "NONE";
        if (recentCount <= 2 && unreadCount <= 1) return "LOW_ACTIVITY";
        if (recentCount <= 5 && unreadCount <= 3) return "MODERATE_ACTIVITY";
        return "HIGH_ACTIVITY";
    }

    private List<
        NotificationKPIDTO.RecentNotification
    > buildRecentNotificationsList(List<NotificationSummaryDTO> notifications) {
        return notifications
            .stream()
            .limit(5)
            .map(notification ->
                NotificationKPIDTO.RecentNotification.builder()
                    .notificationId(
                        notification.getNotificationId() != null
                            ? notification.getNotificationId().toString()
                            : "Unknown"
                    )
                    .title(
                        notification.getTitle() != null
                            ? notification.getTitle()
                            : "Notification"
                    )
                    .message(
                        notification.getMessage() != null
                            ? notification.getMessage()
                            : ""
                    )
                    .type(
                        notification.getType() != null
                            ? notification.getType()
                            : "GENERAL"
                    )
                    .priority(
                        notification.getPriority() != null
                            ? notification.getPriority()
                            : "MEDIUM"
                    )
                    .isRead(
                        notification.getIsRead() != null
                            ? notification.getIsRead()
                            : false
                    )
                    .receivedAt(notification.getCreatedAt())
                    .relatedApplicationId(notification.getApplicationId())
                    .actionUrl(notification.getActionUrl())
                    .timeAgo(notification.getTimeAgo())
                    .build()
            )
            .toList();
    }

    private NotificationKPIDTO.NotificationBreakdown buildNotificationBreakdown(
        List<NotificationSummaryDTO> notifications
    ) {
        return NotificationKPIDTO.NotificationBreakdown.builder()
            .applicationUpdates(
                countNotificationsByType(notifications, "APPLICATION_UPDATE")
            )
            .documentReviews(
                countNotificationsByType(notifications, "DOCUMENT_REVIEW")
            )
            .taskReminders(
                countNotificationsByType(notifications, "TASK_REMINDER")
            )
            .deadlineAlerts(
                countNotificationsByType(notifications, "DEADLINE_ALERT")
            )
            .systemAnnouncements(
                countNotificationsByType(notifications, "SYSTEM_ANNOUNCEMENT")
            )
            .paymentNotifications(
                countNotificationsByType(notifications, "PAYMENT_NOTIFICATION")
            )
            .universityCommunications(
                countNotificationsByType(
                    notifications,
                    "UNIVERSITY_COMMUNICATION"
                )
            )
            .build();
    }

    private int countNotificationsByType(
        List<NotificationSummaryDTO> notifications,
        String type
    ) {
        return (int) notifications
            .stream()
            .filter(n -> type.equals(n.getType()))
            .count();
    }

    private String calculateTimeAgo(LocalDateTime dateTime) {
        long minutes = ChronoUnit.MINUTES.between(
            dateTime,
            LocalDateTime.now()
        );

        if (minutes < 60) return minutes + " minutes ago";

        long hours = minutes / 60;
        if (hours < 24) return hours + " hours ago";

        long days = hours / 24;
        if (days < 30) return days + " days ago";

        long months = days / 30;
        return months + " months ago";
    }

    // ===== CONVERSION METHODS =====

    /**
     * Convert ApplicationResponseDTO to ApplicationSummaryDTO
     */
    private ApplicationSummaryDTO convertToApplicationSummary(
        com.uniflow.application.dto.ApplicationResponseDTO appResponse
    ) {
        return ApplicationSummaryDTO.builder()
            .id(appResponse.getId())
            .referenceNumber(appResponse.getReferenceNumber())
            .studentId(appResponse.getStudentId())
            .targetUniversityId(appResponse.getTargetUniversityId())
            .targetCourseId(appResponse.getTargetCourseId())
            .universityName("Unknown University") // Placeholder - would need to resolve from university ID
            .courseName("Unknown Course") // Placeholder - would need to resolve from course ID
            .status(appResponse.getStatus())
            .applicationType(appResponse.getApplicationType())
            .programLevel(appResponse.getProgramLevel())
            .targetSemester(appResponse.getTargetSemester())
            .targetYear(appResponse.getTargetYear())
            .priority(appResponse.getPriority())
            .workflowStage(appResponse.getWorkflowStage())
            .createdAt(appResponse.getCreatedAt())
            .updatedAt(appResponse.getUpdatedAt())
            .submittedAt(appResponse.getSubmittedAt())
            .countryCode(appResponse.getCountryCode())
            .isSubmitted(appResponse.getSubmittedAt() != null)
            .progressPercentage(
                calculateProgressPercentage(appResponse.getStatus())
            )
            .build();
    }

    /**
     * Convert Notification to NotificationSummaryDTO
     */
    private NotificationSummaryDTO convertToNotificationSummary(
        com.uniflow.notification.model.Notification notification
    ) {
        return NotificationSummaryDTO.builder()
            .notificationId(notification.getId())
            .userId(notification.getUserId())
            .senderId(notification.getSenderId())
            .type(
                notification.getType() != null
                    ? notification.getType().toString()
                    : null
            )
            .title(notification.getTitle())
            .message(notification.getMessage())
            .status(
                notification.getStatus() != null
                    ? notification.getStatus().toString()
                    : null
            )
            .priority(determinePriorityFromType(notification.getType()))
            .actionUrl(notification.getActionUrl())
            .applicationId(extractApplicationIdFromMetadata(notification))
            .createdAt(notification.getCreatedAt())
            .readAt(notification.getReadAt())
            .isRead(notification.getReadAt() != null)
            .contentType(
                notification.getContentType() != null
                    ? notification.getContentType().toString()
                    : null
            )
            .build();
    }

    private int calculateProgressPercentage(String status) {
        if (status == null) return 10;
        return switch (status.toUpperCase()) {
            case "DRAFT" -> 20;
            case "IN_PROGRESS" -> 60;
            case "SUBMITTED" -> 90;
            case "ACCEPTED", "REJECTED", "ENROLLED" -> 100;
            default -> 10;
        };
    }

    private String determinePriorityFromType(
        com.uniflow.notification.model.NotificationType type
    ) {
        if (type == null) return "MEDIUM";

        return switch (type.toString().toUpperCase()) {
            case "DEADLINE_ALERT", "URGENT_TASK" -> "HIGH";
            case "DOCUMENT_REVIEW", "APPLICATION_UPDATE" -> "HIGH";
            case "TASK_REMINDER" -> "MEDIUM";
            case "SYSTEM_ANNOUNCEMENT" -> "LOW";
            default -> "MEDIUM";
        };
    }

    private String extractApplicationIdFromMetadata(
        com.uniflow.notification.model.Notification notification
    ) {
        // Try to extract application ID from metadata or return null
        if (
            notification.getMetadata() != null &&
            notification.getMetadata().has("applicationId")
        ) {
            return notification.getMetadata().get("applicationId").asText();
        }
        return null;
    }

    private int calculateApplicationCompletionPercentage(
        ApplicationSummaryDTO app
    ) {
        if (app.getProgressPercentage() != null) {
            return app.getProgressPercentage();
        }
        return calculateProgressPercentage(app.getStatus());
    }

    private int calculatePendingTasksForApplication(int completionPercentage) {
        return Math.max(0, 5 - (completionPercentage / 20));
    }

    private LocalDateTime calculateNextDeadline(ApplicationSummaryDTO app) {
        // If we have real deadline data, use it; otherwise estimate
        return LocalDateTime.now().plusDays(14);
    }

    // ===== PROFILE MANAGEMENT ENDPOINTS =====

    /** GET /api/v1/students/profile - Get student profile */
    public Mono<ServerResponse> getStudentProfile(ServerRequest request) {
        return extractUserIdFromRequest(request)
            .doOnNext(userId ->
                log.debug("Getting student profile for user: {}", userId)
            )
            .flatMap(userId -> profileBuilderService.getProfileSummary(userId))
            .map(response -> response.getProfileData(null))
            .flatMap(profileData ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.success(
                            profileData,
                            "Student profile retrieved successfully"
                        )
                    )
            )
            .onErrorResume(error -> {
                log.error(
                    "Failed to get student profile: {}",
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "Failed to retrieve student profile: " +
                                error.getMessage()
                        )
                    );
            });
    }

    /** GET /api/v1/students/profile/summary - Get profile summary */
    public Mono<ServerResponse> getProfileSummary(ServerRequest request) {
        return extractUserIdFromRequest(request)
            .doOnNext(userId ->
                log.debug("Getting profile summary for user: {}", userId)
            )
            .flatMap(userId -> profileBuilderService.getProfileSummary(userId))
            .flatMap(summary ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(summary)
            )
            .onErrorResume(error -> {
                log.error(
                    "Failed to get profile summary: {}",
                    error.getMessage()
                );
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            "Failed to retrieve profile summary: " +
                                error.getMessage()
                        )
                    );
            });
    }

    // ===== HELPER METHODS =====

    /**
     * Extract user ID from JWT token in request
     * Returns Mono<Long> for reactive processing
     */
    private Mono<Long> extractUserIdFromRequest(ServerRequest request) {
        return jwtUtils
            .getUserIdFromServerRequest(request)
            .onErrorMap(error -> {
                log.error(
                    "Failed to extract user ID from JWT token: {}",
                    error.getMessage()
                );
                return new SecurityException(
                    "Authentication required: Invalid or missing JWT token"
                );
            });
    }

    /** Validate required parameters */
    private void validateRequiredParams(
        ServerRequest request,
        String... paramNames
    ) {
        for (String paramName : paramNames) {
            if (!request.queryParam(paramName).isPresent()) {
                throw new IllegalArgumentException(
                    "Required parameter missing: " + paramName
                );
            }
        }
    }

    // ===== APPLICATION MANAGEMENT ENDPOINTS =====

    /** POST /api/v1/students/applications - Create new application */
    public Mono<ServerResponse> createApplication(ServerRequest request) {
        final String clientId = request.headers().firstHeader("X-Client-ID");

        return request
            .bodyToMono(CreateApplicationRequestDTO.class)
            .doOnNext(dto -> {
                dto.setDefaults(); // Set default values
                log.info(
                    "Creating application for student: {}",
                    dto.getStudentId()
                );
            })
            .flatMap(dto -> {
                // Validate required fields
                if (!dto.isValid()) {
                    return Mono.error(
                        new IllegalArgumentException(
                            "Missing required fields: targetUniversityId, targetCourseId, targetSemester, and targetYear are mandatory"
                        )
                    );
                }
                return Mono.just(dto);
            })
            .map(this::convertToApplicationRequestDTO) // Convert to legacy DTO
            .flatMap(dto ->
                extractUserIdFromRequest(request).flatMap(userId ->
                    applicationService
                        .createApplication(dto, userId, clientId)
                        .flatMap(application ->
                            ServerResponse.ok()
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(ApiResponse.success(application))
                        )
                )
            )
            .onErrorResume(e -> {
                log.error("Error creating application", e);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error(e.getMessage()));
            });
    }

    /** GET /api/v1/students/applications - Get student's applications */
    public Mono<ServerResponse> getStudentApplications(ServerRequest request) {
        final String clientId = request.headers().firstHeader("X-Client-ID");

        // Extract pagination parameters
        int page = request.queryParam("page").map(Integer::parseInt).orElse(0);
        int size = request.queryParam("size").map(Integer::parseInt).orElse(10);

        // Extract filter parameters
        String status = request.queryParam("status").orElse(null);
        String countryCode = request.queryParam("countryCode").orElse(null);

        return extractUserIdFromRequest(request)
            .flatMap(userId ->
                applicationService
                    .getStudentApplications(
                        userId,
                        status,
                        countryCode,
                        page,
                        size,
                        clientId
                    )
                    .collectList()
                    .flatMap(applications -> {
                        return Flux.fromIterable(applications)
                            .flatMap(this::convertToStudentApplicationSummary)
                            .collectList()
                            .flatMap(convertedApplications -> {
                                StudentApplicationsResponseDTO response =
                                    StudentApplicationsResponseDTO.builder()
                                        .applications(convertedApplications)
                                        .pagination(
                                            StudentApplicationsResponseDTO.PaginationDTO.builder()
                                                .page(page)
                                                .size(size)
                                                .total(
                                                    (long) applications.size()
                                                )
                                                .totalPages(
                                                    (applications.size() +
                                                            size -
                                                            1) /
                                                        size
                                                )
                                                .hasNext(
                                                    applications.size() == size
                                                )
                                                .hasPrevious(page > 0)
                                                .build()
                                        )
                                        .summary(
                                            StudentApplicationsResponseDTO.ApplicationSummaryStatsDTO.builder()
                                                .totalApplications(
                                                    applications.size()
                                                )
                                                .submittedApplications(
                                                    (int) applications
                                                        .stream()
                                                        .filter(app ->
                                                            "submitted".equals(
                                                                app.getStatus()
                                                            )
                                                        )
                                                        .count()
                                                )
                                                .build()
                                        )
                                        .timestamp(LocalDateTime.now())
                                        .build();

                                return ServerResponse.ok()
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .bodyValue(ApiResponse.success(response));
                            });
                    })
            )
            .onErrorResume(e -> {
                log.error("Error getting student applications", e);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error(e.getMessage()));
            });
    }

    /** GET /api/v1/students/applications/{id} - Get specific application */
    public Mono<ServerResponse> getApplicationById(ServerRequest request) {
        final String clientId = request.headers().firstHeader("X-Client-ID");

        UUID applicationId = UUID.fromString(request.pathVariable("id"));

        return extractUserIdFromRequest(request)
            .flatMap(userId ->
                applicationService
                    .getApplicationById(applicationId, userId, clientId)
                    .flatMap(application ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(ApiResponse.success(application))
                    )
                    .switchIfEmpty(ServerResponse.notFound().build())
            )
            .onErrorResume(e -> {
                log.error("Error getting application by ID", e);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error(e.getMessage()));
            });
    }

    /** PUT /api/v1/students/applications/{id} - Update application */
    public Mono<ServerResponse> updateApplication(ServerRequest request) {
        final String clientId = request.headers().firstHeader("X-Client-ID");

        UUID applicationId = UUID.fromString(request.pathVariable("id"));

        return extractUserIdFromRequest(request)
            .flatMap(userId ->
                request
                    .bodyToMono(Map.class)
                    .flatMap(updateData ->
                        applicationService.updateApplicationData(
                            applicationId,
                            updateData,
                            userId,
                            clientId
                        )
                    )
                    .flatMap(application ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(ApiResponse.success(application))
                    )
                    .switchIfEmpty(ServerResponse.notFound().build())
            )
            .onErrorResume(e -> {
                log.error("Error updating application", e);
                String errorMessage =
                    e instanceof Throwable
                        ? ((Throwable) e).getMessage()
                        : e.toString();
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error(errorMessage));
            });
    }

    /** POST /api/v1/students/applications/{id}/submit - Submit application (triggers workflow) */
    public Mono<ServerResponse> submitApplication(ServerRequest request) {
        final String clientId = request.headers().firstHeader("X-Client-ID");

        UUID applicationId = UUID.fromString(request.pathVariable("id"));

        return extractUserIdFromRequest(request)
            .flatMap(userId ->
                request
                    .bodyToMono(Map.class) // For submission confirmation and additional data
                    .defaultIfEmpty(Map.of())
                    .flatMap(submissionData ->
                        applicationService.submitApplication(
                            applicationId,
                            userId,
                            submissionData,
                            clientId
                        )
                    )
                    .flatMap(result ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(ApiResponse.success(result))
                    )
                    .switchIfEmpty(ServerResponse.notFound().build())
            )
            .onErrorResume(e -> {
                log.error("Error submitting application", e);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            e instanceof Throwable
                                ? ((Throwable) e).getMessage()
                                : "Error submitting application"
                        )
                    );
            });
    }

    /** GET /api/v1/students/applications/{id}/progress - Get application workflow progress */
    public Mono<ServerResponse> getApplicationProgress(ServerRequest request) {
        final String clientId = request.headers().firstHeader("X-Client-ID");

        UUID applicationId = UUID.fromString(request.pathVariable("id"));

        return extractUserIdFromRequest(request)
            .flatMap(userId ->
                applicationService
                    .getApplicationProgress(applicationId, userId, clientId)
                    .flatMap(progress ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(ApiResponse.success(progress))
                    )
                    .switchIfEmpty(ServerResponse.notFound().build())
            )
            .onErrorResume(e -> {
                log.error("Error getting application progress", e);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error(
                            e instanceof Throwable
                                ? ((Throwable) e).getMessage()
                                : "Error getting application progress"
                        )
                    );
            });
    }

    // ===== HELPER METHODS FOR APPLICATION CONVERSION =====

    private Mono<
        StudentApplicationsResponseDTO.StudentApplicationSummaryDTO
    > convertToStudentApplicationSummary(ApplicationResponseDTO application) {
        // Fetch university name reactively
        Mono<String> universityNameMono =
            application.getTargetUniversityId() != null
                ? universityRepository
                      .findById(application.getTargetUniversityId())
                      .map(university -> university.getName())
                      .defaultIfEmpty("University Name")
                : Mono.just("University Name");

        // Fetch course name reactively
        Mono<String> programNameMono =
            application.getTargetCourseId() != null
                ? courseRepository
                      .findById(application.getTargetCourseId())
                      .map(course -> course.getName())
                      .defaultIfEmpty("Program Name")
                : Mono.just("Program Name");

        // Combine both results
        return Mono.zip(universityNameMono, programNameMono).map(tuple ->
            StudentApplicationsResponseDTO.StudentApplicationSummaryDTO.builder()
                .id(application.getId())
                .referenceNumber(application.getReferenceNumber())
                .universityName(tuple.getT1())
                .programName(tuple.getT2())
                .degreeLevel(
                    StudentApplicationsResponseDTO.ApplicationDegreeLevel.fromValue(
                        application.getProgramLevel()
                    )
                )
                .intakeTerm(
                    StudentApplicationsResponseDTO.ApplicationIntakeTerm.fromSeasonAndYear(
                        application.getTargetSemester(),
                        application.getTargetYear()
                    )
                )
                .status(
                    StudentApplicationsResponseDTO.ApplicationStatus.fromValue(
                        application.getStatus()
                    )
                )
                .countryCode(application.getCountryCode())
                .submittedAt(application.getSubmittedAt())
                .applicationDeadline(application.getUniversityDeadline())
                .assignedAdmin(
                    application.getAssignedAdminId() != null
                        ? StudentApplicationsResponseDTO.AssignedAdminDTO.builder()
                              .id(application.getAssignedAdminId())
                              .name("Admin Name") // TODO: Get from admin service
                              .email("admin@uniflow.com") // TODO: Get from admin service
                              .build()
                        : null
                )
                .currentStage(
                    StudentApplicationsResponseDTO.ApplicationWorkflowStage.fromValue(
                        application.getWorkflowStage()
                    )
                )
                .completionPercentage(application.getCompletionPercentage())
                .workflowProgress(
                    StudentApplicationsResponseDTO.WorkflowProgressDTO.builder()
                        .currentStep(application.getWorkflowStep())
                        .estimatedCompletion(
                            application.getNextCriticalDeadline()
                        )
                        .pendingTasks(0) // TODO: Get from workflow service
                        .requiresStudentAction(application.getNeedsAttention())
                        .build()
                )
                .build()
        );
    }

    // ===== HELPER METHODS =====

    /**
     * Convert simplified CreateApplicationRequestDTO to legacy ApplicationRequestDTO
     * This maintains backward compatibility with existing ApplicationService
     */
    private ApplicationRequestDTO convertToApplicationRequestDTO(
        CreateApplicationRequestDTO simpleDto
    ) {
        // Set default deadline 6 months from now to pass validation
        LocalDateTime defaultDeadline = LocalDateTime.now().plusMonths(6);

        return ApplicationRequestDTO.builder()
            .studentId(simpleDto.getStudentId())
            .targetUniversityId(
                UUID.fromString(simpleDto.getTargetUniversityId())
            )
            .targetCourseId(UUID.fromString(simpleDto.getTargetCourseId()))
            .targetSemester(simpleDto.getTargetSemester().toLowerCase())
            .targetYear(simpleDto.getTargetYear())
            .alternateCourseId(
                simpleDto.getAlternateCourseId() != null
                    ? UUID.fromString(simpleDto.getAlternateCourseId())
                    : null
            )
            .alternateUniversityId(
                simpleDto.getAlternateUniversityId() != null
                    ? UUID.fromString(simpleDto.getAlternateUniversityId())
                    : null
            )
            .applicationType("graduate") // Will be determined from course data
            .programLevel(null) // Will be fetched from course data
            .studyMode("full-time") // Default for simplified flow
            .intakeSeason(simpleDto.getTargetSemester().toLowerCase())
            .priority(
                simpleDto.getPriority() != null
                    ? simpleDto.getPriority().toLowerCase()
                    : "normal"
            )
            .isUrgent(simpleDto.getIsUrgent())
            .isExpedited(simpleDto.getExpediteProcessing())
            .isFastTracked(false)
            .processingComplexity("medium")
            .riskLevel("low")
            .clientId("uni360") // Default client
            .countryCode(null) // Will be fetched from university data
            .languagePreference(
                simpleDto.getLanguagePreference() != null
                    ? simpleDto.getLanguagePreference().toLowerCase()
                    : "en"
            )
            .timezone("UTC")
            .sourceSystem(simpleDto.getSource())
            // Add required defaults for validation
            .deadline(defaultDeadline) // Required for hasValidDeadlines()
            .universityDeadline(defaultDeadline.plusWeeks(2))
            .internalDeadline(defaultDeadline.minusWeeks(1))
            .applicationFeeAmount(0.0) // Set to 0 for free applications
            .applicationFeeCurrency("USD") // Default currency
            .serviceFeeAmount(0.0)
            .serviceFeeCurrency("USD")
            .build();
    }

    // ===== UNIVERSITY SEARCH & COURSE ENDPOINTS =====

    /** GET /api/v1/students/university/{id}/popup - Get university info popup details */
    public Mono<ServerResponse> getUniversityInfoPopup(ServerRequest request) {
        try {
            UUID universityId = UUID.fromString(request.pathVariable("id"));
            log.debug(
                "Fetching university info popup for ID: {}",
                universityId
            );

            return universityService
                .findById(universityId)
                .switchIfEmpty(
                    Mono.error(new RuntimeException("University not found"))
                )
                .flatMap(university -> {
                    // Get popular courses for this university
                    return courseRepository
                        .findPopularByUniversityId(universityId, 10)
                        .map(this::convertToStudentCourseDTO)
                        .collectList()
                        .map(popularCourses ->
                            convertToUniversityInfoPopupDTO(
                                university,
                                popularCourses
                            )
                        );
                })
                .flatMap(popupDTO ->
                    ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.success(popupDTO))
                )
                .onErrorResume(IllegalArgumentException.class, e ->
                    ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.error("Invalid university ID format")
                        )
                )
                .onErrorResume(RuntimeException.class, e ->
                    ServerResponse.status(404)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.error(e.getMessage()))
                )
                .onErrorResume(Exception.class, e -> {
                    log.error(
                        "Error fetching university info popup for ID: {}",
                        universityId,
                        e
                    );
                    return ServerResponse.status(500)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.error(
                                "Failed to fetch university information"
                            )
                        );
                });
        } catch (Exception e) {
            log.error("Error parsing university ID from request", e);
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.error("Invalid university ID format"));
        }
    }

    private UniversityInfoPopupDTO convertToUniversityInfoPopupDTO(
        University university,
        List<StudentCourseDTO> popularCourses
    ) {
        // Extract data from university.data JSON field
        Map<String, Object> universityData = extractUniversityData(university);

        return UniversityInfoPopupDTO.builder()
            .id(university.getId())
            .name(university.getName())
            .code(university.getCode())
            .officialName(
                getStringValue(
                    universityData,
                    "official_name",
                    university.getName()
                )
            )
            // Location & Basic Info
            .country(getStringValue(universityData, "country"))
            .city(getStringValue(universityData, "city"))
            .state(getStringValue(universityData, "state"))
            .address(getStringValue(universityData, "address"))
            .postalCode(getStringValue(universityData, "postal_code"))
            .timezone(getStringValue(universityData, "timezone", "UTC"))
            // Visual assets
            .logoUrl(getStringValue(universityData, "logo_url"))
            .bannerUrl(getStringValue(universityData, "banner_url"))
            .campusImages(getListValue(universityData, "campus_images"))
            // University Profile
            .establishedYear(getStringValue(universityData, "established_year"))
            .universityType(
                getStringValue(universityData, "type", null)
            )
            .motto(getStringValue(universityData, "motto"))
            .description(getStringValue(universityData, "description"))
            .keyStrengths(getListValue(universityData, "key_strengths"))
            // Rankings & Recognition
            .worldRanking(getIntegerValue(universityData, "world_ranking"))
            .nationalRanking(
                getIntegerValue(universityData, "national_ranking")
            )
            .rankingSource(
                getStringValue(universityData, "ranking_source", "QS")
            )
            .accreditations(getListValue(universityData, "accreditations"))
            .memberships(getListValue(universityData, "memberships"))
            // Academic Information
            .totalStudents(getIntegerValue(universityData, "total_students"))
            .internationalStudents(
                getIntegerValue(universityData, "international_students")
            )
            .totalFaculty(getIntegerValue(universityData, "total_faculty"))
            .studentFacultyRatio(
                getStringValue(universityData, "student_faculty_ratio")
            )
            .totalCourses(popularCourses != null ? popularCourses.size() : 0)
            .faculties(getListValue(universityData, "faculties"))
            .researchAreas(getListValue(universityData, "research_areas"))
            // Financial Information
            .tuitionDomestic(
                getBigDecimalValue(universityData, "tuition_domestic")
            )
            .tuitionInternational(
                getBigDecimalValue(universityData, "tuition_international")
            )
            .currency(getStringValue(universityData, "currency", "USD"))
            .scholarshipsAvailable(
                getBooleanValue(universityData, "scholarships_available", false)
            )
            .livingCostEstimate(
                getBigDecimalValue(universityData, "living_cost_estimate")
            )
            // Application Requirements
            .applicationDeadline(
                getStringValue(universityData, "application_deadline")
            )
            .earlyApplicationDeadline(
                getStringValue(universityData, "early_application_deadline")
            )
            .intakeSeasons(getListValue(universityData, "intake_seasons"))
            .requiredDocuments(
                getListValue(universityData, "required_documents")
            )
            .applicationFee(getStringValue(universityData, "application_fee"))
            .processingTimeDays(
                getIntegerValue(universityData, "processing_time_days", 30)
            )
            // Campus & Facilities
            .campusSize(getStringValue(universityData, "campus_size"))
            .campusType(getStringValue(universityData, "campus_type", "Urban"))
            .facilities(getListValue(universityData, "facilities"))
            .accommodation(
                getStringValue(universityData, "accommodation", "Available")
            )
            .accommodationCapacity(
                getIntegerValue(universityData, "accommodation_capacity")
            )
            .transportation(getStringValue(universityData, "transportation"))
            // Student Life
            .studentClubs(getIntegerValue(universityData, "student_clubs"))
            .sportsTeams(getListValue(universityData, "sports_teams"))
            .diversityIndex(getStringValue(universityData, "diversity_index"))
            .campusActivities(getListValue(universityData, "campus_activities"))
            .careerServicesRating(
                getStringValue(universityData, "career_services_rating")
            )
            // Popular Courses
            .popularCourses(popularCourses)
            .strongPrograms(getListValue(universityData, "strong_programs"))
            // Contact & Links
            .website(getStringValue(universityData, "website"))
            .admissionsEmail(getStringValue(universityData, "admissions_email"))
            .internationalOfficeEmail(
                getStringValue(universityData, "international_office_email")
            )
            .phone(getStringValue(universityData, "phone"))
            // Student Reviews & Stats
            .satisfactionRating(
                getDoubleValue(universityData, "satisfaction_rating")
            )
            .totalReviews(getIntegerValue(universityData, "total_reviews", 0))
            .graduationRate(getStringValue(universityData, "graduation_rate"))
            .employmentRate(getStringValue(universityData, "employment_rate"))
            // Application Specific
            .hasApplied(false) // TODO: Check if current student has applied
            .applicationStatus(null)
            .isFavorite(false) // TODO: Check if current student has favorited
            .matchScore("85%") // TODO: Calculate based on student profile
            // Quick Actions
            .canApplyNow(true)
            .applicationUrl(getStringValue(universityData, "application_url"))
            .virtualTourUrl(getStringValue(universityData, "virtual_tour_url"))
            .brochureUrl(getStringValue(universityData, "brochure_url"))
            .build();
    }

    private StudentCourseDTO convertToStudentCourseDTO(Course course) {
        Map<String, Object> courseData = extractCourseData(course);

        return StudentCourseDTO.builder()
            .id(course.getId())
            .universityId(course.getUniversityId())
            .name(course.getName())
            .courseCode(course.getCourseCode())
            .shortDescription(getStringValue(courseData, "short_description"))
            .degreeLevel(getStringValue(courseData, "degree_level"))
            .degreeType(getStringValue(courseData, "degree_type"))
            .fieldOfStudy(getStringValue(courseData, "field_of_study"))
            .studyMode(getStringValue(courseData, "study_mode", "Full-time"))
            .durationYears(getDoubleValue(courseData, "duration_years"))
            .tuitionInternational(
                getBigDecimalValue(courseData, "tuition_international")
            )
            .currency(getStringValue(courseData, "currency", "USD"))
            .scholarshipsAvailable(
                getBooleanValue(courseData, "scholarships_available", false)
            )
            .intakeSeasons(getListValue(courseData, "intake_seasons"))
            .applicationDeadline(
                getStringValue(courseData, "application_deadline")
            )
            .careerOpportunities(
                getListValue(courseData, "career_opportunities")
            )
            .isPopular(getBooleanValue(courseData, "is_featured", false))
            .rating(getDoubleValue(courseData, "rating", 4.0))
            .hasApplied(false) // TODO: Check application status - needs studentId
            .isFavorite(false) // TODO: Check favorite status - needs studentId
            .canApplyNow(true)
            .build();
    }

    private Map<String, Object> extractUniversityData(University university) {
        try {
            if (university.getData() != null) {
                ObjectMapper mapper = new ObjectMapper();
                return mapper.readValue(
                    university.getData().asString(),
                    Map.class
                );
            }
        } catch (Exception e) {
            log.warn(
                "Failed to parse university data JSON for university {}: {}",
                university.getId(),
                e.getMessage()
            );
        }
        return Map.of();
    }

    private Map<String, Object> extractCourseData(Course course) {
        try {
            if (course.getData() != null) {
                ObjectMapper mapper = new ObjectMapper();
                return mapper.readValue(course.getData().asString(), Map.class);
            }
        } catch (Exception e) {
            log.warn(
                "Failed to parse course data JSON for course {}: {}",
                course.getId(),
                e.getMessage()
            );
        }
        return Map.of();
    }

    // Helper methods for safe data extraction
    private String getStringValue(Map<String, Object> data, String key) {
        return getStringValue(data, key, null);
    }

    private String getStringValue(
        Map<String, Object> data,
        String key,
        String defaultValue
    ) {
        Object value = data.get(key);
        return value != null ? value.toString() : defaultValue;
    }

    private Integer getIntegerValue(Map<String, Object> data, String key) {
        return getIntegerValue(data, key, null);
    }

    private Integer getIntegerValue(
        Map<String, Object> data,
        String key,
        Integer defaultValue
    ) {
        try {
            Object value = data.get(key);
            if (value instanceof Number) {
                return ((Number) value).intValue();
            } else if (value instanceof String) {
                return Integer.parseInt((String) value);
            }
        } catch (Exception e) {
            log.debug(
                "Failed to parse integer value for key {}: {}",
                key,
                e.getMessage()
            );
        }
        return defaultValue;
    }

    private Double getDoubleValue(Map<String, Object> data, String key) {
        return getDoubleValue(data, key, null);
    }

    private Double getDoubleValue(
        Map<String, Object> data,
        String key,
        Double defaultValue
    ) {
        try {
            Object value = data.get(key);
            if (value instanceof Number) {
                return ((Number) value).doubleValue();
            } else if (value instanceof String) {
                return Double.parseDouble((String) value);
            }
        } catch (Exception e) {
            log.debug(
                "Failed to parse double value for key {}: {}",
                key,
                e.getMessage()
            );
        }
        return defaultValue;
    }

    private BigDecimal getBigDecimalValue(
        Map<String, Object> data,
        String key
    ) {
        try {
            Object value = data.get(key);
            if (value instanceof Number) {
                return BigDecimal.valueOf(((Number) value).doubleValue());
            } else if (value instanceof String) {
                return new BigDecimal((String) value);
            }
        } catch (Exception e) {
            log.debug(
                "Failed to parse BigDecimal value for key {}: {}",
                key,
                e.getMessage()
            );
        }
        return null;
    }

    private Boolean getBooleanValue(
        Map<String, Object> data,
        String key,
        Boolean defaultValue
    ) {
        try {
            Object value = data.get(key);
            if (value instanceof Boolean) {
                return (Boolean) value;
            } else if (value instanceof String) {
                return Boolean.parseBoolean((String) value);
            }
        } catch (Exception e) {
            log.debug(
                "Failed to parse boolean value for key {}: {}",
                key,
                e.getMessage()
            );
        }
        return defaultValue;
    }

    @SuppressWarnings("unchecked")
    private List<String> getListValue(Map<String, Object> data, String key) {
        try {
            Object value = data.get(key);
            if (value instanceof List) {
                return ((List<?>) value).stream()
                    .map(Object::toString)
                    .collect(java.util.stream.Collectors.toList());
            }
        } catch (Exception e) {
            log.debug(
                "Failed to parse list value for key {}: {}",
                key,
                e.getMessage()
            );
        }
        return new ArrayList<>();
    }

    /** GET /api/v1/students/courses - Get courses for student with filtering */
    public Mono<ServerResponse> getCoursesForStudent(ServerRequest request) {
        try {
            // Extract query parameters
            String universityId = request
                .queryParam("universityId")
                .orElse(null);
            String degreeLevel = request.queryParam("degreeLevel").orElse(null);
            String fieldOfStudy = request
                .queryParam("fieldOfStudy")
                .orElse(null);
            String studyMode = request.queryParam("studyMode").orElse(null);
            String searchTerm = request.queryParam("search").orElse(null);
            Integer limit = request
                .queryParam("limit")
                .map(Integer::parseInt)
                .orElse(20);
            Integer offset = request
                .queryParam("offset")
                .map(Integer::parseInt)
                .orElse(0);

            log.debug(
                "Fetching courses for student - universityId: {}, degreeLevel: {}, fieldOfStudy: {}, studyMode: {}, search: {}, limit: {}, offset: {}",
                universityId,
                degreeLevel,
                fieldOfStudy,
                studyMode,
                searchTerm,
                limit,
                offset
            );

            Flux<Course> courseFlux;
            Mono<Long> totalCountMono;

            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                // Search courses by term — apply limit/offset in-stream
                courseFlux = courseRepository
                    .searchCourses(searchTerm.trim())
                    .skip(offset)
                    .take(limit);
                totalCountMono = courseRepository.countSearchCourses(searchTerm.trim());
            } else if (universityId != null) {
                // Filter by university with other criteria
                courseFlux = courseRepository.findWithCriteria(
                    UUID.fromString(universityId),
                    degreeLevel,
                    fieldOfStudy,
                    null, // subjectArea
                    studyMode,
                    null, // minTuition
                    null, // maxTuition
                    null, // minDuration
                    null, // maxDuration
                    limit,
                    offset
                );
                totalCountMono = courseRepository.countWithCriteria(
                    UUID.fromString(universityId),
                    degreeLevel,
                    fieldOfStudy,
                    null, // subjectArea
                    studyMode,
                    null, // minTuition
                    null, // maxTuition
                    null, // minDuration
                    null  // maxDuration
                );
            } else {
                // General filtering
                courseFlux = courseRepository.findWithCriteria(
                    null, // universityId
                    degreeLevel,
                    fieldOfStudy,
                    null, // subjectArea
                    studyMode,
                    null, // minTuition
                    null, // maxTuition
                    null, // minDuration
                    null, // maxDuration
                    limit,
                    offset
                );
                totalCountMono = courseRepository.countWithCriteria(
                    null, // universityId
                    degreeLevel,
                    fieldOfStudy,
                    null, // subjectArea
                    studyMode,
                    null, // minTuition
                    null, // maxTuition
                    null, // minDuration
                    null  // maxDuration
                );
            }

            return extractUserIdFromRequest(request)
                .flatMap(studentId ->
                    Mono.zip(
                        courseFlux
                            .flatMap(course ->
                                Mono.zip(
                                    universityService
                                        .findById(course.getUniversityId())
                                        .onErrorReturn(
                                            University.builder()
                                                .name("Unknown")
                                                .code("UNK")
                                                .build()
                                        ),
                                    courseFavoriteRepository
                                        .existsByStudentIdAndCourseIdAndIsActive(
                                            studentId,
                                            course.getId(),
                                            true
                                        )
                                        .onErrorReturn(false),
                                    applicationService
                                        .getApplicationsByStudent(studentId)
                                        .any(app ->
                                            app
                                                .getTargetCourseId()
                                                .equals(course.getId())
                                        )
                                        .onErrorReturn(false)
                                ).map(tuple -> {
                                    University university = tuple.getT1();
                                    Boolean isFavorite = tuple.getT2();
                                    Boolean hasApplied = tuple.getT3();
                                    StudentCourseDTO dto =
                                        convertToStudentCourseDTO(course);
                                    dto.setUniversityName(university.getName());
                                    dto.setUniversityCode(university.getCode());
                                    dto.setIsFavorite(isFavorite);
                                    dto.setHasApplied(hasApplied);

                                    // Extract country from university data if available
                                    Map<String, Object> universityData =
                                        extractUniversityData(university);
                                    dto.setUniversityCountry(
                                        getStringValue(universityData, "country")
                                    );
                                    return dto;
                                })
                            )
                            .collectList(),
                        totalCountMono
                    )
                )
                .flatMap(tuple -> {
                    java.util.List<StudentCourseDTO> courses = tuple.getT1();
                    Long totalCount = tuple.getT2();
                    int currentPage = limit > 0 ? offset / limit : 0;
                    boolean hasMore = (long)(offset + limit) < totalCount;
                    java.util.Map<String, Object> pageData = new java.util.LinkedHashMap<>();
                    pageData.put("totalCount", totalCount);
                    pageData.put("data", courses);
                    pageData.put("page", currentPage);
                    pageData.put("size", limit);
                    pageData.put("hasMore", hasMore);
                    return ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.success(pageData));
                })
                .onErrorResume(IllegalArgumentException.class, e ->
                    ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.error("Invalid request parameters")
                        )
                )
                .onErrorResume(Exception.class, e -> {
                    log.error("Error fetching courses for student", e);
                    return ServerResponse.status(500)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.error("Failed to fetch courses")
                        );
                });
        } catch (Exception e) {
            log.error("Error parsing course search parameters", e);
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.error("Invalid request parameters"));
        }
    }

    /** GET /api/v1/students/courses/{id} - Get a single course by ID for student */
    public Mono<ServerResponse> getCourseById(ServerRequest request) {
        try {
            // Extract course ID from path variable
            String courseIdStr = request.pathVariable("id");
            UUID courseId = UUID.fromString(courseIdStr);

            log.debug("Fetching course by ID: {} for student", courseId);

            return extractUserIdFromRequest(request)
                .flatMap(studentId ->
                    courseRepository
                        .findById(courseId)
                        .flatMap(course ->
                            Mono.zip(
                                universityService
                                    .findById(course.getUniversityId())
                                    .onErrorReturn(
                                        University.builder()
                                            .name("Unknown")
                                            .code("UNK")
                                            .build()
                                    ),
                                courseFavoriteRepository
                                    .existsByStudentIdAndCourseIdAndIsActive(
                                        studentId,
                                        course.getId(),
                                        true
                                    )
                                    .onErrorReturn(false),
                                applicationService
                                    .getApplicationsByStudent(studentId)
                                    .any(app ->
                                        app
                                            .getTargetCourseId()
                                            .equals(course.getId())
                                    )
                                    .onErrorReturn(false)
                            ).map(tuple -> {
                                University university = tuple.getT1();
                                Boolean isFavorite = tuple.getT2();
                                Boolean hasApplied = tuple.getT3();
                                StudentCourseDTO dto =
                                    convertToStudentCourseDTO(course);
                                dto.setUniversityName(university.getName());
                                dto.setUniversityCode(university.getCode());
                                dto.setIsFavorite(isFavorite);
                                dto.setHasApplied(hasApplied);

                                // Extract country from university data if available
                                Map<String, Object> universityData =
                                    extractUniversityData(university);
                                dto.setUniversityCountry(
                                    getStringValue(universityData, "country")
                                );
                                return dto;
                            })
                        )
                        .flatMap(courseDTO ->
                            ServerResponse.ok()
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(ApiResponse.success(courseDTO))
                        )
                        .switchIfEmpty(
                            ServerResponse.status(404)
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(
                                    ApiResponse.error("Course not found")
                                )
                        )
                )
                .onErrorResume(IllegalArgumentException.class, e ->
                    ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.error("Invalid course ID format")
                        )
                )
                .onErrorResume(Exception.class, e -> {
                    log.error("Error fetching course by ID: {}", courseId, e);
                    return ServerResponse.status(500)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.error("Failed to fetch course"));
                });
        } catch (Exception e) {
            log.error("Error parsing course ID parameter", e);
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.error("Invalid course ID"));
        }
    }

    /** GET /api/v1/students/universities - Get universities for student with filtering */
    public Mono<ServerResponse> getUniversitiesForStudent(
        ServerRequest request
    ) {
        try {
            // Extract query parameters - support both 'country' and 'countries'
            String countries = request
                .queryParam("country")
                .or(() -> request.queryParam("countries"))
                .orElse(null);
            String city = request.queryParam("city").orElse(null);
            String searchTerm = request.queryParam("search").orElse(null);
            String universityType = request.queryParam("type").orElse(null);
            Integer minRanking = request
                .queryParam("minRanking")
                .map(Integer::parseInt)
                .orElse(null);
            Integer maxRanking = request
                .queryParam("maxRanking")
                .map(Integer::parseInt)
                .orElse(null);
            Boolean scholarships = request
                .queryParam("scholarships")
                .map(Boolean::parseBoolean)
                .orElse(null);
            Integer page = request
                .queryParam("page")
                .map(Integer::parseInt)
                .orElse(0);
            Integer size = request
                .queryParam("size")
                .or(() -> request.queryParam("limit"))
                .map(Integer::parseInt)
                .orElse(20);

            log.debug(
                "Fetching universities for student - countries: {}, city: {}, search: {}, type: {}, ranking: {}-{}, scholarships: {}, page: {}, size: {}",
                countries,
                city,
                searchTerm,
                universityType,
                minRanking,
                maxRanking,
                scholarships,
                page,
                size
            );

            // Fetch paged universities + total count in parallel
            return Mono.zip(
                universityCriteriaRepository
                    .findUniversitiesWithFilters(request)
                    .flatMap(
                        this::convertUniversityResponseDTOToStudentCardWithStudentData
                    )
                    .collectList(),
                universityCriteriaRepository
                    .getTotalUniversityCount(request)
                    .onErrorReturn(0L)
            ).flatMap(tuple -> {
                java.util.List<StudentUniversityCardDTO> universities = tuple.getT1();
                Long totalCount = tuple.getT2();
                boolean hasMore = (long)(page + 1) * size < totalCount;
                java.util.Map<String, Object> pageData = new java.util.LinkedHashMap<>();
                pageData.put("totalCount", totalCount);
                pageData.put("data", universities);
                pageData.put("page", page);
                pageData.put("size", size);
                pageData.put("hasMore", hasMore);
                return ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(pageData));
            })
            .onErrorResume(Exception.class, e -> {
                log.error("Error fetching universities for student", e);
                return ServerResponse.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        ApiResponse.error("Failed to fetch universities")
                    );
            });
        } catch (Exception e) {
            log.error("Error parsing university search parameters", e);
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.error("Invalid request parameters"));
        }
    }

    /** GET /api/v1/students/universities/country/{country} - Get universities by country */
    public Mono<ServerResponse> getUniversitiesByCountry(
        ServerRequest request
    ) {
        try {
            String country = request.pathVariable("country").toUpperCase();
            Integer limit = request
                .queryParam("limit")
                .map(Integer::parseInt)
                .orElse(50);

            log.debug(
                "Fetching universities for country: {} with limit: {}",
                country,
                limit
            );

            // Use universityService directly with country filtering
            return universityService
                .findAll()
                .filter(university -> {
                    Map<String, Object> data = extractUniversityData(
                        university
                    );
                    String uniCountry = getStringValue(data, "country");
                    return (
                        uniCountry != null &&
                        uniCountry.equalsIgnoreCase(country)
                    );
                })
                .take(limit)
                .map(this::convertToStudentUniversityCardDTO)
                .collectList()
                .flatMap(universities ->
                    ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.success(universities))
                )
                .onErrorResume(Exception.class, e -> {
                    log.error(
                        "Error fetching universities for country: {}",
                        country,
                        e
                    );
                    return ServerResponse.status(500)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.error(
                                "Failed to fetch universities for country"
                            )
                        );
                });
        } catch (Exception e) {
            log.error("Error parsing country parameter", e);
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.error("Invalid country parameter"));
        }
    }

    /** GET /api/v1/students/universities/filters - Get university filter options */
    public Mono<ServerResponse> getUniversityFiltersForStudent(
        ServerRequest request
    ) {
        try {
            log.debug(
                "Fetching university filters for student using actual database data"
            );

            // Use existing university criteria repository to get actual filter counts
            List<String> filterFields = List.of(
                "country",
                "type",
                "institutionType",
                "scholarshipsAvailable"
            );

            return universityCriteriaRepository
                .findUniversityCounts(request, filterFields)
                .collectList()
                .map(countList -> {
                    Set<String> countries = new HashSet<>();
                    Set<String> types = new HashSet<>();
                    Set<String> institutionTypes = new HashSet<>();

                    // Extract actual values from database counts
                    for (var count : countList) {
                        String field = count.getFilterParam();
                        Object value = count.getFilterId();

                        if ("country".equals(field) && value != null) {
                            countries.add(value.toString());
                        } else if ("type".equals(field) && value != null) {
                            types.add(value.toString());
                        } else if (
                            "institutionType".equals(field) && value != null
                        ) {
                            institutionTypes.add(value.toString());
                        }
                    }

                    // Build student-friendly filter response with actual data
                    return StudentUniversityFiltersDTO.builder()
                        .countries(new ArrayList<>(countries))
                        .universityTypes(new ArrayList<>(types))
                        .campusTypes(new ArrayList<>(institutionTypes))
                        .popularFields(new ArrayList<>())
                        .degreeLevels(new ArrayList<>())
                        .studyModes(new ArrayList<>())
                        .currencies(new ArrayList<>())
                        .scholarshipsAvailable(null)
                        .minTuition(null)
                        .maxTuition(null)
                        .minWorldRanking(null)
                        .maxWorldRanking(null)
                        .intakeSeasons(new ArrayList<>())
                        .englishTestTypes(new ArrayList<>())
                        .minIELTSScore(null)
                        .maxIELTSScore(null)
                        .minTOEFLScore(null)
                        .maxTOEFLScore(null)
                        .accommodationTypes(new ArrayList<>())
                        .facilities(new ArrayList<>())
                        .totalUniversities(countList.size())
                        .filteredCount(countList.size())
                        .build();
                })
                .flatMap(filters ->
                    ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.success(filters))
                );
        } catch (Exception e) {
            log.error("Error fetching university filters", e);
            return ServerResponse.status(500)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(
                    ApiResponse.error("Failed to fetch university filters")
                );
        }
    }

    private Mono<
        StudentUniversityCardDTO
    > convertUniversityResponseDTOToStudentCardWithStudentData(
        com.uniflow.university.dto.UniversityResponseDTO universityDTO
    ) {
        // Get current student ID from JWT context (assuming it's available)
        // For now, we'll use a placeholder - this should be extracted from JWT token
        Long currentStudentId = 5L; // TODO: Extract from JWT context

        // Check if student has applied to this university
        Mono<Boolean> hasAppliedMono = applicationService
            .getApplicationsByStudent(currentStudentId)
            .any(app ->
                app.getTargetUniversityId().equals(universityDTO.getId())
            )
            .onErrorReturn(false);

        return hasAppliedMono.map(hasApplied ->
            StudentUniversityCardDTO.builder()
                .id(universityDTO.getId())
                .name(universityDTO.getName())
                .code(universityDTO.getCode())
                .country(universityDTO.getCountry())
                .city(universityDTO.getCity())
                .logoUrl(null)
                .bannerUrl(null)
                .worldRanking(universityDTO.getWorldRanking())
                .rankingDisplay(
                    formatRankingDisplay(universityDTO.getWorldRanking())
                )
                .tuitionFrom(universityDTO.getTuitionFeeInternational())
                .tuitionTo(null)
                .currency(universityDTO.getCurrency())
                .tuitionDisplay(
                    formatTuitionDisplay(
                        universityDTO.getTuitionFeeInternational(),
                        null,
                        universityDTO.getCurrency()
                    )
                )
                .totalCourses(universityDTO.getNumberOfPrograms())
                .popularFields(null)
                .scholarshipsAvailable(universityDTO.getScholarshipsAvailable())
                .establishedYear(
                    universityDTO.getFoundedYear() != null
                        ? universityDTO.getFoundedYear().toString()
                        : null
                )
                .universityType(universityDTO.getType())
                .institutionType(universityDTO.getInstitutionType())
                .applicationDeadline(null)
                .intakeSeasons(null)
                .englishRequirement(
                    formatEnglishRequirementFromDTO(universityDTO)
                )
                .internationalStudents(universityDTO.getInternationalStudents())
                .campusSize(universityDTO.getCampusSize())
                .accommodation(
                    universityDTO.getAccommodationAvailable() != null &&
                        universityDTO.getAccommodationAvailable()
                        ? "Available"
                        : null
                )
                .courses(universityDTO.getCourses()) // Include nested courses array
                .isFavorite(false) // TODO: Implement favorites system
                .hasApplied(hasApplied)
                .website(universityDTO.getWebsite())
                .email(universityDTO.getEmail())
                .phone(universityDTO.getPhone())
                .shortDescription(null)
                .highlights(null)
                .applicationComplexity(null)
                .matchScore(null)
                .build()
        );
    }

    private StudentUniversityCardDTO convertToStudentUniversityCardDTO(
        University university
    ) {
        Map<String, Object> universityData = extractUniversityData(university);

        // Add debug logging for country field
        String countryFromData = getStringValue(universityData, "country");
        if (countryFromData == null) {
            log.debug(
                "University {} has no country in data field, checking other fields",
                university.getName()
            );
            // Try alternative field names that might contain country info
            countryFromData = getStringValue(
                universityData,
                "location_country"
            );
            if (countryFromData == null) {
                countryFromData = getStringValue(
                    universityData,
                    "address_country"
                );
            }
            if (countryFromData == null) {
                // Extract from address if available
                String address = getStringValue(universityData, "address");
                if (address != null && address.contains("Germany")) {
                    countryFromData = "GERMANY";
                } else if (address != null && address.contains("USA")) {
                    countryFromData = "USA";
                } else if (address != null && address.contains("UK")) {
                    countryFromData = "UK";
                }
            }
        }

        log.debug(
            "University {}: country={}, data keys={}",
            university.getName(),
            countryFromData,
            universityData.keySet()
        );

        return StudentUniversityCardDTO.builder()
            .id(university.getId())
            .name(university.getName())
            .code(university.getCode())
            .country(countryFromData)
            .city(getStringValue(universityData, "city"))
            .logoUrl(getStringValue(universityData, "logo_url"))
            .bannerUrl(getStringValue(universityData, "banner_url"))
            .worldRanking(getIntegerValue(universityData, "world_ranking"))
            .rankingDisplay(
                formatRankingDisplay(
                    getIntegerValue(universityData, "world_ranking")
                )
            )
            .tuitionFrom(getBigDecimalValue(universityData, "tuition_min"))
            .tuitionTo(getBigDecimalValue(universityData, "tuition_max"))
            .currency(getStringValue(universityData, "currency", "USD"))
            .tuitionDisplay(
                formatTuitionDisplay(
                    getBigDecimalValue(universityData, "tuition_min"),
                    getBigDecimalValue(universityData, "tuition_max"),
                    getStringValue(universityData, "currency", "USD")
                )
            )
            .totalCourses(getIntegerValue(universityData, "total_courses", 50))
            .popularFields(getListValue(universityData, "popular_fields"))
            .scholarshipsAvailable(
                getBooleanValue(universityData, "scholarships_available", false)
            )
            .establishedYear(getStringValue(universityData, "established_year"))
            .universityType(
                getStringValue(universityData, "type", null)
            )
            .institutionType(
                getStringValue(universityData, "institution_type", null)
            )
            .applicationDeadline(
                getStringValue(universityData, "application_deadline")
            )
            .intakeSeasons(
                formatIntakeSeasons(
                    getListValue(universityData, "intake_seasons")
                )
            )
            .englishRequirement(formatEnglishRequirement(universityData))
            .internationalStudents(
                getIntegerValue(universityData, "international_students")
            )
            .campusSize(getStringValue(universityData, "campus_size"))
            .accommodation(
                getStringValue(universityData, "accommodation", "Available")
            )
            .isFavorite(false) // TODO: Check user favorites
            .hasApplied(false) // TODO: Check user applications
            .website(getStringValue(universityData, "website"))
            .email(getStringValue(universityData, "email"))
            .phone(getStringValue(universityData, "phone"))
            .shortDescription(
                getStringValue(universityData, "short_description")
            )
            .highlights(getListValue(universityData, "highlights"))
            .applicationComplexity(
                getStringValue(
                    universityData,
                    "application_complexity",
                    "Moderate"
                )
            )
            .matchScore("85%") // TODO: Calculate based on student profile
            .build();
    }

    private String formatRankingDisplay(Integer ranking) {
        if (ranking == null) return null;
        if (ranking <= 10) return "Top 10";
        if (ranking <= 50) return "Top 50";
        if (ranking <= 100) return "Top 100";
        if (ranking <= 200) return "Top 200";
        if (ranking <= 500) return "Top 500";
        return ranking + "+";
    }

    private String formatTuitionDisplay(
        BigDecimal min,
        BigDecimal max,
        String currency
    ) {
        if (min == null && max == null) return null;
        if (min != null && max != null) {
            return String.format(
                "%s%,.0f - %s%,.0f %s",
                getCurrencySymbol(currency),
                min,
                getCurrencySymbol(currency),
                max,
                currency
            );
        }
        if (min != null) {
            return String.format(
                "From %s%,.0f %s",
                getCurrencySymbol(currency),
                min,
                currency
            );
        }
        return String.format(
            "Up to %s%,.0f %s",
            getCurrencySymbol(currency),
            max,
            currency
        );
    }

    private String formatIntakeSeasons(List<String> seasons) {
        if (seasons == null || seasons.isEmpty()) return "Fall";
        return String.join(", ", seasons);
    }

    private String formatEnglishRequirement(Map<String, Object> data) {
        String ielts = getStringValue(data, "ielts_requirement");
        String toefl = getStringValue(data, "toefl_requirement");
        if (ielts != null && toefl != null) {
            return String.format("IELTS %s / TOEFL %s", ielts, toefl);
        }
        if (ielts != null) return "IELTS " + ielts;
        if (toefl != null) return "TOEFL " + toefl;
        return "IELTS 6.0 / TOEFL 80"; // Default
    }

    private String formatEnglishRequirementFromDTO(
        com.uniflow.university.dto.UniversityResponseDTO dto
    ) {
        String ielts =
            dto.getMinIelts() != null ? dto.getMinIelts().toString() : null;
        String toefl =
            dto.getMinToefl() != null ? dto.getMinToefl().toString() : null;
        if (ielts != null && toefl != null) {
            return String.format("IELTS %s / TOEFL %s", ielts, toefl);
        }
        if (ielts != null) return "IELTS " + ielts;
        if (toefl != null) return "TOEFL " + toefl;
        return "IELTS 6.0 / TOEFL 80"; // Default
    }

    private String getCurrencySymbol(String currency) {
        switch (currency) {
            case "USD":
                return "$";
            case "GBP":
                return "£";
            case "EUR":
                return "€";
            case "CAD":
                return "C$";
            case "AUD":
                return "A$";
            default:
                return "";
        }
    }

    /** POST /api/v1/students/courses/favorite/{id} - Add course to favorites */
    public Mono<ServerResponse> addCourseToFavorites(ServerRequest request) {
        try {
            UUID courseId = UUID.fromString(request.pathVariable("id"));

            return extractUserIdFromRequest(request)
                .doOnNext(studentId ->
                    log.debug(
                        "Adding course {} to favorites for student {}",
                        courseId,
                        studentId
                    )
                )
                .flatMap(studentId ->
                    courseRepository
                        .findById(courseId)
                        .switchIfEmpty(
                            Mono.error(new RuntimeException("Course not found"))
                        )
                        .then(
                            courseFavoriteRepository
                                .existsByStudentIdAndCourseIdAndIsActive(
                                    studentId,
                                    courseId,
                                    true
                                )
                                .flatMap(exists -> {
                                    if (exists) {
                                        return Mono.error(
                                            new IllegalStateException(
                                                "Course already in favorites"
                                            )
                                        );
                                    }
                                    // Create new favorite
                                    CourseFavorite favorite =
                                        CourseFavorite.builder()
                                            .studentId(studentId)
                                            .courseId(courseId)
                                            .isActive(true)
                                            .createdAt(LocalDateTime.now())
                                            .updatedAt(LocalDateTime.now())
                                            .build();

                                    return courseFavoriteRepository
                                        .save(favorite)
                                        .then(Mono.just("Added to favorites"));
                                })
                        )
                        .flatMap(message ->
                            ServerResponse.ok()
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(
                                    ApiResponse.success(
                                        Map.of("message", message)
                                    )
                                )
                        )
                )
                .onErrorResume(IllegalArgumentException.class, e ->
                    ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.error("Invalid course ID format")
                        )
                )
                .onErrorResume(IllegalStateException.class, e ->
                    ServerResponse.status(409)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.error(e.getMessage()))
                )
                .onErrorResume(RuntimeException.class, e ->
                    ServerResponse.status(404)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.error(e.getMessage()))
                )
                .onErrorResume(Exception.class, e -> {
                    log.error(
                        "Error adding course {} to favorites",
                        courseId,
                        e
                    );
                    return ServerResponse.status(500)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.error(
                                "Failed to add course to favorites"
                            )
                        );
                });
        } catch (Exception e) {
            log.error("Error parsing course ID from request", e);
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.error("Invalid course ID format"));
        }
    }

    /** DELETE /api/v1/students/courses/favorite/{id} - Remove course from favorites */
    public Mono<ServerResponse> removeCourseFromFavorites(
        ServerRequest request
    ) {
        try {
            UUID courseId = UUID.fromString(request.pathVariable("id"));

            return extractUserIdFromRequest(request)
                .doOnNext(studentId ->
                    log.debug(
                        "Removing course {} from favorites for student {}",
                        courseId,
                        studentId
                    )
                )
                .flatMap(studentId ->
                    courseFavoriteRepository
                        .findByStudentIdAndCourseIdAndIsActive(
                            studentId,
                            courseId,
                            true
                        )
                        .flatMap(favorite -> {
                            // Set as inactive instead of deleting
                            favorite.setIsActive(false);
                            favorite.setUpdatedAt(LocalDateTime.now());
                            return courseFavoriteRepository
                                .save(favorite)
                                .then(Mono.just("Removed from favorites"));
                        })
                        .switchIfEmpty(Mono.just("Course not in favorites"))
                        .flatMap(message ->
                            ServerResponse.ok()
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(
                                    ApiResponse.success(
                                        Map.of("message", message)
                                    )
                                )
                        )
                )
                .onErrorResume(IllegalArgumentException.class, e ->
                    ServerResponse.badRequest()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.error("Invalid course ID format")
                        )
                )
                .onErrorResume(Exception.class, e -> {
                    log.error(
                        "Error removing course {} from favorites",
                        courseId,
                        e
                    );
                    return ServerResponse.status(500)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(
                            ApiResponse.error(
                                "Failed to remove course from favorites"
                            )
                        );
                });
        } catch (Exception e) {
            log.error("Error parsing course ID from request", e);
            return ServerResponse.badRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.error("Invalid course ID format"));
        }
    }

    /** GET /api/v1/students/courses/favorites - Get all favorite courses for student */
    public Mono<ServerResponse> getFavoriteCourses(ServerRequest request) {
        return extractUserIdFromRequest(request)
            .doOnNext(studentId -> log.debug("Fetching favorite courses for student {}", studentId))
            .flatMap(studentId -> 
                courseFavoriteRepository.findByStudentIdAndIsActive(studentId, true)
                    .map(com.uniflow.student.entity.CourseFavorite::getCourseId)
                    .collectList()
                    .flatMap(courseIds -> {
                        if (courseIds.isEmpty()) {
                            return Mono.just(java.util.Collections.<com.uniflow.student.dto.university.StudentCourseDTO>emptyList());
                        }
                        return courseRepository.findAllById(courseIds)
                            .flatMap(course ->
                                Mono.zip(
                                    universityService.findById(course.getUniversityId())
                                        .onErrorReturn(com.uniflow.university.entity.University.builder().name("Unknown").code("UNK").build()),
                                    applicationService.getApplicationsByStudent(studentId)
                                        .any(app -> app.getTargetCourseId().equals(course.getId()))
                                        .onErrorReturn(false)
                                ).map(tuple -> {
                                    com.uniflow.university.entity.University university = tuple.getT1();
                                    Boolean hasApplied = tuple.getT2();
                                    
                                    com.uniflow.student.dto.university.StudentCourseDTO dto = convertToStudentCourseDTO(course);
                                    dto.setUniversityName(university.getName());
                                    dto.setUniversityCode(university.getCode());
                                    dto.setIsFavorite(true);
                                    dto.setHasApplied(hasApplied);
                                    
                                    java.util.Map<String, Object> universityData = extractUniversityData(university);
                                    dto.setUniversityCountry(getStringValue(universityData, "country"));
                                    
                                    return dto;
                                })
                            ).collectList();
                    })
            )
            .flatMap(courses -> 
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.success(courses))
            )
            .onErrorResume(Exception.class, e -> {
                log.error("Error fetching favorite courses", e);
                return ServerResponse.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error("Failed to fetch favorite courses"));
            });
    }

    private Boolean checkIfStudentHasAppliedToCourse(UUID courseId) {
        try {
            // Simple synchronous check for DTO building
            // TODO: Optimize with batch queries in production
            return applicationService
                .getApplicationsByStudent(5L) // TODO: Get from JWT context properly
                .any(app -> app.getTargetCourseId().equals(courseId))
                .block();
        } catch (Exception e) {
            log.debug(
                "Error checking if student has applied to course {}: {}",
                courseId,
                e.getMessage()
            );
            return false;
        }
    }

    // ===== STUDENT DOCUMENT MANAGEMENT ENDPOINTS (AD-02-04) =====

    /**
     * GET /api/v1/students/documents/overview - Get comprehensive document overview
     * Shows all document categories: pending, uploaded, and requiring reupload
     */
    public Mono<ServerResponse> getStudentDocumentOverview(
        ServerRequest request
    ) {
        log.info("Get student document overview request received");

        return jwtUtils
            .getUserIdFromServerRequest(request)
            .flatMap(studentId -> {
                log.debug("Student {} requesting document overview", studentId);

                return Mono.zip(
                    getPendingDocumentsForStudent(studentId).collectList(),
                    getUploadedDocumentsForStudent(studentId).collectList(),
                    getReuploadDocumentsForStudent(studentId).collectList(),
                    getDocumentOverviewSummary(studentId)
                ).flatMap(tuple -> {
                    var pendingDocs = tuple.getT1();
                    var uploadedDocs = tuple.getT2();
                    var reuploadDocs = tuple.getT3();
                    var summary = tuple.getT4();

                    // Calculate completion percentage
                    int totalRequired = summary.getTotalRequired();
                    int verifiedCount = summary.getVerifiedCount();
                    int completionPercentage =
                        totalRequired > 0
                            ? (verifiedCount * 100) / totalRequired
                            : 0;

                    // Find next deadline
                    LocalDateTime nextDeadline = findNextDeadline(
                        pendingDocs,
                        reuploadDocs
                    );

                    var overview =
                        StudentDocumentDTO.DocumentOverviewResponse.builder()
                            .success(true)
                            .message("Document overview retrieved successfully")
                            .studentId(studentId)
                            .overviewSummary(summary)
                            .pendingDocuments(pendingDocs)
                            .uploadedDocuments(uploadedDocs)
                            .reuploadRequired(reuploadDocs)
                            .completionPercentage(completionPercentage)
                            .nextDeadline(nextDeadline)
                            .build();

                    return ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(overview);
                });
            })
            .doOnSuccess(response ->
                log.info("Student document overview retrieved successfully")
            )
            .onErrorResume(error -> {
                log.error("Error retrieving student document overview", error);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        StudentDocumentDTO.DocumentOverviewResponse.builder()
                            .success(false)
                            .message(
                                "Failed to retrieve document overview: " +
                                    error.getMessage()
                            )
                            .build()
                    );
            });
    }

    /**
     * GET /api/v1/students/documents/pending - Get documents pending upload
     */
    public Mono<ServerResponse> getPendingDocuments(ServerRequest request) {
        log.info("Get pending documents request received");

        return jwtUtils
            .getUserIdFromServerRequest(request)
            .flatMap(studentId -> {
                log.debug("Student {} requesting pending documents", studentId);

                return getPendingDocumentsForStudent(studentId)
                    .collectList()
                    .flatMap(pendingDocs -> {
                        var response =
                            StudentDocumentDTO.PendingDocumentsResponse.builder()
                                .success(true)
                                .message(
                                    "Pending documents retrieved successfully"
                                )
                                .pendingDocuments(pendingDocs)
                                .totalPending(pendingDocs.size())
                                .build();

                        return ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(response);
                    });
            })
            .doOnSuccess(response ->
                log.info("Pending documents retrieved successfully")
            )
            .onErrorResume(error -> {
                log.error("Error retrieving pending documents", error);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        StudentDocumentDTO.PendingDocumentsResponse.builder()
                            .success(false)
                            .message(
                                "Failed to retrieve pending documents: " +
                                    error.getMessage()
                            )
                            .build()
                    );
            });
    }

    /**
     * GET /api/v1/students/documents/uploaded - Get uploaded documents with status
     */
    public Mono<ServerResponse> getUploadedDocuments(ServerRequest request) {
        log.info("Get uploaded documents request received");

        return jwtUtils
            .getUserIdFromServerRequest(request)
            .flatMap(studentId -> {
                log.debug(
                    "Student {} requesting uploaded documents",
                    studentId
                );

                return getUploadedDocumentsForStudent(studentId)
                    .collectList()
                    .flatMap(uploadedDocs -> {
                        var response =
                            StudentDocumentDTO.UploadedDocumentsResponse.builder()
                                .success(true)
                                .message(
                                    "Uploaded documents retrieved successfully"
                                )
                                .uploadedDocuments(uploadedDocs)
                                .totalUploaded(uploadedDocs.size())
                                .build();

                        return ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(response);
                    });
            })
            .doOnSuccess(response ->
                log.info("Uploaded documents retrieved successfully")
            )
            .onErrorResume(error -> {
                log.error("Error retrieving uploaded documents", error);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        StudentDocumentDTO.UploadedDocumentsResponse.builder()
                            .success(false)
                            .message(
                                "Failed to retrieve uploaded documents: " +
                                    error.getMessage()
                            )
                            .build()
                    );
            });
    }

    /**
     * GET /api/v1/students/documents/reupload - Get documents requiring reupload
     */
    public Mono<ServerResponse> getReuploadDocuments(ServerRequest request) {
        log.info("Get reupload documents request received");

        return jwtUtils
            .getUserIdFromServerRequest(request)
            .flatMap(studentId -> {
                log.debug(
                    "Student {} requesting reupload documents",
                    studentId
                );

                return getReuploadDocumentsForStudent(studentId)
                    .collectList()
                    .flatMap(reuploadDocs -> {
                        var response =
                            StudentDocumentDTO.ReuploadDocumentsResponse.builder()
                                .success(true)
                                .message(
                                    "Reupload documents retrieved successfully"
                                )
                                .reuploadDocuments(reuploadDocs)
                                .totalReuploadRequired(reuploadDocs.size())
                                .build();

                        return ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(response);
                    });
            })
            .doOnSuccess(response ->
                log.info("Reupload documents retrieved successfully")
            )
            .onErrorResume(error -> {
                log.error("Error retrieving reupload documents", error);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        StudentDocumentDTO.ReuploadDocumentsResponse.builder()
                            .success(false)
                            .message(
                                "Failed to retrieve reupload documents: " +
                                    error.getMessage()
                            )
                            .build()
                    );
            });
    }

    /**
     * POST /api/v1/students/documents/upload - Upload student document
     * Integrates with existing GenericDocumentService and creates workflow
     */
    public Mono<ServerResponse> uploadStudentDocument(ServerRequest request) {
        log.info("Upload student document request received");

        return jwtUtils
            .getUserIdFromServerRequest(request)
            .flatMap(studentId -> {
                log.debug("Student {} uploading document", studentId);

                return request
                    .multipartData()
                    .flatMap(multipartData -> {
                        // Extract file part
                        var filePart =
                            (org.springframework.http.codec.multipart.FilePart) multipartData.getFirst(
                                "file"
                            );
                        if (filePart == null) {
                            return Mono.error(
                                new IllegalArgumentException("File is required")
                            );
                        }

                        // Extract form fields
                        String documentType = getFormField(
                            multipartData,
                            "document_type"
                        );
                        String applicationId = getFormField(
                            multipartData,
                            "application_id"
                        );
                        String workflowStage = getFormField(
                            multipartData,
                            "workflow_stage"
                        );
                        String notes = getFormField(multipartData, "notes");

                        log.debug(
                            "Student {} uploading document type: {} file: {}",
                            studentId,
                            documentType,
                            filePart.filename()
                        );

                        // Upload file using existing service.
                        // NOTE: GenericDocumentService.uploadDocument() already calls
                        // createWorkflowForUpload() internally when applicationId is present.
                        // We must NOT call documentWorkflowService.createDocumentWorkflow()
                        // here again — that was causing duplicate document_workflow records.
                        return genericDocumentService
                            .uploadDocument(
                                filePart,
                                studentId,
                                "STUDENT",
                                "STUDENT_DOCUMENT",
                                documentType,
                                applicationId,
                                notes
                            )
                            .flatMap(uploadResponse -> {
                                // Sync document URL into the student profile
                                if (
                                    documentType != null &&
                                    uploadResponse.getFileUrl() != null
                                ) {
                                    return profileBuilderService
                                        .updateDocumentInProfile(
                                            studentId,
                                            documentType,
                                            uploadResponse.getFileUrl()
                                        )
                                        .thenReturn(uploadResponse);
                                }
                                return Mono.just(uploadResponse);
                            })
                            .map(uploadResponse ->
                                StudentDocumentDTO.StudentUploadResponse.builder()
                                    .success(true)
                                    .message("Document uploaded successfully")
                                    .uploadId(uploadResponse.getId())
                                    .documentType(documentType)
                                    .customName(
                                        "OTHER_DOC".equals(documentType) &&
                                        notes != null && !notes.isBlank()
                                            ? notes.trim()
                                            : null
                                    )
                                    .fileName(uploadResponse.getOriginalFilename())
                                    .fileSize(uploadResponse.getFileSize())
                                    .uploadTimestamp(LocalDateTime.now())
                                    .estimatedReviewTime("2-3 business days")
                                    .build()
                            );
                    })
                    .flatMap(uploadResponse ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(uploadResponse)
                    );
            })
            .doOnSuccess(response ->
                log.info("Student document uploaded successfully")
            )
            .onErrorResume(error -> {
                log.error("Error uploading student document", error);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        StudentDocumentDTO.StudentUploadResponse.builder()
                            .success(false)
                            .message(
                                "Failed to upload document: " +
                                    error.getMessage()
                            )
                            .build()
                    );
            });
    }

    /**
     * POST /api/v1/students/documents/send-to-application
     *
     * <p>Phase 2 of the two-phase document model.
     * Takes a document that is already saved in the student's library
     * (uploaded via the /upload endpoint) and attaches it to a specific application,
     * creating a document_workflow record so admin can review it.
     *
     * <p>Request body (JSON):
     * <pre>
     * {
     *   "document_id": "uuid-of-already-uploaded-document",
     *   "application_id": "uuid-of-application",
     *   "document_type": "TRANSCRIPT",
     *   "notes": "optional notes"
     * }
     * </pre>
     */
    public Mono<ServerResponse> sendDocumentToApplication(ServerRequest request) {
        log.info("Send document to application request received");

        return jwtUtils
            .getUserIdFromServerRequest(request)
            .flatMap(studentId ->
                request.bodyToMono(java.util.Map.class)
                    .flatMap(body -> {
                        String documentIdStr = (String) body.get("document_id");
                        String applicationIdStr = (String) body.get("application_id");
                        String documentType = (String) body.get("document_type");
                        String notes = body.containsKey("notes") ? (String) body.get("notes") : null;

                        if (documentIdStr == null || documentIdStr.isBlank()) {
                            return Mono.error(new IllegalArgumentException("document_id is required"));
                        }
                        if (applicationIdStr == null || applicationIdStr.isBlank()) {
                            return Mono.error(new IllegalArgumentException("application_id is required"));
                        }

                        UUID documentId;
                        UUID applicationId;
                        try {
                            documentId = UUID.fromString(documentIdStr.trim());
                            applicationId = UUID.fromString(applicationIdStr.trim());
                        } catch (IllegalArgumentException e) {
                            return Mono.error(new IllegalArgumentException("Invalid UUID format for document_id or application_id"));
                        }

                        final String finalDocumentType = documentType;
                        final String finalNotes = notes;
                        final UUID finalDocumentId = documentId;
                        final UUID finalApplicationId = applicationId;

                        // 1. Verify the document belongs to this student
                        return genericDocumentService
                            .getMyDocumentById(finalDocumentId, studentId)
                            .flatMap(upload -> {
                                // 2. Determine effective document type
                                String effectiveType = finalDocumentType != null && !finalDocumentType.isBlank()
                                    ? finalDocumentType
                                    : upload.getDocumentType() != null ? upload.getDocumentType() : "GENERAL";

                                log.info(
                                    "Student {} sending document {} (type: {}) to application {}",
                                    studentId, finalDocumentId, effectiveType, finalApplicationId
                                );

                                // 3. Create the workflow record
                                return documentWorkflowService
                                    .createDocumentWorkflow(
                                        finalDocumentId,
                                        studentId,
                                        finalApplicationId,
                                        effectiveType,
                                        "UPLOADED"
                                    )
                                    .map(workflow ->
                                        ApiResponse.success(
                                            java.util.Map.of(
                                                "message", "Document sent to application successfully",
                                                "workflow_id", workflow.getId(),
                                                "document_id", finalDocumentId,
                                                "application_id", finalApplicationId,
                                                "document_type", effectiveType,
                                                "status", workflow.getVerificationStatus()
                                            )
                                        )
                                    );
                            })
                            .flatMap(response ->
                                ServerResponse.ok()
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .bodyValue(response)
                            );
                    })
            )
            .onErrorResume(IllegalArgumentException.class, e ->
                ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error(e.getMessage()))
            )
            .onErrorResume(error -> {
                log.error("Error sending document to application", error);
                return ServerResponse.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error("Failed to send document to application: " + error.getMessage()));
            });
    }

    /**
     * POST /api/v1/students/documents/bulk-upload - Upload multiple documents
     */
    public Mono<ServerResponse> bulkUploadStudentDocuments(
        ServerRequest request
    ) {
        log.info("Bulk upload student documents request received");

        return jwtUtils
            .getUserIdFromServerRequest(request)
            .flatMap(studentId -> {
                log.debug("Student {} performing bulk upload", studentId);

                return request
                    .multipartData()
                    .flatMap(multipartData -> {
                        // Extract form fields
                        String applicationId = getFormField(
                            multipartData,
                            "application_id"
                        );
                        String workflowStage = getFormField(
                            multipartData,
                            "workflow_stage"
                        );

                        // Process multiple files based on naming convention file_DOCUMENTTYPE
                        var uploadResults = new ArrayList<
                            Mono<StudentDocumentDTO.StudentUploadResponse>
                        >();
                        var failedUploads = new ArrayList<
                            StudentDocumentDTO.FailedUploadItem
                        >();

                        // Common document types to check for
                        var documentTypes = List.of(
                            "PASSPORT",
                            "TRANSCRIPT",
                            "DIPLOMA",
                            "ENGLISH_TEST",
                            "SOP",
                            "LOR",
                            "CV",
                            "LEAVING_CERTIFICATE",
                            "TWELFTH_MARKSHEET",
                            "TENTH_MARKSHEET"
                        );

                        for (String docType : documentTypes) {
                            var filePart =
                                (org.springframework.http.codec.multipart.FilePart) multipartData.getFirst(
                                    "file_" + docType
                                );

                            if (filePart != null) {
                                // FIX: GenericDocumentService.uploadDocument() already calls
                                // createWorkflowForUpload() internally when applicationId is
                                // present. Calling documentWorkflowService.createDocumentWorkflow()
                                // a second time here was creating a duplicate workflow record for
                                // every bulk-uploaded document. We now simply use the upload
                                // result directly.
                                var uploadMono = genericDocumentService
                                    .uploadDocument(
                                        filePart,
                                        studentId,
                                        "STUDENT",
                                        "STUDENT_DOCUMENT",
                                        docType,
                                        applicationId,
                                        "Bulk upload - " + docType
                                    )
                                    .map(uploadResponse ->
                                        StudentDocumentDTO.StudentUploadResponse.builder()
                                            .success(true)
                                            .uploadId(uploadResponse.getId())
                                            .documentType(docType)
                                            .fileName(uploadResponse.getOriginalFilename())
                                            .fileSize(uploadResponse.getFileSize())
                                            .verificationStatus("PENDING")
                                            .reviewStatus("AWAITING_REVIEW")
                                            .uploadTimestamp(LocalDateTime.now())
                                            .build()
                                    )
                                    .onErrorReturn(
                                        StudentDocumentDTO.StudentUploadResponse.builder()
                                            .success(false)
                                            .documentType(docType)
                                            .message("Upload failed")
                                            .build()
                                    );

                                uploadResults.add(uploadMono);
                            }
                        }

                        if (uploadResults.isEmpty()) {
                            return Mono.just(
                                StudentDocumentDTO.BulkUploadResponse.builder()
                                    .success(false)
                                    .message("No files provided for upload")
                                    .totalUploaded(0)
                                    .successfulUploads(List.of())
                                    .failedUploads(List.of())
                                    .uploadSummary(
                                        StudentDocumentDTO.BulkUploadSummary.builder()
                                            .totalAttempted(0)
                                            .successfulCount(0)
                                            .failedCount(0)
                                            .completionPercentage(0)
                                            .nextSteps(
                                                "Please provide files for upload"
                                            )
                                            .build()
                                    )
                                    .build()
                            );
                        }

                        return Flux.fromIterable(uploadResults)
                            .flatMap(mono -> mono)
                            .collectList()
                            .map(results -> {
                                var successful = results
                                    .stream()
                                    .filter(r -> r.getSuccess())
                                    .toList();

                                var failed = results
                                    .stream()
                                    .filter(r -> !r.getSuccess())
                                    .map(r ->
                                        StudentDocumentDTO.FailedUploadItem.builder()
                                            .documentType(r.getDocumentType())
                                            .errorMessage(r.getMessage())
                                            .errorCode("UPLOAD_ERROR")
                                            .build()
                                    )
                                    .toList();

                                int totalAttempted = results.size();
                                int successfulCount = successful.size();
                                int completionPercentage =
                                    totalAttempted > 0
                                        ? (successfulCount * 100) /
                                          totalAttempted
                                        : 0;

                                return StudentDocumentDTO.BulkUploadResponse.builder()
                                    .success(successfulCount > 0)
                                    .message(
                                        String.format(
                                            "Bulk upload completed: %d successful, %d failed",
                                            successfulCount,
                                            failed.size()
                                        )
                                    )
                                    .totalUploaded(successfulCount)
                                    .successfulUploads(successful)
                                    .failedUploads(failed)
                                    .uploadSummary(
                                        StudentDocumentDTO.BulkUploadSummary.builder()
                                            .totalAttempted(totalAttempted)
                                            .successfulCount(successfulCount)
                                            .failedCount(failed.size())
                                            .completionPercentage(
                                                completionPercentage
                                            )
                                            .nextSteps(
                                                completionPercentage == 100
                                                    ? "All documents uploaded successfully"
                                                    : "Review failed uploads and retry"
                                            )
                                            .build()
                                    )
                                    .build();
                            });
                    })
                    .flatMap(bulkResponse ->
                        ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(bulkResponse)
                    );
            })
            .doOnSuccess(response ->
                log.info("Bulk upload completed successfully")
            )
            .onErrorResume(error -> {
                log.error("Error in bulk upload", error);
                return ServerResponse.badRequest()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(
                        StudentDocumentDTO.BulkUploadResponse.builder()
                            .success(false)
                            .message(
                                "Bulk upload failed: " + error.getMessage()
                            )
                            .build()
                    );
            });
    }

    // ===== HELPER METHODS FOR DOCUMENT MANAGEMENT =====

    /**
     * Standard document checklist — every student should have these ready.
     * Tuples: {document_type, required}
     * "required" = true means compulsory for most applications.
     */
    /**
     * Standard document checklist — every student should have these ready.
     * Columns: {document_type, required, category}
     * category values: ACADEMIC | LANGUAGE | PERSONAL | CERTIFICATE
     */
    private static final List<Object[]> STANDARD_DOCUMENT_CHECKLIST = List.of(
        // ── Academic Documents ─────────────────────────────────────────────────
        new Object[]{"TENTH_MARKSHEET",            true,  "ACADEMIC"},
        new Object[]{"TWELFTH_MARKSHEET",           true,  "ACADEMIC"},
        new Object[]{"LEAVING_CERTIFICATE",         true,  "ACADEMIC"},
        new Object[]{"ENGLISH_MEDIUM_CERTIFICATE",  true,  "ACADEMIC"},
        new Object[]{"BACHELOR_MARKSHEET",          false, "ACADEMIC"},
        new Object[]{"BACHELOR_TRANSCRIPT",         false, "ACADEMIC"},
        new Object[]{"DEGREE_CERTIFICATE",          false, "ACADEMIC"},
        new Object[]{"BACHELOR_SYLLABUS",           false, "ACADEMIC"},
        new Object[]{"JEE_EXAM",                    false, "ACADEMIC"},
        // ── English Proficiency ────────────────────────────────────────────────
        new Object[]{"ENGLISH_TEST",                false, "LANGUAGE"},
        // ── Personal Documents ─────────────────────────────────────────────────
        new Object[]{"PASSPORT",                    true,  "PERSONAL"},
        new Object[]{"CV",                          true,  "PERSONAL"},
        new Object[]{"LOR",                         true,  "PERSONAL"},
        new Object[]{"COLOUR_PHOTOS",               true,  "PERSONAL"},
        new Object[]{"APS_CERTIFICATE",             false, "PERSONAL"},
        // ── Certificates ───────────────────────────────────────────────────────
        new Object[]{"EXTRA_CURRICULAR",            false, "CERTIFICATE"},
        new Object[]{"GERMAN_LANGUAGE_CERTIFICATE", false, "CERTIFICATE"},
        new Object[]{"WORK_EXPERIENCE",             false, "CERTIFICATE"}
    );

    private Flux<
        StudentDocumentDTO.PendingDocumentItem
    > getPendingDocumentsForStudent(Long studentId) {
        log.debug("Getting pending documents for student: {}", studentId);

        // 1. Collect what the student has already uploaded (from documents_upload table)
        Mono<List<String>> uploadedTypesMono = genericDocumentService
            .getMyDocuments(studentId)
            .map(doc -> doc.getDocumentType() != null ? doc.getDocumentType().trim().toUpperCase() : "")
            .collectList();

        // 2. Also collect doc types already in a workflow (linked to an application)
        Mono<List<String>> workflowTypesMono = documentWorkflowService
            .getStudentDocumentWorkflows(studentId)
            .map(w -> w.getDocumentType() != null ? w.getDocumentType().trim().toUpperCase() : "")
            .collectList();

        // 3. Also get application-specific required docs (existing logic)
        Mono<List<String>> appRequiredMono = applicationService
            .getApplicationsByStudent(studentId)
            .flatMap(application ->
                workflowInstanceRepository
                    .findByApplicationId(application.getId().toString())
                    .flatMap(wi -> getRequiredDocumentsFromWorkflow(wi.getWorkflowDefinitionKey()))
                    .collectList()
                    .flatMapMany(lists -> Flux.fromIterable(lists).flatMap(Flux::fromIterable))
            )
            .distinct()
            .collectList()
            .defaultIfEmpty(List.of());

        return Mono.zip(uploadedTypesMono, workflowTypesMono, appRequiredMono)
            .flatMapMany(tuple -> {
                List<String> uploaded = tuple.getT1();
                List<String> inWorkflow = tuple.getT2();
                List<String> appRequired = tuple.getT3();

                // Union: everything already handled
                List<String> allDone = new ArrayList<>(uploaded);
                allDone.addAll(inWorkflow);

                // Build pending from standard checklist
                Flux<StudentDocumentDTO.PendingDocumentItem> standardPending =
                    Flux.fromIterable(STANDARD_DOCUMENT_CHECKLIST)
                        .filter(entry -> {
                            String type = (String) entry[0];
                            return allDone.stream().noneMatch(d -> d.equalsIgnoreCase(type));
                        })
                        .map(entry -> {
                            String type     = (String)  entry[0];
                            boolean required = (Boolean) entry[1];
                            String category = (String)  entry[2];
                            return createPendingDocumentItem(
                                type,
                                getDisplayNameForDocumentType(type),
                                getDescriptionForDocumentType(type),
                                required,
                                category
                            );
                        });

                // Also surface application-required docs that are truly pending
                Flux<StudentDocumentDTO.PendingDocumentItem> appPending =
                    Flux.fromIterable(appRequired)
                        .filter(type -> allDone.stream().noneMatch(d -> d.equalsIgnoreCase(type)))
                        // avoid duplicates with standard checklist
                        .filter(type -> STANDARD_DOCUMENT_CHECKLIST.stream()
                            .noneMatch(e -> ((String)e[0]).equalsIgnoreCase(type)))
                        .map(type -> createPendingDocumentItem(
                            type,
                            getDisplayNameForDocumentType(type),
                            getDescriptionForDocumentType(type),
                            true, // app-required = required
                            "ACADEMIC" // default category for app-required docs
                        ));

                return Flux.merge(standardPending, appPending);
            })
            .doOnNext(doc ->
                log.debug("Found pending document: {}", doc.getDocumentType())
            )
            .onErrorResume(error -> {
                log.error(
                    "Error getting pending documents for student: {}",
                    studentId,
                    error
                );
                return Flux.empty();
            });
    }

    private Flux<List<String>> getRequiredDocumentsFromWorkflow(
        String workflowDefinitionKey
    ) {
        log.debug(
            "Getting required documents from workflow: {}",
            workflowDefinitionKey
        );

        // This would ideally read from the workflow configuration
        // For now, map known workflow keys to their required documents based on uni360.yml
        return Mono.fromCallable(() -> {
            return switch (workflowDefinitionKey.toUpperCase()) {
                case "GERMANY_BACHELORS_WORKFLOW" -> List.of(
                    "TRANSCRIPT",
                    "DIPLOMA",
                    "PASSPORT",
                    "APS_CERTIFICATE"
                );
                case "UK_MASTERS_WORKFLOW" -> List.of(
                    "TRANSCRIPT",
                    "DEGREE_CERTIFICATE",
                    "PASSPORT",
                    "ENGLISH_TEST",
                    "SOP",
                    "LOR"
                );
                case "CANADA_BACHELORS_WORKFLOW" -> List.of(
                    "TRANSCRIPT",
                    "DIPLOMA",
                    "PASSPORT",
                    "ENGLISH_TEST",
                    "SOP"
                );
                default -> List.of(
                    "PASSPORT",
                    "TRANSCRIPT",
                    "ENGLISH_TEST",
                    "SOP"
                ); // Default required documents
            };
        }).flux();
    }

    private String getDescriptionForDocumentType(String documentType) {
        if (documentType == null) return "Required document for application";
        return switch (documentType.toUpperCase()) {
            // Academic
            case "TENTH_MARKSHEET"            -> "10th standard mark sheet — Notary attested & True Copy required";
            case "TWELFTH_MARKSHEET"          -> "12th standard mark sheet — Notary attested & True Copy required";
            case "LEAVING_CERTIFICATE"        -> "School leaving certificate — Notary attested & True Copy required";
            case "ENGLISH_MEDIUM_CERTIFICATE" -> "Letter confirming Bachelor's program was in English — Notary attested";
            case "BACHELOR_MARKSHEET"         -> "Bachelor's mark sheet — Notary attested & True Copy (if applicable)";
            case "BACHELOR_TRANSCRIPT"        -> "Bachelor's official transcript — Sealed by issuing college";
            case "DEGREE_CERTIFICATE"         -> "Degree certificate — Sealed by issuing college";
            case "BACHELOR_SYLLABUS"          -> "Bachelors syllabus in PDF format (if applicable)";
            case "JEE_EXAM"                   -> "JEE Main/Advanced score card (if applicable)";
            case "TRANSCRIPT", "TRANSCRIPTS"  -> "Official academic transcripts";
            case "DIPLOMA"                    -> "Diploma or degree certificate";
            // English Proficiency
            case "ENGLISH_TEST"               -> "TOEFL / IELTS / GRE score card (if applicable)";
            // Personal
            case "PASSPORT"                   -> "Valid passport — Notary attested & True Copy required";
            case "CV"                         -> "Curriculum Vitae — Word file (.doc/.docx) only";
            case "LOR"                        -> "2 Letters of Recommendation — Sealed by issuing institution";
            case "COLOUR_PHOTOS"              -> "Recent passport-size colour photographs";
            case "APS_CERTIFICATE"            -> "APS Certificate (required for Germany, once received)";
            // Certificates
            case "EXTRA_CURRICULAR"           -> "Extra curricular activity certificates (if applicable)";
            case "GERMAN_LANGUAGE_CERTIFICATE"-> "German language certificate — Notary attested (if applicable)";
            case "WORK_EXPERIENCE"            -> "Work experience / employment certificate — Notary attested (if applicable)";
            // Other
            case "SOP"                        -> "Statement of Purpose";
            case "FINANCIAL_PROOF"            -> "Financial proof / bank statement";
            default                           -> "Required document for application";
        };
    }

    private Flux<
        StudentDocumentDTO.UploadedDocumentItem
    > getUploadedDocumentsForStudent(Long studentId) {
        /*
         * FIX: Deduplicate by document type.
         *
         * Previous bug: we iterated over ALL rows in documents_upload for this student.
         * If a student re-uploaded the same document type (e.g. PASSPORT twice), both
         * raw upload rows appeared in the response — causing visible duplicates.
         *
         * New approach:
         *   1. Build a map of document_type → workflow (is_current_version = true) from
         *      document_workflow. This gives at most ONE entry per type per student.
         *   2. For each workflow entry, emit one UploadedDocumentItem using the workflow's
         *      linked upload record (the canonical current version).
         *   3. For uploads that have NO workflow yet (library items), also deduplicate by
         *      type — keep only the latest upload per type.
         */

        // Step 1: workflow entries keyed by document type (already unique because
        // is_current_version = true guarantees at most one active record per type).
        Mono<java.util.Map<String, com.uniflow.document.dto.DocumentWorkflowDTO.StudentDocumentResponse>> workflowByTypeMono =
            documentWorkflowService
                .getStudentDocumentWorkflows(studentId)
                .collectList()
                .map(list -> {
                    java.util.Map<String, com.uniflow.document.dto.DocumentWorkflowDTO.StudentDocumentResponse> map =
                        new java.util.LinkedHashMap<>();
                    for (var w : list) {
                        if (w.getDocumentType() != null) {
                            // putIfAbsent keeps the first (newest, since repo orders DESC)
                            map.putIfAbsent(w.getDocumentType().toUpperCase(), w);
                        }
                    }
                    return map;
                })
                .defaultIfEmpty(java.util.Collections.emptyMap());

        // Step 2: latest upload per document type (for library items without a workflow)
        Mono<java.util.Map<String, com.uniflow.document.entity.DocumentsUpload>> latestUploadByTypeMono =
            genericDocumentService
                .getMyDocuments(studentId)
                .filter(u -> u.getIsActive() != null && u.getIsActive())
                .collectList()
                .map(uploads -> {
                    // List is already ordered DESC by created_at from the repository.
                    // putIfAbsent keeps the first = most recent upload per type.
                    java.util.Map<String, com.uniflow.document.entity.DocumentsUpload> map =
                        new java.util.LinkedHashMap<>();
                    for (var u : uploads) {
                        String t = u.getDocumentType() != null
                            ? u.getDocumentType().trim().toUpperCase()
                            : "GENERAL";
                        map.putIfAbsent(t, u);
                    }
                    return map;
                })
                .defaultIfEmpty(java.util.Collections.emptyMap());

        return Mono.zip(workflowByTypeMono, latestUploadByTypeMono)
            .flatMapMany(tuple -> {
                var workflowByType   = tuple.getT1();
                var latestUploadByType = tuple.getT2();

                // Merge: start from workflow entries (one per type), then add library-only uploads.
                java.util.Set<String> processedTypes = new java.util.LinkedHashSet<>();
                java.util.List<Mono<StudentDocumentDTO.UploadedDocumentItem>> items = new java.util.ArrayList<>();

                // --- workflow-linked documents ---
                for (var entry : workflowByType.entrySet()) {
                    String type     = entry.getKey();
                    var    workflow = entry.getValue();
                    processedTypes.add(type);

                    String verificationStatus = workflow.getVerificationStatus() != null
                        ? workflow.getVerificationStatus() : "PENDING";
                    String reviewStatus = workflow.getReviewStatus() != null
                        ? workflow.getReviewStatus() : "AWAITING_REVIEW";
                    String statusDisplay = buildStatusDisplay(verificationStatus, reviewStatus);

                    // Prefer the upload record linked to the workflow; fall back to latestUploadByType.
                    com.uniflow.document.entity.DocumentsUpload linkedUpload = latestUploadByType.get(type);
                    String  fileName  = workflow.getFileName() != null  ? workflow.getFileName()  : (linkedUpload != null ? linkedUpload.getOriginalFilename() : null);
                    Long    fileSize  = linkedUpload != null && linkedUpload.getFileSize() != null ? linkedUpload.getFileSize() : 0L;
                    java.time.LocalDateTime uploadedAt = workflow.getUploadedAt() != null
                        ? workflow.getUploadedAt()
                        : (linkedUpload != null ? linkedUpload.getCreatedAt() : null);
                    java.util.UUID uploadId = linkedUpload != null ? linkedUpload.getId()
                        : (workflow.getWorkflowId() != null ? workflow.getWorkflowId() : null); // best-effort

                    String displayName = getDisplayNameForDocumentType(type);
                    if ("OTHER_DOC".equalsIgnoreCase(type) && linkedUpload != null && linkedUpload.getDescription() != null && !linkedUpload.getDescription().isBlank()) {
                        displayName = linkedUpload.getDescription().trim();
                    }

                    items.add(Mono.just(
                        StudentDocumentDTO.UploadedDocumentItem.builder()
                            .workflowId(workflow.getWorkflowId())
                            .uploadId(uploadId)
                            .documentType(type)
                            .displayName(displayName)
                            .documentCategory(getCategoryForDocumentType(type))
                            .fileName(fileName)
                            .fileSize(fileSize)
                            .verificationStatus(verificationStatus)
                            .reviewStatus(reviewStatus)
                            .reviewNotes(workflow.getReviewNotes())
                            .statusDisplay(statusDisplay)
                            .uploadedAt(uploadedAt)
                            .viewUrlAvailable(true)
                            .canDelete(false) // workflow-linked docs cannot be deleted
                            .build()
                    ));
                }

                // --- library-only documents (no workflow) ---
                for (var entry : latestUploadByType.entrySet()) {
                    String type   = entry.getKey();
                    var    upload = entry.getValue();
                    if (processedTypes.contains(type)) continue; // already handled above

                    String displayName = getDisplayNameForDocumentType(type);
                    if ("OTHER_DOC".equalsIgnoreCase(type) && upload.getDescription() != null && !upload.getDescription().isBlank()) {
                        displayName = upload.getDescription().trim();
                    }

                    items.add(Mono.just(
                        StudentDocumentDTO.UploadedDocumentItem.builder()
                            .workflowId(null)
                            .uploadId(upload.getId())
                            .documentType(type)
                            .displayName(displayName)
                            .documentCategory(getCategoryForDocumentType(type))
                            .fileName(upload.getOriginalFilename())
                            .fileSize(upload.getFileSize() != null ? upload.getFileSize() : 0L)
                            .verificationStatus("LIBRARY")
                            .reviewStatus("NOT_SUBMITTED")
                            .reviewNotes("Saved in your document library. Submit to an application for review.")
                            .statusDisplay("Library Document")
                            .uploadedAt(upload.getCreatedAt())
                            .viewUrlAvailable(true)
                            .canDelete(true)
                            .build()
                    ));
                }

                return Flux.fromIterable(items).flatMap(m -> m);
            });
    }

    private Flux<
        StudentDocumentDTO.ReuploadDocumentItem
    > getReuploadDocumentsForStudent(Long studentId) {
        return documentWorkflowService
            .getStudentDocumentWorkflows(studentId)
            .filter(workflow -> {
                String s = workflow.getVerificationStatus();
                // null-safe; include both REJECTED and REUPLOAD_REQUIRED statuses
                return s != null && ("REJECTED".equals(s) || "REUPLOAD_REQUIRED".equals(s));
            })
            .map(workflow ->
                StudentDocumentDTO.ReuploadDocumentItem.builder()
                    .workflowId(workflow.getWorkflowId())
                    .documentType(workflow.getDocumentType())
                    .documentCategory(getCategoryForDocumentType(workflow.getDocumentType()))
                    .displayName(
                        getDisplayNameForDocumentType(
                            workflow.getDocumentType()
                        )
                    )
                    .previousFileName(workflow.getFileName())
                    .rejectionReason(
                        workflow.getReviewNotes() != null 
                            ? workflow.getReviewNotes() 
                            : "Document requires revision"
                    )
                    .reviewNotes(
                        workflow.getReviewNotes() != null 
                            ? workflow.getReviewNotes() 
                            : "Please check document quality and requirements"
                    )
                    .rejectedAt(workflow.getUploadedAt()) // Using uploaded time for rejection time
                    .resubmissionDeadline(LocalDateTime.now().plusDays(7))
                    .daysUntilDeadline(7L)
                    .acceptedFormats(List.of("PDF", "JPG", "PNG"))
                    .maxFileSize("10MB")
                    .requirements(
                        "Clear, legible document in acceptable format"
                    )
                    .build()
            );
    }

    private Mono<
        StudentDocumentDTO.DocumentOverviewSummary
    > getDocumentOverviewSummary(Long studentId) {
        return documentWorkflowService
            .getStudentDocumentWorkflows(studentId)
            .collectList()
            .map(workflows -> {
                int totalRequired = 5; // Common required documents
                int uploadedCount = workflows.size();
                int verifiedCount = (int) workflows
                    .stream()
                    .filter(w -> w.getVerificationStatus().equals("VERIFIED"))
                    .count();
                int pendingReviewCount = (int) workflows
                    .stream()
                    .filter(w -> w.getReviewStatus().equals("AWAITING_REVIEW"))
                    .count();
                int rejectedCount = (int) workflows
                    .stream()
                    .filter(w -> w.getVerificationStatus().equals("REJECTED"))
                    .count();

                String overallStatus = determineOverallDocumentStatus(
                    verifiedCount,
                    totalRequired,
                    rejectedCount
                );

                return StudentDocumentDTO.DocumentOverviewSummary.builder()
                    .totalRequired(totalRequired)
                    .uploadedCount(uploadedCount)
                    .verifiedCount(verifiedCount)
                    .pendingReviewCount(pendingReviewCount)
                    .rejectedCount(rejectedCount)
                    .overallStatus(overallStatus)
                    .build();
            });
    }

    private StudentDocumentDTO.PendingDocumentItem createPendingDocumentItem(
        String type,
        String displayName,
        String description,
        boolean required,
        String category
    ) {
        return StudentDocumentDTO.PendingDocumentItem.builder()
            .documentType(type)
            .displayName(displayName)
            .description(description)
            .isRequired(required)
            .documentCategory(category != null ? category : getCategoryForDocumentType(type))
            .submissionDeadline(LocalDateTime.now().plusDays(30))
            .daysUntilDeadline(30L)
            .priorityLevel(required ? "HIGH" : "MEDIUM")
            .acceptedFormats(List.of("PDF", "JPG", "PNG"))
            .maxFileSize("10MB")
            .build();
    }

    /** Overload kept for backward compat — derives category automatically */
    private StudentDocumentDTO.PendingDocumentItem createPendingDocumentItem(
        String type,
        String displayName,
        String description,
        boolean required
    ) {
        return createPendingDocumentItem(type, displayName, description, required, null);
    }

    private String getDisplayNameForDocumentType(String documentType) {
        if (documentType == null) return "Document";
        return switch (documentType.toUpperCase()) {
            // Academic
            case "TENTH_MARKSHEET"           -> "10th Mark Sheet – Notary & True Copy";
            case "TWELFTH_MARKSHEET"         -> "12th Mark Sheet – Notary & True Copy";
            case "LEAVING_CERTIFICATE"       -> "School Leaving Certificate – Notary & True Copy";
            case "ENGLISH_MEDIUM_CERTIFICATE"-> "English Medium Certificate – Notary & True Copy";
            case "BACHELOR_MARKSHEET"        -> "Bachelor Mark Sheet – Notary & True Copy";
            case "BACHELOR_TRANSCRIPT"       -> "Bachelor Transcript – Sealed by College";
            case "DEGREE_CERTIFICATE"        -> "Degree Certificate – Sealed by College";
            case "BACHELOR_SYLLABUS"         -> "Bachelors Syllabus PDF";
            case "JEE_EXAM"                  -> "JEE Exam Score";
            case "TRANSCRIPT", "TRANSCRIPTS" -> "Academic Transcripts";
            case "DIPLOMA"                   -> "Diploma Certificate";
            // English Proficiency
            case "ENGLISH_TEST"              -> "TOEFL / IELTS / GRE";
            case "IELTS"                     -> "IELTS Score";
            case "TOEFL"                     -> "TOEFL Score";
            case "GRE"                       -> "GRE Score";
            // Personal
            case "PASSPORT"                  -> "Passport – Notary & True Copy";
            case "CV"                        -> "Curriculum Vitae (Word file)";
            case "LOR"                       -> "Letters of Recommendation – Sealed by College";
            case "COLOUR_PHOTOS"             -> "Colour Photos";
            case "APS_CERTIFICATE"           -> "APS Certificate";
            // Certificates
            case "EXTRA_CURRICULAR"          -> "Extra Curricular Certificates";
            case "GERMAN_LANGUAGE_CERTIFICATE"-> "German Language Certificate – Notary & True Copy";
            case "WORK_EXPERIENCE"           -> "Work Experience Certificate – Notary & True Copy";
            // Other
            case "SOP"                       -> "Statement of Purpose";
            case "FINANCIAL_PROOF"           -> "Financial Proof";
            default                          -> documentType.replace("_", " ");
        };
    }

    /**
     * Map a document type string to its frontend category label.
     * Mirrors determineDocumentCategory() in DocumentWorkflowService but uses the
     * student-portal category names: ACADEMIC | LANGUAGE | PERSONAL | CERTIFICATE | OTHER
     */
    private String getCategoryForDocumentType(String documentType) {
        if (documentType == null) return "OTHER";
        return switch (documentType.toUpperCase()) {
            case
                "TENTH_MARKSHEET",
                "TWELFTH_MARKSHEET",
                "LEAVING_CERTIFICATE",
                "ENGLISH_MEDIUM_CERTIFICATE",
                "BACHELOR_MARKSHEET",
                "BACHELOR_TRANSCRIPT",
                "DEGREE_CERTIFICATE",
                "BACHELOR_SYLLABUS",
                "JEE_EXAM",
                "TRANSCRIPT",
                "TRANSCRIPTS",
                "DIPLOMA",
                "ACADEMIC_RECORDS",
                "MARKSHEET" -> "ACADEMIC";
            case
                "ENGLISH_TEST",
                "IELTS",
                "TOEFL",
                "GRE",
                "PTE",
                "LANGUAGE_TEST" -> "LANGUAGE";
            case
                "PASSPORT",
                "CV",
                "LOR",
                "COLOUR_PHOTOS",
                "APS_CERTIFICATE",
                "VISA",
                "ID_CARD",
                "SOP",
                "STATEMENT_OF_PURPOSE",
                "RESUME",
                "CURRICULUM_VITAE",
                "LETTER_OF_RECOMMENDATION",
                "REFERENCE_LETTER" -> "PERSONAL";
            case
                "EXTRA_CURRICULAR",
                "GERMAN_LANGUAGE_CERTIFICATE",
                "WORK_EXPERIENCE",
                "EXPERIENCE_LETTER",
                "EMPLOYMENT_CERTIFICATE",
                "WES_EVALUATION",
                "CREDENTIAL_EVALUATION",
                "FINANCIAL_PROOF",
                "BANK_STATEMENT" -> "CERTIFICATE";
            default -> "OTHER";
        };
    }

    private String buildStatusDisplay(
        String verificationStatus,
        String reviewStatus
    ) {
        if ("VERIFIED".equals(verificationStatus)) {
            return "✅ Verified";
        } else if ("REJECTED".equals(verificationStatus)) {
            return "❌ Rejected";
        } else if ("AWAITING_REVIEW".equals(reviewStatus)) {
            return "⏳ Under Review";
        } else {
            return "📋 Pending";
        }
    }

    private String determineOverallDocumentStatus(
        int verified,
        int total,
        int rejected
    ) {
        if (verified == total) {
            return "COMPLETE";
        } else if (rejected > 0) {
            return "REQUIRES_ATTENTION";
        } else if (verified > 0) {
            return "IN_PROGRESS";
        } else {
            return "NOT_STARTED";
        }
    }

    private LocalDateTime findNextDeadline(
        List<StudentDocumentDTO.PendingDocumentItem> pending,
        List<StudentDocumentDTO.ReuploadDocumentItem> reupload
    ) {
        LocalDateTime nextPendingDeadline = pending
            .stream()
            .map(StudentDocumentDTO.PendingDocumentItem::getSubmissionDeadline)
            .filter(deadline -> deadline != null)
            .min(LocalDateTime::compareTo)
            .orElse(null);

        LocalDateTime nextReuploadDeadline = reupload
            .stream()
            .map(
                StudentDocumentDTO.ReuploadDocumentItem::getResubmissionDeadline
            )
            .filter(deadline -> deadline != null)
            .min(LocalDateTime::compareTo)
            .orElse(null);

        if (nextPendingDeadline == null) return nextReuploadDeadline;
        if (nextReuploadDeadline == null) return nextPendingDeadline;

        return nextPendingDeadline.isBefore(nextReuploadDeadline)
            ? nextPendingDeadline
            : nextReuploadDeadline;
    }

    /**
     * Helper method to extract form field values from multipart data
     * Follows same pattern as GenericDocumentHandler
     */
    private String getFormField(
        org.springframework.util.MultiValueMap<
            String,
            org.springframework.http.codec.multipart.Part
        > multipartData,
        String fieldName
    ) {
        org.springframework.http.codec.multipart.Part part =
            multipartData.getFirst(fieldName);
        if (part == null) {
            return null;
        }

        if (
            part instanceof
                org.springframework.http.codec.multipart.FormFieldPart
        ) {
            return (
                (org.springframework.http.codec.multipart.FormFieldPart) part
            ).value();
        }

        return null;
    }
}
