package com.uniflow.visa.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.uniflow.visa.entity.EmbassyAppointment;
import com.uniflow.visa.entity.VisaChecklist;
import com.uniflow.visa.entity.VisaTracker;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTOs for the Visa module.
 */
public class VisaDTO {

    // ── Admin Requests ──────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SaveChecklistRequest {
        private String country;   // UK | GERMANY
        private String title;
        private List<String> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateAppointmentRequest {
        @JsonProperty("student_id")
        @JsonAlias({"studentId", "student_id"})
        private Long studentId;
        private String country;
        @JsonProperty("appointment_date")
        @JsonAlias({"appointmentDate", "appointment_date"})
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate appointmentDate;
        @JsonProperty("appointment_time")
        @JsonAlias({"appointmentTime", "appointment_time"})
        @JsonFormat(pattern = "HH:mm[:ss]")
        private LocalTime appointmentTime;
        private String location;
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateAppointmentStatusRequest {
        private String status;   // PENDING | CONFIRMED | COMPLETED | CANCELLED
        private String notes;
    }

    // ── Student Requests ────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateTrackerRequest {
        private String country;
        @JsonProperty("completed_items")
        private List<Integer> completedItems;
        private String status;
        private String notes;
    }

    // ── Responses ───────────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChecklistResponse {
        private UUID id;
        private String country;
        private String title;
        private List<String> items;
        @JsonProperty("admin_id")
        private Long adminId;
        @JsonProperty("created_at")
        private LocalDateTime createdAt;
        @JsonProperty("updated_at")
        private LocalDateTime updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VisaProgressResponse {
        @JsonProperty("tracker_id")
        private UUID trackerId;
        @JsonProperty("student_id")
        private Long studentId;
        private String country;
        private String status;
        @JsonProperty("total_items")
        private int totalItems;
        @JsonProperty("completed_count")
        private int completedCount;
        @JsonProperty("progress_percent")
        private int progressPercent;
        @JsonProperty("completed_items")
        private List<Integer> completedItems;
        @JsonProperty("checklist_items")
        private List<String> checklistItems;
        private String notes;
        @JsonProperty("updated_at")
        private LocalDateTime updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AppointmentResponse {
        private UUID id;
        @JsonProperty("student_id")
        private Long studentId;
        private String country;
        @JsonProperty("appointment_date")
        private LocalDate appointmentDate;
        @JsonProperty("appointment_time")
        private LocalTime appointmentTime;
        private String location;
        private String status;
        private String notes;
        @JsonProperty("created_by_admin")
        private Long createdByAdmin;
        @JsonProperty("created_at")
        private LocalDateTime createdAt;
        @JsonProperty("updated_at")
        private LocalDateTime updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApiResponse {
        private boolean success;
        private String message;
        private Object data;
    }
}
