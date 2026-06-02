package com.uniflow.query.handler;

import com.uniflow.auth.util.JwtUtils;
import com.uniflow.query.service.AdminQueryService;
import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * AdminQueryHandler
 *
 * Admin routes:
 *   POST /admin/queries          → submit a new query to super-admin
 *   GET  /admin/queries          → list admin's own queries + replies
 *
 * SuperAdmin routes:
 *   GET  /superadmin/queries              → list all queries from all admins
 *   PUT  /superadmin/queries/{id}/reply   → reply to a query
 *   PUT  /superadmin/queries/{id}/close   → close a query
 */

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminQueryHandler {

    private final AdminQueryService adminQueryService;
    private final JwtUtils jwtUtils;

    // ── Inner DTOs ───────────────────────────────────────────────────────────

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SubmitQueryRequest {
        private String subject;
        private String message;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ReplyRequest {
        private String reply;
    }

    // ── Admin handlers ────────────────────────────────────────────────────────

    /** POST /admin/queries */
    public Mono<ServerResponse> submitQuery(ServerRequest request) {
        return jwtUtils.getUserIdFromServerRequest(request)
            .flatMap(adminId ->
                request.bodyToMono(SubmitQueryRequest.class)
                    .flatMap(req -> adminQueryService.submitQuery(
                        adminId, req.getSubject(), req.getMessage()))
            )
            .flatMap(query ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of(
                        "success", true,
                        "message", "Query submitted successfully",
                        "data", query
                    ))
            )
            .onErrorResume(error -> {
                log.error("Error submitting query: {}", error.getMessage());
                return ServerResponse.badRequest().bodyValue(Map.of(
                    "success", false,
                    "message", "Failed: " + error.getMessage()
                ));
            });
    }

    /** GET /admin/queries */
    public Mono<ServerResponse> getMyQueries(ServerRequest request) {
        return jwtUtils.getUserIdFromServerRequest(request)
            .flatMapMany(adminQueryService::getAdminQueries)
            .collectList()
            .flatMap(list ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of(
                        "success", true,
                        "data", list,
                        "count", list.size()
                    ))
            )
            .onErrorResume(error ->
                ServerResponse.badRequest().bodyValue(Map.of(
                    "success", false,
                    "message", error.getMessage()
                ))
            );
    }

    // ── SuperAdmin handlers ───────────────────────────────────────────────────

    /** GET /superadmin/queries */
    public Mono<ServerResponse> getAllQueries(ServerRequest request) {
        return adminQueryService.getAllQueries()
            .collectList()
            .flatMap(list ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of(
                        "success", true,
                        "data", list,
                        "count", list.size()
                    ))
            )
            .onErrorResume(error ->
                ServerResponse.badRequest().bodyValue(Map.of(
                    "success", false,
                    "message", error.getMessage()
                ))
            );
    }

    /** PUT /superadmin/queries/{id}/reply */
    public Mono<ServerResponse> replyToQuery(ServerRequest request) {
        UUID queryId = UUID.fromString(request.pathVariable("id"));
        return jwtUtils.getUserIdFromServerRequest(request)
            .flatMap(superAdminId ->
                request.bodyToMono(ReplyRequest.class)
                    .flatMap(req -> adminQueryService.replyToQuery(
                        queryId, req.getReply(), superAdminId))
            )
            .flatMap(updated ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of(
                        "success", true,
                        "message", "Reply sent successfully",
                        "data", updated
                    ))
            )
            .onErrorResume(error -> {
                log.error("Error replying to query {}: {}", queryId, error.getMessage());
                return ServerResponse.badRequest().bodyValue(Map.of(
                    "success", false,
                    "message", "Failed: " + error.getMessage()
                ));
            });
    }

    /** PUT /superadmin/queries/{id}/close */
    public Mono<ServerResponse> closeQuery(ServerRequest request) {
        UUID queryId = UUID.fromString(request.pathVariable("id"));
        return jwtUtils.getUserIdFromServerRequest(request)
            .flatMap(superAdminId -> adminQueryService.closeQuery(queryId, superAdminId))
            .flatMap(updated ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of(
                        "success", true,
                        "message", "Query closed",
                        "data", updated
                    ))
            )
            .onErrorResume(error ->
                ServerResponse.badRequest().bodyValue(Map.of(
                    "success", false,
                    "message", "Failed: " + error.getMessage()
                ))
            );
    }
}
