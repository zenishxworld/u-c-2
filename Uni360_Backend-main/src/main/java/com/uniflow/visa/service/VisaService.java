package com.uniflow.visa.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uniflow.notification.model.NotificationType;
import com.uniflow.notification.repository.NotificationRepository;
import com.uniflow.notification.model.Notification;
import com.uniflow.visa.dto.VisaDTO;
import com.uniflow.visa.entity.EmbassyAppointment;
import com.uniflow.visa.entity.VisaChecklist;
import com.uniflow.visa.entity.VisaTracker;
import com.uniflow.visa.repository.EmbassyAppointmentRepository;
import com.uniflow.visa.repository.VisaChecklistRepository;
import com.uniflow.visa.repository.VisaTrackerRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * VisaService - Business logic for the visa module.
 *
 * <p>Handles:
 * - Country-level checklist management (admin)
 * - Per-student visa tracker (student)
 * - Embassy appointment scheduling (admin) with student notification
 * - Admin view of all appointments by status/country
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VisaService {

    private final VisaChecklistRepository visaChecklistRepository;
    private final VisaTrackerRepository visaTrackerRepository;
    private final EmbassyAppointmentRepository embassyAppointmentRepository;
    private final NotificationRepository notificationRepository;
    private final ObjectMapper objectMapper;

    // ── Checklist (Admin) ────────────────────────────────────────────────────

    /**
     * Admin saves or updates the visa checklist for a particular country.
     * Notifies all students who have a tracker for that country.
     */
    public Mono<VisaChecklist> saveOrUpdateChecklist(
        String country,
        String title,
        List<String> items,
        Long adminId
    ) {
        String itemsJson = toJson(items);
        log.info("Admin {} saving checklist for country: {}", adminId, country);
        return visaChecklistRepository
            .findByCountry(country.toUpperCase())
            .flatMap(existing -> {
                existing.setTitle(title);
                existing.setItems(itemsJson);
                existing.setAdminId(adminId);
                existing.setUpdatedAt(LocalDateTime.now());
                return visaChecklistRepository.save(existing);
            })
            .switchIfEmpty(
                Mono.defer(() -> {
                    VisaChecklist checklist = VisaChecklist.builder()
                        .country(country.toUpperCase())
                        .title(title)
                        .items(itemsJson)
                        .adminId(adminId)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                    return visaChecklistRepository.save(checklist);
                })
            )
            .doOnSuccess(saved ->
                notifyStudentsOfChecklistUpdate(country.toUpperCase(), title, adminId)
                    .subscribe()
            );
    }

    /** Get the checklist for a country. */
    public Mono<VisaChecklist> getChecklistByCountry(String country) {
        return visaChecklistRepository.findByCountry(country.toUpperCase());
    }

    // ── Visa Tracker (Student) ───────────────────────────────────────────────

    /**
     * Returns the student's visa tracker for a country.
     * Creates one if it doesn't exist yet.
     */
    public Mono<VisaTracker> getOrCreateTracker(Long studentId, String country) {
        return visaTrackerRepository
            .findByStudentIdAndCountry(studentId, country.toUpperCase())
            .switchIfEmpty(
                Mono.defer(() -> {
                    VisaTracker tracker = VisaTracker.builder()
                        .studentId(studentId)
                        .country(country.toUpperCase())
                        .status("NOT_STARTED")
                        .completedItems("[]")
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                    return visaTrackerRepository.save(tracker);
                })
            );
    }

    /**
     * Get all visa trackers for a student (one per country they applied to).
     */
    public Flux<VisaTracker> getStudentTrackers(Long studentId) {
        return visaTrackerRepository.findByStudentId(studentId);
    }

    /**
     * Build a full progress response combining tracker + checklist.
     */
    public Mono<VisaDTO.VisaProgressResponse> getVisaProgress(
        Long studentId,
        String country
    ) {
        return Mono.zip(
            getOrCreateTracker(studentId, country.toUpperCase()),
            getChecklistByCountry(country.toUpperCase())
                .defaultIfEmpty(new VisaChecklist())
        ).map(tuple -> {
            VisaTracker tracker = tuple.getT1();
            VisaChecklist checklist = tuple.getT2();
            List<String> checklistItems = fromJsonStrList(checklist.getItems());
            List<Integer> completedItems = fromJsonIntList(tracker.getCompletedItems());

            int total = checklistItems.size();
            int completed = completedItems.size();
            int percent = total == 0 ? 0 : (int) ((completed * 100.0) / total);

            return VisaDTO.VisaProgressResponse.builder()
                .trackerId(tracker.getId())
                .studentId(studentId)
                .country(tracker.getCountry())
                .status(tracker.getStatus())
                .totalItems(total)
                .completedCount(completed)
                .progressPercent(percent)
                .completedItems(completedItems)
                .checklistItems(checklistItems)
                .notes(tracker.getNotes())
                .updatedAt(tracker.getUpdatedAt())
                .build();
        });
    }

    /**
     * Student marks checklist items as completed / updates status.
     */
    public Mono<VisaTracker> updateTracker(
        Long studentId,
        String country,
        List<Integer> completedItems,
        String status,
        String notes
    ) {
        return getOrCreateTracker(studentId, country).flatMap(tracker -> {
            if (completedItems != null) {
                tracker.setCompletedItems(toJson(completedItems));
            }
            if (status != null && !status.isBlank()) {
                tracker.setStatus(status);
            }
            if (notes != null) {
                tracker.setNotes(notes);
            }
            tracker.setUpdatedAt(LocalDateTime.now());
            return visaTrackerRepository.save(tracker);
        });
    }

    // ── Embassy Appointments (Admin) ─────────────────────────────────────────

    /**
     * Admin creates an embassy appointment for a student.
     * Notifies the student immediately.
     */
    public Mono<EmbassyAppointment> createAppointment(
        Long studentId,
        String country,
        LocalDate date,
        LocalTime time,
        String location,
        String notes,
        Long adminId
    ) {
        EmbassyAppointment appt = EmbassyAppointment.builder()
            .studentId(studentId)
            .country(country.toUpperCase())
            .appointmentDate(date)
            .appointmentTime(time)
            .location(location)
            .notes(notes)
            .status("PENDING")
            .createdByAdmin(adminId)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        return embassyAppointmentRepository.save(appt)
            .doOnSuccess(saved ->
                notifyStudentOfAppointment(studentId, country, date, adminId)
                    .subscribe()
            );
    }

    /**
     * Admin updates appointment status (CONFIRMED / COMPLETED / CANCELLED).
     */
    public Mono<EmbassyAppointment> updateAppointmentStatus(
        UUID appointmentId,
        String status,
        String notes,
        Long adminId
    ) {
        return embassyAppointmentRepository.findById(appointmentId)
            .switchIfEmpty(Mono.error(new IllegalArgumentException(
                "Appointment not found: " + appointmentId)))
            .flatMap(appt -> {
                appt.setStatus(status.toUpperCase());
                if (notes != null) appt.setNotes(notes);
                appt.setUpdatedAt(LocalDateTime.now());
                return embassyAppointmentRepository.save(appt);
            })
            .doOnSuccess(appt ->
                notifyStudentOfStatusChange(appt.getStudentId(), status, adminId)
                    .subscribe()
            );
    }

    /** Get all appointments - for admin dashboard (optional filter by status), scoped to admin. */
    public Flux<EmbassyAppointment> getAllAppointments(Long adminId, String status) {
        if (status != null && !status.isBlank()) {
            return embassyAppointmentRepository.findByCreatedByAdminAndStatusOrderByDate(adminId, status.toUpperCase());
        }
        return embassyAppointmentRepository.findByCreatedByAdminOrderByAppointmentDateAsc(adminId);
    }

    /** Get all appointments for a specific student - for admin panel. */
    public Flux<EmbassyAppointment> getStudentAppointments(Long studentId) {
        return embassyAppointmentRepository.findByStudentId(studentId);
    }

    /** Get all embassy appointments for a logged-in student (JWT). */
    public Flux<EmbassyAppointment> getMyAppointments(Long studentId) {
        return embassyAppointmentRepository.findByStudentId(studentId);
    }

    // ── Internal Notifications ───────────────────────────────────────────────

    private Flux<Void> notifyStudentsOfChecklistUpdate(
        String country,
        String checklistTitle,
        Long adminId
    ) {
        // Find all students who have a tracker for this country and notify them
        return visaTrackerRepository
            .findAll()
            .filter(t -> country.equalsIgnoreCase(t.getCountry()))
            .flatMap(tracker ->
                buildNotification(
                    tracker.getStudentId(),
                    adminId,
                    "Visa Checklist Updated",
                    "The visa checklist for " + country + " has been updated: " + checklistTitle,
                    "VISA_CHECKLIST"
                )
                .flatMap(notificationRepository::save)
                .then()
            );
    }

    private Mono<Void> notifyStudentOfAppointment(
        Long studentId,
        String country,
        LocalDate appointmentDate,
        Long adminId
    ) {
        return buildNotification(
            studentId,
            adminId,
            "Embassy Appointment Scheduled",
            "Your " + country + " embassy appointment has been scheduled for " +
                appointmentDate,
            "EMBASSY_APPOINTMENT"
        )
        .flatMap(notificationRepository::save)
        .then();
    }

    private Mono<Void> notifyStudentOfStatusChange(
        Long studentId,
        String status,
        Long adminId
    ) {
        return buildNotification(
            studentId,
            adminId,
            "Appointment Status Updated",
            "Your embassy appointment status has been updated to: " + status,
            "EMBASSY_APPOINTMENT_STATUS"
        )
        .flatMap(notificationRepository::save)
        .then();
    }

    private Mono<Notification> buildNotification(
        Long recipientId,
        Long senderId,
        String title,
        String message,
        String contentTypeName
    ) {
        Notification n = Notification.NotificationBuilder
            .forUser(recipientId)
            .fromSender(senderId)
            .withType(NotificationType.GENERAL_INFO)
            .withTitle(title)
            .withMessage(message)
            .withContentType(com.uniflow.notification.model.ContentType.PLAIN)
            .withMetadata(objectMapper.createObjectNode())
            .build();
        return Mono.just(n);
    }

    // ── JSON helpers ─────────────────────────────────────────────────────────

    private <T> String toJson(T value) {
        try { return objectMapper.writeValueAsString(value); }
        catch (Exception e) { return "[]"; }
    }

    private List<String> fromJsonStrList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try { return objectMapper.readValue(json, new TypeReference<List<String>>() {}); }
        catch (Exception e) { return List.of(); }
    }

    private List<Integer> fromJsonIntList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try { return objectMapper.readValue(json, new TypeReference<List<Integer>>() {}); }
        catch (Exception e) { return List.of(); }
    }
}
