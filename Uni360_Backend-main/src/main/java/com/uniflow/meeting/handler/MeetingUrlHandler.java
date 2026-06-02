package com.uniflow.meeting.handler;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.uniflow.auth.util.JwtUtils;
import com.uniflow.meeting.service.MeetingUrlService;
import java.util.Map;
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
 * MeetingUrlHandler
 *
 * Admin routes:
 *   POST /admin/meeting-urls            → add/replace active URL for a section
 *   GET  /admin/meeting-urls            → list all URLs (all sections)
 *
 * Student routes:
 *   GET  /students/meeting-url?section=VISA   → get active URL for section
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MeetingUrlHandler {

    private final MeetingUrlService meetingUrlService;
    private final JwtUtils jwtUtils;

    // ── Inner request DTO ────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddUrlRequest {
        private String section;
        private String url;
        private String label;
    }

    // ── Handlers ─────────────────────────────────────────────────────────────

    /** POST /admin/meeting-urls */
    public Mono<ServerResponse> addMeetingUrl(ServerRequest request) {
        return jwtUtils.getUserIdFromServerRequest(request)
            .flatMap(adminId ->
                request.bodyToMono(AddUrlRequest.class)
                    .flatMap(req -> meetingUrlService.addOrUpdateUrl(
                        req.getSection(), req.getUrl(), req.getLabel(), adminId))
            )
            .flatMap(saved ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of(
                        "success", true,
                        "message", "Meeting URL saved for section: " + saved.getSection(),
                        "data", saved
                    ))
            )
            .onErrorResume(error -> {
                log.error("Error saving meeting URL: {}", error.getMessage());
                return ServerResponse.badRequest().bodyValue(Map.of(
                    "success", false,
                    "message", "Failed: " + error.getMessage()
                ));
            });
    }

    /** GET /admin/meeting-urls */
    public Mono<ServerResponse> getMeetingUrls(ServerRequest request) {
        return jwtUtils.getUserIdFromServerRequest(request)
            .flatMap(adminId -> meetingUrlService.getUrlsByAdmin(adminId).collectList())
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

    /** GET /students/meeting-url?section=VISA */
    public Mono<ServerResponse> getMeetingUrl(ServerRequest request) {
        String section = request.queryParam("section").orElse("VISA");
        return meetingUrlService.getActiveUrl(section)
            .flatMap(url ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(Map.of(
                        "success", true,
                        "data", url
                    ))
            )
            .switchIfEmpty(ServerResponse.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of(
                    "success", true,
                    "message", "No active URL set for section: " + section,
                    "data", Map.of()
                ))
            )
            .onErrorResume(error ->
                ServerResponse.badRequest().bodyValue(Map.of(
                    "success", false,
                    "message", error.getMessage()
                ))
            );
    }
}
