package com.uniflow.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.application.dto.ApplicationRequestDTO;
import com.uniflow.application.dto.ApplicationResponseDTO;
import com.uniflow.application.entity.Application;
import com.uniflow.application.repository.ApplicationRepository;
import com.uniflow.auth.dto.UserJwtDto;
import com.uniflow.auth.repository.UserRepository;
import com.uniflow.auth.util.CommonHelperUtils;
import com.uniflow.notification.service.WorkflowNotificationService;
import com.uniflow.university.repository.CourseRepository;
import com.uniflow.university.repository.UniversityRepository;
import com.uniflow.university.service.UniversityService;
import com.uniflow.document.repository.DocumentWorkflowRepository;
import com.uniflow.workflow.repository.TaskRepository;
import com.uniflow.workflow.repository.WorkflowDefinitionRepository;
import com.uniflow.workflow.repository.WorkflowInstanceRepository;
import com.uniflow.workflow.service.ApplicationWorkflowTrigger;
import com.uniflow.workflow.service.WorkflowDataAggregationService;
import io.r2dbc.postgresql.codec.Json;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * ApplicationService - Comprehensive Business Logic for Application Management
 *
 * <p>This service handles all business operations for university applications, including creation,
 * updates, status management, assignment workflows, and integration with other microservices.
 *
 * <p>Key Features: - Complete application lifecycle management - Document verification and tracking
 * - Payment processing and validation - SLA monitoring and deadline management - Assignment and
 * workload distribution - Status transitions and workflow integration - Analytics and reporting -
 * Multi-client and multi-tenant support - Integration with universities and students services
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-01
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final CommonHelperUtils commonHelperUtils;
    private final ApplicationWorkflowTrigger workflowTrigger;
    private final WorkflowNotificationService workflowNotificationService;
    private final UniversityRepository universityRepository;
    private final CourseRepository courseRepository;
    private final UniversityService universityService;
    private final WorkflowDataAggregationService workflowDataAggregationService;
    private final WorkflowDefinitionRepository workflowDefinitionRepository;
    private final WorkflowInstanceRepository workflowInstanceRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final DocumentWorkflowRepository documentWorkflowRepository;

    // ========================================
    // CORE CRUD OPERATIONS
    // ========================================

    // ========================================
    // JWT USER CONTEXT METHODS (PHASE 5)
    // ========================================

    /**
     * Create a new application with user context validation
     */
    @Transactional
    public Mono<ApplicationResponseDTO> createApplicationWithUserContext(
        ApplicationRequestDTO requestDTO,
        UserJwtDto user
    ) {
        log.info(
            "Creating new application for student: {} by user: {} ({})",
            requestDTO.getStudentId(),
            user.getUsername(),
            user.getUserType()
        );

        return validateUserCanCreateApplication(user, requestDTO).flatMap(
            canCreate -> {
                if (!canCreate) {
                    return Mono.error(
                        new SecurityException(
                            "User does not have permission to create this application"
                        )
                    );
                }
                return createApplication(
                    requestDTO,
                    user.getId(),
                    user.getClientType()
                );
            }
        );
    }

    /**
     * Get application by ID with user context validation
     */
    public Mono<ApplicationResponseDTO> getApplicationByIdWithUserContext(
        UUID applicationId,
        UserJwtDto user
    ) {
        log.debug(
            "Getting application {} for user: {} ({})",
            applicationId,
            user.getUsername(),
            user.getUserType()
        );

        return getApplicationById(applicationId).flatMap(application ->
            validateUserCanAccessApplication(user, application).flatMap(
                canAccess -> {
                    if (!canAccess) {
                        return Mono.error(
                            new SecurityException(
                                "Access denied to application"
                            )
                        );
                    }
                    return Mono.just(application);
                }
            )
        );
    }

    /**
     * Get all applications with user-level filtering
     */
    public Flux<ApplicationResponseDTO> getAllApplicationsWithUserContext(
        UserJwtDto user
    ) {
        log.debug(
            "Getting applications for user: {} ({})",
            user.getUsername(),
            user.getUserType()
        );

        // Students see only their applications
        if ("STUDENT".equals(user.getUserType())) {
            // Convert Long user ID to UUID - temporary fix until proper StudentProfile lookup
            long studentId = user.getId();

            return getApplicationsByStudent(studentId);
        }

        // Admins see applications in their territory
        if ("ADMIN".equals(user.getUserType())) {
            return getApplicationsByAdminTerritory(user);
        }

        // Super admins see all applications
        if ("SUPER_ADMIN".equals(user.getUserType())) {
            return getAllApplications();
        }

        return Flux.empty();
    }

    /**
     * Get application by reference with user context validation
     */
    public Mono<
        ApplicationResponseDTO
    > getApplicationByReferenceWithUserContext(
        String referenceNumber,
        UserJwtDto user
    ) {
        log.debug(
            "Getting application by reference {} for user: {} ({})",
            referenceNumber,
            user.getUsername(),
            user.getUserType()
        );

        return getApplicationByReference(referenceNumber).flatMap(application ->
            validateUserCanAccessApplication(user, application).flatMap(
                canAccess -> {
                    if (!canAccess) {
                        return Mono.error(
                            new SecurityException(
                                "Access denied to application"
                            )
                        );
                    }
                    return Mono.just(application);
                }
            )
        );
    }

    /**
     * Update application with user context validation
     */
    @Transactional
    public Mono<ApplicationResponseDTO> updateApplicationWithUserContext(
        UUID applicationId,
        ApplicationRequestDTO requestDTO,
        UserJwtDto user
    ) {
        log.info(
            "Updating application {} by user: {} ({})",
            applicationId,
            user.getUsername(),
            user.getUserType()
        );

        return getApplicationById(applicationId).flatMap(application ->
            validateUserCanModifyApplication(user, application).flatMap(
                canModify -> {
                    if (!canModify) {
                        return Mono.error(
                            new SecurityException(
                                "Access denied to modify application"
                            )
                        );
                    }
                    return updateApplication(
                        applicationId,
                        requestDTO,
                        user.getId(),
                        user.getClientType()
                    );
                }
            )
        );
    }

    /**
     * Update application status with user context validation
     */
    @Transactional
    public Mono<ApplicationResponseDTO> updateApplicationStatusWithUserContext(
        UUID applicationId,
        String status,
        UserJwtDto user
    ) {
        log.info(
            "Updating application status {} to {} by user: {} ({})",
            applicationId,
            status,
            user.getUsername(),
            user.getUserType()
        );

        // Only admins can update status
        if (
            !"ADMIN".equals(user.getUserType()) &&
            !"SUPER_ADMIN".equals(user.getUserType())
        ) {
            return Mono.error(
                new SecurityException(
                    "Only admins can update application status"
                )
            );
        }

        return getApplicationById(applicationId).flatMap(application ->
            validateUserCanModifyApplication(user, application).flatMap(
                canModify -> {
                    if (!canModify) {
                        return Mono.error(
                            new SecurityException(
                                "Access denied to modify application"
                            )
                        );
                    }
                    return updateApplicationStatus(
                        applicationId,
                        status,
                        "Status updated by " + user.getUsername(),
                        user.getId()
                    );
                }
            )
        );
    }

    /**
     * Delete application with user context validation
     */
    @Transactional
    public Mono<Void> deleteApplicationWithUserContext(
        UUID applicationId,
        UserJwtDto user
    ) {
        log.info(
            "Deleting application {} by user: {} ({})",
            applicationId,
            user.getUsername(),
            user.getUserType()
        );

        // Only admins can delete applications
        if (
            !"ADMIN".equals(user.getUserType()) &&
            !"SUPER_ADMIN".equals(user.getUserType())
        ) {
            return Mono.error(
                new SecurityException("Only admins can delete applications")
            );
        }

        return getApplicationById(applicationId).flatMap(application ->
            validateUserCanModifyApplication(user, application).flatMap(
                canModify -> {
                    if (!canModify) {
                        return Mono.error(
                            new SecurityException(
                                "Access denied to delete application"
                            )
                        );
                    }
                    return deleteApplication(
                        applicationId,
                        UUID.nameUUIDFromBytes(
                            user.getId().toString().getBytes()
                        ),
                        "Deleted by " + user.getUsername()
                    );
                }
            )
        );
    }

    /**
     * Search applications with user context filtering
     */
    public Flux<ApplicationResponseDTO> searchApplicationsWithUserContext(
        com.uniflow.application.dto.ApplicationSearchRequestDTO searchRequest,
        UserJwtDto user
    ) {
        log.debug(
            "Searching applications for user: {} ({})",
            user.getUsername(),
            user.getUserType()
        );

        // Apply user-level filtering to search
        if ("STUDENT".equals(user.getUserType())) {
            searchRequest.setStudentId(user.getId());
        } else if ("ADMIN".equals(user.getUserType())) {
            // Add territory filtering for admin
            // Note: setTerritoryIdentifier method may not exist in DTO
            // TODO: Add territory filtering logic here if needed
        }

        return searchApplicationsAdvanced(searchRequest);
    }

    /**
     * Search applications with SearchRequestDTO
     */
    private Flux<ApplicationResponseDTO> searchApplicationsAdvanced(
        com.uniflow.application.dto.ApplicationSearchRequestDTO searchRequest
    ) {
        return searchApplications(
            searchRequest.getStatus(),
            searchRequest.getPriority(),
            searchRequest.getApplicationType(),
            searchRequest.getAssignedAdminId(),
            searchRequest.getStudentId(),
            searchRequest.getTargetUniversityId(),
            searchRequest.getWorkflowStage(),
            searchRequest.getRequiresAttention(),
            searchRequest.getIsUrgent(),
            searchRequest.getIsOverdue(),
            searchRequest.getSortBy(),
            searchRequest.getPage(),
            searchRequest.getSize()
        );
    }

    /**
     * Get applications requiring attention with user context
     */
    public Flux<
        ApplicationResponseDTO
    > getApplicationsRequiringAttentionWithUserContext(UserJwtDto user) {
        log.debug(
            "Getting applications requiring attention for user: {} ({})",
            user.getUsername(),
            user.getUserType()
        );

        if ("ADMIN".equals(user.getUserType())) {
            return getApplicationsRequiringAttentionByTerritory(
                user.getTerritoryIdentifier()
            );
        } else if ("SUPER_ADMIN".equals(user.getUserType())) {
            return getApplicationsRequiringAttention();
        }

        return Flux.empty();
    }

    /**
     * Get application statistics with user context
     */
    public Mono<Map<String, Object>> getApplicationStatisticsWithUserContext(
        UserJwtDto user
    ) {
        log.debug(
            "Getting application statistics for user: {} ({})",
            user.getUsername(),
            user.getUserType()
        );

        if ("STUDENT".equals(user.getUserType())) {
            return getStudentApplicationStatistics(user.getId());
        } else if ("ADMIN".equals(user.getUserType())) {
            return getAdminApplicationStatistics(user.getTerritoryIdentifier());
        } else if ("SUPER_ADMIN".equals(user.getUserType())) {
            return getGlobalApplicationStatistics();
        }

        return Mono.just(Map.of());
    }

    // ========================================
    // PRIVATE VALIDATION METHODS
    // ========================================

    /**
     * Validate if user can create application
     */
    private Mono<Boolean> validateUserCanCreateApplication(
        UserJwtDto user,
        ApplicationRequestDTO requestDTO
    ) {
        return Mono.fromCallable(() -> {
            // Students can only create applications for themselves
            if ("STUDENT".equals(user.getUserType())) {
                return user.getId().equals(requestDTO.getStudentId());
            }

            // Admins and super admins can create applications for anyone in their territory
            if (
                "ADMIN".equals(user.getUserType()) ||
                "SUPER_ADMIN".equals(user.getUserType())
            ) {
                return true;
            }

            return false;
        });
    }

    /**
     * Validate if user can access application
     */
    private Mono<Boolean> validateUserCanAccessApplication(
        UserJwtDto user,
        ApplicationResponseDTO application
    ) {
        return Mono.fromCallable(() -> {
            // Students can only access their own applications
            if ("STUDENT".equals(user.getUserType())) {
                return user.getId().equals(application.getStudentId());
            }

            // Super admins can access all applications
            if ("SUPER_ADMIN".equals(user.getUserType())) {
                return true;
            }

            // Admins can access all applications (no territory restriction for direct access)
            if ("ADMIN".equals(user.getUserType())) {
                return true;
            }

            return false;
        });
    }

    /**
     * Validate if user can modify application
     */
    private Mono<Boolean> validateUserCanModifyApplication(
        UserJwtDto user,
        ApplicationResponseDTO application
    ) {
        return Mono.fromCallable(() -> {
            // Students can only modify their own draft applications
            if ("STUDENT".equals(user.getUserType())) {
                return (
                    user.getId().equals(application.getStudentId()) &&
                    "DRAFT".equals(application.getStatus())
                );
            }

            // Super admins can modify all applications
            if ("SUPER_ADMIN".equals(user.getUserType())) {
                return true;
            }

            // Admins can modify applications in their territory
            if ("ADMIN".equals(user.getUserType())) {
                return commonHelperUtils.isApplicationInUserTerritory(
                    application,
                    user
                );
            }

            return false;
        });
    }

    // ========================================
    // TERRITORY-BASED ACCESS METHODS
    // ========================================

    /**
     * Get applications by admin territory
     */
    private Flux<ApplicationResponseDTO> getApplicationsByAdminTerritory(
        UserJwtDto user
    ) {
        return commonHelperUtils
            .getApplicationsByUserTerritory(user)
            .map(this::mapToResponseDTO);
    }

    /**
     * Get all applications (for super admin)
     */
    private Flux<ApplicationResponseDTO> getAllApplications() {
        return applicationRepository
            .findAll()
            .flatMap(this::convertToResponseDTO);
    }

    /**
     * Map entity to response DTO helper
     */
    private ApplicationResponseDTO mapToResponseDTO(Application application) {
        return convertToResponseDTO(application).block();
    }

    /**
     * Get applications requiring attention by territory
     */
    private Flux<
        ApplicationResponseDTO
    > getApplicationsRequiringAttentionByTerritory(String territoryIdentifier) {
        return commonHelperUtils
            .getApplicationsRequiringAttentionByTerritory(territoryIdentifier)
            .map(this::mapToResponseDTO);
    }

    /**
     * Get student application statistics
     */
    private Mono<Map<String, Object>> getStudentApplicationStatistics(
        Long studentId
    ) {
        return applicationRepository
            .countByStudentId(studentId)
            .map(count ->
                Map.of("totalApplications", count, "userType", "STUDENT")
            );
    }

    /**
     * Get admin application statistics
     */
    private Mono<Map<String, Object>> getAdminApplicationStatistics(
        String territoryIdentifier
    ) {
        return commonHelperUtils
            .getApplicationCountByTerritory(territoryIdentifier)
            .map(count ->
                Map.of(
                    "totalApplications",
                    count,
                    "territory",
                    territoryIdentifier,
                    "userType",
                    "ADMIN"
                )
            );
    }

    /**
     * Get global application statistics
     */
    private Mono<Map<String, Object>> getGlobalApplicationStatistics() {
        return applicationRepository
            .count()
            .map(count ->
                Map.of("totalApplications", count, "userType", "SUPER_ADMIN")
            );
    }

    /**
     * Create a new application
     */
    @Transactional
    public Mono<ApplicationResponseDTO> createApplication(
        ApplicationRequestDTO requestDTO
    ) {
        log.info(
            "Creating new application for student: {}",
            requestDTO.getStudentId()
        );

        return validateApplicationRequest(requestDTO)
            // Removed duplicate application validation - allow multiple apps for same intake
            .then(generateReferenceNumber())
            .flatMap(referenceNumber -> {
                // Set defaults and validate
                requestDTO.setDefaults();

                // Build application entity with commission data
                return buildApplicationWithCommissionData(
                    requestDTO,
                    referenceNumber
                )
                    .flatMap(application ->
                        // Save application
                        applicationRepository.save(application)
                    )
                    .doOnSuccess(saved ->
                        log.info(
                            "Created application with ID: {} and reference: {}",
                            saved.getId(),
                            saved.getReferenceNumber()
                        )
                    )
                    .flatMap(this::convertToResponseDTO);
            })
            .onErrorMap(throwable -> {
                log.error(
                    "Error creating application for student: {}",
                    requestDTO.getStudentId(),
                    throwable
                );

                // Handle specific database constraint violations with user-friendly messages
                String errorMessage = throwable.getMessage();
                if (errorMessage != null) {
                    // Return validation errors as-is (from validateApplicationRequest, etc.)
                    if (
                        errorMessage.contains("is required") ||
                        errorMessage.contains("Invalid") ||
                        errorMessage.contains("must be") ||
                        errorMessage.contains("already has an application")
                    ) {
                        return throwable; // Return original exception with exact validation message
                    }

                    // Handle database constraint violations
                    if (
                        errorMessage.contains("applications_university_id_fkey")
                    ) {
                        return new RuntimeException(
                            "Invalid university ID. Please select a valid university."
                        );
                    } else if (
                        errorMessage.contains("applications_course_id_fkey")
                    ) {
                        return new RuntimeException(
                            "Invalid course ID. Please select a valid course for the selected university."
                        );
                    } else if (
                        errorMessage.contains("applications_student_id_fkey")
                    ) {
                        return new RuntimeException(
                            "Invalid student ID. Student not found."
                        );
                    } else if (
                        errorMessage.contains("duplicate key value") ||
                        errorMessage.contains("unique constraint")
                    ) {
                        return new RuntimeException(
                            "An application for this student to this course already exists."
                        );
                    }
                }

                // Return original exception if it has a meaningful message, otherwise generic message
                if (
                    errorMessage != null &&
                    !errorMessage.isEmpty() &&
                    !errorMessage.contains("null")
                ) {
                    return throwable;
                }

                return new RuntimeException(
                    "Failed to create application. Please verify all the provided information and try again."
                );
            });
    }

    /**
     * Get application by ID
     */
    public Mono<ApplicationResponseDTO> getApplicationById(UUID applicationId) {
        log.debug("Fetching application by ID: {}", applicationId);

        return applicationRepository
            .findById(applicationId)
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Application not found with ID: " + applicationId
                    )
                )
            )
            .flatMap(this::convertToResponseDTO)
            .doOnSuccess(app ->
                log.debug("Found application: {}", app.getReferenceNumber())
            );
    }

    /**
     * Get application by reference number
     */
    public Mono<ApplicationResponseDTO> getApplicationByReference(
        String referenceNumber
    ) {
        log.debug("Fetching application by reference: {}", referenceNumber);

        return applicationRepository
            .findByReferenceNumber(referenceNumber)
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Application not found with reference: " +
                            referenceNumber
                    )
                )
            )
            .flatMap(this::convertToResponseDTO)
            .doOnSuccess(app ->
                log.debug("Found application: {}", app.getId())
            );
    }

    /**
     * Update application
     */
    @Transactional
    public Mono<ApplicationResponseDTO> updateApplication(
        UUID applicationId,
        ApplicationRequestDTO requestDTO
    ) {
        log.info("Updating application: {}", applicationId);

        return applicationRepository
            .findById(applicationId)
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Application not found with ID: " + applicationId
                    )
                )
            )
            .flatMap(existingApplication -> {
                // Check if application can be updated
                if (Boolean.TRUE.equals(existingApplication.getIsArchived())) {
                    return Mono.error(
                        new RuntimeException(
                            "Cannot update archived application"
                        )
                    );
                }
                if (Boolean.TRUE.equals(existingApplication.getIsLocked())) {
                    return Mono.error(
                        new RuntimeException("Cannot update locked application")
                    );
                }

                // Update fields
                updateApplicationFromRequest(existingApplication, requestDTO);
                existingApplication.setUpdatedAt(LocalDateTime.now());
                existingApplication.updateCompletionStatus();

                return applicationRepository.save(existingApplication);
            })
            .flatMap(this::convertToResponseDTO)
            .doOnSuccess(updated ->
                log.info(
                    "Updated application: {}",
                    updated.getReferenceNumber()
                )
            );
    }

    /**
     * Delete/Archive application
     */
    @Transactional
    public Mono<Void> deleteApplication(
        UUID applicationId,
        UUID deletedBy,
        String reason
    ) {
        log.info(
            "Archiving application: {} by user: {}",
            applicationId,
            deletedBy
        );

        return applicationRepository
            .findById(applicationId)
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Application not found with ID: " + applicationId
                    )
                )
            )
            .flatMap(application -> {
                application.archive(deletedBy, reason);
                return applicationRepository.save(application);
            })
            .doOnSuccess(archived ->
                log.info(
                    "Archived application: {}",
                    archived.getReferenceNumber()
                )
            )
            .then();
    }

    // ========================================
    // QUERY AND SEARCH OPERATIONS
    // ========================================

    /**
     * Get applications by student
     */
    public Flux<ApplicationResponseDTO> getApplicationsByStudent(
        long studentId
    ) {
        log.debug("Fetching applications for student: {}", studentId);

        return applicationRepository
            .findByStudentId(studentId)
            .flatMap(this::convertToResponseDTO)
            .doOnComplete(() ->
                log.debug(
                    "Completed fetching applications for student: {}",
                    studentId
                )
            );
    }

    /**
     * Get applications by university
     */
    public Flux<ApplicationResponseDTO> getApplicationsByUniversity(
        UUID universityId
    ) {
        log.debug("Fetching applications for university: {}", universityId);

        return applicationRepository
            .findByTargetUniversityId(universityId)
            .flatMap(this::convertToResponseDTO)
            .doOnComplete(() ->
                log.debug(
                    "Completed fetching applications for university: {}",
                    universityId
                )
            );
    }

    /**
     * Get applications by admin
     */
    public Flux<ApplicationResponseDTO> getApplicationsByAdmin(UUID adminId) {
        log.debug("Fetching applications for admin: {}", adminId);

        return applicationRepository
            .findByAssignedAdminId(adminId)
            .flatMap(this::convertToResponseDTO)
            .doOnComplete(() ->
                log.debug(
                    "Completed fetching applications for admin: {}",
                    adminId
                )
            );
    }

    /**
     * Get unassigned applications
     */
    public Flux<ApplicationResponseDTO> getUnassignedApplications() {
        log.debug("Fetching unassigned applications");

        return applicationRepository
            .findUnassigned()
            .flatMap(this::convertToResponseDTO)
            .doOnComplete(() ->
                log.debug("Completed fetching unassigned applications")
            );
    }

    /**
     * Advanced search with filters
     */
    public Flux<ApplicationResponseDTO> searchApplications(
        String status,
        String priority,
        String applicationType,
        UUID assignedAdminId,
        Long studentId,
        UUID targetUniversityId,
        String workflowStage,
        Boolean requiresAttention,
        Boolean isUrgent,
        Boolean isOverdue,
        String sortBy,
        Integer page,
        Integer size
    ) {
        log.debug(
            "Searching applications with filters - status: {}, priority: {}, type: {}",
            status,
            priority,
            applicationType
        );

        Pageable pageable = PageRequest.of(
            page != null ? page : 0,
            size != null ? size : 20
        );
        String sort = sortBy != null ? sortBy : "updated";

        return applicationRepository
            .findWithFilters(
                status,
                priority,
                applicationType,
                assignedAdminId,
                studentId,
                targetUniversityId,
                workflowStage,
                requiresAttention,
                isUrgent,
                isOverdue,
                sort,
                pageable
            )
            .flatMap(this::convertToResponseDTO)
            .doOnComplete(() -> log.debug("Completed application search"));
    }

    /**
     * Text search across applications
     */
    public Flux<ApplicationResponseDTO> searchApplicationsByText(
        String searchTerm
    ) {
        log.debug("Text searching applications with term: {}", searchTerm);

        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return Flux.empty();
        }

        return applicationRepository
            .searchByText(searchTerm.trim())
            .flatMap(this::convertToResponseDTO)
            .doOnComplete(() ->
                log.debug("Completed text search for: {}", searchTerm)
            );
    }

    // ========================================
    // STATUS AND WORKFLOW OPERATIONS
    // ========================================

    /**
     * Update application status
     */
    @Transactional
    public Mono<ApplicationResponseDTO> updateApplicationStatus(
        UUID applicationId,
        String newStatus,
        String reason,
        Long updatedBy
    ) {
        log.info(
            "Updating status for application: {} to: {}",
            applicationId,
            newStatus
        );

        return applicationRepository
            .findById(applicationId)
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Application not found with ID: " + applicationId
                    )
                )
            )
            .flatMap(application -> {
                // Validate status transition
                if (
                    !isValidStatusTransition(application.getStatus(), newStatus)
                ) {
                    return Mono.error(
                        new RuntimeException(
                            "Invalid status transition from " +
                                application.getStatus() +
                                " to " +
                                newStatus
                        )
                    );
                }

                // Update status and related fields
                String previousStatus = application.getStatus();
                application.setPreviousStatus(previousStatus);
                application.setStatus(newStatus);
                application.setStatusReason(reason);
                application.setUpdatedBy(
                    updatedBy != null ? updatedBy.toString() : null
                );
                application.setUpdatedAt(LocalDateTime.now());

                // Handle status-specific logic
                handleStatusTransition(application, previousStatus, newStatus);

                return applicationRepository.save(application);
            })
            .flatMap(this::convertToResponseDTO)
            .doOnSuccess(updated ->
                log.info(
                    "Updated application status: {} -> {}",
                    applicationId,
                    newStatus
                )
            );
    }

    /**
     * Submit application (draft -> submitted)
     */
    @Transactional
    public Mono<ApplicationResponseDTO> submitApplication(
        UUID applicationId,
        UUID submittedBy
    ) {
        log.info("Submitting application: {}", applicationId);

        return applicationRepository
            .findById(applicationId)
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Application not found with ID: " + applicationId
                    )
                )
            )
            .flatMap(application -> {
                if (!"draft".equals(application.getStatus())) {
                    return Mono.error(
                        new RuntimeException(
                            "Only draft applications can be submitted"
                        )
                    );
                }

                // Validate application is complete enough for submission
                return validateApplicationForSubmission(application)
                    .then(
                        Mono.fromCallable(() -> {
                            application.setStatus("submitted");
                            application.setSubmittedAt(LocalDateTime.now());
                            application.setUpdatedBy(
                                submittedBy != null
                                    ? submittedBy.toString()
                                    : null
                            );
                            application.setUpdatedAt(LocalDateTime.now());

                            // Calculate and set SLA deadline
                            calculateAndSetSlaDeadline(application);

                            application.updateCompletionStatus();
                            return application;
                        })
                    )
                    .flatMap(applicationRepository::save);
            })
            .flatMap(this::convertToResponseDTO)
            .doOnSuccess(submitted ->
                log.info(
                    "Submitted application: {}",
                    submitted.getReferenceNumber()
                )
            );
    }

    // ========================================
    // ASSIGNMENT OPERATIONS
    // ========================================

    /**
     * Assign application to admin
     */
    @Transactional
    public Mono<ApplicationResponseDTO> assignApplicationToAdmin(
        UUID applicationId,
        Long adminId,
        Long assignedBy
    ) {
        log.info(
            "Assigning application: {} to admin: {}",
            applicationId,
            adminId
        );

        return applicationRepository
            .findById(applicationId)
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Application not found with ID: " + applicationId
                    )
                )
            )
            .flatMap(application -> {
                if (!application.canBeAssigned()) {
                    return Mono.error(
                        new RuntimeException(
                            "Application cannot be assigned in current state"
                        )
                    );
                }

                application.assignToAdmin(adminId, assignedBy);
                application.setUpdatedAt(LocalDateTime.now());

                return applicationRepository.save(application);
            })
            .flatMap(this::convertToResponseDTO)
            .doOnSuccess(assigned ->
                log.info(
                    "Assigned application: {} to admin: {}",
                    assigned.getReferenceNumber(),
                    adminId
                )
            );
    }

    /**
     * Unassign application from admin
     */
    @Transactional
    public Mono<ApplicationResponseDTO> unassignApplication(
        UUID applicationId,
        UUID unassignedBy
    ) {
        log.info("Unassigning application: {}", applicationId);

        return applicationRepository
            .findById(applicationId)
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Application not found with ID: " + applicationId
                    )
                )
            )
            .flatMap(application -> {
                if (application.getAssignedAdminId() == null) {
                    return Mono.error(
                        new RuntimeException(
                            "Application is not currently assigned"
                        )
                    );
                }

                application.setPreviousAdminId(
                    application.getAssignedAdminId()
                );
                application.setAssignedAdminId(null);
                application.setAssignedBy(null);
                application.setAssignedAt(null);
                application.setUpdatedBy(
                    unassignedBy != null ? unassignedBy.toString() : null
                );
                application.setUpdatedAt(LocalDateTime.now());

                return applicationRepository.save(application);
            })
            .flatMap(this::convertToResponseDTO)
            .doOnSuccess(unassigned ->
                log.info(
                    "Unassigned application: {}",
                    unassigned.getReferenceNumber()
                )
            );
    }

    // ========================================
    // DOCUMENT AND VERIFICATION OPERATIONS
    // ========================================

    /**
     * Update document verification status
     */
    @Transactional
    public Mono<ApplicationResponseDTO> updateDocumentVerification(
        UUID applicationId,
        String documentType,
        boolean verified,
        UUID verifiedBy
    ) {
        log.info(
            "Updating document verification for application: {}, type: {}, verified: {}",
            applicationId,
            documentType,
            verified
        );

        return applicationRepository
            .findById(applicationId)
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Application not found with ID: " + applicationId
                    )
                )
            )
            .flatMap(application -> {
                // Update specific document verification
                switch (documentType.toLowerCase()) {
                    case "academic" -> application.setAcademicDocumentsVerified(
                        verified
                    );
                    case "english_proficiency" -> application.setEnglishProficiencyVerified(
                        verified
                    );
                    case "financial", "certificates" -> application.setCertificatesVerified(
                        verified
                    );
                    case "personal" -> application.setPersonalDocumentsVerified(
                        verified
                    );
                    default -> throw new RuntimeException(
                        "Invalid document type: " + documentType
                    );
                }

                // Check if all documents are verified
                boolean allVerified =
                    Boolean.TRUE.equals(
                        application.getAcademicDocumentsVerified()
                    ) &&
                    Boolean.TRUE.equals(
                        application.getEnglishProficiencyVerified()
                    ) &&
                    Boolean.TRUE.equals(
                        application.getCertificatesVerified()
                    ) &&
                    Boolean.TRUE.equals(
                        application.getPersonalDocumentsVerified()
                    );

                if (
                    allVerified &&
                    !Boolean.TRUE.equals(application.getDocumentsVerified())
                ) {
                    application.setDocumentsVerified(true);
                    application.setDocumentsVerifiedAt(LocalDateTime.now());
                    application.setDocumentsVerifiedBy(verifiedBy);
                }

                application.setUpdatedBy(
                    verifiedBy != null ? verifiedBy.toString() : null
                );
                application.setUpdatedAt(LocalDateTime.now());
                application.updateCompletionStatus();

                return applicationRepository.save(application);
            })
            .flatMap(this::convertToResponseDTO)
            .doOnSuccess(updated ->
                log.info(
                    "Updated document verification for: {}",
                    updated.getReferenceNumber()
                )
            );
    }

    /**
     * Mark payment as completed
     */
    @Transactional
    public Mono<ApplicationResponseDTO> markPaymentCompleted(
        UUID applicationId,
        String paymentReference,
        String paymentMethod,
        UUID updatedBy
    ) {
        log.info(
            "Marking payment completed for application: {}",
            applicationId
        );

        return applicationRepository
            .findById(applicationId)
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Application not found with ID: " + applicationId
                    )
                )
            )
            .flatMap(application -> {
                application.setPaymentCompleted(true);
                application.setPaymentCompletedAt(LocalDateTime.now());
                application.setPaymentReference(paymentReference);
                application.setPaymentMethod(paymentMethod);
                application.setUpdatedBy(
                    updatedBy != null ? updatedBy.toString() : null
                );
                application.setUpdatedAt(LocalDateTime.now());
                application.updateCompletionStatus();

                return applicationRepository.save(application);
            })
            .flatMap(this::convertToResponseDTO)
            .doOnSuccess(updated ->
                log.info(
                    "Marked payment completed for: {}",
                    updated.getReferenceNumber()
                )
            );
    }

    // ========================================
    // PRIORITY AND URGENCY OPERATIONS
    // ========================================

    /**
     * Mark application as urgent
     */
    @Transactional
    public Mono<ApplicationResponseDTO> markAsUrgent(
        UUID applicationId,
        String reason,
        UUID updatedBy
    ) {
        log.info("Marking application as urgent: {}", applicationId);

        return applicationRepository
            .findById(applicationId)
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Application not found with ID: " + applicationId
                    )
                )
            )
            .flatMap(application -> {
                application.setIsUrgent(true);
                if (
                    "normal".equals(application.getPriority()) ||
                    "low".equals(application.getPriority())
                ) {
                    application.setPriority("urgent");
                }
                application.flagForAttention(reason);
                application.setUpdatedBy(
                    updatedBy != null ? updatedBy.toString() : null
                );

                return applicationRepository.save(application);
            })
            .flatMap(this::convertToResponseDTO)
            .doOnSuccess(updated ->
                log.info(
                    "Marked application as urgent: {}",
                    updated.getReferenceNumber()
                )
            );
    }

    /**
     * Flag application for attention
     */
    @Transactional
    public Mono<ApplicationResponseDTO> flagForAttention(
        UUID applicationId,
        String reason,
        UUID updatedBy
    ) {
        log.info("Flagging application for attention: {}", applicationId);

        return applicationRepository
            .findById(applicationId)
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Application not found with ID: " + applicationId
                    )
                )
            )
            .flatMap(application -> {
                application.flagForAttention(reason);
                application.setUpdatedBy(
                    updatedBy != null ? updatedBy.toString() : null
                );

                return applicationRepository.save(application);
            })
            .flatMap(this::convertToResponseDTO)
            .doOnSuccess(updated ->
                log.info(
                    "Flagged application for attention: {}",
                    updated.getReferenceNumber()
                )
            );
    }

    // ========================================
    // ANALYTICS AND DASHBOARD OPERATIONS
    // ========================================

    /**
     * Get dashboard overview statistics
     */
    public Mono<Map<String, Object>> getDashboardOverview() {
        log.debug("Fetching dashboard overview statistics");

        return applicationRepository
            .getDashboardOverview()
            .map(stats ->
                Map.of(
                    "total_applications",
                    stats[0],
                    "draft_count",
                    stats[1],
                    "active_count",
                    stats[2],
                    "completed_count",
                    stats[3],
                    "urgent_count",
                    stats[4],
                    "overdue_count",
                    stats[5],
                    "attention_count",
                    stats[6],
                    "unassigned_count",
                    stats[7]
                )
            )
            .doOnSuccess(overview ->
                log.debug(
                    "Retrieved dashboard overview with {} applications",
                    overview.get("total_applications")
                )
            );
    }

    /**
     * Get applications requiring attention
     */
    public Flux<ApplicationResponseDTO> getApplicationsRequiringAttention() {
        log.debug("Fetching applications requiring attention");

        return applicationRepository
            .findRequiringAttention()
            .flatMap(this::convertToResponseDTO)
            .doOnComplete(() ->
                log.debug("Completed fetching applications requiring attention")
            );
    }

    /**
     * Get overdue applications
     */
    public Flux<ApplicationResponseDTO> getOverdueApplications() {
        log.debug("Fetching overdue applications");

        return applicationRepository
            .findOverdue()
            .flatMap(this::convertToResponseDTO)
            .doOnComplete(() ->
                log.debug("Completed fetching overdue applications")
            );
    }

    /**
     * Get recent activity
     */
    public Flux<ApplicationResponseDTO> getRecentActivity() {
        log.debug("Fetching recent application activity");

        return applicationRepository
            .getRecentActivity()
            .flatMap(this::convertToResponseDTO)
            .doOnComplete(() ->
                log.debug("Completed fetching recent activity")
            );
    }

    // ========================================
    // UTILITY AND HELPER METHODS
    // ========================================

    /**
     * Validate no duplicate application exists for same student/course combination
     */
    private Mono<Void> validateNoDuplicateApplication(
        ApplicationRequestDTO requestDTO
    ) {
        return applicationRepository
            .findByStudentIdAndCourseId(
                requestDTO.getStudentId(),
                requestDTO.getTargetCourseId()
            )
            .filter(existingApp -> {
                // Check if same intake semester AND year
                String existingSemester = existingApp.getTargetSemester();
                Integer existingYear = existingApp.getTargetYear();

                boolean sameSemester =
                    existingSemester != null &&
                    existingSemester.equalsIgnoreCase(
                        requestDTO.getTargetSemester()
                    );
                boolean sameYear =
                    existingYear != null &&
                    existingYear.equals(requestDTO.getTargetYear());

                // Only flag as duplicate if BOTH semester and year match
                return sameSemester && sameYear;
            })
            .hasElements()
            .flatMap(exists -> {
                if (exists) {
                    return Mono.error(
                        new RuntimeException(
                            String.format(
                                "Duplicate application detected: Student %d already has an application for course %s for %s %d intake",
                                requestDTO.getStudentId(),
                                requestDTO.getTargetCourseId(),
                                requestDTO.getTargetSemester(),
                                requestDTO.getTargetYear()
                            )
                        )
                    );
                }
                return Mono.empty();
            });
    }

    /**
     * Generate unique reference number
     */
    private Mono<String> generateReferenceNumber() {
        return applicationRepository
            .getNextReferenceNumber()
            .map(nextNumber -> {
                String yearMonth = LocalDateTime.now().format(
                    DateTimeFormatter.ofPattern("yyMM")
                );
                return String.format("APP%s%06d", yearMonth, nextNumber);
            })
            .defaultIfEmpty(
                "APP" +
                    LocalDateTime.now().format(
                        DateTimeFormatter.ofPattern("yyMM")
                    ) +
                    "000001"
            );
    }

    /**
     * Validate application request
     */
    private Mono<Void> validateApplicationRequest(
        ApplicationRequestDTO requestDTO
    ) {
        if (!requestDTO.isValid()) {
            return Mono.error(
                new RuntimeException("Invalid application request data")
            );
        }

        // Validate university exists
        Mono<Void> universityValidation =
            requestDTO.getTargetUniversityId() != null
                ? universityRepository
                      .findById(requestDTO.getTargetUniversityId())
                      .switchIfEmpty(
                          Mono.error(
                              new RuntimeException(
                                  "Invalid university ID. Please select a valid university."
                              )
                          )
                      )
                      .then()
                : Mono.empty();

        // Validate course exists and belongs to the university
        Mono<Void> courseValidation =
            requestDTO.getTargetCourseId() != null
                ? courseRepository
                      .findById(requestDTO.getTargetCourseId())
                      .switchIfEmpty(
                          Mono.error(
                              new RuntimeException(
                                  "Invalid course ID. Please select a valid course."
                              )
                          )
                      )
                      .flatMap(course -> {
                          if (
                              requestDTO.getTargetUniversityId() != null &&
                              !course
                                  .getUniversityId()
                                  .equals(requestDTO.getTargetUniversityId())
                          ) {
                              return Mono.error(
                                  new RuntimeException(
                                      "The selected course does not belong to the selected university."
                                  )
                              );
                          }
                          return Mono.empty();
                      })
                : Mono.empty();

        return universityValidation.then(courseValidation);
    }

    /**
     * Validate application for submission
     */
    private Mono<Void> validateApplicationForSubmission(
        Application application
    ) {
        // Check required fields for submission
        if (
            application.getTargetUniversityId() == null ||
            application.getTargetCourseId() == null ||
            application.getTargetSemester() == null ||
            application.getTargetYear() == null
        ) {
            return Mono.error(
                new RuntimeException("Missing required fields for submission")
            );
        }

        return Mono.empty();
    }

    /**
     * Build application entity from request DTO
     */
    private Application buildApplicationFromRequest(
        ApplicationRequestDTO requestDTO,
        String referenceNumber
    ) {
        Application application = new Application();

        // Set basic fields
        application.setReferenceNumber(referenceNumber);
        application.setStudentId(requestDTO.getStudentId());
        application.setUniversityId(requestDTO.getTargetUniversityId());
        application.setCourseId(requestDTO.getTargetCourseId());
        application.setTargetSemester(requestDTO.getTargetSemester());
        application.setTargetYear(requestDTO.getTargetYear());
        application.setStatus("draft");
        application.setPriority(requestDTO.getPriority());
        application.setCreatedAt(LocalDateTime.now());
        application.setUpdatedAt(LocalDateTime.now());

        // Set boolean flags
        application.setIsUrgent(
            requestDTO.getIsUrgent() != null ? requestDTO.getIsUrgent() : false
        );
        application.setIsActive(true);
        application.setCompletionPercentage(0);
        application.setWorkflowStage("INITIAL");

        // Set deadlines
        if (requestDTO.getDeadline() != null) {
            application.setDeadline(requestDTO.getDeadline());
        }

        // Populate JSONB data with metadata and academic information for workflow selection
        Json initialData = buildInitialJsonData(requestDTO);
        application.setData(initialData);

        log.info(
            "Built application {} with metadata for workflow selection - clientId: {}, countryCode: {}, programLevel: {}",
            referenceNumber,
            requestDTO.getClientId(),
            requestDTO.getCountryCode(),
            requestDTO.getProgramLevel()
        );

        // Update completion status before returning
        application.updateCompletionStatus();

        return application;
    }

    /**
     * Build initial JSONB data structure from request DTO
     * This populates metadata and academic sections required for workflow selection
     */
    private Json buildInitialJsonData(ApplicationRequestDTO requestDTO) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            com.fasterxml.jackson.databind.node.ObjectNode root =
                mapper.createObjectNode();

            // Metadata section - required for workflow selection
            com.fasterxml.jackson.databind.node.ObjectNode metadata =
                mapper.createObjectNode();
            if (requestDTO.getClientId() != null) {
                metadata.put("client_id", requestDTO.getClientId());
            }
            if (requestDTO.getCountryCode() != null) {
                metadata.put("country_code", requestDTO.getCountryCode());
            }
            if (requestDTO.getTerritory() != null) {
                metadata.put("territory", requestDTO.getTerritory());
            }
            if (requestDTO.getRegion() != null) {
                metadata.put("region", requestDTO.getRegion());
            }
            root.set("metadata", metadata);

            // Academic section - required for workflow selection
            com.fasterxml.jackson.databind.node.ObjectNode academic =
                mapper.createObjectNode();
            if (requestDTO.getProgramLevel() != null) {
                // Normalize degree level for workflow matching
                String normalizedDegreeLevel = normalizeDegreeLevel(
                    requestDTO.getProgramLevel()
                );
                academic.put("degree_level", normalizedDegreeLevel);
                log.debug(
                    "Normalized degree level from '{}' to '{}' for workflow matching",
                    requestDTO.getProgramLevel(),
                    normalizedDegreeLevel
                );
            }
            if (requestDTO.getTargetSemester() != null) {
                academic.put("intake_term", requestDTO.getTargetSemester());
                academic.put("target_semester", requestDTO.getTargetSemester()); // For validation
            }
            if (requestDTO.getTargetYear() != null) {
                academic.put("target_year", requestDTO.getTargetYear());
            }
            if (requestDTO.getApplicationType() != null) {
                academic.put(
                    "application_type",
                    requestDTO.getApplicationType()
                );
            }
            root.set("academic", academic);

            // Initialize empty sections for future use
            root.set("documents", mapper.createObjectNode());
            root.set("payment", mapper.createObjectNode());
            root.set("workflow", mapper.createObjectNode());
            root.set("university", mapper.createObjectNode());

            String jsonString = mapper.writeValueAsString(root);
            log.debug("Built initial JSONB data structure: {}", jsonString);

            return Json.of(jsonString);
        } catch (Exception e) {
            log.error("Error building initial JSONB data structure", e);
            return Json.of("{}");
        }
    }

    /**
     * Normalize degree level to match workflow definition format
     * Handles various input formats and converts to standard format used in workflow_definitions table
     */
    private String normalizeDegreeLevel(String degreeLevel) {
        if (degreeLevel == null) {
            log.warn("Degree level is null, defaulting to BACHELOR");
            return "BACHELOR";
        }

        String normalized = switch (degreeLevel.toUpperCase()) {
            case "BACHELORS", "BACHELOR'S", "BACHELOR" -> "BACHELOR";
            case "MASTERS", "MASTER'S", "MASTER" -> "MASTERS";
            case "DOCTORATE", "DOCTORATES", "PHD", "PH.D" -> "DOCTORATE";
            case "DIPLOMA", "DIPLOMAS" -> "DIPLOMA";
            case "CERTIFICATE", "CERTIFICATES" -> "CERTIFICATE";
            default -> degreeLevel.toUpperCase();
        };

        log.debug(
            "Normalized degree level: '{}' -> '{}'",
            degreeLevel,
            normalized
        );
        return normalized;
    }

    /**
     * Build application with commission data copied from university (AD-01)
     */
    private Mono<Application> buildApplicationWithCommissionData(
        ApplicationRequestDTO requestDTO,
        String referenceNumber
    ) {
        log.debug(
            "Building application with commission data for university: {}",
            requestDTO.getTargetUniversityId()
        );

        // Build base application
        Application application = buildApplicationFromRequest(
            requestDTO,
            referenceNumber
        );

        // Get both commission rate and application fee from university
        if (requestDTO.getTargetUniversityId() != null) {
            return universityRepository
                .findById(requestDTO.getTargetUniversityId())
                .flatMap(university -> {
                    // Extract commission rate
                    BigDecimal commissionRate =
                        universityService.extractCommissionRateFromData(
                            university.getData()
                        );

                    // Extract application fee from university data
                    BigDecimal applicationFee =
                        extractApplicationFeeFromUniversity(
                            university.getData()
                        );
                    String currency = extractCurrencyFromUniversity(
                        university.getData()
                    );

                    // Extract country code from university data
                    String countryCode = extractCountryFromUniversityData(
                        university.getData()
                    );

                    log.info(
                        "Auto-fetched from university {}: fee={} {}, commission={}%, country={}",
                        university.getName(),
                        applicationFee,
                        currency,
                        commissionRate,
                        countryCode
                    );

                    // Fetch course to get degree level
                    if (requestDTO.getTargetCourseId() != null) {
                        return courseRepository
                            .findById(requestDTO.getTargetCourseId())
                            .flatMap(course -> {
                                String degreeLevel =
                                    extractDegreeLevelFromCourse(
                                        course.getData()
                                    );

                                log.info(
                                    "Auto-fetched from course {}: degreeLevel={}",
                                    course.getName(),
                                    degreeLevel
                                );

                                // Add commission data and enrich with country/degree
                                Json updatedData =
                                    addCommissionDataToApplicationWithFee(
                                        application.getData(),
                                        commissionRate,
                                        applicationFee,
                                        currency
                                    );

                                // Enrich with country and degree for workflow selection
                                updatedData = enrichApplicationDataWithMetadata(
                                    updatedData,
                                    requestDTO.getClientId(),
                                    countryCode,
                                    degreeLevel,
                                    requestDTO.getTargetSemester(),
                                    requestDTO.getTargetYear()
                                );

                                application.setData(updatedData);
                                return Mono.just(application);
                            })
                            .switchIfEmpty(
                                Mono.defer(() -> {
                                    log.warn(
                                        "Course not found, using defaults"
                                    );
                                    Json updatedData =
                                        addCommissionDataToApplicationWithFee(
                                            application.getData(),
                                            commissionRate,
                                            applicationFee,
                                            currency
                                        );
                                    updatedData =
                                        enrichApplicationDataWithMetadata(
                                            updatedData,
                                            requestDTO.getClientId(),
                                            countryCode,
                                            "BACHELOR",
                                            requestDTO.getTargetSemester(),
                                            requestDTO.getTargetYear()
                                        );
                                    application.setData(updatedData);
                                    return Mono.just(application);
                                })
                            );
                    } else {
                        // No course ID, use defaults
                        Json updatedData =
                            addCommissionDataToApplicationWithFee(
                                application.getData(),
                                commissionRate,
                                applicationFee,
                                currency
                            );
                        updatedData = enrichApplicationDataWithMetadata(
                            updatedData,
                            requestDTO.getClientId(),
                            countryCode,
                            "BACHELOR",
                            requestDTO.getTargetSemester(),
                            requestDTO.getTargetYear()
                        );
                        application.setData(updatedData);
                        return Mono.just(application);
                    }
                })
                .onErrorResume(error -> {
                    log.warn(
                        "Failed to get university data for {}: {}",
                        requestDTO.getTargetUniversityId(),
                        error.getMessage()
                    );
                    // Continue with defaults if university lookup fails
                    Json defaultData = addCommissionDataToApplicationWithFee(
                        application.getData(),
                        BigDecimal.valueOf(10.0), // Default 10%
                        BigDecimal.valueOf(50.0), // Default 50 EUR fee
                        "EUR"
                    );
                    defaultData = enrichApplicationDataWithMetadata(
                        defaultData,
                        requestDTO.getClientId(),
                        "DE",
                        "BACHELOR",
                        requestDTO.getTargetSemester(),
                        requestDTO.getTargetYear()
                    );
                    application.setData(defaultData);
                    return Mono.just(application);
                });
        } else {
            // No university ID, use defaults
            Json defaultData = addCommissionDataToApplicationWithFee(
                application.getData(),
                BigDecimal.valueOf(10.0), // Default 10%
                BigDecimal.valueOf(50.0), // Default 50 EUR fee
                "EUR"
            );
            application.setData(defaultData);
            return Mono.just(application);
        }
    }

    /**
     * Add commission data to application JSONB data with auto-fetched fee information
     */
    private Json addCommissionDataToApplicationWithFee(
        Json existingData,
        BigDecimal commissionRate,
        BigDecimal applicationFee,
        String currency
    ) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            var jsonNode = mapper.readTree(
                existingData != null ? existingData.asString() : "{}"
            );
            var objectNode =
                (com.fasterxml.jackson.databind.node.ObjectNode) jsonNode;

            // Add commission information
            objectNode.put("commission_rate", commissionRate.toString());

            // Add auto-fetched fee information
            objectNode.put("application_fee_amount", applicationFee.toString());
            objectNode.put("application_fee_currency", currency);

            // Calculate commission amount based on application fee
            BigDecimal commissionAmount = applicationFee
                .multiply(commissionRate)
                .divide(
                    BigDecimal.valueOf(100),
                    2,
                    java.math.RoundingMode.HALF_UP
                );
            objectNode.put("commission_amount", commissionAmount.toString());

            log.info(
                "Commission calculated from university data: fee={} {}, rate={}%, amount={} {}",
                applicationFee,
                currency,
                commissionRate,
                commissionAmount,
                currency
            );

            objectNode.put("commission_status", "PENDING");
            objectNode.put(
                "commission_copied_at",
                LocalDateTime.now().toString()
            );
            objectNode.put("payment_status", "PENDING");

            return Json.of(mapper.writeValueAsString(objectNode));
        } catch (Exception e) {
            log.error("Error adding commission data to application", e);
            return existingData != null ? existingData : Json.of("{}");
        }
    }

    /**
     * Extract application fee from university JSONB data
     */
    private BigDecimal extractApplicationFeeFromUniversity(Json data) {
        if (data == null || data.asString() == null) {
            return BigDecimal.valueOf(50.0); // Default 50 EUR
        }

        try {
            ObjectMapper mapper = new ObjectMapper();
            var jsonNode = mapper.readTree(data.asString());
            var feeNode = jsonNode.get("application_fee");

            if (feeNode != null && !feeNode.isNull()) {
                return new BigDecimal(feeNode.asText());
            }
        } catch (Exception e) {
            log.warn(
                "Error extracting application fee from university data",
                e
            );
        }

        return BigDecimal.valueOf(50.0); // Default 50 EUR
    }

    /**
     * Extract country code from university JSONB data
     */
    private String extractCountryFromUniversityData(Json data) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            var jsonNode = mapper.readTree(data.asString());

            // Try country_code field
            var countryCodeNode = jsonNode.get("country_code");
            var country = jsonNode.get("country");
            if (countryCodeNode != null && !countryCodeNode.isNull()) {
                return countryCodeNode.asText().toUpperCase();
            } else if (country != null && !country.isNull()) {
                return country.asText().toUpperCase();
            } else {
                return null;
            }
        } catch (Exception e) {
            log.warn("Error extracting country from university data", e);
            throw new RuntimeException(
                "Failed to extract country from university data"
            );
        }
    }

    /**
     * Extract degree level from course JSONB data
     */
    private String extractDegreeLevelFromCourse(Json data) {
        if (data == null || data.asString() == null) {
            return "BACHELOR"; // Default
        }

        try {
            ObjectMapper mapper = new ObjectMapper();
            var jsonNode = mapper.readTree(data.asString());
            var degreeLevelNode = jsonNode.get("degree_level");

            if (degreeLevelNode != null && !degreeLevelNode.isNull()) {
                String degreeLevel = degreeLevelNode.asText();
                return normalizeDegreeLevel(degreeLevel);
            }
        } catch (Exception e) {
            log.warn("Error extracting degree level from course data", e);
        }

        return "BACHELOR"; // Default
    }

    /**
     * Enrich application JSONB data with metadata and academic info for workflow selection
     */
    private Json enrichApplicationDataWithMetadata(
        Json existingData,
        String clientId,
        String countryCode,
        String degreeLevel,
        String semester,
        Integer targetYear
    ) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            var jsonNode = mapper.readTree(
                existingData != null ? existingData.asString() : "{}"
            );
            var objectNode =
                (com.fasterxml.jackson.databind.node.ObjectNode) jsonNode;

            // Update or create metadata section
            com.fasterxml.jackson.databind.node.ObjectNode metadata;
            if (objectNode.has("metadata")) {
                metadata =
                    (com.fasterxml.jackson.databind.node.ObjectNode) objectNode.get(
                        "metadata"
                    );
            } else {
                metadata = mapper.createObjectNode();
            }

            if (clientId != null) {
                metadata.put("client_id", clientId);
            }
            if (countryCode != null) {
                metadata.put("country_code", countryCode);
            }
            objectNode.set("metadata", metadata);

            // Update or create academic section
            com.fasterxml.jackson.databind.node.ObjectNode academic;
            if (objectNode.has("academic")) {
                academic =
                    (com.fasterxml.jackson.databind.node.ObjectNode) objectNode.get(
                        "academic"
                    );
            } else {
                academic = mapper.createObjectNode();
            }

            if (degreeLevel != null) {
                academic.put("degree_level", degreeLevel);
            }
            if (semester != null) {
                academic.put("intake_term", semester);
                academic.put("target_semester", semester); // For validation
            }
            if (targetYear != null) {
                academic.put("target_year", targetYear);
            }
            objectNode.set("academic", academic);

            log.info(
                "Enriched application data: client={}, country={}, degree={}, semester={}, year={}",
                clientId,
                countryCode,
                degreeLevel,
                semester,
                targetYear
            );

            return Json.of(mapper.writeValueAsString(objectNode));
        } catch (Exception e) {
            log.error("Error enriching application data with metadata", e);
            return existingData != null ? existingData : Json.of("{}");
        }
    }

    /**
     * Extract currency from university JSONB data
     */
    private String extractCurrencyFromUniversity(Json data) {
        if (data == null || data.asString() == null) {
            return "EUR"; // Default currency
        }

        try {
            ObjectMapper mapper = new ObjectMapper();
            var jsonNode = mapper.readTree(data.asString());
            var currencyNode = jsonNode.get("currency");

            if (currencyNode != null && !currencyNode.isNull()) {
                return currencyNode.asText();
            }
        } catch (Exception e) {
            log.warn("Error extracting currency from university data", e);
        }

        return "EUR"; // Default currency
    }

    /**
     * Update application entity from request DTO
     */
    private void updateApplicationFromRequest(
        Application application,
        ApplicationRequestDTO requestDTO
    ) {
        // Update basic fields
        if (requestDTO.getTargetSemester() != null) {
            application.setTargetSemester(requestDTO.getTargetSemester());
        }
        if (requestDTO.getTargetYear() != null) {
            application.setTargetYear(requestDTO.getTargetYear());
        }
        if (requestDTO.getPriority() != null) {
            application.setPriority(requestDTO.getPriority());
        }

        // Update optional fields
        if (requestDTO.getAlternateCourseId() != null) {
            application.setAlternateCourseId(requestDTO.getAlternateCourseId());
        }
        if (requestDTO.getAlternateUniversityId() != null) {
            application.setAlternateUniversityId(
                requestDTO.getAlternateUniversityId()
            );
        }

        // Update boolean flags
        if (requestDTO.getIsUrgent() != null) {
            application.setIsUrgent(requestDTO.getIsUrgent());
        }
        if (requestDTO.getIsExpedited() != null) {
            application.setIsExpedited(requestDTO.getIsExpedited());
        }
        if (requestDTO.getIsFastTracked() != null) {
            application.setIsFastTracked(requestDTO.getIsFastTracked());
        }

        // Update deadlines
        if (requestDTO.getDeadline() != null) {
            application.setDeadline(requestDTO.getDeadline());
        }
        if (requestDTO.getUniversityDeadline() != null) {
            application.setUniversityDeadline(
                requestDTO.getUniversityDeadline()
            );
        }
        if (requestDTO.getInternalDeadline() != null) {
            application.setInternalDeadline(requestDTO.getInternalDeadline());
        }

        // Update financial information
        if (requestDTO.getApplicationFeeAmount() != null) {
            application.setApplicationFeeAmount(
                requestDTO.getApplicationFeeAmount()
            );
            application.setApplicationFeeCurrency(
                requestDTO.getApplicationFeeCurrency()
            );
        }
        if (requestDTO.getServiceFeeAmount() != null) {
            application.setServiceFeeAmount(requestDTO.getServiceFeeAmount());
            application.setServiceFeeCurrency(
                requestDTO.getServiceFeeCurrency()
            );
        }

        // Update flexible data fields
        if (requestDTO.getApplicationData() != null) {
            application.setApplicationData(requestDTO.getApplicationData());
        }
        if (requestDTO.getCustomFields() != null) {
            application.setCustomFields(requestDTO.getCustomFields());
        }
        if (requestDTO.getPreferences() != null) {
            application.setPreferences(requestDTO.getPreferences());
        }
        if (requestDTO.getRequirements() != null) {
            application.setRequirements(requestDTO.getRequirements());
        }
    }

    /**
     * Convert application entity to response DTO
     */
    private Mono<ApplicationResponseDTO> convertToResponseDTO(
        Application application
    ) {
        ApplicationResponseDTO.ApplicationResponseDTOBuilder builder =
            ApplicationResponseDTO.builder()
                .id(application.getId())
                .referenceNumber(application.getReferenceNumber())
                .studentId(application.getStudentId())
                .targetUniversityId(application.getTargetUniversityId())
                .targetCourseId(application.getTargetCourseId())
                .targetSemester(application.getTargetSemester())
                .targetYear(application.getTargetYear())
                .alternateCourseId(application.getAlternateCourseId())
                .alternateUniversityId(application.getAlternateUniversityId())
                .applicationType(application.getApplicationType())
                .programLevel(application.getProgramLevel())
                .studyMode(application.getStudyMode())
                .intakeSeason(application.getIntakeSeason())
                .status(application.getStatus())
                .statusDescription(application.getStatusDescription())
                .subStatus(application.getSubStatus())
                .workflowStage(application.getWorkflowStage())
                .workflowStep(application.getWorkflowStep())
                .previousStatus(application.getPreviousStatus())
                .statusReason(application.getStatusReason())
                .priority(application.getPriority())
                .priorityLevel(application.getPriorityLevel())
                .isUrgent(application.getIsUrgent())
                .isExpedited(application.getIsExpedited())
                .isFastTracked(application.getIsFastTracked())
                .requiresAttention(application.getRequiresAttention())
                .hasIssues(application.getHasIssues())
                .assignedAdminId(application.getAssignedAdminId())
                .assignedCounselorId(application.getAssignedCounselorId())
                .assignedAt(application.getAssignedAt())
                .assignedBy(application.getAssignedBy())
                .previousAdminId(application.getPreviousAdminId())
                .submittedAt(application.getSubmittedAt())
                .deadline(application.getDeadline())
                .universityDeadline(application.getUniversityDeadline())
                .internalDeadline(application.getInternalDeadline())
                .slaDeadline(application.getSlaDeadline())
                .nextCriticalDeadline(application.getNextCriticalDeadline())
                .reviewedAt(application.getReviewedAt())
                .decisionDate(application.getDecisionDate())
                .enrollmentDeadline(application.getEnrollmentDeadline())
                .visaDeadline(application.getVisaDeadline())
                .completionPercentage(application.getCompletionPercentage())
                .stepsCompleted(application.getStepsCompleted())
                .totalSteps(application.getTotalSteps())
                .documentsUploaded(application.getDocumentsUploaded())
                .documentsRequired(application.getDocumentsRequired())
                .documentsVerified(application.getDocumentsVerified())
                .documentsVerifiedAt(application.getDocumentsVerifiedAt())
                .documentsVerifiedBy(application.getDocumentsVerifiedBy())
                .academicDocumentsVerified(
                    application.getAcademicDocumentsVerified()
                )
                .englishProficiencyVerified(
                    application.getEnglishProficiencyVerified()
                )
                .certificatesVerified(
                    application.getCertificatesVerified()
                )
                .personalDocumentsVerified(
                    application.getPersonalDocumentsVerified()
                )
                .hasCompleteDocuments(application.hasCompleteDocuments())
                .submittedToUniversity(application.getSubmittedToUniversity())
                .submittedToUniversityAt(
                    application.getSubmittedToUniversityAt()
                )
                .universityReferenceNumber(
                    application.getUniversityReferenceNumber()
                )
                .universityPortalId(application.getUniversityPortalId())
                .universityStatus(application.getUniversityStatus())
                .universityNotes(application.getUniversityNotes())
                .readyForUniversitySubmission(
                    application.isReadyForUniversitySubmission()
                )
                .paymentCompleted(application.getPaymentCompleted())
                .paymentCompletedAt(application.getPaymentCompletedAt())
                .applicationFeeAmount(
                    application.getApplicationFeeAmount() != null
                        ? application.getApplicationFeeAmount().doubleValue()
                        : null
                )
                .applicationFeeCurrency(application.getApplicationFeeCurrency())
                .serviceFeeAmount(application.getServiceFeeAmount())
                .serviceFeeCurrency(application.getServiceFeeCurrency())
                .paymentMethod(application.getPaymentMethod())
                .paymentReference(application.getPaymentReference())
                .refundRequested(application.getRefundRequested())
                .refundAmount(application.getRefundAmount())
                .refundReason(application.getRefundReason())
                .hasCompletedPayment(application.hasCompletedPayment())
                .lastContactDate(application.getLastContactDate())
                .lastContactType(application.getLastContactType())
                .lastContactNotes(application.getLastContactNotes())
                .nextFollowupDate(application.getNextFollowupDate())
                .followupReason(application.getFollowupReason())
                .studentContacted(application.getStudentContacted())
                .studentLastResponse(application.getStudentLastResponse())
                .notesCount(application.getNotesCount())
                .messagesCount(application.getMessagesCount())
                .documentsCount(application.getDocumentsCount())
                .attachmentsCount(application.getAttachmentsCount())
                .revisionsCount(application.getRevisionsCount())
                .extensionsCount(application.getExtensionsCount())
                .processingTimeHours(application.getProcessingTimeHours())
                .responseTimeHours(application.getResponseTimeHours())
                .firstResponseTimeHours(application.getFirstResponseTimeHours())
                .isOverdue(application.getIsOverdue())
                .slaBreached(application.getSlaBreached())
                .slaBreachReason(application.getSlaBreachReason())
                .escalationLevel(application.getEscalationLevel())
                .escalatedAt(application.getEscalatedAt())
                .escalatedTo(application.getEscalatedTo())
                .deadlineApproaching(application.isDeadlineApproaching())
                .pastDeadline(application.isPastDeadline())
                .qualityScore(application.getQualityScore())
                .studentSatisfactionRating(
                    application.getStudentSatisfactionRating()
                )
                .processingComplexity(application.getProcessingComplexity())
                .riskLevel(application.getRiskLevel())
                .isArchived(application.getIsArchived())
                .archivedAt(application.getArchivedAt())
                .archivedBy(application.getArchivedBy())
                .archiveReason(application.getArchiveReason())
                .isLocked(application.getIsLocked())
                .lockedBy(application.getLockedBy())
                .lockedAt(application.getLockedAt())
                .lockReason(application.getLockReason())
                .clientId(application.getClientId())
                .tenantId(application.getTenantId())
                .territory(application.getTerritory())
                .region(application.getRegion())
                .countryCode(application.getCountryCode())
                .languagePreference(application.getLanguagePreference())
                .timezone(application.getTimezone())
                .externalReferenceId(application.getExternalReferenceId())
                .sourceSystem(application.getSourceSystem())
                .migrationId(application.getMigrationId())
                .syncRequired(application.getSyncRequired())
                .lastSyncAt(application.getLastSyncAt())
                .applicationData(application.getApplicationData())
                .customFields(application.getCustomFields())
                .preferences(application.getPreferences())
                .requirements(application.getRequirements())
                .evaluationCriteria(application.getEvaluationCriteria())
                .analyticsData(application.getAnalyticsData())
                .integrationData(application.getIntegrationData())
                .createdAt(application.getCreatedAt())
                .updatedAt(application.getUpdatedAt())
                .createdBy(
                    application.getCreatedBy() != null
                        ? null // TODO: Fix user ID to UUID mapping
                        : null
                )
                .updatedBy(
                    application.getUpdatedBy() != null
                        ? null // TODO: Fix user ID to UUID mapping
                        : null
                )
                .version(application.getVersion())
                .canBeAssigned(application.canBeAssigned())
                .isInProgress(application.isInProgress())
                .isCompleted(application.isCompleted())
                .isDraft(application.isDraft())
                .isSubmitted(application.isSubmitted())
                .needsAttention(application.needsAttention());

        if (application.getAssignedAdminId() != null) {
            return userRepository.findById(application.getAssignedAdminId())
                .map(admin -> {
                    builder.assignedAdminName(admin.getFullName());
                    builder.assignedAdminEmail(admin.getEmail());
                    return builder.build();
                })
                .defaultIfEmpty(builder.build());
        }

        return Mono.just(builder.build());
    }

    /**
     * Check if status transition is valid
     */
    private boolean isValidStatusTransition(
        String currentStatus,
        String newStatus
    ) {
        if (currentStatus == null || newStatus == null) {
            return false;
        }

        return switch (currentStatus) {
            case "draft" -> "submitted".equals(newStatus) ||
            "withdrawn".equals(newStatus);
            case "submitted" -> "under_review".equals(newStatus) ||
            "documents_requested".equals(newStatus) ||
            "withdrawn".equals(newStatus);
            case "under_review" -> "documents_requested".equals(newStatus) ||
            "evaluated".equals(newStatus) ||
            "rejected".equals(newStatus);
            case "documents_requested" -> "under_review".equals(newStatus) ||
            "withdrawn".equals(newStatus);
            case "evaluated" -> "accepted".equals(newStatus) ||
            "rejected".equals(newStatus);
            case "accepted" -> "enrolled".equals(newStatus) ||
            "withdrawn".equals(newStatus);
            case "rejected" -> false; // Final state
            case "enrolled" -> false; // Final state
            case "withdrawn" -> false; // Final state
            case "expired" -> false; // Final state
            default -> false;
        };
    }

    /**
     * Handle status-specific logic during transition
     */
    private void handleStatusTransition(
        Application application,
        String previousStatus,
        String newStatus
    ) {
        switch (newStatus) {
            case "submitted" -> {
                application.setSubmittedAt(LocalDateTime.now());
                calculateAndSetSlaDeadline(application);
            }
            case "under_review" -> {
                if (application.getReviewedAt() == null) {
                    application.setReviewedAt(LocalDateTime.now());
                }
            }
            case "accepted", "rejected" -> {
                application.setDecisionDate(LocalDateTime.now());
                application.setCompletionPercentage(100);
            }
            case "enrolled" -> {
                application.setCompletionPercentage(100);
            }
            case "withdrawn", "expired" -> {
                application.setCompletionPercentage(0);
            }
        }

        // Update workflow stage based on status
        application.setWorkflowStage(getWorkflowStageForStatus(newStatus));
    }

    /**
     * Get workflow stage for status
     */
    private String getWorkflowStageForStatus(String status) {
        return switch (status) {
            case "draft" -> "draft";
            case "submitted" -> "submission";
            case "under_review" -> "review";
            case "documents_requested" -> "documents";
            case "evaluated" -> "evaluation";
            case "accepted", "rejected" -> "decision";
            case "enrolled" -> "enrollment";
            case "withdrawn", "expired" -> "closed";
            default -> "unknown";
        };
    }

    /**
     * Calculate and set SLA deadline
     */
    private void calculateAndSetSlaDeadline(Application application) {
        LocalDateTime now = LocalDateTime.now();
        int slaHours = getSlaHoursForApplication(application);
        application.setSlaDeadline(now.plusHours(slaHours));
    }

    /**
     * Get SLA hours based on application priority and type
     */
    private int getSlaHoursForApplication(Application application) {
        if (
            Boolean.TRUE.equals(application.getIsUrgent()) ||
            "critical".equals(application.getPriority())
        ) {
            return 12; // 12 hours for critical/urgent
        } else if ("urgent".equals(application.getPriority())) {
            return 24; // 24 hours for urgent
        } else if ("high".equals(application.getPriority())) {
            return 48; // 48 hours for high priority
        } else {
            return 72; // 72 hours for normal/low priority
        }
    }

    // ========================================
    // STUDENT-SPECIFIC APPLICATION METHODS FOR CONSOLIDATED API
    // ========================================

    /**
     * Create application with client context - for Student API consolidation
     */
    @Transactional
    public Mono<ApplicationResponseDTO> createApplication(
        ApplicationRequestDTO requestDTO,
        Long userId,
        String clientId
    ) {
        log.info(
            "Creating application for student: {} by user: {} in client: {}",
            requestDTO.getStudentId(),
            userId,
            clientId
        );

        // Set client context for client-based workflow selection
        if (clientId != null) {
            requestDTO.setClientId(clientId);
            log.debug("Set client ID {} on application request", clientId);
        }

        return createApplication(requestDTO);
    }

    /**
     * Update application with flexible data - for Student API
     */
    @Transactional
    public Mono<ApplicationResponseDTO> updateApplicationData(
        UUID applicationId,
        Map<String, Object> updateData,
        Long userId,
        String clientId
    ) {
        log.info(
            "Updating application {} with flexible data by user: {} in client: {}",
            applicationId,
            userId,
            clientId
        );

        return applicationRepository
            .findById(applicationId)
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Application not found with ID: " + applicationId
                    )
                )
            )
            .flatMap(application -> {
                // Update application fields based on the provided data
                updateData.forEach((key, value) -> {
                    switch (key) {
                        case "personalStatement":
                        case "targetSemester":
                            if (value instanceof String) {
                                application.setTargetSemester((String) value);
                            }
                            break;
                        case "targetYear":
                            if (value instanceof Number) {
                                application.setTargetYear(
                                    ((Number) value).intValue()
                                );
                            }
                            break;
                        case "priority":
                            if (value instanceof String) {
                                application.setPriority((String) value);
                            }
                            break;
                        case "isUrgent":
                            if (value instanceof Boolean) {
                                application.setIsUrgent((Boolean) value);
                            }
                            break;
                        // Add other fields as needed
                        default:
                            // Store unknown fields in JSONB data
                            log.debug(
                                "Storing custom field {} in application data",
                                key
                            );
                            break;
                    }
                });

                application.setUpdatedAt(LocalDateTime.now());
                return applicationRepository.save(application);
            })
            .flatMap(this::convertToResponseDTO)
            .doOnSuccess(result ->
                log.info("Successfully updated application: {}", applicationId)
            )
            .onErrorMap(throwable -> {
                log.error(
                    "Error updating application {}: {}",
                    applicationId,
                    throwable.getMessage()
                );
                return new RuntimeException(
                    "Failed to update application: " + throwable.getMessage()
                );
            });
    }

    /**
     * Get student applications with filtering - for Student API consolidation
     */
    public Flux<ApplicationResponseDTO> getStudentApplications(
        long userId,
        String status,
        String countryCode,
        int page,
        int size,
        String clientId
    ) {
        log.info(
            "Getting applications for student: {} with filters - status: {}, country: {}",
            userId,
            status,
            countryCode
        );

        // Convert userId to studentId (assuming 1:1 mapping for now)
        long studentId = userId;

        return applicationRepository
            .findByStudentId(studentId)
            .filter(app -> status == null || status.equals(app.getStatus()))
            .flatMap(application -> {
                // If no country filter, return application immediately
                if (countryCode == null) {
                    return Mono.just(application);
                }

                // Otherwise, fetch university and check country
                return universityRepository
                    .findById(application.getUniversityId())
                    .flatMap(university -> {
                        // Extract country from university JSONB data
                        String universityCountry = extractCountryFromUniversity(
                            university
                        );

                        log.info(
                            "Application {} (ref: {}) university: {}, country: '{}', filter: '{}'",
                            application.getId(),
                            application.getReferenceNumber(),
                            university.getName(),
                            universityCountry,
                            countryCode
                        );

                        // Filter by country code (case-insensitive comparison)
                        if (
                            universityCountry != null &&
                            countryCode.equalsIgnoreCase(universityCountry)
                        ) {
                            log.info(
                                "Application {} INCLUDED (country match)",
                                application.getReferenceNumber()
                            );
                            return Mono.just(application);
                        } else {
                            log.info(
                                "Application {} FILTERED OUT (country mismatch: '{}' != '{}')",
                                application.getReferenceNumber(),
                                universityCountry,
                                countryCode
                            );
                            return Mono.empty(); // Filtered out
                        }
                    })
                    .switchIfEmpty(
                        Mono.defer(() -> {
                            log.warn(
                                "University not found for application {}, filtering out",
                                application.getId()
                            );
                            return Mono.empty(); // Filter out if university not found
                        })
                    );
            })
            .skip(page * size)
            .take(size)
            .flatMap(this::convertToResponseDTO);
    }

    /**
     * Extract country code from university JSONB data
     */
    private String extractCountryFromUniversity(
        com.uniflow.university.entity.University university
    ) {
        try {
            if (university.getData() != null) {
                com.fasterxml.jackson.databind.ObjectMapper mapper =
                    new com.fasterxml.jackson.databind.ObjectMapper();
                java.util.Map<String, Object> data = mapper.readValue(
                    university.getData().asString(),
                    java.util.Map.class
                );

                // First try to extract country_code (e.g., "DE", "US", "UK")
                Object countryCode = data.get("country_code");
                if (countryCode != null) {
                    return countryCode.toString();
                }

                // Fallback: try country name for backwards compatibility
                Object country = data.get("country");
                if (country != null) {
                    return country.toString();
                }

                // Check if it's nested under location or address
                if (data.get("location") instanceof java.util.Map) {
                    java.util.Map<String, Object> location = (java.util.Map<
                        String,
                        Object
                    >) data.get("location");
                    Object locCountryCode = location.get("country_code");
                    if (locCountryCode != null) {
                        return locCountryCode.toString();
                    }
                    Object locCountry = location.get("country");
                    if (locCountry != null) {
                        return locCountry.toString();
                    }
                }
            }
        } catch (Exception e) {
            log.error(
                "Failed to extract country from university {} ({}): {}",
                university.getId(),
                university.getName(),
                e.getMessage()
            );
        }
        log.warn(
            "No country_code or country found in university {} ({})",
            university.getId(),
            university.getName()
        );
        return null;
    }

    /**
     * Get application by ID with user context - for Student API consolidation
     */
    public Mono<ApplicationResponseDTO> getApplicationById(
        UUID applicationId,
        Long userId,
        String clientId
    ) {
        log.debug(
            "Getting application {} for user: {} in client: {}",
            applicationId,
            userId,
            clientId
        );

        return applicationRepository
            .findById(applicationId)
            .filter(app -> userId.equals(app.getStudentId())) // Student can only see their own
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Application not found or access denied"
                    )
                )
            )
            .flatMap(this::convertToResponseDTO);
    }

    /**
     * Update application with user context - for Student API consolidation
     */
    @Transactional
    public Mono<ApplicationResponseDTO> updateApplication(
        UUID applicationId,
        ApplicationRequestDTO requestDTO,
        Long userId,
        String clientId
    ) {
        log.info(
            "Updating application {} by user: {} in client: {}",
            applicationId,
            userId,
            clientId
        );

        return applicationRepository
            .findById(applicationId)
            .filter(app -> userId.equals(app.getStudentId())) // Student can only update their own
            .filter(app -> "draft".equals(app.getStatus())) // Only draft applications can be updated
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Application not found, access denied, or not editable"
                    )
                )
            )
            .flatMap(application -> {
                updateApplicationFromRequest(application, requestDTO);
                application.setUpdatedBy(
                    userId != null ? userId.toString() : null
                );
                application.setUpdatedAt(LocalDateTime.now());
                application.updateCompletionStatus();
                return applicationRepository.save(application);
            })
            .flatMap(this::convertToResponseDTO);
    }

    /**
     * Submit application with additional data - for Student API consolidation
     */
    @Transactional
    public Mono<
        com.uniflow.student.dto.application.ApplicationSubmissionResponseDTO
    > submitApplication(
        UUID applicationId,
        Long userId,
        Map<String, Object> submissionData,
        String clientId
    ) {
        log.info(
            "Submitting application {} by user: {} in client: {}",
            applicationId,
            userId,
            clientId
        );

        return applicationRepository
            .findById(applicationId)
            .filter(app -> userId.equals(app.getStudentId())) // Student can only submit their own
            .filter(app -> {
                log.info("Application status: {}", app.getStatus());
                return (
                    "draft".equals(app.getStatus()) ||
                    "WORKFLOW_FAILED".equals(app.getStatus())
                );
            }) // Draft and failed workflow applications can be submitted
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Application not found, access denied, or not submittable"
                    )
                )
            )
            .flatMap(application -> {
                // Validate application is complete enough for submission
                return validateApplicationForSubmission(application)
                    .then(
                        Mono.fromCallable(() -> {
                            application.setStatus("SUBMITTED");
                            application.setSubmittedAt(LocalDateTime.now());
                            application.setUpdatedBy(
                                userId != null ? userId.toString() : null
                            );
                            application.setUpdatedAt(LocalDateTime.now());

                            // Calculate and set SLA deadline
                            calculateAndSetSlaDeadline(application);

                            // Store additional submission data
                            if (
                                submissionData != null &&
                                !submissionData.isEmpty()
                            ) {
                                application.setCustomFields(submissionData);
                            }

                            application.updateCompletionStatus();
                            return application;
                        })
                    )
                    .flatMap(applicationRepository::save)
                    .flatMap(savedApplication ->
                        // Trigger workflow initialization after saving
                        workflowTrigger
                            .handleApplicationSubmission(savedApplication)
                            .then(
                                // Send application submission notification
                                workflowNotificationService
                                    .notifyTaskCompletion(
                                        savedApplication.getStudentId(),
                                        "Application Submitted Successfully",
                                        "SUBMISSION",
                                        savedApplication.getId().toString(),
                                        userId
                                    )
                                    .onErrorResume(error -> {
                                        log.warn(
                                            "Failed to send application submission notification: {}",
                                            error.getMessage()
                                        );
                                        return Mono.empty(); // Don't fail the main flow
                                    })
                            )
                            .thenReturn(savedApplication)
                            .onErrorResume(workflowError -> {
                                log.error(
                                    "Failed to initialize workflow for application {}: {}. Reverting to draft status.",
                                    savedApplication.getReferenceNumber(),
                                    workflowError.getMessage()
                                );
                                // Revert application back to draft status so it can be resubmitted
                                savedApplication.setStatus("draft");
                                savedApplication.setWorkflowStage("DRAFT");
                                savedApplication.setSubmittedAt(null);
                                savedApplication.setUpdatedAt(
                                    LocalDateTime.now()
                                );

                                return applicationRepository
                                    .save(savedApplication)
                                    .then(
                                        Mono.error(
                                            new RuntimeException(
                                                "Application submission failed: Unable to initialize workflow. " +
                                                    workflowError.getMessage() +
                                                    ". Application has been reverted to draft status for resubmission.",
                                                workflowError
                                            )
                                        )
                                    );
                            })
                    );
            })
            .map(application ->
                com.uniflow.student.dto.application.ApplicationSubmissionResponseDTO.builder()
                    .applicationId(application.getId())
                    .referenceNumber(application.getReferenceNumber())
                    .status(
                        com.uniflow.student.dto.application.ApplicationSubmissionResponseDTO.ApplicationSubmissionStatus.SUBMISSION_SUCCESSFUL
                    )
                    .submittedAt(application.getSubmittedAt())
                    .workflowInitiated(
                        "IN_WORKFLOW".equals(application.getStatus())
                    )
                    .estimatedProcessingTime(
                        getSlaHoursForApplication(application) + " hours"
                    )
                    .nextSteps(
                        java.util.List.of(
                            "Document verification will begin",
                            "You will be notified of any additional requirements",
                            "Processing typically takes " +
                                getSlaHoursForApplication(application) +
                                " hours"
                        )
                    )
                    .importantReminders(
                        java.util.List.of(
                            "Keep your reference number safe: " +
                                application.getReferenceNumber(),
                            "Check your email regularly for updates",
                            "Upload any additional documents as requested"
                        )
                    )
                    .build()
            );
    }

    /**
     * Get application progress - for Student API consolidation
     */
    public Mono<
        com.uniflow.student.dto.application.ApplicationProgressResponseDTO
    > getApplicationProgress(UUID applicationId, Long userId, String clientId) {
        log.debug(
            "Getting progress for application {} by user: {} in client: {}",
            applicationId,
            userId,
            clientId
        );

        // Get application
        Mono<Application> applicationMono = applicationRepository
            .findById(applicationId)
            .filter(app -> userId.equals(app.getStudentId())) // Student can only see their own
            .switchIfEmpty(
                Mono.error(
                    new RuntimeException(
                        "Application not found or access denied"
                    )
                )
            );

        // Get workflow instance
        Mono<
            com.uniflow.workflow.entity.WorkflowInstance
        > workflowInstanceMono = applicationMono.flatMap(app ->
            workflowInstanceRepository
                .findByApplicationId(app.getId().toString())
                .next()
                .switchIfEmpty(
                    Mono.error(
                        new RuntimeException(
                            "No workflow instance found for application: " +
                                applicationId
                        )
                    )
                )
        );

        // Get workflow definition using specific version from instance
        Mono<com.uniflow.workflow.entity.WorkflowDefinition> workflowDefMono =
            workflowInstanceMono.flatMap(instance ->
                workflowDefinitionRepository
                    .findByDefinitionKeyAndIsActive(
                        instance.getWorkflowDefinitionKey(),
                        true
                    )
                    .switchIfEmpty(
                        Mono.error(
                            new RuntimeException(
                                "No workflow definition found for application: " +
                                    applicationId +
                                    " with key: " +
                                    instance.getWorkflowDefinitionKey() +
                                    " version: " +
                                    instance.getWorkflowDefinitionVersion()
                            )
                        )
                    )
            );

        // Get all tasks
        Mono<List<com.uniflow.workflow.entity.Task>> tasksMono = applicationMono
            .flatMapMany(app ->
                taskRepository.findByApplicationIdOrderByCreatedAtAsc(
                    app.getId().toString()
                )
            )
            .collectList();

        // Calculate progress metrics
        Mono<
            com.uniflow.workflow.service.WorkflowDataAggregationService.ProgressMetrics
        > progressMono = Mono.zip(workflowDefMono, tasksMono).flatMap(tuple ->
            workflowDataAggregationService.calculateProgressMetrics(
                tuple.getT1(),
                tuple.getT2()
            )
        );

        // Get all stages from workflow definition
        Mono<
            List<
                com.uniflow.workflow.service.WorkflowDataAggregationService.StageInfo
            >
        > stagesMono = workflowDefMono.map(def ->
            workflowDataAggregationService.getAllStages(def.getWorkflowConfig())
        );

        // Query document_workflow table directly to derive real document progress
        Mono<java.util.Map<String, String>> docProgressMono = applicationMono.flatMap(app ->
            documentWorkflowRepository
                .findByApplicationIdAndIsCurrentVersionTrue(app.getId())
                .collectList()
                .map(workflows -> {
                    java.util.Map<String, String> categoryStatus = new java.util.HashMap<>();
                    // Group by document_category and determine status
                    for (com.uniflow.document.entity.DocumentWorkflow wf : workflows) {
                        String cat = wf.getDocumentCategory();
                        if (cat == null) {
                            cat = determineDocumentCategoryFallback(wf.getDocumentType());
                        }
                        if (cat == null) continue;
                        String existing = categoryStatus.get(cat);
                        String wfStatus = wf.getVerificationStatus();
                        // Priority: VERIFIED > PENDING > REJECTED > not present
                        if (existing == null) {
                            categoryStatus.put(cat, wfStatus != null ? wfStatus : "PENDING");
                        } else if ("VERIFIED".equals(existing)) {
                            // Already fully verified — keep unless another doc in same category is not
                            if (!"VERIFIED".equals(wfStatus)) {
                                categoryStatus.put(cat, "PENDING");
                            }
                        } else {
                            // Keep current (PENDING/REJECTED) — don't downgrade
                        }
                    }
                    return categoryStatus;
                })
        );

        // Zip all data and build response
        return Mono.zip(
            applicationMono,
            workflowInstanceMono,
            progressMono,
            tasksMono,
            stagesMono,
            docProgressMono
        ).map(tuple -> {
            Application application = tuple.getT1();
            com.uniflow.workflow.entity.WorkflowInstance workflowInstance =
                tuple.getT2();
            com.uniflow.workflow.service.WorkflowDataAggregationService.ProgressMetrics progress =
                tuple.getT3();
            List<com.uniflow.workflow.entity.Task> tasks = tuple.getT4();
            List<
                com.uniflow.workflow.service.WorkflowDataAggregationService.StageInfo
            > stages = tuple.getT5();
            java.util.Map<String, String> docCategoryStatus = tuple.getT6();
            // Convert application status to enum (from application table)
            com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationStatus statusEnum;
            try {
                statusEnum =
                    com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationStatus.valueOf(
                        application.getStatus().toUpperCase()
                    );
            } catch (Exception e) {
                statusEnum =
                    com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationStatus.DRAFT;
            }

            // Convert workflow stage to enum (from progress metrics - actual workflow stage)
            // Map workflow definition stages to DTO enum values
            com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationWorkflowStage stageEnum =
                mapWorkflowStageToEnum(progress.getCurrentStage());

            // Build stage progress from workflow stages and tasks
            List<
                com.uniflow.student.dto.application.ApplicationProgressResponseDTO.StageProgressDTO
            > stageProgressList = buildStageProgressList(stages, tasks);

            return com.uniflow.student.dto.application.ApplicationProgressResponseDTO.builder()
                .applicationId(application.getId())
                .referenceNumber(application.getReferenceNumber())
                .currentStage(stageEnum)
                .currentStageName(progress.getCurrentStageName()) // From workflow definition
                .status(statusEnum)
                .completionPercentage(progress.getCompletionPercentage()) // From actual task completion
                .stepsCompleted(progress.getCompletedTasks()) // From actual completed tasks
                .totalSteps(progress.getTotalTasks()) // From workflow definition
                .submittedAt(application.getSubmittedAt())
                .lastUpdated(workflowInstance.getUpdatedAt()) // From workflow instance
                .nextDeadline(application.getNextCriticalDeadline())
                .requiresStudentAction(application.needsAttention())
                .stageProgress(stageProgressList) // NEW: Stage progress from workflow
                .assignedAdmin(
                    application.getAssignedAdminId() != null
                        ? com.uniflow.student.dto.application.ApplicationProgressResponseDTO.AssignedAdminProgressDTO.builder()
                              .id(application.getAssignedAdminId())
                              .assignedAt(application.getAssignedAt())
                              .build()
                        : null
                )
                .documentProgress(
                    buildDocumentProgressFromWorkflows(docCategoryStatus, application)
                )
                .paymentProgress(
                    com.uniflow.student.dto.application.ApplicationProgressResponseDTO.PaymentProgressDTO.builder()
                        .paymentCompleted(
                            Boolean.TRUE.equals(
                                application.getPaymentCompleted()
                            )
                        )
                        .status(
                            Boolean.TRUE.equals(
                                application.getPaymentCompleted()
                            )
                                ? com.uniflow.student.dto.application.ApplicationProgressResponseDTO.PaymentStatus.COMPLETED
                                : com.uniflow.student.dto.application.ApplicationProgressResponseDTO.PaymentStatus.PENDING
                        )
                        .applicationFeeAmount(
                            application.getApplicationFeeAmount() != null
                                ? application
                                      .getApplicationFeeAmount()
                                      .toString()
                                : null
                        )
                        .applicationFeeCurrency(
                            application.getApplicationFeeCurrency()
                        )
                        .serviceFeeAmount(
                            application.getServiceFeeAmount() != null
                                ? application.getServiceFeeAmount().toString()
                                : null
                        )
                        .serviceFeeCurrency(application.getServiceFeeCurrency())
                        .paymentCompletedAt(application.getPaymentCompletedAt())
                        .paymentMethod(application.getPaymentMethod())
                        .paymentReference(application.getPaymentReference())
                        .build()
                )
                .universitySubmission(
                    com.uniflow.student.dto.application.ApplicationProgressResponseDTO.UniversitySubmissionDTO.builder()
                        .submitted(
                            Boolean.TRUE.equals(
                                application.getSubmittedToUniversity()
                            )
                        )
                        .universityReferenceNumber(
                            application.getUniversityReferenceNumber()
                        )
                        .universityPortalId(application.getUniversityPortalId())
                        .submittedToUniversityAt(
                            application.getSubmittedToUniversityAt()
                        )
                        .universityDeadline(application.getUniversityDeadline())
                        .build()
                )
                .build();
        });
    }

    /**
     * Build DocumentProgressDTO from real document_workflow records.
     *
     * <p>Category mapping (from DocumentWorkflowService.determineDocumentCategory):
     * <ul>
     *   <li>ACADEMIC           → academicDocuments  (TRANSCRIPT, DIPLOMA, MARKSHEET, LEAVING_CERTIFICATE ...)</li>
     *   <li>LANGUAGE           → englishProficiency (ENGLISH_TEST, IELTS, TOEFL, PTE ...)</li>
     *   <li>FINANCIAL          → financialDocuments (FINANCIAL_PROOF, BANK_STATEMENT ...)</li>
     *   <li>IDENTITY, PERSONAL_STATEMENT, RECOMMENDATION, PROFESSIONAL → personalDocuments</li>
     * </ul>
     *
     * <p>Status resolution per category (worst-case across all docs in category):
     * <ul>
     *   <li>All VERIFIED          → VERIFIED</li>
     *   <li>Any PENDING/REJECTED  → UNDER_REVIEW</li>
     *   <li>No docs uploaded      → NOT_SUBMITTED</li>
     * </ul>
     *
     * <p>Raw DB verification_status values: PENDING, VERIFIED, REJECTED
     */
    private com.uniflow.student.dto.application.ApplicationProgressResponseDTO.DocumentProgressDTO
        buildDocumentProgressFromWorkflows(
            java.util.Map<String, String> categoryStatus,
            Application application
        ) {

        // Map a raw DB category status → a normalised display token
        // "VERIFIED" stays VERIFIED; anything else that is present = UNDER_REVIEW
        java.util.function.Function<String, String> normalize = raw -> {
            if (raw == null)          return "NOT_SUBMITTED";
            if ("VERIFIED".equals(raw)) return "VERIFIED";
            return "UNDER_REVIEW"; // PENDING / REJECTED / anything else
        };

        // Helper: worst-case fold over multiple categories
        // Priority order: UNDER_REVIEW > VERIFIED > NOT_SUBMITTED
        // Must be BinaryOperator<String> for Stream.reduce(identity, accumulator)
        java.util.function.BinaryOperator<String> worstCase = (a, b) -> {
            if ("UNDER_REVIEW".equals(a) || "UNDER_REVIEW".equals(b)) return "UNDER_REVIEW";
            if ("VERIFIED".equals(a)     || "VERIFIED".equals(b))     return "VERIFIED";
            return "NOT_SUBMITTED";
        };

        // --- Academic Documents ---
        String academicNorm = normalize.apply(categoryStatus.get("ACADEMIC"));
        com.uniflow.student.dto.application.ApplicationProgressResponseDTO.AcademicDocumentStatus academicStatus =
            switch (academicNorm) {
                case "VERIFIED"     -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.AcademicDocumentStatus.VERIFIED;
                case "UNDER_REVIEW" -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.AcademicDocumentStatus.UNDER_REVIEW;
                default             -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.AcademicDocumentStatus.NOT_SUBMITTED;
            };

        // --- English Proficiency (LANGUAGE category) ---
        String langNorm = normalize.apply(categoryStatus.get("LANGUAGE"));
        com.uniflow.student.dto.application.ApplicationProgressResponseDTO.EnglishProficiencyStatus englishStatus =
            switch (langNorm) {
                case "VERIFIED"     -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.EnglishProficiencyStatus.VERIFIED;
                case "UNDER_REVIEW" -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.EnglishProficiencyStatus.UNDER_REVIEW;
                default             -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.EnglishProficiencyStatus.NOT_SUBMITTED;
            };

        // --- Certificates: fold CERTIFICATE + CERTIFICATION + FINANCIAL + EXPERIENCE ---
        java.util.List<String> certCats = java.util.List.of(
            "CERTIFICATE", "CERTIFICATION", "FINANCIAL", "EXPERIENCE"
        );
        String certNorm = certCats.stream()
            .map(cat -> normalize.apply(categoryStatus.get(cat)))
            .reduce("NOT_SUBMITTED", worstCase);
        com.uniflow.student.dto.application.ApplicationProgressResponseDTO.CertificateDocumentStatus certificateStatus =
            switch (certNorm) {
                case "VERIFIED"     -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.CertificateDocumentStatus.VERIFIED;
                case "UNDER_REVIEW" -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.CertificateDocumentStatus.UNDER_REVIEW;
                default             -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.CertificateDocumentStatus.NOT_SUBMITTED;
            };

        // --- Personal Documents: fold IDENTITY + PERSONAL_STATEMENT + RECOMMENDATION + PROFESSIONAL ---
        java.util.List<String> personalCats = java.util.List.of(
            "IDENTITY", "PERSONAL_STATEMENT", "RECOMMENDATION", "PROFESSIONAL"
        );
        String personalNorm = personalCats.stream()
            .map(cat -> normalize.apply(categoryStatus.get(cat)))
            .reduce("NOT_SUBMITTED", worstCase);

        com.uniflow.student.dto.application.ApplicationProgressResponseDTO.PersonalDocumentStatus personalStatus =
            switch (personalNorm) {
                case "VERIFIED"     -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.PersonalDocumentStatus.VERIFIED;
                case "UNDER_REVIEW" -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.PersonalDocumentStatus.UNDER_REVIEW;
                default             -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.PersonalDocumentStatus.NOT_SUBMITTED;
            };

        // allDocumentsVerified = all four groups are VERIFIED
        boolean allVerified =
            com.uniflow.student.dto.application.ApplicationProgressResponseDTO.AcademicDocumentStatus.VERIFIED.equals(academicStatus) &&
            com.uniflow.student.dto.application.ApplicationProgressResponseDTO.EnglishProficiencyStatus.VERIFIED.equals(englishStatus) &&
            com.uniflow.student.dto.application.ApplicationProgressResponseDTO.CertificateDocumentStatus.VERIFIED.equals(certificateStatus) &&
            com.uniflow.student.dto.application.ApplicationProgressResponseDTO.PersonalDocumentStatus.VERIFIED.equals(personalStatus);

        return com.uniflow.student.dto.application.ApplicationProgressResponseDTO.DocumentProgressDTO.builder()
            .allDocumentsVerified(allVerified)
            .academicDocuments(academicStatus)
            .englishProficiency(englishStatus)
            .certificates(certificateStatus)
            .personalDocuments(personalStatus)
            .lastVerificationDate(application.getDocumentsVerifiedAt())
            .build();
    }

    /**
     * Build stage progress list from workflow stages and tasks
     */
    private List<
        com.uniflow.student.dto.application.ApplicationProgressResponseDTO.StageProgressDTO
    > buildStageProgressList(
        List<
            com.uniflow.workflow.service.WorkflowDataAggregationService.StageInfo
        > stages,
        List<com.uniflow.workflow.entity.Task> tasks
    ) {
        if (stages == null || stages.isEmpty()) {
            return Collections.emptyList();
        }

        // Group tasks by stage
        Map<String, List<com.uniflow.workflow.entity.Task>> tasksByStage = tasks
            .stream()
            .filter(t -> t.getStage() != null)
            .collect(
                Collectors.groupingBy(
                    com.uniflow.workflow.entity.Task::getStage
                )
            );

        return stages
            .stream()
            .map(stage -> {
                List<com.uniflow.workflow.entity.Task> stageTasks =
                    tasksByStage.getOrDefault(
                        stage.getStageName(),
                        Collections.emptyList()
                    );

                // Calculate stage status
                com.uniflow.student.dto.application.ApplicationProgressResponseDTO.StageStatus stageStatus;
                int completedTasksInStage = 0;
                int totalTasksInStage = stage.getTasks().size();

                if (stageTasks.isEmpty()) {
                    stageStatus =
                        com.uniflow.student.dto.application.ApplicationProgressResponseDTO.StageStatus.NOT_STARTED;
                } else {
                    completedTasksInStage = (int) stageTasks
                        .stream()
                        .filter(
                            t ->
                                "COMPLETED".equals(t.getTaskStatus()) ||
                                (Boolean.FALSE.equals(t.getActive()) &&
                                    t.getCompletedAt() != null) ||
                                // APPLICATION_CLAIM tasks are considered completed when claimed
                                ("CLAIMED".equals(t.getTaskStatus()) &&
                                    "APPLICATION_CLAIM".equals(t.getTaskType()))
                        )
                        .count();

                    if (completedTasksInStage == 0) {
                        stageStatus =
                            com.uniflow.student.dto.application.ApplicationProgressResponseDTO.StageStatus.IN_PROGRESS;
                    } else if (completedTasksInStage == totalTasksInStage) {
                        stageStatus =
                            com.uniflow.student.dto.application.ApplicationProgressResponseDTO.StageStatus.COMPLETED;
                    } else {
                        stageStatus =
                            com.uniflow.student.dto.application.ApplicationProgressResponseDTO.StageStatus.IN_PROGRESS;
                    }
                }

                // Get started and completed dates
                LocalDateTime stageStartedAt = stageTasks
                    .stream()
                    .map(t ->
                        LocalDateTime.ofInstant(
                            java.time.Instant.ofEpochMilli(t.getCreatedAt()),
                            java.time.ZoneOffset.UTC
                        )
                    )
                    .min(LocalDateTime::compareTo)
                    .orElse(null);

                LocalDateTime stageCompletedAt =
                    completedTasksInStage == totalTasksInStage
                        ? stageTasks
                              .stream()
                              .filter(t -> t.getCompletedAt() != null)
                              .map(t ->
                                  LocalDateTime.ofInstant(
                                      java.time.Instant.ofEpochMilli(
                                          t.getCompletedAt()
                                      ),
                                      java.time.ZoneOffset.UTC
                                  )
                              )
                              .max(LocalDateTime::compareTo)
                              .orElse(null)
                        : null;

                return com.uniflow.student.dto.application.ApplicationProgressResponseDTO.StageProgressDTO.builder()
                    .stageName(stage.getDisplayName())
                    .status(stageStatus)
                    .completedTasks(completedTasksInStage)
                    .totalTasks(totalTasksInStage)
                    .startedAt(stageStartedAt)
                    .completedAt(stageCompletedAt)
                    .stageInstructions(stage.getDescription())
                    .build();
            })
            .collect(Collectors.toList());
    }

    /**
     * Map workflow definition stage names to ApplicationWorkflowStage enum
     * Workflow stages from YAML: APPLICATION_REVIEW, ACADEMIC_EVALUATION, CERTIFICATION_PROCESS, UNIVERSITY_SUBMISSION
     * DTO enum: DRAFT, SUBMISSION, DOCUMENT_VERIFICATION, etc.
     */
    private com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationWorkflowStage mapWorkflowStageToEnum(
        String workflowStage
    ) {
        if (workflowStage == null || workflowStage.isEmpty()) {
            return com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationWorkflowStage.DRAFT;
        }

        // Map workflow definition stages to DTO enum
        return switch (workflowStage.toUpperCase()) {
            case "APPLICATION_REVIEW" -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationWorkflowStage.SUBMISSION;
            case "ACADEMIC_EVALUATION" -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationWorkflowStage.DOCUMENT_VERIFICATION;
            case "CERTIFICATION_PROCESS" -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationWorkflowStage.APS_CERTIFICATE;
            // UK Workflow Specific Stages
            case "CONDITIONAL_OFFER" -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationWorkflowStage.CONDITIONAL_OFFER;
            case "CAS_INTERVIEW" -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationWorkflowStage.CAS_INTERVIEW;
            case "FEES_PAYMENT" -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationWorkflowStage.FEES_PAYMENT;
            case "UNCONDITIONAL_OFFER" -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationWorkflowStage.UNCONDITIONAL_OFFER;
            case "VISA_APPLICATION" -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationWorkflowStage.VISA_APPLICATION;
            // Shared Final Stages
            case "UNIVERSITY_SUBMISSION" -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationWorkflowStage.UNIVERSITY_SUBMISSION;
            case "UNIVERSITY_REVIEW" -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationWorkflowStage.UNIVERSITY_REVIEW;
            case "DECISION" -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationWorkflowStage.DECISION;
            case "ENROLLMENT" -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationWorkflowStage.ENROLLMENT;
            case "COMPLETED" -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationWorkflowStage.COMPLETED;
            case
                "NOT_STARTED",
                "INITIAL",
                "DRAFT" -> com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationWorkflowStage.DRAFT;
            default -> {
                log.warn(
                    "Unknown workflow stage '{}', defaulting to DRAFT",
                    workflowStage
                );
                yield com.uniflow.student.dto.application.ApplicationProgressResponseDTO.ApplicationWorkflowStage.DRAFT;
            }
        };
    }

    /**
     * Fallback for older document_workflow records that might have a NULL document_category
     * in the database. Mirrors DocumentWorkflowService.determineDocumentCategory.
     */
    private String determineDocumentCategoryFallback(String documentType) {
        if (documentType == null) {
            return "GENERAL";
        }

        return switch (documentType.toUpperCase()) {
            case "PASSPORT", "VISA", "ID_CARD", "COLOUR_PHOTOS" -> "IDENTITY";
            case "TRANSCRIPT", "TRANSCRIPTS", "DIPLOMA", "DEGREE_CERTIFICATE",
                 "ACADEMIC_RECORDS", "MARKSHEET", "LEAVING_CERTIFICATE",
                 "TWELFTH_MARKSHEET", "TENTH_MARKSHEET", "BACHELOR_MARKSHEET",
                 "BACHELOR_TRANSCRIPT", "BACHELOR_SYLLABUS", "JEE_EXAM",
                 "ENGLISH_MEDIUM_CERTIFICATE" -> "ACADEMIC";
            case "ENGLISH_TEST", "IELTS", "TOEFL", "GRE", "PTE", "LANGUAGE_TEST" -> "LANGUAGE";
            case "SOP", "STATEMENT_OF_PURPOSE", "PERSONAL_STATEMENT", "MOTIVATION_LETTER" -> "PERSONAL_STATEMENT";
            case "LOR", "LETTER_OF_RECOMMENDATION", "REFERENCE_LETTER" -> "RECOMMENDATION";
            case "CV", "RESUME", "CURRICULUM_VITAE" -> "PROFESSIONAL";
            case "EXTRA_CURRICULAR", "GERMAN_LANGUAGE_CERTIFICATE", "WORK_EXPERIENCE",
                 "EXPERIENCE_LETTER", "EMPLOYMENT_CERTIFICATE", "APS_CERTIFICATE",
                 "WES_EVALUATION", "CREDENTIAL_EVALUATION", "FINANCIAL_PROOF",
                 "BANK_STATEMENT", "SCHOLARSHIP_LETTER", "SPONSOR_LETTER" -> "CERTIFICATE";
            default -> "OTHER";
        };
    }
}
