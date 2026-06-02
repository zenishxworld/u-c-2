package com.uniflow.visa.handler;

import com.uniflow.auth.util.JwtUtils;
import com.uniflow.visa.dto.VisaDTO;
import com.uniflow.visa.service.VisaService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;

/**
 * AdminVisaHandler - Admin-facing visa endpoints.
 *
 * Routes:
 *   POST /api/v1/admin/visa/checklist                          → save/update checklist
 *   GET  /api/v1/admin/visa/checklist?country=UK               → get checklist
 *   POST /api/v1/admin/visa/appointments                       → create appointment for student
 *   PUT  /api/v1/admin/visa/appointments/{id}/status           → update appointment status
 *   GET  /api/v1/admin/visa/appointments?status=PENDING        → list all appointments (optional filter)
 *   GET  /api/v1/admin/visa/appointments/student/{studentId}   → list appointments for a specific student
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminVisaHandler {

    private final VisaService visaService;
    private final JwtUtils jwtUtils;

    /** POST/PUT /admin/visa/checklist */
    public Mono<ServerResponse> saveChecklist(ServerRequest request) {
        return jwtUtils.getUserIdFromServerRequest(request)
            .flatMap(adminId ->
                request.bodyToMono(VisaDTO.SaveChecklistRequest.class)
                    .flatMap(req -> visaService.saveOrUpdateChecklist(
                        req.getCountry(),
                        req.getTitle(),
                        req.getItems(),
                        adminId
                    ))
            )
            .flatMap(saved ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(VisaDTO.ApiResponse.builder()
                        .success(true)
                        .message("Visa checklist saved successfully")
                        .data(saved)
                        .build())
            )
            .onErrorResume(error -> {
                log.error("Error saving visa checklist: {}", error.getMessage());
                return ServerResponse.badRequest().bodyValue(
                    VisaDTO.ApiResponse.builder()
                        .success(false)
                        .message("Failed to save checklist: " + error.getMessage())
                        .build());
            });
    }

    /** GET /admin/visa/checklist?country=UK */
    public Mono<ServerResponse> getChecklist(ServerRequest request) {
        String country = request.queryParam("country").orElse("UK");
        return visaService.getChecklistByCountry(country)
            .flatMap(checklist ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(VisaDTO.ApiResponse.builder()
                        .success(true)
                        .message("Checklist retrieved")
                        .data(checklist)
                        .build())
            )
            .switchIfEmpty(ServerResponse.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(VisaDTO.ApiResponse.builder()
                    .success(true)
                    .message("No checklist configured for: " + country)
                    .data(null)
                    .build()))
            .onErrorResume(error ->
                ServerResponse.badRequest().bodyValue(
                    VisaDTO.ApiResponse.builder()
                        .success(false)
                        .message("Error: " + error.getMessage())
                        .build()));
    }

    /** POST /admin/visa/appointments */
    public Mono<ServerResponse> createAppointment(ServerRequest request) {
        return jwtUtils.getUserIdFromServerRequest(request)
            .flatMap(adminId ->
                request.bodyToMono(VisaDTO.CreateAppointmentRequest.class)
                    .flatMap(req -> visaService.createAppointment(
                        req.getStudentId(),
                        req.getCountry(),
                        req.getAppointmentDate(),
                        req.getAppointmentTime(),
                        req.getLocation(),
                        req.getNotes(),
                        adminId
                    ))
            )
            .flatMap(appt ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(VisaDTO.ApiResponse.builder()
                        .success(true)
                        .message("Embassy appointment created")
                        .data(appt)
                        .build())
            )
            .onErrorResume(error -> {
                log.error("Error creating appointment: {}", error.getMessage());
                return ServerResponse.badRequest().bodyValue(
                    VisaDTO.ApiResponse.builder()
                        .success(false)
                        .message("Failed to create appointment: " + error.getMessage())
                        .build());
            });
    }

    /** PUT /admin/visa/appointments/{id}/status */
    public Mono<ServerResponse> updateAppointmentStatus(ServerRequest request) {
        UUID appointmentId = UUID.fromString(request.pathVariable("id"));
        return jwtUtils.getUserIdFromServerRequest(request)
            .flatMap(adminId ->
                request.bodyToMono(VisaDTO.UpdateAppointmentStatusRequest.class)
                    .flatMap(req -> visaService.updateAppointmentStatus(
                        appointmentId,
                        req.getStatus(),
                        req.getNotes(),
                        adminId
                    ))
            )
            .flatMap(updated ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(VisaDTO.ApiResponse.builder()
                        .success(true)
                        .message("Appointment status updated")
                        .data(updated)
                        .build())
            )
            .onErrorResume(error -> {
                log.error("Error updating appointment status: {}", error.getMessage());
                return ServerResponse.badRequest().bodyValue(
                    VisaDTO.ApiResponse.builder()
                        .success(false)
                        .message("Failed to update: " + error.getMessage())
                        .build());
            });
    }

    /** GET /admin/visa/appointments?status=PENDING */
    public Mono<ServerResponse> getAllAppointments(ServerRequest request) {
        String status = request.queryParam("status").orElse(null);
        return jwtUtils.getUserIdFromServerRequest(request)
            .flatMap(adminId -> visaService.getAllAppointments(adminId, status).collectList())
            .flatMap(list ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(VisaDTO.ApiResponse.builder()
                        .success(true)
                        .message("Appointments retrieved")
                        .data(list)
                        .build())
            )
            .onErrorResume(error ->
                ServerResponse.badRequest().bodyValue(
                    VisaDTO.ApiResponse.builder()
                        .success(false)
                        .message("Error: " + error.getMessage())
                        .build()));
    }

    /** GET /admin/visa/appointments/student/{studentId} */
    public Mono<ServerResponse> getAppointmentsForStudent(ServerRequest request) {
        Long studentId = Long.parseLong(request.pathVariable("studentId"));
        return visaService.getStudentAppointments(studentId)
            .collectList()
            .flatMap(list ->
                ServerResponse.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(VisaDTO.ApiResponse.builder()
                        .success(true)
                        .message("Student appointments retrieved")
                        .data(list)
                        .build())
            )
            .onErrorResume(error ->
                ServerResponse.badRequest().bodyValue(
                    VisaDTO.ApiResponse.builder()
                        .success(false)
                        .message("Error: " + error.getMessage())
                        .build()));
    }
}
