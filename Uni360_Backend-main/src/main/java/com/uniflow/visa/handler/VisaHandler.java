package com.uniflow.visa.handler;

import com.uniflow.auth.util.JwtUtils;
import com.uniflow.visa.dto.VisaDTO;
import com.uniflow.visa.service.VisaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * VisaHandler - Student-facing visa endpoints.
 *
 * Routes:
 *   GET  /api/v1/students/visa/checklist?country=UK   → get country checklist
 *   GET  /api/v1/students/visa/tracker?country=UK     → get visa progress tracker
 *   PUT  /api/v1/students/visa/tracker                → update tracker items / status
 *   GET  /api/v1/students/visa/appointments           → get student's own appointments
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class VisaHandler {

    private final VisaService visaService;
    private final JwtUtils jwtUtils;

    /** GET /students/visa/checklist?country=UK */
    public Mono<ServerResponse> getVisaChecklist(ServerRequest request) {
        String country = request.queryParam("country").orElse("UK");
        log.info("Student requesting visa checklist for country: {}", country);

        return visaService.getChecklistByCountry(country)
            .flatMap(checklist ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(VisaDTO.ApiResponse.builder()
                        .success(true)
                        .message("Visa checklist retrieved")
                        .data(checklist)
                        .build())
            )
            .switchIfEmpty(ServerResponse.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(VisaDTO.ApiResponse.builder()
                    .success(true)
                    .message("No checklist found for country: " + country)
                    .data(null)
                    .build()))
            .onErrorResume(error -> {
                log.error("Error getting visa checklist: {}", error.getMessage());
                return ServerResponse.badRequest().bodyValue(
                    VisaDTO.ApiResponse.builder()
                        .success(false)
                        .message("Failed to get checklist: " + error.getMessage())
                        .build());
            });
    }

    /** GET /students/visa/tracker?country=UK */
    public Mono<ServerResponse> getMyVisaTracker(ServerRequest request) {
        String country = request.queryParam("country").orElse("UK");

        return jwtUtils.getUserIdFromServerRequest(request)
            .flatMap(studentId -> visaService.getVisaProgress(studentId, country))
            .flatMap(progress ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(VisaDTO.ApiResponse.builder()
                        .success(true)
                        .message("Visa progress retrieved")
                        .data(progress)
                        .build())
            )
            .onErrorResume(error -> {
                log.error("Error getting visa tracker: {}", error.getMessage());
                return ServerResponse.badRequest().bodyValue(
                    VisaDTO.ApiResponse.builder()
                        .success(false)
                        .message("Failed to get visa tracker: " + error.getMessage())
                        .build());
            });
    }

    /** PUT /students/visa/tracker */
    public Mono<ServerResponse> updateTrackerItem(ServerRequest request) {
        return jwtUtils.getUserIdFromServerRequest(request)
            .flatMap(studentId ->
                request.bodyToMono(VisaDTO.UpdateTrackerRequest.class)
                    .flatMap(req -> visaService.updateTracker(
                        studentId,
                        req.getCountry() != null ? req.getCountry() : "UK",
                        req.getCompletedItems(),
                        req.getStatus(),
                        req.getNotes()
                    ))
            )
            .flatMap(updated ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(VisaDTO.ApiResponse.builder()
                        .success(true)
                        .message("Visa tracker updated")
                        .data(updated)
                        .build())
            )
            .onErrorResume(error -> {
                log.error("Error updating visa tracker: {}", error.getMessage());
                return ServerResponse.badRequest().bodyValue(
                    VisaDTO.ApiResponse.builder()
                        .success(false)
                        .message("Failed to update tracker: " + error.getMessage())
                        .build());
            });
    }

    /** GET /students/visa/appointments */
    public Mono<ServerResponse> getMyAppointments(ServerRequest request) {
        return jwtUtils.getUserIdFromServerRequest(request)
            .flatMapMany(studentId -> visaService.getMyAppointments(studentId))
            .collectList()
            .flatMap(appointments ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(VisaDTO.ApiResponse.builder()
                        .success(true)
                        .message("Appointments retrieved")
                        .data(appointments)
                        .build())
            )
            .onErrorResume(error -> {
                log.error("Error getting appointments: {}", error.getMessage());
                return ServerResponse.badRequest().bodyValue(
                    VisaDTO.ApiResponse.builder()
                        .success(false)
                        .message("Failed to get appointments: " + error.getMessage())
                        .build());
            });
    }
}
