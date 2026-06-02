package com.uniflow.support.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.function.Predicate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Support Ticket entity for the comprehensive support system.
 * Handles ticket creation, assignment, escalation, and resolution tracking.
 */
@Table("support_tickets")
public class SupportTicket {

    @Id
    private UUID id;

    @Column("ticket_number")
    private String ticketNumber;

    @Column("student_id")
    private Long studentId;

    @Column("application_id")
    private UUID applicationId;

    @Column("assigned_admin_id")
    private Long assignedAdminId;

    @Column("ticket_type")
    private String ticketType;

    @Column("priority")
    private TicketPriority priority;

    @Column("status")
    private TicketStatus status;

    @Column("subject")
    private String subject;

    @Column("description")
    private String description;

    @Column("resolution")
    private String resolution;

    @Column("escalated")
    private Boolean escalated;

    @Column("escalated_to")
    private Long escalatedTo;

    @Column("escalated_at")
    private LocalDateTime escalatedAt;

    @Column("resolved_at")
    private LocalDateTime resolvedAt;

    @Column("resolved_by")
    private Long resolvedBy;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;

    // Functional predicates for business logic
    @JsonIgnore
    public static final Predicate<SupportTicket> IS_OPEN = ticket ->
        ticket != null && ticket.getStatus() == TicketStatus.OPEN;

    @JsonIgnore
    public static final Predicate<SupportTicket> IS_ESCALATED = ticket ->
        ticket != null && Boolean.TRUE.equals(ticket.getEscalated());

    @JsonIgnore
    public static final Predicate<SupportTicket> IS_HIGH_PRIORITY = ticket ->
        ticket != null && ticket.getPriority() == TicketPriority.HIGH;

    @JsonIgnore
    public static final Predicate<SupportTicket> IS_ASSIGNED = ticket ->
        ticket != null && ticket.getAssignedAdminId() != null;

    // Default constructor
    public SupportTicket() {
        this.priority = TicketPriority.MEDIUM;
        this.status = TicketStatus.OPEN;
        this.escalated = false;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Business methods
    public SupportTicket assignToAdmin(Long adminId) {
        this.assignedAdminId = adminId;
        this.status = TicketStatus.IN_PROGRESS;
        this.updatedAt = LocalDateTime.now();
        return this;
    }

    public SupportTicket escalateToAdmin(Long escalationAdminId) {
        this.escalated = true;
        this.escalatedTo = escalationAdminId;
        this.escalatedAt = LocalDateTime.now();
        this.priority = TicketPriority.HIGH;
        this.updatedAt = LocalDateTime.now();
        return this;
    }

    public SupportTicket resolve(Long resolvedByAdminId, String resolutionText) {
        this.status = TicketStatus.RESOLVED;
        this.resolvedBy = resolvedByAdminId;
        this.resolvedAt = LocalDateTime.now();
        this.resolution = resolutionText;
        this.updatedAt = LocalDateTime.now();
        return this;
    }

    public SupportTicket close() {
        this.status = TicketStatus.CLOSED;
        this.updatedAt = LocalDateTime.now();
        return this;
    }

    public SupportTicket reopen() {
        if (this.status == TicketStatus.CLOSED || this.status == TicketStatus.RESOLVED) {
            this.status = this.assignedAdminId != null ? TicketStatus.IN_PROGRESS : TicketStatus.OPEN;
            this.resolvedAt = null;
            this.updatedAt = LocalDateTime.now();
        }
        return this;
    }

    // Domain validation
    public boolean belongsToStudent(Long studentId) {
        return studentId != null && studentId.equals(this.studentId);
    }

    public boolean isAssignedToAdmin(Long adminId) {
        return adminId != null && adminId.equals(this.assignedAdminId);
    }

    public boolean canBeEscalated() {
        return this.status != TicketStatus.CLOSED &&
               this.status != TicketStatus.RESOLVED &&
               !Boolean.TRUE.equals(this.escalated);
    }

    public boolean canBeResolved() {
        return this.status == TicketStatus.IN_PROGRESS ||
               this.status == TicketStatus.OPEN;
    }

    // Builder pattern for fluent construction
    public static class SupportTicketBuilder {

        private final SupportTicket ticket = new SupportTicket();

        public static SupportTicketBuilder forStudent(Long studentId) {
            SupportTicketBuilder builder = new SupportTicketBuilder();
            builder.ticket.studentId = studentId;
            return builder;
        }

        public SupportTicketBuilder withTicketNumber(String ticketNumber) {
            this.ticket.ticketNumber = ticketNumber;
            return this;
        }

        public SupportTicketBuilder withApplication(UUID applicationId) {
            this.ticket.applicationId = applicationId;
            return this;
        }

        public SupportTicketBuilder withType(String ticketType) {
            this.ticket.ticketType = ticketType;
            return this;
        }

        public SupportTicketBuilder withPriority(TicketPriority priority) {
            this.ticket.priority = priority;
            return this;
        }

        public SupportTicketBuilder withSubject(String subject) {
            this.ticket.subject = subject;
            return this;
        }

        public SupportTicketBuilder withDescription(String description) {
            this.ticket.description = description;
            return this;
        }

        public SupportTicketBuilder assignedTo(Long adminId) {
            this.ticket.assignedAdminId = adminId;
            this.ticket.status = TicketStatus.IN_PROGRESS;
            return this;
        }

        public SupportTicket build() {
            return this.ticket;
        }
    }

    // Enums for ticket properties
    public enum TicketStatus {
        OPEN, IN_PROGRESS, RESOLVED, CLOSED, PENDING_STUDENT
    }

    public enum TicketPriority {
        LOW, MEDIUM, HIGH, URGENT
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTicketNumber() {
        return ticketNumber;
    }

    public void setTicketNumber(String ticketNumber) {
        this.ticketNumber = ticketNumber;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public UUID getApplicationId() {
        return applicationId;
    }

    public void setApplicationId(UUID applicationId) {
        this.applicationId = applicationId;
    }

    public Long getAssignedAdminId() {
        return assignedAdminId;
    }

    public void setAssignedAdminId(Long assignedAdminId) {
        this.assignedAdminId = assignedAdminId;
    }

    public String getTicketType() {
        return ticketType;
    }

    public void setTicketType(String ticketType) {
        this.ticketType = ticketType;
    }

    public TicketPriority getPriority() {
        return priority;
    }

    public void setPriority(TicketPriority priority) {
        this.priority = priority;
    }

    public TicketStatus getStatus() {
        return status;
    }

    public void setStatus(TicketStatus status) {
        this.status = status;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getResolution() {
        return resolution;
    }

    public void setResolution(String resolution) {
        this.resolution = resolution;
    }

    public Boolean getEscalated() {
        return escalated;
    }

    public void setEscalated(Boolean escalated) {
        this.escalated = escalated;
    }

    public Long getEscalatedTo() {
        return escalatedTo;
    }

    public void setEscalatedTo(Long escalatedTo) {
        this.escalatedTo = escalatedTo;
    }

    public LocalDateTime getEscalatedAt() {
        return escalatedAt;
    }

    public void setEscalatedAt(LocalDateTime escalatedAt) {
        this.escalatedAt = escalatedAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public Long getResolvedBy() {
        return resolvedBy;
    }

    public void setResolvedBy(Long resolvedBy) {
        this.resolvedBy = resolvedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public String toString() {
        return "SupportTicket{" +
                "id=" + id +
                ", ticketNumber='" + ticketNumber + '\'' +
                ", studentId=" + studentId +
                ", status=" + status +
                ", priority=" + priority +
                ", subject='" + subject + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}
