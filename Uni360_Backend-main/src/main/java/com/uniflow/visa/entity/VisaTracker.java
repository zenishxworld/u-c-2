package com.uniflow.visa.entity;

import java.time.LocalDateTime;
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
 * VisaTracker entity - per-student visa progress tracker.
 * Tracks which checklist items a student has completed
 * and the overall visa application status.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("visa_trackers")
public class VisaTracker {

    @Id
    @Column("id")
    private UUID id;

    @Column("student_id")
    private Long studentId;

    /** Target country - UK or GERMANY */
    @Column("country")
    private String country;

    /**
     * Overall visa status.
     * Values: NOT_STARTED, IN_PROGRESS, SUBMITTED, APPROVED, REJECTED
     */
    @Column("status")
    @Builder.Default
    private String status = "NOT_STARTED";

    /**
     * JSON array string of completed checklist item indices (e.g. "[0,1,3]").
     * R2DBC stores as TEXT; service layer handles Jackson serialization.
     */
    @Column("completed_items")
    private String completedItems;

    @Column("notes")
    private String notes;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
