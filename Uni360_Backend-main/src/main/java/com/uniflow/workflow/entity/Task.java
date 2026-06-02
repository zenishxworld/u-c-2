package com.uniflow.workflow.entity;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Task entity for PHASE 21-22 minimalist workflow system
 *
 * This entity represents workflow tasks with only essential fields
 * for multi-owner task creation and state machine functionality.
 * Matches the actual database schema exactly.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table("tasks")
public class Task {

    @Id
    private Long id;

    @NotNull
    @Column("task_id")
    private String taskId;

    @NotNull
    @Column("application_id")
    private String applicationId;

    @Column("workflow_instance_id")
    private String workflowInstanceId;

    @Column("task_type")
    private String taskType;

    @NotNull
    @Column("task_status")
    private String taskStatus;

    @Column("priority")
    @Builder.Default
    private Integer priority = 3;

    @Column("due_date")
    private Long dueDate;

    @Column("owner_id")
    private Long ownerId;

    @Column("stage")
    private String stage;

    @Column("validation_rule")
    private String validationRule;

    @Column("active")
    @Builder.Default
    private Boolean active = true;

    @Column("claimed_by")
    private Long claimedBy;

    @Column("claimed_at")
    private Long claimedAt;

    @Column("completed_at")
    private Long completedAt;

    @NotNull
    @Column("created_at")
    private Long createdAt;

    @NotNull
    @Column("updated_at")
    private Long updatedAt;

    @Column("deleted")
    @Builder.Default
    private Boolean deleted = false;

    // Business logic methods
    public boolean isClaimableBy(Long adminId) {
        return (
            this.ownerId.equals(adminId) &&
            "CREATED".equals(this.taskStatus) &&
            Boolean.TRUE.equals(this.active) &&
            "APPLICATION_CLAIM".equals(this.taskType)
        );
    }

    public boolean canBeCompletedBy(Long adminId) {
        return (
            this.ownerId.equals(adminId) &&
            ("CLAIMED".equals(this.taskStatus) ||
                "CREATED".equals(this.taskStatus)) &&
            Boolean.TRUE.equals(this.active)
        );
    }

    public Task claim(Long adminId) {
        if (!isClaimableBy(adminId)) {
            throw new IllegalStateException(
                "Task cannot be claimed by admin: " + adminId
            );
        }
        this.taskStatus = "CLAIMED";
        this.claimedBy = adminId;
        this.claimedAt = System.currentTimeMillis();
        this.updatedAt = System.currentTimeMillis();

        // For APPLICATION_CLAIM tasks, claiming completes the task
        if ("APPLICATION_CLAIM".equals(this.taskType)) {
            this.active = false;
        }

        return this;
    }

    public Task complete(String completionNotes) {
        if (!"CLAIMED".equals(this.taskStatus)) {
            throw new IllegalStateException(
                "Only claimed tasks can be completed"
            );
        }
        this.taskStatus = "COMPLETED";
        this.active = false;
        this.completedAt = System.currentTimeMillis();
        this.updatedAt = System.currentTimeMillis();
        return this;
    }

    public boolean isActive() {
        return (
            Boolean.TRUE.equals(this.active) &&
            Boolean.FALSE.equals(this.deleted)
        );
    }

    public boolean isCompleted() {
        return "COMPLETED".equals(this.taskStatus);
    }

    public boolean isClaimed() {
        return "CLAIMED".equals(this.taskStatus) && this.claimedBy != null;
    }

    public void deactivate() {
        this.active = false;
        this.updatedAt = System.currentTimeMillis();
    }

    // Factory method for creating tasks for specific owners
    public static Task createForOwner(
        String applicationId,
        String workflowInstanceId,
        String taskType,
        String stage,
        Long ownerId,
        String validationRule,
        Integer priority
    ) {
        long now = System.currentTimeMillis();
        return Task.builder()
            .taskId(java.util.UUID.randomUUID().toString())
            .applicationId(applicationId)
            .workflowInstanceId(workflowInstanceId)
            .taskType(taskType)
            .taskStatus("CREATED")
            .stage(stage)
            .ownerId(ownerId)
            .validationRule(validationRule)
            .priority(priority != null ? priority : 3)
            .dueDate(now + (24 * 60 * 60 * 1000L)) // 24 hours from now
            .active(true)
            .createdAt(now)
            .updatedAt(now)
            .deleted(false)
            .build();
    }

    // Helper methods for conversions
    public LocalDateTime getCreatedAtAsDateTime() {
        return LocalDateTime.ofInstant(
            java.time.Instant.ofEpochMilli(this.createdAt),
            java.time.ZoneOffset.UTC
        );
    }

    public LocalDateTime getUpdatedAtAsDateTime() {
        return LocalDateTime.ofInstant(
            java.time.Instant.ofEpochMilli(this.updatedAt),
            java.time.ZoneOffset.UTC
        );
    }

    public LocalDateTime getDueDateAsDateTime() {
        return this.dueDate != null
            ? LocalDateTime.ofInstant(
                java.time.Instant.ofEpochMilli(this.dueDate),
                java.time.ZoneOffset.UTC
            )
            : null;
    }

    public LocalDateTime getClaimedAtAsDateTime() {
        return this.claimedAt != null
            ? LocalDateTime.ofInstant(
                java.time.Instant.ofEpochMilli(this.claimedAt),
                java.time.ZoneOffset.UTC
            )
            : null;
    }

    public LocalDateTime getCompletedAtAsDateTime() {
        return this.completedAt != null
            ? LocalDateTime.ofInstant(
                java.time.Instant.ofEpochMilli(this.completedAt),
                java.time.ZoneOffset.UTC
            )
            : null;
    }

    // Minimal compatibility methods for existing code
    public String getStatus() {
        return this.taskStatus;
    }

    public String getCountryCode() {
        return null; // Not stored in simplified schema
    }

    public String getAssignee() {
        return this.ownerId != null ? this.ownerId.toString() : null;
    }

    public void setCandidateUsers(String candidateUsers) {
        // No-op for simplified schema
    }

    public void setCandidateGroups(String candidateGroups) {
        // No-op for simplified schema
    }

    public void setTags(String tags) {
        // No-op for simplified schema
    }

    public void setUpdatedAt(LocalDateTime localDateTime) {
        this.updatedAt = localDateTime != null
            ? localDateTime
                .atZone(java.time.ZoneOffset.UTC)
                .toInstant()
                .toEpochMilli()
            : System.currentTimeMillis();
    }

    public void setClaimedAt(LocalDateTime localDateTime) {
        this.claimedAt = localDateTime != null
            ? localDateTime
                .atZone(java.time.ZoneOffset.UTC)
                .toInstant()
                .toEpochMilli()
            : System.currentTimeMillis();
    }

    public void setCompletedAt(LocalDateTime localDateTime) {
        this.completedAt = localDateTime != null
            ? localDateTime
                .atZone(java.time.ZoneOffset.UTC)
                .toInstant()
                .toEpochMilli()
            : System.currentTimeMillis();
    }

    public void complete(Long adminId, Object completionData) {
        if (!canBeCompletedBy(adminId)) {
            throw new IllegalStateException(
                "Task cannot be completed by admin: " + adminId
            );
        }
        this.taskStatus = "COMPLETED";
        this.active = false;
        this.completedAt = System.currentTimeMillis();
        this.updatedAt = System.currentTimeMillis();
    }
}
