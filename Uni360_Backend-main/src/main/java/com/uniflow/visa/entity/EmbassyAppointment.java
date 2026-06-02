package com.uniflow.visa.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * EmbassyAppointment entity - admin-created appointments assigned to a student.
 * Tracks embassy visit scheduling and status updates.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("embassy_appointments")
public class EmbassyAppointment {

    @Id
    @Column("id")
    private UUID id;

    @Column("student_id")
    private Long studentId;

    /** Target country - UK or GERMANY */
    @Column("country")
    private String country;

    @Column("appointment_date")
    private LocalDate appointmentDate;

    @Column("appointment_time")
    private LocalTime appointmentTime;

    @Column("location")
    private String location;

    /**
     * Appointment status.
     * Values: PENDING, CONFIRMED, COMPLETED, CANCELLED
     */
    @Column("status")
    @Builder.Default
    private String status = "PENDING";

    @Column("notes")
    private String notes;

    /** Admin who created/managed this appointment */
    @Column("created_by_admin")
    private Long createdByAdmin;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
