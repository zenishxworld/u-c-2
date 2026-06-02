package com.uniflow.workflow.handler;

import com.uniflow.auth.util.CommonHelperUtils;
import com.uniflow.common.dto.ApiResponse;
import com.uniflow.workflow.dto.ProfileFlagResponseDTO;
import com.uniflow.workflow.dto.ProfileFlagUpdateRequestDTO;
import com.uniflow.workflow.service.TaskCompletionValidationService;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * Handler for managing student profile flags required for workflow validation
 *
 * This handler provides APIs for:
 * - Setting individual flags
 * - Setting multiple flags in batch
 * - Getting current flag status
 * - Getting required flags for specific tasks
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StudentProfileFlagHandler {

    private final TaskCompletionValidationService validationService;
    private final CommonHelperUtils commonHelperUtils;

    /**
     * PUT /api/v1/admin/applications/{applicationId}/flags
     * Set or update multiple student profile flags
     */
    public Mono<ServerResponse> updateProfileFlags(ServerRequest request) {
        return commonHelperUtils
            .getUserFromServerRequest(request)
            .flatMap(userContext -> {
                String applicationId = request.pathVariable("applicationId");

                log.info(
                    "Admin {} updating profile flags for application: {}",
                    userContext.getUserId(),
                    applicationId
                );

                return request
                    .bodyToMono(ProfileFlagUpdateRequestDTO.class)
                    .flatMap(flagRequest -> {
                        // Validate request
                        if (
                            flagRequest.getFlags() == null ||
                            flagRequest.getFlags().isEmpty()
                        ) {
                            return ServerResponse.badRequest()
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(
                                    ApiResponse.builder()
                                        .success(false)
                                        .message(
                                            "At least one flag must be provided"
                                        )
                                        .build()
                                );
                        }

                        return validationService
                            .updateStudentProfileFlags(
                                applicationId,
                                flagRequest.getFlags()
                            )
                            .then(
                                Mono.fromSupplier(() -> {
                                    ProfileFlagResponseDTO response =
                                        new ProfileFlagResponseDTO();
                                    response.setApplicationId(applicationId);
                                    response.setUpdatedFlags(
                                        flagRequest.getFlags()
                                    );
                                    response.setMessage(
                                        String.format(
                                            "Successfully updated %d flags for application %s",
                                            flagRequest.getFlags().size(),
                                            applicationId
                                        )
                                    );
                                    return response;
                                })
                            )
                            .flatMap(response ->
                                ServerResponse.ok()
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .bodyValue(
                                        ApiResponse.builder()
                                            .success(true)
                                            .message(
                                                "Profile flags updated successfully"
                                            )
                                            .data(response)
                                            .build()
                                    )
                            );
                    });
            })
            .onErrorResume(error -> {
                log.error("Error updating profile flags", error);

                Map<String, String> fieldErrors = new HashMap<>();
                fieldErrors.put("details", error.getMessage());

                ApiResponse.ErrorDetails errorDetails =
                    new ApiResponse.ErrorDetails();
                errorDetails.setCode("FLAG_UPDATE_ERROR");
                errorDetails.setStatus(500);
                errorDetails.setFieldErrors(fieldErrors);

                ApiResponse<Object> errorResponse = ApiResponse.<
                        Object
                    >builder()
                    .success(false)
                    .message("Failed to update profile flags")
                    .error(errorDetails)
                    .build();

                return ServerResponse.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            });
    }

    /**
     * PUT /api/v1/admin/applications/{applicationId}/flags/{flagName}
     * Set or update a single student profile flag
     */
    public Mono<ServerResponse> updateSingleProfileFlag(ServerRequest request) {
        return commonHelperUtils
            .getUserFromServerRequest(request)
            .flatMap(userContext -> {
                String applicationId = request.pathVariable("applicationId");
                String flagName = request.pathVariable("flagName");

                log.info(
                    "Admin {} updating flag '{}' for application: {}",
                    userContext.getUserId(),
                    flagName,
                    applicationId
                );

                return request
                    .bodyToMono(Map.class)
                    .cast(Map.class)
                    .flatMap(requestBody -> {
                        Object valueObj = requestBody.get("value");
                        if (valueObj == null) {
                            return ServerResponse.badRequest()
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(
                                    ApiResponse.builder()
                                        .success(false)
                                        .message("Flag value must be provided")
                                        .build()
                                );
                        }

                        boolean flagValue;
                        if (valueObj instanceof Boolean) {
                            flagValue = (Boolean) valueObj;
                        } else if (valueObj instanceof String) {
                            flagValue = Boolean.parseBoolean((String) valueObj);
                        } else {
                            return ServerResponse.badRequest()
                                .contentType(MediaType.APPLICATION_JSON)
                                .bodyValue(
                                    ApiResponse.builder()
                                        .success(false)
                                        .message("Flag value must be a boolean")
                                        .build()
                                );
                        }

                        return validationService
                            .updateStudentProfileFlag(
                                applicationId,
                                flagName,
                                flagValue
                            )
                            .then(
                                Mono.fromSupplier(() -> {
                                    ProfileFlagResponseDTO response =
                                        new ProfileFlagResponseDTO();
                                    response.setApplicationId(applicationId);
                                    response.setUpdatedFlags(
                                        Map.of(flagName, flagValue)
                                    );
                                    response.setMessage(
                                        String.format(
                                            "Successfully updated flag '%s' to '%s' for application %s",
                                            flagName,
                                            flagValue,
                                            applicationId
                                        )
                                    );
                                    return response;
                                })
                            )
                            .flatMap(response ->
                                ServerResponse.ok()
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .bodyValue(
                                        ApiResponse.builder()
                                            .success(true)
                                            .message(
                                                "Profile flag updated successfully"
                                            )
                                            .data(response)
                                            .build()
                                    )
                            );
                    });
            })
            .onErrorResume(error -> {
                log.error("Error updating single profile flag", error);

                Map<String, String> fieldErrors = new HashMap<>();
                fieldErrors.put("details", error.getMessage());

                ApiResponse.ErrorDetails errorDetails =
                    new ApiResponse.ErrorDetails();
                errorDetails.setCode("FLAG_UPDATE_ERROR");
                errorDetails.setStatus(500);
                errorDetails.setFieldErrors(fieldErrors);

                ApiResponse<Object> errorResponse = ApiResponse.<
                        Object
                    >builder()
                    .success(false)
                    .message("Failed to update profile flag")
                    .error(errorDetails)
                    .build();

                return ServerResponse.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            });
    }

    /**
     * GET /api/v1/admin/applications/{applicationId}/flags
     * Get current status of all profile flags for an application
     */
    public Mono<ServerResponse> getProfileFlags(ServerRequest request) {
        return commonHelperUtils
            .getUserFromServerRequest(request)
            .flatMap(userContext -> {
                String applicationId = request.pathVariable("applicationId");

                log.info(
                    "Admin {} retrieving profile flags for application: {}",
                    userContext.getUserId(),
                    applicationId
                );

                return validationService
                    .getProfileFlags(applicationId)
                    .flatMap(flags -> {
                        ProfileFlagResponseDTO response =
                            new ProfileFlagResponseDTO();
                        response.setApplicationId(applicationId);
                        response.setUpdatedFlags(flags);
                        response.setMessage(
                            String.format(
                                "Retrieved %d profile flags for application %s",
                                flags.size(),
                                applicationId
                            )
                        );
                        response.setFlagsUpdated(flags.size());

                        return ServerResponse.ok()
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(
                                ApiResponse.builder()
                                    .success(true)
                                    .message(
                                        "Profile flags retrieved successfully"
                                    )
                                    .data(response)
                                    .build()
                            );
                    });
            })
            .onErrorResume(error -> {
                String appId = request.pathVariable("applicationId");
                log.error("Error retrieving profile flags", error);

                Map<String, String> fieldErrors = new HashMap<>();
                fieldErrors.put("details", error.getMessage());
                fieldErrors.put("applicationId", appId);

                ApiResponse.ErrorDetails errorDetails =
                    new ApiResponse.ErrorDetails();
                errorDetails.setCode("FLAG_RETRIEVAL_ERROR");
                errorDetails.setStatus(500);
                errorDetails.setFieldErrors(fieldErrors);

                ApiResponse<Object> errorResponse = ApiResponse.<
                        Object
                    >builder()
                    .success(false)
                    .message("Failed to retrieve profile flags")
                    .error(errorDetails)
                    .build();

                return ServerResponse.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            });
    }

    /**
     * POST /api/v1/admin/applications/{applicationId}/flags/batch-set
     * Convenient endpoint for common flag setting scenarios
     */
    public Mono<ServerResponse> batchSetCommonFlags(ServerRequest request) {
        return commonHelperUtils
            .getUserFromServerRequest(request)
            .flatMap(userContext -> {
                String applicationId = request.pathVariable("applicationId");

                log.info(
                    "Admin {} batch setting common flags for application: {}",
                    userContext.getUserId(),
                    applicationId
                );

                return request
                    .bodyToMono(Map.class)
                    .cast(Map.class)
                    .flatMap(requestBody -> {
                        String scenario = (String) requestBody.get("scenario");

                        Map<String, Boolean> flagsToSet = new HashMap<>();

                        switch (scenario) {
                            // ── Generic shared scenarios ──
                            case "documents_uploaded":
                                flagsToSet.put("profile_completed", true);
                                flagsToSet.put("documents_uploaded", true);
                                break;
                            case "academic_verified":
                                flagsToSet.put("academic_documents_uploaded", true);
                                flagsToSet.put("transcript_verified", true);
                                flagsToSet.put("diploma_verified", true);
                                flagsToSet.put("gpa_calculated", true);
                                flagsToSet.put("degree_verified", true);
                                break;
                            case "language_verified":
                                flagsToSet.put("language_test_uploaded", true);
                                flagsToSet.put("language_score_verified", true);
                                break;
                            case "payment_completed":
                                flagsToSet.put("payment_initiated", true);
                                flagsToSet.put("payment_amount_confirmed", true);
                                break;
                            case "final_submission":
                                flagsToSet.put("all_documents_verified", true);
                                flagsToSet.put("payment_completed", true);
                                flagsToSet.put("universities_selected", true);
                                break;
                            // ── UK Workflow: CAS Interview stage ──
                            case "cas_interview":
                                flagsToSet.put("cas_interview_scheduled", true);
                                flagsToSet.put("cas_interview_completed", true);
                                flagsToSet.put("cas_interview_passed", true);
                                break;
                            // ── UK Workflow: Conditional Offer stage ──
                            case "conditional_offer":
                                flagsToSet.put("conditional_offer_received", true);
                                flagsToSet.put("offer_conditions_reviewed", true);
                                break;
                            // ── UK Workflow: Fees Payment stage ──
                            case "fees_payment":
                                flagsToSet.put("fees_payment_initiated", true);
                                flagsToSet.put("fees_payment_completed", true);
                                flagsToSet.put("payment_receipt_uploaded", true);
                                break;
                            // ── UK Workflow: Unconditional Offer stage ──
                            case "unconditional_offer":
                                flagsToSet.put("unconditional_offer_received", true);
                                flagsToSet.put("unconditional_offer_verified", true);
                                break;
                            // ── UK & DE Workflow: Visa Stage Task 1 - VISA_APPLICATION_SCHEDULED ──
                            case "visa_appointment":
                                flagsToSet.put("visa_appointment_scheduled", true);
                                break;
                            // ── UK & DE Workflow: Visa Stage Task 2 - VISA_APPLICATION_COMPLETED ──
                            case "visa_application":
                                flagsToSet.put("visa_documents_prepared", true);
                                flagsToSet.put("visa_application_submitted", true);
                                flagsToSet.put("visa_fees_paid", true);
                                break;
                            // ── UK & DE Workflow: Visa Stage Task 3 - VISA_APPLICATION_RESULT ──
                            case "visa_result":
                                flagsToSet.put("visa_result_received", true);
                                flagsToSet.put("visa_result_verified", true);
                                break;
                            // ── DE Workflow: APS Certificate (Certification Process) stage ──
                            case "aps_certificate":
                                flagsToSet.put("aps_certificate_uploaded", true);
                                flagsToSet.put("aps_appointment_booked", true);
                                break;
                            default:
                                return ServerResponse.badRequest()
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .bodyValue(
                                        ApiResponse.builder()
                                            .success(false)
                                            .message(
                                                "Invalid scenario. Valid scenarios: " +
                                                "documents_uploaded, academic_verified, language_verified, payment_completed, final_submission, " +
                                                "cas_interview, conditional_offer, fees_payment, unconditional_offer, " +
                                                "visa_appointment, visa_application, visa_result, aps_certificate"
                                            )
                                            .build()
                                    );
                        }

                        return validationService
                            .updateStudentProfileFlags(
                                applicationId,
                                flagsToSet
                            )
                            .then(
                                Mono.fromSupplier(() -> {
                                    ProfileFlagResponseDTO response =
                                        new ProfileFlagResponseDTO();
                                    response.setApplicationId(applicationId);
                                    response.setUpdatedFlags(flagsToSet);
                                    response.setMessage(
                                        String.format(
                                            "Successfully applied '%s' scenario flags for application %s",
                                            scenario,
                                            applicationId
                                        )
                                    );
                                    return response;
                                })
                            )
                            .flatMap(response ->
                                ServerResponse.ok()
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .bodyValue(
                                        ApiResponse.builder()
                                            .success(true)
                                            .message(
                                                "Batch flags set successfully"
                                            )
                                            .data(response)
                                            .build()
                                    )
                            );
                    });
            })
            .onErrorResume(error -> {
                log.error("Error batch setting flags", error);

                ApiResponse<Object> errorResponse = ApiResponse.<
                        Object
                    >builder()
                    .success(false)
                    .message("Failed to batch set flags")
                    .build();

                return ServerResponse.status(500)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(errorResponse);
            });
    }
}
