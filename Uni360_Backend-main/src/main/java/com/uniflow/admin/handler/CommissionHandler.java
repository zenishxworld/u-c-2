package com.uniflow.admin.handler;

import com.uniflow.admin.dto.commission.CommissionExportResponseDTO;
import com.uniflow.admin.dto.commission.CommissionListResponseDTO;
import com.uniflow.admin.dto.commission.CommissionStatsDTO;
import com.uniflow.admin.service.CommissionService;
import com.uniflow.auth.dto.UserJwtDto;
import com.uniflow.auth.util.JwtUtils;
import com.uniflow.common.dto.ApiResponse;
import com.uniflow.university.service.UniversityService;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * CommissionHandler - Functional Request Handler for Commission Management
 *
 * <p>This handler implements commission management endpoints for admin users,
 * providing reactive endpoints for commission statistics, listings, and export
 * functionality with JWT-based authentication and authorization.
 *
 * <p>Key Features:
 * - Commission statistics and analytics
 * - Paginated commission listings with filtering
 * - Commission data export functionality
 * - JWT-based user authentication and authorization
 * - Admin-level data access control
 * - Standardized ApiResponse wrapper
 * - Comprehensive error handling
 *
 * @author UniFLow Development Team
 * @version 1.0
 * @since 2024-01-01
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CommissionHandler {

    private final CommissionService commissionService;
    private final JwtUtils jwtUtils;
    private final UniversityService universityService;

    /**
     * Get commission statistics for admin dashboard
     * GET /api/v1/admin/commissions/stats
     */
    public Mono<ServerResponse> getCommissionStats(ServerRequest request) {
        log.info("Processing commission stats request");

        return jwtUtils
            .getUserFromServerRequest(request)
            .flatMap(user -> {
                log.info(
                    "Getting commission stats for user: {} ({})",
                    user.getUsername(),
                    user.getUserType()
                );

                // Validate admin access
                if (!isAdminUser(user)) {
                    return ServerResponse.status(HttpStatus.FORBIDDEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.error("Access denied"));
                }

                // Parse optional date parameters
                LocalDate fromDate = parseOptionalDate(request, "date_from");
                LocalDate toDate = parseOptionalDate(request, "date_to");

                return commissionService.getCommissionStats(
                    user,
                    fromDate,
                    toDate
                );
            })
            .flatMap(stats -> {
                log.info("Successfully retrieved commission stats");
                ApiResponse<CommissionStatsDTO> response = ApiResponse.<
                        CommissionStatsDTO
                    >success(
                    (CommissionStatsDTO) stats,
                    "Commission statistics retrieved successfully"
                );
                return ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(response);
            })
            .onErrorResume(this::handleError);
    }

    /**
     * Get paginated commission list with filtering
     * GET /api/v1/admin/commissions
     */
    public Mono<ServerResponse> getCommissionList(ServerRequest request) {
        log.info("Processing commission list request");

        return jwtUtils
            .getUserFromServerRequest(request)
            .flatMap(user -> {
                log.info(
                    "Getting commission list for user: {} ({})",
                    user.getUsername(),
                    user.getUserType()
                );

                // Validate admin access
                if (!isAdminUser(user)) {
                    return ServerResponse.status(HttpStatus.FORBIDDEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.error("Access denied"));
                }

                // Parse query parameters
                int page = parseIntParam(request, "page", 0);
                int size = parseIntParam(request, "size", 20);
                String sortBy = request
                    .queryParam("sort_by")
                    .orElse("submittedAt");
                String sortDirection = request
                    .queryParam("sort_direction")
                    .orElse("DESC");
                String status = request.queryParam("status").orElse(null);
                String universityId = request
                    .queryParam("university_id")
                    .orElse(null);
                LocalDate fromDate = parseOptionalDate(request, "date_from");
                LocalDate toDate = parseOptionalDate(request, "date_to");

                return commissionService.getCommissionList(
                    user,
                    page,
                    size,
                    sortBy,
                    sortDirection,
                    status,
                    universityId,
                    fromDate,
                    toDate
                );
            })
            .flatMap(commissionList -> {
                log.info(
                    "Successfully retrieved commission list with {} items",
                    ((CommissionListResponseDTO) commissionList).getCommissions().size()
                );
                ApiResponse<CommissionListResponseDTO> response = ApiResponse.<
                        CommissionListResponseDTO
                    >success(
                    (CommissionListResponseDTO) commissionList,
                    "Commission list retrieved successfully"
                );
                return ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(response);
            })
            .onErrorResume(this::handleError);
    }

    /**
     * Export commission data
     * GET /api/v1/admin/commissions/export
     */
    public Mono<ServerResponse> exportCommissions(ServerRequest request) {
        log.info("Processing commission export request");

        return jwtUtils
            .getUserFromServerRequest(request)
            .flatMap(user -> {
                log.info(
                    "Exporting commissions for user: {} ({})",
                    user.getUsername(),
                    user.getUserType()
                );

                // Validate admin access
                if (!isAdminUser(user)) {
                    return ServerResponse.status(HttpStatus.FORBIDDEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.error("Access denied"));
                }

                // Parse export parameters
                String format = request.queryParam("format").orElse("CSV");
                String status = request.queryParam("status").orElse(null);
                String universityId = request
                    .queryParam("university_id")
                    .orElse(null);
                LocalDate fromDate = parseOptionalDate(request, "date_from");
                LocalDate toDate = parseOptionalDate(request, "date_to");

                return commissionService.exportCommissions(
                    user,
                    format,
                    status,
                    universityId,
                    fromDate,
                    toDate
                );
            })
            .flatMap(exportResponse -> {
                log.info("Successfully generated commission export");
                ApiResponse<CommissionExportResponseDTO> response =
                    ApiResponse.<CommissionExportResponseDTO>success(
                        (CommissionExportResponseDTO) exportResponse,
                        "Commission export generated successfully"
                    );
                return ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(response);
            })
            .onErrorResume(this::handleError);
    }

    /**
     * Get university commission rates for admin management
     * GET /api/v1/admin/commissions/universities
     */
    public Mono<ServerResponse> getUniversityCommissions(
        ServerRequest request
    ) {
        log.info("Processing university commissions request");

        return jwtUtils
            .getUserFromServerRequest(request)
            .flatMap(user -> {
                log.info(
                    "Getting university commissions for user: {} ({})",
                    user.getUsername(),
                    user.getUserType()
                );

                // Validate admin access
                if (!isAdminUser(user)) {
                    return ServerResponse.status(HttpStatus.FORBIDDEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(ApiResponse.error("Access denied"));
                }

                // Fetch universities with commission data using UniversityService
                return universityService
                    .getUniversitiesWithCommissions()
                    .collectList();
            })
            .flatMap(universities -> {
                log.info("Successfully retrieved university commission data");
                ApiResponse<Object> response = ApiResponse.<Object>success(
                    universities,
                    "University commissions retrieved successfully"
                );
                return ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(response);
            })
            .onErrorResume(this::handleError);
    }

    // ========================================
    // PRIVATE HELPER METHODS
    // ========================================

    private boolean isAdminUser(UserJwtDto user) {
        return (
            "ADMIN".equals(user.getUserType()) ||
            "SUPER_ADMIN".equals(user.getUserType())
        );
    }

    private LocalDate parseOptionalDate(
        ServerRequest request,
        String paramName
    ) {
        return request
            .queryParam(paramName)
            .map(dateStr -> {
                try {
                    return LocalDate.parse(dateStr);
                } catch (DateTimeParseException e) {
                    log.warn(
                        "Invalid date format for parameter {}: {}",
                        paramName,
                        dateStr
                    );
                    return null;
                }
            })
            .orElse(null);
    }

    private int parseIntParam(
        ServerRequest request,
        String paramName,
        int defaultValue
    ) {
        return request
            .queryParam(paramName)
            .map(value -> {
                try {
                    return Integer.parseInt(value);
                } catch (NumberFormatException e) {
                    log.warn(
                        "Invalid integer format for parameter {}: {}",
                        paramName,
                        value
                    );
                    return defaultValue;
                }
            })
            .orElse(defaultValue);
    }

    private Mono<ServerResponse> handleError(Throwable throwable) {
        log.error("Error processing commission request", throwable);

        String errorMessage =
            "An error occurred while processing the commission request";
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;

        if (throwable instanceof SecurityException) {
            errorMessage = throwable.getMessage();
            status = HttpStatus.FORBIDDEN;
        } else if (throwable instanceof IllegalArgumentException) {
            errorMessage = throwable.getMessage();
            status = HttpStatus.BAD_REQUEST;
        }

        ApiResponse<Object> errorResponse = ApiResponse.<Object>error(
            errorMessage
        );
        return ServerResponse.status(status)
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(errorResponse);
    }
}
