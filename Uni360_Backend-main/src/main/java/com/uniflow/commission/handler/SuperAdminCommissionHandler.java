package com.uniflow.commission.handler;

import com.uniflow.auth.util.JwtUtils;
import com.uniflow.commission.dto.SetCommissionRateRequest;
import com.uniflow.commission.service.SuperAdminCommissionService;
import com.uniflow.common.dto.ApiResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * SuperAdminCommissionHandler — SuperAdmin-only commission endpoints.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SuperAdminCommissionHandler {

    private final SuperAdminCommissionService commissionService;
    private final JwtUtils jwtUtils;

    /**
     * GET /api/v1/superadmin/commissions
     * Returns all earned commissions from completed applications.
     */
    public Mono<ServerResponse> getAllCommissions(ServerRequest request) {
        log.info("SuperAdmin: fetching all commissions");
        return commissionService.getAllCommissions()
            .collectList()
            .flatMap(list -> ServerResponse.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.success(list, "Commissions fetched successfully")))
            .onErrorResume(e -> {
                log.error("Error fetching commissions", e);
                return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error("Failed: " + e.getMessage()));
            });
    }

    /**
     * GET /api/v1/superadmin/commissions/stats
     * Returns totals + per-university breakdown.
     */
    public Mono<ServerResponse> getCommissionStats(ServerRequest request) {
        log.info("SuperAdmin: fetching commission stats");
        return commissionService.getCommissionStats()
            .flatMap(stats -> ServerResponse.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.success(stats, "Commission stats fetched successfully")))
            .onErrorResume(e -> {
                log.error("Error fetching commission stats", e);
                return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error("Failed: " + e.getMessage()));
            });
    }

    /**
     * GET /api/v1/superadmin/commissions/universities
     * Returns all university commission rates configured.
     */
    public Mono<ServerResponse> getUniversityRates(ServerRequest request) {
        log.info("SuperAdmin: fetching university commission rates");
        return commissionService.getAllUniversityRates()
            .collectList()
            .flatMap(list -> ServerResponse.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.success(list, "University commission rates fetched")))
            .onErrorResume(e -> {
                log.error("Error fetching university rates", e);
                return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error("Failed: " + e.getMessage()));
            });
    }

    /**
     * PUT /api/v1/superadmin/commissions/universities/{universityId}
     * Set or update a university's commission rate.
     */
    public Mono<ServerResponse> setUniversityRate(ServerRequest request) {
        UUID universityId = UUID.fromString(request.pathVariable("universityId"));
        log.info("SuperAdmin: setting commission rate for university {}", universityId);

        return jwtUtils.getUserFromServerRequest(request)
            .flatMap(user ->
                request.bodyToMono(SetCommissionRateRequest.class)
                    .doOnNext(req -> req.setUniversityId(universityId))
                    .flatMap(req -> commissionService.setCommissionRate(req, user.getUsername()))
            )
            .flatMap(saved -> ServerResponse.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(ApiResponse.success(saved, "Commission rate updated successfully")))
            .onErrorResume(e -> {
                log.error("Error setting commission rate", e);
                return ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(ApiResponse.error("Failed: " + e.getMessage()));
            });
    }
}
